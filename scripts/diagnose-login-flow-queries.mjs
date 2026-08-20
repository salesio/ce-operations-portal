import { createClient } from "@supabase/supabase-js";

const url = "https://kmurqbgpybrolrrumiue.supabase.co";
const anonKey = "sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli";
const supabase = createClient(url, anonKey);

async function diagnose() {
  console.log("=== Diagnosing exact queries executed during resolveUserAccountFromAuth ===");
  const authUserId = "76e8a5ae-b716-4737-83da-ac004359bd07";
  const userEmail = "salesiomachava@gmail.com";

  // 1. Query users by auth_user_id
  console.log("\n1. Querying public.users by auth_user_id:", authUserId);
  const { data: usersByAuth, error: errByAuth } = await supabase
    .from("users")
    .select("*")
    .eq("auth_user_id", authUserId);
  console.log("   Result:", usersByAuth);
  console.log("   Error:", errByAuth);

  // 2. Query users by email
  console.log("\n2. Querying public.users by email:", userEmail);
  const { data: usersByEmail, error: errByEmail } = await supabase
    .from("users")
    .select("*")
    .ilike("email", userEmail);
  console.log("   Result:", usersByEmail);
  console.log("   Error:", errByEmail);

  // 3. Query roles by role_id
  const roleId = "11111111-1111-1111-1111-111111111101";
  console.log("\n3. Querying public.roles by role_id:", roleId);
  const { data: rolesById, error: errRoles } = await supabase
    .from("roles")
    .select("*")
    .eq("id", roleId);
  console.log("   Result:", rolesById);
  console.log("   Error:", errRoles);

  // 4. Query permissions by role_id
  console.log("\n4. Querying public.permissions by role_id:", roleId);
  const { data: permsById, error: errPerms } = await supabase
    .from("permissions")
    .select("*")
    .eq("role_id", roleId);
  console.log("   Result count:", permsById?.length);
  console.log("   Error:", errPerms);

  // 5. Query cell_user_assignments by user_id
  const userId = "9691d45a-e613-4fa3-8cb5-43955f39aa66";
  console.log("\n5. Querying public.cell_user_assignments by user_id:", userId);
  const { data: cellAssign, error: errCell } = await supabase
    .from("cell_user_assignments")
    .select("*")
    .eq("user_id", userId);
  console.log("   Result count:", cellAssign?.length);
  console.log("   Error:", errCell);

  // 6. Test updating last_login_at on public.users
  console.log("\n6. Testing UPDATE last_login_at on public.users (without session/anon):");
  const { data: updateRes, error: errUpdate } = await supabase
    .from("users")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", userId)
    .select("*");
  console.log("   Update Result:", updateRes);
  console.log("   Update Error:", errUpdate);
}

diagnose();
