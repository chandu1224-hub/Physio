# Physio at Home — Staging Environment Setup

This guide creates an isolated test environment for the app without changing the current production Supabase project, production data, Netlify site, or DNS.

## Safety rules

- Keep the current Supabase project as production.
- Create a **new Supabase project** specifically for staging. Confirm its project name and project URL before running any SQL.
- Do not restore/copy production data into staging unless you have reviewed privacy, consent, and access requirements. For this app, use synthetic demo profiles.
- Never put a Supabase service-role key in Vite/browser variables, Git, screenshots, chat, or Netlify public environment variables.
- Do not run files named `*-staging-only.sql` against production.
- Do not merge PR #1 or change the production Netlify site as part of staging setup.

## 1. Create the separate Supabase project

1. Sign in to the Supabase dashboard.
2. Choose **New project** and create a new project named something unmistakable, such as `physio-at-home-staging`.
3. Use a strong, unique database password and save it in your password manager.
4. Wait for the project to finish provisioning.
5. Open **Project Settings → API** (the exact menu wording may vary) and copy the staging **Project URL** and **publishable/anon key**. Treat these as staging values, not production values.
6. Verify the project selector and URL clearly identify staging before opening SQL Editor.

Creating a project may require selecting an organization, region, and billing plan. Review the current pricing/limits in Supabase before confirming. Do not delete or modify the existing project.

## 2. Create the staging schema safely

The repository currently contains schema-specific SQL and review scripts, but the live schema, grants, RLS policies, and RPC definition have not been verified in a staging project yet.

1. Open the **staging** project SQL Editor.
2. First run the read-only inventory in `physio-at-home/supabase/security-audit-read-only.sql`.
3. Save/export the complete output for review. It must show RLS state, policies, table/column grants, columns, and the current `physios_near` function definition/grants.
4. Do **not** paste production credentials or execute a guessed security migration.
5. Establish the minimum required staging schema from the canonical app and the verified database inventory. Apply reviewed migrations to staging only.
6. Create the five synthetic test profiles in staging, or verify the five expected IDs exist before using the seed script. Do not copy private production fields.

### Test-location seed (staging only)

File: `physio-at-home/supabase/seed-bangalore-demo-locations-staging-only.sql`

- It updates five fixed profile IDs and labels each location `DEMO TEST ONLY`.
- The coordinates are approximate fictional test points, not real clinician addresses.
- Confirm the target project is staging, confirm the update affects exactly five intended rows, and inspect the SELECT output before committing the transaction.
- If the IDs/schema do not match, stop and roll back; do not adapt the script on production.

### Nearby RPC

File: `physio-at-home/supabase/review-only-nearby-search.sql`

This is a proposal, not an approved migration. Review it against the actual staging schema and security inventory before running it. Verify the returned JSON contains only explicitly approved public fields, only published providers, valid coordinates, and providers within their configured radius. Never deploy the separate `physio-location/sql/setup.sql` to the canonical app's database without a separate compatibility/security review.

## 3. Configure the local app to use staging

In `physio-at-home/`, create a local `.env.local` file (do not commit it):

```dotenv
VITE_SUPABASE_URL=https://YOUR-STAGING-PROJECT-REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_STAGING_PUBLISHABLE_OR_ANON_KEY
VITE_SITE_URL=http://localhost:5173
```

Replace placeholders with the **staging** project values. The Vite variables are browser-visible; only a publishable/anon key belongs here, and only when database RLS/grants are configured safely. Never use a service-role key.

Before starting the dev server, verify both Supabase values refer to staging. Restart Vite after changing environment files:

```powershell
cd physio-at-home
npm ci
npm run dev
```

Keep `.env.local` out of Git. Check `.gitignore` includes local environment files before committing.

## 4. Use a separate staging website deployment

Prefer a separate Netlify site connected to the same GitHub repository and the feature branch `work/production-readiness` (or a dedicated staging branch). Configure:

- Base directory / publish root: `physio-at-home` (confirm Netlify's exact field labels).
- Build command: `npm run build`.
- Environment variables: only the staging Supabase URL and publishable/anon key, plus a staging site URL.
- Deploy previews or branch deploys: enable only after confirming they cannot inherit production credentials.

Do not change the existing production site's branch, build settings, environment variables, domain, or publish configuration. Use a separate site and a distinct staging URL so the visual difference is obvious.

## 5. Staging test checklist

- [ ] The staging website's environment points to the staging Supabase URL.
- [ ] Anonymous visitor can read only the intended public fields for published providers.
- [ ] Anonymous visitor cannot read admin records, unpublished profiles, private contact details, or applications.
- [ ] A normal signed-in user cannot create/edit/delete physiotherapist records.
- [ ] An authorized admin can create a draft, edit location/radius, publish, unpublish, and delete a test profile.
- [ ] Seed exactly five synthetic test locations and verify all five labels say `DEMO TEST ONLY`.
- [ ] Search near each synthetic point; results are sorted by distance and are inside the configured radius.
- [ ] Search near the edge and outside each radius; confirm the boundary behavior.
- [ ] Test invalid coordinates, location permission denied, unknown address, geocoder/network failure, empty results, and RPC/database failure.
- [ ] Confirm the public nearby RPC never returns `contact_info`, `full_bio`, admin metadata, or other private columns.
- [ ] Confirm WhatsApp booking copy is clear that the user must send the message and await confirmation; the current flow does not persist a booking.
- [ ] Test mobile layout, keyboard navigation, labels, and error messages.
- [ ] Confirm CI build passes for the exact commit being tested.

Record results in `PROJECT_STATUS.md`. A passing frontend build alone is not proof of database security or end-to-end functionality.

## 6. Production release gate

Do not merge/deploy until staging checks pass and a reviewer has examined the exact production project's read-only security inventory. Production changes require a separate reviewed migration, a backup/rollback plan, confirmation of the target project, and explicit approval. Do not run staging seed SQL in production.

## Current status

- Staging project: **not created/verified by the assistant**.
- Staging SQL: **not executed**.
- Production Supabase data/policies: **unchanged by this workflow**.
- Production deployment: **unchanged**.
