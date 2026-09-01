import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://kmurqbgpybrolrrumiue.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli";

const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  const [bap, mar, baby] = await Promise.all([
    client.from("baptisms").select("*"),
    client.from("marriages").select("*"),
    client.from("baby_dedications").select("*")
  ]);
  console.log("Baptisms:", { count: bap.data?.length, error: bap.error });
  console.log("Marriages:", { count: mar.data?.length, error: mar.error });
  console.log("Baby Dedications:", { count: baby.data?.length, error: baby.error });
}

main().catch(console.error);
