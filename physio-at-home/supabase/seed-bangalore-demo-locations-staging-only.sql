-- TEST DATA ONLY — STAGING / LOCAL SUPABASE ONLY.
-- DO NOT RUN AGAINST PRODUCTION: these are deliberately approximate, fictional demo locations.
-- They do not represent actual clinician addresses or verified service bases.
-- The five IDs below are the current demo profile IDs shared during project review.
-- This script modifies only service_location, service_lat, service_lng and service_radius_km.
-- Review the affected-row count before COMMIT. Roll back if it is not exactly 5.

begin;

update public.physiotherapists as p
set service_location = v.service_location,
    service_lat = v.service_lat,
    service_lng = v.service_lng,
    service_radius_km = 10,
    updated_at = now()
from (values
  ('8187845e-6d1f-40e3-8542-0754447f8f48'::uuid, 'DEMO TEST ONLY — Indiranagar, Bengaluru, Karnataka', 12.9784::double precision, 77.6408::double precision),
  ('b682c707-0d20-4511-877f-5df8b559281d'::uuid, 'DEMO TEST ONLY — Jayanagar, Bengaluru, Karnataka', 12.9250::double precision, 77.5838::double precision),
  ('ba0016dc-fb7e-4f7e-891e-777028401826'::uuid, 'DEMO TEST ONLY — Whitefield, Bengaluru, Karnataka', 12.9698::double precision, 77.7500::double precision),
  ('bb0debc6-dff5-429b-b09e-613666e5a8f7'::uuid, 'DEMO TEST ONLY — Malleshwaram, Bengaluru, Karnataka', 13.0031::double precision, 77.5643::double precision),
  ('bbb043e6-98f8-417f-98a7-7cfdcfb616d7'::uuid, 'DEMO TEST ONLY — Koramangala, Bengaluru, Karnataka', 12.9352::double precision, 77.6245::double precision)
) as v(id, service_location, service_lat, service_lng)
where p.id = v.id;

-- Check this result before committing. Expect 5 rows and every label to start with DEMO TEST ONLY.
select id, name, status, service_location, service_lat, service_lng, service_radius_km
from public.physiotherapists
where id in (
  '8187845e-6d1f-40e3-8542-0754447f8f48'::uuid,
  'b682c707-0d20-4511-877f-5df8b559281d'::uuid,
  'ba0016dc-fb7e-4f7e-891e-777028401826'::uuid,
  'bb0debc6-dff5-429b-b09e-613666e5a8f7'::uuid,
  'bbb043e6-98f8-417f-98a7-7cfdcfb616d7'::uuid
)
order by name;

-- For staging tests only, if the reviewed RPC exists:
-- select * from public.physios_near(12.9716, 77.5946);
-- COMMIT; -- uncomment only after verifying exactly 5 intended staging rows.
-- ROLLBACK; -- otherwise leave the transaction uncommitted / roll back.
