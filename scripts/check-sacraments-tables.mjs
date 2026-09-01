import fs from "node:fs";

// Read .env.local
const envContent = fs.readFileSync(".env.local", "utf8");
const tokenMatch = envContent.match(/SUPABASE_ACCESS_TOKEN=["']?([^"'\r\n]+)["']?/);
const projectMatch = envContent.match(/SUPABASE_PROJECT_ID=["']?([^"'\r\n]+)["']?/);

const token = tokenMatch ? tokenMatch[1] : null;
const projectId = projectMatch ? projectMatch[1] : null;

if (!token || !projectId) {
  console.error("Missing SUPABASE_ACCESS_TOKEN or SUPABASE_PROJECT_ID");
  process.exit(1);
}

const sql = `
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('baptisms', 'marriages', 'baby_dedications', 'sacrament_certificates', 'sacrament_documents', 'sacrament_appointments', 'counseling_requests', 'counseling_cases');
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
  console.log("Existing tables in Supabase:", body);
}

main().catch(console.error);
