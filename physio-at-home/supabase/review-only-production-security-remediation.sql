-- REVIEW ONLY — DO NOT RUN ON PRODUCTION WITHOUT REVIEW AND EXPLICIT APPROVAL.
-- Prepared against the schema and grants reported by the project owner on 2026-10-23.
-- This file is a proposal, not an executed migration. Review application flows and test in a
-- disposable/staging database before applying. Keep a database backup and a rollback plan.
--
-- Goals:
--   * Anonymous visitors can read only published physiotherapist public fields.
--   * Anonymous visitors can submit booking requests and therapist applications, but cannot
--     read/update/delete existing submissions or access their private fields.
--   * Authenticated admins retain CRUD through the existing admins-table membership policies.
--   * No anonymous/authenticated TRUNCATE, TRIGGER, REFERENCES or broad table privileges.
--   * The nearby RPC remains separately callable and returns only provider ID + distance.
--
-- Important:
--   * service_role is intentionally untouched; never expose its key in a browser/client bundle.
--   * The admin UI uses SELECT * and needs its full authenticated admin table privileges.
--   * Confirm whether the frontend requires any extra public physio columns before applying.
--   * Existing grants can come from inherited roles/default privileges too; verify effective
--     privileges after applying. This proposal does not change ownership or default privileges.
--   * Run the verification section and test public forms, admin CRUD, published listings and RPC.
--
-- Proposed migration. Execute only after review, on a tested copy first.

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
-- Deliberately excludes full_bio, contact_info, and internal/admin-only data.
grant select (
  id, slug, name, initials, title, degree, experience_years, specialties, conditions,
  services, service_areas, languages, bio, price, availability, rating, reviews, emoji,
  color, photo_path, gallery_paths, display_order, featured, status, created_at,
  published_at, service_location, service_lat, service_lng, service_radius_km
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

-- ---------------------------------------------------------------------------
-- POST-CHANGE VERIFICATION QUERIES (run after a separately approved migration)
-- ---------------------------------------------------------------------------

-- A. Confirm policies; there must be no other permissive public SELECT policy that allows all rows.
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('admins','booking_requests','physiotherapists','therapist_applications')
order by tablename, policyname;

-- B. Inspect explicit table grants, including PUBLIC. Also run the effective-privilege query
-- below because information_schema views alone may not show every inherited/effective grant.
select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('admins','booking_requests','physiotherapists','therapist_applications')
  and grantee in ('PUBLIC','anon','authenticated')
order by table_name, grantee, privilege_type;

-- B2. Effective privileges must show TRUNCATE=false for anon and authenticated on every table.
select r.role_name, t.table_name,
       has_table_privilege(r.role_name, 'public.' || t.table_name, 'SELECT') as can_select,
       has_table_privilege(r.role_name, 'public.' || t.table_name, 'INSERT') as can_insert,
       has_table_privilege(r.role_name, 'public.' || t.table_name, 'UPDATE') as can_update,
       has_table_privilege(r.role_name, 'public.' || t.table_name, 'DELETE') as can_delete,
       has_table_privilege(r.role_name, 'public.' || t.table_name, 'TRUNCATE') as can_truncate
from (values ('anon'), ('authenticated')) as r(role_name)
cross join (values ('admins'), ('booking_requests'), ('physiotherapists'),
                   ('therapist_applications')) as t(table_name)
order by t.table_name, r.role_name;

-- C. Confirm public physiotherapist column grants (should be limited to the allowlist above).
select grantee, table_name, column_name, privilege_type
from information_schema.role_column_grants
where table_schema = 'public'
  and table_name in ('admins','booking_requests','physiotherapists','therapist_applications')
  and grantee in ('anon','authenticated')
order by table_name, grantee, column_name, privilege_type;

-- D. Confirm RLS remains enabled.
select n.nspname as schema_name, c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('admins','booking_requests','physiotherapists','therapist_applications')
order by c.relname;

-- E. Confirm RPC owner, security-definer flag, fixed search_path, and function ACL.
select p.oid::regprocedure as function_signature,
       r.rolname as function_owner,
       p.prosecdef as security_definer,
       p.proconfig as function_settings,
       p.proacl as function_acl
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
join pg_roles r on r.oid = p.proowner
where n.nspname = 'public'
  and p.proname = 'physios_near';

-- F. Confirm schema privileges do not allow untrusted roles to create objects in public.
select n.nspname as schema_name, r.rolname as grantee,
       has_schema_privilege(r.rolname, n.oid, 'USAGE') as has_usage,
       has_schema_privilege(r.rolname, n.oid, 'CREATE') as has_create
from pg_namespace n
cross join pg_roles r
where n.nspname = 'public'
  and r.rolname in ('anon','authenticated','public')
order by r.rolname;

-- G. Smoke tests to perform manually using anon and admin sessions:
--    1) Anonymous SELECT from booking_requests and therapist_applications must fail.
--    2) Anonymous INSERT of a valid consented booking/application must work.
--    3) Anonymous SELECT physiotherapists must return published rows only and only public columns.
--    4) Non-admin authenticated user must not CRUD admin-managed rows.
--    5) Admin can create/edit/publish/unpublish/delete a physio and read/manage submissions.
--    6) Nearby RPC returns only published provider IDs within each provider's configured radius.
--    7) Verify no private booking/application fields appear in browser network responses.
--    8) Confirm the function's deployed definition exactly matches the reviewed body before
--       applying the ALTER FUNCTION search_path change.
