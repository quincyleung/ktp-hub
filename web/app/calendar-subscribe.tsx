"use client";

import { useCallback, useRef, useState } from "react";
import { SUBSCRIBE_GOOGLE, SUBSCRIBE_WEBCAL } from "@/lib/chapter";
import { CalendarPlusIcon } from "./icons";
import { useDismiss } from "./use-dismiss";

const option =
  "flex h-11 w-full items-center justify-center rounded-xl border border-line bg-background px-3 text-[15px] font-semibold transition active:opacity-80";

// The button at the top right of Calendar: subscribe to the chapter's Google
// Calendar in your own calendar app. It's a one-time setup, so it stays tucked away.
export default function CalendarSubscribe() {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);

  useDismiss(box, open, close);

  return (
    <div ref={box} className="relative -mr-2 shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="calendar-subscribe"
        aria-label="Add KTP events to your calendar"
        className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
          open ? "bg-accent/10 text-accent" : "text-foreground"
        }`}
      >
        <CalendarPlusIcon />
      </button>
      {open && (
        <div
          id="calendar-subscribe"
          className="absolute right-0 top-full z-30 mt-2 w-72 animate-fade-in rounded-2xl border border-line bg-background p-4 shadow-lg motion-reduce:animate-none"
        >
          <h2 className="font-bold tracking-tight">Add KTP events to your calendar</h2>
          <div className="mt-3 space-y-2">
            <a href={SUBSCRIBE_WEBCAL} className={option}>
              Apple or Outlook
            </a>
            <a href={SUBSCRIBE_GOOGLE} target="_blank" rel="noopener noreferrer" className={option}>
              Google Calendar
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
