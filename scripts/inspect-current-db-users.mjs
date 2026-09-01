import { executeSql } from "./run-supabase-sql.mjs";

async function inspectDbUsers() {
  const users = await executeSql("SELECT id, auth_user_id, email, full_name, role_id, status FROM public.users;");
  console.log("Current rows in public.users:", users);
}

inspectDbUsers().catch(console.error);
