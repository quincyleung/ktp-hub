"use server";

import { refresh } from "next/cache";
import { notifyChapter } from "@/lib/posts";
import { db } from "@/lib/supabase";
import { fullDateTime } from "@/lib/time";
import { getViewer } from "@/lib/viewer";

export type PostResult = { ok: true; message: string } | { ok: false; error: string };

const text = (form: FormData, name: string) => String(form.get(name) ?? "").trim();

// Board only: posts an event or announcement to the chapter and, unless
// "Notify everyone" is unchecked, sends a notification to every member's phone.
export async function createPost(form: FormData): Promise<PostResult> {
  const viewer = await getViewer();
  if (!viewer || viewer.role !== "board") return { ok: false, error: "Only board members can post." };

  const kind = form.get("kind") === "announcement" ? "announcement" : "event";
  const title = text(form, "title");
  const body = text(form, "body");
  const location = kind === "event" ? text(form, "location") : "";
  const notify = form.get("notify") === "on";

  if (!title) return { ok: false, error: "Add a title." };
  if (title.length > 120) return { ok: false, error: "Keep the title under 120 characters." };
  if (body.length > 2000) return { ok: false, error: "Keep the details under 2,000 characters." };
  if (location.length > 200) return { ok: false, error: "Keep the location under 200 characters." };

  let startsAt: Date | null = null;
  if (kind === "event") {
    const raw = text(form, "starts_at");
    startsAt = raw ? new Date(raw) : null;
    if (!startsAt || Number.isNaN(startsAt.getTime())) {
      return { ok: false, error: "Pick a date and time for the event." };
    }
    if (startsAt.getTime() < Date.now() - 60 * 60 * 1000) {
      return { ok: false, error: "That time has already passed. Check the date and AM/PM." };
    }
  }

  const { data, error } = await db()
    .from("posts")
    .insert({
      audience: "chapter",
      kind,
      title,
      body: body || null,
      starts_at: startsAt?.toISOString() ?? null,
      location: location || null,
      notify,
      created_by: viewer.name,
    })
    .select("id")
    .single();
  if (error || !data) {
    console.error("createPost failed:", error?.message);
    return { ok: false, error: "The post couldn't be saved. Try again." };
  }

  let message = "Posted without a notification.";
  if (notify) {
    const url = `/?post=${data.id}#post-${data.id}`;
    const payload = startsAt
      ? {
          title: `New event: ${title}`,
          body: [fullDateTime(startsAt), location].filter(Boolean).join(" · "),
          url,
        }
      : {
          title,
          body: body ? (body.length > 140 ? `${body.slice(0, 139)}…` : body) : "New announcement from the board",
          url,
        };
    try {
      const { people, failed } = await notifyChapter(payload);
      message =
        people === 0
          ? "Posted. Nobody has notifications on yet, so no one was notified."
          : `Posted and sent to ${people} ${people === 1 ? "person" : "people"}.`;
      if (failed > 0) message += ` ${failed} ${failed === 1 ? "phone" : "phones"} didn't get it.`;
    } catch (err) {
      console.error("notifyChapter failed:", err);
      message = "Posted, but the notifications couldn't be sent.";
    }
  }

  refresh();
  return { ok: true, message };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Board only: removes a chapter post from the homepage.
export async function deletePost(id: string): Promise<PostResult> {
  const viewer = await getViewer();
  if (!viewer || viewer.role !== "board") return { ok: false, error: "Only board members can delete posts." };
  if (typeof id !== "string" || !UUID.test(id)) return { ok: false, error: "That post doesn't exist." };

  const { error } = await db().from("posts").delete().eq("id", id).eq("audience", "chapter");
  if (error) {
    console.error("deletePost failed:", error.message);
    return { ok: false, error: "The post couldn't be deleted. Try again." };
  }
  refresh();
  return { ok: true, message: "Deleted." };
}
