import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://kmurqbgpybrolrrumiue.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli";
const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkFirstTimers() {
  const { data, error } = await client.from("first_timers").select("*");
  if (error) {
    console.error("Error fetching first_timers:", error);
    return;
  }
  console.log(`Total first_timers in Supabase: ${data.length}`);
  if (data.length > 0) {
    console.log("Sample first_timer row:", data[0]);
    const churches = [...new Set(data.map(d => d.church_id))];
    console.log("Distinct church_ids in first_timers:", churches);
  }
}

checkFirstTimers();
