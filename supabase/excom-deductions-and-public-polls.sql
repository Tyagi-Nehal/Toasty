-- Apply before deploying the ExCom deductions and QR voting interface.
begin;

create table if not exists public.excom_point_deductions (
  id uuid primary key,
  club_id text not null references public.clubs(id),
  point_id bigint not null unique references public.excom_points(id),
  actor_id uuid not null,
  actor_email text not null,
  created_at timestamptz not null default now()
);
alter table public.excom_point_deductions enable row level security;
grant select on public.excom_point_deductions to authenticated;
drop policy if exists "club deduction history" on public.excom_point_deductions;
create policy "club deduction history" on public.excom_point_deductions
  for select to authenticated using (club_id = public.current_club_id());

-- Deductions must pass through the audited President-only function.
drop policy if exists "deductions require rpc" on public.excom_points;
create policy "deductions require rpc" on public.excom_points as restrictive
  for insert to authenticated with check (category <> 'president_deduction');

create or replace function public.deduct_excom_points(
  p_appointment_id bigint, p_points integer, p_reason text, p_request_id uuid
) returns bigint language plpgsql security definer set search_path = '' as $$
declare
  appointment public.excom_appointments%rowtype;
  cid text := public.current_club_id();
  actor text := lower(auth.jwt() ->> 'email');
  point_id bigint;
begin
  if auth.uid() is null or not exists (
    select 1 from public.clubs c where c.id = cid and c.status = 'approved'
      and lower(c.president_email) = actor
  ) then raise exception 'Only the club President can deduct ExCom points.'; end if;
  if p_points is null or p_points <= 0 or p_request_id is null
    or p_reason is null or length(btrim(p_reason)) not between 3 and 1000
  then raise exception 'Enter positive whole points and a reason (3–1000 characters).'; end if;
  -- Serialize retries of the same request so an uncertain network response cannot double-charge.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_request_id::text, 0));
  select d.point_id into point_id from public.excom_point_deductions d
    where d.id = p_request_id and d.club_id = cid and d.actor_id = auth.uid();
  if found then return point_id; end if;
  select * into appointment from public.excom_appointments a
    where a.id = p_appointment_id and a.club_id = cid for share;
  if not found then raise exception 'Choose an ExCom member from your club.'; end if;
  insert into public.excom_points(club_id, email, role, category, points, note)
    values(cid, lower(appointment.email), appointment.role, 'president_deduction', -p_points,
      btrim(p_reason) || ' (Deducted by President: ' || actor || ')') returning id into point_id;
  insert into public.excom_point_deductions(id, club_id, point_id, actor_id, actor_email)
    values(p_request_id, cid, point_id, auth.uid(), actor);
  return point_id;
end;
$$;
revoke all on function public.deduct_excom_points(bigint, integer, text, uuid) from public;
grant execute on function public.deduct_excom_points(bigint, integer, text, uuid) to authenticated;

alter table public.polls add column if not exists share_token uuid not null default gen_random_uuid();
create unique index if not exists polls_share_token_idx on public.polls(share_token);
alter table public.poll_votes add column if not exists voter_name text;

-- Signed-in voters and QR visitors share the ballot ledger and duplicate guard.
create or replace function public.guard_poll_vote()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not exists(select 1 from public.polls p join public.meetings m on m.id = p.meeting_id
    where p.id = new.poll_id and p.club_id = new.club_id and p.is_open
      and p.released_at is not null and not m.cancelled for share of p, m)
  then raise exception 'This poll is not open for voting.'; end if;
  new.voter_email := lower(btrim(new.voter_email));
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.poll_id::text || ':' || new.voter_email, 0));
  if exists(select 1 from public.poll_votes v where v.poll_id = new.poll_id
    and lower(btrim(v.voter_email)) = new.voter_email)
  then raise exception 'This email has already voted in this poll.'; end if;
  return new;
end;
$$;
revoke all on function public.guard_poll_vote() from public;
drop trigger if exists guard_poll_vote on public.poll_votes;
create trigger guard_poll_vote before insert on public.poll_votes
  for each row execute function public.guard_poll_vote();

create or replace function public.get_public_poll(p_token uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('id', p.id, 'meetingLabel', m.label, 'clubName', c.name,
    'isOpen', p.is_open, 'categories', p.categories)
  from public.polls p join public.meetings m on m.id = p.meeting_id and m.club_id = p.club_id
  join public.clubs c on c.id = p.club_id
  where p.share_token = p_token and p.released_at is not null
    and not m.cancelled and c.status = 'approved';
$$;
revoke all on function public.get_public_poll(uuid) from public;
grant execute on function public.get_public_poll(uuid) to anon, authenticated;

create or replace function public.submit_public_poll(
  p_token uuid, p_name text, p_email text, p_answers jsonb
) returns void language plpgsql security definer set search_path = '' as $$
declare
  poll public.polls%rowtype;
  cat jsonb;
  email text := lower(btrim(p_email));
begin
  select p.* into poll from public.polls p
    join public.meetings m on m.id = p.meeting_id and m.club_id = p.club_id
    join public.clubs c on c.id = p.club_id
    where p.share_token = p_token and p.is_open and p.released_at is not null
      and not m.cancelled and c.status = 'approved' for share of p, m;
  if not found then raise exception 'This poll is not open for voting.'; end if;
  if p_name is null or length(btrim(p_name)) not between 1 and 120
    or email is null or length(email) > 254 or email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  then raise exception 'Enter your name and a valid email.'; end if;
  if p_answers is null or jsonb_typeof(p_answers) <> 'object' then
    raise exception 'Select a candidate for every available category.';
  end if;
  if not exists(select 1 from jsonb_array_elements(poll.categories) c
    where jsonb_array_length(c->'candidates') > 0) then
    raise exception 'This poll has no candidates yet.';
  end if;
  for cat in select * from jsonb_array_elements(poll.categories) loop
    if jsonb_array_length(cat->'candidates') > 0 and
      (not (p_answers ? (cat->>'id')) or jsonb_typeof(p_answers->(cat->>'id')) <> 'string'
       or not ((cat->'candidates') ? (p_answers->>(cat->>'id')))) then
      raise exception 'A candidate changed. Reload the poll and choose again.';
    end if;
  end loop;
  if exists(select 1 from jsonb_object_keys(p_answers) k where not exists (
    select 1 from jsonb_array_elements(poll.categories) c
    where c->>'id' = k and jsonb_array_length(c->'candidates') > 0
  )) then raise exception 'Invalid voting category.'; end if;
  -- Also catch older signed-in votes whose emails were not normalized.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(poll.id::text || ':' || email, 0));
  if exists(select 1 from public.poll_votes v where v.poll_id = poll.id and lower(btrim(v.voter_email)) = email)
  then raise exception 'This email has already voted in this poll.'; end if;
  insert into public.poll_votes(poll_id, club_id, voter_email, voter_name, answers)
    values(poll.id, poll.club_id, email, btrim(p_name), p_answers);
end;
$$;
revoke all on function public.submit_public_poll(uuid, text, text, jsonb) from public;
grant execute on function public.submit_public_poll(uuid, text, text, jsonb) to anon, authenticated;
notify pgrst, 'reload schema';
commit;
