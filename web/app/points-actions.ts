"use server";

import { refresh } from "next/cache";
import QRCode from "qrcode";
import {
  checkinUrl,
  codeIsValid,
  currentCode,
  isOpen,
  newSecret,
  SAMPLE_ID,
  SAMPLE_SECRET,
} from "@/lib/checkin";
import { getGoogleEvents } from "@/lib/gcal";
import { isCategory, requirement, type Category } from "@/lib/points";
import { getTotal } from "@/lib/points-data";
import { UUID } from "@/lib/posts";
import { quarterOf } from "@/lib/quarters";
import { sampleAttendees, sampleStandings, SAMPLE_EVENT } from "@/lib/sample-points";
import { parseScan } from "@/lib/scan";
import { db } from "@/lib/supabase";
import { clockTime } from "@/lib/time";
import { canRunCheckins, getViewer, type Viewer } from "@/lib/viewer";

type Fail = { ok: false; error: string };
const fail = (error: string): Fail => ({ ok: false, error });

export type CheckInResult =
  | { ok: true; already: boolean; title: string; category: Category; points: number; total: number | null }
  | Fail;

type CheckinRow = {
  id: string;
  title: string;
  category: Category;
  points: number;
  quarter: string;
  starts_at: string;
  ends_at: string;
  secret: string;
  created_by: string | null;
};

const CHECKIN_COLUMNS = "id, title, category, points, quarter, starts_at, ends_at, secret, created_by";

// ---------------------------------------------------------------------------
// Checking in (everyone)

/** A brother scanned a check-in QR code or typed its 6 digits. */
export async function checkIn(scanned: string): Promise<CheckInResult> {
  const viewer = await getViewer();
  if (!viewer) return fail("Sign in first.");
  const scan = parseScan(String(scanned ?? ""));
  if (!scan) return fail("That isn't a KTP check-in code.");
  const now = Date.now();

  if (viewer.role === "guest") {
    if (scan.id && scan.id !== SAMPLE_ID) {
      return fail("Real check-ins are for chapter members. As a guest, try the sample check-in below.");
    }
    if (!codeIsValid(SAMPLE_SECRET, scan.code, now)) {
      return fail(scan.id ? "That code just changed. Scan the one on the screen now." : "That code doesn't match the sample. Check the 6 digits.");
    }
    return guestCheckIn(viewer);
  }
  if (!viewer.memberId) return fail("Only chapter members can check in.");
  if (scan.id === SAMPLE_ID) return fail("That's the sample code for guests. Scan the code at your event.");

  // The check-in in the link, or for typed digits, whichever open one they match.
  const nowIso = new Date(now).toISOString();
  const query = db().from("checkins").select(CHECKIN_COLUMNS);
  const { data, error } = await (scan.id
    ? query.eq("id", scan.id)
    : query.lte("starts_at", nowIso).gt("ends_at", nowIso)
  ).limit(20);
  if (error) {
    console.error("checkIn lookup failed:", error.message);
    return fail("The check-in couldn't be saved. Try again.");
  }
  const candidates = (data ?? []) as CheckinRow[];
  const checkin = candidates.find((c) => isOpen(c, now) && codeIsValid(c.secret, scan.code, now));
  if (!checkin) {
    const c = candidates[0];
    if (scan.id && !c) return fail("That check-in doesn't exist anymore.");
    if (scan.id && now >= Date.parse(c.ends_at)) {
      return fail(`Check-in for ${c.title} closed at ${clockTime(new Date(c.ends_at))}.`);
    }
    if (scan.id) return fail("That code just changed. Scan the one on the screen now.");
    if (candidates.length === 0) return fail("No check-in is open right now.");
    return fail("That code doesn't match. Check the 6 digits on the screen: they change every 30 seconds.");
  }

  const { error: insertError } = await db().from("points").insert({
    member_id: viewer.memberId,
    quarter: checkin.quarter,
    category: checkin.category,
    points: checkin.points,
    note: checkin.title,
    checkin_id: checkin.id,
  });
  const already = insertError?.code === "23505"; // they checked in to this one before
  if (insertError && !already) {
    console.error("checkIn insert failed:", insertError.message);
    return fail("The check-in couldn't be saved. Try again.");
  }
  if (!already) refresh();
  return {
    ok: true,
    already,
    title: checkin.title,
    category: checkin.category,
    points: checkin.points,
    total: await getTotal(viewer.memberId, checkin.quarter),
  };
}

