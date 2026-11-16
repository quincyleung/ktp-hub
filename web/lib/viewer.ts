import "server-only";
import { currentUser } from "@clerk/nextjs/server";
import { profileIsComplete } from "./profile-fields";
import { memberType, type MemberType } from "./roles";
import { db } from "./supabase";

export type Role = "board" | "member" | "guest";

export type Viewer = {
  userId: string;
  email: string;
  name: string;
  role: Role; // permissions: board can post
  type: MemberType; // the badge: Board, Brother, Pledge, Alum, or Guest
  memberId: string | null; // their row on the roster (null for guests)
  needsProfile: boolean; // a member without a graduation year or major yet: Home sends them to /welcome
};

type MemberRow = {
  id: string;
  name: string;
  role: string;
  status: string | null;
  image_url?: string | null;
  year?: string | null;
  major?: string | null;
};

async function findMember(email: string): Promise<{ row: MemberRow | null; hasPhotoColumn: boolean }> {
  const full = await db()
    .from("members")
    .select("id, name, role, status, image_url, year, major")
    .eq("email_lower", email)
    .maybeSingle();
  if (!full.error) return { row: full.data as MemberRow | null, hasPhotoColumn: true };

  // Most likely the profiles migration hasn't run yet: still let members in.
  console.error("Member lookup failed, retrying without photos:", full.error.message);
  const basic = await db().from("members").select("id, name, role, status").eq("email_lower", email).maybeSingle();
  if (basic.error) console.error("Member lookup failed:", basic.error.message);
  return { row: basic.data as MemberRow | null, hasPhotoColumn: false };
}

// Who is signed in, and what they are: board, member (on the roster), or guest.
export async function getViewer(): Promise<Viewer | null> {
  const user = await currentUser();
  if (!user) return null;

  const primary = user.primaryEmailAddress;
  const verified = primary?.verification?.status === "verified";
  const email = (primary?.emailAddress ?? "").trim().toLowerCase();
  const fallbackName = user.firstName ?? email.split("@")[0] ?? "there";
  const guest: Viewer = {
    userId: user.id,
    email,
    name: fallbackName,
    role: "guest",
    type: "guest",
    memberId: null,
    needsProfile: false,
  };

  // Only a verified email can match the roster.
  if (!email || !verified) return guest;

  const { row, hasPhotoColumn } = await findMember(email);
  if (!row) return guest;

  // Profile photos come from the sign-in account. Copy it to the roster when
  // it changes, so People and the feed can show it.
  const image = user.hasImage ? user.imageUrl : null;
  if (hasPhotoColumn && (row.image_url ?? null) !== image) {
    const { error } = await db().from("members").update({ image_url: image }).eq("id", row.id);
    if (error) console.error("Saving the profile photo failed:", error.message);
  }

  return {
    userId: user.id,
    email,
    name: row.name,
    role: row.role === "board" ? "board" : "member",
    type: memberType(row.role, row.status),
    memberId: row.id,
    // Without the profile columns (an old database), don't trap anyone in onboarding.
    needsProfile: hasPhotoColumn && !profileIsComplete({ year: row.year ?? null, major: row.major ?? null }),
  };
}
