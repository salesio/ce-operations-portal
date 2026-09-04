/**
 * Exercises the same public Supabase REST path used by the browser client.
 * Each temporary QA row is read back and removed in finally, including when a
 * later module check fails. The key is publishable by design (the same one
 * injected into the GitHub Pages runtime configuration).
 */
const url = process.env.VITE_SUPABASE_URL || "https://kmurqbgpybrolrrumiue.supabase.co";
const key = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli";
const marker = `qa-dop-anon-${Date.now()}`;
const created = [];

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

async function request(method, table, body, suffix = "") {
  const response = await fetch(`${url}/rest/v1/${table}${suffix}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`${table} ${method} failed (${response.status}): ${await response.text()}`);
  }
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function createReadDelete(table, row) {
  const inserted = await request("POST", table, row);
  const id = inserted?.[0]?.id;
  if (!id) throw new Error(`${table} did not return an inserted id.`);
  created.push({ table, id });
  const read = await request("GET", table, undefined, `?id=eq.${encodeURIComponent(id)}&select=id`);
  if (!Array.isArray(read) || read.length !== 1) throw new Error(`${table} did not return its newly inserted row.`);
  await request("DELETE", table, undefined, `?id=eq.${encodeURIComponent(id)}`);
  created.pop();
}

try {
  await createReadDelete("programs", {
    program_code: `${marker}-program`, name: "D.O.P. browser-path QA program", status: "Draft", metadata: { qa: true },
  });
  await createReadDelete("prison_locations", {
    location_code: `${marker}-prison`, name: "D.O.P. browser-path QA location", status: "Active", metadata: { qa: true },
  });
  await createReadDelete("ministry_materials_catalog", {
    item_code: `${marker}-material`, title: "D.O.P. browser-path QA material", status: "Active", metadata: { qa: true },
  });
  console.log("D.O.P. anonymous client CRUD passed: all three modules were created, read, and removed through the browser REST path.");
} finally {
  await Promise.all(created.map(({ table, id }) => request("DELETE", table, undefined, `?id=eq.${encodeURIComponent(id)}`).catch(() => {})));
}
