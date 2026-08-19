-- =============================================================
-- Per-division team voting + retire the Best in Attendance award
--   * Best in Attendance is handled by HR outside this platform.
--   * The Synergistic Excellence Award is now contested per division:
--     every voter picks one unit or office in EACH of the 8 divisions.
-- Apply in: Supabase Dashboard -> SQL Editor. Rerun-safe.
-- =============================================================

-- ---------- Divisions ----------
create table if not exists public.divisions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  unique (event_id, name)
);
create index if not exists idx_divisions_event on public.divisions (event_id);

alter table public.units
  add column if not exists division_id uuid references public.divisions (id) on delete set null;
create index if not exists idx_units_division on public.units (division_id);

alter table public.divisions enable row level security;
drop policy if exists "public read divisions of visible events" on public.divisions;
create policy "public read divisions of visible events" on public.divisions
  for select to anon, authenticated using (public.event_is_visible(event_id));
drop policy if exists "admin full access divisions" on public.divisions;
create policy "admin full access divisions" on public.divisions
  for all to authenticated using (true) with check (true);

insert into public.divisions (event_id, name, sort_order) values
('11111111-1111-4111-8111-111111111111', 'Office of the University President', 1),
('11111111-1111-4111-8111-111111111111', 'Colleges and Institute', 2),
('11111111-1111-4111-8111-111111111111', 'Higher Education Services', 3),
('11111111-1111-4111-8111-111111111111', 'Administrative Division', 4),
('11111111-1111-4111-8111-111111111111', 'Finance Division', 5),
('11111111-1111-4111-8111-111111111111', 'Operations Division', 6),
('11111111-1111-4111-8111-111111111111', 'Research and Publication Division', 7),
('11111111-1111-4111-8111-111111111111', 'Extension Division', 8)
on conflict (event_id, name) do update set sort_order = excluded.sort_order;

update public.units u set division_id = d.id
from (values
  ('Office of the University President (Chief of Presidential Management Staff)', 'Office of the University President'),
  ('Legal Unit', 'Office of the University President'),
  ('University Board Secretary Office', 'Office of the University President'),
  ('Information Unit', 'Office of the University President'),
  ('Internal Audit Unit', 'Office of the University President'),
  ('Information and Communications Technology Unit', 'Office of the University President'),
  ('Quality Assurance Office', 'Office of the University President'),
  ('Project Management Unit', 'Office of the University President'),
  ('Planning Unit', 'Office of the University President'),
  ('Graduate Studies', 'Colleges and Institute'),
  ('College of Arts and Sciences', 'Colleges and Institute'),
  ('College of Teacher Education', 'Colleges and Institute'),
  ('College of Computer Studies', 'Colleges and Institute'),
  ('College of Agriculture and Allied Fields', 'Colleges and Institute'),
  ('College of Business and Management', 'Colleges and Institute'),
  ('Institute of Agricultural and Biosystems Engineering', 'Colleges and Institute'),
  ('Student Support and Engagement Office', 'Higher Education Services'),
  ('Admission and Scholarship Office', 'Higher Education Services'),
  ('Alumni Relations Office', 'Higher Education Services'),
  ('Guidance Office', 'Higher Education Services'),
  ('University Registrar''s Office', 'Higher Education Services'),
  ('University Library', 'Higher Education Services'),
  ('Flexible and Distance Learning Office', 'Higher Education Services'),
  ('Human Resource Management Unit', 'Administrative Division'),
  ('Records Management Unit', 'Administrative Division'),
  ('General Services Unit', 'Administrative Division'),
  ('Cash Unit', 'Administrative Division'),
  ('Supply and Property Management Unit', 'Administrative Division'),
  ('Procurement Unit', 'Administrative Division'),
  ('Accounting Unit', 'Finance Division'),
  ('Budget Unit', 'Finance Division'),
  ('Women, Gender and Development Office', 'Operations Division'),
  ('Production and Resource Generation Office', 'Operations Division'),
  ('Crisis Management, Safety and Resilience Office', 'Operations Division'),
  ('Auxiliary and Physical Facilities Office', 'Operations Division'),
  ('LUDIP Office', 'Operations Division'),
  ('Director for Research and Publication Service Office', 'Research and Publication Division'),
  ('Technology Transfer and Patent Unit', 'Research and Publication Division'),
  ('Publication and Printing Unit', 'Research and Publication Division'),
  ('Research Unit', 'Research and Publication Division'),
  ('Innovation Unit', 'Research and Publication Division'),
  ('Research, Ethics and Integrity Unit', 'Research and Publication Division'),
  ('Director for Extension Service Office', 'Extension Division'),
  ('Extension Unit', 'Extension Division'),
  ('Monitoring and Impact Assessment Unit', 'Extension Division')
) as m(unit_name, division_name)
join public.divisions d
  on d.event_id = '11111111-1111-4111-8111-111111111111' and d.name = m.division_name
