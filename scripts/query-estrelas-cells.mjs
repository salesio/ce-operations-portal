import { executeSql } from "./run-supabase-sql.mjs";

async function queryEstrelasCells() {
  const sql = `
    SELECT id, cell_name, cell_group_id, cell_group_name, church_id, member_count, status 
    FROM public.cells 
    WHERE cell_group_id = '217d9a73-3d57-4979-854d-dc97662a55e5' OR cell_name ILIKE '%estrela%';
  `;
  const cells = await executeSql(sql);
  console.log(`Cells in Supabase (${cells.length}):`, cells);
}

queryEstrelasCells().catch(console.error);
