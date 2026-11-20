"use client";

import { useState, useTransition } from "react";
import { CHECKIN_CATEGORIES, requirement, type Category } from "@/lib/points";
import type { BoardEntry, DuesRow } from "@/lib/points-data";
import Avatar from "./avatar";
import { SearchIcon } from "./icons";
import { addPoints, removePoints, setDues } from "./points-actions";
import { Spinner } from "./spinner";
import { card, field, primaryButton, sectionTitle } from "./ui";

// Board: mark who's paid dues, and add points that don't come from a check-in.
export function DuesList({ people }: { people: DuesRow[] }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const shown = q ? people.filter((p) => p.name.toLowerCase().includes(q)) : people;
  const paid = people.filter((p) => p.paid).length;
  return (
    <section className="mt-4">
      <h2 className={sectionTitle}>Dues</h2>
      <p className="mt-1 text-[15px] text-muted">
        {paid} of {people.length} paid this quarter. Paying counts as the full {requirement("dues").max} dues points.
      </p>
      <label className="relative mt-3 block">
        <span className="sr-only">Search</span>
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search brothers"
          className="block h-11 w-full rounded-xl border border-transparent bg-surface pl-10 pr-3 text-[17px] outline-none placeholder:text-muted focus:border-accent focus:bg-background"
        />
      </label>
      <ul className="mt-2 divide-y divide-line">
        {shown.map((p) => (
          <DuesItem key={p.id} person={p} />
        ))}
      </ul>
    </section>
  );
}

function DuesItem({ person }: { person: DuesRow }) {
  const [paid, setPaid] = useState(person.paid);
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();
  function toggle() {
    const next = !paid;
    setPaid(next); // show it right away; undo if saving fails
    setError(false);
    startTransition(async () => {
      const r = await setDues(person.id, next);
      if (!r.ok) {
        setPaid(!next);
        setError(true);
      }
    });
  }
  return (
    <li className="flex items-center gap-3 py-2.5">
      <Avatar name={person.name} imageUrl={person.imageUrl} size={40} />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{person.name}</span>
        {error && <span className="block text-sm text-red-600 dark:text-red-400">Couldn&apos;t save. Try again.</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={paid}
        aria-label={`${person.name} paid dues`}
        onClick={toggle}
        disabled={pending}
        className={`relative h-8 w-[52px] shrink-0 rounded-full transition-colors ${paid ? "bg-navy" : "bg-line"}`}
      >
        <span
          className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-[left] ${paid ? "left-[24px]" : "left-1"}`}
        />
      </button>
    </li>
  );
}

export function AddPoints({ people, entries }: { people: { id: string; name: string }[]; entries: BoardEntry[] }) {
  const [memberId, setMemberId] = useState("");
  const [category, setCategory] = useState<Category>("service");
  const [points, setPoints] = useState(requirement("service").perEvent);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const r = await addPoints({ memberId, category, points, note });
      if (r.ok) {
        const name = people.find((p) => p.id === memberId)?.name ?? "them";
        setMessage({ ok: true, text: `Added ${points} ${requirement(category).label} points for ${name}.` });
        setMemberId("");
        setNote("");
      } else {
        setMessage({ ok: false, text: r.error });
      }
    });
  }

  return (
    <section className="mt-10">
      <h2 className={sectionTitle}>Add points</h2>
      <p className="mt-1 text-[15px] text-muted">
        For points that don&apos;t come from a check-in. Use a negative number to take points away.
      </p>
      <form onSubmit={onSubmit} className="mt-3 space-y-4">
        <label className="block">
          <span className="font-semibold">Brother</span>
          <select value={memberId} onChange={(e) => setMemberId(e.target.value)} required className={`mt-1 ${field}`}>
            <option value="">Pick someone</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <div className="flex gap-3">
          <label className="block min-w-0 flex-1">
            <span className="font-semibold">Counts toward</span>
            <select
              value={category}
              onChange={(e) => {
                const c = e.target.value as Category;
                setCategory(c);
                setPoints(requirement(c).perEvent);
              }}
              className={`mt-1 ${field}`}
            >
              {CHECKIN_CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block w-24 shrink-0">
            <span className="font-semibold">Points</span>
            <input
              type="number"
              inputMode="numeric"
              min={-30}
              max={30}
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
              className={`mt-1 ${field}`}
            />
          </label>
        </div>
        <label className="block">
          <span className="font-semibold">What for</span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            required
            maxLength={120}
            placeholder="e.g. Food bank volunteering"
            className={`mt-1 ${field}`}
          />
        </label>
        {message && (
          <p
            role={message.ok ? "status" : "alert"}
            className={`rounded-lg px-3 py-2 text-[15px] ${
              message.ok ? "bg-accent/10 text-accent" : "bg-red-500/10 text-red-700 dark:text-red-300"
            }`}
          >
            {message.text}
          </p>
        )}
        <button type="submit" className={primaryButton} disabled={pending}>
          {pending ? (
            <>
              <Spinner /> Adding…
            </>
          ) : (
            "Add points"
          )}
        </button>
      </form>

      {entries.length > 0 && (
        <div className={`${card} mt-6`}>
          <h3 className="font-bold">Added this quarter</h3>
          <ul className="mt-1 divide-y divide-line">
            {entries.map((e) => (
              <EntryItem key={e.id} entry={e} />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function EntryItem({ entry }: { entry: BoardEntry }) {
  const [confirm, setConfirm] = useState(false);
  const [pending, startTransition] = useTransition();
  return (
    <li className="flex items-center gap-3 py-2.5">
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{entry.name}</span>
        <span className="block truncate text-sm text-muted">
          {entry.note} · {requirement(entry.category).label}
        </span>
      </span>
      <span className="shrink-0 font-bold tabular-nums">{entry.points > 0 ? `+${entry.points}` : entry.points}</span>
      {confirm ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(async () => void (await removePoints(entry.id)))}
          className="h-9 shrink-0 rounded-lg bg-red-600 px-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? <Spinner className="h-4 w-4" /> : "Remove"}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setConfirm(true)}
          aria-label={`Remove ${entry.name}'s ${entry.points} points`}
          className="h-9 shrink-0 rounded-lg px-2 text-sm font-semibold text-red-600 dark:text-red-400"
        >
          Remove
        </button>
      )}
    </li>
  );
}
