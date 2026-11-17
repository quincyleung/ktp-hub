import { Suspense } from "react";

// Loading indicators. The big one is KTP's: a blue ring, like the points rings
// in KTP's app art, turning around the chapter's letters.

const RING = 21; // radius in a 48×48 box; the arc animation assumes this size

export function KtpSpinner({ size = 64 }: { size?: number }) {
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 48 48"
        aria-hidden="true"
        className="absolute inset-0 h-full w-full animate-ring-turn motion-reduce:animate-none"
      >
        <circle cx="24" cy="24" r={RING} fill="none" strokeWidth="4" className="stroke-line" />
        <circle
          cx="24"
          cy="24"
          r={RING}
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="60 132"
          className="origin-center -rotate-90 stroke-accent animate-ring-arc motion-reduce:animate-none"
        />
      </svg>
      <span
        aria-hidden="true"
        className="font-bold tracking-tight text-accent"
        style={{ fontSize: Math.round(size * 0.24) }}
      >
        ΚΘΠ
      </span>
    </span>
  );
}

// A page that's still loading: only the ring, in the middle of the screen
// (the top bar and tabs stay put). Every page's spinner sits in the same spot,
// so going from one loading step to the next doesn't jump.
export function PageLoading({ label = "Loading" }: { label?: string }) {
  return (
    <div role="status" className="pointer-events-none fixed inset-0 flex items-center justify-center">
      <span className="animate-spinner-in motion-reduce:animate-none">
        <KtpSpinner />
      </span>
      <span className="sr-only">{label}…</span>
    </div>
  );
}

// Wrap a page in this: the spinner until everything on it is ready, then the
// whole page eases in at once, instead of a header with a spinner under it.
export function PageSuspense({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <Suspense fallback={<PageLoading label={label} />}>
      <div className="animate-page-in motion-reduce:animate-none">{children}</div>
    </Suspense>
  );
}

// A small ring for inside buttons ("Saving…"). Takes the text color.
export function Spinner({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`animate-spin motion-reduce:animate-none ${className}`}>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
