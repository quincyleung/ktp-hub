import Link from "next/link";
import { getHomeFeed, type Post } from "@/lib/posts";
import { timeAgo } from "@/lib/time";
import EventCard from "./event-card";
import { ChevronRight, MegaphoneIcon, PlusIcon } from "./icons";
import { sectionTitle, tappable } from "./ui";

const SHOW_ANNOUNCEMENTS = 3;
const SHOW_EVENTS = 3;

function AnnouncementCard({ post, now }: { post: Post; now: Date }) {
  return (
    <Link
      href={`/posts/${post.id}`}
      className={`flex items-start gap-3 rounded-2xl bg-surface p-4 ${tappable}`}
    >
      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
        <MegaphoneIcon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold leading-snug">{post.title}</h3>
        {post.body && <p className="mt-1 line-clamp-3 whitespace-pre-line break-words">{post.body}</p>}
        <p className="mt-2 text-sm text-muted">
          {post.created_by.split(" ")[0]} · {timeAgo(new Date(post.created_at), now)}
        </p>
      </div>
      <ChevronRight className="mt-2.5 h-5 w-5 shrink-0 text-muted" />
    </Link>
  );
}

function AddButton({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-navy text-white transition active:opacity-80"
    >
      <PlusIcon className="h-5 w-5" />
    </Link>
  );
}

// Home: announcements first, then the next few events (from the chapter's
// Google Calendar). Board members get a + button to post an announcement.
export default async function HomeFeed({ isBoard }: { isBoard: boolean }) {
  const { now, upcoming, announcements, failed } = await getHomeFeed();
  const recent = announcements.slice(0, SHOW_ANNOUNCEMENTS);
  const older = announcements.slice(SHOW_ANNOUNCEMENTS);

  return (
    <>
      {failed && (
        <p role="alert" className="mt-6 rounded-lg bg-red-500/10 px-3 py-2 text-red-700 dark:text-red-300">
          Some posts couldn&apos;t load. Close and reopen the app to try again.
        </p>
      )}

      <section className="mt-8" aria-labelledby="announcements-heading">
        <div className="flex items-center justify-between gap-3">
          <h2 id="announcements-heading" className={sectionTitle}>
            Announcements
          </h2>
          {isBoard && <AddButton href="/new" label="Post an announcement" />}
        </div>
        {announcements.length === 0 ? (
          <p className="mt-2 text-muted">No announcements yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {recent.map((p) => (
              <li key={p.id}>
                <AnnouncementCard post={p} now={now} />
              </li>
            ))}
          </ul>
        )}
        {older.length > 0 && (
          <details className="group mt-2">
            <summary className="cursor-pointer list-none py-2 text-[15px] font-semibold text-accent [&::-webkit-details-marker]:hidden">
              <span className="group-open:hidden">Show {older.length} older</span>
              <span className="hidden group-open:inline">Hide older</span>
            </summary>
            <ul className="space-y-2">
              {older.map((p) => (
                <li key={p.id}>
                  <AnnouncementCard post={p} now={now} />
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      <section className="mt-8" aria-labelledby="upcoming-heading">
        <div className="flex items-center justify-between gap-3">
          <h2 id="upcoming-heading" className={sectionTitle}>
            Coming up
          </h2>
          <Link href="/calendar" className="text-[15px] font-semibold text-accent">
            Full calendar
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="mt-2 text-muted">Nothing on the calendar for the next month.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {upcoming.slice(0, SHOW_EVENTS).map((item) => (
              <li key={item.key}>
                <EventCard item={item} now={now} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
