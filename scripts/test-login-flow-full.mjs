import fs from "node:fs";

// Mock the browser environment
globalThis.window = globalThis;
globalThis.__CE_ENV__ = {
  VITE_DATA_SOURCE: "supabase",
  VITE_ENABLE_SUPABASE: "true",
  VITE_ENABLE_REAL_AUTH: "true",
  VITE_SUPABASE_URL: "https://kmurqbgpybrolrrumiue.supabase.co",
  VITE_SUPABASE_ANON_KEY: "sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli",
};

async function testFullLoginFlow() {
  console.log("=== Testing Full Login Flow Runtime Execution ===");

  // Load the built bundle via script evaluation in global scope
  const bundleCode = fs.readFileSync("js/supabase-bundle.js", "utf8");
  new Function(bundleCode).call(globalThis);

  const auth = globalThis.CEAuth || globalThis.CESupabase?.auth || globalThis.CESupabase;
  if (!auth || typeof auth.login !== "function") {
    console.error("Auth API is not exposed on window/globalThis!", Object.keys(globalThis.CESupabase || {}));
    process.exit(1);
  }

  console.log("1. Checking auth info...");
  const info = auth.getAuthInfo();
  console.log("   Auth info:", info);
  if (!info.realAuthEnabled) {
    console.error("realAuthEnabled is not true!");
    process.exit(1);
  }

  console.log("\n2. Testing resolveUserAccountFromAuth with Salésio Machava auth ID...");
  const authUser = {
    id: "76e8a5ae-b716-4737-83da-ac004359bd07",
    email: "salesiomachava@gmail.com",
  };

  const client = globalThis.CESupabase.getSupabaseFoundationClient();
  if (client) {
    await client.auth.signInWithPassword({
      email: "salesiomachava@gmail.com",
      password: "Ziongate@7"
    });
  }

  try {
    const result = await auth.resolveUserAccountFromAuth(authUser);
    console.log("   Result ok:", result.ok);
    if (!result.ok) {
      console.error("   Error:", result.error, "| Code:", result.code);
      process.exit(1);
    }
    console.log("   User ID:", result.data.id);
    console.log("   User Name:", result.data.name);
    console.log("   User Role:", result.data.role);
    console.log("   User Role Name:", result.data.role_name);
    console.log("   Can view all churches:", result.data.can_view_all_churches);
    console.log("   Department permissions:", result.data.department_permissions);
    console.log("   Default scope:", result.data.default_scope);

    if (result.data.role !== "Super Admin") {
      console.error("Expected role to be 'Super Admin', got:", result.data.role);
      process.exit(1);
    }
    if (result.data.can_view_all_churches !== true) {
      console.error("Expected can_view_all_churches to be true!");
      process.exit(1);
    }

    console.log("\n>>> FULL LOGIN FLOW RUNTIME TEST PASSED WITH 0 ERRORS! <<<");
    process.exit(0);
  } catch (err) {
    console.error("\n>>> RUNTIME EXCEPTION in resolveUserAccountFromAuth! <<<", err);
    process.exit(1);
  }
}

testFullLoginFlow();
