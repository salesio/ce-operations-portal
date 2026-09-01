import fs from "node:fs";

const envContent = fs.readFileSync(".env.local", "utf8");
const token = envContent.match(/SUPABASE_ACCESS_TOKEN=["']?([^"'\r\n]+)["']?/)[1];
const projectId = envContent.match(/SUPABASE_PROJECT_ID=["']?([^"'\r\n]+)["']?/)[1];

const sql = `
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename IN ('baptisms', 'marriages', 'baby_dedications', 'sacrament_certificates', 'sacrament_documents', 'sacrament_appointments', 'counseling_requests', 'counseling_cases');
`;

async function main() {
  const url = `https://api.supabase.com/v1/projects/${projectId}/database/query`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ query: sql })
  });

  const body = await res.text();
  console.log("RLS Policies:", body);
}

main().catch(console.error);
