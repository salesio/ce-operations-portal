import { executeSql } from "./run-supabase-sql.mjs";

async function findMockCells() {
  const sql = `
    SELECT id, cell_name, cell_group_name, church_id 
    FROM public.cells 
    WHERE cell_name ILIKE '%Cell 0%' OR cell_name ILIKE '%Cell 1%' OR cell_name ILIKE '%Cell%';
  `;
  const res = await executeSql(sql);
  console.log("Cells with 'Cell' in Supabase:", res);
}

findMockCells().catch(console.error);
