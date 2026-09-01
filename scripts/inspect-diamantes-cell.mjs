import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://kmurqbgpybrolrrumiue.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli";
const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  const [groups, cells, users, teachers] = await Promise.all([
    client.from("cell_groups").select("*"),
    client.from("cells").select("*"),
    client.from("users").select("*"),
    client.from("foundation_school_teachers").select("*")
  ]);

  console.log("Cell Groups count:", groups.data?.length);
  console.log("Found matching Diamantes groups:", groups.data?.filter(g => /diamante/i.test(g.name || g.group_name || "")));
  console.log("\nCells count:", cells.data?.length);
  console.log("Found matching Diamantes cells:", cells.data?.filter(c => /diamante/i.test(c.name || c.nome_da_celula || "")));
  
  console.log("\nUsers count:", users.data?.length);
  console.log("Matching users for Filipe or Michael:", users.data?.filter(u => /diamante|filipe|michael|chamango|juma/i.test(u.email || u.name || u.full_name || "")));

  console.log("\nFoundation Teachers count:", teachers.data?.length);
  console.log("Sample group:", groups.data?.[0]);
  console.log("Sample cell:", cells.data?.[0]);
}

main().catch(console.error);
