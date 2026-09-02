import { executeSql } from "./run-supabase-sql.mjs";

async function verifySupabaseEstrelas() {
  const sql1 = `
    SELECT id, group_name, church_id, status 
    FROM public.cell_groups 
    WHERE group_name ILIKE '%estrela%' OR group_name ILIKE '%si%o%';
  `;
  const groups = await executeSql(sql1);
  console.log("Cell groups matching Estrelas in Supabase:", groups);

  const sql2 = `
    SELECT id, cell_name, group_id, cell_group_id, church_id, status, leader_name 
    FROM public.cells 
    WHERE cell_name ILIKE '%estrela%' OR cell_name ILIKE '%si%o%';
  `;
  const cells = await executeSql(sql2);
  console.log(`Cells matching Estrelas in Supabase (${cells.length}):`, cells);

  const sql3 = `
    SELECT id, full_name, cell_name, cell_id, cell_group_name, phone 
    FROM public.members 
    WHERE cell_name ILIKE '%estrela%' OR cell_name ILIKE '%si%o%' OR cell_group_name ILIKE '%estrela%' OR cell_group_name ILIKE '%si%o%';
  `;
  const members = await executeSql(sql3);
  console.log(`Members in Estrelas cells in Supabase (${members.length}):`, members);
}

verifySupabaseEstrelas().catch(console.error);
