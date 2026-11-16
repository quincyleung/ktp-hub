// Shared looks, so pages match: white pages, light gray cards, KTP blue.

export const card = "rounded-2xl bg-surface p-5";

export const primaryButton =
  "mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-navy px-5 font-semibold text-white transition active:opacity-80 disabled:opacity-60";

// White with an outline, so it still stands out inside a gray card.
export const secondaryButton =
  "mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-line bg-background px-5 font-semibold transition active:opacity-80 disabled:opacity-60";

// A text box or dropdown. Add a top margin where it sits under a label.
export const field =
  "block h-12 w-full rounded-xl border border-transparent bg-surface px-3.5 text-[17px] outline-none transition-colors placeholder:text-muted focus:border-accent focus:bg-background";

export const pageTitle = "text-[28px] font-bold leading-tight tracking-tight";
export const sectionTitle = "text-xl font-bold tracking-tight";

// A card you can tap: it gives a little as your finger presses it.
export const tappable = "transition active:scale-[0.98] active:opacity-90";

// Filter chips, like the term pills in KTP's app: solid blue when chosen, gray otherwise.
export const chip = (on: boolean) =>
  `inline-flex h-9 shrink-0 items-center rounded-full px-4 text-[15px] font-semibold transition-colors ${
    on ? "bg-navy text-white" : "bg-surface text-foreground"
  }`;
