"use client";

import { useEffect, useState } from "react";
import { sendTestPush } from "./actions";

type Status =
  | "checking"
  | "in-app-browser" // Messenger, Instagram, etc. can't add to home screen
  | "needs-install" // iPhone in Safari: push only works from the home screen
  | "unsupported"
  | "ready"
  | "blocked"
  | "on";

type Device = {
  isIOS: boolean;
  isStandalone: boolean;
  permission: NotificationPermission | "unavailable";
};

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function currentPermission(): Device["permission"] {
  return typeof Notification === "undefined" ? "unavailable" : Notification.permission;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function checkDevice(): Promise<{ device: Device; status: Status }> {
  const ua = navigator.userAgent;
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  const device: Device = { isIOS, isStandalone, permission: currentPermission() };

  if (/FBAN|FBAV|FB_IAB|Instagram|Snapchat/.test(ua)) {
    return { device, status: "in-app-browser" };
  }
  if (isIOS && !isStandalone) return { device, status: "needs-install" };
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    return { device, status: "unsupported" };
  }

  try {
    const reg = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    });
    const sub = await reg.pushManager.getSubscription();
    if (sub) return { device, status: "on" };
    return { device, status: Notification.permission === "denied" ? "blocked" : "ready" };
  } catch {
    return { device, status: "unsupported" };
  }
}

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

const primaryButton =
  "mt-4 inline-flex h-12 w-full items-center justify-center rounded-lg bg-navy px-5 font-semibold text-white transition-opacity disabled:opacity-60";
const secondaryButton =
  "mt-4 inline-flex h-12 w-full items-center justify-center rounded-lg border border-line bg-background px-5 font-semibold transition-opacity disabled:opacity-60";

export default function PushSetup() {
  const [status, setStatus] = useState<Status>("checking");
  const [device, setDevice] = useState<Device | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    checkDevice().then((result) => {
      if (cancelled) return;
      setDevice(result.device);
      setStatus(result.status);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function turnOn() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      // Ask first, straight from the tap: iPhone only shows the prompt for a tap.
      const permission = await Notification.requestPermission();
      setDevice((d) => (d ? { ...d, permission } : d));
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "blocked" : "ready");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY),
        }));
      const result = await sendTestPush(sub.toJSON(), "welcome");
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
      const result = await sendTestPush(sub.toJSON(), "test");
      if (!result.ok) throw new Error(result.error);
      setMessage("Test sent. If you don't see it, lock your phone and wait a few seconds.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-xl border border-line bg-surface p-5">
      <h2 className="font-serif text-2xl leading-tight">Turn on notifications</h2>

      {status === "checking" && <p className="mt-2 text-muted">Checking this device…</p>}

      {status === "in-app-browser" && (
        <div className="mt-2 space-y-3">
          <p>
            You&apos;re in an in-app browser (like Messenger or Instagram), which can&apos;t
            add apps to your home screen.
          </p>
          <p>
            Tap the <b>•••</b> menu, choose <b>Open in browser</b>, and follow the steps there.
          </p>
        </div>
      )}

      {status === "needs-install" && (
        <div className="mt-2">
          <p>On iPhone, notifications only work once KTP Hub is on your home screen.</p>
          <ol className="mt-4 space-y-3">
            {[
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
                Open <b>KTP Hub</b> from your home screen, and turn on notifications there.
              </>,
            ].map((step, i) => (
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
      )}

      {status === "unsupported" && (
        <p className="mt-2">
          This browser can&apos;t get notifications. On iPhone, update to iOS 16.4 or later. On
          Android or a computer, try Chrome.
        </p>
      )}

      {status === "ready" && (
        <div className="mt-2">
          <p>Get a notification when the board posts an event or announcement.</p>
          <button type="button" className={primaryButton} onClick={turnOn} disabled={busy}>
            {busy ? "Turning on…" : "Turn on notifications"}
          </button>
          <p className="mt-2 text-sm text-muted">Your phone will ask for permission. Tap Allow.</p>
        </div>
      )}

      {status === "blocked" && (
        <div className="mt-2 space-y-3">
          <p>Notifications are blocked for KTP Hub.</p>
          <p>
            <b>iPhone:</b> Settings → Notifications → KTP Hub → turn on Allow Notifications. Then
            close and reopen KTP Hub.
          </p>
          <p>
            <b>Chrome:</b> tap the icon left of the address, and allow notifications.
          </p>
        </div>
      )}

      {status === "on" && (
        <div className="mt-2">
          <p className="font-semibold">Notifications are on ✓</p>
          <button type="button" className={secondaryButton} onClick={sendTest} disabled={busy}>
            {busy ? "Sending…" : "Send me a test notification"}
          </button>
        </div>
      )}

      {message && (
        <p role="status" className="mt-4 rounded-lg bg-accent/10 px-3 py-2 text-[15px]">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-[15px] text-red-700 dark:text-red-300">
          {error}
        </p>
      )}

      {device && (
        <p className="mt-5 text-xs text-muted">
          Device check: {device.isIOS ? "iPhone/iPad" : "not iPhone"} ·{" "}
          {device.isStandalone ? "opened from home screen" : "opened in browser"} · permission{" "}
          {device.permission}
        </p>
      )}
    </section>
  );
}
