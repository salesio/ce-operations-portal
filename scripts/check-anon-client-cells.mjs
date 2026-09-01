import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://kmurqbgpybrolrrumiue.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli";
const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkClient() {
  console.log("Querying cell_groups via anon client...");
  const { data: groups, error: groupsErr } = await client.from("cell_groups").select("*");
  console.log("cell_groups count:", groups ? groups.length : 0, "Error:", groupsErr);
  if (groups) {
    console.log("Groups found:", groups.map(g => g.name || g.group_name));
  }

  console.log("Querying cells via anon client...");
  const { data: cells, error: cellsErr } = await client.from("cells").select("*");
  console.log("cells count:", cells ? cells.length : 0, "Error:", cellsErr);
  if (cells) {
    const diamantes = cells.filter(c => (c.name || c.cell_name || "").toLowerCase().includes("diamante"));
    console.log("Diamantes cells found in anon query:", diamantes);
  }
}

checkClient().catch(console.error);
