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

-- ExCom pre-registration (President registers ExCom members by role +
-- email; that email lands straight on their role's dashboard on first
-- sign-in). Was localStorage-only, per-browser — moved here so it works
-- across devices for real: a President registering someone from their
-- laptop needs that person to be recognized when they sign in from their
-- own phone.
create table if not exists excom_appointments (
  id bigint generated always as identity primary key,
  role text not null,
  name text not null,
  email text not null,
  appointed_by_email text not null,
  appointed_at timestamptz not null default now()
);

-- Same shape as check_president_verified — only a genuinely approved
-- president's email may appear as the appointer.
create or replace function check_appointer_is_verified_president()
returns trigger as $$
begin
  if not exists (
    select 1 from president_verifications
    where lower(email) = lower(new.appointed_by_email)
      and status = 'approved'
  ) then
    raise exception 'You are not a registered president.';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_check_appointer on excom_appointments;
create trigger trg_check_appointer
  before insert on excom_appointments
  for each row execute function check_appointer_is_verified_president();

alter table excom_appointments enable row level security;

-- No anon access at all here (unlike clubs/president_verifications,
-- there's no public-facing form for this — only the President's own
-- signed-in /register-excom page). SELECT is open to any signed-in user
-- (role/name/email only, no PII like phone numbers) — matches "who's on
-- ExCom" being reasonably public knowledge to other members, while still
-- requiring a real sign-in. INSERT/DELETE require the signed-in JWT
-- email to match appointed_by_email, so a president can only register or
-- remove appointments under their own email.
drop policy if exists "excom authenticated select" on excom_appointments;
create policy "excom authenticated select" on excom_appointments
  for select to authenticated using (true);
drop policy if exists "excom president insert" on excom_appointments;
create policy "excom president insert" on excom_appointments
  for insert to authenticated
  with check (lower(auth.jwt() ->> 'email') = lower(appointed_by_email));
drop policy if exists "excom president delete" on excom_appointments;
create policy "excom president delete" on excom_appointments
  for delete to authenticated
  using (lower(auth.jwt() ->> 'email') = lower(appointed_by_email));

grant select, insert, delete on excom_appointments to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- Real member signups (/signup, no role match -> pending). Previously
-- the VPM's Approvals page showed static placeholder names, completely
-- disconnected from real sign-ups, which lived only in the signing-up
-- person's own browser. This table connects the two for real.
create table if not exists member_signups (
  id bigint generated always as identity primary key,
  name text,
  email text not null unique,
  applied_for_excom boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  submitted_at timestamptz not null default now()
);

alter table member_signups enable row level security;

-- SELECT open to any signed-in user (same reasoning as excom_appointments
-- — low sensitivity, and it means reading back your own freshly-inserted
-- pending row just works, no special case needed). INSERT is self-service
-- only, always starts pending. UPDATE (approve/reject) requires the
-- signed-in JWT email to currently be a VPM (via excom_appointments) or
-- an approved President (via clubs.president_email) — mirrors the
-- "President is a superuser" rule already implemented client-side in
-- hasExcomRole().
drop policy if exists "signups authenticated select" on member_signups;
create policy "signups authenticated select" on member_signups
  for select to authenticated using (true);
drop policy if exists "signups self insert" on member_signups;
create policy "signups self insert" on member_signups
  for insert to authenticated
  with check (lower(auth.jwt() ->> 'email') = lower(email) and status = 'pending');
drop policy if exists "signups vpm or president update" on member_signups;
create policy "signups vpm or president update" on member_signups
  for update to authenticated
  using (
    exists (
      select 1 from excom_appointments
      where lower(email) = lower(auth.jwt() ->> 'email') and role = 'VPM'
    )
    or exists (
      select 1 from clubs
      where lower(president_email) = lower(auth.jwt() ->> 'email') and status = 'approved'
    )
  );

grant select, insert, update on member_signups to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- Real club roster + role history, for attendance/rotation-based role
-- auto-assignment (replaces a random-placeholder-name shift). Seeded
-- once from the club's real attendance sheet and meeting roster (see
-- accompanying seed SQL) — not a public-facing form, so no anon access.
create table if not exists members (
  id bigint generated always as identity primary key,
  name text not null unique,
  attendance_percentage numeric
);

