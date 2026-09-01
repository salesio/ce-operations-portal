import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://kmurqbgpybrolrrumiue.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli";

// Note: To test authenticated access without knowing the plaintext password of admin,
// let's check what auth RPCs or policies exist.
const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
  console.log("Checking tables available with anon key...");
  const { data: cells, error: cellsErr } = await client.from("cells").select("id, name").limit(3);
  console.log("cells query:", { cells, cellsErr });

  const { data: users, error: usersErr } = await client.from("users").select("id, email").limit(3);
  console.log("users query as anon:", { users, usersErr });
}

test().catch(console.error);
