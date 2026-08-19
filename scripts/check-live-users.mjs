import { createClient } from "@supabase/supabase-js";

const url = "https://kmurqbgpybrolrrumiue.supabase.co";
const anonKey = "sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli";

const supabase = createClient(url, anonKey);

async function inspectUsers() {
  console.log("=== Inspecting Users in Supabase ===");
  const { data: users, error: uErr } = await supabase.from("users").select("id, email, full_name, role_id, auth_user_id, status");
  if (uErr) console.error("Users error:", uErr);
  else console.table(users);
}

inspectUsers();
