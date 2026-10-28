begin;

-- Members can change only the details belonging to their current assignment.
create or replace function public.save_role_agenda_details(p_meeting_id bigint, p_role text, p_value text, p_meaning text default '')
returns void language plpgsql security definer set search_path = '' as $$
declare m public.meetings%rowtype;
begin
  if auth.uid() is null or p_role not in ('tmod','grammarian') or p_role is null then
    raise exception 'Please sign in with the account assigned to this role.';
  end if;
  select * into m from public.meetings where id=p_meeting_id and club_id=public.current_club_id() for share;
  if not found or m.cancelled or not exists(select 1 from public.clubs where id=m.club_id and status='approved') then
    raise exception 'This meeting is unavailable.';
  end if;
  perform 1 from public.meeting_role_assignments
    where meeting_id=m.id and role_id=p_role and status in ('taken','auto')
      and lower(taken_by_email)=lower(auth.jwt()->>'email') for share;
  if not found then raise exception 'This role is no longer assigned to your account. Ask the VPE to check the assignment.'; end if;
  if nullif(btrim(p_value),'') is null or length(p_value)>200 or length(coalesce(p_meaning,''))>2000
    or (p_role='grammarian' and nullif(btrim(p_meaning),'') is null) then
    raise exception 'Enter a theme or word (up to 200 characters), and a meaning for the Word of the Day (up to 2000 characters).';
  end if;
  insert into public.agendas(meeting_id,club_id,theme,word_of_day,meaning)
    values(m.id,m.club_id,case when p_role='tmod' then btrim(p_value) else coalesce(m.theme,'') end,
      case when p_role='grammarian' then btrim(p_value) else '' end,
      case when p_role='grammarian' then btrim(p_meaning) else '' end)
    on conflict(meeting_id) do update set
      theme=case when p_role='tmod' then excluded.theme else agendas.theme end,
      word_of_day=case when p_role='grammarian' then excluded.word_of_day else agendas.word_of_day end,
      meaning=case when p_role='grammarian' then excluded.meaning else agendas.meaning end,
      updated_at=clock_timestamp();
end; $$;
revoke all on function public.save_role_agenda_details(bigint,text,text,text) from public;
grant execute on function public.save_role_agenda_details(bigint,text,text,text) to authenticated;

-- Keep existing agenda RLS. Merge only header fields the VPE actually changed,
-- so an unrelated row edit cannot overwrite a role holder's newer details.
create or replace function public.save_agenda_draft(p_row jsonb, p_original jsonb)
returns public.agendas language plpgsql security invoker set search_path = '' as $$
declare r public.agendas%rowtype; result public.agendas%rowtype;
begin
  r := jsonb_populate_record(null::public.agendas,p_row);
  insert into public.agendas(meeting_id,club_id,date_label,theme,word_of_day,meaning,venue,others,overall_start_time,overall_end_time,items,sent_at,sent_snapshot)
    values(r.meeting_id,r.club_id,r.date_label,r.theme,r.word_of_day,r.meaning,r.venue,r.others,r.overall_start_time,r.overall_end_time,r.items,r.sent_at,r.sent_snapshot)
    on conflict(meeting_id) do update set
      theme=case when p_original is null or r.theme is distinct from p_original->>'theme' then r.theme else agendas.theme end,
      word_of_day=case when p_original is null or r.word_of_day is distinct from p_original->>'wordOfDay' then r.word_of_day else agendas.word_of_day end,
      meaning=case when p_original is null or r.meaning is distinct from p_original->>'meaning' then r.meaning else agendas.meaning end,
      date_label=r.date_label,venue=r.venue,others=r.others,overall_start_time=r.overall_start_time,
      overall_end_time=r.overall_end_time,items=r.items,sent_at=r.sent_at,sent_snapshot=r.sent_snapshot,updated_at=clock_timestamp()
    returning * into result;
  return result;
end; $$;
revoke all on function public.save_agenda_draft(jsonb,jsonb) from public;
grant execute on function public.save_agenda_draft(jsonb,jsonb) to authenticated;
notify pgrst,'reload schema';
commit;
