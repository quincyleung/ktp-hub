"use client";

import { useTransition } from "react";
import { resetSampleCheckIn } from "./points-actions";
import { Spinner } from "./spinner";
import { secondaryButton } from "./ui";

// Guests: undo the sample check-in so they can try it again.
export default function ResetSample() {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      className={secondaryButton}
      disabled={pending}
      onClick={() => startTransition(async () => void (await resetSampleCheckIn()))}
    >
      {pending ? <Spinner /> : null}
      Undo the sample check-in to try again
    </button>
  );
}
