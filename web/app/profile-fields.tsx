"use client";

import { useState } from "react";
import { MAX_LIST, MAX_NAME } from "@/lib/profile-fields";
import { ChevronRight, XIcon } from "./icons";
import { field } from "./ui";

export function GradYearSelect({ years, defaultValue }: { years: string[]; defaultValue: string | null }) {
  const current = defaultValue?.trim() ?? "";
  return (
    <label className="block">
      <span className="font-semibold">Graduation year</span>
      <span className="relative mt-1 block">
        <select
          name="year"
          required
          defaultValue={years.includes(current) ? current : ""}
          className={`${field} appearance-none pr-10`}
        >
          <option value="" disabled>
            Choose your year
          </option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <ChevronRight className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 rotate-90 text-muted" />
      </span>
    </label>
  );
}

type Item = { id: number; value: string; isNew: boolean };

// One box per major (or minor), with "+ Add another" for double majors.
export function ListInputs({
  name,
  label,
  noun,
  initial,
  required = false,
  placeholder,
  addFirst,
  addMore,
}: {
  name: string;
  label: string;
  noun: string; // "major", for "Remove major 2"
  initial: string[];
  required?: boolean;
  placeholder?: string;
  addFirst: string;
  addMore: string;
}) {
  const [items, setItems] = useState<Item[]>(() => {
    const start = initial.map((value, id) => ({ id, value, isNew: false }));
    return start.length > 0 || !required ? start : [{ id: 0, value: "", isNew: false }];
  });

  const add = () =>
    setItems((xs) => [...xs, { id: Math.max(-1, ...xs.map((x) => x.id)) + 1, value: "", isNew: true }]);
  const remove = (id: number) => setItems((xs) => xs.filter((x) => x.id !== id));
  const change = (id: number, value: string) =>
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, value } : x)));

  return (
    <fieldset>
      <legend className="font-semibold">
        {label}
        {!required && <span className="font-normal text-muted"> (optional)</span>}
      </legend>
      {items.map((item, i) => (
        <div key={item.id} className="mt-1 flex gap-2">
          <input
            name={name}
            value={item.value}
            onChange={(e) => change(item.id, e.target.value)}
            aria-label={items.length > 1 ? `${noun} ${i + 1}` : noun}
            placeholder={i === 0 ? placeholder : undefined}
            required={required && i === 0}
            maxLength={MAX_NAME}
            autoCapitalize="words"
            // Only boxes added with the button take focus, not the first one on page load.
            autoFocus={item.isNew}
            className={field}
          />
          {(!required || i > 0) && (
            <button
              type="button"
              onClick={() => remove(item.id)}
              aria-label={`Remove ${noun} ${i + 1}`}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface text-muted transition active:opacity-70"
            >
              <XIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      ))}
      {items.length < MAX_LIST && (
        <button type="button" onClick={add} className="mt-1 inline-flex h-11 items-center gap-1 font-semibold text-accent">
          + {items.length === 0 ? addFirst : addMore}
        </button>
      )}
    </fieldset>
  );
}
