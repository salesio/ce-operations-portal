import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://kmurqbgpybrolrrumiue.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli";
const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  const { data: users, error } = await client.from("users").select("*").limit(5);
  console.log("Users schema sample:", { count: users?.length, error, sample: users?.[0] });

  const { data: assignments } = await client.from("cell_user_assignments").select("*").limit(5);
  console.log("cell_user_assignments sample:", assignments?.[0]);
}

main().catch(console.error);
