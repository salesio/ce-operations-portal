import { executeSql } from "./run-supabase-sql.mjs";

async function cleanAndNormalizeEstrelasInSupabase() {
  console.log("Updating Estrelas de Sião in Supabase...");

  // 1. Update cell group name to standard "Estrelas de Sião"
  const sql1 = `
    UPDATE public.cell_groups 
    SET group_name = 'Estrelas de Sião', updated_at = NOW() 
    WHERE id = '217d9a73-3d57-4979-854d-dc97662a55e5' OR group_name ILIKE '%estrelas%siao%' OR group_name ILIKE '%estrelas%sião%';
  `;
  await executeSql(sql1);
  console.log("Updated cell_groups.");

  // 2. Fix double spaces and normalize cell names in public.cells
  const sql2 = `
    UPDATE public.cells 
    SET cell_name = 'ESTRELAS DE SIÃO E2', name = 'ESTRELAS DE SIÃO E2', raw_name = 'ESTRELAS DE SIÃO E2', cell_group_name = 'Estrelas de Sião', updated_at = NOW()
    WHERE id = 'cdcd6632-1066-48b3-8565-467c56b54e80';

    UPDATE public.cells 
    SET cell_group_name = 'Estrelas de Sião', updated_at = NOW()
    WHERE cell_group_id = '217d9a73-3d57-4979-854d-dc97662a55e5';
  `;
  await executeSql(sql2);
  console.log("Updated cells.");

  // 3. Update public.members with normalized cell_group_name and fixed cell_name
  const sql3 = `
    UPDATE public.members 
    SET cell_name = 'ESTRELAS DE SIÃO E2' 
    WHERE cell_id = 'cdcd6632-1066-48b3-8565-467c56b54e80' OR cell_name = 'ESTRELAS  DE SIÃO E2';

    UPDATE public.members 
    SET cell_group_name = 'Estrelas de Sião'
    WHERE cell_group_id = '217d9a73-3d57-4979-854d-dc97662a55e5' OR cell_name ILIKE '%estrela%';
  `;
  await executeSql(sql3);
  console.log("Updated members.");

  // 4. Verify
  const sqlVerify = `
    SELECT 
      c.id, c.cell_name, c.cell_group_name, c.member_count, count(m.id) as actual_members
    FROM public.cells c
    LEFT JOIN public.members m ON m.cell_id = c.id::text
    WHERE c.cell_group_id = '217d9a73-3d57-4979-854d-dc97662a55e5'
    GROUP BY c.id, c.cell_name, c.cell_group_name, c.member_count
    ORDER BY c.cell_name;
  `;
  const res = await executeSql(sqlVerify);
  console.log("Verification of Estrelas cells and members:", res);
}

cleanAndNormalizeEstrelasInSupabase().catch(console.error);
