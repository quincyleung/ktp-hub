"use client";

import { useState, useTransition } from "react";
import { createPost, type PostResult } from "./post-actions";
import { card, primaryButton, secondaryButton } from "./ui";

type Kind = "event" | "announcement";

const field =
  "mt-1 block h-12 w-full rounded-lg border border-line bg-background px-3 text-[17px] outline-none focus:border-accent";

export default function PostForm() {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<Kind>("event");
  const [result, setResult] = useState<PostResult | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    // The time picker gives local time with no time zone; send it as an exact instant.
    const local = String(data.get("starts_local") ?? "");
    if (local) data.set("starts_at", new Date(local).toISOString());
    data.delete("starts_local");

    setResult(null);
    startTransition(async () => {
      const r = await createPost(data);
      setResult(r);
      if (r.ok) {
        form.reset();
        setKind("event");
        setOpen(false);
      }
    });
  }

  const status = result && (
    <p
      role={result.ok ? "status" : "alert"}
      className={`mt-4 rounded-lg px-3 py-2 text-[15px] ${
        result.ok ? "bg-accent/10" : "bg-red-500/10 text-red-700 dark:text-red-300"
      }`}
    >
      {result.ok ? `${result.message} ✓` : result.error}
    </p>
  );

  if (!open) {
    return (
      <section className={`${card} mt-4`}>
        <h2 className="font-serif text-2xl leading-tight">Post to the chapter</h2>
        <button
          type="button"
          className={primaryButton}
          onClick={() => {
            setResult(null);
            setOpen(true);
          }}
        >
          New event or announcement
        </button>
        {status}
      </section>
    );
  }

  return (
    <section className={`${card} mt-4`}>
      <h2 className="font-serif text-2xl leading-tight">Post to the chapter</h2>
      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        <div role="radiogroup" aria-label="Type of post" className="grid grid-cols-2 gap-1 rounded-lg border border-line bg-background p-1">
          {(["event", "announcement"] as const).map((k) => (
            <label
              key={k}
              className={`flex h-10 cursor-pointer items-center justify-center rounded-md font-semibold has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent ${
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
            className={field}
            placeholder={kind === "event" ? "e.g. Study break" : "e.g. Dues are due Friday"}
          />
        </label>

        {kind === "event" && (
          <>
            <label className="block">
              <span className="font-semibold">When</span>
              <input name="starts_local" type="datetime-local" required className={`${field} appearance-none`} />
            </label>
            <label className="block">
              <span className="font-semibold">Where</span> <span className="text-muted">(optional)</span>
              <input name="location" maxLength={200} className={field} placeholder="e.g. Ida Noyes, 2nd floor" />
            </label>
          </>
        )}

        <label className="block">
          <span className="font-semibold">Details</span> <span className="text-muted">(optional)</span>
          <textarea
            name="body"
            rows={3}
            maxLength={2000}
            className={`${field} h-auto py-2`}
            placeholder={kind === "event" ? "Links (like Partiful) work here too." : ""}
          />
        </label>

        <label className="flex items-start gap-3">
          <input name="notify" type="checkbox" defaultChecked className="mt-1 h-5 w-5 shrink-0 accent-[#234c8b]" />
          <span>
            <span className="font-semibold">Notify everyone</span>
            <span className="block text-[15px] text-muted">
              Sends a notification to every member&apos;s phone. Uncheck for small updates; the post
              still shows on the homepage.
            </span>
          </span>
        </label>

        <div>
          <button type="submit" className={primaryButton} disabled={pending}>
            {pending ? "Posting…" : kind === "event" ? "Post event" : "Post announcement"}
          </button>
          <button
            type="button"
            className={secondaryButton}
            disabled={pending}
            onClick={() => {
              setResult(null);
              setOpen(false);
            }}
          >
            Cancel
          </button>
        </div>
      </form>
      {status}
    </section>
  );
}
