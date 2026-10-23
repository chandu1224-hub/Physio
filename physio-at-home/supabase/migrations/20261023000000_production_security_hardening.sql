begin;

-- Remove permissive/duplicate physiotherapist policies. Policies combine with OR,
-- so the old USING (true) policy bypassed the published-only filter.
drop policy if exists "public read physiotherapists" on public.physiotherapists;
drop policy if exists "public reads published" on public.physiotherapists;
drop policy if exists "admin write physiotherapists" on public.physiotherapists;
drop policy if exists "admins manage all" on public.physiotherapists;
drop policy if exists "admins manage physiotherapists" on public.physiotherapists;
drop policy if exists "public reads published physiotherapists" on public.physiotherapists;

create policy "public reads published physiotherapists"
  on public.physiotherapists
  for select
  to anon
  using (status = 'published');

create policy "admins manage physiotherapists"
  on public.physiotherapists
  for all
  to authenticated
  using (
    exists (select 1 from public.admins a where a.user_id = (select auth.uid()))
  )
  with check (
    exists (select 1 from public.admins a where a.user_id = (select auth.uid()))
  );

-- Optimize auth.uid() evaluation and keep a single admin self-read policy.
drop policy if exists "admin reads own row" on public.admins;
drop policy if exists "admins read own row" on public.admins;
create policy "admins read own row" on public.admins for select to authenticated using (user_id = (select auth.uid()));

-- Restrict public form submissions to anonymous INSERT only; admin access is separate.
drop policy if exists "admin manages bookings" on public.booking_requests;
create policy "admin manages bookings" on public.booking_requests for all to authenticated using (exists (select 1 from public.admins a where a.user_id = (select auth.uid()))) with check (exists (select 1 from public.admins a where a.user_id = (select auth.uid())));
drop policy if exists "public can submit booking" on public.booking_requests;
create policy "public can submit booking" on public.booking_requests for insert to anon with check (status = 'new' and consent = true);

drop policy if exists "admin manages applications" on public.therapist_applications;
create policy "admin manages applications" on public.therapist_applications for all to authenticated using (exists (select 1 from public.admins a where a.user_id = (select auth.uid()))) with check (exists (select 1 from public.admins a where a.user_id = (select auth.uid())));
drop policy if exists "public can apply" on public.therapist_applications;
create policy "public can apply" on public.therapist_applications for insert to anon with check (status = 'new' and consent = true);

-- Remove broad client grants, including dangerous TRUNCATE/REFERENCES/TRIGGER rights.
revoke all privileges on table public.admins from public, anon, authenticated;
revoke all privileges on table public.booking_requests from public, anon, authenticated;
revoke all privileges on table public.physiotherapists from public, anon, authenticated;
revoke all privileges on table public.therapist_applications from public, anon, authenticated;

-- Table-level revokes do not reliably remove separately granted column privileges.
-- Clear existing browser-role column grants before restoring only the required access.
revoke all privileges (user_id, created_at)
  on table public.admins from public, anon, authenticated;
revoke all privileges (id, created_at, name, phone, area, condition, care_type, preferred_time,
  notes, physio_id, consent, status)
  on table public.booking_requests from public, anon, authenticated;
revoke all privileges (id, slug, name, initials, title, degree, experience_years, specialties,
  conditions, services, service_areas, languages, bio, full_bio, price, availability,
  contact_info, rating, reviews, emoji, color, photo_path, gallery_paths, display_order,
  featured, status, created_at, updated_at, published_at, service_location, service_lat,
  service_lng, service_radius_km)
  on table public.physiotherapists from public, anon, authenticated;
revoke all privileges (id, created_at, name, phone, email, qualification, experience_years,
  specialties, city, reg_no, about, consent, status)
  on table public.therapist_applications from public, anon, authenticated;

-- Admin identity lookup: users can read only their own admin row through the existing RLS policy.
grant select on table public.admins to authenticated;

-- Public site: published clinician cards only. Exact service coordinates, contact_info,
-- and full_bio are intentionally not available to anonymous clients.
grant select (
  id, name, initials, title, degree, experience_years, specialties, conditions,
  services, service_areas, languages, bio, price, availability, rating, reviews,
  emoji, color, photo_path, gallery_paths, display_order, featured, status,
  service_location, service_radius_km
) on table public.physiotherapists to anon;

-- Admin UI has full CRUD privileges, but the admin-only RLS policy limits rows.
grant select, insert, update, delete on table public.physiotherapists to authenticated;
grant select, insert, update, delete on table public.booking_requests to authenticated;
grant select, insert, update, delete on table public.therapist_applications to authenticated;

-- Public forms may submit new requests, but cannot read, update, delete, or truncate them.
grant insert on table public.booking_requests to anon;
grant insert on table public.therapist_applications to anon;

-- Keep the nearby lookup public because the site needs it; it returns only published
-- physiotherapist IDs and distances within each configured service radius.
alter function public.physios_near(double precision, double precision)
  set search_path = pg_catalog;
grant execute on function public.physios_near(double precision, double precision) to anon;
grant execute on function public.physios_near(double precision, double precision) to authenticated;
grant execute on function public.physios_near(double precision, double precision) to service_role;

-- This event-trigger function must never be callable through the public Data API.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated, service_role;

-- Preserve RLS on all four application tables.
alter table public.admins enable row level security;
alter table public.booking_requests enable row level security;
alter table public.physiotherapists enable row level security;
alter table public.therapist_applications enable row level security;

commit;
