import { executeSql } from "./run-supabase-sql.mjs";

async function checkCellGroups() {
  const sql = `
    SELECT id, group_name, church_id, status 
    FROM public.cell_groups 
    ORDER BY group_name;
  `;
  const groups = await executeSql(sql);
  console.log(`public.cell_groups in Supabase (${groups.length}):`, groups);
}

checkCellGroups().catch(console.error);
