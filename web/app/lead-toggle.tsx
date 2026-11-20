"use client";

import { useState, useTransition } from "react";
import { setCommitteeLead } from "./profile-actions";
import { card } from "./ui";

// Board only, on a brother's profile: make them a committee lead, so they can
// run check-ins at their committee's meetings.
export default function LeadToggle({ memberId, name, isLead }: { memberId: string; name: string; isLead: boolean }) {
  const [on, setOn] = useState(isLead);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  function toggle() {
    const next = !on;
    setOn(next);
    setError(null);
    startTransition(async () => {
      const r = await setCommitteeLead(memberId, next);
      if (!r.ok) {
        setOn(!next);
        setError(r.error);
      }
    });
  }
  return (
    <div className={`${card} mt-6`}>
      <div className="flex items-center gap-3">
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">Committee lead</span>
          <span className="block text-[15px] text-muted">
            {name} can run check-ins for committee meetings.
          </span>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label="Committee lead"
          onClick={toggle}
          disabled={pending}
          className={`relative h-8 w-[52px] shrink-0 rounded-full transition-colors ${on ? "bg-navy" : "bg-line"}`}
        >
          <span
            className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-[left] ${on ? "left-[24px]" : "left-1"}`}
          />
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-[15px] text-red-700 dark:text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
