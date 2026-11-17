"use server";

import { refresh } from "next/cache";
import { notifyChapter, UUID } from "@/lib/posts";
import { db } from "@/lib/supabase";
import { getViewer } from "@/lib/viewer";

export type PostResult = { ok: true; message: string } | { ok: false; error: string };

const text = (form: FormData, name: string) => String(form.get(name) ?? "").trim();

// Board only: posts an announcement to the chapter and, unless "Notify
// everyone" is unchecked, sends a notification to every member's phone.
// Events aren't posted here: the board adds them to the chapter's Google
// Calendar, and the app shows them from there.
export async function createPost(form: FormData): Promise<PostResult> {
  const viewer = await getViewer();
  if (!viewer || viewer.role !== "board") return { ok: false, error: "Only board members can post." };

  const title = text(form, "title");
  const body = text(form, "body");
  const notify = form.get("notify") === "on";

  if (!title) return { ok: false, error: "Add a title." };
  if (title.length > 120) return { ok: false, error: "Keep the title under 120 characters." };
  if (body.length > 2000) return { ok: false, error: "Keep the details under 2,000 characters." };

  const { data, error } = await db()
    .from("posts")
    .insert({
      audience: "chapter",
      kind: "announcement",
      title,
      body: body || null,
      notify,
      created_by: viewer.name,
      author_email: viewer.email,
    })
    .select("id")
    .single();
  if (error || !data) {
    console.error("createPost failed:", error?.message);
    return { ok: false, error: "The post couldn't be saved. Try again." };
  }

  let message = "Posted without a notification.";
  if (notify) {
    const url = `/posts/${data.id}`;
    const payload = {
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

// Likes on the notifications feed. Anyone signed in can like a post.
export async function setLike(postId: string, like: boolean): Promise<{ ok: boolean }> {
  const viewer = await getViewer();
  if (!viewer || typeof postId !== "string" || !UUID.test(postId)) return { ok: false };
  const likes = db().from("post_likes");
  const { error } = like
    ? await likes.upsert({ post_id: postId, user_id: viewer.userId }, { ignoreDuplicates: true })
    : await likes.delete().eq("post_id", postId).eq("user_id", viewer.userId);
  if (error) console.error("setLike failed:", error.message);
  return { ok: !error };
}
