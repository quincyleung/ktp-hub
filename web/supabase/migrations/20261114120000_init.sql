-- KTP Hub v1 schema.
-- Every read and write goes through the Next.js server with the secret key.
-- Row-level security is on with no public policies, so the public (anon)
-- key can't read or write anything.

-- The chapter roster. Import it from a CSV with columns: name, email, year, status.
-- Set role to 'board' by hand for e-board members.
create table public.members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  email_lower text generated always as (lower(btrim(email))) stored unique,
  year text,
  status text,
  role text not null default 'member' check (role in ('member', 'board')),
  created_at timestamptz not null default now()
);

-- Events and announcements. 'chapter' posts are for roster members;
-- 'demo' posts are samples that only the guest who made them sees.
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  audience text not null default 'chapter' check (audience in ('chapter', 'demo')),
  demo_owner text,
  kind text not null check (kind in ('event', 'announcement')),
  title text not null check (char_length(title) between 1 and 120),
  body text check (char_length(body) <= 2000),
  starts_at timestamptz,
  location text check (char_length(location) <= 200),
  notify boolean not null default true,
  created_by text not null,
  created_at timestamptz not null default now(),
  constraint event_has_time check (kind <> 'event' or starts_at is not null),
  constraint demo_has_owner check (audience <> 'demo' or demo_owner is not null)
);
create index posts_audience_created_idx on public.posts (audience, created_at desc);

-- One row per device that turned on notifications.
create table public.push_subscriptions (
  endpoint text primary key,
  user_id text not null,
  email text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  last_sent_at timestamptz
);
create index push_subscriptions_email_idx on public.push_subscriptions (email);

-- Devices that belong to someone on the roster (who gets chapter pushes).
create view public.member_subscriptions with (security_invoker = true) as
  select s.*
  from public.push_subscriptions s
  join public.members m on m.email_lower = s.email;

alter table public.members enable row level security;
alter table public.posts enable row level security;
alter table public.push_subscriptions enable row level security;
