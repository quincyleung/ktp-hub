import { dayKey } from "./time";

// Points reset every quarter. A quarter is stored as "2026-autumn".
const SEASONS = ["winter", "spring", "summer", "autumn"] as const;
type Season = (typeof SEASONS)[number];

const QUARTER = /^(\d{4})-(winter|spring|summer|autumn)$/;

export const isQuarter = (s: unknown): s is string => typeof s === "string" && QUARTER.test(s);

// Roughly UChicago's quarters, by the date in Chicago: Winter from Jan 1,
// Spring from Mar 22 (spring break), Summer from Jun 15, Autumn from Sep 15.
export function quarterOf(date: Date): string {
  const day = dayKey(date); // YYYY-MM-DD
  const md = day.slice(5);
  const season: Season = md < "03-22" ? "winter" : md < "06-15" ? "spring" : md < "09-15" ? "summer" : "autumn";
  return `${day.slice(0, 4)}-${season}`;
}

/** "Autumn 2026" */
export function quarterLabel(quarter: string): string {
  const m = QUARTER.exec(quarter);
  if (!m) return quarter;
  return `${m[2][0].toUpperCase()}${m[2].slice(1)} ${m[1]}`;
}

/** Oldest first. */
export function compareQuarters(a: string, b: string): number {
  const [ay, as] = a.split("-");
  const [by, bs] = b.split("-");
  return Number(ay) - Number(by) || SEASONS.indexOf(as as Season) - SEASONS.indexOf(bs as Season);
}
