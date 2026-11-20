// The chapter's requirements each quarter, and how points add up.
// Shared by the server and the browser, so no secrets here.

export type Category = "chapter" | "dues" | "committee" | "service" | "membership" | "social";

export type Requirement = {
  key: Category;
  label: string;
  required: number; // points to meet the requirement
  max: number; // the most that count: chapter, service and social have a bonus past `required`
  perEvent: number; // what one check-in is worth, unless whoever starts it changes it
  bonus?: string;
};

export const REQUIREMENTS: Requirement[] = [
  // 4–5 chapter meetings a quarter, 5 points each. A fifth meeting is +5 extra.
  { key: "chapter", label: "Chapter", required: 20, max: 25, perEvent: 5, bonus: "+5 for a fifth meeting" },
  { key: "dues", label: "Dues", required: 20, max: 20, perEvent: 20 },
  { key: "committee", label: "Committee", required: 20, max: 20, perEvent: 5 },
  { key: "service", label: "Service & fundraising", required: 20, max: 30, perEvent: 20, bonus: "+10 for a second event" },
  { key: "membership", label: "Membership & rush", required: 20, max: 20, perEvent: 5 },
  { key: "social", label: "Social", required: 20, max: 30, perEvent: 20, bonus: "+10 for a second social" },
];

/** Points needed each quarter. The requirements add up to more, so there's room to spare. */
export const GOAL = 100;

export const CATEGORY_KEYS = REQUIREMENTS.map((r) => r.key);
export const isCategory = (s: unknown): s is Category => CATEGORY_KEYS.includes(s as Category);
export const requirement = (key: Category) => REQUIREMENTS.find((r) => r.key === key)!;

/** Dues aren't checked in to: the board marks who has paid. */
export const CHECKIN_CATEGORIES = REQUIREMENTS.filter((r) => r.key !== "dues");

export type Tally = {
  rows: (Requirement & { earned: number; counted: number; met: boolean })[];
  total: number;
  toGo: number;
  duesPaid: boolean;
};

// Each requirement counts up to its max, so bonuses come from the cap: a
// second service event or social is worth 20 like the first, and the max of
// 30 turns it into +10; a fifth chapter meeting's 5 fits under the max of 25.
export function tally(entries: { category: string; points: number }[]): Tally {
  const earned = new Map<string, number>();
  for (const e of entries) earned.set(e.category, (earned.get(e.category) ?? 0) + e.points);
  const rows = REQUIREMENTS.map((r) => {
    const raw = earned.get(r.key) ?? 0;
    const counted = Math.min(Math.max(raw, 0), r.max);
    return { ...r, earned: raw, counted, met: counted >= r.required };
  });
  const total = rows.reduce((sum, r) => sum + r.counted, 0);
  return {
    rows,
    total,
    toGo: Math.max(0, GOAL - total),
    duesPaid: (earned.get("dues") ?? 0) > 0,
  };
}

export type LeaderRow = { id: string; name: string; imageUrl: string | null; total: number; rank: number };

/** Highest first. Ties share a rank (1, 2, 2, 4). People with no points are left out. */
export function rank(people: { id: string; name: string; imageUrl: string | null; total: number }[]): LeaderRow[] {
  const sorted = people.filter((p) => p.total > 0).sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
  let rankSoFar = 0;
  return sorted.map((p, i) => {
    if (i === 0 || sorted[i - 1].total !== p.total) rankSoFar = i + 1;
    return { ...p, rank: rankSoFar };
  });
}
