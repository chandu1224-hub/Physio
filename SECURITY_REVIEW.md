# Physio at Home — Security Review and Safe Next Steps

Date: 2026-10-23  
Scope: source review of `physio-at-home/` and the separate `physio-location/` implementation. This is a review document, not a production migration.

## Confirmed application behavior

- Canonical Netlify publish root: `physio-at-home/`.
- The booking handler in `physio-at-home/src/main.jsx` formats the request into a WhatsApp URL and opens WhatsApp. It does not write to `public.booking_requests`.
- The canonical admin panel currently manages `physiotherapists` only. It performs insert/update/delete operations after sign-in and checks whether the signed-in user has a row in `public.admins`. Database RLS must enforce this independently.
- The canonical public provider hook now requests a named list of public-facing columns and filters `status = 'published'`. The public-facing list deliberately excludes `contact_info` and `full_bio`.
- The separate `physio-location/sql/setup.sql` function `public.physios_near` currently aggregates `to_jsonb(t)` from a query selecting `p.*`. If deployed, this can return every column from the provider row to callers with execute permission, including fields not intended for public display. It also uses `latitude`/`longitude`/ `published` conventions that do not match the production schema supplied for the canonical app (`service_lat`/`service_lng`/`status`). Do not run that setup script against production as-is.

## Database permissions: findings from the user's dashboard output

- The reported table grants include broad privileges for both `anon` and `authenticated` on `admins`, `booking_requests`, and `physiotherapists`.
- The reported `physiotherapists` SELECT policies include both a `using (true)` policy and a `using (status = 'published')` policy. Permissive policies combine with OR, so the `using (true)` policy defeats the publication-only restriction.
- The canonical booking form currently does not need public INSERT access to `booking_requests`. Before removing any grants, search every active deployment and confirm no external form, Edge Function, automation, or separate frontend inserts into that table.
- RLS enablement and all policies still need direct verification. No SQL migration has been executed by this review.

## Recommended remediation sequence

1. Confirm the exact production Supabase project URL and schema; confirm whether `physio-location/` is deployed or merely an older implementation.
2. In a staging project, enable/verify RLS for all three tables and inventory policies, table grants, column grants, views, RPC functions, triggers, and functions that use `SECURITY DEFINER`.
3. Replace broad public row reads with a public-safe interface. Prefer a dedicated public view or carefully granted public columns; keep private columns such as contact details and full biographies unavailable to `anon`. Review view security-invoker behavior for the deployed PostgreSQL/Supabase version.
4. Give `authenticated` admin-only write privileges on `physiotherapists`, guarded by an `admins.user_id = auth.uid()` policy. Do not treat the frontend admin check as authorization.
5. Decide whether `booking_requests` is a live feature. If it is not used by the active app, remove public access in staging. If it becomes a real feature, add server-side validation, anti-spam controls, a narrowly scoped INSERT policy, and admin-only reads/updates.
6. Rewrite the nearby-search RPC to return only public fields, use the actual production coordinate/status columns, validate latitude/longitude inputs, enforce publication and service-radius rules, and test anonymous calls. Do not return `p.*` or `to_jsonb(p)`.
7. Test with both anonymous and non-admin authenticated users as well as the actual admin account. Verify unpublished records and private fields cannot be read, and unauthorised writes fail.
8. Run `npm ci`, `npm run build`, and browser regression tests on the working branch; only then review a pull request. No merge or deployment is authorized by this document.

## Current verification state

- Source inspection: done for the canonical booking handler, provider hook, admin panel, Netlify config, and separate location SQL setup.
- Local build/browser test: not run in this environment.
- Staging database tests: not run.
- Production SQL changes: none.
- Production deployment: none.
