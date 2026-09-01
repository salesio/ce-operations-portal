import { executeSql } from "./run-supabase-sql.mjs";

async function inspectRoles() {
  const roles = await executeSql("SELECT id, name, display_name FROM public.roles;");
  console.log("Roles in public.roles:", roles);
}

inspectRoles().catch(console.error);
