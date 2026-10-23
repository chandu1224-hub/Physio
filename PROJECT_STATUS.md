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


## Implementation checkpoint — 2026-10-23
- Confirmed with the user that Netlify's publish root is `physio-at-home/`.
- Updated `physio-at-home/src/hooks/useDoctors.js` so production does not silently use the illustrative sample list when Supabase returns an error or no published rows. The hook now exposes loading/ready/empty/error status; sample fallback is restricted to development mode.
- Updated `physio-at-home/src/main.jsx` to display a non-sensitive error/empty-state message when the provider query fails or returns no profiles.
- Important limitation: this is a source-level change only. A local build and browser regression test have not yet been run, so do not deploy until they pass.
- Remaining high-priority items: replace placeholder CSP host with the actual Supabase project host; avoid `select("*")` for public provider data; establish a verified/published schema and enforce it with RLS; implement a typed admin form; integrate 10 km geospatial matching into the canonical app; pin dependencies and verify lockfile consistency.

- Pinned previously floating `latest` dependencies for React, React DOM, Vite, and the Vite React plugin to the versions already resolved in the committed npm lockfile (`19.3.1`, `19.3.1`, `8.3.4`, `6.1.2`) and aligned the lockfile root metadata. Must verify with `npm ci` and `npm run build` locally/CI.
- The provider error/empty message UI was wired into the canonical app. Build/runtime verification is still pending.

## Security and booking-flow review — 2026-10-23
- Inspected the canonical booking handler in `physio-at-home/src/main.jsx`: it creates a WhatsApp message and opens `wa.me`; it does not insert into `booking_requests`. The UI correctly states that users must send the WhatsApp message and await confirmation. Before changing database grants, search all deployed source paths for any other `booking_requests` usage.
- Updated `physio-at-home/src/hooks/useDoctors.js` to request an explicit public-facing column allowlist rather than `select("*")`, filter rows to `status = 'published'`, and order by `display_order`. This prevents the public listing query from returning non-public columns such as `contact_info` and `full_bio` if the supplied production schema is accurate.
- Updated the Netlify Content-Security-Policy to use `https://*.supabase.co` and `wss://*.supabase.co` rather than the literal `YOUR-PROJECT.supabase.co` placeholder. This is a compatibility fallback, not the tightest possible allowlist; replace it with the exact project host once confirmed from the Supabase project URL.
- Supabase documentation confirms grants and RLS are separate controls; adding policies does not revoke table grants. Keep database changes staged until RLS-enabled status and all application use paths are verified.
- These are source/config commits on `work/production-readiness` only. No production deployment or live database changes were made. Build, browser, and database policy tests remain unrun.


## Progress update — 2026-10-23

### Changes committed on `work/production-readiness`
- Added a GitHub Actions CI workflow for `physio-at-home/`; the latest checked workflow run passed dependency installation and the production build: https://github.com/chandu1224-hub/Physio/actions/runs/39978936432
- Supabase client initialization now handles missing public environment variables without crashing.
- Public provider loading uses a named public-field allowlist and filters to `status = 'published'`; production errors/empty results no longer silently display the illustrative fallback profiles.
- Admin sign-in, session restoration, profile loading, saving, and deletion now handle unexpected failures more safely.
- The admin profile editor now has a schema-backed empty state, so adding the first profile does not require a raw JSON editor. New profiles default to `draft`; an administrator must explicitly publish them after verifying details.
- Added `physio-at-home/supabase/review-only-nearby-search.sql` as a proposal for a public-field allowlisted nearby-search RPC. It has not been executed.

### Still release-blocking
- Production Supabase grants and RLS policies remain unsafe/incompletely verified based on the dashboard outputs supplied by the user. The existing permissive `using (true)` provider policy may expose unpublished rows and private columns to direct table queries; application-side field allowlists do not fix database access.
- The canonical nearby-search UI now requests browser geolocation or accepts a typed area/address, geocodes typed locations through Photon, and calls the `physios_near` RPC. It no longer pretends sample doctors are nearby. This is not production-ready until the RPC is reviewed/deployed in staging and the providers have verified coordinates. The separate `physio-location/` SQL is incompatible with the production schema and must not be run as-is.
- The five existing provider rows have no verified service coordinates. Do not invent locations or claim these clinicians are verified.
- Booking currently opens WhatsApp and does not persist to `booking_requests`.
- No staging RLS tests, browser regression suite, production SQL execution, merge, or deployment has been performed.

### Next safe sequence
1. Prepare a complete staging-only RLS/grant migration based on verified live policy and privilege inventory; retain least-privilege admin CRUD while blocking public access to private fields.
2. Test anonymous, non-admin authenticated, and admin access in staging.
3. Review and test the nearby RPC in staging, including malformed coordinates, distance boundary cases, and public-field output.
4. Add verified provider coordinates and test 10 km radius behavior.
5. Decide whether bookings should remain WhatsApp-only or be stored with server-side validation.
6. Run the build and browser regression tests, then present a PR for approval. No production SQL, merge, or deployment without explicit approval.


### Nearby UI implementation note — 2026-10-23
- Replaced the simulated radar-to-sample-results flow in `physio-at-home/src/main.jsx` with a real geolocation/manual-location flow. It invokes `physios_near(user_lat, user_lng)`, maps only returned nearby rows, and shows no-service or configuration/error states instead of fallback profiles.
- Added responsive styles for typed location search in `physio-at-home/src/styles.css`.
- The RPC SQL remains review-only and has not been run in production. Existing provider coordinates are NULL, so the real search should return no matches until correct, verified coordinates are saved. Do not deploy this feature before staging integration tests.


### Security audit preparation — 2026-10-23
- Added `physio-at-home/supabase/security-audit-read-only.sql`. It only reads PostgreSQL metadata for RLS enablement, policies, table/column grants, table columns, and the nearby-search function definition/EXECUTE grants. It makes no schema, policy, privilege, or data changes.
- Next database step is to run this inventory in a staging project (or review its output before any production security change), then design a least-privilege migration. Do not apply the audit as a migration; it is a set of read-only SELECT statements.
- Latest CI run for the branch reported success: https://github.com/chandu1224-hub/Physio/actions/runs/39979506514

## Nearby-search review — 2026-10-23
- Verified the latest CI run for the security-audit preparation commit completed successfully: https://github.com/chandu1224-hub/Physio/actions/runs/39979767259
- Verified the canonical frontend calls `public.physios_near(user_lat, user_lng)`, normalizes the returned JSON rows, and guards against stale asynchronous search results.
- Adjusted the no-results message to refer to providers' configured service radius rather than claiming every provider has exactly a 10 km radius.
- Important live-data blocker: the five existing physiotherapist rows previously inspected have NULL service coordinates, so nearby search will return no matches until accurate provider locations are entered and verified. Do not invent coordinates or geocode a clinic/home location without the provider's confirmation.
- Nearby-search SQL remains a review-only proposal and has not been executed. The read-only audit SQL must be run in the correct Supabase SQL Editor context and its output reviewed before drafting a schema-specific least-privilege migration.
- Security blocker remains: prior user-provided grant/policy output showed broad client table privileges and a permissive public-read policy on physiotherapists. Confirm RLS enablement, complete policies, grants, and the deployed `physios_near` definition using the audit queries before any migration. Never apply a guessed migration to production.
- Current CI success establishes install/build only. It does not prove runtime Supabase RPC availability, geocoding reliability, browser geolocation behavior, accessibility, verified provider credentials, or production security.
