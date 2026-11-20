import "server-only";
import { createHmac, randomBytes } from "node:crypto";
import { APP_URL } from "./chapter";
import { SAMPLE_ID } from "./scan";

// The code on the check-in screen changes every 30 seconds. Each one comes
// from the check-in's secret and the clock, so nothing extra is stored, and a
// photo sent to a group chat stops working almost right away.
export const STEP_MS = 30_000;

export const newSecret = () => randomBytes(32).toString("base64url");

// The sample check-in for guests isn't worth anything, so its secret isn't secret.
export const SAMPLE_SECRET = "ktp-hub-sample-checkin";

function codeAt(secret: string, step: number): string {
  const mac = createHmac("sha256", secret).update(String(step)).digest();
  return String(mac.readUInt32BE(0) % 1_000_000).padStart(6, "0");
}

/** The code to show now, and how long until it changes. */
export function currentCode(secret: string, now = Date.now()) {
  const step = Math.floor(now / STEP_MS);
  return { code: codeAt(secret, step), msLeft: (step + 1) * STEP_MS - now };
}

/**
 * True for the code on the screen now, or the one just before it, so a scan
 * a second before the code changes still counts. Older codes don't work.
 */
export function codeIsValid(secret: string, code: string, now = Date.now()): boolean {
  const step = Math.floor(now / STEP_MS);
  return codeAt(secret, step) === code || codeAt(secret, step - 1) === code;
}

/** What the QR code holds. */
export const checkinUrl = (id: string, code: string) => `${APP_URL}/c/${id}/${code}`;

export const isOpen = (c: { starts_at: string; ends_at: string }, now = Date.now()) =>
  Date.parse(c.starts_at) <= now && now < Date.parse(c.ends_at);

export { SAMPLE_ID };
