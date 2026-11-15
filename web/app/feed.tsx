import { getFeed, type Post } from "@/lib/posts";
import { clockTime, dateBadge, eventDay, timeAgo } from "@/lib/time";
import type { Viewer } from "@/lib/viewer";
import DeletePost from "./delete-post";
import { card } from "./ui";

// Turns http(s) links in post text (like Partiful links) into tappable links.
const URL_PATTERN = /(https?:\/\/[^\s<]*[^\s<.,;:!?)\]'"])/g;

function Linkified({ text }: { text: string }) {
  return (
    <>
      {text.split(URL_PATTERN).map((part, i) =>
        i % 2 === 1 ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all font-semibold text-accent underline underline-offset-2"
          >
            {part}
          </a>
        ) : (
          part
        ),
      )}
    </>
  );
}

function EventItem({ post, now, canDelete }: { post: Post; now: Date; canDelete: boolean }) {
  const start = new Date(post.starts_at!);
  const badge = dateBadge(start);
  const started = start.getTime() <= now.getTime();
  const when = started
    ? `Started at ${clockTime(start)}`
    : `${eventDay(start, now)} · ${clockTime(start)}`;
  return (
    <li id={`post-${post.id}`} className={`${card} flex scroll-mt-4 gap-4`}>
      <div className="flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-accent/10 text-accent">
        <span className="text-xs font-bold uppercase tracking-wide">{badge.weekday}</span>
        <span className="font-serif text-2xl leading-none">{badge.day}</span>
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-lg font-semibold leading-snug">{post.title}</h3>
        <p className="text-[15px] text-muted">
          {when}
          {post.location && <> · {post.location}</>}
        </p>
        {post.body && (
          <p className="mt-2 whitespace-pre-line break-words">
            <Linkified text={post.body} />
          </p>
        )}
        {canDelete && <DeletePost id={post.id} />}
      </div>
    </li>
  );
}

function AnnouncementItem({ post, now, canDelete }: { post: Post; now: Date; canDelete: boolean }) {
  return (
    <li id={`post-${post.id}`} className={`${card} scroll-mt-4`}>
      <h3 className="text-lg font-semibold leading-snug">{post.title}</h3>
      {post.body && (
        <p className="mt-1 whitespace-pre-line break-words">
          <Linkified text={post.body} />
        </p>
      )}
      <p className="mt-2 text-sm text-muted">
        {post.created_by.split(" ")[0]} · {timeAgo(new Date(post.created_at), now)}
      </p>
      {canDelete && <DeletePost id={post.id} />}
    </li>
  );
}

export default async function Feed({ viewer }: { viewer: Viewer }) {
  const { now, events, announcements, failed } = await getFeed(viewer);
  const canDelete = viewer.role === "board";

  if (failed) {
    return (
      <p role="alert" className="mt-8 rounded-lg bg-red-500/10 px-3 py-2 text-red-700 dark:text-red-300">
        Posts couldn&apos;t load. Close and reopen the app to try again.
      </p>
    );
  }

  return (
    <>
      <section className="mt-8" aria-labelledby="events-heading">
        <h2 id="events-heading" className="font-serif text-2xl leading-tight">
          Upcoming events
        </h2>
        {events.length === 0 ? (
          <p className="mt-2 text-muted">No upcoming events yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {events.map((p) => (
              <EventItem key={p.id} post={p} now={now} canDelete={canDelete} />
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8" aria-labelledby="announcements-heading">
        <h2 id="announcements-heading" className="font-serif text-2xl leading-tight">
          Announcements
        </h2>
        {announcements.length === 0 ? (
          <p className="mt-2 text-muted">No announcements yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {announcements.map((p) => (
              <AnnouncementItem key={p.id} post={p} now={now} canDelete={canDelete} />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
