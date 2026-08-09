-- Toasty — Supabase schema for Page 1 (club registration + president verification)
-- Run this once in the Supabase dashboard: SQL Editor -> paste -> Run.
-- Replaces the retired MySQL schema (server/schema.sql, now deleted).

create table if not exists president_verifications (
  id bigint generated always as identity primary key,
  name text not null,
  member_id text,
  club_name text,
  email text not null,
  phone text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  submitted_at timestamptz not null default now()
);

create table if not exists clubs (
  id text primary key,
  name text not null,
  club_id text,
  district text,
  area text,
  members int,
  founded_year int,
  city text,
  country text,
  location text,
  president_name text,
  president_email text not null,
  meeting_day text,
  meeting_time text,
  meeting_location text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  submitted_at timestamptz not null default now()
);

-- Mirrors the old Express 403 check: a club can only be inserted if its
-- president_email matches an approved president_verifications row.
create or replace function check_president_verified()
returns trigger as $$
begin
  if not exists (
    select 1 from president_verifications
    where lower(email) = lower(new.president_email)
      and status = 'approved'
  ) then
    raise exception 'You are not a registered president.';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_check_president on clubs;
create trigger trg_check_president
  before insert on clubs
  for each row execute function check_president_verified();

-- RLS: locked down to real authenticated founder access (real Google
-- Sign-In via Supabase Auth now exists — see AuthContext.jsx /
-- mockFounderAuth.js). Public read is limited to approved rows only;
-- pending rows (containing applicants' PII) and all approve/reject
-- updates require the signed-in JWT's email to match the founder email
-- below, which must stay in sync with VITE_FOUNDER_EMAILS in .env.local.
alter table clubs enable row level security;
alter table president_verifications enable row level security;

drop policy if exists "clubs anon select" on clubs;
drop policy if exists "clubs anon update" on clubs;
drop policy if exists "presidents anon select" on president_verifications;
drop policy if exists "presidents anon update" on president_verifications;

drop policy if exists "clubs public select approved" on clubs;
create policy "clubs public select approved" on clubs
  for select using (status = 'approved');
drop policy if exists "clubs founder select all" on clubs;
create policy "clubs founder select all" on clubs
  for select using (lower(auth.jwt() ->> 'email') = 'jointoasty@gmail.com');
drop policy if exists "clubs anon insert" on clubs;
create policy "clubs anon insert" on clubs for insert with check (true);
drop policy if exists "clubs founder update" on clubs;
create policy "clubs founder update" on clubs
  for update using (lower(auth.jwt() ->> 'email') = 'jointoasty@gmail.com');

drop policy if exists "presidents public select approved" on president_verifications;
create policy "presidents public select approved" on president_verifications
  for select using (status = 'approved');
drop policy if exists "presidents founder select all" on president_verifications;
create policy "presidents founder select all" on president_verifications
  for select using (lower(auth.jwt() ->> 'email') = 'jointoasty@gmail.com');
drop policy if exists "presidents anon insert" on president_verifications;
create policy "presidents anon insert" on president_verifications for insert with check (true);
drop policy if exists "presidents founder update" on president_verifications;
create policy "presidents founder update" on president_verifications
  for update using (lower(auth.jwt() ->> 'email') = 'jointoasty@gmail.com');

-- RLS policies only take effect once the role has base table privileges.
-- "Automatically expose new tables" was left off, so these tables didn't
-- get the usual auto-grant — add it explicitly.
grant usage on schema public to anon, authenticated;
grant select, insert, update on clubs to anon, authenticated;
grant select, insert, update on president_verifications to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

-- Column-level tightening: the public (anonymous) verifyPresident() check
-- only ever needs an approved president's name (plus email/status, which
-- the query filters on) — phone and member_id are PII with no legitimate
-- public use case, even for already-approved presidents. RLS is row-level
-- only, so this uses a column-level grant instead: revoke anon's blanket
-- column access on this one table and re-grant only the columns needed.
-- (authenticated keeps full-column access — required for the founder's
-- pending-review UI, which needs phone/member_id; Postgres grants can't
-- be conditional on which RLS row-policy matched, so a real signed-in
-- non-founder user could still over-fetch approved rows' extra columns —
-- a much smaller residual than the anonymous/scraping case this closes.)
revoke select on president_verifications from anon;
grant select (name, email, status) on president_verifications to anon;
