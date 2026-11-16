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

// For a page or section that's still loading.
export function Loading({ label = "Loading", className = "py-16" }: { label?: string; className?: string }) {
  return (
    <div role="status" className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <KtpSpinner />
      <p className="text-[15px] text-muted">{label}…</p>
    </div>
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
