import { createClient } from "@supabase/supabase-js";

const requiredTables = [
  "churches", "members", "first_timers", "follow_ups", "finance_records",
  "public_giving_submissions", "requisitions", "inventory_items", "staff_members",
  "foundation_school_students", "programs", "media_services", "counseling_cases",
  "baptisms", "fevo_reports", "prison_locations", "ministry_materials_catalog",
  "report_definitions", "notifications", "audit_logs",
];
const requireLive = String(process.env.REQUIRE_SUPABASE_LIVE || "false").toLowerCase() === "true";
const enabled = String(process.env.VITE_ENABLE_SUPABASE || "").toLowerCase() === "true";
const url = String(process.env.VITE_SUPABASE_URL || "").trim();
const anonKey = String(process.env.VITE_SUPABASE_ANON_KEY || "").trim();
const placeholder = /your-|example|placeholder/i;
const configured = enabled && /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url)
  && anonKey.length > 20 && !placeholder.test(url) && !placeholder.test(anonKey);

if (!configured) {
  if (requireLive) {
    console.error("Supabase live schema check required, but safe frontend staging env is missing or invalid.");
    process.exit(1);
  }
  console.log("Supabase staging env not configured; skipping live checks.");
  process.exit(0);
}

const client = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
const missing = [];
for (const table of requiredTables) {
  const { error } = await client.from(table).select("*").limit(0);
  if (error) missing.push(`${table}: ${error.message}`);
}
if (missing.length) {
  console.error(`Supabase live schema check failed for ${missing.length} table(s):`);
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}
console.log(`Supabase live schema check passed for ${requiredTables.length} tables on ${new URL(url).host}.`);
