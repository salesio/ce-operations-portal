import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://kmurqbgpybrolrrumiue.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli";
const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  console.log("Provisioning teacher in Supabase foundation_school_teachers...");
  const teacherRecord = {
    id: "f7ee3dab-c172-4d78-97a9-aa76c554ce88",
    church_id: "a1111111-1111-4111-8111-111111111101",
    full_name: "Filipe Chamango",
    email: "diamantes.main@embaixadadecristo.org",
    phone: "+258840000000",
    role: "Teacher",
    status: "Active"
  };

  const { data, error } = await client.from("foundation_school_teachers").upsert(teacherRecord).select();
  console.log("Teacher upsert result:", { data, error });
}

main().catch(console.error);
