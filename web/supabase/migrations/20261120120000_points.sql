-- KTP Hub: points, dues, and QR check-in.
-- Paste into Supabase → SQL Editor → New query, and click Run. Safe to run again.
--
-- Like every table here, these have row-level security on and no public
-- policies: only the Next.js server (with the secret key) reads or writes them.

-- Committee leads can start check-ins at their committee meetings. The board
-- makes someone a lead with the switch on their profile (People), or with:
--   update public.members set role = 'lead' where email_lower = '<their email>';
alter table public.members drop constraint if exists members_role_check;
alter table public.members
  add constraint members_role_check check (role in ('member', 'board', 'lead'));

-- A check-in: one event where brothers scan a code for points. The code on
-- the screen changes every 30 seconds and stops working when it ends.
create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  category text not null check (category in ('chapter', 'committee', 'service', 'membership', 'social')),
  points integer not null check (points between 1 and 30),
  quarter text not null check (quarter ~ '^\d{4}-(winter|spring|summer|autumn)$'),
  event_key text, -- the Google Calendar event it's for, if any
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  secret text not null, -- signs the rotating code; never leaves the server
  created_by uuid references public.members (id) on delete set null,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
alter table public.checkins enable row level security;
create index if not exists checkins_open on public.checkins (ends_at);

-- Points: one row per check-in, dues payment, or board entry. Totals are
-- added up per quarter, with each requirement capped (see lib/points.ts).
create table if not exists public.points (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members (id) on delete cascade,
  quarter text not null check (quarter ~ '^\d{4}-(winter|spring|summer|autumn)$'),
  category text not null check (category in ('chapter', 'dues', 'committee', 'service', 'membership', 'social')),
  points integer not null check (points between -100 and 100 and points <> 0),
  note text check (char_length(note) <= 120),
  checkin_id uuid references public.checkins (id) on delete cascade,
  created_by uuid references public.members (id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.points enable row level security;
create index if not exists points_by_quarter on public.points (quarter, member_id);
-- Each brother checks in to an event once.
create unique index if not exists points_one_checkin on public.points (checkin_id, member_id)
  where checkin_id is not null;
-- Dues are paid once a quarter.
create unique index if not exists points_one_dues on public.points (member_id, quarter)
  where category = 'dues';

-- Guests (like graders) can try check-in on a sample event. One row means
-- they've checked in to it; it never touches real points.
create table if not exists public.guest_checkins (
  user_id text primary key,
  created_at timestamptz not null default now()
);
alter table public.guest_checkins enable row level security;
