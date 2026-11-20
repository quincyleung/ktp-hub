"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CHECKIN_CATEGORIES, requirement, type Category } from "@/lib/points";
import { startCheckin } from "./points-actions";
import { Spinner } from "./spinner";
import { field, primaryButton } from "./ui";

export type TodayEvent = { key: string; title: string; time: string };

const LENGTHS = [
  { minutes: 30, label: "30 minutes" },
  { minutes: 60, label: "1 hour" },
  { minutes: 120, label: "2 hours" },
  { minutes: 180, label: "3 hours" },
];

// A good first guess at the kind of event, from its name. Easy to change.
function guessCategory(title: string): Category {
  const t = title.toLowerCase();
  if (/chapter/.test(t)) return "chapter";
  if (/social|formal|mixer|party/.test(t)) return "social";
  if (/service|volunteer|fundrais|philanthropy/.test(t)) return "service";
  if (/rush|recruit|info session|coffee chat/.test(t)) return "membership";
  if (/committee/.test(t)) return "committee";
  return "chapter";
}

// Board and committee leads: pick today's event (or name one), what kind it
// is and what it's worth, then show the code.
export default function StartCheckin({ events, isLead }: { events: TodayEvent[]; isLead: boolean }) {
  const router = useRouter();
  const [choice, setChoice] = useState<string>(events[0]?.key ?? "other");
  const [title, setTitle] = useState("");
  const [minutes, setMinutes] = useState(120);
  const first = isLead ? "committee" : events[0] ? guessCategory(events[0].title) : "chapter";
  const [category, setCategory] = useState<Category>(first);
  const [points, setPoints] = useState(requirement(first).perEvent);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function pickEvent(key: string) {
    setChoice(key);
    const event = events.find((e) => e.key === key);
    if (event && !isLead) pickCategory(guessCategory(event.title));
  }
  function pickCategory(c: Category) {
    setCategory(c);
    setPoints(requirement(c).perEvent);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const r = await startCheckin(
        choice === "other" ? { title, minutes, category, points } : { eventKey: choice, category, points },
      );
      if (r.ok) router.push(`/checkin/${r.id}`);
      else setError(r.error);
    });
  }

  const option = (on: boolean) =>
    `flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 transition-colors ${
      on ? "border-accent bg-accent/5" : "border-transparent bg-surface"
    }`;

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-6">
      <fieldset>
        <legend className="font-semibold">Which event?</legend>
        <div className="mt-2 space-y-2">
          {events.map((ev) => (
            <label key={ev.key} className={option(choice === ev.key)}>
              <input
                type="radio"
                name="event"
                checked={choice === ev.key}
                onChange={() => pickEvent(ev.key)}
                className="h-5 w-5 shrink-0 accent-navy"
              />
              <span className="min-w-0">
                <span className="block truncate font-semibold">{ev.title}</span>
                <span className="block text-[15px] text-muted">{ev.time}</span>
              </span>
            </label>
          ))}
          <label className={option(choice === "other")}>
            <input
              type="radio"
              name="event"
              checked={choice === "other"}
              onChange={() => setChoice("other")}
              className="h-5 w-5 shrink-0 accent-navy"
            />
            <span className="font-semibold">{events.length ? "Something else" : "Name the event"}</span>
          </label>
        </div>
        {events.length === 0 && (
          <p className="mt-2 text-[15px] text-muted">Nothing on the chapter calendar today.</p>
        )}
      </fieldset>

      {choice === "other" && (
        <div className="space-y-4">
          <label className="block">
            <span className="font-semibold">Event name</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={120}
              placeholder={isLead ? "e.g. Product committee" : "e.g. Chapter meeting"}
              className={`mt-1 ${field}`}
            />
          </label>
          <label className="block">
            <span className="font-semibold">Check-in stays open for</span>
            <select value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} className={`mt-1 ${field}`}>
              {LENGTHS.map((l) => (
                <option key={l.minutes} value={l.minutes}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      <div className="flex gap-3">
        <label className="block min-w-0 flex-1">
          <span className="font-semibold">Counts toward</span>
          {isLead ? (
            <p className={`mt-1 ${field} flex items-center text-muted`}>Committee</p>
          ) : (
            <select
              value={category}
              onChange={(e) => pickCategory(e.target.value as Category)}
              className={`mt-1 ${field}`}
            >
              {CHECKIN_CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          )}
        </label>
        <label className="block w-24 shrink-0">
          <span className="font-semibold">Points</span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={30}
            value={points}
            onChange={(e) => setPoints(Number(e.target.value))}
            className={`mt-1 ${field}`}
          />
        </label>
      </div>
      {requirement(category).bonus && (
        <p className="-mt-3 text-[15px] text-muted">
          {requirement(category).label} counts up to {requirement(category).max} points (
          {requirement(category).bonus}).
        </p>
      )}

      {error && (
        <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-[15px] text-red-700 dark:text-red-300">
          {error}
        </p>
      )}
      <button type="submit" className={primaryButton} disabled={pending}>
        {pending ? (
          <>
            <Spinner /> Starting…
          </>
        ) : (
          "Show the code"
        )}
      </button>
    </form>
  );
}
