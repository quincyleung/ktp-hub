"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { clockTime, timeAgo } from "@/lib/time";
import Avatar from "./avatar";
import { checkinStatus, endCheckin, removePoints, type CheckinStatus } from "./points-actions";
import { Spinner } from "./spinner";
import { card, secondaryButton, sectionTitle } from "./ui";

// The screen the board holds up at an event: a QR code that changes every 30
// seconds (with its 6 digits for typing), and who's checked in so far. It
// asks the server for the new code the moment the old one runs out, and
// checks for new arrivals every few seconds. After the event, no more codes.
export default function CheckinDisplay({
  id,
  canRemove,
  canEnd,
}: {
  id: string;
  canRemove: boolean;
  canEnd: boolean;
}) {
  const [status, setStatus] = useState<CheckinStatus | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [reload, setReload] = useState(0);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function load() {
      const s = await checkinStatus(id).catch(() => null);
      if (!alive) return;
      if (s) setStatus(s);
      setNow(new Date());
      const wait = s?.ok && s.open ? Math.min(s.msLeft + 150, 4000) : 15000;
      timer = setTimeout(load, wait);
    }
    load();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [id, reload]);

  // Keep the screen on while the code is up, where the phone allows it.
  const open = status?.ok && status.open;
  const lock = useRef<WakeLockSentinel | null>(null);
  useEffect(() => {
    if (!open || !("wakeLock" in navigator)) return;
    let released = false;
    const take = () =>
      navigator.wakeLock
        .request("screen")
        .then((l) => {
          if (released) l.release().catch(() => {});
          else lock.current = l;
        })
        .catch(() => {});
    take();
    const again = () => document.visibilityState === "visible" && take();
    document.addEventListener("visibilitychange", again);
    return () => {
      released = true;
      document.removeEventListener("visibilitychange", again);
      lock.current?.release().catch(() => {});
    };
  }, [open]);

  if (!status) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-8 w-8 text-accent" />
      </div>
    );
  }
  if (!status.ok) {
    return (
      <p role="alert" className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-red-700 dark:text-red-300">
        {status.error}
      </p>
    );
  }

  const ends = new Date(status.endsAt);
  return (
    <>
      {status.open && status.qr && status.code ? (
        <section className="mt-4 flex flex-col items-center" aria-label="Check-in code">
          <div
            className="aspect-square w-full max-w-80 rounded-3xl bg-white p-5 shadow-sm [&>svg]:h-full [&>svg]:w-full"
            role="img"
            aria-label="QR code to check in"
            // The SVG comes from our own server's QR library, not from anyone's input.
            dangerouslySetInnerHTML={{ __html: status.qr }}
          />
          <p className="mt-4 font-mono text-[34px] font-bold tracking-[0.2em] tabular-nums" aria-label={`Code ${status.code.split("").join(" ")}`}>
            {status.code.slice(0, 3)} {status.code.slice(3)}
          </p>
          {/* Drains over the 30 seconds until the code changes. */}
          <div className="mt-2 h-1.5 w-full max-w-80 overflow-hidden rounded-full bg-line" aria-hidden="true">
            <div
              key={status.code}
              className="h-full origin-left rounded-full bg-accent animate-drain"
              style={{ animationDuration: `${status.msLeft}ms`, transform: `scaleX(${status.msLeft / 30000})` }}
            />
          </div>
          <p className="mt-2 text-center text-[15px] text-muted">
            The code changes every 30 seconds. Check-in closes at {clockTime(ends)}.
          </p>
        </section>
      ) : (
        <p className={`${card} mt-4 text-center font-semibold`}>Check-in closed at {clockTime(ends)}.</p>
      )}

      <section className="mt-8">
        <h2 className={sectionTitle} aria-live="polite">
          Checked in · {status.attendees.length}
        </h2>
        {status.attendees.length === 0 ? (
          <p className="mt-2 text-muted">Nobody yet.</p>
        ) : (
          <ul className="mt-2 divide-y divide-line">
            {status.attendees.map((a) => (
              <Attendee
                key={a.id}
                name={a.name}
                imageUrl={a.imageUrl}
                when={timeAgo(new Date(a.at), now)}
                onRemove={canRemove ? () => removePoints(a.id).then(() => setReload((n) => n + 1)) : null}
              />
            ))}
          </ul>
        )}
      </section>

      {canEnd && status.open && (
        <div className="mt-8">
          {confirmEnd ? (
            <div className={card}>
              <p className="font-semibold">End check-in now? The code stops working right away.</p>
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await endCheckin(id);
                    setConfirmEnd(false);
                    setReload((n) => n + 1);
                  })
                }
                className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 font-semibold text-white transition active:opacity-80 disabled:opacity-60"
              >
                {pending && <Spinner />} End check-in
              </button>
              <button type="button" className={secondaryButton} onClick={() => setConfirmEnd(false)}>
                Keep it open
              </button>
            </div>
          ) : (
            <button type="button" className={secondaryButton} onClick={() => setConfirmEnd(true)}>
              End check-in now
            </button>
          )}
        </div>
      )}
    </>
  );
}

function Attendee({
  name,
  imageUrl,
  when,
  onRemove,
}: {
  name: string;
  imageUrl: string | null;
  when: string;
  onRemove: (() => Promise<unknown>) | null;
}) {
  const [confirm, setConfirm] = useState(false);
  const [pending, startTransition] = useTransition();
  return (
    <li className="flex items-center gap-3 py-2.5">
      <Avatar name={name} imageUrl={imageUrl} size={40} />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{name}</span>
        <span className="block text-sm text-muted">{when}</span>
      </span>
      {onRemove &&
        (confirm ? (
          <span className="flex shrink-0 gap-1">
            <button
              type="button"
              disabled={pending}
              onClick={() => startTransition(async () => void (await onRemove()))}
              className="h-9 rounded-lg bg-red-600 px-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {pending ? <Spinner className="h-4 w-4" /> : "Remove"}
            </button>
            <button type="button" onClick={() => setConfirm(false)} className="h-9 rounded-lg px-2 text-sm font-semibold text-muted">
              Cancel
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirm(true)}
            aria-label={`Remove ${name}'s check-in`}
            className="h-9 shrink-0 rounded-lg px-3 text-sm font-semibold text-red-600 dark:text-red-400"
          >
            Remove
          </button>
        ))}
    </li>
  );
}
