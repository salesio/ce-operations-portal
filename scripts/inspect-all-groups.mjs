import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://kmurqbgpybrolrrumiue.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli";
const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  const { data: groups } = await client.from("cell_groups").select("*");
  console.log("All Cell Groups in Supabase:");
  groups?.forEach(g => console.log(` - ID: ${g.id} | Name: ${g.name || g.group_name}`));

  const { data: allDiamantesCells } = await client.from("cells").select("*").ilike("name", "%diamante%");
  console.log("\nAll Diamante cells:");
  allDiamantesCells?.forEach(c => console.log(` - ID: ${c.id} | Name: ${c.name} | Group ID: ${c.cell_group_id} | Group Name: ${c.cell_group_name}`));
}

main().catch(console.error);
