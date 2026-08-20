import { createClient } from "@supabase/supabase-js";

const url = "https://kmurqbgpybrolrrumiue.supabase.co";
const anonKey = "sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli";
const supabase = createClient(url, anonKey);

async function checkChurches() {
  const { data, error } = await supabase.from("churches").select("*");
  console.log("churches error:", error);
  console.log("churches rows:", data);
}

checkChurches();
