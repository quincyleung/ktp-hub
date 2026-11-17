"use client";

import { useEffect, useState } from "react";
import { forgetDevice, saveDevice, sendTestToMe, setReminders } from "./actions";
import { useDevice } from "./device";

export type Status = "checking" | "unsupported" | "ready" | "blocked" | "on";

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

async function checkPushStatus(): Promise<{ status: Status; reminders?: boolean }> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    return { status: "unsupported" };
  }
  try {
    const reg = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    });
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      // Make sure the server knows this device belongs to whoever is signed in now.
      const saved = await saveDevice(sub.toJSON(), false);
      return { status: "on", reminders: saved.ok ? saved.reminders : true };
    }
    return { status: Notification.permission === "denied" ? "blocked" : "ready" };
  } catch {
    return { status: "unsupported" };
  }
}

/** This phone's notification state, plus turning them on and off and sending a test. */
export function usePush() {
  const device = useDevice();
  const canPush = !!device && !device.isInApp && !(device.isIOS && !device.isStandalone);

  const [status, setStatus] = useState<Status>("checking");
  const [busy, setBusy] = useState<"on" | "off" | "test" | "reminders" | null>(null);
  const [reminders, setRemindersState] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canPush) return;
    let cancelled = false;
    checkPushStatus().then((s) => {
      if (cancelled) return;
      setStatus(s.status);
      if (s.reminders !== undefined) setRemindersState(s.reminders);
    });
    return () => {
      cancelled = true;
    };
  }, [canPush]);

  async function turnOn() {
    setBusy("on");
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
      setRemindersState(result.reminders);
      setStatus("on");
      setMessage("Welcome notification sent. It should arrive in a few seconds.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setBusy(null);
    }
  }

  // Stops notifications on this phone: the server forgets it, and so does the browser.
  async function turnOff() {
    setBusy("off");
    setError(null);
    setMessage(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const result = await forgetDevice(sub.endpoint);
        if (!result.ok) throw new Error(result.error);
        await sub.unsubscribe();
      }
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setBusy(null);
    }
  }

  // Event reminders on or off for this phone (announcements still come).
  async function toggleReminders() {
    const next = !reminders;
    setBusy("reminders");
    setError(null);
    setMessage(null);
    setRemindersState(next);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (!sub) {
        setStatus("ready");
        return;
      }
      const result = await setReminders(sub.endpoint, next);
      if (!result.ok) throw new Error(result.error);
    } catch (err) {
      setRemindersState(!next);
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setBusy(null);
    }
  }

  async function sendTest() {
    setBusy("test");
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
        setMessage("Notifications were reset on this phone. Turn them on again.");
        return;
      }
      if (!result.ok) throw new Error(result.error);
      setMessage("Test sent. If you don't see it, lock your phone and wait a few seconds.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setBusy(null);
    }
  }

  return { device, canPush, status, busy, message, error, reminders, turnOn, turnOff, toggleReminders, sendTest };
}

/** The message or error after turning notifications on or sending a test. */
export function PushFeedback({ message, error }: { message: string | null; error: string | null }) {
  return (
    <>
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
    </>
  );
}

export function UnsupportedNote() {
  return (
    <p className="mt-2">
      This browser can&apos;t get notifications. On iPhone, update to iOS 16.4 or later. On Android,
      use Chrome.
    </p>
  );
}

export function BlockedNote() {
  return (
    <div className="mt-2 space-y-3">
      <p>Notifications are blocked for KTP Hub.</p>
      <p>
        <b>iPhone:</b> Settings → Notifications → KTP Hub → turn on Allow Notifications. Then close and
        reopen KTP Hub.
      </p>
      <p>
        <b>Android:</b> tap the icon left of the address, and allow notifications.
      </p>
    </div>
  );
}
