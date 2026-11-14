import {
  sendNotification,
  setVapidDetails,
  type PushSubscription,
} from "web-push";

export type PushPayload = { title: string; body: string; url?: string };

// Only real browser push services. The endpoint comes from the browser, so
// without this check anyone could make our server send requests to any URL.
const PUSH_HOSTS = [
  "fcm.googleapis.com", // Chrome, Android
  "web.push.apple.com", // Safari, iPhone home-screen apps
  "updates.push.services.mozilla.com", // Firefox
];
const PUSH_HOST_SUFFIXES = [".push.apple.com", ".notify.windows.com"];

export function parseSubscription(input: unknown): PushSubscription | null {
  if (!input || typeof input !== "object") return null;
  const { endpoint, keys } = input as {
    endpoint?: unknown;
    keys?: { p256dh?: unknown; auth?: unknown };
  };
  if (typeof endpoint !== "string" || endpoint.length > 2048) return null;
  if (!keys || typeof keys.p256dh !== "string" || typeof keys.auth !== "string") {
    return null;
  }

  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return null;
  }
  const host = url.hostname;
  const knownHost =
    PUSH_HOSTS.includes(host) || PUSH_HOST_SUFFIXES.some((s) => host.endsWith(s));
  if (url.protocol !== "https:" || !knownHost) return null;

  return { endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } };
}

let configured = false;

function configure() {
  if (configured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const subject =
    process.env.VAPID_SUBJECT ?? (productionHost ? `https://${productionHost}` : undefined);
  if (!publicKey || !privateKey || !subject) {
    throw new Error("Push keys are not configured on the server.");
  }
  setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export type SendResult =
  | { ok: true }
  | { ok: false; statusCode?: number; gone: boolean };

export async function sendPush(
  subscription: PushSubscription,
  payload: PushPayload,
): Promise<SendResult> {
  configure();
  try {
    await sendNotification(subscription, JSON.stringify(payload), {
      TTL: 60 * 60 * 24,
      urgency: "high",
    });
    return { ok: true };
  } catch (err) {
    const statusCode = (err as { statusCode?: number }).statusCode;
    // 404 and 410 mean the subscription expired or was turned off.
    return { ok: false, statusCode, gone: statusCode === 404 || statusCode === 410 };
  }
}
