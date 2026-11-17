import { timingSafeEqual } from "node:crypto";
import { sendDueReminders } from "@/lib/posts";

// A timer in Supabase (pg_cron) calls this every 5 minutes with the shared
// secret, and it sends any event reminders that are due. Without the secret,
// nothing happens. Each reminder goes out once, so extra calls are harmless.
function allowed(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(req.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function POST(req: Request) {
  if (!allowed(req)) return Response.json({ error: "Not allowed." }, { status: 401 });
  try {
    const sent = await sendDueReminders();
    return Response.json({ sent });
  } catch (err) {
    console.error("Sending reminders failed:", err);
    return Response.json({ error: "Sending reminders failed." }, { status: 500 });
  }
}
