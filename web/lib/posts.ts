import "server-only";
import { connection } from "next/server";
import { mergeCalendar, type CalendarItem } from "./calendar-feed";
import { getGoogleEvents } from "./gcal";
import { getAuthors, type Person } from "./people";
import { sendPush, type PushPayload } from "./push";
import { db } from "./supabase";
import { dayKey } from "./time";

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
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

// Events count as upcoming until 3 hours after they start.
const EVENT_GRACE_MS = 3 * 60 * 60 * 1000;

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Everyone who's signed in sees the chapter's posts, guests included (for now,
// so graders can see the feed). Only roster members get notifications for them.
const chapterPosts = () => db().from("posts").select(COLUMNS).eq("audience", "chapter");

export function postToItem(p: Post): CalendarItem {
  const start = new Date(p.starts_at!);
  return {
    key: `p:${p.id}`,
    source: "app",
    postId: p.id,
    title: p.title,
    start: start.toISOString(),
    day: dayKey(start),
    allDay: false,
    location: p.location,
    details: p.body,
  };
}

/** Home: what's coming up (board posts plus the next 30 days of the Google Calendar) and announcements. */
export async function getHomeFeed() {
  await connection();
  const now = new Date();
  const cutoff = now.getTime() - EVENT_GRACE_MS;
  const horizon = now.getTime() + 30 * DAY;
  const today = dayKey(now);

  const [events, announcements, google] = await Promise.all([
    chapterPosts()
      .eq("kind", "event")
      .gte("starts_at", new Date(cutoff).toISOString())
      .order("starts_at", { ascending: true })
      .limit(20),
    chapterPosts().eq("kind", "announcement").order("created_at", { ascending: false }).limit(10),
    getGoogleEvents(),
  ]);
  if (events.error) console.error("Loading events failed:", events.error.message);
  if (announcements.error) console.error("Loading announcements failed:", announcements.error.message);

  const googleUpcoming = google.filter((g) => {
    const start = Date.parse(g.start);
    return (g.allDay ? g.day >= today : start >= cutoff) && start <= horizon;
  });
  return {
    now,
    upcoming: mergeCalendar(((events.data ?? []) as Post[]).map(postToItem), googleUpcoming).slice(0, 10),
    announcements: (announcements.data ?? []) as Post[],
    failed: !!(events.error || announcements.error),
  };
}

/** Calendar: board posts and Google Calendar events from about 4 months back to 8 months ahead. */
export async function getCalendar() {
  await connection();
  const now = new Date();
  const [events, google] = await Promise.all([
    chapterPosts()
      .eq("kind", "event")
      .gte("starts_at", new Date(now.getTime() - 120 * DAY).toISOString())
      .order("starts_at", { ascending: true })
      .limit(300),
    getGoogleEvents(),
  ]);
  if (events.error) console.error("Loading calendar events failed:", events.error.message);
  return {
    now,
    items: mergeCalendar(((events.data ?? []) as Post[]).map(postToItem), google),
    failed: !!events.error,
  };
}

export async function getPost(id: string): Promise<Post | null> {
  if (!UUID.test(id)) return null;
  const { data, error } = await chapterPosts().eq("id", id).maybeSingle();
  if (error) console.error("Loading a post failed:", error.message);
  return (data as Post | null) ?? null;
}

export type Update = Post & {
  likes: number;
  liked: boolean;
  author: Person | null; // null if the poster isn't on the roster anymore
};

/** The notifications feed: every board post, newest first, with likes and who posted it. */
export async function getUpdates(userId: string) {
  await connection();
  const now = new Date();
  const { data, error } = await db()
    .from("posts")
    .select(`${COLUMNS}, author_email, post_likes(count)`)
    .eq("audience", "chapter")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) console.error("Loading the feed failed:", error.message);
  const rows = (data ?? []) as (Post & { author_email: string | null; post_likes: { count: number }[] })[];

  const ids = rows.map((r) => r.id);
  const [mine, authors] = await Promise.all([
    ids.length
      ? db().from("post_likes").select("post_id").eq("user_id", userId).in("post_id", ids)
      : Promise.resolve({ data: [] as { post_id: string }[] }),
    getAuthors(rows.map((r) => (r.author_email ?? "").toLowerCase())),
  ]);
  const liked = new Set((mine.data ?? []).map((l) => l.post_id as string));

  const updates: Update[] = rows.map(({ author_email, post_likes, ...post }) => ({
    ...post,
    likes: post_likes?.[0]?.count ?? 0,
    liked: liked.has(post.id),
    author: authors.get((author_email ?? "").toLowerCase()) ?? null,
  }));
  return { now, updates, failed: !!error };
}

/** A reminder in the notifications feed, "posted" a day and an hour before an event. */
export type Reminder = { key: string; at: number; lead: "day" | "hour"; event: CalendarItem };

/**
 * Reminders that are out by now: one a day before each event and one an hour
 * before, until the event starts. All-day events don't get them (no start time).
 */
export async function getReminders(): Promise<{ now: Date; reminders: Reminder[] }> {
  const { now, upcoming } = await getHomeFeed();
  const t = now.getTime();
  const reminders: Reminder[] = [];
  for (const event of upcoming) {
    const start = Date.parse(event.start);
    if (event.allDay || start <= t) continue;
    if (t >= start - DAY) reminders.push({ key: `${event.key}:day`, at: start - DAY, lead: "day", event });
    if (t >= start - HOUR) reminders.push({ key: `${event.key}:hour`, at: start - HOUR, lead: "hour", event });
  }
  return { now, reminders };
}

/** When the newest post or reminder went out (ms), for the bell's unread dot. */
export async function getLatestPostAt(): Promise<number | null> {
  const [{ data }, { reminders }] = await Promise.all([
    db()
      .from("posts")
      .select("created_at")
      .eq("audience", "chapter")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    getReminders(),
  ]);
  const times = [...(data ? [Date.parse(data.created_at as string)] : []), ...reminders.map((r) => r.at)];
  return times.length ? Math.max(...times) : null;
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
