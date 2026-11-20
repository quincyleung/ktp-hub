import type { HistoryItem, Standings } from "./points-data";
import { rank, tally, type Category } from "./points";
import { SAMPLE_PROFILES } from "./sample-people";

// Made-up points for guests (like graders), so the Points tab and check-in
// look and work like they do for members without showing anyone's real points.
// For the course only: after it, guests won't get Points at all.

export const SAMPLE_EVENT = { title: "Sample chapter meeting", category: "chapter" as Category, points: 5 };

const entry = (id: string, category: Category, points: number, note: string, at: string): HistoryItem => ({
  id,
  category,
  points,
  note,
  at,
});

// A brother partway through the quarter: 65 points, with chapter and committee still to go.
const GUEST_HISTORY: HistoryItem[] = [
  entry("s-7", "service", 20, "Food bank volunteering", "2026-11-08T16:00:00Z"),
  entry("s-6", "committee", 5, "Product committee", "2026-10-28T23:30:00Z"),
  entry("s-5", "chapter", 5, "Chapter meeting", "2026-10-19T00:10:00Z"),
  entry("s-4", "committee", 5, "Product committee", "2026-10-14T23:30:00Z"),
  entry("s-3", "dues", 20, "Dues paid", "2026-10-06T17:00:00Z"),
  entry("s-2", "chapter", 5, "Chapter meeting", "2026-10-05T00:10:00Z"),
  entry("s-1", "membership", 5, "Rush info session", "2026-10-01T23:00:00Z"),
];

const SAMPLE_TOTALS: Record<string, number> = {
  "sample-1": 115,
  "sample-2": 100,
  "sample-3": 95,
  "sample-4": 80,
  "sample-5": 75,
  "sample-6": 60,
  "sample-7": 45,
};

/** The guest's Points tab. `checkedIn`: they've tried the sample check-in. */
export function sampleStandings(checkedIn: boolean, at: string | null): Standings {
  const history = checkedIn
    ? [entry("s-guest", SAMPLE_EVENT.category, SAMPLE_EVENT.points, SAMPLE_EVENT.title, at ?? new Date().toISOString()), ...GUEST_HISTORY]
    : GUEST_HISTORY;
  const mine = tally(history);
  const ranked = rank([
    ...SAMPLE_PROFILES.filter((p) => p.type !== "alumni").map((p) => ({
      id: p.id,
      name: p.name,
      imageUrl: null,
      total: SAMPLE_TOTALS[p.id] ?? 0,
    })),
    { id: "you", name: "You", imageUrl: null, total: mine.total },
  ]);
  return {
    mine,
    history,
    leaders: ranked.slice(0, 10),
    myRank: ranked.find((r) => r.id === "you") ?? null,
    failed: false,
  };
}

/** Sample brothers who've "checked in" on the sample code screen, a few minutes apart. */
export function sampleAttendees(now: number) {
  return SAMPLE_PROFILES.filter((p) => p.type !== "alumni")
    .slice(0, 5)
    .map((p, i) => ({ id: p.id, name: p.name, imageUrl: null, at: new Date(now - (i + 2) * 3 * 60_000).toISOString() }));
}
