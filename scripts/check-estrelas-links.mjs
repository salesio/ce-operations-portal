import { executeSql } from "./run-supabase-sql.mjs";

async function checkEstrelasLinks() {
  const sql = `
    SELECT 
      g.id as group_id, 
      g.group_name, 
      c.id as cell_id, 
      c.cell_name, 
      c.member_count as cell_member_count,
      COUNT(m.id) as actual_members_in_db
    FROM public.cell_groups g
    LEFT JOIN public.cells c ON c.cell_group_id = g.id
    LEFT JOIN public.members m ON m.cell_id = c.id::text OR m.cell_id = c.cell_name
    WHERE g.group_name ILIKE '%estrela%' OR g.group_name ILIKE '%si%o%'
    GROUP BY g.id, g.group_name, c.id, c.cell_name, c.member_count
    ORDER BY c.cell_name;
  `;
  const rows = await executeSql(sql);
  console.log("Estrelas de Sião group, cells and member counts in Supabase:", rows);
}

checkEstrelasLinks().catch(console.error);
