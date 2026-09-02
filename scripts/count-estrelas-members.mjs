import { executeSql } from "./run-supabase-sql.mjs";

async function countEstrelas() {
  const sql = `
    SELECT cell_name, count(*) 
    FROM public.members 
    WHERE cell_group_id = '217d9a73-3d57-4979-854d-dc97662a55e5' OR cell_name ILIKE '%estrela%'
    GROUP BY cell_name
    ORDER BY cell_name;
  `;
  const counts = await executeSql(sql);
  console.log("Member counts per cell in Supabase:", counts);
}

countEstrelas().catch(console.error);
