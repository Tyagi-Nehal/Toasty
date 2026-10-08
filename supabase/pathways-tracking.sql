-- Club-managed progress tracker. Does not submit awards to Toastmasters Base Camp.
begin;
create or replace function public.can_manage_pathways(p_club_id text)
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and p_club_id = public.current_club_id()
    and exists(select 1 from public.clubs c where c.id = p_club_id and c.status = 'approved'
      and (lower(c.president_email) = lower(auth.jwt()->>'email') or exists (
        select 1 from public.excom_appointments a where a.club_id = c.id
          and lower(a.email) = lower(auth.jwt()->>'email') and a.role in ('VPE','Ass. VPE'))));
$$;
create or replace function public.can_view_pathways(p_club_id text, p_member_id bigint)
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and p_club_id = public.current_club_id()
    and exists(select 1 from public.members m join public.clubs c on c.id = m.club_id
      where m.id = p_member_id and m.club_id = p_club_id and not m.is_test_account
        and c.status = 'approved' and (lower(m.email) = lower(auth.jwt()->>'email')
          or public.can_manage_pathways(p_club_id)));
$$;
revoke all on function public.can_manage_pathways(text) from public;
revoke all on function public.can_view_pathways(text,bigint) from public;
grant execute on function public.can_manage_pathways(text), public.can_view_pathways(text,bigint) to authenticated;

create table if not exists public.pathway_enrollments (
  id uuid primary key default gen_random_uuid(),
  club_id text not null references public.clubs(id),
  member_id bigint not null references public.members(id),
  path_name text not null check(length(btrim(path_name)) between 1 and 160),
  current_level integer not null default 1 check(current_level between 1 and 5),
  status text not null default 'in_progress' check(status in ('in_progress','on_hold','completed')),
  started_on date,
  completed_on date,
  notes text not null default '' check(length(notes) <= 2000),
  updated_by text not null,
  updated_at timestamptz not null default clock_timestamp(),
  created_at timestamptz not null default now(),
  check ((status = 'completed') = (completed_on is not null)),
  check(status <> 'completed' or current_level = 5),
  check(started_on is null or completed_on is null or completed_on >= started_on)
);
create index if not exists pathway_enrollments_member_idx on public.pathway_enrollments(club_id,member_id);
create table if not exists public.pathway_entries (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.pathway_enrollments(id),
  club_id text not null references public.clubs(id),
  member_id bigint not null references public.members(id),
  level integer not null check(level between 1 and 5),
  kind text not null check(kind in ('project','speech','meeting_role','education_presentation')),
  title text not null check(length(btrim(title)) between 1 and 200),
  project_name text not null default '' check(length(project_name) <= 200),
  status text not null default 'planned' check(status in ('planned','in_progress','completed')),
  completed_on date,
  meeting_id bigint references public.meetings(id),
  notes text not null default '' check(length(notes) <= 2000),
  updated_by text not null,
  updated_at timestamptz not null default clock_timestamp(),
  created_at timestamptz not null default now(),
  check((status = 'completed') = (completed_on is not null))
);
create index if not exists pathway_entries_enrollment_idx on public.pathway_entries(enrollment_id);
create table if not exists public.pathway_history (
  id uuid primary key default gen_random_uuid(),
  club_id text not null,
  member_id bigint not null,
  enrollment_id uuid not null references public.pathway_enrollments(id),
  entry_id uuid,
  changed_by text not null,
  changed_at timestamptz not null default clock_timestamp(),
  before_record jsonb,
  after_record jsonb not null
);
create index if not exists pathway_history_enrollment_idx on public.pathway_history(enrollment_id,changed_at desc);

