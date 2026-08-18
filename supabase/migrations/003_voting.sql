-- =============================================================
-- 003: Authorized-voter polling
-- Voters verify with ID number + fuzzy-matched name, then cast
-- one vote per (category, section). Results via vote_counts().
-- Apply in: Supabase Dashboard -> SQL Editor
-- =============================================================

-- ---------- Name / ID normalization ----------
create extension if not exists unaccent with schema extensions;

-- unaccent() is STABLE; wrap it so it can be used in immutable fns & indexes
create or replace function public.f_unaccent(t text)
returns text language sql immutable parallel safe strict as $$
  select extensions.unaccent('extensions.unaccent'::regdictionary, t)
$$;

create or replace function public.normalize_id(raw text)
returns text language sql immutable parallel safe as $$
  select regexp_replace(lower(coalesce(raw, '')), '[^a-z0-9]+', '', 'g')
$$;

-- "Osapdin, Jayvee M." -> {jayvee, osapdin}  (1-letter tokens = initials, dropped)
create or replace function public.name_tokens(raw text)
returns text[] language sql immutable parallel safe as $$
  select coalesce(array(
    select distinct t
    from unnest(string_to_array(
      regexp_replace(lower(public.f_unaccent(coalesce(raw, ''))),
                     '[^a-z0-9]+', ' ', 'g'), ' ')) as t
    where length(t) > 1
    order by t
  ), '{}')
$$;

-- Token-set containment in either direction with >= 2 common tokens.
-- Covers: dropped middle names, initial-only records, any word order.
create or replace function public.name_matches(input_name text, record_name text)
returns boolean language sql immutable parallel safe as $$
  select case
    when cardinality(a) < 1 or cardinality(b) < 1 then false
    else (a <@ b or b <@ a)
      and cardinality(array(select unnest(a) intersect select unnest(b))) >= 2
  end
  from (select public.name_tokens(input_name) a,
               public.name_tokens(record_name) b) s
$$;

-- ---------- Tables ----------
create table public.voters (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  id_number text not null,
  full_name text not null,
  created_at timestamptz not null default now()
);
create unique index uq_voters_event_id_number
  on public.voters (event_id, public.normalize_id(id_number));
create index idx_voters_event on public.voters (event_id);

create table public.votes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  category_id uuid not null references public.award_categories (id) on delete cascade,
  section public.employment_group,              -- null = team/unit vote
  voter_id uuid not null references public.voters (id) on delete cascade,
  nominee_person_id uuid references public.roster_people (id) on delete cascade,
  nominee_unit_id uuid references public.units (id) on delete cascade,
  created_at timestamptz not null default now(),
  check (num_nonnulls(nominee_person_id, nominee_unit_id) = 1),
  check (
    (nominee_unit_id is not null and section is null) or
    (nominee_person_id is not null and section is not null)
  )
);
create unique index uq_votes_once
  on public.votes (category_id, voter_id, coalesce(section::text, '_team'));
create index idx_votes_category on public.votes (category_id);
create index idx_votes_event on public.votes (event_id);

create table public.verify_attempts (
  id bigint generated always as identity primary key,
  event_id uuid not null,
  id_norm text not null,
  ok boolean not null,
  created_at timestamptz not null default now()
);
create index idx_verify_attempts on public.verify_attempts (event_id, id_norm, created_at);

-- ---------- RLS: RPC-only for anon; admins full access ----------
alter table public.voters enable row level security;
alter table public.votes enable row level security;
alter table public.verify_attempts enable row level security;

create policy "admin full access voters" on public.voters
  for all to authenticated using (true) with check (true);
create policy "admin full access votes" on public.votes
  for all to authenticated using (true) with check (true);
create policy "admin read verify_attempts" on public.verify_attempts
  for select to authenticated using (true);
-- (no anon policies: all anon access goes through the security-definer RPCs)

