import { createClient } from "@supabase/supabase-js";

const url = "https://kmurqbgpybrolrrumiue.supabase.co";
const anonKey = "sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli";

const supabase = createClient(url, anonKey);

async function checkUser() {
  console.log("=== Checking public.users for salesiomachava@gmail.com ===");
  const { data: users, error: uErr } = await supabase
    .from("users")
    .select("id, full_name, email, role_id, church_id, auth_user_id, status, metadata")
    .eq("email", "salesiomachava@gmail.com");

  console.log("users query error:", uErr);
  console.log("users matched:", users);

  if (users && users[0]?.role_id) {
    const { data: roles, error: rErr } = await supabase
      .from("roles")
      .select("id, name, slug, role_level, status")
      .eq("id", users[0].role_id);
    console.log("role matched:", roles, "error:", rErr);
  }
}

checkUser();
