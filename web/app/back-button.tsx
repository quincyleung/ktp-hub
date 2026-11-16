"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "./icons";

// Goes back to wherever you came from, or Home if the app was opened here
// (for example from a notification).
export default function BackButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
      className="-ml-2 mb-3 inline-flex h-10 items-center gap-1 rounded-lg pr-3 font-semibold text-accent"
    >
      <ChevronLeft className="h-5 w-5" />
      Back
    </button>
  );
}
