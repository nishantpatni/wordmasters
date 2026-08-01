-- Word Masters — initial Supabase schema
-- Replaces the Google Sheets (Apps Script) backend. Login stays a hardcoded
-- username list in the app (no Supabase Auth), so these tables are keyed by
-- a plain `username` text column rather than auth.uid().
--
-- RLS: enabled with permissive SELECT/INSERT/UPDATE for the `anon` role, and
-- deliberately NO DELETE policy. This matches the existing security posture
-- (the Google Apps Script web app was deployed with "Anyone" access and no
-- real per-user auth check) without adding a new risk — and omitting DELETE
-- means even a buggy client-side call can't wipe rows table-wide.

create table if not exists scores (
  username    text not null,
  subject     text not null check (subject in ('english','geography')),
  item_id     text not null,
  correct     int not null default 0,
  attempts    int not null default 0,
  ef          numeric not null default 2.5,
  interval    int not null default 1,
  reps        int not null default 0,
  next_review date,
  last_seen   date,
  updated_at  timestamptz not null default now(),
  primary key (username, subject, item_id)
);

create table if not exists attempt_logs (
  id              bigserial primary key,
  username        text not null,
  subject         text not null check (subject in ('english','geography')),
  ts              timestamptz not null,
  item_id         text,
  topic_id        text,
  correct         boolean,
  selected_option text,
  correct_answer  text,
  prompt          text,
  created_at      timestamptz not null default now()
);
create index if not exists attempt_logs_username_ts_idx on attempt_logs (username, ts);

create table if not exists user_meta (
  username    text primary key,
  streak      int not null default 0,
  last_study  date,
  sessions    int not null default 0,
  coins       int not null default 0,
  updated_at  timestamptz not null default now()
);

alter table scores        enable row level security;
alter table attempt_logs  enable row level security;
alter table user_meta     enable row level security;

create policy "anon can read scores"   on scores        for select to anon using (true);
create policy "anon can insert scores" on scores        for insert to anon with check (true);
create policy "anon can update scores" on scores        for update to anon using (true) with check (true);

create policy "anon can read logs"     on attempt_logs  for select to anon using (true);
create policy "anon can insert logs"   on attempt_logs  for insert to anon with check (true);

create policy "anon can read meta"     on user_meta     for select to anon using (true);
create policy "anon can insert meta"   on user_meta     for insert to anon with check (true);
create policy "anon can update meta"   on user_meta     for update to anon using (true) with check (true);
