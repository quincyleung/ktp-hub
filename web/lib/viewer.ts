import "server-only";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "./supabase";

export type Role = "board" | "member" | "guest";

export type Viewer = {
  userId: string;
  email: string;
  name: string;
  role: Role;
};

// Who is signed in, and what they are: board, member (on the roster), or guest.
export async function getViewer(): Promise<Viewer | null> {
  const user = await currentUser();
  if (!user) return null;

  const primary = user.primaryEmailAddress;
  const verified = primary?.verification?.status === "verified";
  const email = (primary?.emailAddress ?? "").trim().toLowerCase();
  const fallbackName = user.firstName ?? email.split("@")[0] ?? "there";

  // Only a verified email can match the roster.
  if (!email || !verified) {
    return { userId: user.id, email, name: fallbackName, role: "guest" };
  }

  const { data, error } = await db()
    .from("members")
    .select("name, role")
    .eq("email_lower", email)
    .maybeSingle();
  if (error) console.error("Member lookup failed:", error.message);

  if (!data) return { userId: user.id, email, name: fallbackName, role: "guest" };
  return {
    userId: user.id,
    email,
    name: data.name,
    role: data.role === "board" ? "board" : "member",
  };
}
