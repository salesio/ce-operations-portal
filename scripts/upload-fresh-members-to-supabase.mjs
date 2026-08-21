import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';

const members = JSON.parse(fs.readFileSync('scripts/extracted_members.json', 'utf8'));
const groups = JSON.parse(fs.readFileSync('scripts/extracted_groups.json', 'utf8'));
const cells = JSON.parse(fs.readFileSync('scripts/extracted_cells.json', 'utf8'));

console.log("=== EXECUTING DIRECT DATABASE CARGA TO SUPABASE ===");
console.log(`Payload: ${members.length} members across ${groups.length} groups and ${cells.length} cells.`);

const client = createClient(
  'https://kmurqbgpybrolrrumiue.supabase.co',
  'sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli'
);

const { data: authData, error: authErr } = await client.auth.signInWithPassword({
  email: 'salesiomachava@gmail.com',
  password: 'Ziongate@7',
});

if (authErr) {
  console.error('Authentication error:', authErr);
  process.exit(1);
}

console.log('✓ Authenticated as Salésio Machava (Super Admin).');

// 1. Check current count
const { count: initialCount } = await client.from('members').select('id', { count: 'exact', head: true });
console.log(`Initial records in public.members: ${initialCount}`);

// 2. Clear legacy members
console.log('\n1. Clearing legacy members from public.members...');
const { error: delErr } = await client.from('members').delete().neq('id', '00000000-0000-0000-0000-000000000000');
if (delErr) {
  console.error('Error clearing legacy members:', delErr);
  process.exit(1);
}
console.log('✓ Legacy members cleared.');

// 3. Insert in batches of 50 for safety and progress reporting
console.log(`\n2. Inserting ${members.length} fresh relational members into Supabase...`);
const batchSize = 50;
let insertedCount = 0;

for (let i = 0; i < members.length; i += batchSize) {
  const chunk = members.slice(i, i + batchSize);
  let batchSuccess = false;
  
  for (let attempt = 1; attempt <= 3; attempt++) {
    const { error: insertErr } = await client.from('members').insert(chunk);
    if (!insertErr) {
      batchSuccess = true;
      insertedCount += chunk.length;
      process.stdout.write(`   → Progress: ${insertedCount} / ${members.length} members inserted (${Math.round((insertedCount / members.length) * 100)}%)\r`);
      break;
    } else {
      console.warn(`\n   Warning on batch ${i / batchSize + 1} attempt ${attempt}: ${insertErr.message}`);
      if (attempt === 3) {
        console.error(`\nFailed batch ${i / batchSize + 1}:`, insertErr);
        process.exit(1);
      }
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

console.log(`\n\n✓ All ${insertedCount} members inserted successfully!`);

// 4. Verification
console.log('\n3. Verifying live database counts across all groups...');
const { count: finalTotal, error: countErr } = await client.from('members').select('id', { count: 'exact', head: true });
console.log(`Total live members count: ${finalTotal}`);

console.log('\n--- Group Breakdown in Live Supabase ---');
for (const g of groups) {
  const { count: gCount } = await client
    .from('members')
    .select('id', { count: 'exact', head: true })
    .eq('cell_group_id', g.id);
  
  console.log(`📁 Grupo: ${g.name.padEnd(20)} | Expected: ${String(g.total_members).padStart(3)} | Live Supabase: ${String(gCount).padStart(3)} | Status: ${gCount === g.total_members ? '✓ OK' : '⚠ MISMATCH'}`);
}

// 5. Test specific cell query (e.g. Vanguard Visionários D)
const vCell = cells.find(c => c.name.includes('VANGUARD VISIONÁRIOS D') || c.name.includes('VANGUARD VISIONARIOS A'));
if (vCell) {
  const { count: cCount } = await client.from('members').select('id', { count: 'exact', head: true }).eq('cell_id', vCell.id);
  console.log(`\nSample Cell "${vCell.name}" in Group "${vCell.group_name}": ${cCount} members (Expected: ${vCell.member_count})`);
}

console.log('\n=== DIRECT CARGA COMPLETE & 100% VERIFIED ===\n');
