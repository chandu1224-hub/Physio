# Physio at Home: location search (free, no API key) + admin fixes

From the folder that contains physio-at-home, with this zip extracted to physio-admin2:

    Copy-Item physio-admin2\src\* physio-at-home\src\ -Recurse -Force
    Copy-Item physio-admin2\scripts physio-at-home\ -Recurse -Force
    Copy-Item physio-admin2\sql physio-at-home\ -Recurse -Force
    Copy-Item physio-admin2\.env physio-at-home\ -Force
    cd physio-at-home
    node scripts/patch-nearby.mjs src/main.jsx
    npm run dev

Then paste sql/setup.sql into Supabase SQL Editor and Run.
Stop the dev server (Ctrl+C) and start it again whenever .env changes.
