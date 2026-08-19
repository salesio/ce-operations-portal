import { createClient } from "@supabase/supabase-js";

const url = "https://kmurqbgpybrolrrumiue.supabase.co";
const anonKey = "sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli";

const supabase = createClient(url, anonKey);

async function testMultipleOr() {
  console.log("=== Test 1: Multiple .or() calls in Supabase JS ===");
  try {
    let req = supabase.from("members").select("id, full_name, cell_group_name", { count: "exact" });
    req = req.or("cell_group_name.ilike.%QOG%,cell_name.ilike.%QOG%");
    req = req.or("full_name.ilike.%a%,first_name.ilike.%a%");
    const res = await req.range(0, 4);
    console.log("Result with multiple .or():", { count: res.count, error: res.error, dataLen: res.data?.length });
  } catch (err) {
    console.error("Test 1 throw:", err);
  }

  console.log("\n=== Test 2: What happens when cell_group is selected from UI ===");
  // Suppose user selects group "id:group-1" where group-1 has name "Grupo Mavalane"
  let req2 = supabase.from("members").select("id, full_name, cell_group_id, cell_group_name", { count: "exact" });
  req2 = req2.or("cell_group_id.eq.group-1,cell_group_name.ilike.%Grupo Mavalane%");
  const res2 = await req2.range(0, 4);
  console.log("Result with group-1 / Grupo Mavalane:", { count: res2.count, error: res2.error, dataLen: res2.data?.length });

  console.log("\n=== Test 3: What happens when cell_group is 'QOG' ===");
  let req3 = supabase.from("members").select("id, full_name, cell_group_id, cell_group_name", { count: "exact" });
  req3 = req3.or("cell_group_name.ilike.%QOG%,cell_name.ilike.%QOG%");
  const res3 = await req3.range(0, 4);
  console.log("Result with QOG:", { count: res3.count, error: res3.error, dataLen: res3.data?.length });

  console.log("\n=== Test 4: What happens with other churches in Supabase ===");
  const { data: churches } = await supabase.from("churches").select("id, church_name");
  for (const c of churches || []) {
    const { count } = await supabase.from("members").select("id", { count: "exact", head: true }).eq("church_id", c.id);
    console.log(`Church ${c.church_name} (${c.id}): ${count} members`);
  }
}

testMultipleOr();
