# Physio at Home: production pack

Verified: `npm install && npm run build` succeeds with these files (Vite 8.3.4, React 19.3.1).

## Files (copy into your project, keeping paths)
| File | What changed |
|---|---|
| `src/main.jsx` | Rewritten: real bookings saved to Supabase, no demo data, consent checkbox, honeypot spam trap, legal pages, error boundary, lazy-loaded admin |
| `src/hooks/useDoctors.js` | No sample fallback, no invented ratings/availability/distance; returns `{doctors, loading, error}` |
| `src/lib/bookings.js`, `src/lib/applications.js` | Insert helpers for booking requests and therapist applications |
| `src/admin/AdminPanel.jsx` | `TABLES` now includes `booking_requests` and `therapist_applications` |
| `src/production.css` | Extra styles (import is already in main.jsx) |
| `sql/booking-requests.sql`, `sql/therapist-applications.sql` | Tables + RLS. Run both in the Supabase SQL Editor |
| `index.html`, `netlify.toml`, `package.json`, `public/*` | SEO tags, headers, redirects, pinned deps, robots/sitemap/favicon |

## Behaviour changes in main.jsx
- Removed: five fake physios, fake ratings/reviews/distances/availability, "30 minutes" claim, "4.9 sample rating", all "demo" wording.
- Removed: the fake "finding physios near you" animation and the geolocation prompt (it collected location but matched nothing). Re-add only with real matching.
- Fixed: every `#find` link pointed at a section that doesn't exist. CTAs now open the booking form.
- Booking: saved to Supabase first, then shows a success screen with an optional WhatsApp button (no more lost requests, no popup-blocker issue).
- Join as Physiotherapist: now saved to Supabase with consent, not only WhatsApp.
- Fixed date picker allowing yesterday in India early morning (UTC vs local date).
- Splash shows once per session and is skipped for reduced-motion users.
- `/privacy` and `/terms` pages, Escape closes dialogs, aria roles added.

## You must do before launch
1. Fill the `BUSINESS` block at the top of `main.jsx` (legal name, email, address, retention, cancellation, jurisdiction) and the `[date]` placeholders. The legal text is a template: get a lawyer to review it.
2. Replace `YOUR-DOMAIN` (index.html, robots.txt, sitemap.xml) and `YOUR-PROJECT` (CSP in netlify.toml). Check the JSON-LD `areaServed` and phone.
3. Run both SQL files. If `physiotherapists` has no `is_active` column, run the ALTER in the second file first.
4. Add real physiotherapists via /admin (name, title, degree, experience, price, specialties, photo_url). Only add ratings once you have real reviews.
5. Make sure these claims are true, or edit them: "qualified physiotherapist", "credentials shown up front".
6. Add Cloudflare Turnstile or similar if you see spam; the honeypot only stops basic bots.
7. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Netlify, add `public/og-image.png`, connect a custom domain.
8. Test end to end: submit a booking, check the row in Supabase, sign in at /admin, view it.

---

# Round 2: location-based "find physio near me" (100% free, no billing)

Verified with automated tests (mocked search services + Supabase): typed search, "no service" message and retry, device location, permission denied, service errors, fallback between search services, and the admin saving an exact geocode. Live calls to Photon/Geoapify/Supabase still need testing from your deployed site.

## Files
| File | Purpose |
|---|---|
| `sql/service-locations.sql` | **Run in Supabase.** Adds `service_location`, `service_lat`, `service_lng`, `service_radius_km` (default 10) and `is_active`, plus the `physios_near(lat, lng)` function |
| `src/lib/places.js` | Location search: **Photon** (free, no key) by default; optional **Geoapify** (free, no card) as a second service |
| `src/lib/nearby.js` | Calls `physios_near` |
| `src/components/LocationSearch.jsx` + `.css` | Type-ahead box used on the website and in the admin |
| `src/main.jsx` | "Find physio at your location" dialog, no-service message, distance on cards, service area on profiles |
| `src/admin/AdminPanel.jsx` + `admin-geo.css` | "Service location" block in the physiotherapist editor, with manual latitude/longitude as a fallback |
| `netlify.toml` | CSP allows Photon and Geoapify; browser location allowed |
| `index.html`, `.env.example` | Site address comes from one variable, `VITE_SITE_URL` |

## Why not Nominatim or Google
- OpenStreetMap's public Nominatim server forbids search-as-you-type and bans IPs that do it.
- Google Places needs a billing account.
- Photon is open source, made for typing-as-you-search, and the public server is free with a "please be fair, no guarantees" policy. Debouncing (350 ms) and a result cache keep us well within that.
- Geoapify's free plan (3,000 requests/day, no credit card, attribution required) is the optional backup. With no card on file you cannot be billed.
- If you ever outgrow both, Photon can be self-hosted (Apache 2.0).

## Setup
1. Run `sql/service-locations.sql` in Supabase.
2. (Optional) Create a free Geoapify key at myprojects.geoapify.com and set `VITE_GEOAPIFY_KEY`. If it offers key restrictions, limit it to your site address.
3. In Netlify set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SITE_URL`.
4. In /admin, set each physiotherapist's service location. Until then they won't appear in near-me results.
5. Test one search inside a physio's radius (lists them) and one far away (no service).

## Domain plan
- **Now:** rename the Netlify site (Site configuration, Change site name) to something clean like `physioathome.netlify.app`. Free, HTTPS included. Set `VITE_SITE_URL` to it. Fine for a soft launch.
- **Soon:** buy a `.in` domain (roughly US$5 to 13 a year at most registrars; compare the *renewal* price, not just year one). In Netlify: Domain management, Add custom domain, follow the DNS steps; HTTPS is automatic and free. Then change `VITE_SITE_URL` and redeploy.
- A custom domain matters most for healthcare trust and for a professional email address.
