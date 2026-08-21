import { createClient } from "@supabase/supabase-js";

const url = "https://kmurqbgpybrolrrumiue.supabase.co";
const anonKey = "sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli";
const supabase = createClient(url, anonKey);

async function run() {
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
    email: "salesiomachava@gmail.com",
    password: "Ziongate@7",
  });
  console.log("Auth error:", authErr, "Auth UID:", auth?.user?.id);

  const { data: users, error: uErr } = await supabase
    .from("users")
    .select("id, full_name, email, role_id, church_id, auth_user_id, status, metadata")
    .eq("email", "salesiomachava@gmail.com");
  console.log("Users query error:", uErr);
  console.log("User record:", users);

  if (users && users[0]?.role_id) {
    const { data: roles, error: rErr } = await supabase
      .from("roles")
      .select("id, name, slug, role_level, status")
      .eq("id", users[0].role_id);
    console.log("Role error:", rErr);
    console.log("Role record:", roles);
  }

  const { count, error: mErr } = await supabase
    .from("members")
    .select("id", { count: "exact", head: true });
  console.log("Members count error:", mErr);
  console.log("Members count returned:", count);
}

run();
