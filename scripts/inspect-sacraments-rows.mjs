import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://kmurqbgpybrolrrumiue.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli";

const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  const [bap, mar, baby] = await Promise.all([
    client.from("baptisms").select("id, full_name, phone, baptism_date, status, metadata"),
    client.from("marriages").select("id, groom_name, bride_name, marriage_date, status, metadata"),
    client.from("baby_dedications").select("id, child_name, parent_name, dedication_date, status, metadata")
  ]);
  console.log("Baptisms rows:", bap.data);
  console.log("Marriages rows:", mar.data);
  console.log("Baby Dedications rows:", baby.data);
}

main().catch(console.error);
