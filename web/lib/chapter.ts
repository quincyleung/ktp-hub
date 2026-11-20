// The chapter's public Google Calendar. The app reads its events, and members
// can subscribe to it in their own calendar app.
export const GOOGLE_CALENDAR_ID = "uchicagoktp@gmail.com";

export const GOOGLE_CALENDAR_FEED = `https://calendar.google.com/calendar/ical/${encodeURIComponent(
  GOOGLE_CALENDAR_ID,
)}/public/basic.ics`;

/** Opens Google Calendar's "Add this calendar?" screen. */
export const SUBSCRIBE_GOOGLE = `https://calendar.google.com/calendar/u/0?cid=${btoa(GOOGLE_CALENDAR_ID)}`;

/** Subscribes in Apple Calendar or Outlook, which keep it in sync. */
export const SUBSCRIBE_WEBCAL = GOOGLE_CALENDAR_FEED.replace(/^https:/, "webcal:");

/** A Google Maps search that also works on iPhone and Android. Campus rooms get "University of Chicago" added. */
export function mapsUrl(location: string) {
  const query = /chicago/i.test(location) ? location : `${location}, University of Chicago`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** The app's address. Check-in QR codes link here, so a phone's camera app opens it too. */
export const APP_URL = "https://uchicago-ktphub.vercel.app";
