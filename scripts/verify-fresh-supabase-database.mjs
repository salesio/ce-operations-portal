import { createClient } from '@supabase/supabase-js';

console.log("=== COMPREHENSIVE LIVE SUPABASE AUDIT OF FRESH DATABASE ===");

const client = createClient(
  'https://kmurqbgpybrolrrumiue.supabase.co',
  'sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli'
);

const { data: authData, error: authErr } = await client.auth.signInWithPassword({
  email: 'salesiomachava@gmail.com',
  password: 'Ziongate@7',
});

if (authErr) {
  console.error("Auth error:", authErr);
  process.exit(1);
}

console.log("✓ Authenticated successfully as Salésio Machava.");

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

// 1. Audit public.cell_groups
console.log("\n1. Auditing public.cell_groups...");
const { data: groups, error: gErr, count: gCount } = await client
  .from('cell_groups')
  .select('*', { count: 'exact' });

assert(!gErr && gCount === 17, `public.cell_groups has 17 groups (got ${gCount}, error: ${gErr?.message || 'none'})`);

// 2. Audit public.cells
console.log("\n2. Auditing public.cells...");
const { data: cells, error: cErr, count: cCount } = await client
  .from('cells')
  .select('*', { count: 'exact' });

assert(!cErr && cCount === 176, `public.cells has 176 cells (got ${cCount}, error: ${cErr?.message || 'none'})`);

// 3. Audit public.members Total
console.log("\n3. Auditing public.members...");
const { count: mCount, error: mErr } = await client
  .from('members')
  .select('id', { count: 'exact', head: true });

assert(!mErr && mCount === 1891, `public.members has 1,891 members (got ${mCount}, error: ${mErr?.message || 'none'})`);

// 4. Fetch all members with pagination
console.log("\n4. Fetching all 1,891 members across pages...");
let allMembers = [];
let page = 0;
const pageSize = 1000;
while (true) {
  const { data, error } = await client
    .from('members')
    .select('id, full_name, cell_group_id, cell_group_name, cell_id, cell_name, church_id, church_name')
    .range(page * pageSize, (page + 1) * pageSize - 1);
  
  if (error || !data || data.length === 0) break;
  allMembers.push(...data);
  if (data.length < pageSize) break;
  page++;
}

console.log(`Fetched total of ${allMembers.length} records.`);
assert(allMembers.length === 1891, `Total paginated members is 1,891 (got ${allMembers.length})`);

// 5. Relational checks
console.log("\n5. Checking Foreign Keys and Church Association...");
const nullCellId = allMembers.filter(m => !m.cell_id);
assert(nullCellId.length === 0, `All members have cell_id (nulls: ${nullCellId.length})`);

const nullGroupId = allMembers.filter(m => !m.cell_group_id);
assert(nullGroupId.length === 0, `All members have cell_group_id (nulls: ${nullGroupId.length})`);

const wrongChurch = allMembers.filter(m => m.church_id !== 'a1111111-1111-4111-8111-111111111101');
assert(wrongChurch.length === 0, `All members belong to Maputo Central - Sede (other: ${wrongChurch.length})`);

// 6. Verify Breakdown by Group
console.log("\n6. Verifying Group Member Totals...");
const expectedGroups = [
  { name: "Royal Sister", expected: 411 },
  { name: "Vanguard", expected: 172 },
  { name: "Pioneiro", expected: 172 },
  { name: "MWV", expected: 154 },
  { name: "QOG", expected: 148 },
  { name: "Phronesis", expected: 143 },
  { name: "Zion Nation", expected: 103 },
  { name: "Blossom", expected: 94 },
  { name: "Wealth Nation", expected: 86 },
  { name: "Pais da Fé", expected: 68 },
  { name: "Diplomatas", expected: 67 },
  { name: "Estrelas de Siao", expected: 66 },
  { name: "Perolas do Reino", expected: 66 },
  { name: "Agathos", expected: 58 },
  { name: "Transformada", expected: 50 },
  { name: "Dominio", expected: 18 },
  { name: "Visionarios", expected: 15 }
];

for (const eg of expectedGroups) {
  const count = allMembers.filter(m => m.cell_group_name === eg.name || m.cell_group_name?.trim() === eg.name).length;
  assert(count === eg.expected, `Group "${eg.name}": ${count} members (Expected: ${eg.expected})`);
}

// 7. Verify Specific Cells in Vanguard
console.log("\n7. Verifying Specific Cells in Vanguard...");
const vShine = allMembers.filter(m => m.cell_name === 'VANGUARD SHINE');
assert(vShine.length === 21, `Cell "VANGUARD SHINE" has 21 members (got ${vShine.length})`);

const vD = allMembers.filter(m => m.cell_name === 'VANGUARD VISIONÁRIOS D');
assert(vD.length === 38, `Cell "VANGUARD VISIONÁRIOS D" has 38 members (got ${vD.length})`);

const vGold = allMembers.filter(m => m.cell_name === 'VANGUARD GOLD');
assert(vGold.length === 13, `Cell "VANGUARD GOLD" has 13 members (got ${vGold.length})`);

console.log(`\n=== AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED ===\n`);
if (failed > 0) process.exit(1);
