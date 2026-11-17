"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { saveDevice, sendTestToMe } from "./actions";
import { useDevice } from "./device";
import { InAppBrowserNote, InstallSteps } from "./install-steps";
import { Spinner } from "./spinner";
import { card, primaryButton, sectionTitle } from "./ui";

type Status = "checking" | "unsupported" | "ready" | "blocked" | "on";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function subscribeFresh(reg: ServiceWorkerRegistration) {
  return reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY),
  });
}

async function checkPushStatus(): Promise<Status> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    return "unsupported";
  }
  try {
    const reg = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    });
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      // Make sure the server knows this device belongs to whoever is signed in now.
      await saveDevice(sub.toJSON(), false);
      return "on";
    }
    return Notification.permission === "denied" ? "blocked" : "ready";
  } catch {
    return "unsupported";
  }
}

// Where it's shown:
// - "home": a card that only shows until notifications are on (new people start here).
// - "banner": the bell page, just a "Turn on notifications" button while they're off.
// - "settings": the full card, with "Send a test" and the device check.
type Mode = "home" | "banner" | "settings";

// Home and the bell page only learn whether to show this after a quick check on
// the phone, so it slides open instead of shoving the posts down all at once.
// The inner padding keeps the button's focus outline from being clipped.
function SlideOpen({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid animate-expand motion-reduce:animate-none">
      <div className="-m-1 min-h-0 overflow-hidden p-1">{children}</div>
    </div>
  );
}

export default function PushSetup({ guest = false, mode = "home" }: { guest?: boolean; mode?: Mode }) {
  const device = useDevice();
  const canPush = !!device && !device.isInApp && !(device.isIOS && !device.isStandalone);

  const [status, setStatus] = useState<Status>("checking");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canPush) return;
    let cancelled = false;
    checkPushStatus().then((s) => {
      if (!cancelled) setStatus(s);
    });
    return () => {
      cancelled = true;
    };
  }, [canPush]);

  async function turnOn() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      // Ask first, straight from the tap: iPhone only shows the prompt for a tap.
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "blocked" : "ready");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      let sub = (await reg.pushManager.getSubscription()) ?? (await subscribeFresh(reg));
      let result = await saveDevice(sub.toJSON(), true);
      if (!result.ok && result.gone) {
        // The push service dropped this subscription (410). Start over once.
        await sub.unsubscribe();
        sub = await subscribeFresh(reg);
        result = await saveDevice(sub.toJSON(), true);
      }
      if (!result.ok) throw new Error(result.error);
      setStatus("on");
      setMessage("Welcome notification sent. It should arrive in a few seconds.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function sendTest() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (!sub) {
        setStatus("ready");
        return;
      }
      const result = await sendTestToMe(sub.toJSON());
      if (!result.ok && result.gone) {
        await sub.unsubscribe();
        setStatus("ready");
        setMessage("Notifications were reset on this device. Tap Turn on notifications again.");
        return;
      }
      if (!result.ok) throw new Error(result.error);
      setMessage("Test sent. If you don't see it, lock your phone and wait a few seconds.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  // On Home and the bell page, stay out of the way while checking and once
  // it's on, but keep showing the confirmation right after someone turns it on.
  const quietlyOn = status === "on" && !message && !error;
  if (mode !== "settings" && (!device || (canPush && (status === "checking" || quietlyOn)))) {
    return null;
  }

  const feedback = (
    <>
      {message && (
        <p role="status" className="mt-4 rounded-lg bg-accent/10 px-3 py-2 text-[15px]">
          {message}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-[15px] text-red-700 dark:text-red-300"
        >
          {error}
        </p>
      )}
    </>
  );

  if (mode === "banner") {
    if (canPush && (status === "ready" || status === "on")) {
      return (
        <SlideOpen>
          <div className="mt-2">
          {status === "ready" && (
            <button type="button" className={primaryButton} onClick={turnOn} disabled={busy}>
              {busy ? (
                <>
                  <Spinner /> Turning on…
                </>
              ) : (
                "Turn on notifications"
              )}
            </button>
          )}
          {feedback}
          </div>
        </SlideOpen>
      );
    }
    return (
      <SlideOpen>
        <p className="mt-4 rounded-lg bg-accent/10 px-3 py-2 text-[15px]">
          Notifications aren&apos;t on for this phone.{" "}
          <Link href="/settings" className="font-semibold text-accent underline underline-offset-2">
            See how in Settings
          </Link>
        </p>
      </SlideOpen>
    );
  }

  let body: React.ReactNode;
  const checking = !device || (canPush && status === "checking");
  if (checking) {
    // Takes a split second. Hold the space quietly instead of flashing a spinner.
    body = <div className="mt-2 h-10" aria-hidden="true" />;
  } else if (device.isInApp) {
    body = <InAppBrowserNote />;
  } else if (device.isIOS && !device.isStandalone) {
    body = <InstallSteps />;
  } else if (status === "unsupported") {
    body = (
      <p className="mt-2">
        This browser can&apos;t get notifications. On iPhone, update to iOS 16.4 or later. On
        Android, use Chrome.
      </p>
    );
  } else if (status === "blocked") {
    body = (
      <div className="mt-2 space-y-3">
        <p>Notifications are blocked for KTP Hub.</p>
        <p>
          <b>iPhone:</b> Settings → Notifications → KTP Hub → turn on Allow Notifications. Then
          close and reopen KTP Hub.
        </p>
        <p>
          <b>Android:</b> tap the icon left of the address, and allow notifications.
        </p>
      </div>
    );
  } else if (status === "on") {
    // Compact once it's on, so the posts stay near the top.
    body = (
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="font-semibold">On for this device ✓</p>
        <button
          type="button"
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-line bg-background px-4 text-[15px] font-semibold transition active:opacity-80 disabled:opacity-60"
          onClick={sendTest}
          disabled={busy}
        >
          {busy ? (
            <>
              <Spinner className="h-4 w-4" /> Sending…
            </>
          ) : (
            "Send a test"
          )}
        </button>
      </div>
    );
  } else {
    body = (
      <div className="mt-2">
        <p>
          {guest
            ? "Members get a notification when the board posts. As a guest, you can turn them on to try a test one."
            : "Get a notification when the board posts an event or announcement."}
        </p>
        <button type="button" className={primaryButton} onClick={turnOn} disabled={busy}>
          {busy ? (
                <>
                  <Spinner /> Turning on…
                </>
              ) : (
                "Turn on notifications"
              )}
        </button>
        <p className="mt-2 text-sm text-muted">Your phone will ask for permission. Tap Allow.</p>
      </div>
    );
  }

  const section = (
    <section className={`${card} ${mode === "home" ? "mt-6" : ""}`}>
      {mode === "home" && <h2 className={sectionTitle}>Notifications</h2>}
      {/* Fades in once the check is done (Settings shows the card while checking). */}
      <div key={checking ? "checking" : "ready"} className="animate-fade-in motion-reduce:animate-none">
        {body}
      </div>
      {feedback}
      {mode === "settings" && !checking && device && (
        <p className="mt-5 text-xs text-muted">
          Device check: {device.isIOS ? "iPhone/iPad" : "not iPhone"} ·{" "}
          {device.isStandalone ? "home screen" : "browser"} · {status}
        </p>
      )}
    </section>
  );
  return mode === "home" ? <SlideOpen>{section}</SlideOpen> : section;
}
