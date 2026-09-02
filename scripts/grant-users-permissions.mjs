import { executeSql } from "./run-supabase-sql.mjs";

async function grantUsersPermissions() {
  const sql = `
    -- Enable RLS and grant access on public.users
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

    GRANT ALL ON public.users TO anon;
    GRANT ALL ON public.users TO authenticated;
    GRANT ALL ON public.users TO service_role;

    DROP POLICY IF EXISTS "Allow anon and authenticated all on users" ON public.users;
    CREATE POLICY "Allow anon and authenticated all on users"
    ON public.users
    FOR ALL
    USING (true)
    WITH CHECK (true);
  `;
  const res = await executeSql(sql);
  console.log("Granted full permissions on public.users:", res);
}

grantUsersPermissions().catch(console.error);
