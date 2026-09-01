import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://kmurqbgpybrolrrumiue.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli";
const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  const baptismId = "19d430ad-756e-4732-ae28-896d59707a5b";
  console.log("Checking if baptism exists before delete:", baptismId);
  const { data: before } = await client.from("baptisms").select("*").eq("id", baptismId);
  console.log("Before:", before);

  console.log("Attempting delete via Supabase client (anon key)...");
  const { data: delData, error: delError, count } = await client.from("baptisms").delete().eq("id", baptismId).select();
  console.log("Delete result:", { delData, delError, count });

  const { data: after } = await client.from("baptisms").select("*").eq("id", baptismId);
  console.log("After:", after);
}

main().catch(console.error);
