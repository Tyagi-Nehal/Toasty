-- Removes only the selected club member's path and associated progress/history.
begin;
create or replace function public.delete_pathway(p_id uuid, p_updated_at timestamptz)
returns void language plpgsql security definer set search_path = '' as $$
declare target public.pathway_enrollments%rowtype;
begin
  if auth.uid() is null or not coalesce(public.can_manage_pathways(public.current_club_id()), false) then
    raise exception 'Only your club VPE or President can delete a path.';
  end if;
  select * into target from public.pathway_enrollments
    where id = p_id and club_id = public.current_club_id() for update;
  if not found then raise exception 'Path not found in your club. Reload the page.'; end if;
  if p_updated_at is null or target.updated_at <> p_updated_at then
    raise exception 'This path changed. Reload and review it before deleting.';
  end if;
  delete from public.pathway_entries where enrollment_id = target.id;
  delete from public.pathway_history where enrollment_id = target.id;
  delete from public.pathway_enrollments where id = target.id;
end;
$$;
revoke all on function public.delete_pathway(uuid,timestamptz) from public;
grant execute on function public.delete_pathway(uuid,timestamptz) to authenticated;
notify pgrst, 'reload schema';
commit;
