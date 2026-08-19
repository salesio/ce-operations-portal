import { createClient } from "@supabase/supabase-js";

const url = "https://kmurqbgpybrolrrumiue.supabase.co";
const anonKey = "sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli";

const supabase = createClient(url, anonKey);

const MEMBER_LIST_COLUMNS = [
  "id", "member_code", "full_name", "first_name", "last_name", "title",
  "primary_phone", "secondary_phone", "phone", "email", "church_id", "church_name",
  "cell_group_id", "cell_group_name", "cell_id", "cell_name", "department_id",
  "department_name", "status", "membership_status", "entry_date", "source",
  "cell_role", "created_at", "updated_at"
].join(",");

async function testQueries() {
  console.log("=== 1. Test Unfiltered ===");
  const { data: allData, count: allCount, error: allErr } = await supabase
    .from("members")
    .select(MEMBER_LIST_COLUMNS, { count: "exact" })
    .range(0, 4);
  console.log("Unfiltered count:", allCount, "error:", allErr);
  if (allData && allData.length) {
    console.log("First row:", {
      id: allData[0].id,
      full_name: allData[0].full_name,
      church_id: allData[0].church_id,
      church_name: allData[0].church_name,
      status: allData[0].status
    });
  }

  console.log("\n=== 2. Test church_id = a1111111-1111-4111-8111-111111111101 ===");
  const { data: hqData, count: hqCount, error: hqErr } = await supabase
    .from("members")
    .select(MEMBER_LIST_COLUMNS, { count: "exact" })
    .eq("church_id", "a1111111-1111-4111-8111-111111111101")
    .range(0, 4);
  console.log("HQ church_id count:", hqCount, "error:", hqErr);

  console.log("\n=== 3. Test status filter in ('Active', 'Activo', 'Ativa', 'Activa') ===");
  const { data: statusData, count: statusCount, error: statusErr } = await supabase
    .from("members")
    .select(MEMBER_LIST_COLUMNS, { count: "exact" })
    .in("status", ["Active", "Activo", "Ativa", "Activa"])
    .range(0, 4);
  console.log("Status filter count:", statusCount, "error:", statusErr);

  console.log("\n=== 4. Test Search 'Albertina' ===");
  const { data: searchData, count: searchCount, error: searchErr } = await supabase
    .from("members")
    .select(MEMBER_LIST_COLUMNS, { count: "exact" })
    .or("full_name.ilike.%Albertina%,first_name.ilike.%Albertina%,last_name.ilike.%Albertina%")
    .range(0, 4);
  console.log("Search 'Albertina' count:", searchCount, "error:", searchErr);

  console.log("\n=== 5. Test church_id + status together ===");
  const { data: comboData, count: comboCount, error: comboErr } = await supabase
    .from("members")
    .select(MEMBER_LIST_COLUMNS, { count: "exact" })
    .eq("church_id", "a1111111-1111-4111-8111-111111111101")
    .in("status", ["Active", "Activo", "Ativa", "Activa"])
    .range(0, 4);
  console.log("Combo count:", comboCount, "error:", comboErr);

  console.log("\n=== 6. Inspect Distinct status values in members table ===");
  const { data: statusSample } = await supabase
    .from("members")
    .select("status")
    .limit(200);
  const statuses = new Set(statusSample?.map(r => r.status));
  console.log("Distinct statuses in sample:", [...statuses]);

  console.log("\n=== 7. Inspect Distinct church_id values in members table ===");
  const { data: churchSample } = await supabase
    .from("members")
    .select("church_id, church_name")
    .limit(50);
  console.log("Sample church_id/church_name:", churchSample?.slice(0, 5));
}

testQueries();
