"use client";

import jsQR from "jsqr";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { GOAL, requirement } from "@/lib/points";
import { parseScan } from "@/lib/scan";
import { CheckIcon } from "./icons";
import { checkIn, sampleCheckIn, type CheckInResult } from "./points-actions";
import { Spinner } from "./spinner";
import { card, field, primaryButton, secondaryButton } from "./ui";

type Camera = "starting" | "on" | "blocked" | "none";

// Check in: the camera looks for a KTP check-in code. iPhone's own Camera app
// would open the code's link in Safari, where you're not signed in, so the
// scanning happens here, inside the app. Typing the 6 digits works too.
export default function Scanner({ guest }: { guest: boolean }) {
  const video = useRef<HTMLVideoElement>(null);
  const busy = useRef(false); // a code is being checked, or a result is showing
  const [camera, setCamera] = useState<Camera>("starting");
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [pending, startTransition] = useTransition();

  const submit = useCallback((run: () => Promise<CheckInResult>) => {
    busy.current = true;
    setHint(null);
    startTransition(async () => {
      const r = await run();
      setResult(r);
      if (r.ok) navigator.vibrate?.(40);
    });
  }, []);

  // The camera stays on while this page is open; codes are only read while
  // nothing else is going on.
  useEffect(() => {
    let stopped = false;
    let stream: MediaStream | null = null;
    let frame = 0;
    let last = 0;
    let hintTimer: ReturnType<typeof setTimeout> | undefined;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    const tick = (t: number) => {
      if (stopped) return;
      frame = requestAnimationFrame(tick);
      const v = video.current;
      if (!v || !ctx || busy.current || v.readyState < 2 || t - last < 120) return;
      last = t;
      // Read a smaller copy of the picture: quicker, and still sharp enough.
      const scale = Math.min(1, 640 / Math.max(v.videoWidth, v.videoHeight));
      const w = Math.round(v.videoWidth * scale);
      const h = Math.round(v.videoHeight * scale);
      if (!w || !h) return;
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(v, 0, 0, w, h);
      const found = jsQR(ctx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: "dontInvert" });
      if (!found?.data) return;
      if (!parseScan(found.data)) {
        setHint("That's not a KTP check-in code.");
        clearTimeout(hintTimer);
        hintTimer = setTimeout(() => setHint(null), 2500);
        return;
      }
      submit(() => checkIn(found.data));
    };

    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCamera("none");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      } catch (err) {
        const name = (err as DOMException)?.name;
        setCamera(name === "NotAllowedError" || name === "SecurityError" ? "blocked" : "none");
        return;
      }
      if (stopped || !video.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      video.current.srcObject = stream;
      await video.current.play().catch(() => {});
      setCamera("on");
      frame = requestAnimationFrame(tick);
    })();

    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      clearTimeout(hintTimer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [submit]);

  function again() {
    setResult(null);
    setTyped("");
    busy.current = false;
  }

  return (
    <div className="mt-4">
      <div
        className={`relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-3xl ${result ? "bg-surface" : "bg-black"}`}
      >
        <video
          ref={video}
          playsInline
          muted
          autoPlay
          aria-label="Camera"
          className={`h-full w-full object-cover ${camera === "on" ? "" : "invisible"}`}
        />
        {/* The square to aim with. */}
        {camera === "on" && !result && (
          <div aria-hidden="true" className="pointer-events-none absolute inset-[14%] rounded-2xl border-4 border-white/85" />
        )}
        {camera !== "on" && !result && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-white">
            {camera === "starting" && <Spinner className="h-8 w-8" />}
            {camera === "blocked" && (
              <p>
                KTP Hub can&apos;t use the camera. Allow camera access when your phone asks, or type the code
                below.
              </p>
            )}
            {camera === "none" && <p>No camera here. Type the 6-digit code under the QR code instead.</p>}
          </div>
        )}
        {pending && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
            <Spinner className="h-8 w-8" />
            <span className="sr-only">Checking in…</span>
          </div>
        )}
        {result && <ResultCard result={result} onAgain={again} />}
      </div>

      <p role="status" className="mt-3 min-h-6 text-center text-[15px] text-muted">
        {hint ?? (result ? "" : camera === "on" ? "Point at the code on the board's screen." : "")}
      </p>

      {!result && (
        <form
          className="mt-2 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (typed.replace(/\D/g, "").length === 6) submit(() => checkIn(typed));
          }}
        >
          <label className="min-w-0 flex-1">
            <span className="sr-only">6-digit code</span>
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value.replace(/[^\d ]/g, "").slice(0, 7))}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="Or type the 6-digit code"
              className={`${field} tracking-wide`}
            />
          </label>
          <button
            type="submit"
            disabled={pending || typed.replace(/\D/g, "").length !== 6}
            className="h-12 shrink-0 rounded-xl bg-navy px-5 font-semibold text-white transition active:opacity-80 disabled:opacity-40"
          >
            Check in
          </button>
        </form>
      )}

      {guest && !result && (
        <section className={`${card} mt-6`}>
          <h2 className="font-bold">Try it as a guest</h2>
          <p className="mt-1 text-[15px] text-muted">
            At a real event, the board shows a code that changes every 30 seconds. Open the sample code on
            another screen and scan it, or check in to the sample meeting right here.
          </p>
          <button type="button" className={primaryButton} disabled={pending} onClick={() => submit(sampleCheckIn)}>
            Check in to the sample meeting
          </button>
          <Link href="/checkin/sample" className={secondaryButton}>
            Show the sample code
          </Link>
        </section>
      )}
    </div>
  );
}

function ResultCard({ result, onAgain }: { result: CheckInResult; onAgain: () => void }) {
  return (
    <div className="absolute inset-0 flex animate-fade-in flex-col items-center justify-center bg-surface p-6 text-center motion-reduce:animate-none">
      {result.ok ? (
        <>
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-navy text-white">
            <CheckIcon className="h-9 w-9 [stroke-width:3]" />
          </span>
          <p className="mt-4 text-xl font-bold tracking-tight">
            {result.already ? "You're already checked in" : "You're checked in"}
          </p>
          <p className="mt-1 font-semibold">{result.title}</p>
          <p className="mt-1 text-[15px] text-muted">
            {result.already ? "" : `+${result.points} ${requirement(result.category).label} · `}
            {result.total !== null && `${result.total} of ${GOAL} points this quarter`}
          </p>
          <Link href="/points" className={`${primaryButton} max-w-60`}>
            See your points
          </Link>
        </>
      ) : (
        <>
          <p role="alert" className="font-semibold text-red-700 dark:text-red-300">
            {result.error}
          </p>
          <button type="button" onClick={onAgain} className={`${secondaryButton} max-w-60`}>
            Try again
          </button>
        </>
      )}
    </div>
  );
}