create table if not exists role_history (
  id bigint generated always as identity primary key,
  member_name text not null,
  role_id text not null,
  meeting_date date not null,
  submitted_at timestamptz not null default now()
);

alter table members enable row level security;
alter table role_history enable row level security;

-- SELECT open to any signed-in user (same reasoning as excom_appointments
-- — a club roster isn't sensitive for a small pilot). Writes restricted
-- to whoever is currently VPE or an approved President (same "who runs
-- role assignment" logic already used for member_signups' VPM/President
-- check).
drop policy if exists "members authenticated select" on members;
create policy "members authenticated select" on members
  for select to authenticated using (true);
drop policy if exists "members vpe or president write" on members;
create policy "members vpe or president write" on members
  for all to authenticated
  using (
    exists (
      select 1 from excom_appointments
      where lower(email) = lower(auth.jwt() ->> 'email') and role = 'VPE'
    )
    or exists (
      select 1 from clubs
      where lower(president_email) = lower(auth.jwt() ->> 'email') and status = 'approved'
    )
  );

drop policy if exists "role_history authenticated select" on role_history;
create policy "role_history authenticated select" on role_history
  for select to authenticated using (true);
drop policy if exists "role_history vpe or president insert" on role_history;
create policy "role_history vpe or president insert" on role_history
  for insert to authenticated
  with check (
    exists (
      select 1 from excom_appointments
      where lower(email) = lower(auth.jwt() ->> 'email') and role = 'VPE'
    )
    or exists (
      select 1 from clubs
      where lower(president_email) = lower(auth.jwt() ->> 'email') and status = 'approved'
    )
  );

grant select, insert, update on members to authenticated;
grant select, insert on role_history to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- Real meetings + per-meeting role assignments (was localStorage-only,
-- mockRolesStore.js). "VPE finalizes roles -> shown to members" is
-- meaningless if it only works in one browser, so this moves the whole
-- meetings/roles system here, same as clubs/president/ExCom already are.
create table if not exists meetings (
  id bigint generated always as identity primary key,
  label text not null,
  meeting_date date,
  time text,
  theme text,
  finalized boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists meeting_role_assignments (
  id bigint generated always as identity primary key,
  meeting_id bigint not null references meetings(id) on delete cascade,
  role_id text not null,
  status text not null default 'open' check (status in ('open','taken','auto')),
  taken_by_name text,
  taken_by_email text,
  updated_at timestamptz not null default now(),
  unique (meeting_id, role_id)
);

alter table meetings enable row level security;
alter table meeting_role_assignments enable row level security;

-- Everyone signed in needs to see the meeting list and role board.
drop policy if exists "meetings authenticated select" on meetings;
create policy "meetings authenticated select" on meetings
  for select to authenticated using (true);
-- Creating meetings / finalizing is VPE-or-President only.
drop policy if exists "meetings vpe or president write" on meetings;
create policy "meetings vpe or president write" on meetings
  for all to authenticated
  using (
    exists (
      select 1 from excom_appointments
      where lower(email) = lower(auth.jwt() ->> 'email') and role = 'VPE'
    )
    or exists (
      select 1 from clubs
      where lower(president_email) = lower(auth.jwt() ->> 'email') and status = 'approved'
    )
  );

drop policy if exists "assignments authenticated select" on meeting_role_assignments;
create policy "assignments authenticated select" on meeting_role_assignments
  for select to authenticated using (true);
-- VPE/President can insert (seeding a new meeting's role rows).
drop policy if exists "assignments vpe or president insert" on meeting_role_assignments;
create policy "assignments vpe or president insert" on meeting_role_assignments
  for insert to authenticated
  with check (
    exists (
      select 1 from excom_appointments
      where lower(email) = lower(auth.jwt() ->> 'email') and role = 'VPE'
    )
    or exists (
      select 1 from clubs
      where lower(president_email) = lower(auth.jwt() ->> 'email') and status = 'approved'
    )
  );
-- Update allowed for VPE/President (any row), or a member claiming an
-- open role, or a member releasing a role that's already theirs.
-- Adds accepted_at so a member can acknowledge an auto-assigned role
-- (separate from status, which stays 'auto' either way — accepting
-- doesn't retroactively make it "self-selected").
alter table meeting_role_assignments add column if not exists accepted_at timestamptz;

drop policy if exists "assignments update" on meeting_role_assignments;
create policy "assignments update" on meeting_role_assignments
  for update to authenticated
  using (
    status = 'open'
    or lower(taken_by_email) = lower(auth.jwt() ->> 'email')
    -- Claiming/accepting or declining your own not-yet-claimed
    -- auto-assigned role. Auto-assign only ever records taken_by_name
    -- (no email), so without this clause a member could never actually
    -- act on their own auto-assigned role — a real bug found while
    -- wiring up Accept, not new looseness added for it.
    or (status = 'auto' and taken_by_email is null)
    or exists (
      select 1 from excom_appointments
      where lower(email) = lower(auth.jwt() ->> 'email') and role = 'VPE'
    )
    or exists (
      select 1 from clubs
      where lower(president_email) = lower(auth.jwt() ->> 'email') and status = 'approved'
    )
  )
  with check (
    lower(taken_by_email) = lower(auth.jwt() ->> 'email')
    or taken_by_email is null
    or exists (
      select 1 from excom_appointments
      where lower(email) = lower(auth.jwt() ->> 'email') and role = 'VPE'
    )
    or exists (
      select 1 from clubs
      where lower(president_email) = lower(auth.jwt() ->> 'email') and status = 'approved'
    )
  );

grant select, insert, update on meetings to authenticated;
grant select, insert, update on meeting_role_assignments to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- Per-meeting agenda (was localStorage-only, mockAgendaStore.js) — a VPE
-- editing the agenda on their own device was invisible to members on
-- theirs, same cross-device gap meetings/roles had before. Rows are
-- stored as a JSONB array since the VPE can freely add/remove/reorder
-- them (a different speaker count every meeting) — no separate rows
-- table needed for that flexibility.
create table if not exists agendas (
  id bigint generated always as identity primary key,
  meeting_id bigint not null unique references meetings(id) on delete cascade,
  date_label text,
  theme text,
  word_of_day text,
  meaning text,
  venue text,
  overall_start_time text,
  overall_end_time text,
  items jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  sent_at timestamptz,
  sent_snapshot jsonb
);

alter table agendas enable row level security;

drop policy if exists "agendas authenticated select" on agendas;
create policy "agendas authenticated select" on agendas
  for select to authenticated using (true);
drop policy if exists "agendas vpe or president write" on agendas;
create policy "agendas vpe or president write" on agendas
  for all to authenticated
  using (
    exists (
      select 1 from excom_appointments
      where lower(email) = lower(auth.jwt() ->> 'email') and role = 'VPE'
    )
    or exists (
      select 1 from clubs
      where lower(president_email) = lower(auth.jwt() ->> 'email') and status = 'approved'
    )
  );

grant select, insert, update on agendas to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- Real Treasurer-controlled membership renewals (was fully fabricated —
-- mockRenewals.js's 4 placeholder names, self-service UTR flow). Kept
-- separate from `members` (VPE's attendance-roster domain) so this has
-- its own clean RLS boundary instead of a cross-permission leak into
-- attendance data. Active/inactive isn't its own column — it's derived
-- from membership_end at read time (see mockMembershipStore.js).
create table if not exists member_renewals (
  id bigint generated always as identity primary key,
  member_name text not null unique,
  payment_status text not null default 'pending' check (payment_status in ('paid','pending','overdue')),
  membership_start date,
  membership_end date,
  updated_at timestamptz not null default now()
);

alter table member_renewals enable row level security;

drop policy if exists "member_renewals authenticated select" on member_renewals;
create policy "member_renewals authenticated select" on member_renewals
  for select to authenticated using (true);
drop policy if exists "member_renewals treasurer or president write" on member_renewals;
create policy "member_renewals treasurer or president write" on member_renewals
  for all to authenticated
  using (
    exists (
      select 1 from excom_appointments
      where lower(email) = lower(auth.jwt() ->> 'email') and role = 'Treasurer'
    )
    or exists (
      select 1 from clubs
      where lower(president_email) = lower(auth.jwt() ->> 'email') and status = 'approved'
    )
  );

grant select, insert, update on member_renewals to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- Real photo uploads (VPPR) — was base64-in-localStorage before (a
-- per-browser prototype, not real hosting; also capped by localStorage's
-- ~5-10MB quota). First real use of Supabase Storage in this app.
insert into storage.buckets (id, name, public)
values ('club-photos', 'club-photos', true)
on conflict (id) do nothing;

drop policy if exists "club-photos public read" on storage.objects;
create policy "club-photos public read" on storage.objects
  for select using (bucket_id = 'club-photos');

drop policy if exists "club-photos vppr or president write" on storage.objects;
create policy "club-photos vppr or president write" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'club-photos'
    and (
      exists (
        select 1 from excom_appointments
        where lower(email) = lower(auth.jwt() ->> 'email') and role = 'VPPR'
      )
      or exists (
        select 1 from clubs
        where lower(president_email) = lower(auth.jwt() ->> 'email') and status = 'approved'
      )
    )
  )
  with check (bucket_id = 'club-photos');

-- Public club-page photos, section-targeted (hero/gallery/story/
-- achievements) — replaces the picsum.photos placeholders on the public
-- Club Home page once the VPPR uploads real ones.
create table if not exists club_page_photos (
  id bigint generated always as identity primary key,
  section text not null check (section in ('hero','gallery','story','achievements')),
  url text not null,
  uploaded_at timestamptz not null default now()
);

-- Real profile photo + bio for a current or past ExCom member, keyed by
-- the same slugified id data/excom.js already generates.
create table if not exists excom_profiles (
  id bigint generated always as identity primary key,
  member_key text not null unique,
  photo_url text,
  bio text,
  updated_at timestamptz not null default now()
);

-- Per-meeting photos/certificates — was a disconnected localStorage blob
-- (mockPhotoMemoriesStore.js); moved onto the real meetings shell, same
-- "one JSONB-bearing row per meeting" pattern as `agendas`.
create table if not exists meeting_photos (
  id bigint generated always as identity primary key,
  meeting_id bigint not null unique references meetings(id) on delete cascade,
  theme text,
  photos jsonb not null default '[]'::jsonb,
  certificates jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table club_page_photos enable row level security;
alter table excom_profiles enable row level security;
alter table meeting_photos enable row level security;

-- club_page_photos / excom_profiles are read by the public, logged-out
-- Club Home page — select is open to everyone, not just authenticated
-- (same reasoning as the public `clubs` select policy).
drop policy if exists "club_page_photos public select" on club_page_photos;
create policy "club_page_photos public select" on club_page_photos
  for select using (true);
drop policy if exists "club_page_photos vppr or president write" on club_page_photos;
create policy "club_page_photos vppr or president write" on club_page_photos
  for all to authenticated
  using (
    exists (
      select 1 from excom_appointments
      where lower(email) = lower(auth.jwt() ->> 'email') and role = 'VPPR'
    )
    or exists (
      select 1 from clubs
      where lower(president_email) = lower(auth.jwt() ->> 'email') and status = 'approved'
    )
  );

drop policy if exists "excom_profiles public select" on excom_profiles;
create policy "excom_profiles public select" on excom_profiles
  for select using (true);
drop policy if exists "excom_profiles vppr or president write" on excom_profiles;
create policy "excom_profiles vppr or president write" on excom_profiles
  for all to authenticated
  using (
    exists (
      select 1 from excom_appointments
      where lower(email) = lower(auth.jwt() ->> 'email') and role = 'VPPR'
    )
    or exists (
      select 1 from clubs
      where lower(president_email) = lower(auth.jwt() ->> 'email') and status = 'approved'
    )
  );

-- meeting_photos is member-only content (like meetings/agendas), not public.
drop policy if exists "meeting_photos authenticated select" on meeting_photos;
create policy "meeting_photos authenticated select" on meeting_photos
  for select to authenticated using (true);
drop policy if exists "meeting_photos vppr or president write" on meeting_photos;
create policy "meeting_photos vppr or president write" on meeting_photos
  for all to authenticated
  using (
    exists (
      select 1 from excom_appointments
      where lower(email) = lower(auth.jwt() ->> 'email') and role = 'VPPR'
    )
    or exists (
      select 1 from clubs
      where lower(president_email) = lower(auth.jwt() ->> 'email') and status = 'approved'
    )
  );

grant select on club_page_photos to anon;
grant select on excom_profiles to anon;
grant select, insert, update, delete on club_page_photos to authenticated;
grant select, insert, update, delete on excom_profiles to authenticated;
grant select, insert, update, delete on meeting_photos to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- VPPR-authored "Our Story" / "Achievements" content blocks (photo +
-- title + text, repeatable) — replaces the static sample text those
-- sections used to show. Same shape for both sections, reused rather
-- than two near-identical tables.
create table if not exists club_content_blocks (
  id bigint generated always as identity primary key,
  section text not null check (section in ('story','achievements')),
  photo_url text,
  title text not null,
  content text,
  created_at timestamptz not null default now()
);

alter table club_content_blocks enable row level security;

drop policy if exists "club_content_blocks public select" on club_content_blocks;
create policy "club_content_blocks public select" on club_content_blocks
  for select using (true);
drop policy if exists "club_content_blocks vppr or president write" on club_content_blocks;
create policy "club_content_blocks vppr or president write" on club_content_blocks
  for all to authenticated
  using (
    exists (
      select 1 from excom_appointments
      where lower(email) = lower(auth.jwt() ->> 'email') and role = 'VPPR'
    )
    or exists (
      select 1 from clubs
      where lower(president_email) = lower(auth.jwt() ->> 'email') and status = 'approved'
    )
  );

grant select on club_content_blocks to anon;
grant select, insert, update, delete on club_content_blocks to authenticated;

-- ExCom profile photo positioning (fixes bad default center-crop on
-- circular avatars) + real contact info.
alter table excom_profiles add column if not exists photo_position text default '50% 50%';
alter table excom_profiles add column if not exists phone text;
alter table excom_profiles add column if not exists email text;

-- Real per-meeting attendance, taken by the Secretary. Replaces the
-- fully local/fake AttendancePage.jsx prototype. Feeds the VPE
-- auto-assign scoring algorithm (mockRosterStore.js) once a member has
-- rows here, blended with — not replacing — the static seeded
-- members.attendance_percentage baseline.
create table if not exists attendance (
  id bigint generated always as identity primary key,
  meeting_id bigint not null references meetings(id) on delete cascade,
  member_name text not null,
  present boolean not null default true,
  submitted_by_email text,
  updated_at timestamptz not null default now(),
  unique (meeting_id, member_name)
);

alter table attendance enable row level security;

drop policy if exists "attendance authenticated select" on attendance;
create policy "attendance authenticated select" on attendance
  for select to authenticated using (true);

drop policy if exists "attendance secretary or president write" on attendance;
create policy "attendance secretary or president write" on attendance
  for all to authenticated
  using (
    exists (
      select 1 from excom_appointments
      where lower(email) = lower(auth.jwt() ->> 'email') and role = 'Secretary'
    )
    or exists (
      select 1 from clubs
      where lower(president_email) = lower(auth.jwt() ->> 'email') and status = 'approved'
    )
  )
  with check (
    exists (
      select 1 from excom_appointments
      where lower(email) = lower(auth.jwt() ->> 'email') and role = 'Secretary'
    )
    or exists (
      select 1 from clubs
      where lower(president_email) = lower(auth.jwt() ->> 'email') and status = 'approved'
    )
  );

grant select, insert, update on attendance to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- Cancel/reschedule support. cancel_reason is optional context shown to
-- members alongside the cancelled notice; meeting_date itself doubles as
-- the reschedule target (no separate column needed — every other
-- meeting-scoped table is keyed by meeting_id, not date, so changing
-- this column moves everything tied to the meeting for free).
alter table meetings add column if not exists cancelled boolean not null default false;
alter table meetings add column if not exists cancel_reason text;

-- Real MOM (Minutes of Meeting) submissions — replaces mockMOMStore.js's
-- localStorage-only prototype (per-browser, invisible cross-device, and
-- unable to participate in the cancelled-meeting notice pattern the way
-- agendas/attendance/roles/photos already can). content stores the whole
-- MOM form object as-is, same jsonb-blob approach already used by
-- agendas.items.
create table if not exists moms (
  id bigint generated always as identity primary key,
  meeting_id bigint not null unique references meetings(id) on delete cascade,
  content jsonb not null default '{}'::jsonb,
  submitted_at timestamptz,
  submitted_by_email text
);

alter table moms enable row level security;

drop policy if exists "moms authenticated select" on moms;
create policy "moms authenticated select" on moms
  for select to authenticated using (true);

drop policy if exists "moms secretary or president write" on moms;
create policy "moms secretary or president write" on moms
  for all to authenticated
  using (
    exists (
      select 1 from excom_appointments
      where lower(email) = lower(auth.jwt() ->> 'email') and role = 'Secretary'
    )
    or exists (
      select 1 from clubs
      where lower(president_email) = lower(auth.jwt() ->> 'email') and status = 'approved'
    )
  )
  with check (
    exists (
      select 1 from excom_appointments
      where lower(email) = lower(auth.jwt() ->> 'email') and role = 'Secretary'
    )
    or exists (
      select 1 from clubs
      where lower(president_email) = lower(auth.jwt() ->> 'email') and status = 'approved'
    )
  );

grant select, insert, update on moms to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- VPPR can add a meeting on the fly (e.g. backfilling real early-2026
-- meetings that predate the seeded July 1 start) without needing VPE.
-- Additive — coexists with "meetings vpe or president write" above,
-- which still owns update/delete (finalize/cancel/reschedule).
drop policy if exists "meetings vppr insert" on meetings;
create policy "meetings vppr insert" on meetings
  for insert to authenticated
  with check (
    exists (
      select 1 from excom_appointments
      where lower(email) = lower(auth.jwt() ->> 'email') and role = 'VPPR'
    )
  );

-- Real SAA-built voting polls (was localStorage-only, mockPollStore.js,
-- and targeted a hardcoded fake meeting id that could never match a
-- real one). categories/answers are jsonb blobs, same pattern as
-- agendas.items and moms.content.
create table if not exists polls (
  id bigint generated always as identity primary key,
  meeting_id bigint not null unique references meetings(id) on delete cascade,
  categories jsonb not null default '[]'::jsonb,
  is_open boolean not null default false,
  released_at timestamptz,
  closed_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists poll_votes (
  id bigint generated always as identity primary key,
  poll_id bigint not null references polls(id) on delete cascade,
  voter_email text not null,
  answers jsonb not null default '{}'::jsonb,
  voted_at timestamptz not null default now(),
  unique (poll_id, voter_email)
);

alter table polls enable row level security;
alter table poll_votes enable row level security;

drop policy if exists "polls authenticated select" on polls;
create policy "polls authenticated select" on polls
  for select to authenticated using (true);
drop policy if exists "polls saa or president write" on polls;
create policy "polls saa or president write" on polls
  for all to authenticated
  using (
    exists (
      select 1 from excom_appointments
      where lower(email) = lower(auth.jwt() ->> 'email') and role = 'SAA'
    )
    or exists (
      select 1 from clubs
      where lower(president_email) = lower(auth.jwt() ->> 'email') and status = 'approved'
    )
  )
  with check (
    exists (
      select 1 from excom_appointments
      where lower(email) = lower(auth.jwt() ->> 'email') and role = 'SAA'
    )
    or exists (
      select 1 from clubs
      where lower(president_email) = lower(auth.jwt() ->> 'email') and status = 'approved'
    )
  );

drop policy if exists "poll_votes authenticated select" on poll_votes;
create policy "poll_votes authenticated select" on poll_votes
  for select to authenticated using (true);
drop policy if exists "poll_votes self insert" on poll_votes;
create policy "poll_votes self insert" on poll_votes
  for insert to authenticated
  with check (lower(voter_email) = lower(auth.jwt() ->> 'email'));
-- No update/delete policy on poll_votes -- a cast vote is immutable,
-- matching the existing "each member gets one vote per meeting" copy.

grant select, insert, update on polls to authenticated;
grant select, insert on poll_votes to authenticated;
grant usage, select on all sequences in schema public to authenticated;
