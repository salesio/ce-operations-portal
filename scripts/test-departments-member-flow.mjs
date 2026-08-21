import { createClient } from '@supabase/supabase-js';

console.log("=== VERIFYING DEPARTMENTS & CELL FLOW ON FRESH RELATIONAL DATABASE ===");

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

console.log("✓ Authenticated as Salésio Machava.");

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

// 1. Check Tables
console.log("\n1. Verifying Database Tables and Structure...");
const { count: gCount } = await client.from('cell_groups').select('id', { count: 'exact', head: true });
assert(gCount === 17, `public.cell_groups has 17 groups (got ${gCount})`);

const { count: cCount } = await client.from('cells').select('id', { count: 'exact', head: true });
assert(cCount === 176, `public.cells has 176 cells (got ${cCount})`);

const { count: mCount } = await client.from('members').select('id', { count: 'exact', head: true });
assert(mCount === 1891, `public.members has 1,891 members (got ${mCount})`);

// 2. Test Cell Portal Queries
console.log("\n2. Testing Cell Portal Group Filtering...");
const groupsToTest = [
  { name: 'Royal Sister', count: 411 },
  { name: 'Vanguard', count: 172 },
  { name: 'Pioneiro', count: 172 },
  { name: 'MWV', count: 154 },
  { name: 'QOG', count: 149 },
  { name: 'Phronesis', count: 143 },
  { name: 'Zion Nation', count: 103 },
  { name: 'Blossom', count: 94 },
  { name: 'Wealth Nation', count: 86 },
  { name: 'Pais da Fé', count: 68 },
  { name: 'Diplomatas', count: 67 },
  { name: 'Estrelas de Siao', count: 66 },
  { name: 'Perolas do Reino', count: 66 },
  { name: 'Agathos', count: 58 },
  { name: 'Transformada', count: 50 },
  { name: 'Dominio', count: 18 },
  { name: 'Visionarios', count: 14 }
];

for (const g of groupsToTest) {
  const { data, count, error } = await client
    .from('members')
    .select('id', { count: 'exact' })
    .eq('cell_group_name', g.name);
  
  assert(!error && count === g.count, `Group "${g.name}": query returned ${count} members (Expected: ${g.count})`);
}

// 3. Test Distinct Cells Within Groups
console.log("\n3. Testing Specific Cells Within Groups...");
const { data: vD } = await client.from('members').select('id, full_name').eq('cell_name', 'VANGUARD VISIONÁRIOS D');
assert(vD?.length === 38, `Vanguard Visionários D has 38 distinct members (got ${vD?.length})`);

const { data: vShine } = await client.from('members').select('id, full_name').eq('cell_name', 'VANGUARD SHINE');
assert(vShine?.length === 10, `Vanguard Shine has 10 distinct members (got ${vShine?.length})`);

const { data: dipVic } = await client.from('members').select('id, full_name').eq('cell_name', 'Diplomatas Victory');
assert(dipVic?.length === 16, `Diplomatas Victory has 16 distinct members (got ${dipVic?.length})`);

// 4. Test Autocomplete Search on ALEC
console.log("\n4. Testing Live Search on Members for ALEC & Registration...");
const { data: searchResults } = await client.from('members').select('id, full_name, cell_name, cell_group_name').ilike('full_name', '%Machava%');
assert(searchResults?.length > 0, `Search query for "Machava" returned ${searchResults?.length} live results from Supabase`);
console.log(`   Sample result: ${searchResults?.[0]?.full_name} (${searchResults?.[0]?.cell_name} • ${searchResults?.[0]?.cell_group_name})`);

console.log(`\n=== RESULTS: ${passed} PASSED, ${failed} FAILED ===\n`);
if (failed > 0) process.exit(1);
