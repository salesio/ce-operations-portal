import { createClient } from "@supabase/supabase-js";

const url = "https://kmurqbgpybrolrrumiue.supabase.co";
const anonKey = "sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli";
const supabase = createClient(url, anonKey);

async function checkColumns() {
  const { data, error } = await supabase.from("users").select("*").limit(1);
  if (error) console.error("Error:", error);
  else console.log("Columns on public.users:", Object.keys(data[0] || {}));
}

checkColumns();
