// Reading a check-in code: the link inside the QR code, or 6 digits typed in.
// Shared by the scanner (to skip QR codes that aren't ours) and the server.

export const SAMPLE_ID = "sample";

const LINK = /\/c\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|sample)\/(\d{6})(?:[/?#]|$)/i;

export function parseScan(text: string): { id: string | null; code: string } | null {
  const t = text.trim();
  const link = LINK.exec(t);
  if (link) return { id: link[1].toLowerCase(), code: link[2] };
  const digits = t.replace(/[\s-]+/g, "");
  if (/^\d{6}$/.test(digits)) return { id: null, code: digits };
  return null;
}
