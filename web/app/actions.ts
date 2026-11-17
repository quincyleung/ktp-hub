"use server";

import { parseSubscription, sendPush } from "@/lib/push";
import { db } from "@/lib/supabase";
import { getViewer } from "@/lib/viewer";

export type ActionResult = { ok: true } | { ok: false; error: string; gone?: boolean };
export type SaveResult = { ok: true; reminders: boolean } | { ok: false; error: string; gone?: boolean };

const WELCOME = {
  title: "You're all set",
  body: "You'll get a notification here when the board posts, and an hour before each event.",
  url: "/",
};

const TEST = {
  title: "Test notification",
  body: "If you can read this, notifications work on this device.",
  url: "/",
};

async function forget(endpoint: string) {
  await db().from("push_subscriptions").delete().eq("endpoint", endpoint);
}

// Saves this device for the signed-in person. With welcome=true, also sends
// the welcome notification (the moment someone taps Allow).
export async function saveDevice(input: unknown, welcome: boolean): Promise<SaveResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Sign in first." };

  const sub = parseSubscription(input);
  if (!sub) return { ok: false, error: "This device's notification setup doesn't look valid." };

  try {
    const { data, error } = await db()
      .from("push_subscriptions")
      .upsert({
        endpoint: sub.endpoint,
        user_id: viewer.userId,
        email: viewer.email,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
      })
      .select("reminders")
      .single();
    if (error) throw new Error(error.message);
    const reminders = data.reminders !== false;
    if (!welcome) return { ok: true, reminders };

    const result = await sendPush(sub, WELCOME);
    if (result.ok) return { ok: true, reminders };
    if (result.gone) {
      await forget(sub.endpoint);
      return { ok: false, gone: true, error: "This device's notification setup expired." };
    }
    return { ok: false, error: `The push service refused it (status ${result.statusCode ?? "unknown"}).` };
  } catch (err) {
    console.error("saveDevice failed:", err);
    return { ok: false, error: "The server couldn't save this device. Try again." };
  }
}

// Turns notifications off for one of the signed-in person's own devices.
export async function forgetDevice(endpoint: unknown): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Sign in first." };
  if (typeof endpoint !== "string" || !endpoint.startsWith("https://")) {
    return { ok: false, error: "This device's notification setup doesn't look valid." };
  }
  const { error } = await db()
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint)
    .eq("user_id", viewer.userId);
  if (error) {
    console.error("forgetDevice failed:", error.message);
    return { ok: false, error: "Notifications couldn't be turned off. Try again." };
  }
  return { ok: true };
}

// Turns event reminders on or off for one of the signed-in person's own devices.
export async function setReminders(endpoint: unknown, on: unknown): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Sign in first." };
  if (typeof endpoint !== "string" || !endpoint.startsWith("https://") || typeof on !== "boolean") {
    return { ok: false, error: "That didn't look right. Try again." };
  }
  const { error } = await db()
    .from("push_subscriptions")
    .update({ reminders: on })
    .eq("endpoint", endpoint)
    .eq("user_id", viewer.userId);
  if (error) {
    console.error("setReminders failed:", error.message);
    return { ok: false, error: "Event reminders couldn't be changed. Try again." };
  }
  return { ok: true };
}

// Sends a test notification to one of the signed-in person's own devices.
export async function sendTestToMe(input: unknown): Promise<ActionResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Sign in first." };

  const sub = parseSubscription(input);
  if (!sub) return { ok: false, error: "This device's notification setup doesn't look valid." };

  try {
    const { data } = await db()
      .from("push_subscriptions")
      .select("endpoint")
      .eq("endpoint", sub.endpoint)
      .eq("user_id", viewer.userId)
      .maybeSingle();
    if (!data) return { ok: false, gone: true, error: "This device isn't set up yet." };

    const result = await sendPush(sub, TEST);
    if (result.ok) {
      await db()
        .from("push_subscriptions")
        .update({ last_sent_at: new Date().toISOString() })
        .eq("endpoint", sub.endpoint);
      return { ok: true };
    }
    if (result.gone) {
      await forget(sub.endpoint);
      return { ok: false, gone: true, error: "This device's notification setup expired." };
    }
    return { ok: false, error: `The push service refused it (status ${result.statusCode ?? "unknown"}).` };
  } catch (err) {
    console.error("sendTestToMe failed:", err);
    return { ok: false, error: "The server couldn't send the notification." };
  }
}
