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

## Verification status
- Repository structure/source inspection: started.
- Local install/build/test: not yet run in this environment.
- Supabase schema/RLS/RPC validation: not yet run against a database.
- Production deployment and live configuration: not verified.
- No production deployment or live database changes have been made.

## Next steps
1. Map package manifests, entry points, deployment configuration, and duplicate app roots.
2. Establish the canonical deploy root and run the available build/test checks.
3. Review Supabase schema, RLS, public-safe provider data, admin authorization, and nearby-search behavior.
4. Review booking flow, form validation, accessibility, SEO, error handling, and security headers.
5. Document reproducible test evidence and request approval before any production-impacting action.