-- ---------- RPC: verify_voter ----------
-- Returns the voter's canonical identity plus everything they already voted on.
create or replace function public.verify_voter(
  p_event_id uuid,
  p_id_number text,
  p_name text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_id_norm text := normalize_id(p_id_number);
  v_voter voters%rowtype;
  v_failures int;
begin
  if v_id_norm = '' then
    raise exception 'invalid_id';
  end if;

  select count(*) into v_failures
  from verify_attempts
  where event_id = p_event_id
    and id_norm = v_id_norm
    and ok = false
    and created_at > now() - interval '10 minutes';
  if v_failures >= 10 then
    raise exception 'too_many_attempts';
  end if;

  select v.* into v_voter
  from voters v
  where v.event_id = p_event_id
    and normalize_id(v.id_number) = v_id_norm
    and name_matches(p_name, v.full_name);

  if v_voter.id is null then
    insert into verify_attempts (event_id, id_norm, ok)
    values (p_event_id, v_id_norm, false);
    raise exception 'not_authorized';
  end if;

  insert into verify_attempts (event_id, id_norm, ok)
  values (p_event_id, v_id_norm, true);

  return jsonb_build_object(
    'voter_id', v_voter.id,
    'full_name', v_voter.full_name,
    'voted', coalesce((
      select jsonb_agg(jsonb_build_object(
        'category_id', vt.category_id,
        'section', vt.section,
        'nominee_person_id', vt.nominee_person_id,
        'nominee_unit_id', vt.nominee_unit_id
      ))
      from votes vt where vt.voter_id = v_voter.id
    ), '[]'::jsonb)
  );
end;
$$;

-- ---------- RPC: cast_vote ----------
create or replace function public.cast_vote(
  p_event_id uuid,
  p_category_id uuid,
  p_section public.employment_group,
  p_id_number text,
  p_name text,
  p_nominee_person_id uuid default null,
  p_nominee_unit_id uuid default null
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
    if p_section is not null or p_nominee_unit_id is null then
      raise exception 'invalid_vote';
    end if;
    if not exists (
      select 1 from units u
      where u.id = p_nominee_unit_id and u.event_id = p_event_id
    ) then
      raise exception 'invalid_nominee';
    end if;
  else
    if p_section is null or p_nominee_person_id is null then
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
    insert into votes (event_id, category_id, section, voter_id,
                       nominee_person_id, nominee_unit_id)
    values (p_event_id, p_category_id, p_section, v_voter_id,
            p_nominee_person_id, p_nominee_unit_id);
  exception when unique_violation then
    raise exception 'already_voted';
  end;

  return jsonb_build_object('ok', true);
end;
$$;

-- ---------- RPC: vote_counts ----------
create or replace function public.vote_counts(p_category_id uuid)
returns table (
  section public.employment_group,
  nominee_person_id uuid,
  nominee_unit_id uuid,
  votes bigint
)
language sql stable security definer set search_path = public as $$
  select v.section, v.nominee_person_id, v.nominee_unit_id, count(*)::bigint
  from votes v
  join award_categories c on c.id = v.category_id
  where v.category_id = p_category_id
    and event_is_visible(c.event_id)
  group by v.section, v.nominee_person_id, v.nominee_unit_id
$$;

-- ---------- Grants ----------
revoke execute on function public.verify_voter(uuid, text, text) from public;
revoke execute on function public.cast_vote(uuid, uuid, public.employment_group, text, text, uuid, uuid) from public;
revoke execute on function public.vote_counts(uuid) from public;
grant execute on function public.verify_voter(uuid, text, text) to anon, authenticated;
grant execute on function public.cast_vote(uuid, uuid, public.employment_group, text, text, uuid, uuid) to anon, authenticated;
grant execute on function public.vote_counts(uuid) to anon, authenticated;

-- ---------- Test voters (remove before go-live) ----------
insert into public.voters (event_id, id_number, full_name) values
('11111111-1111-4111-8111-111111111111', 'EMP-0001', 'Osapdin, Jayvee M.'),
('11111111-1111-4111-8111-111111111111', 'EMP-0002', 'Dela Cruz, Juan Santos'),
('11111111-1111-4111-8111-111111111111', 'EMP-0003', 'Braña, Jolly O.');
