import { createClient } from "@supabase/supabase-js";

const url = "https://kmurqbgpybrolrrumiue.supabase.co";
const anonKey = "sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli";

const supabase = createClient(url, anonKey);

async function checkCellGroups() {
  const { data: sample } = await supabase.from("members").select("cell_group_name, cell_name").limit(300);
  const groups = new Set();
  const cells = new Set();
  sample?.forEach(m => {
    if (m.cell_group_name) groups.add(m.cell_group_name);
    if (m.cell_name) cells.add(m.cell_name);
  });
  console.log("Distinct cell_group_name in sample (total distinct:", groups.size, "):", [...groups]);
  console.log("Distinct cell_name in sample (total distinct:", cells.size, "):", [...cells]);
}

checkCellGroups();
