"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { GOAL, requirement } from "@/lib/points";
import { checkIn, type CheckInResult } from "./points-actions";
import { Spinner } from "./spinner";
import { primaryButton } from "./ui";

// One tap to check in from a code's link (opened by a phone's camera app).
// A button, not automatic, so opening the link by accident does nothing.
export default function LinkCheckin({ scanned }: { scanned: string }) {
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [pending, startTransition] = useTransition();

  if (result?.ok) {
    return (
      <div className="mt-6">
        <p className="text-xl font-bold">{result.already ? "You're already checked in" : "You're checked in"}</p>
        <p className="mt-1 font-semibold">{result.title}</p>
        <p className="mt-1 text-muted">
          {result.already ? "" : `+${result.points} ${requirement(result.category).label} · `}
          {result.total !== null && `${result.total} of ${GOAL} points this quarter`}
        </p>
        <Link href="/points" className={primaryButton}>
          See your points
        </Link>
      </div>
    );
  }
  return (
    <div className="mt-6">
      {result && (
        <p role="alert" className="mb-2 rounded-lg bg-red-500/10 px-3 py-2 text-red-700 dark:text-red-300">
          {result.error}
        </p>
      )}
      <button
        type="button"
        disabled={pending}
        className={primaryButton}
        onClick={() => startTransition(async () => setResult(await checkIn(scanned)))}
      >
        {pending && <Spinner />} Check in
      </button>
    </div>
  );
}
