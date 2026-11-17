// Dates and times are shown in Chicago time, where the chapter is.
const TZ = "America/Chicago";

const dayKeyFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const timeFmt = new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit" });
const dateFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  weekday: "short",
  month: "short",
  day: "numeric",
});
const monthDayFmt = new Intl.DateTimeFormat("en-US", { timeZone: TZ, month: "short", day: "numeric" });
const weekdayFmt = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short" });
const dayOfMonthFmt = new Intl.DateTimeFormat("en-US", { timeZone: TZ, day: "numeric" });
const monthFmt = new Intl.DateTimeFormat("en-US", { timeZone: TZ, month: "short" });

const longDateFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  weekday: "long",
  month: "long",
  day: "numeric",
});

const DAY = 24 * 60 * 60 * 1000;
const sameDay = (a: Date, b: Date) => dayKeyFmt.format(a) === dayKeyFmt.format(b);

/** "2026-11-16": the day in Chicago, for grouping events by day. */
export const dayKey = (d: Date) => dayKeyFmt.format(d);

/** "Monday, November 16" */
export const longDate = (d: Date) => longDateFmt.format(d);

// A "YYYY-MM-DD" day as a Date at 18:00 UTC (noon in Chicago), which is the same day in
// Chicago and UTC, so it formats correctly without time-zone surprises.
const dayToDate = (day: string) => new Date(`${day}T18:00:00Z`);

/** "Monday, November 16" for a YYYY-MM-DD day. */
export const longDay = (day: string) => longDateFmt.format(dayToDate(day));

/** { weekday: "Mon", month: "Nov", day: "16" } for a YYYY-MM-DD day. */
export const dayBadge = (day: string) => dateBadge(dayToDate(day));

/** "Today", "Tomorrow", or "Sun, Nov 16" for a YYYY-MM-DD day. */
export function dayLabel(day: string, now: Date) {
  if (day === dayKey(now)) return "Today";
  if (day === dayKey(new Date(now.getTime() + DAY))) return "Tomorrow";
  return dateFmt.format(dayToDate(day));
}

/** "Today", "Tomorrow", or "Sun, Nov 16". */
export const eventDay = (start: Date, now: Date) => dayLabel(dayKey(start), now);

/** "7:00 PM" */
export const clockTime = (d: Date) => timeFmt.format(d);

/** "Sun, Nov 16, 7:00 PM". Used in notifications, which may be read days later. */
export const fullDateTime = (d: Date) => `${dateFmt.format(d)}, ${timeFmt.format(d)}`;

/** The little calendar square on event cards: { weekday: "Sun", month: "Nov", day: "16" }. */
export const dateBadge = (d: Date) => ({
  weekday: weekdayFmt.format(d),
  month: monthFmt.format(d),
  day: dayOfMonthFmt.format(d),
});

/** "Today", "Tomorrow", "In 3 days" (or "3 days ago") for a YYYY-MM-DD day. */
export function daysAway(day: string, now: Date) {
  const days = Math.round((Date.parse(day) - Date.parse(dayKey(now))) / DAY);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  return days > 0 ? `In ${days} days` : `${-days} days ago`;
}

/** "just now", "5 min ago", "3 h ago", "yesterday", or "Nov 12". */
export function timeAgo(then: Date, now: Date) {
  const mins = Math.floor((now.getTime() - then.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24 && sameDay(then, now)) return `${hours} h ago`;
  if (sameDay(then, new Date(now.getTime() - DAY))) return "yesterday";
  return monthDayFmt.format(then);
}

/** How long until something starts: "45 minutes", "1 hour", "9 hours". */
export function timeUntil(start: Date, now: Date) {
  const minutes = Math.max(1, Math.round((start.getTime() - now.getTime()) / 60000));
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  const hours = Math.round(minutes / 60);
  return `${hours} hour${hours === 1 ? "" : "s"}`;
}
