import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://kmurqbgpybrolrrumiue.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli";

const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  const { data, error } = await client.from("marriages").select("*");
  console.log("Fetch marriages via Supabase Client:", { count: data?.length, sample: data?.[0], error });
}

main().catch(console.error);
