import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://kmurqbgpybrolrrumiue.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli";
const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkAllTables() {
  const tables = [
    "first_timers",
    "follow_ups",
    "visitors",
    "church_reports",
    "members",
    "alec_registrations"
  ];
  for (const t of tables) {
    const { data, error } = await client.from(t).select("*");
    if (error) {
      console.log(`Table ${t}: Error (${error.message})`);
    } else {
      console.log(`Table ${t}: ${data.length} rows`);
    }
  }
}

checkAllTables();
