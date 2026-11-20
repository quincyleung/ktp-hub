import "server-only";
import { memberType, type MemberType } from "./roles";
import { db } from "./supabase";

export type Person = {
  id: string;
  name: string;
  email: string;
  year: string | null;
  type: MemberType;
  imageUrl: string | null;
  pronouns: string | null;
  major: string | null;
};

export type Profile = Person & {
  minor: string | null;
  hometown: string | null;
  pledgeClass: string | null;
  linkedin: string | null;
  interests: string[];
  about: string | null;
  isLead: boolean; // a committee lead: can run check-ins for committee meetings
};

type Row = Record<string, unknown>;
const text = (v: unknown) => (typeof v === "string" && v.trim() ? v : null);

function toPerson(m: Row): Person {
  return {
    id: m.id as string,
    name: m.name as string,
    email: m.email as string,
    year: text(m.year),
    type: memberType(m.role as string, m.status as string | null),
    imageUrl: text(m.image_url),
    pronouns: text(m.pronouns),
    major: text(m.major),
  };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Everyone on the roster, A to Z. Only shown to members. */
export async function getPeople(): Promise<{ people: Person[]; failed: boolean }> {
  const { data, error } = await db()
    .from("members")
    .select("id, name, email, year, status, role, image_url, pronouns, major")
    .order("name", { ascending: true });
  if (error) console.error("Loading people failed:", error.message);
  return { people: (data ?? []).map(toPerson), failed: !!error };
}

/** One member's full profile. */
export async function getProfile(id: string): Promise<Profile | null> {
  if (!UUID.test(id)) return null;
  const { data, error } = await db()
    .from("members")
    .select(
      "id, name, email, year, status, role, image_url, pronouns, major, minor, hometown, pledge_class, linkedin, interests, about",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) console.error("Loading a profile failed:", error.message);
  if (!data) return null;
  return {
    ...toPerson(data),
    minor: text(data.minor),
    hometown: text(data.hometown),
    pledgeClass: text(data.pledge_class),
    linkedin: text(data.linkedin),
    interests: Array.isArray(data.interests) ? (data.interests as string[]) : [],
    about: text(data.about),
    isLead: data.role === "lead",
  };
}

/** Poster names, photos and badges for the feed, by email. */
export async function getAuthors(emails: string[]) {
  const unique = [...new Set(emails.filter(Boolean))];
  const authors = new Map<string, Person>();
  if (unique.length === 0) return authors;
  const { data, error } = await db()
    .from("members")
    .select("id, name, email, email_lower, year, status, role, image_url, pronouns, major")
    .in("email_lower", unique);
  if (error) console.error("Loading authors failed:", error.message);
  for (const m of data ?? []) authors.set(m.email_lower as string, toPerson(m));
  return authors;
}
