import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getReminders, getUpdates, type Reminder, type Update } from "@/lib/posts";
import { BADGE } from "@/lib/roles";
import { clockTime, dayLabel, fullDateTime, timeAgo } from "@/lib/time";
import { getViewer } from "@/lib/viewer";
import Avatar from "../../avatar";
import { MarkNotificationsSeen } from "../../bell";
import { ChevronRight, ClockIcon, SettingsIcon } from "../../icons";
import LikeButton from "../../like-button";
import PageHeader from "../../page-header";
import PushSetup from "../../push-setup";
import { PageSuspense } from "../../spinner";

export const metadata: Metadata = { title: "Notifications · KTP Hub" };

export default function NotificationsPage() {
  return (
    <PageSuspense label="Loading posts">
      <PageHeader title="Notifications">
        <Link
          href="/settings"
          aria-label="Settings"
          className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-foreground"
        >
          <SettingsIcon />
        </Link>
      </PageHeader>
      <NotificationsContent />
    </PageSuspense>
  );
}

function UpdateCard({ update, now, canSeePeople }: { update: Update; now: Date; canSeePeople: boolean }) {
  const name = update.author?.name ?? update.created_by;
  const start = update.kind === "event" && update.starts_at ? new Date(update.starts_at) : null;
  const who = (
    <>
      <Avatar name={name} imageUrl={update.author?.imageUrl} size={40} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate font-bold">{name}</span>
          {update.author && (
            <span className="shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-bold text-accent">
              {BADGE[update.author.type]}
            </span>
          )}
        </span>
        <span className="block text-sm text-muted">
          {timeAgo(new Date(update.created_at), now)} · {start ? "Event" : "Announcement"}
        </span>
      </span>
    </>
  );

  return (
    <li className="rounded-2xl bg-surface p-4">
      {update.author && canSeePeople ? (
        <Link href={`/people/${update.author.id}`} className="flex items-center gap-3">
          {who}
        </Link>
      ) : (
        <div className="flex items-center gap-3">{who}</div>
      )}
      <Link href={`/posts/${update.id}`} className="mt-3 block">
        <h2 className="text-lg font-bold leading-snug tracking-tight">{update.title}</h2>
        {start && (
          <p className="text-[15px] font-semibold text-accent">
            {fullDateTime(start)}
            {update.location && <> · {update.location}</>}
          </p>
        )}
        {update.body && <p className="mt-1 line-clamp-6 whitespace-pre-line break-words">{update.body}</p>}
      </Link>
      <div className="mt-2">
        <LikeButton postId={update.id} initialLiked={update.liked} initialCount={update.likes} />
      </div>
    </li>
  );
}

// A reminder sits in the feed like a post: "Tomorrow at 8:00 PM" a day ahead,
// "Starts in 45 minutes" in the last hour. Tapping it opens the event.
function ReminderCard({ reminder, now }: { reminder: Reminder; now: Date }) {
  const { event } = reminder;
  const start = new Date(event.start);
  const minutes = Math.max(1, Math.round((start.getTime() - now.getTime()) / 60000));
  const when =
    reminder.lead === "hour"
      ? `Starts in ${minutes} minute${minutes === 1 ? "" : "s"}`
      : `${dayLabel(event.day, now)} at ${clockTime(start)}`;
  const href = event.postId ? `/posts/${event.postId}` : `/calendar?day=${event.day}`;

  return (
    <li>
      <Link href={href} className="flex items-start gap-3 rounded-2xl bg-surface p-4 transition active:opacity-80">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy text-white">
          <ClockIcon className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm text-muted">Reminder · {timeAgo(new Date(reminder.at), now)}</span>
          <span className="mt-0.5 block text-lg font-bold leading-snug tracking-tight">{event.title}</span>
          <span className="block text-[15px] font-semibold text-accent">
            {when}
            {event.location && <> · {event.location}</>}
          </span>
        </span>
        <ChevronRight className="mt-2.5 h-5 w-5 shrink-0 text-muted" />
      </Link>
    </li>
  );
}

async function NotificationsContent() {
  const viewer = await getViewer();
  if (!viewer) redirect("/");
  const [{ now, updates, failed }, { reminders }] = await Promise.all([getUpdates(viewer.userId), getReminders()]);

  // One feed, newest first: board posts and event reminders together.
  const feed = [
    ...updates.map((u) => ({ at: Date.parse(u.created_at), key: u.id, update: u })),
    ...reminders.map((r) => ({ at: r.at, key: r.key, reminder: r })),
  ].sort((a, b) => b.at - a.at);
  const latest = feed[0]?.at ?? null;

  return (
    <>
      <PushSetup guest={viewer.role === "guest"} mode="banner" />
      <MarkNotificationsSeen latest={latest} />

      {failed && (
        <p role="alert" className="mt-6 rounded-lg bg-red-500/10 px-3 py-2 text-red-700 dark:text-red-300">
          Posts couldn&apos;t load. Close and reopen the app to try again.
        </p>
      )}
      {feed.length === 0 && !failed ? (
        <p className="mt-6 text-muted">Nothing yet. Board announcements and event reminders show up here.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {feed.map((item) =>
            "update" in item && item.update ? (
              <UpdateCard key={item.key} update={item.update} now={now} canSeePeople={viewer.role !== "guest"} />
            ) : "reminder" in item && item.reminder ? (
              <ReminderCard key={item.key} reminder={item.reminder} now={now} />
            ) : null,
          )}
        </ul>
      )}
    </>
  );
}
