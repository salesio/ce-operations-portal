import { createClient } from "@supabase/supabase-js";

const url = "https://kmurqbgpybrolrrumiue.supabase.co";
const anonKey = "sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli";

const supabase = createClient(url, anonKey);

async function inspect() {
  console.log("=== Inspecting Churches in Supabase ===");
  const { data: churches, error: churchErr } = await supabase.from("churches").select("id, church_name, public_name, status");
  if (churchErr) console.error("Churches error:", churchErr);
  else console.table(churches);

  console.log("\n=== Inspecting Members count in Supabase ===");
  const { count, error: countErr } = await supabase.from("members").select("id", { count: "exact", head: true });
  console.log("Total members count:", count, countErr || "");

  console.log("\n=== Inspecting First 10 Members in Supabase ===");
  const { data: members, error: memErr } = await supabase.from("members").select("id, full_name, church_id, church_name, cell_name").limit(10);
  if (memErr) console.error("Members error:", memErr);
  else console.table(members);

  console.log("\n=== Inspecting Query with church_id = a1111111-1111-4111-8111-111111111101 ===");
  const { data: hqMembers, count: hqCount, error: hqErr } = await supabase
    .from("members")
    .select("id, full_name, church_id, church_name", { count: "exact" })
    .eq("church_id", "a1111111-1111-4111-8111-111111111101");
  console.log("Count for a1111111-1111-4111-8111-111111111101:", hqCount, hqErr || "");

  console.log("\n=== Inspecting Query with church_id IS NULL ===");
  const { count: nullCount, error: nullErr } = await supabase
    .from("members")
    .select("id", { count: "exact", head: true })
    .is("church_id", null);
  console.log("Count for church_id IS NULL:", nullCount, nullErr || "");
}

inspect();
