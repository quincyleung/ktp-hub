import Link from "next/link";
import type { CalendarItem } from "@/lib/calendar-feed";
import { mapsUrl } from "@/lib/chapter";
import { clockTime, dayBadge, dayKey, daysAway } from "@/lib/time";
import { ChevronRight } from "./icons";
import { tappable } from "./ui";
import Linkified from "./linkified";

// One event in a list. Board posts open their own page; Google Calendar
// events expand in place to show the details.
export default function EventCard({
  item,
  now,
  showDate = true,
}: {
  item: CalendarItem;
  now: Date;
  showDate?: boolean;
}) {
  const time = item.allDay ? "All day" : clockTime(new Date(item.start));
  const past = item.day < dayKey(now);
  const badge = dayBadge(item.day);
  // With the date square showing month and day, the line under the title
  // only needs the weekday and time.
  const when = showDate ? `${badge.weekday} · ${time}` : time;
  const away = daysAway(item.day, now);

  const summary = (
    <>
      {showDate && (
        <div className="flex h-14 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-background text-accent shadow-[0_1px_2px_rgb(0_0_0/0.06)]">
          <span className="text-[11px] font-bold uppercase tracking-wide">{badge.month}</span>
          <span className="text-xl font-bold leading-none">{badge.day}</span>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-snug">{item.title}</h3>
          {showDate && (
            <span
              className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${
                away === "Today" ? "bg-navy text-white" : "bg-accent/10 text-accent"
              }`}
            >
              {away}
            </span>
          )}
        </div>
        <p className="text-[15px] text-muted">
          {when}
          {item.location && <> · {item.location}</>}
        </p>
      </div>
    </>
  );
  const box = `rounded-2xl bg-surface p-4 ${past ? "opacity-60" : ""}`;

  if (item.postId) {
    return (
      <Link href={`/posts/${item.postId}`} className={`${box} ${tappable} flex items-center gap-3`}>
        {summary}
        <ChevronRight className="h-5 w-5 shrink-0 text-muted" />
      </Link>
    );
  }

  if (!item.details && !item.location) {
    return <div className={`${box} flex items-center gap-3`}>{summary}</div>;
  }

  return (
    <details className={`${box} group`}>
      <summary className="flex cursor-pointer list-none items-center gap-3 [&::-webkit-details-marker]:hidden">
        {summary}
        <ChevronRight className="h-5 w-5 shrink-0 text-muted transition-transform group-open:rotate-90" />
      </summary>
      <div className="mt-3 space-y-2 border-t border-line pt-3 text-[15px]">
        {item.details && (
          <p className="whitespace-pre-line break-words">
            <Linkified text={item.details} />
          </p>
        )}
        {item.location && (
          <a
            href={mapsUrl(item.location)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block font-semibold text-accent underline underline-offset-2"
          >
            Open {item.location} in Maps
          </a>
        )}
        <p className="text-sm text-muted">From the KTP Google Calendar</p>
      </div>
    </details>
  );
}
