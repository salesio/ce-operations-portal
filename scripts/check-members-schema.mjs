import { executeSql } from "./run-supabase-sql.mjs";

async function checkMembersSchemaAndEstrelas() {
  const sql1 = `
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'members'
    ORDER BY ordinal_position;
  `;
  const cols = await executeSql(sql1);
  console.log("public.members columns:", cols);

  const sql2 = `
    SELECT id, first_name, last_name, full_name, cell_id, cell_name, cell_group_id, cell_group_name, phone, email 
    FROM public.members 
    WHERE cell_group_id = '217d9a73-3d57-4979-854d-dc97662a55e5' OR cell_name ILIKE '%estrela%';
  `;
  const members = await executeSql(sql2);
  console.log(`Members in Estrelas cells in Supabase (${members.length}):`, members);
}

checkMembersSchemaAndEstrelas().catch(console.error);
