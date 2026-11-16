-- KTP Hub: likes on posts, member profiles, and who wrote each post.
-- Run once in the Supabase SQL editor. Safe to run again.

-- Who wrote a post (for the poster's photo in the notifications feed).
alter table public.posts add column if not exists author_email text;

-- One row per like. Deleting a post deletes its likes.
create table if not exists public.post_likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id text not null,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
alter table public.post_likes enable row level security;

-- Profiles. Members fill these in themselves; the roster import never
-- overwrites them. image_url is the photo from their sign-in account.
alter table public.members
  add column if not exists pronouns text check (char_length(pronouns) <= 30),
  add column if not exists major text check (char_length(major) <= 100),
  add column if not exists minor text check (char_length(minor) <= 100),
  add column if not exists hometown text check (char_length(hometown) <= 100),
  add column if not exists pledge_class text check (char_length(pledge_class) <= 60),
  add column if not exists linkedin text check (char_length(linkedin) <= 200),
  add column if not exists interests text[] not null default '{}' check (cardinality(interests) <= 10),
  add column if not exists about text check (char_length(about) <= 1000),
  add column if not exists image_url text check (char_length(image_url) <= 500);
