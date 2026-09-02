import { executeSql } from "./run-supabase-sql.mjs";

async function checkCellsSchema() {
  const sql1 = `
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'cells'
    ORDER BY ordinal_position;
  `;
  const cols = await executeSql(sql1);
  console.log("public.cells columns:", cols);

  const sql2 = `
    SELECT id, cell_name, cell_group_id, church_id, leader_name 
    FROM public.cells 
    WHERE cell_name ILIKE '%estrela%' OR cell_name ILIKE '%si%o%';
  `;
  const cells = await executeSql(sql2);
  console.log(`Cells matching Estrelas in public.cells (${cells.length}):`, cells);
}

checkCellsSchema().catch(console.error);
