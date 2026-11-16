"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createPost, type PostResult } from "./post-actions";
import { Spinner } from "./spinner";
import { card, field, primaryButton, secondaryButton } from "./ui";

export type Kind = "event" | "announcement";


// The board's form for a new event or announcement (the + buttons on Home).
export default function PostForm({ initialKind }: { initialKind: Kind }) {
  const router = useRouter();
  const [kind, setKind] = useState<Kind>(initialKind);
  const [result, setResult] = useState<PostResult | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    // The time picker gives local time with no time zone; send it as an exact instant.
    const local = String(data.get("starts_local") ?? "");
    if (local) data.set("starts_at", new Date(local).toISOString());
    data.delete("starts_local");

    setResult(null);
    startTransition(async () => {
      setResult(await createPost(data));
    });
  }

  if (result?.ok) {
    return (
      <section className={`${card} mt-4`}>
        <p role="status" className="font-semibold">
          {result.message} ✓
        </p>
        <Link href="/" className={primaryButton}>
          Back to Home
        </Link>
        <button type="button" className={secondaryButton} onClick={() => setResult(null)}>
          Post another
        </button>
      </section>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-4">
      <div
        role="radiogroup"
        aria-label="Type of post"
        className="grid grid-cols-2 gap-1 rounded-xl bg-surface p-1"
      >
        {(["event", "announcement"] as const).map((k) => (
          <label
            key={k}
            className={`flex h-10 cursor-pointer items-center justify-center rounded-lg font-semibold transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent ${
              kind === k ? "bg-navy text-white" : "text-muted"
            }`}
          >
            <input
              type="radio"
              name="kind"
              value={k}
              checked={kind === k}
              onChange={() => setKind(k)}
              className="sr-only"
            />
            {k === "event" ? "Event" : "Announcement"}
          </label>
        ))}
      </div>

      <label className="block">
        <span className="font-semibold">Title</span>
        <input
          name="title"
          required
          maxLength={120}
          className={`mt-1 ${field}`}
          placeholder={kind === "event" ? "e.g. Resume and LinkedIn reviews" : "e.g. Dues are due Friday"}
        />
      </label>

      {kind === "event" && (
        <>
          <label className="block">
            <span className="font-semibold">When</span>
            <input name="starts_local" type="datetime-local" required className={`mt-1 ${field} appearance-none`} />
          </label>
          <label className="block">
            <span className="font-semibold">Where</span> <span className="text-muted">(optional)</span>
            <input name="location" maxLength={200} className={`mt-1 ${field}`} placeholder="e.g. Harper 148" />
          </label>
        </>
      )}

      <label className="block">
        <span className="font-semibold">Details</span> <span className="text-muted">(optional)</span>
        <textarea
          name="body"
          rows={4}
          maxLength={2000}
          className={`mt-1 ${field} h-auto py-2`}
          placeholder="Links (like Partiful) work here too."
        />
      </label>

      <label className="flex items-start gap-3">
        <input name="notify" type="checkbox" defaultChecked className="mt-1 h-5 w-5 shrink-0 accent-navy" />
        <span>
          <span className="font-semibold">Notify everyone</span>
          <span className="block text-[15px] text-muted">
            Sends a notification to every member&apos;s phone. Uncheck for small updates; the post
            still shows in the app.
          </span>
        </span>
      </label>

      {result && !result.ok && (
        <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-[15px] text-red-700 dark:text-red-300">
          {result.error}
        </p>
      )}

      <div>
        <button type="submit" className={primaryButton} disabled={pending}>
          {pending ? (
            <>
              <Spinner /> Posting…
            </>
          ) : kind === "event" ? (
            "Post event"
          ) : (
            "Post announcement"
          )}
        </button>
        <button
          type="button"
          className={secondaryButton}
          disabled={pending}
          onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
