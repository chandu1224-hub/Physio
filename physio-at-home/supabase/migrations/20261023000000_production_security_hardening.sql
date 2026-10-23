-- Production security hardening migration for Physio at Home.
-- Reviewed against the project owner's reported schema and RLS policies on 2026-10-23.
-- Intended to run once in the Supabase SQL Editor or via the project's migration workflow.
-- Take/verify a database backup first. This migration does not delete application data.
-- It replaces the known overbroad physio policies and tightens browser-role grants.
-- After running, perform the verification queries in:
-- supabase/review-only-production-security-remediation.sql
--
-- Privacy note: exact service_lat/service_lng remain database-side for physios_near().
-- They are intentionally not granted to anon or included in the public client query.
--
-- service_role grants/ownership are not changed. Never expose service_role credentials in a browser.
begin;

-- 1. Remove duplicate/overbroad physiotherapist SELECT policies. Permissive policies combine
-- with OR, so a policy with USING (true) defeats a published-only policy.
drop policy if exists "public read physiotherapists" on public.physiotherapists;
drop policy if exists "public reads published" on public.physiotherapists;
drop policy if exists "admin write physiotherapists" on public.physiotherapists;
drop policy if exists "admins manage all" on public.physiotherapists;

-- Remove duplicate admin self-read policy. Retain the canonical equivalent.
drop policy if exists "admin reads own row" on public.admins;

-- Recreate one explicit anonymous public listing policy and one admin-only management policy.
-- Do NOT include authenticated in the public listing policy: authenticated is used by the admin
-- panel, and its table-level grants include private admin fields. The admin ALL policy below
-- grants access only when auth.uid() has a matching row in public.admins.
create policy "public reads published physiotherapists"
  on public.physiotherapists
  for select
  to anon
  using (status = 'published');

create policy "admins manage physiotherapists"
  on public.physiotherapists
  for all
  to authenticated
  using (exists (
    select 1 from public.admins a where a.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.admins a where a.user_id = auth.uid()
  ));

-- 2. Remove table-wide grants from PUBLIC and browser roles first. PUBLIC matters because
-- privileges inherited through PUBLIC also appear in has_table_privilege() checks.
revoke all privileges on table public.admins from PUBLIC, anon, authenticated;
revoke all privileges on table public.booking_requests from PUBLIC, anon, authenticated;
revoke all privileges on table public.physiotherapists from PUBLIC, anon, authenticated;
revoke all privileges on table public.therapist_applications from PUBLIC, anon, authenticated;

-- 3. Clear separately granted column privileges for PUBLIC and both browser roles. A table-level
-- REVOKE alone does not necessarily remove separately granted column privileges.
revoke all privileges (user_id, created_at)
  on table public.admins from PUBLIC, anon, authenticated;
revoke all privileges (id, created_at, name, phone, area, condition, care_type, preferred_time,
  notes, physio_id, consent, status)
  on table public.booking_requests from PUBLIC, anon, authenticated;
revoke all privileges (id, slug, name, initials, title, degree, experience_years, specialties,
  conditions, services, service_areas, languages, bio, full_bio, price, availability,
  contact_info, rating, reviews, emoji, color, photo_path, gallery_paths, display_order,
  featured, status, created_at, updated_at, published_at, service_location, service_lat,
  service_lng, service_radius_km)
  on table public.physiotherapists from PUBLIC, anon, authenticated;
revoke all privileges (id, created_at, name, phone, email, qualification, experience_years,
  specialties, city, reg_no, about, consent, status)
  on table public.therapist_applications from PUBLIC, anon, authenticated;

-- 4. Least privilege for anonymous visitors.
-- Admins table: no access.
-- Bookings and therapist applications: insert only. RLS WITH CHECK policies below still apply.
grant insert on table public.booking_requests to anon;
grant insert on table public.therapist_applications to anon;

-- Public listing: select only the fields currently used by the public card/search UI.
-- Deliberately excludes full_bio, contact_info, internal/admin-only data, and exact coordinates.
-- Exact service_lat/service_lng remain server-side for the SECURITY DEFINER nearby RPC; do not
-- expose clinicians' precise saved locations to anonymous browser clients.
grant select (
  id, slug, name, initials, title, degree, experience_years, specialties, conditions,
  services, service_areas, languages, bio, price, availability, rating, reviews, emoji,
  color, photo_path, gallery_paths, display_order, featured, status, created_at,
  published_at, service_location, service_radius_km
) on table public.physiotherapists to anon;

-- 5. Authenticated users need table privileges for the admin UI; RLS must restrict physiotherapist
--    access to admins only. The public listing policy applies to anon, not authenticated.
-- Public form submissions may also come from authenticated clients.
grant select on table public.admins to authenticated;
grant select, insert, update, delete on table public.booking_requests to authenticated;
grant select, insert, update, delete on table public.physiotherapists to authenticated;
grant select, insert, update, delete on table public.therapist_applications to authenticated;

-- 6. Revoke dangerous non-CRUD table privileges from browser roles explicitly.
revoke truncate, references, trigger on table public.admins from anon, authenticated;
revoke truncate, references, trigger on table public.booking_requests from anon, authenticated;
revoke truncate, references, trigger on table public.physiotherapists from anon, authenticated;
revoke truncate, references, trigger on table public.therapist_applications from anon, authenticated;

-- 7. No additional private-submission grants are made. Column-level grants to PUBLIC, anon, and
-- authenticated were cleared above; only the explicit table grants in sections 4–5 are restored.

-- 8. Ensure RLS is enabled (this does not replace correct policies or grants).
alter table public.admins enable row level security;
alter table public.booking_requests enable row level security;
alter table public.physiotherapists enable row level security;
alter table public.therapist_applications enable row level security;

commit;

-- ---------------------------------------------------------------------------
-- SECURITY DEFINER nearby RPC hardening
-- ---------------------------------------------------------------------------
-- Owner-reported live definition:
--   public.physios_near(double precision, double precision)
--   owner postgres; SECURITY DEFINER; search_path=public
--   EXECUTE granted to anon, authenticated, service_role
-- The body was inspected and returns only (physio_id text, distance_km double precision),
-- filters status='published', validates latitude/longitude bounds, and respects service radius.
--
-- Because all table references in the current function body are schema-qualified
-- (public.physiotherapists), and math functions are built-ins, a pg_catalog-only search_path
-- avoids resolving untrusted objects from public. Keep EXECUTE for anon/authenticated because
-- the public nearby-search UI calls this RPC. Do not change ownership or return columns here.
-- This ALTER is still a production change and must only be applied after reviewing the exact
-- deployed function body and confirming it matches the inspected definition.
alter function public.physios_near(double precision, double precision)
  set search_path = pg_catalog;



-- Fix the SECURITY DEFINER function search_path in the same transaction.
-- The function body must keep all table references schema-qualified (public.physiotherapists).
alter function public.physios_near(double precision, double precision)
  set search_path = pg_catalog;

commit;
