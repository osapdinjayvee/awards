-- =============================================================
-- Who has voted, and who has not
--   Returns one row per authorized voter with a count of the sections they
--   have submitted — deliberately no nominee columns, so tracking turnout
--   never means reading anyone's ballot.
--   Admin only: execute is granted to authenticated, not to anon.
-- Apply in: Supabase Dashboard -> SQL Editor. Rerun-safe.
-- =============================================================

drop function if exists public.voter_turnout(uuid);
create function public.voter_turnout(p_event_id uuid)
returns table (
  voter_id uuid,
  id_number text,
  full_name text,
  votes_cast bigint,
  last_vote_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select v.id,
         v.id_number,
         v.full_name,
         count(vt.id)::bigint,
         max(vt.created_at)
  from voters v
  left join votes vt on vt.voter_id = v.id and vt.event_id = p_event_id
  where v.event_id = p_event_id
  group by v.id, v.id_number, v.full_name
  order by v.full_name
$$;

revoke execute on function public.voter_turnout(uuid) from public;
grant execute on function public.voter_turnout(uuid) to authenticated;

-- Sanity check:
-- select count(*) filter (where votes_cast > 0) as started,
--        count(*) as authorized
-- from public.voter_turnout('11111111-1111-4111-8111-111111111111');
