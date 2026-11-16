// Rules for graduation year, majors and minors. Shared by the onboarding and
// profile forms (in the browser) and the save actions (on the server).

export const MAX_LIST = 3; // majors, or minors
export const MAX_NAME = 60; // characters in one major or minor

export function isGradYear(v: string | null | undefined): v is string {
  return !!v && /^\d{4}$/.test(v.trim());
}

// "Computer Science, Economics" -> ["Computer Science", "Economics"]
export function splitList(v: string | null | undefined): string[] {
  return (v ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// Years to pick from: current students' classes, seniors to first-years
// (2027-2030 in fall 2026). The school year turns over in July. A member whose
// saved year is outside that range (an alum, say) keeps it as an option.
export function gradYearOptions(now: Date, current?: string | null): string[] {
  const seniors = now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear();
  const years = new Set<string>();
  for (let y = seniors; y <= seniors + 3; y++) years.add(String(y));
  if (isGradYear(current)) years.add(current.trim());
  return [...years].sort();
}

// Members are asked to set up their profile until they have both.
export function profileIsComplete(p: { year: string | null; major: string | null }): boolean {
  return isGradYear(p.year) && splitList(p.major).length > 0;
}