async function guestCheckIn(viewer: Viewer): Promise<CheckInResult> {
  const { error } = await db().from("guest_checkins").insert({ user_id: viewer.userId });
  const already = error?.code === "23505";
  if (error && !already) {
    console.error("guestCheckIn failed:", error.message);
    return fail("The check-in couldn't be saved. Try again.");
  }
  if (!already) refresh();
  return {
    ok: true,
    already,
    title: SAMPLE_EVENT.title,
    category: SAMPLE_EVENT.category,
    points: SAMPLE_EVENT.points,
    total: sampleStandings(true, null).mine!.total,
  };
}

/** Guests: check in to the sample meeting without a second screen to scan. */
export async function sampleCheckIn(): Promise<CheckInResult> {
  const viewer = await getViewer();
  if (!viewer || viewer.role !== "guest") return fail("The sample check-in is for guests.");
  return guestCheckIn(viewer);
}

/** Guests: undo the sample check-in, to try it again. */
export async function resetSampleCheckIn(): Promise<{ ok: boolean }> {
  const viewer = await getViewer();
  if (!viewer || viewer.role !== "guest") return { ok: false };
  const { error } = await db().from("guest_checkins").delete().eq("user_id", viewer.userId);
  if (error) console.error("resetSampleCheckIn failed:", error.message);
  refresh();
  return { ok: !error };
}

// ---------------------------------------------------------------------------
// Running a check-in (board and committee leads)

export type StartInput = {
  eventKey?: string; // a Google Calendar event happening today
  title?: string; // or something else, open for `minutes`
  minutes?: number;
  category: string;
  points: number;
};

export async function startCheckin(input: StartInput): Promise<{ ok: true; id: string } | Fail> {
  const viewer = await getViewer();
  if (!viewer || !canRunCheckins(viewer) || !viewer.memberId) {
    return fail("Only the board and committee leads can run check-ins.");
  }
  const category = viewer.role === "lead" ? "committee" : input?.category;
  if (!isCategory(category) || category === "dues") return fail("Pick what kind of event this is.");
  const points = Number(input?.points);
  if (!Number.isInteger(points) || points < 1 || points > 30) return fail("Points should be a whole number from 1 to 30.");

  const now = Date.now();
  let title: string;
  let endsAt: number;
  let eventKey: string | null = null;
  if (input?.eventKey) {
    const event = (await getGoogleEvents()).find((e) => e.key === input.eventKey);
    if (!event || !event.end) return fail("That event isn't on the calendar anymore.");
    endsAt = Date.parse(event.end);
    if (endsAt <= now) return fail(`${event.title} is already over.`);
    if (endsAt - now > 12 * 60 * 60 * 1000) return fail("That event is too far off. Start its check-in on the day.");
    title = event.title.slice(0, 120);
    eventKey = event.key;
  } else {
    title = String(input?.title ?? "").trim();
    if (!title) return fail("Add a name for the event.");
    if (title.length > 120) return fail("Keep the name under 120 characters.");
    const minutes = Number(input?.minutes);
    if (!Number.isInteger(minutes) || minutes < 10 || minutes > 360) return fail("Pick how long check-in stays open.");
    endsAt = now + minutes * 60_000;
  }

  // If this event's check-in is already open (say, another board member
  // started it), show that one instead of making a second.
  if (eventKey) {
    const { data: open } = await db()
      .from("checkins")
      .select("id")
      .eq("event_key", eventKey)
      .gt("ends_at", new Date(now).toISOString())
      .limit(1)
      .maybeSingle();
    if (open) return { ok: true, id: open.id as string };
  }

  const { data, error } = await db()
    .from("checkins")
    .insert({
      title,
      category,
      points,
      quarter: quarterOf(new Date(now)),
      event_key: eventKey,
      starts_at: new Date(now).toISOString(),
      ends_at: new Date(endsAt).toISOString(),
      secret: newSecret(),
      created_by: viewer.memberId,
    })
    .select("id")
    .single();
  if (error || !data) {
    console.error("startCheckin failed:", error?.message);
    return fail("The check-in couldn't be started. Try again.");
  }
  refresh();
  return { ok: true, id: data.id as string };
}

