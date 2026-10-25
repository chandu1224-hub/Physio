# Release Validation Report

**Checked:** 2026-10-25  
**Repository branch:** `work/production-readiness`  
**Latest reviewed test commit:** `0b2bc217db47c4bb1333375b333b262c84bd479b`  
**Application:** `physio-at-home/`  
**Production database project:** `physio-at-home` (`libbqaznznsfxxnclsmp`)  
**Release status:** **NOT READY — do not merge or deploy**

This report separates checks actually run from checks that remain unverified. No booking/application rows were inserted, no policies/grants/functions were changed, and no production deployment was triggered during this validation.

## Checks actually run

| Area | Result | Evidence / limitation |
|---|---|---|
| GitHub Actions production build | PASS | [CI run 40143456073](https://github.com/chandu1224-hub/Physio/actions/runs/40143456073) completed successfully for reviewed test commit `0b2bc217db47c4bb1333375b333b262c84bd479b`, including locked dependency install and production build. |
| RLS enabled | PASS (metadata check) | RLS is enabled on `admins`, `booking_requests`, `physiotherapists`, and `therapist_applications`. RLS enabled alone does not prove the policies are correct. |
| Effective table grants | PASS (metadata check, limited) | Anonymous has INSERT only on bookings and therapist applications, with no table-level SELECT/UPDATE/DELETE/TRUNCATE. Authenticated has CRUD table grants on the three application tables, but row-level policies restrict those operations to admins. |
| Public physiotherapist column grants | PASS (metadata check) | `anon` can SELECT the fields used by the public card query; it cannot SELECT `slug`, timestamps, `contact_info`, `full_bio`, or exact `service_lat/service_lng`. Column-level grants were inspected directly. |
| Nearby RPC — valid Bengaluru test point | PASS (limited) | `physios_near(12.9087, 77.4872)` returned one published provider at approximately 0.623 km. This is a technical test point, not confirmation that the provider approved the coordinates. |
| Nearby RPC — distant test point | PASS (limited) | `physios_near(28.6139, 77.2090)` returned zero rows. |
| Nearby RPC — NULL coordinates | PASS | Returned zero rows. |
| Nearby RPC — invalid latitude (999) | PASS | Returned zero rows. |
| Nearby RPC — invalid longitude (999) | PASS | Returned zero rows. |
| Supabase Security Advisor | WARNINGS REMAIN | See Security findings below. |
| Supabase performance advisor | INFO | One unused index warning: `booking_requests_created_idx`. Do not drop it solely from this finding; it may be new or workload-dependent. |
| Browser E2E (mocked backend) | PASS, limited | [E2E run 40143456121](https://github.com/chandu1224-hub/Physio/actions/runs/40143456121) passed on commit `0b2bc217db47c4bb1333375b333b262c84bd479b`. Includes public booking/application flows plus mocked admin-route tests for non-admin denial, membership lookup failure, and successful authorized-admin access to the manager. Requests, auth, database responses, and WhatsApp handoff are mocked; this does not validate live Supabase or a deployed preview. |
| Live branch preview / real-role browser flows | NOT RUN | No verified deploy-preview URL or isolated staging database is available through the current connected tools. The existing site URL has not been proven to serve this branch. |

## Live database access review

All four application tables have RLS enabled.

Observed policies:
- Public physiotherapist SELECT is granted to the `anon` role only, with `status = 'published'`.
- Booking and therapist-application INSERT policies are granted to `anon` only, requiring `status = 'new'` and `consent = true`.
- Authenticated table CRUD policies on physiotherapists, bookings, and applications require a matching `public.admins.user_id = auth.uid()`.
- Admin table has a self-row SELECT policy for authenticated users.

Observed grant details:
- `anon`: INSERT on bookings and therapist applications; no table-level SELECT/UPDATE/DELETE/TRUNCATE on those tables. Public provider-card fields are granted through column-level SELECT privileges.
- `authenticated`: CRUD table privileges on bookings, providers, and applications; SELECT on admins. RLS should restrict management rows to admin members, but direct role-specific adversarial API tests have not been performed.
- Authenticated non-admin users may not read public provider cards or submit forms because the public SELECT/INSERT policies target `anon` only. The current UI does not appear to require non-admin user accounts, but this should be explicitly tested before adding any public sign-in feature.
- Effective table grants and column grants were checked in PostgreSQL metadata; that is not equivalent to a full exploit test using real anon, non-admin, and admin API sessions.

## Security Advisor findings

1. **Public executable SECURITY DEFINER RPC** — `public.physios_near(double precision, double precision)` is callable by both `anon` and `authenticated`. The function currently has `search_path = pg_catalog`, schema-qualifies `public.physiotherapists`, filters to published providers with coordinates, respects service radius, and returns only provider ID plus distance. Public execution is required for the current nearby-search design, so do not revoke EXECUTE without replacing the feature. Assess request-rate abuse and consider rate limiting/monitoring.
2. **Leaked-password protection disabled** — Supabase reports it is disabled and prior plan checks indicated enabling it requires a higher plan. This remains a documented risk until enabled or formally accepted.
3. **Unused index informational warning** — review query workload and index intent before deciding whether to retain or remove it.

## Required tests before release

- [x] Run browser-level end-to-end tests against a mocked backend for public provider-card rendering, booking consent/success/failure, and therapist-application consent/success/failure.
- [x] Add/run mocked admin-route browser tests for confirmed non-admin denial, admin-membership lookup errors, and successful authorized-admin access to the manager. CI run [40143456073](https://github.com/chandu1224-hub/Physio/actions/runs/40143456073) and browser E2E run [40143456121](https://github.com/chandu1224-hub/Physio/actions/runs/40143456121) both passed on `0b2bc217db47c4bb1333375b333b262c84bd479b`.
- [ ] Run browser-level end-to-end tests against a verified preview, including real configuration, search behavior, and WhatsApp handoff.
- [ ] Test non-admin authenticated user denial for all admin CRUD actions, including direct Data API calls.
- [ ] Test the real admin account: sign-in, list records, create/edit/delete provider, booking review, application review, sign-out/session expiry.
- [ ] Test anonymous public SELECT cannot expose private fields or unpublished rows, and anonymous clients cannot SELECT/UPDATE/DELETE bookings or applications.
- [ ] Test role-specific INSERT policy failures when consent is false or status is not `new`, without creating persistent test submissions in production.
- [ ] Test mobile and desktop layouts, keyboard navigation, form labels/errors, console errors, failed network/API requests, and CSP/font/image loading on the branch preview.
- [ ] Confirm service coordinates and service radius with each provider. Four published profiles previously showed no coordinates; do not invent locations.
- [ ] Verify each clinician's identity, registration/credentials, fees, ratings/reviews, availability, booking phone number, consent wording, privacy notice, and data-retention handling.
- [ ] Re-run Security Advisor after any approved remediation and verify effective privileges/policies.
- [ ] Confirm Netlify deploy-preview commit SHA equals the reviewed branch head.
- [ ] Obtain an explicit release decision before merge/deployment.

## Safety boundary

The live Supabase project is the only connected project currently available; there is no isolated staging database. This validation used read-only metadata and SELECT/RPC calls only. Do not run the tracked security migration, review-only remediation SQL, or staging demo-location seed against production until the migration is reviewed against the live schema, backed up, and separately approved. No service-role secret belongs in browser code.
