"use server";

import { refresh } from "next/cache";
import { isGradYear, MAX_LIST, MAX_NAME, splitList } from "@/lib/profile-fields";
import { db } from "@/lib/supabase";
import { getViewer } from "@/lib/viewer";

export type ProfileResult = { ok: true; id: string } | { ok: false; error: string };

class Invalid extends Error {}

type Values = Record<string, string | string[] | null>;

const LIMITS = {
  pronouns: 30,
  hometown: 100,
  pledge_class: 60,
  about: 1000,
} as const;

const LABELS: Record<keyof typeof LIMITS, string> = {
  pronouns: "Pronouns",
  hometown: "Hometown",
  pledge_class: "Pledge class",
  about: "About me",
};

// Accepts "linkedin.com/in/name" or a full link, and only LinkedIn links.
function linkedinUrl(raw: string): string | null {
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    throw new Invalid("That doesn't look like a LinkedIn link.");
  }
  const host = url.hostname.toLowerCase();
  if (host !== "linkedin.com" && !host.endsWith(".linkedin.com")) {
    throw new Invalid("The LinkedIn link should start with linkedin.com/in/.");
  }
  url.protocol = "https:";
  const link = url.toString();
  if (link.length > 200) throw new Invalid("That LinkedIn link is too long.");
  return link;
}

// One box per major or minor; a comma typed inside a box also splits it.
// Saved as one line, e.g. "Computer Science, Economics".
function nameList(raw: FormDataEntryValue[], noun: string, required: boolean): string | null {
  const list = [
    ...new Set(raw.flatMap((v) => splitList(String(v))).map((s) => s.replace(/\s+/g, " "))),
  ];
  if (required && list.length === 0) throw new Invalid(`Add your ${noun}. "Undeclared" is fine.`);
  if (list.length > MAX_LIST) throw new Invalid(`Add up to ${MAX_LIST} ${noun}s.`);
  if (list.some((s) => s.length > MAX_NAME)) {
    throw new Invalid(`Keep each ${noun} under ${MAX_NAME} characters.`);
  }
  return list.length > 0 ? list.join(", ") : null;
}

// Graduation year, majors and minors: asked at onboarding, editable on the profile.
function readBasics(form: FormData): Values {
  const year = String(form.get("year") ?? "").trim();
  if (!isGradYear(year)) throw new Invalid("Choose your graduation year.");
  return {
    year,
    major: nameList(form.getAll("major"), "major", true),
    minor: nameList(form.getAll("minor"), "minor", false),
  };
}

function readProfile(form: FormData): Values {
  const values = readBasics(form);
  for (const [name, max] of Object.entries(LIMITS) as [keyof typeof LIMITS, number][]) {
    const v = String(form.get(name) ?? "").trim();
    if (v.length > max) throw new Invalid(`Keep ${LABELS[name]} under ${max} characters.`);
    values[name] = v || null;
  }
  values.linkedin = linkedinUrl(String(form.get("linkedin") ?? "").trim());

  const interests = splitList(String(form.get("interests") ?? ""));
  if (interests.length > 10) throw new Invalid("Pick up to 10 interests.");
  if (interests.some((s) => s.length > 30)) throw new Invalid("Keep each interest under 30 characters.");
  values.interests = [...new Set(interests)];
  return values;
}

// Members edit only their own row. The roster import keeps what they enter.
async function save(form: FormData, read: (form: FormData) => Values, what: string): Promise<ProfileResult> {
  const viewer = await getViewer();
  if (!viewer?.memberId) return { ok: false, error: "Only chapter members have profiles." };

  let values: Values;
  try {
    values = read(form);
  } catch (err) {
    if (err instanceof Invalid) return { ok: false, error: err.message };
    throw err;
  }

  const { error } = await db().from("members").update(values).eq("id", viewer.memberId);
  if (error) {
    console.error(`${what} failed:`, error.message);
    return { ok: false, error: "Your profile couldn't be saved. Try again." };
  }
  return { ok: true, id: viewer.memberId };
}

export async function updateProfile(form: FormData): Promise<ProfileResult> {
  const result = await save(form, readProfile, "updateProfile");
  if (result.ok) refresh();
  return result;
}

// Onboarding. (The photo goes straight from the browser to the sign-in account.)
export async function saveBasics(form: FormData): Promise<ProfileResult> {
  return save(form, readBasics, "saveBasics");
}

// Board only: makes a brother a committee lead (they can run check-ins for
// committee meetings) or takes it away. Board members' own role isn't touched.
export async function setCommitteeLead(memberId: string, lead: boolean): Promise<{ ok: true } | { ok: false; error: string }> {
  const viewer = await getViewer();
  if (!viewer || viewer.role !== "board") return { ok: false, error: "Only the board can choose committee leads." };
  if (typeof memberId !== "string" || !/^[0-9a-f-]{36}$/i.test(memberId) || typeof lead !== "boolean") {
    return { ok: false, error: "That didn't look right." };
  }
  const { data, error } = await db()
    .from("members")
    .update({ role: lead ? "lead" : "member" })
    .eq("id", memberId)
    .in("role", ["member", "lead"])
    .select("id");
  if (error || !data?.length) {
    if (error) console.error("setCommitteeLead failed:", error.message);
    return { ok: false, error: error ? "That couldn't be saved. Try again." : "Board members can already run check-ins." };
  }
  refresh();
  return { ok: true };
}
