-- Public schedule only; existing meeting/assignment row access stays restricted.
create or replace function public.get_visit_meetings(p_club_id text)
returns table (id bigint, meeting_date date)
language sql
stable
security definer
set search_path = ''
as $$
  select m.id, m.meeting_date
  from public.meetings m
  where m.club_id = p_club_id
    and m.cancelled = false
    and m.meeting_date > (now() at time zone 'Asia/Kolkata')::date
    and exists (
      select 1 from public.clubs c
      where c.id = p_club_id and c.status = 'approved'
    )
  order by m.meeting_date, m.id;
$$;

revoke all on function public.get_visit_meetings(text) from public;
grant execute on function public.get_visit_meetings(text) to anon, authenticated;
