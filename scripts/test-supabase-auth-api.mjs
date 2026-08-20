import { createClient } from "@supabase/supabase-js";

const url = "https://kmurqbgpybrolrrumiue.supabase.co";
const anonKey = "sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli";
const supabase = createClient(url, anonKey);

async function testAuthEndpoint() {
  console.log("=== Testing Supabase Auth Endpoint Connectivity ===");
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: "salesiomachava@gmail.com",
      password: "wrong-test-password-12345",
    });
    console.log("Response data:", data);
    console.log("Response error:", error?.message, "| Status:", error?.status, "| Name:", error?.name);
  } catch (err) {
    console.error("Exception:", err);
  }
}

testAuthEndpoint();
