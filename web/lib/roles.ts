// What someone is in the chapter, for badges and the People tab.
// `role` decides permissions (board can post); `status` from the roster sheet
// says pledge or alumni. Blank status means an active brother.
export type MemberType = "board" | "brother" | "pledge" | "alumni" | "guest";

export function memberType(role: string | null, status: string | null): MemberType {
  if (role === "board") return "board";
  const s = (status ?? "").toLowerCase();
  if (s.startsWith("pledge")) return "pledge";
  if (s.startsWith("alum")) return "alumni";
  return "brother";
}

export const BADGE: Record<MemberType, string> = {
  board: "Board",
  brother: "Brother",
  pledge: "Pledge",
  alumni: "Alum",
  guest: "Guest",
};
