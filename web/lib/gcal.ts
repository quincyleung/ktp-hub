import "server-only";
import { cacheLife } from "next/cache";
import { parseCalendarFeed, type CalendarItem } from "./calendar-feed";
import { GOOGLE_CALENDAR_FEED } from "./chapter";

// The chapter's Google Calendar, re-read at most about once a minute.
export async function getGoogleEvents(): Promise<CalendarItem[]> {
  "use cache";
  cacheLife("minutes");
  try {
    const res = await fetch(GOOGLE_CALENDAR_FEED);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return parseCalendarFeed(await res.text(), new Date());
  } catch (err) {
    console.error("Reading the Google Calendar failed:", err);
    return [];
  }
}
