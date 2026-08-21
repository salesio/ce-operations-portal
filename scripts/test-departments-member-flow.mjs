import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import '../js/cell-seed-data.js';

const { REAL_CELL_GROUPS, REAL_CELLS_REGISTRY } = globalThis;

console.log("=== COMPREHENSIVE TEST: DEPARTMENTS MEMBER FLOW ===");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  PASS: ${message}`);
    passed++;
  } else {
    console.error(`  FAIL: ${message}`);
    failed++;
  }
}

// 1. Verify Structure of Real Groups and Cells
console.log("\n1. Verifying Real Groups and Real Cells Catalogue...");
assert(Array.isArray(REAL_CELL_GROUPS) && REAL_CELL_GROUPS.length === 17, `17 real cell groups defined (got ${REAL_CELL_GROUPS?.length})`);
assert(Array.isArray(REAL_CELLS_REGISTRY) && REAL_CELLS_REGISTRY.length === 163, `163 real cells defined (got ${REAL_CELLS_REGISTRY?.length})`);

const totalMembersInCatalogue = REAL_CELL_GROUPS.reduce((sum, g) => sum + g.total_members, 0);
assert(totalMembersInCatalogue === 1896, `Total members in catalogue is 1,896 (got ${totalMembersInCatalogue})`);

const expectedGroups = [
  "Royal Sister", "Vanguard", "Pioneiro", "MWV", "QOG",
  "Phronesis", "Zion Nation", "Blossom", "Wealth Nation", "Pais da Fé",
  "Diplomatas", "Estrelas de Siao", "Perolas do Reino", "Agathos",
  "Transformada", "Dominio", "Visionarios"
];

expectedGroups.forEach(gName => {
  const found = REAL_CELL_GROUPS.find(g => g.name === gName);
  assert(Boolean(found), `Group "${gName}" exists in catalogue (cells: ${found?.total_cells}, members: ${found?.total_members})`);
});

// 2. Querying Supabase Database with Authenticated Session
console.log("\n2. Querying Supabase Database with Authenticated Session...");

const client = createClient(
  'https://kmurqbgpybrolrrumiue.supabase.co',
  'sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli'
);

const authRes = await client.auth.signInWithPassword({
  email: 'salesiomachava@gmail.com',
  password: 'Ziongate@7',
});

assert(Boolean(authRes.data?.session?.access_token), "Authenticated successfully as Salésio Machava");

// 2.1 Test querying distinct groups
const testGroups = ["Royal Sister", "QOG", "Vanguard", "Phronesis", "Diplomatas", "Estrelas de Siao", "MWV"];

for (const gName of testGroups) {
  const { data, count, error } = await client
    .from('members')
    .select('id, full_name, cell_name, cell_group_name', { count: 'exact' })
    .ilike('cell_group_name', `%${gName}%`)
    .limit(10);

  assert(!error && count > 0, `Query group "${gName}" returned ${count} members (error: ${error?.message || 'none'})`);
}

// 2.2 Test querying distinct cells inside Royal Sister
console.log("\n3. Verifying Distinct Cells Inside Royal Sister Return Distinct Members...");

const cell1Name = "Royal Sister's Unlock Main";
const { data: c1Data, count: c1Count } = await client
  .from('members')
  .select('id, full_name, cell_name', { count: 'exact' })
  .ilike('cell_name', `%Unlock Main%`);

assert(c1Count === 37, `Cell "${cell1Name}" has 37 members (got ${c1Count})`);

const cell2Name = "Royal Sisters Chosen";
const { data: c2Data, count: c2Count } = await client
  .from('members')
  .select('id, full_name, cell_name', { count: 'exact' })
  .ilike('cell_name', `%Royal Sisters Chosen%`);

assert(c2Count === 37, `Cell "${cell2Name}" has 37 members (got ${c2Count})`);

// Ensure cell 1 and cell 2 have different members!
const c1Ids = new Set((c1Data || []).map(m => m.id));
const c2Ids = new Set((c2Data || []).map(m => m.id));
const intersection = [...c1Ids].filter(id => c2Ids.has(id));
assert(intersection.length === 0, `Cell 1 and Cell 2 contain completely distinct members (overlap: ${intersection.length})`);

// 2.3 Test querying cells in other groups (e.g. QOG, Vanguard, Diplomatas)
console.log("\n4. Verifying Cells Across Other Groups Return Real Members...");

const { count: qogCellCount } = await client
  .from('members')
  .select('id', { count: 'exact', head: true })
  .ilike('cell_name', `%Queens of Glory Bold H%`);
assert(qogCellCount === 34, `QOG Bold H has 34 members (got ${qogCellCount})`);

const { count: vanguardCellCount } = await client
  .from('members')
  .select('id', { count: 'exact', head: true })
  .ilike('cell_name', `%VANGUARD VISIONÁRIOS%`);
assert(vanguardCellCount === 133, `Vanguard Visionários has 133 members (got ${vanguardCellCount})`);

const { count: diplomatasCellCount } = await client
  .from('members')
  .select('id', { count: 'exact', head: true })
  .ilike('cell_name', `%Diplomatas Victory%`);
assert(diplomatasCellCount === 16, `Diplomatas Victory has 16 members (got ${diplomatasCellCount})`);

// 3. Test Live Member Search (ALEC Autocomplete Backend Simulation)
console.log("\n5. Testing Live Search for ALEC and Department Autocomplete...");

const { data: searchResults, error: sErr } = await client
  .from('members')
  .select('id, full_name, primary_phone, church_name, cell_name, cell_group_name')
  .or('full_name.ilike.%Machava%,first_name.ilike.%Machava%,primary_phone.ilike.%Machava%')
  .limit(5);

assert(!sErr && searchResults.length > 0, `Search query for "Machava" returned ${searchResults?.length} result(s)`);
if (searchResults?.length) {
  console.log(`   Found: ${searchResults[0].full_name} (${searchResults[0].cell_name || 'Sem Célula'})`);
}

console.log(`\n=== RESULTS: ${passed} PASSED, ${failed} FAILED ===\n`);
if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
