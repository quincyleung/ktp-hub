"use client";

import { useMemo, useState } from "react";
import type { CalendarItem } from "@/lib/calendar-feed";
import { dayKey, longDay } from "@/lib/time";
import EventCard from "./event-card";
import { ChevronLeft, ChevronRight } from "./icons";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const pad = (n: number) => String(n).padStart(2, "0");

// A month grid with a dot on days that have events. Tap a day to see just
// that day; otherwise the list below shows the whole month.
export default function CalendarView({ items, nowIso }: { items: CalendarItem[]; nowIso: string }) {
  const now = useMemo(() => new Date(nowIso), [nowIso]);
  const today = dayKey(now);
  const [ty, tm] = today.split("-").map(Number);

  const [month, setMonth] = useState({ y: ty, m: tm - 1 });
  const [selected, setSelected] = useState<string | null>(null);

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    for (const item of items) {
      const list = map.get(item.day) ?? [];
      list.push(item);
      map.set(item.day, list);
    }
    return map;
  }, [items]);

  const firstWeekday = new Date(Date.UTC(month.y, month.m, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(month.y, month.m + 1, 0)).getUTCDate();
  const prefix = `${month.y}-${pad(month.m + 1)}-`;
  const isThisMonth = month.y === ty && month.m === tm - 1;

  const listDays = selected
    ? [selected]
    : [...byDay.keys()].filter((d) => d.startsWith(prefix)).sort();

  function go(delta: number) {
    setSelected(null);
    setMonth(({ y, m }) => {
      const d = new Date(Date.UTC(y, m + delta, 1));
      return { y: d.getUTCFullYear(), m: d.getUTCMonth() };
    });
  }

  return (
    <div className="mt-4">
      <div className="rounded-2xl bg-surface p-3">
        <div className="mb-2 flex items-center justify-between">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous month"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-accent"
          >
            <ChevronLeft />
          </button>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold tracking-tight" aria-live="polite">
              {MONTHS[month.m]} {month.y}
            </h2>
            {!isThisMonth && (
              <button
                type="button"
                onClick={() => {
                  setSelected(null);
                  setMonth({ y: ty, m: tm - 1 });
                }}
                className="rounded-full bg-background px-3 py-0.5 text-sm font-semibold text-accent"
              >
                Today
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next month"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-accent"
          >
            <ChevronRight />
          </button>
        </div>

        <div className="grid grid-cols-7 text-center text-xs font-bold text-muted" aria-hidden="true">
          {WEEKDAYS.map((w, i) => (
            <span key={i} className="py-1">
              {w}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1">
          {Array.from({ length: firstWeekday }, (_, i) => (
            <span key={`blank-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = `${prefix}${pad(i + 1)}`;
            const count = byDay.get(day)?.length ?? 0;
            const isSelected = selected === day;
            const isToday = day === today;
            return (
              <button
                key={day}
                type="button"
                onClick={() => setSelected(isSelected ? null : day)}
                aria-pressed={isSelected}
                aria-label={`${longDay(day)}${count ? `, ${count} event${count > 1 ? "s" : ""}` : ""}`}
                className={`mx-auto flex h-11 w-11 flex-col items-center justify-center rounded-full text-[15px] ${
                  isSelected
                    ? "bg-navy font-bold text-white"
                    : isToday
                      ? "font-bold text-accent ring-2 ring-accent"
                      : ""
                }`}
              >
                {i + 1}
                <span
                  className={`mt-0.5 h-1.5 w-1.5 rounded-full ${
                    count ? (isSelected ? "bg-white" : "bg-accent") : "bg-transparent"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {selected && (
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="text-[15px] font-semibold text-accent"
          >
            Show all of {MONTHS[month.m]}
          </button>
        )}
        {listDays.length === 0 && (
          <p className="text-muted">Nothing on the calendar in {MONTHS[month.m]}.</p>
        )}
        {listDays.map((day) => {
          const dayItems = byDay.get(day) ?? [];
          return (
            <section key={day}>
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted">
                {day === today ? "Today · " : ""}
                {longDay(day)}
              </h3>
              {dayItems.length === 0 ? (
                <p className="text-muted">Nothing on this day.</p>
              ) : (
                <ul className="space-y-2">
                  {dayItems.map((item) => (
                    <li key={item.key}>
                      <EventCard item={item} now={now} showDate={false} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