async function loadCheckin(id: string): Promise<CheckinRow | null> {
  if (!UUID.test(id)) return null;
  const { data, error } = await db().from("checkins").select(CHECKIN_COLUMNS).eq("id", id).maybeSingle();
  if (error) console.error("Loading a check-in failed:", error.message);
  return (data as CheckinRow | null) ?? null;
}

const mayShow = (viewer: Viewer, c: CheckinRow) =>
  viewer.role === "board" || (viewer.role === "lead" && c.created_by === viewer.memberId);

export type Attendee = { id: string; name: string; imageUrl: string | null; at: string };

export type CheckinStatus =
  | {
      ok: true;
      open: boolean;
      endsAt: string;
      code: string | null; // the 6 digits, while open
      qr: string | null; // the QR code as an SVG, while open
      msLeft: number; // until the code changes
      attendees: Attendee[];
    }
  | Fail;

async function qrSvg(text: string) {
  // Black on white, whatever the theme, so every camera can read it.
  return QRCode.toString(text, {
    type: "svg",
    margin: 0,
    errorCorrectionLevel: "M",
    color: { dark: "#000000", light: "#ffffff" },
  });
}

/** The check-in screen: the current code, and who's checked in so far. */
export async function checkinStatus(id: string): Promise<CheckinStatus> {
  const viewer = await getViewer();
  if (!viewer) return fail("Sign in first.");
  const now = Date.now();

  if (id === SAMPLE_ID) {
    const { code, msLeft } = currentCode(SAMPLE_SECRET, now);
    const attendees = sampleAttendees(now);
    if (viewer.role === "guest") {
      const { data } = await db().from("guest_checkins").select("created_at").eq("user_id", viewer.userId).maybeSingle();
      if (data) attendees.unshift({ id: "you", name: "You", imageUrl: null, at: data.created_at as string });
    }
    return {
      ok: true,
      open: true,
      endsAt: new Date(now + 60 * 60_000).toISOString(),
      code,
      qr: await qrSvg(checkinUrl(SAMPLE_ID, code)),
      msLeft,
      attendees,
    };
  }

  const c = await loadCheckin(id);
  if (!c || !mayShow(viewer, c)) return fail("That check-in doesn't exist, or it isn't yours to show.");
  const open = isOpen(c, now);
  const { code, msLeft } = currentCode(c.secret, now);

  const { data, error } = await db()
    .from("points")
    .select("id, created_at, members!points_member_id_fkey(name, image_url)")
    .eq("checkin_id", c.id)
    .order("created_at", { ascending: false });
  if (error) console.error("Loading attendees failed:", error.message);
  const attendees = (data ?? []).map((r) => {
    const m = r.members as unknown as { name: string; image_url: string | null } | null;
    return { id: r.id as string, name: m?.name ?? "Someone", imageUrl: m?.image_url ?? null, at: r.created_at as string };
  });

  return {
    ok: true,
    open,
    endsAt: c.ends_at,
    code: open ? code : null,
    qr: open ? await qrSvg(checkinUrl(c.id, code)) : null,
    msLeft: open ? msLeft : 0,
    attendees,
  };
}

