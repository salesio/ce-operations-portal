import { createClient } from "@supabase/supabase-js";

const url = "https://kmurqbgpybrolrrumiue.supabase.co";
const anonKey = "sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli";
const supabase = createClient(url, anonKey);

async function checkAllRoles() {
  const { data, error } = await supabase.from("roles").select("*");
  if (error) console.error("Error:", error);
  else console.log("All roles in Supabase:", data);
}

checkAllRoles();
