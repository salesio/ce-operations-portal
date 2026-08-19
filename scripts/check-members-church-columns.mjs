import { createClient } from "@supabase/supabase-js";

const url = "https://kmurqbgpybrolrrumiue.supabase.co";
const anonKey = "sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli";

const supabase = createClient(url, anonKey);

async function inspectMembers() {
  const { data, count, error } = await supabase
    .from("members")
    .select("id, full_name, church_id, church_name", { count: "exact" })
    .limit(10);

  console.log("Total members count:", count, "error:", error);
  console.log("First 10 members church_id & church_name:");
  console.table(data);

  // Group count by church_id
  const { data: allMembers, error: allErr } = await supabase
    .from("members")
    .select("church_id, church_name")
    .limit(2000);

  const churchIdCounts = {};
  const churchNameCounts = {};
  allMembers?.forEach(m => {
    const cid = String(m.church_id);
    const cname = String(m.church_name);
    churchIdCounts[cid] = (churchIdCounts[cid] || 0) + 1;
    churchNameCounts[cname] = (churchNameCounts[cname] || 0) + 1;
  });

  console.log("Counts grouped by church_id:", churchIdCounts);
  console.log("Counts grouped by church_name:", churchNameCounts);

  // Check churches table
  const { data: churches } = await supabase.from("churches").select("id, church_name, public_name");
  console.log("\nChurches in public.churches table:");
  console.table(churches);
}

inspectMembers();
