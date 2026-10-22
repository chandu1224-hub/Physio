-- Physio at Home: one-time setup. Safe to run more than once.
-- Supabase Dashboard > SQL Editor > paste all > Run.

-- 1. Location columns for each physiotherapist
alter table public.physiotherapists
  add column if not exists location_name text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists service_radius_km numeric not null default 10;

-- 2. Nearby search: returns physios whose service radius covers the client's point, closest first.
--    Uses the haversine formula, so no extensions are needed.
create or replace function public.physios_near(user_lat double precision, user_lng double precision)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(to_jsonb(t) order by t.distance_km), '[]'::jsonb)
  from (
    select p.*,
      round((6371 * 2 * asin(least(1, sqrt(
        power(sin(radians(p.latitude - user_lat) / 2), 2) +
        cos(radians(user_lat)) * cos(radians(p.latitude)) *
        power(sin(radians(p.longitude - user_lng) / 2), 2)
      ))))::numeric, 2) as distance_km
    from public.physiotherapists p
    where p.latitude is not null
      and p.longitude is not null
      and coalesce((to_jsonb(p) ->> 'is_active')::boolean, true)
      and coalesce((to_jsonb(p) ->> 'active')::boolean, true)
      and coalesce((to_jsonb(p) ->> 'published')::boolean, true)
  ) t
  where t.distance_km <= t.service_radius_km;
$$;

revoke all on function public.physios_near(double precision, double precision) from public;
grant execute on function public.physios_near(double precision, double precision) to anon, authenticated;

-- 3. Security: public can read physios, only admins can change them
alter table public.admins enable row level security;
alter table public.physiotherapists enable row level security;

drop policy if exists "admin reads own row" on public.admins;
create policy "admin reads own row" on public.admins
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "public read physiotherapists" on public.physiotherapists;
create policy "public read physiotherapists" on public.physiotherapists
  for select to anon, authenticated using (true);

drop policy if exists "admin write physiotherapists" on public.physiotherapists;
create policy "admin write physiotherapists" on public.physiotherapists
  for all to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));
