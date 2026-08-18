-- =============================================================
-- Award Nomination Platform — initial schema
-- Apply in: Supabase Dashboard -> SQL Editor -> New query -> Run
-- =============================================================

-- ---------- Enums ----------
create type public.event_status as enum ('draft', 'open', 'closed', 'archived');
create type public.category_type as enum ('individual', 'team');
create type public.employment_group as enum (
  'permanent_teaching',
  'permanent_non_teaching',
  'job_order_cos'
);

-- ---------- Tables ----------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  description text,
  welcome_text text,
  opens_at timestamptz,
  closes_at timestamptz,
  status public.event_status not null default 'draft',
  logo_path text,
  banner_path text,
  primary_color text not null default '#1d4ed8',
  accent_color text not null default '#f59e0b',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.award_categories (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  name text not null,
  type public.category_type not null default 'individual',
  description text,
  eligible_groups public.employment_group[],   -- null/empty = all groups eligible
  sort_order int not null default 0
);
create index idx_categories_event on public.award_categories (event_id);

create table public.criteria (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.award_categories (id) on delete cascade,
  name text not null,
  description text,
  weight numeric(5,2) not null default 0,
  sort_order int not null default 0
);
create index idx_criteria_category on public.criteria (category_id);

create table public.roster_people (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  full_name text not null,
  position text,
  classification public.employment_group not null
);
create index idx_roster_event on public.roster_people (event_id);

create table public.units (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  name text not null,
  unique (event_id, name)
);
create index idx_units_event on public.units (event_id);

create table public.nominations (
  id uuid primary key,                          -- generated client-side (anon has no SELECT for RETURNING)
  event_id uuid not null references public.events (id) on delete cascade,
  category_id uuid not null references public.award_categories (id) on delete cascade,
  nominee_person_id uuid references public.roster_people (id) on delete cascade,
  nominee_unit_id uuid references public.units (id) on delete cascade,
  nominator_name text not null check (char_length(nominator_name) between 1 and 200),
  nominator_email text not null check (nominator_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  justification text not null check (char_length(justification) between 1 and 5000),
  status text not null default 'submitted',     -- future: shortlisted / winner
  created_at timestamptz not null default now(),
  check (num_nonnulls(nominee_person_id, nominee_unit_id) = 1)
);
create index idx_nominations_event on public.nominations (event_id);
create index idx_nominations_category on public.nominations (category_id);

-- one nomination per nominator+category+nominee
create unique index uq_nomination_person
  on public.nominations (category_id, lower(nominator_email), nominee_person_id)
  where nominee_person_id is not null;
create unique index uq_nomination_unit
  on public.nominations (category_id, lower(nominator_email), nominee_unit_id)
  where nominee_unit_id is not null;

create table public.nomination_attachments (
  id uuid primary key default gen_random_uuid(),
  nomination_id uuid not null references public.nominations (id) on delete cascade,
  storage_path text not null,
  file_name text,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz not null default now()
);
create index idx_attachments_nomination on public.nomination_attachments (nomination_id);

-- ---------- Helper functions ----------
create or replace function public.event_is_open(eid uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from events e
    where e.id = eid
      and e.status = 'open'
      and (e.opens_at is null or now() >= e.opens_at)
      and (e.closes_at is null or now() <= e.closes_at)
  );
$$;

create or replace function public.event_is_visible(eid uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from events e
    where e.id = eid and e.status in ('open', 'closed')
  );
$$;

create or replace function public.nomination_event_is_open(nid uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from nominations n
    where n.id = nid and public.event_is_open(n.event_id)
  );
$$;

-- ---------- Triggers ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
create trigger trg_events_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

-- crude per-email rate limit: max 15 nominations per hour
create or replace function public.check_nomination_rate()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (
    select count(*) from nominations
    where lower(nominator_email) = lower(new.nominator_email)
      and created_at > now() - interval '1 hour'
  ) >= 15 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
create trigger trg_nomination_rate
  before insert on public.nominations
  for each row execute function public.check_nomination_rate();

-- ---------- Row Level Security ----------
alter table public.events enable row level security;
alter table public.award_categories enable row level security;
alter table public.criteria enable row level security;
alter table public.roster_people enable row level security;
alter table public.units enable row level security;
alter table public.nominations enable row level security;
alter table public.nomination_attachments enable row level security;

-- events
create policy "public read visible events" on public.events
  for select to anon using (status in ('open', 'closed'));
create policy "admin full access events" on public.events
  for all to authenticated using (true) with check (true);

-- award_categories
create policy "public read categories of visible events" on public.award_categories
  for select to anon using (public.event_is_visible(event_id));
create policy "admin full access categories" on public.award_categories
  for all to authenticated using (true) with check (true);

-- criteria
create policy "public read criteria of visible events" on public.criteria
  for select to anon using (
    exists (
      select 1 from public.award_categories c
      where c.id = category_id and public.event_is_visible(c.event_id)
    )
  );
create policy "admin full access criteria" on public.criteria
  for all to authenticated using (true) with check (true);

-- roster_people
create policy "public read roster of visible events" on public.roster_people
  for select to anon using (public.event_is_visible(event_id));
create policy "admin full access roster" on public.roster_people
  for all to authenticated using (true) with check (true);

-- units
create policy "public read units of visible events" on public.units
  for select to anon using (public.event_is_visible(event_id));
create policy "admin full access units" on public.units
  for all to authenticated using (true) with check (true);

-- nominations: anon may only INSERT into open events; no anon select
create policy "anon insert nominations into open events" on public.nominations
  for insert to anon with check (public.event_is_open(event_id));
create policy "admin full access nominations" on public.nominations
  for all to authenticated using (true) with check (true);

-- nomination_attachments: anon may only INSERT rows for open-event nominations
create policy "anon insert attachments for open events" on public.nomination_attachments
  for insert to anon with check (public.nomination_event_is_open(nomination_id));
create policy "admin full access attachments" on public.nomination_attachments
  for all to authenticated using (true) with check (true);

-- ---------- Storage buckets ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('branding', 'branding', true, 5242880,
   array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']),
  ('attachments', 'attachments', false, 10485760,
   array['application/pdf', 'image/jpeg', 'image/png', 'image/webp',
         'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do nothing;

-- storage policies
create policy "public read branding" on storage.objects
  for select using (bucket_id = 'branding');
create policy "admin write branding" on storage.objects
  for insert to authenticated with check (bucket_id = 'branding');
create policy "admin update branding" on storage.objects
  for update to authenticated using (bucket_id = 'branding');
create policy "admin delete branding" on storage.objects
  for delete to authenticated using (bucket_id = 'branding');

create policy "anyone upload attachments" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'attachments');
create policy "admin read attachments" on storage.objects
  for select to authenticated using (bucket_id = 'attachments');
create policy "admin delete attachments" on storage.objects
  for delete to authenticated using (bucket_id = 'attachments');
