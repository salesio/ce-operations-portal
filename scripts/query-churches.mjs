import { executeSql } from "./run-supabase-sql.mjs";

async function queryChurches() {
  const churches = await executeSql("SELECT id, church_name FROM public.churches;");
  console.log("Churches:", churches);
}

queryChurches().catch(console.error);