create or replace function public.validate_pathway_record()
returns trigger language plpgsql security definer set search_path = '' as $$
declare parent public.pathway_enrollments%rowtype;
begin
  if not public.can_manage_pathways(new.club_id) then raise exception 'Only your club VPE or President can manage Pathways.'; end if;
  if not exists(select 1 from public.members m where m.id = new.member_id and m.club_id = new.club_id and not m.is_test_account)
    then raise exception 'Choose a real member of this club.'; end if;
  if tg_op = 'UPDATE' then
    if new.id <> old.id or new.club_id <> old.club_id or new.member_id <> old.member_id then
      raise exception 'A Pathways record cannot be transferred to another member or club.';
    end if;
    new.created_at := old.created_at;
  end if;
  if new.completed_on > (now() at time zone 'Asia/Kolkata')::date then
    raise exception 'A completion date cannot be in the future.';
  end if;
  if tg_table_name = 'pathway_entries' then
    if tg_op = 'UPDATE' and new.enrollment_id <> old.enrollment_id then
      raise exception 'A progress record cannot be moved to another path.';
    end if;
    select * into parent from public.pathway_enrollments p where p.id = new.enrollment_id;
    if not found or parent.club_id <> new.club_id or parent.member_id <> new.member_id then
      raise exception 'The path and member do not match.';
    end if;
    if new.meeting_id is not null and not exists(select 1 from public.meetings m where m.id = new.meeting_id and m.club_id = new.club_id)
      then raise exception 'Choose a meeting from this club.'; end if;
  end if;
  new.updated_by := lower(auth.jwt()->>'email');
  new.updated_at := clock_timestamp();
  return new;
end;
$$;
create or replace function public.audit_pathway_record()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.pathway_history(club_id,member_id,enrollment_id,entry_id,changed_by,before_record,after_record)
    values(new.club_id,new.member_id,
      case when tg_table_name = 'pathway_enrollments' then new.id else (to_jsonb(new)->>'enrollment_id')::uuid end,
      case when tg_table_name = 'pathway_entries' then new.id else null end,
      new.updated_by, case when tg_op = 'UPDATE' then to_jsonb(old) else null end, to_jsonb(new));
  return new;
end;
$$;
revoke all on function public.validate_pathway_record(), public.audit_pathway_record() from public;

alter table public.pathway_enrollments enable row level security;
alter table public.pathway_entries enable row level security;
alter table public.pathway_history enable row level security;
grant select,insert,update on public.pathway_enrollments,public.pathway_entries to authenticated;
grant select on public.pathway_history to authenticated;
drop policy if exists "pathway enrollments read" on public.pathway_enrollments;
create policy "pathway enrollments read" on public.pathway_enrollments for select to authenticated
  using(public.can_view_pathways(club_id,member_id));
drop policy if exists "pathway enrollments insert" on public.pathway_enrollments;
create policy "pathway enrollments insert" on public.pathway_enrollments for insert to authenticated
  with check(public.can_manage_pathways(club_id));
drop policy if exists "pathway enrollments update" on public.pathway_enrollments;
create policy "pathway enrollments update" on public.pathway_enrollments for update to authenticated
  using(public.can_manage_pathways(club_id)) with check(public.can_manage_pathways(club_id));
drop policy if exists "pathway entries read" on public.pathway_entries;
create policy "pathway entries read" on public.pathway_entries for select to authenticated
  using(public.can_view_pathways(club_id,member_id));
drop policy if exists "pathway entries insert" on public.pathway_entries;
create policy "pathway entries insert" on public.pathway_entries for insert to authenticated
  with check(public.can_manage_pathways(club_id));
drop policy if exists "pathway entries update" on public.pathway_entries;
create policy "pathway entries update" on public.pathway_entries for update to authenticated
  using(public.can_manage_pathways(club_id)) with check(public.can_manage_pathways(club_id));
drop policy if exists "pathway history read" on public.pathway_history;
create policy "pathway history read" on public.pathway_history for select to authenticated
  using(public.can_view_pathways(club_id,member_id));
drop trigger if exists validate_pathway_enrollment on public.pathway_enrollments;
create trigger validate_pathway_enrollment before insert or update on public.pathway_enrollments
  for each row execute function public.validate_pathway_record();
drop trigger if exists validate_pathway_entry on public.pathway_entries;
create trigger validate_pathway_entry before insert or update on public.pathway_entries
  for each row execute function public.validate_pathway_record();
drop trigger if exists audit_pathway_enrollment on public.pathway_enrollments;
create trigger audit_pathway_enrollment after insert or update on public.pathway_enrollments
  for each row execute function public.audit_pathway_record();
drop trigger if exists audit_pathway_entry on public.pathway_entries;
create trigger audit_pathway_entry after insert or update on public.pathway_entries
  for each row execute function public.audit_pathway_record();
notify pgrst, 'reload schema';
commit;
