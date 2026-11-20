import "server-only";
import { connection } from "next/server";
import { notOver, type CalendarItem } from "./calendar-feed";
import { getGoogleEvents } from "./gcal";
import { isCategory, rank, tally, type Category, type LeaderRow, type Tally } from "./points";
import { compareQuarters, quarterOf } from "./quarters";
import { memberType } from "./roles";
import { db } from "./supabase";
import { dayKey } from "./time";

export type HistoryItem = { id: string; category: Category; points: number; note: string | null; at: string };

export type Standings = {
  mine: Tally | null; // null for someone not on the roster
  history: HistoryItem[];
  leaders: LeaderRow[]; // the top 10
  myRank: LeaderRow | null;
  failed: boolean;
};

export type CheckinSummary = {
  id: string;
  title: string;
  category: Category;
  points: number;
  startsAt: string;
  endsAt: string;
  count: number;
  createdBy: string | null;
};

type PointRow = {
  id: string;
  member_id: string;
  category: string;
  points: number;
  note: string | null;
  created_at: string;
  checkin_id?: string | null;
};

export async function currentQuarter(): Promise<string> {
  await connection();
  return quarterOf(new Date());
}

/** Quarters that have points, plus this one, oldest first. */
export async function getQuarters(): Promise<string[]> {
  const now = await currentQuarter();
  const { data, error } = await db().from("points").select("quarter").limit(10000);
  if (error) console.error("Loading quarters failed:", error.message);
  const all = new Set([now, ...(data ?? []).map((r) => r.quarter as string)]);
  return [...all].filter((q) => compareQuarters(q, now) <= 0).sort(compareQuarters);
}

/** Everyone's totals for a quarter, the top 10, and one member's own points. */
export async function getStandings(quarter: string, memberId: string | null): Promise<Standings> {
  const [points, members] = await Promise.all([
    db()
      .from("points")
      .select("id, member_id, category, points, note, created_at")
      .eq("quarter", quarter)
      .order("created_at", { ascending: false })
      .limit(10000),
    db().from("members").select("id, name, image_url, role, status"),
  ]);
  if (points.error) console.error("Loading points failed:", points.error.message);
  if (members.error) console.error("Loading members failed:", members.error.message);

  const rows = (points.data ?? []) as PointRow[];
  const byMember = new Map<string, PointRow[]>();
  for (const r of rows) byMember.set(r.member_id, [...(byMember.get(r.member_id) ?? []), r]);

  // Alumni aren't ranked.
  const ranked = rank(
    (members.data ?? [])
      .filter((m) => memberType(m.role as string, m.status as string | null) !== "alumni")
      .map((m) => ({
        id: m.id as string,
        name: m.name as string,
        imageUrl: (m.image_url as string | null) ?? null,
        total: tally(byMember.get(m.id as string) ?? []).total,
      })),
  );

  const mine = memberId ? byMember.get(memberId) ?? [] : null;
  return {
    mine: mine ? tally(mine) : null,
    history: (mine ?? []).filter((r) => isCategory(r.category)).map(toHistory),
    leaders: ranked.slice(0, 10),
    myRank: ranked.find((r) => r.id === memberId) ?? null,
    failed: !!(points.error || members.error),
  };
}

const toHistory = (r: PointRow): HistoryItem => ({
  id: r.id,
  category: r.category as Category,
  points: r.points,
  note: r.note,
  at: r.created_at,
});

/** One member's total for a quarter (shown right after they check in). */
export async function getTotal(memberId: string, quarter: string): Promise<number | null> {
  const { data, error } = await db()
    .from("points")
    .select("category, points")
    .eq("member_id", memberId)
    .eq("quarter", quarter);
  if (error) return null;
  return tally(data ?? []).total;
}

/** Check-ins in a quarter, newest first. Committee leads only see their own. */
export async function getCheckins(quarter: string, onlyBy: string | null = null): Promise<CheckinSummary[]> {
  let query = db()
    .from("checkins")
    // "attendees": the count of points rows, named so it doesn't clash with the points column.
    .select("id, title, category, points, starts_at, ends_at, created_by, attendees:points(count)")
    .eq("quarter", quarter)
    .order("starts_at", { ascending: false })
    .limit(200);
  if (onlyBy) query = query.eq("created_by", onlyBy);
  const { data, error } = await query;
  if (error) console.error("Loading check-ins failed:", error.message);
  return (data ?? []).map((c) => ({
    id: c.id as string,
    title: c.title as string,
    category: c.category as Category,
    points: c.points as number,
    startsAt: c.starts_at as string,
    endsAt: c.ends_at as string,
    createdBy: (c.created_by as string | null) ?? null,
    count: (c.attendees as unknown as { count: number }[] | null)?.[0]?.count ?? 0,
  }));
}

/** Timed events on the chapter calendar today that aren't over yet: what a check-in can be for. */
export async function getTodaysEvents(): Promise<CalendarItem[]> {
  await connection();
  const now = new Date();
  const today = dayKey(now);
  const events = await getGoogleEvents();
  return events.filter((e) => !e.allDay && e.end && e.day === today && notOver(e, now));
}

export type DuesRow = { id: string; name: string; imageUrl: string | null; paid: boolean };

/** Everyone but alumni, A to Z, with whether they've paid dues this quarter. */
export async function getDues(quarter: string): Promise<{ people: DuesRow[]; failed: boolean }> {
  const [members, dues] = await Promise.all([
    db().from("members").select("id, name, image_url, role, status").order("name", { ascending: true }),
    db().from("points").select("member_id").eq("quarter", quarter).eq("category", "dues"),
  ]);
  const paid = new Set((dues.data ?? []).map((d) => d.member_id as string));
  return {
    people: (members.data ?? [])
      .filter((m) => memberType(m.role as string, m.status as string | null) !== "alumni")
      .map((m) => ({
        id: m.id as string,
        name: m.name as string,
        imageUrl: (m.image_url as string | null) ?? null,
        paid: paid.has(m.id as string),
      })),
    failed: !!(members.error || dues.error),
  };
}

export type BoardEntry = HistoryItem & { name: string };

/** Points the board added by hand this quarter (not check-ins or dues), newest first. */
export async function getBoardEntries(quarter: string): Promise<BoardEntry[]> {
  const { data, error } = await db()
    .from("points")
    .select("id, category, points, note, created_at, members!points_member_id_fkey(name)")
    .eq("quarter", quarter)
    .is("checkin_id", null)
    .neq("category", "dues")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) console.error("Loading board entries failed:", error.message);
  return (data ?? []).map((r) => ({
    id: r.id as string,
    category: r.category as Category,
    points: r.points as number,
    note: (r.note as string | null) ?? null,
    at: r.created_at as string,
    name: ((r.members as unknown as { name: string } | null)?.name ?? "Someone") as string,
  }));
}
