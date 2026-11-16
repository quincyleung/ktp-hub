"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { BellIcon } from "./icons";

// When this device last opened the notifications page. Kept on the device:
// it's only for the unread dot, so losing it just shows the dot again.
const KEY = "ktp:notifications-seen";
const EVENT = "ktp:notifications-seen";

function readSeen(): number {
  try {
    return Number(localStorage.getItem(KEY)) || 0;
  } catch {
    return 0;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

/** The bell in the top bar, with a dot when there's a notification you haven't seen in the app. */
export function Bell({ latest }: { latest: number | null }) {
  // -1 on the server, so the dot only appears once the device's state is known.
  const seen = useSyncExternalStore(subscribe, readSeen, () => -1);
  const unread = latest !== null && seen !== -1 && latest > seen;
  // Shaded, like the current tab, while you're on the notifications page.
  const active = usePathname() === "/notifications";
  return (
    <Link
      href="/notifications"
      aria-label={unread ? "Notifications (new)" : "Notifications"}
      aria-current={active ? "page" : undefined}
      className={`relative flex h-11 w-11 items-center justify-center rounded-full ${
        active ? "bg-accent/15 text-accent" : "text-foreground"
      }`}
    >
      <BellIcon className={active ? "h-6 w-6 [stroke-width:2.5]" : "h-6 w-6"} />
      {unread && (
        <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-background" />
      )}
    </Link>
  );
}

/** Rendered on the notifications page: marks everything up to `latest` as seen. */
export function MarkNotificationsSeen({ latest }: { latest: number | null }) {
  useEffect(() => {
    try {
      localStorage.setItem(KEY, String(Math.max(latest ?? 0, readSeen())));
      window.dispatchEvent(new Event(EVENT));
    } catch {
      // Private mode or storage blocked: the dot just stays.
    }
  }, [latest]);
  return null;
}
