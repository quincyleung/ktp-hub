function ShareIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="inline h-[1.1em] w-[1.1em] align-[-0.2em]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3v12" />
      <path d="M8 7l4-4 4 4" />
      <path d="M6 11v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-8" />
    </svg>
  );
}

// iPhone only: push works only from the home screen, and the home-screen app
// doesn't share sign-in with Safari, so people install first, then sign in.
export function InstallSteps() {
  const steps = [
    <>
      Tap <b>Share</b> <ShareIcon /> in Safari. On newer iPhones, tap <b>•••</b> first.
    </>,
    <>
      Scroll down and tap <b>Add to Home Screen</b>.
    </>,
    <>
      Tap <b>Add</b>.
    </>,
    <>
      Open <b>KTP Hub</b> from your home screen and sign in there.
    </>,
  ];
  return (
    <div className="mt-2">
      <p>On iPhone, KTP Hub works from your home screen. Add it first:</p>
      <ol className="mt-4 space-y-3">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-3">
            <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-navy text-sm font-bold text-white">
              {i + 1}
            </span>
            <span className="pt-0.5">{step}</span>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-sm text-muted">Needs iOS 16.4 or later.</p>
    </div>
  );
}

export function InAppBrowserNote() {
  return (
    <div className="mt-2 space-y-3">
      <p>
        You&apos;re in an in-app browser (like Messenger or Instagram), which can&apos;t add apps
        to your home screen.
      </p>
      <p>
        Tap the <b>•••</b> menu, choose <b>Open in browser</b>, and follow the steps there.
      </p>
    </div>
  );
}
