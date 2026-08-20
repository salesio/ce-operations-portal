import { createClient } from "@supabase/supabase-js";

const url = "https://kmurqbgpybrolrrumiue.supabase.co";
const anonKey = "sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli";

async function checkMemberChurches() {
  const client = createClient(url, anonKey);

  console.log("=== Checking church_id values in public.members ===");
  const { data, count, error } = await client.from("members").select("id, full_name, church_id, church_name", { count: "exact" }).limit(100);
  console.log("Total members count:", count, "error:", error);
  
  const churchCounts = {};
  for (const m of data || []) {
    const cId = m.church_id || "NULL";
    churchCounts[cId] = (churchCounts[cId] || 0) + 1;
  }
  console.log("Church IDs in first 100:", churchCounts);

  // Now test querying with church_id = a1111111-1111-4111-8111-111111111101
  const sedeRes = await client.from("members").select("id", { count: "exact" }).eq("church_id", "a1111111-1111-4111-8111-111111111101");
  console.log("Query with church_id = a1111111-1111-4111-8111-111111111101 count:", sedeRes.count, "error:", sedeRes.error);

  // Now test querying with church_id = church-hq (as string)
  const hqRes = await client.from("members").select("id", { count: "exact" }).eq("church_id", "church-hq");
  console.log("Query with church_id = church-hq count:", hqRes.count, "error:", hqRes.error);
}

checkMemberChurches();
