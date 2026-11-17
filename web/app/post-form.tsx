"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createPost, type PostResult } from "./post-actions";
import { Spinner } from "./spinner";
import { card, field, primaryButton, secondaryButton } from "./ui";

// The board's form for a new announcement (the + button on Home).
// Events go on the chapter's Google Calendar instead.
export default function PostForm() {
  const router = useRouter();
  const [result, setResult] = useState<PostResult | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
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
      <p className="text-[15px] text-muted">
        Adding an event? Put it on the chapter&apos;s Google Calendar. It shows up in the app on its own.
      </p>

      <label className="block">
        <span className="font-semibold">Title</span>
        <input
          name="title"
          required
          maxLength={120}
          className={`mt-1 ${field}`}
          placeholder="e.g. Dues are due Friday"
        />
      </label>

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
