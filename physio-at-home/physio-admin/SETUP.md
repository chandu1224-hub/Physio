# Physio at Home: Supabase + Admin panel

1. Copy this folder's contents into your project (merge `src/`, `scripts/`, `sql/`; replace `package.json`; add `.env`).
   The old build script was `"vite"`; it is now `"vite build"`.
2. `npm install`
3. Wire your existing `src/main.jsx` automatically:
   `node scripts/patch-main.mjs src/main.jsx`
   (makes a `.bak` copy first; the site then loads doctors from Supabase, falling back to the sample list if the table is empty or unreachable, and `/admin` opens the panel)
4. Supabase SQL Editor: run `sql/rls-policies.sql`
5. `npm run dev`, open `/admin`, sign in with the admin email.

Deploying: add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables on your host, and rewrite all paths to `index.html` so `/admin` works on refresh.
