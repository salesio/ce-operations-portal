import { createClient } from "@supabase/supabase-js";

const url = "https://kmurqbgpybrolrrumiue.supabase.co";
const anonKey = "sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli";

const MEMBER_LIST_COLUMNS = [
  "id", "member_code", "full_name", "first_name", "last_name", "title",
  "primary_phone", "secondary_phone", "phone", "email", "church_id", "church_name",
  "cell_group_id", "cell_group_name", "cell_id", "cell_name", "department_id",
  "department_name", "status", "membership_status", "entry_date", "source",
  "cell_role", "created_at", "updated_at"
].join(",");

async function testQuery() {
  console.log("=== Testing listMembersPage Query against Supabase ===");
  const client = createClient(url, anonKey);

  let request = client.from("members").select(MEMBER_LIST_COLUMNS, { count: "exact" });
  const { data, error, count } = await request.order("full_name", { ascending: true }).range(0, 49);

  console.log("Error:", error);
  console.log("Count:", count);
  console.log("Data length:", data?.length);
  if (data?.length > 0) {
    console.log("First 3 items:");
    console.log(data.slice(0, 3).map((m) => ({ id: m.id, full_name: m.full_name, church_name: m.church_name, status: m.status })));
  }
}

testQuery();
