-- =============================================================
-- Votes are append-only: cast once, never changed
--   cast_vote() already refuses a second vote per (category, voter, section /
--   division) through uq_votes_once_person / uq_votes_once_team. This closes
--   the two remaining ways a cast vote could be altered afterwards:
--     1. the blanket admin policy allowed UPDATE/DELETE on votes from any
--        signed-in admin session;
--     2. nothing stopped an UPDATE that silently moved a vote to another
--        nominee, which no audit trail would show.
--   Deleting an event still removes its votes — that cascade is a referential
--   action performed by the system, so it bypasses row security, and no
--   BEFORE DELETE trigger is added here that would block it.
-- Apply in: Supabase Dashboard -> SQL Editor. Rerun-safe.
-- =============================================================

-- ---------- Admins read results; they do not edit ballots ----------
drop policy if exists "admin full access votes" on public.votes;
drop policy if exists "admin read votes" on public.votes;
create policy "admin read votes" on public.votes
  for select to authenticated using (true);
-- (anon still has no policy at all: every anon path goes through the RPCs,
--  and cast_vote is security definer, so inserts keep working.)

-- ---------- Hard stop on rewriting a ballot ----------
create or replace function public.votes_immutable()
returns trigger language plpgsql as $$
begin
  raise exception 'votes_immutable'
    using hint = 'A cast vote cannot be changed. Delete the event to clear its ballots.';
end;
$$;

drop trigger if exists trg_votes_no_update on public.votes;
create trigger trg_votes_no_update
  before update on public.votes
  for each row execute function public.votes_immutable();

-- Sanity check — this must raise votes_immutable rather than change a row:
-- update public.votes set nominee_unit_id = nominee_unit_id where true;
--
-- And the policy list should show only "admin read votes" (SELECT):
-- select policyname, cmd, roles from pg_policies where tablename = 'votes';
