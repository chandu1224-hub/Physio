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
- The current booking handler attempts to insert a consented request into `booking_requests` before opening WhatsApp. If persistence fails, it closes the pending WhatsApp window and tells the user to retry. This flow still needs end-to-end staging verification against the deployed schema, RLS policies, and grants.
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
- Inspected the current canonical booking handler in `physio-at-home/src/main.jsx`: it validates consent, attempts to insert a new request into `booking_requests`, then opens `wa.me` so the user can coordinate with the team. The UI states that the appointment is not confirmed until the team replies. This DB insert requires staging verification against the actual constraints, RLS policies, and grants.
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
- Booking now attempts to persist to `booking_requests` before handing off to WhatsApp; staging integration and policy validation are still required.
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

## Admin service locations and Bangalore test data — 2026-10-23
- Added a dedicated Service location section to the canonical admin profile editor: address/area lookup, latitude, longitude, and configurable service radius. Address lookup uses Photon and only accepts a result that identifies India, Karnataka, and Bengaluru/Bangalore; coordinates can also be entered manually.
- Added client-side validation for paired coordinates, latitude/longitude bounds, and a 1–100 km service-radius range.
- Added `physio-at-home/supabase/seed-bangalore-demo-locations-staging-only.sql` with five deliberately approximate Bengaluru-area test points for the five currently known demo profile IDs. Each saved label is prefixed `DEMO TEST ONLY`. The script starts a transaction and does not commit; verify the returned five rows in staging and explicitly commit only there. Never run this seed against production.
- The five sample coordinates are fictional test locations, not actual clinician bases. Keep the profiles clearly identified as demo/test data until real clinicians and their locations are verified.
- Nearby-search test plan in staging: seed the five demo points; install/review the allowlisted `physios_near` RPC only after security review; search near central Bengaluru (12.9716, 77.5946), near each individual test point, and from outside all 10 km radii; verify sorted distances, radius boundary behavior, empty results, malformed coordinates, and RPC failure UI. Test manual geocoding for valid Bangalore areas, a non-Bangalore area, an unknown area, and network failure.
- No SQL was executed and no production rows were modified. Automated CI is required to validate the new admin JSX; real RPC integration testing still requires a staging Supabase project with the reviewed function installed.


## Nearby RPC contract correction — 2026-10-23
- Found a contract mismatch between the review-only SQL proposal and the canonical frontend: the frontend calls `physios_near(p_lat, p_lng)` and expects rows shaped as `{ physio_id, distance_km }`, then fetches the selected public profile fields under RLS.
- Updated `physio-at-home/supabase/review-only-nearby-search.sql` to return only provider IDs and rounded distances, matching that frontend contract. It validates coordinates, filters to published profiles with saved coordinates, applies each provider's configured radius (10 km default), and keeps a fixed `pg_catalog` search path.
- This change only updates a review-only SQL file in GitHub. It has not been run against staging or production. CI is running for this commit; verify the latest Actions result before treating it as build-verified.
- Remaining runtime dependency: provider coordinates must be accurate and present, and the live RPC signature/definition and grants must be verified from the read-only Supabase audit before enabling the feature.


## Booking form validation follow-up — 2026-10-23
- Added browser-side name length checks and autocomplete hints, capped phone input at 20 characters, and aligned the phone pattern with the known database constraint. The address input now has a maximum length.
- This improves feedback before the booking insert, but it is not a substitute for database constraints, anti-spam/rate limiting, or server-side validation. The booking persistence and WhatsApp handoff still need end-to-end staging tests.
- Latest admin JSON validation and table-specific form field fixes are committed on `work/production-readiness`; CI for the most recent booking form commit must be checked before claiming that exact commit is build-verified.


### Admin numeric validation follow-up — 2026-10-23
- Added save-time validation for numeric admin fields: values must be finite numbers; experience, price, review count, and display order cannot be negative; ratings must be between 0 and 5.
- This is client-side input validation only. Database constraints remain the authoritative guard and should be verified against the actual staging schema.
- Commit: `ace9b1bbdd9133c40adadf9d6b14d389d6e518f3`. CI must pass for this exact commit before considering the source change build-verified.


## Test checkpoint — 2026-10-24 (user authorized test completion)

