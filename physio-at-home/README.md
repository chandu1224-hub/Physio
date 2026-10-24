# Physio at Home

React + Vite frontend for discovering home physiotherapy services in Bengaluru.

## Requirements

- Node.js 20.19+ or 22.12+
- npm

## Run locally

1. Open this folder (`physio-at-home/`) in a terminal.
2. Install locked dependencies:
   ```bash
   npm ci
   ```
3. Create a local `.env.local` file with the public client configuration:
   ```dotenv
   VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
   VITE_SITE_URL=http://localhost:5173
   ```
   Replace the placeholders with the correct values for your environment. Never put a Supabase service-role key in a browser environment variable or commit real secrets.
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Create a production bundle with `npm run build`; preview it with `npm run preview`.

## Current behavior

- Public physiotherapist listings are loaded from Supabase using an explicit public-field allowlist and `status = 'published'`.
- The nearby-search UI uses browser geolocation or a manually entered Bengaluru-area location, geocodes typed locations through Photon, and calls the `physios_near` Supabase RPC. This requires the reviewed RPC to exist in the target database and provider service coordinates to be accurate.
- Admin profile management includes service location, latitude/longitude, and service-radius fields. Admin access must be enforced by Supabase authentication and RLS; hiding the admin UI is not a security boundary.
- Booking requests and therapist applications are submitted to Supabase where configured. The booking flow may then open WhatsApp for follow-up; opening WhatsApp is not confirmation of an appointment.
- The website uses the WhatsApp contact number +91 77958 55640.

## Required production configuration

Configure these variables in Netlify for the production deploy context:

- `VITE_SUPABASE_URL`: URL of the existing intended Supabase project.
- `VITE_SUPABASE_ANON_KEY`: public anon/publishable key for that project.
- `VITE_SITE_URL`: canonical public website origin, including `https://` and no trailing slash (used for canonical and social metadata).

Do not use a service-role key in frontend code. The Supabase URL/key are public browser configuration; database grants and RLS policies must independently enforce least privilege.

## Release blockers / safety notes

- Do not merge or deploy until the Supabase policies, table/column grants, and `physios_near` function have been reviewed and tested for anonymous, non-admin authenticated, and admin sessions.
- The current production Supabase project is the only available project; there is no isolated staging database. Do not run the staging demo-location seed or unreviewed security migrations against production.
- Existing profile data must not be presented as verified clinicians unless credentials, contact details, service areas, fees, and availability have been confirmed by the business/provider.
- A service location and coordinates must be a provider-approved service base/coverage point, not an inferred or private home address. Fictional coordinates are for isolated test environments only.
- CI verifies dependency installation and a production build. It does not verify database policies, provider identity, geolocation accuracy, WhatsApp delivery, or the live deployment.
- The page metadata uses `VITE_SITE_URL`; set it in the deployment environment to avoid unresolved canonical/Open Graph URLs.
