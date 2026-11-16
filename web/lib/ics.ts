// "Add to calendar" for a single board-posted event. Events are given one hour,
// since posts only have a start time.
const HOUR = 60 * 60 * 1000;

type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  location: string | null;
  details: string | null;
  url: string;
};

const utcStamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const escapeText = (s: string) =>
  s.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/[,;]/g, (m) => `\\${m}`);

// Calendar files want lines of at most 75 characters; longer ones continue
// on the next line after a space.
function fold(line: string) {
  const parts: string[] = [];
  let rest = line;
  while (rest.length > 74) {
    parts.push(rest.slice(0, 74));
    rest = ` ${rest.slice(74)}`;
  }
  parts.push(rest);
  return parts.join("\r\n");
}

/** A .ics file that Apple Calendar, Outlook and Google Calendar can all open. */
export function eventIcs(e: CalendarEvent) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//KTP Hub//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${e.id}@ktp-hub`,
    `DTSTAMP:${utcStamp(new Date())}`,
    `DTSTART:${utcStamp(e.start)}`,
    `DTEND:${utcStamp(new Date(e.start.getTime() + HOUR))}`,
    `SUMMARY:${escapeText(e.title)}`,
    e.location ? `LOCATION:${escapeText(e.location)}` : null,
    `DESCRIPTION:${escapeText([e.details, e.url].filter(Boolean).join("\n\n"))}`,
    `URL:${e.url}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter((l): l is string => l !== null);
  return `${lines.map(fold).join("\r\n")}\r\n`;
}

/** Opens Google Calendar with the event filled in. */
export function googleCalendarLink(e: CalendarEvent) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${utcStamp(e.start)}/${utcStamp(new Date(e.start.getTime() + HOUR))}`,
    details: [e.details, e.url].filter(Boolean).join("\n\n"),
  });
  if (e.location) params.set("location", e.location);
  // Google expects a literal "/" between the start and end times.
  return `https://calendar.google.com/calendar/render?${params.toString().replace("%2F", "/")}`;
}
