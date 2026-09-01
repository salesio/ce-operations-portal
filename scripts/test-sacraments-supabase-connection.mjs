import fs from "node:fs";

const envContent = fs.readFileSync(".env.local", "utf8");
const token = envContent.match(/SUPABASE_ACCESS_TOKEN=["']?([^"'\r\n]+)["']?/)[1];
const projectId = envContent.match(/SUPABASE_PROJECT_ID=["']?([^"'\r\n]+)["']?/)[1];

const sql = `
-- Insert a test marriage record to verify table insertion
INSERT INTO public.marriages (
  id,
  groom_name,
  groom_phone,
  bride_name,
  bride_phone,
  marriage_date,
  officiating_minister_name,
  status,
  notes
) VALUES (
  gen_random_uuid(),
  'Salésio Machava',
  '+258841234567',
  'Neima Tamele',
  '+258849876543',
  '2026-12-18',
  'Pastor Principal',
  'Agendado',
  'Registo oficial de casamento'
) RETURNING *;
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
  console.log("Insert result:", body);
}

main().catch(console.error);
