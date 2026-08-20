import { createClient } from "@supabase/supabase-js";

const url = "https://kmurqbgpybrolrrumiue.supabase.co";
const anonKey = "sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli";

async function testMembersQuery() {
  console.log("=== Testing Members Query with Anon Client ===");
  const supabase = createClient(url, anonKey);

  const { count, error: countErr } = await supabase
    .from("members")
    .select("id", { count: "exact", head: true });
  console.log("Anon select count:", count, "Error:", countErr);

  const { data: rows, error: selectErr } = await supabase
    .from("members")
    .select("id, member_code, full_name, first_name, last_name, title, primary_phone, secondary_phone, phone, email, church_id, church_name, cell_group_id, cell_group_name, cell_id, cell_name, department_id, department_name, status, membership_status, entry_date, source, cell_role, created_at, updated_at")
    .range(0, 49);

  console.log("Anon select rows count:", rows?.length, "Error:", selectErr);
  if (rows?.length > 0) {
    console.log("Sample row 0:", {
      id: rows[0].id,
      full_name: rows[0].full_name,
      church_id: rows[0].church_id,
      church_name: rows[0].church_name,
      status: rows[0].status,
    });
  }
}

testMembersQuery();