where u.event_id = '11111111-1111-4111-8111-111111111111' and u.name = m.unit_name;

-- ---------- Votes carry the division for team ballots ----------
alter table public.votes
  add column if not exists division_id uuid references public.divisions (id) on delete cascade;

-- One team vote per (voter, category, division) instead of one per category.
drop index if exists public.uq_votes_once_team;
create unique index if not exists uq_votes_once_team
  on public.votes (category_id, voter_id, division_id)
  where section is null;

-- Team votes cast under the old "one unit overall" rule cannot be mapped onto a
-- division, and would otherwise block nothing while counting nowhere. Clear them.
delete from public.votes
where event_id = '11111111-1111-4111-8111-111111111111' and section is null and division_id is null;

-- ---------- Retire the Best in Attendance award ----------
-- HR runs this one on the existing PRAISEC metrics; criteria and any votes cast
-- for it cascade away with the category.
delete from public.award_categories
where event_id = '11111111-1111-4111-8111-111111111111' and name = 'Best in Attendance Award';

-- ---------- RPC: cast_vote (now division-aware) ----------
drop function if exists public.cast_vote(uuid, uuid, public.employment_group, text, text, uuid, uuid);
drop function if exists public.cast_vote(uuid, uuid, public.employment_group, text, text, uuid, uuid, uuid);
create function public.cast_vote(
  p_event_id uuid,
  p_category_id uuid,
  p_section public.employment_group,
  p_id_number text,
  p_name text,
  p_nominee_person_id uuid default null,
  p_nominee_unit_id uuid default null,
  p_division_id uuid default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_id_norm text := normalize_id(p_id_number);
  v_voter_id uuid;
  v_category award_categories%rowtype;
begin
  if not event_is_open(p_event_id) then
    raise exception 'event_closed';
  end if;

  select v.id into v_voter_id
  from voters v
  where v.event_id = p_event_id
    and normalize_id(v.id_number) = v_id_norm
    and name_matches(p_name, v.full_name);
  if v_voter_id is null then
    raise exception 'not_authorized';
  end if;

  select c.* into v_category
  from award_categories c
  where c.id = p_category_id and c.event_id = p_event_id;
  if v_category.id is null then
    raise exception 'invalid_category';
  end if;

  if v_category.type = 'team' then
    -- one unit or office per division
    if p_section is not null or p_nominee_unit_id is null or p_division_id is null then
      raise exception 'invalid_vote';
    end if;
    if not exists (
      select 1 from divisions d
      where d.id = p_division_id and d.event_id = p_event_id
    ) then
      raise exception 'invalid_section';
    end if;
    if not exists (
      select 1 from units u
      where u.id = p_nominee_unit_id
        and u.event_id = p_event_id
        and u.division_id = p_division_id
    ) then
      raise exception 'invalid_nominee';
    end if;
  else
    if p_section is null or p_nominee_person_id is null or p_division_id is not null then
      raise exception 'invalid_vote';
    end if;
    if v_category.eligible_groups is not null
       and cardinality(v_category.eligible_groups) > 0
       and not (p_section = any (v_category.eligible_groups)) then
      raise exception 'invalid_section';
    end if;
    if not exists (
      select 1 from roster_people r
      where r.id = p_nominee_person_id
        and r.event_id = p_event_id
        and r.classification = p_section
    ) then
      raise exception 'invalid_nominee';
    end if;
  end if;

  begin
    insert into votes (event_id, category_id, section, division_id, voter_id,
                       nominee_person_id, nominee_unit_id)
    values (p_event_id, p_category_id, p_section, p_division_id, v_voter_id,
            p_nominee_person_id, p_nominee_unit_id);
  exception when unique_violation then
    raise exception 'already_voted';
  end;

  return jsonb_build_object('ok', true);
end;
$$;

-- ---------- RPC: verify_voter (voted list carries the division) ----------
create or replace function public.verify_voter(
  p_event_id uuid,
  p_id_number text,
  p_name text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_id_norm text := normalize_id(p_id_number);
  v_voter voters%rowtype;
  v_fails int;
begin
  if v_id_norm = '' then
    raise exception 'invalid_id';
  end if;

  select count(*) into v_fails
  from verify_attempts a
  where a.event_id = p_event_id
    and a.id_norm = v_id_norm
    and not a.ok
    and a.created_at > now() - interval '10 minutes';
  if v_fails >= 8 then
    raise exception 'too_many_attempts';
  end if;

  select v.* into v_voter
  from voters v
  where v.event_id = p_event_id
    and normalize_id(v.id_number) = v_id_norm
    and name_matches(p_name, v.full_name);

  insert into verify_attempts (event_id, id_norm, ok)
  values (p_event_id, v_id_norm, v_voter.id is not null);

  if v_voter.id is null then
    raise exception 'not_authorized';
  end if;

  return jsonb_build_object(
    'voter_id', v_voter.id,
    'full_name', v_voter.full_name,
    'voted', coalesce((
      select jsonb_agg(jsonb_build_object(
        'category_id', vt.category_id,
        'section', vt.section,
        'division_id', vt.division_id,
        'nominee_person_id', vt.nominee_person_id,
        'nominee_unit_id', vt.nominee_unit_id
      ))
      from votes vt where vt.voter_id = v_voter.id
    ), '[]'::jsonb)
  );
end;
$$;

-- ---------- RPC: vote_counts (tallies split by division too) ----------
drop function if exists public.vote_counts(uuid);
create function public.vote_counts(p_category_id uuid)
returns table (
  section public.employment_group,
  division_id uuid,
  nominee_person_id uuid,
  nominee_unit_id uuid,
  votes bigint
)
language sql stable security definer set search_path = public as $$
  select v.section, v.division_id, v.nominee_person_id, v.nominee_unit_id, count(*)::bigint
  from votes v
  join award_categories c on c.id = v.category_id
  where v.category_id = p_category_id
    and event_is_visible(c.event_id)
  group by v.section, v.division_id, v.nominee_person_id, v.nominee_unit_id
$$;

-- ---------- Grants ----------
revoke execute on function public.verify_voter(uuid, text, text) from public;
revoke execute on function public.cast_vote(uuid, uuid, public.employment_group, text, text, uuid, uuid, uuid) from public;
revoke execute on function public.vote_counts(uuid) from public;
grant execute on function public.verify_voter(uuid, text, text) to anon, authenticated;
grant execute on function public.cast_vote(uuid, uuid, public.employment_group, text, text, uuid, uuid, uuid) to anon, authenticated;
grant execute on function public.vote_counts(uuid) to anon, authenticated;

-- Sanity check:
-- select d.name, count(u.id) from public.divisions d
--   left join public.units u on u.division_id = d.id
--   where d.event_id = '11111111-1111-4111-8111-111111111111' group by d.name order by d.name;
-- expect 8 divisions covering 45 units, none unassigned:
-- select name from public.units where event_id = '11111111-1111-4111-8111-111111111111' and division_id is null;
