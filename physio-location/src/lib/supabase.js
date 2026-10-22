import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseReady = Boolean(url && key);

if (!supabaseReady) {
  console.error("Supabase keys missing. Check .env, then stop and restart `npm run dev`.");
}

// Placeholders keep the app from crashing to a blank page when keys are missing.
export const supabase = createClient(url || "http://localhost:54321", key || "missing-key");
