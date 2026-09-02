import { executeSql } from "./run-supabase-sql.mjs";

async function checkPublicUsers() {
  const sql1 = `
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users'
    ORDER BY ordinal_position;
  `;
  const cols = await executeSql(sql1);
  console.log("public.users columns:", cols);

  const sql2 = `
    SELECT * FROM public.users;
  `;
  const rows = await executeSql(sql2);
  console.log(`public.users rows (${rows.length}):`, rows);
}

checkPublicUsers().catch(console.error);