/** Closes a check-in early. The code stops working right away. */
export async function endCheckin(id: string): Promise<{ ok: true } | Fail> {
  const viewer = await getViewer();
  if (!viewer) return fail("Sign in first.");
  const c = await loadCheckin(id);
  if (!c || !mayShow(viewer, c)) return fail("Only the board or whoever started it can end this check-in.");
  const end = Math.max(Date.now(), Date.parse(c.starts_at) + 1000);
  const { error } = await db()
    .from("checkins")
    .update({ ends_at: new Date(Math.min(end, Date.parse(c.ends_at))).toISOString() })
    .eq("id", c.id);
  if (error) {
    console.error("endCheckin failed:", error.message);
    return fail("The check-in couldn't be ended. Try again.");
  }
  refresh();
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Managing points (board)

const boardOnly = async () => {
  const viewer = await getViewer();
  return viewer && viewer.role === "board" && viewer.memberId ? viewer : null;
};

/** Removes one entry: someone's check-in, or points the board added. */
export async function removePoints(pointId: string): Promise<{ ok: true } | Fail> {
  const viewer = await boardOnly();
  if (!viewer) return fail("Only the board can remove points.");
  if (typeof pointId !== "string" || !UUID.test(pointId)) return fail("That entry doesn't exist.");
  const { error } = await db().from("points").delete().eq("id", pointId);
  if (error) {
    console.error("removePoints failed:", error.message);
    return fail("That couldn't be removed. Try again.");
  }
  refresh();
  return { ok: true };
}

/** Marks someone's dues paid (worth the full 20) or not paid, this quarter. */
export async function setDues(memberId: string, paid: boolean): Promise<{ ok: true } | Fail> {
  const viewer = await boardOnly();
  if (!viewer) return fail("Only the board can change dues.");
  if (typeof memberId !== "string" || !UUID.test(memberId) || typeof paid !== "boolean") return fail("That didn't look right.");
  const quarter = quarterOf(new Date());
  const { error } = paid
    ? await db().from("points").insert({
        member_id: memberId,
        quarter,
        category: "dues",
        points: requirement("dues").max,
        note: "Dues paid",
        created_by: viewer.memberId,
      })
    : await db().from("points").delete().eq("member_id", memberId).eq("quarter", quarter).eq("category", "dues");
  // 23505: already marked paid (say, by another board member). That's fine.
  if (error && error.code !== "23505") {
    console.error("setDues failed:", error.message);
    return fail("Dues couldn't be saved. Try again.");
  }
  refresh();
  return { ok: true };
}

/** Points that don't come from a check-in, like a service event off campus. */
export async function addPoints(input: {
  memberId: string;
  category: string;
  points: number;
  note: string;
}): Promise<{ ok: true } | Fail> {
  const viewer = await boardOnly();
  if (!viewer) return fail("Only the board can add points.");
  const memberId = input?.memberId;
  if (typeof memberId !== "string" || !UUID.test(memberId)) return fail("Pick a brother.");
  const category = input?.category;
  if (!isCategory(category) || category === "dues") return fail("Pick a requirement.");
  const points = Number(input?.points);
  if (!Number.isInteger(points) || points === 0 || Math.abs(points) > 30) {
    return fail("Points should be a whole number from -30 to 30 (not 0).");
  }
  const note = String(input?.note ?? "").trim();
  if (!note) return fail("Add what it's for, like the event's name.");
  if (note.length > 120) return fail("Keep the note under 120 characters.");

  const { error } = await db().from("points").insert({
    member_id: memberId,
    quarter: quarterOf(new Date()),
    category,
    points,
    note,
    created_by: viewer.memberId,
  });
  if (error) {
    console.error("addPoints failed:", error.message);
    return fail("The points couldn't be saved. Try again.");
  }
  refresh();
  return { ok: true };
}
