# Physio at Home — Production Readiness Status

## Working agreement
- Working branch: `work/production-readiness`
- Base branch: `main`
- Do not merge to `main`, deploy to production, change DNS, or make live database/account changes without explicit approval.
- Never place Supabase service-role secrets in browser code.
- Do not represent demo physiotherapist profiles as real or verified without confirmation.
- Record findings and test evidence here as work progresses.

## Initial repository observations
- Repository contains multiple app areas: `physio-at-home/`, `physio-admin/`, and `physio-location/`, so the intended deploy root and ownership of overlapping code need to be confirmed before major changes.
- The main frontend appears to be React/Vite under `physio-at-home/`.
- Nearby search/location code and a separate admin implementation exist under `physio-location/`.
- `physio-location/sql/setup.sql` includes a `physios_near` SECURITY DEFINER function that aggregates whole rows as JSON, and a public SELECT policy on `physiotherapists`. Review and tighten returned fields and publication/verification rules before production.
- The frontend has fallback physiotherapist data. Confirm demo data cannot be mistaken for verified real providers and does not silently mask production database errors.
- HTML metadata uses `%VITE_SITE_URL%`; verify production environment substitution and canonical/OG URLs.
- Netlify security headers reportedly include a placeholder Supabase host; verify the deployed config and correct it before release.
- Dependency versions and available build/test scripts need review.

## Additional findings (canonical deploy root confirmed)
- User confirmed Netlify deploy root is `physio-at-home/`. Changes intended for the live site must be made there; do not assume the separate `physio-location/` implementation is deployed.
- The canonical `physio-at-home/src/main.jsx` does not import the location finder from `physio-location/`; the location-search implementation currently lives in the separate folder and is not integrated into the deployed app.
- `physio-at-home/src/hooks/useDoctors.js` silently retains built-in sample profiles when Supabase errors or returns no rows. This can hide outages and makes production readiness ambiguous.
- `physio-at-home/src/admin/AdminPanel.jsx` derives editable fields from the first returned row. If the table is empty, it falls back to a raw JSON editor; this is not a friendly profile-management workflow.
- The admin checks the `admins` table in the client, but authorization must be enforced by Supabase RLS as well; client-side checks alone are not a security boundary.
- `physio-at-home/package.json` has a build script but no test/lint scripts and uses `latest` for React, Vite and the Vite React plugin. Pinning dependencies and adding CI checks should be considered after a baseline build is verified.
- `physio-at-home/src/lib/supabase.js` calls `createClient(url, key)` even when environment variables are missing, which may cause a runtime initialization error instead of a controlled configuration screen.
- The booking flow opens WhatsApp and correctly says the user must send the message and await confirmation; it does not persist a booking to a database. Keep this limitation explicit unless a real booking workflow is implemented.
- `physio-at-home/README.md` explicitly describes the current app as a frontend prototype with sample data and no real geospatial matching or booking persistence.

## Verification status
- Repository structure/source inspection: started; canonical deploy root confirmed as `physio-at-home/`.
- Local install/build/test: not yet run in this environment; GitHub file access does not provide a checked-out local working tree.
- Supabase schema/RLS/RPC validation: not yet run against a database.
- Production deployment and live configuration: not verified.
- No production deployment or live database changes have been made.

## Next steps
1. Map package manifests, entry points, deployment configuration, and duplicate app roots.
2. Establish the canonical deploy root and run the available build/test checks.
3. Review Supabase schema, RLS, public-safe provider data, admin authorization, and nearby-search behavior.
4. Review booking flow, form validation, accessibility, SEO, error handling, and security headers.
5. Document reproducible test evidence and request approval before any production-impacting action.
