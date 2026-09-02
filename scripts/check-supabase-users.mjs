import { executeSql } from "./run-supabase-sql.mjs";

async function checkUsers() {
  const sql1 = `
    SELECT id, email, raw_user_meta_data, created_at 
    FROM auth.users 
    ORDER BY created_at;
  `;
  const authUsers = await executeSql(sql1);
  console.log("Auth Users in Supabase:", authUsers);

  const sql2 = `
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND (table_name LIKE '%user%' OR table_name LIKE '%profile%');
  `;
  const tables = await executeSql(sql2);
  console.log("User/Profile tables in public schema:", tables);
}

checkUsers().catch(console.error);
