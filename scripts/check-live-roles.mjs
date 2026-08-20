import { createClient } from "@supabase/supabase-js";

const url = "https://kmurqbgpybrolrrumiue.supabase.co";
const anonKey = "sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli";

const supabase = createClient(url, anonKey);

async function checkRoles() {
  const { data: roles, error } = await supabase.from("roles").select("*");
  console.log("Roles error:", error);
  console.log("Roles rows:");
  console.table(roles);
}

checkRoles();
