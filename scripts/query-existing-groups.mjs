import { executeSql } from "./run-supabase-sql.mjs";

async function queryExisting() {
  const groups = await executeSql("SELECT id, name, group_name, church_id, total_cells, status FROM public.cell_groups;");
  console.log("Existing groups:", groups);

  const churches = await executeSql("SELECT id, name FROM public.churches;");
  console.log("Existing churches:", churches);
}

queryExisting().catch(console.error);
