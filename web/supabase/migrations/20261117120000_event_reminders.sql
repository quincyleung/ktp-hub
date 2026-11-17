-- Event reminder notifications, an hour before each event.
-- Paste into Supabase → SQL Editor → New query, and click Run. Safe to run again.
--
-- The timer below signs its calls with a secret named "ktp_cron_secret" in
-- Supabase Vault, the same value as CRON_SECRET on Vercel. The secret is never
-- kept in this repo; add or change it with:
--   select vault.create_secret('<the CRON_SECRET value>', 'ktp_cron_secret');

-- Each phone can turn event reminders off (Settings → Event reminders). On by default.
alter table public.push_subscriptions
  add column if not exists reminders boolean not null default true;

-- Which events already got their reminder, so each one goes out once.
create table if not exists public.reminders_sent (
  event_key text primary key,
  sent_at timestamptz not null default now()
);
alter table public.reminders_sent enable row level security;
-- No policies: only the app's server (with the secret key) reads and writes it.

-- Every 5 minutes, ask the app to send any reminders that are due.
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'ktp-event-reminders',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://uchicago-ktphub.vercel.app/api/reminders',
    headers := jsonb_build_object(
      'Authorization',
      'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'ktp_cron_secret')
    ),
    timeout_milliseconds := 10000
  );
  $$
);
