"use client";

import { useMemo, useState } from "react";
import type { CalendarItem } from "@/lib/calendar-feed";
import { dayKey, longDay } from "@/lib/time";
import EventCard from "./event-card";
import { ChevronLeft, ChevronRight } from "./icons";
import { sectionTitle } from "./ui";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const pad = (n: number) => String(n).padStart(2, "0");
const DAY_MS = 24 * 60 * 60 * 1000;

/** The 7 days (Sunday to Saturday) of the week that `day` is in, as YYYY-MM-DD. */
function weekOf(day: string): string[] {
  const [y, m, d] = day.split("-").map(Number);
  const date = Date.UTC(y, m - 1, d);
  const sunday = date - new Date(date).getUTCDay() * DAY_MS;
  return Array.from({ length: 7 }, (_, i) => new Date(sunday + i * DAY_MS).toISOString().slice(0, 10));
}

// A month grid with a dot on days that have events. Below it: this week's
// events, or just one day once it's tapped (or opened from a reminder).
export default function CalendarView({
  items,
  nowIso,
  initialDay = null,
}: {
  items: CalendarItem[];
  nowIso: string;
  initialDay?: string | null;
}) {
  const now = useMemo(() => new Date(nowIso), [nowIso]);
  const today = dayKey(now);
  const [ty, tm] = today.split("-").map(Number);

  const [iy, im] = (initialDay ?? today).split("-").map(Number);
  const [month, setMonth] = useState({ y: iy, m: im - 1 });
  const [selected, setSelected] = useState<string | null>(initialDay);

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

  const week = useMemo(() => weekOf(today), [today]);
  // "week": this week's events. "day": one tapped day. "pick": another month, nothing tapped yet.
  const mode = selected ? "day" : isThisMonth ? "week" : "pick";
  const listDays = mode === "day" ? [selected!] : mode === "week" ? week.filter((d) => byDay.has(d)) : [];

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
              <div key={day}>
                <button
                  type="button"
                  onClick={() => setSelected(isSelected ? null : day)}
                  aria-pressed={isSelected}
                  aria-label={`${longDay(day)}${count ? `, ${count} event${count > 1 ? "s" : ""}` : ""}`}
                  className={`mx-auto flex h-11 w-11 flex-col items-center justify-center rounded-full text-[15px] transition-colors ${
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
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6">
        {mode === "pick" ? (
          <p className="text-muted">Tap a date to see what&apos;s on.</p>
        ) : (
          <>
            <div className="flex items-baseline justify-between gap-3">
              <h2 className={sectionTitle}>
                {mode === "week" ? "This week" : selected === today ? `Today · ${longDay(today)}` : longDay(selected!)}
              </h2>
              {mode === "day" && (
                <button
                  type="button"
                  onClick={() => {
                    setSelected(null);
                    setMonth({ y: ty, m: tm - 1 });
                  }}
                  className="shrink-0 text-[15px] font-semibold text-accent"
                >
                  This week
                </button>
              )}
            </div>
            {listDays.length === 0 ? (
              <p className="mt-2 text-muted">
                {mode === "week" ? "Nothing on the calendar this week." : "Nothing on this day."}
              </p>
            ) : (
              <div key={mode === "day" ? selected : "week"} className="mt-3 animate-fade-in space-y-5 motion-reduce:animate-none">
                {listDays.map((day) => (
                  <section key={day}>
                    {/* In the week view, each day gets a small label. */}
                    {mode === "week" && (
                      <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted">
                        {day === today ? "Today · " : ""}
                        {longDay(day)}
                      </h3>
                    )}
                    <ul className="space-y-2">
                      {(byDay.get(day) ?? []).map((item) => (
                        <li key={item.key}>
                          <EventCard item={item} now={now} showDate={false} />
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
