import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSoonEvents, getUpdates, type Update } from "@/lib/posts";
import { BADGE } from "@/lib/roles";
import { clockTime, dayLabel, fullDateTime, timeAgo } from "@/lib/time";
import { getViewer } from "@/lib/viewer";
import Avatar from "../../avatar";
import { MarkNotificationsSeen } from "../../bell";
import { SettingsIcon } from "../../icons";
import LikeButton from "../../like-button";
import PageHeader from "../../page-header";
import PushSetup from "../../push-setup";
import { PageSuspense } from "../../spinner";

export const metadata: Metadata = { title: "Notifications · KTP Hub" };

export default function NotificationsPage() {
  return (
    <PageSuspense label="Loading posts">
      <PageHeader title="Notifications" subtitle="Posts from the board">
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

async function NotificationsContent() {
  const viewer = await getViewer();
  if (!viewer) redirect("/");
  const [{ now, updates, failed }, soon] = await Promise.all([getUpdates(viewer.userId), getSoonEvents()]);
  const latest = updates[0] ? Date.parse(updates[0].created_at) : null;

  return (
    <>
      <PushSetup guest={viewer.role === "guest"} mode="banner" />
      <MarkNotificationsSeen latest={latest} />

      {soon.length > 0 && (
        <section className="mt-6" aria-labelledby="reminders-heading">
          <h2 id="reminders-heading" className="text-sm font-bold uppercase tracking-wide text-muted">
            Reminders
          </h2>
          <ul className="mt-2 space-y-2">
            {soon.map((e) => {
              const row = (
                <>
                  <span className="shrink-0 rounded-full bg-navy px-2 py-0.5 text-xs font-bold text-white">
                    {dayLabel(e.day, now)}
                  </span>
                  <span className="min-w-0 flex-1 truncate">
                    <b>{e.title}</b>
                    <span className="text-muted">
                      {" "}
                      · {e.allDay ? "All day" : clockTime(new Date(e.start))}
                      {e.location && ` · ${e.location}`}
                    </span>
                  </span>
                </>
              );
              return (
                <li key={e.key}>
                  {e.postId ? (
                    <Link
                      href={`/posts/${e.postId}`}
                      className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3 transition active:opacity-80"
                    >
                      {row}
                    </Link>
                  ) : (
                    <Link
                      href="/calendar"
                      className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3 transition active:opacity-80"
                    >
                      {row}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {failed ? (
        <p role="alert" className="mt-6 rounded-lg bg-red-500/10 px-3 py-2 text-red-700 dark:text-red-300">
          Posts couldn&apos;t load. Close and reopen the app to try again.
        </p>
      ) : updates.length === 0 ? (
        <p className="mt-6 text-muted">Nothing from the board yet.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {updates.map((u) => (
            <UpdateCard key={u.id} update={u} now={now} canSeePeople={viewer.role !== "guest"} />
          ))}
        </ul>
      )}
    </>
  );
}
