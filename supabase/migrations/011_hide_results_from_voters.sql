-- =============================================================
-- Results are admin-only
--   The ballot used to show a voter the live tally for every section they
--   had already submitted. vote_counts() was granted to anon to power that,
--   which meant anyone could read a running tally straight from the browser.
--   The ballot no longer calls it, and this closes the door behind it:
--   only the admin results view (which reads public.votes under the
--   "admin read votes" policy) can see the numbers.
-- Apply in: Supabase Dashboard -> SQL Editor. Rerun-safe.
-- =============================================================

revoke execute on function public.vote_counts(uuid) from anon;
revoke execute on function public.vote_counts(uuid) from authenticated;
revoke execute on function public.vote_counts(uuid) from public;

-- Sanity check: no grantee left other than the owner / service role.
-- select grantee, privilege_type
--   from information_schema.role_routine_grants
--   where routine_name = 'vote_counts';