### Automated build checks
- Confirmed the latest branch head at the time of this check is `1939ef4d4c1c1315f95a957351058ed283055032`.
- Both GitHub Actions workflows completed successfully on that exact SHA: [Physio at Home CI run 40061148010](https://github.com/chandu1224-hub/Physio/actions/runs/40061148010) and [Physio CI run 40061147999](https://github.com/chandu1224-hub/Physio/actions/runs/40061147999).
- Inspected the job steps: both successfully installed dependencies and ran `npm run build`. This verifies compilation/build only. There are no package scripts for unit tests, linting, or browser E2E at present.

### Read-only live Supabase checks
- Project `physio-at-home` (`libbqaznznsfxxnclsmp`) reports `ACTIVE_HEALTHY`.
- Confirmed RLS is enabled on `admins`, `booking_requests`, `physiotherapists`, and `therapist_applications`.
- Confirmed policy inventory currently contains:
  - public provider SELECT policy for role `anon` with `status = 'published'`;
  - booking INSERT and therapist application INSERT policies for `anon` requiring `status = 'new'` and `consent = true`;
  - admin CRUD policies for authenticated users requiring a matching row in `public.admins`;
  - admins SELECT policy scoped to the current `auth.uid()`.
- Confirmed the deployed `public.physios_near(double precision,double precision)` is `SECURITY DEFINER`, sets `search_path = pg_catalog`, and returns only `physio_id` and `distance_km`; EXECUTE is granted to both `anon` and `authenticated`.
- Executed read-only RPC cases against the live project: NULL coordinates returned 0 rows; latitude 999 returned 0; longitude 999 returned 0; Bengaluru test point (12.9087, 77.4872) returned one provider at approximately 0.623 km; distant Delhi test point returned 0. These are smoke tests, not a complete radius-boundary/property test. The Bengaluru coordinate is a test input and does not verify the provider's real service address.
- The SQL checks were SELECT-only. No rows, policies, grants, functions, or schema were modified.

### Current Supabase advisor findings (observed 2026-10-24)
- SECURITY warning: `public.physios_near` can be executed by `anon` and `authenticated` as a SECURITY DEFINER function. This exposure may be intentional for nearby search, but needs abuse/rate-limit review and a documented decision. See [Supabase linter 0028](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable) and [linter 0029](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).
- SECURITY warning: leaked-password protection is disabled. Supabase previously indicated this requires a Pro plan or higher; no setting was changed.
- PERFORMANCE info: `booking_requests_created_idx` is reported unused. Do not drop it solely on this observation; low traffic or recent creation may explain the signal.
- Table grants still include broad authenticated INSERT/SELECT/UPDATE/DELETE privileges on the three application tables and SELECT on `admins`. RLS is the row-level gate, but grants are still broader than ideal. Tighten privileges only after testing all admin CRUD and public write paths, ideally in a controlled migration/maintenance window.

### Not yet testable / still release-blocking
- Browser-level E2E (booking form success/failure, therapist application success/failure, non-admin denial, admin CRUD) has **not** been executed. The available GitHub integration exposes source and Actions results but no interactive browser runtime, and the public Netlify URL could not be fetched from this environment. Do not describe these flows as E2E-tested.
- No real booking/application records were created as tests, to avoid inserting synthetic personal data into the live database.
- Live browser runtime configuration, actual Netlify deployment SHA, CSP console errors, mobile layout, accessibility, and external geocoder behavior are unverified.
- Provider identity, qualifications, service coordinates, prices, ratings, and availability are not independently verified. Do not remove demo labels or advertise illustrative profiles as real clinicians.
- Nearby RPC tests did not verify every provider radius boundary or the actual address behind the returned provider.
- Production Security Advisor warnings remain. No migration, merge, or deployment was performed.

### Release decision
**Not approved for production release yet.** Build checks pass and the read-only RPC smoke tests pass for the listed inputs, but browser E2E, provider verification, deployment preview validation, and security-warning disposition remain open. Next test step is to configure a Netlify Deploy Preview (or staging deployment) and run browser E2E against a dedicated staging Supabase project with synthetic test records, then run anonymous/non-admin/admin authorization tests without touching production data.
