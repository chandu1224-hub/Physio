-- READ-ONLY security inventory for Physio at Home.
-- Safe to run in the Supabase SQL Editor: these statements only SELECT metadata.
-- Run against staging first if available. This script does not alter grants, policies, tables, or data.

-- 1) Confirm whether RLS is enabled or forced on the app tables.
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('admins', 'booking_requests', 'physiotherapists', 'therapist_applications')
  and c.relkind in ('r', 'p')
order by c.relname;

-- 2) List policies, including command, role targets, USING and WITH CHECK.
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual as using_expression,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('admins', 'booking_requests', 'physiotherapists', 'therapist_applications')
order by tablename, policyname;

-- 3) List table-level privileges granted to public/client roles.
select
  table_schema,
  table_name,
  grantee,
  privilege_type,
  is_grantable
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('admins', 'booking_requests', 'physiotherapists', 'therapist_applications')
  and grantee in ('anon', 'authenticated', 'PUBLIC', 'service_role')
order by table_name, grantee, privilege_type;

-- 4) List column-level grants, which may allow access even if table-level grants are absent.
select
  table_schema,
  table_name,
  column_name,
  grantee,
  privilege_type,
  is_grantable
from information_schema.column_privileges
where table_schema = 'public'
  and table_name in ('admins', 'booking_requests', 'physiotherapists', 'therapist_applications')
  and grantee in ('anon', 'authenticated', 'PUBLIC', 'service_role')
order by table_name, grantee, column_name, privilege_type;

-- 5) List columns and types to verify the deployed schema before writing migrations.
select
  table_name,
  ordinal_position,
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in ('admins', 'booking_requests', 'physiotherapists', 'therapist_applications')
order by table_name, ordinal_position;

-- 6) List functions named for nearby search and their grants/definitions.
-- Review returned function definitions before granting EXECUTE or replacing anything.
select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as identity_arguments,
  p.prosecdef as security_definer,
  p.proconfig as function_settings,
  pg_get_functiondef(p.oid) as definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('physios_near')
order by p.proname, identity_arguments;

-- 7) Inspect function EXECUTE privileges for anon/authenticated/public.
select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as identity_arguments,
  r.rolname as role_name,
  has_function_privilege(r.rolname, p.oid, 'EXECUTE') as can_execute
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
cross join pg_roles r
where n.nspname = 'public'
  and p.proname in ('physios_near')
  and r.rolname in ('anon', 'authenticated', 'service_role')
order by p.proname, identity_arguments, r.rolname;
