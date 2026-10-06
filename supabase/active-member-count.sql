-- Public aggregate only: member rows remain protected by their existing RLS.
-- Run this standalone change before deploying the frontend that calls it.
create or replace function public.get_active_member_count(p_club_id text)
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)
  from public.members m
  where m.club_id = p_club_id
    and m.is_active = true
    and m.is_test_account = false
    -- Match the roster's active rule, including active legacy memberships
    -- without an end date. Use India time consistently for public visitors.
    and (m.membership_end is null
         or m.membership_end >= (now() at time zone 'Asia/Kolkata')::date)
    and exists (
      select 1 from public.clubs c
      where c.id = p_club_id and c.status = 'approved'
    );
$$;

revoke all on function public.get_active_member_count(text) from public;
grant execute on function public.get_active_member_count(text) to anon, authenticated;
