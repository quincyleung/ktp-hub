"use server";

import { parseSubscription, sendPush } from "@/lib/push";

// Push test: sends a notification straight back to the device that asked.
// It only ever reaches the subscription passed in, so it can't spam anyone else.
export async function sendTestPush(
  input: unknown,
  kind: "welcome" | "test",
): Promise<{ ok: true } | { ok: false; error: string }> {
  const subscription = parseSubscription(input);
  if (!subscription) {
    return { ok: false, error: "This device's notification setup doesn't look valid." };
  }

  const payload =
    kind === "welcome"
      ? {
          title: "You're all set",
          body: "You'll get a notification here when the board posts an event or announcement.",
          url: "/",
        }
      : {
          title: "Test notification",
          body: "If you can read this, notifications work on this device.",
          url: "/",
        };

  try {
    const result = await sendPush(subscription, payload);
    if (result.ok) return { ok: true };
    return {
      ok: false,
      error: `The push service refused it (status ${result.statusCode ?? "unknown"}).`,
    };
  } catch (err) {
    console.error("sendTestPush failed", err);
    return { ok: false, error: "The server couldn't send the notification." };
  }
}
