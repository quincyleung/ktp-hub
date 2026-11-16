import ICAL from "ical.js";
import { dayKey } from "./time";

// One event on the calendar, from the chapter's Google Calendar or a board post.
export type CalendarItem = {
  key: string; // unique per occurrence, for React lists
  source: "google" | "app";
  postId?: string; // board posts open their own page
  title: string;
  start: string; // ISO time
  day: string; // YYYY-MM-DD in Chicago time
  allDay: boolean;
  location: string | null;
  details: string | null;
};

const DAY = 24 * 60 * 60 * 1000;

// Google Calendar descriptions can contain HTML. Keep the text and the links.
function plainText(html: string | null): string | null {
  if (!html) return null;
  const text = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li)>/gi, "\n")
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([^<]*)<\/a>/gi, (_, href: string, label: string) =>
      label && !href.includes(label) ? `${label} (${href})` : href,
    )
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return text || null;
}

/**
 * Turns an iCalendar feed into one item per occurrence between `daysBack`
 * days ago and `daysAhead` days from `now`, expanding repeating events.
 */
export function parseCalendarFeed(text: string, now: Date, daysBack = 120, daysAhead = 240): CalendarItem[] {
  const root = new ICAL.Component(ICAL.parse(text));
  for (const tz of root.getAllSubcomponents("vtimezone")) {
    ICAL.TimezoneService.register(tz);
  }
  const from = ICAL.Time.fromJSDate(new Date(now.getTime() - daysBack * DAY), true);
  const to = ICAL.Time.fromJSDate(new Date(now.getTime() + daysAhead * DAY), true);

  // Edited single occurrences of a repeating event come as separate entries.
  const series = new Map<string, ICAL.Event>();
  const edits: ICAL.Event[] = [];
  for (const vevent of root.getAllSubcomponents("vevent")) {
    const event = new ICAL.Event(vevent);
    if (event.isRecurrenceException()) edits.push(event);
    else series.set(event.uid, event);
  }
  for (const edit of edits) {
    const parent = series.get(edit.uid);
    if (parent) parent.relateException(edit);
    else series.set(`${edit.uid}|${edit.recurrenceId}`, edit);
  }

  const items: CalendarItem[] = [];
  const add = (event: ICAL.Event, start: ICAL.Time, end: ICAL.Time) => {
    if (event.component.getFirstPropertyValue("status") === "CANCELLED") return;
    if (end.compare(from) < 0 || start.compare(to) > 0) return;
    const allDay = start.isDate;
    const startDate = start.toJSDate();
    items.push({
      key: `g:${event.uid}:${start.toString()}`,
      source: "google",
      title: event.summary?.trim() || "KTP event",
      start: startDate.toISOString(),
      // All-day events have no time zone; their date is the day.
      day: allDay ? start.toString().slice(0, 10) : dayKey(startDate),
      allDay,
      location: event.location?.trim() || null,
      details: plainText(event.description ?? null),
    });
  };

  for (const event of series.values()) {
    if (!event.startDate) continue;
    if (!event.isRecurring()) {
      add(event, event.startDate, event.endDate ?? event.startDate);
      continue;
    }
    const occurrences = event.iterator();
    for (let next = occurrences.next(), n = 0; next && n < 1000; next = occurrences.next(), n++) {
      if (next.compare(to) > 0) break;
      const occurrence = event.getOccurrenceDetails(next);
      add(occurrence.item, occurrence.startDate, occurrence.endDate);
    }
  }

  return items.sort((a, b) => a.start.localeCompare(b.start));
}

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/**
 * Board posts and Google Calendar events, soonest first. When the board posts
 * an event that's also on the Google Calendar (same start time, similar
 * title), only the board post is shown.
 */
export function mergeCalendar(app: CalendarItem[], google: CalendarItem[]): CalendarItem[] {
  const duplicate = (g: CalendarItem) =>
    app.some((a) => {
      if (Math.abs(Date.parse(a.start) - Date.parse(g.start)) > 60_000) return false;
      const x = normalize(a.title);
      const y = normalize(g.title);
      return x === y || x.includes(y) || y.includes(x);
    });
  return [...app, ...google.filter((g) => !duplicate(g))].sort((a, b) => a.start.localeCompare(b.start));
}
