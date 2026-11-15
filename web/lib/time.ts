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

const DAY = 24 * 60 * 60 * 1000;
const sameDay = (a: Date, b: Date) => dayKeyFmt.format(a) === dayKeyFmt.format(b);

/** "Today", "Tomorrow", or "Sun, Nov 16". */
export function eventDay(start: Date, now: Date) {
  if (sameDay(start, now)) return "Today";
  if (sameDay(start, new Date(now.getTime() + DAY))) return "Tomorrow";
  return dateFmt.format(start);
}

/** "7:00 PM" */
export const clockTime = (d: Date) => timeFmt.format(d);

/** "Sun, Nov 16, 7:00 PM". Used in notifications, which may be read days later. */
export const fullDateTime = (d: Date) => `${dateFmt.format(d)}, ${timeFmt.format(d)}`;

/** The little calendar square on event cards: { weekday: "Sun", day: "16" }. */
export const dateBadge = (d: Date) => ({ weekday: weekdayFmt.format(d), day: dayOfMonthFmt.format(d) });

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
