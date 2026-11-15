import "server-only";
import { connection } from "next/server";
import { sendPush, type PushPayload } from "./push";
import { db } from "./supabase";
import type { Viewer } from "./viewer";

export type Post = {
  id: string;
  kind: "event" | "announcement";
  title: string;
  body: string | null;
  starts_at: string | null;
  location: string | null;
  created_by: string;
  created_at: string;
};

const COLUMNS = "id, kind, title, body, starts_at, location, created_by, created_at";

// Events stay on the homepage until 3 hours after they start.
const EVENT_GRACE_MS = 3 * 60 * 60 * 1000;

// Members and board see chapter posts. Guests see only their own sample posts.
function postsFor(viewer: Viewer) {
  const query = db().from("posts").select(COLUMNS);
  return viewer.role === "guest"
    ? query.eq("audience", "demo").eq("demo_owner", viewer.userId)
    : query.eq("audience", "chapter");
}

export async function getFeed(viewer: Viewer) {
  await connection();
  const now = new Date();
  const [events, announcements] = await Promise.all([
    postsFor(viewer)
      .eq("kind", "event")
      .gte("starts_at", new Date(now.getTime() - EVENT_GRACE_MS).toISOString())
      .order("starts_at", { ascending: true })
      .limit(20),
    postsFor(viewer)
      .eq("kind", "announcement")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);
  if (events.error) console.error("Loading events failed:", events.error.message);
  if (announcements.error) console.error("Loading announcements failed:", announcements.error.message);
  return {
    now,
    events: (events.data ?? []) as Post[],
    announcements: (announcements.data ?? []) as Post[],
    failed: !!(events.error || announcements.error),
  };
}

// Supabase filters go in the URL, so long lists of endpoints go in batches.
async function inBatches(items: string[], run: (batch: string[]) => PromiseLike<unknown>) {
  for (let i = 0; i < items.length; i += 20) await run(items.slice(i, i + 20));
}

// Sends one notification to every device that belongs to someone on the roster.
export async function notifyChapter(payload: PushPayload) {
  const { data, error } = await db().from("member_subscriptions").select("endpoint, email, p256dh, auth");
  if (error) throw new Error(error.message);
  const subs = (data ?? []) as { endpoint: string; email: string; p256dh: string; auth: string }[];

  const results = await Promise.all(
    subs.map(async (s) => ({
      ...s,
      result: await sendPush({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload),
    })),
  );
  const sent = results.filter((r) => r.result.ok);
  const gone = results.filter((r) => !r.result.ok && r.result.gone).map((r) => r.endpoint);
  const failed = results.length - sent.length - gone.length;

  await inBatches(gone, (batch) => db().from("push_subscriptions").delete().in("endpoint", batch));
  const sentAt = new Date().toISOString();
  await inBatches(
    sent.map((r) => r.endpoint),
    (batch) => db().from("push_subscriptions").update({ last_sent_at: sentAt }).in("endpoint", batch),
  );

  return { people: new Set(sent.map((r) => r.email)).size, failed };
}
