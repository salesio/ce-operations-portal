import { createClient } from "@supabase/supabase-js";

const requireLive = String(process.env.REQUIRE_SUPABASE_LIVE || "false").toLowerCase() === "true";
const enabled = String(process.env.VITE_ENABLE_SUPABASE || "").toLowerCase() === "true";
const url = String(process.env.VITE_SUPABASE_URL || "").trim();
const anonKey = String(process.env.VITE_SUPABASE_ANON_KEY || "").trim();
const placeholder = /your-|example|placeholder/i;
const configured = enabled && /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url)
  && anonKey.length > 20 && !placeholder.test(url) && !placeholder.test(anonKey);

if (!configured) {
  if (requireLive) {
    console.error("Supabase staging live check required, but safe frontend staging env is missing or invalid.");
    process.exit(1);
  }
  console.log("Supabase staging env not configured; skipping live checks.");
  process.exit(0);
}

try {
  const client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { error } = await client.from("churches").select("id").limit(1);
  if (error) throw error;
  console.log(`Supabase staging connection passed for ${new URL(url).host} using the anon client.`);
} catch (error) {
  console.error(`Supabase staging connection failed: ${error?.message || "unknown error"}`);
  process.exit(1);
}
