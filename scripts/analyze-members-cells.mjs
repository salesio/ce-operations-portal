import { createClient } from '@supabase/supabase-js';

const client = createClient(
  'https://kmurqbgpybrolrrumiue.supabase.co',
  'sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli'
);

async function analyzeMembers() {
  const authRes = await client.auth.signInWithPassword({
    email: 'salesiomachava@gmail.com',
    password: 'Ziongate@7',
  });
  if (!authRes?.data?.session?.access_token) {
    console.error('Login failed:', authRes.error);
    return;
  }

  let allMembers = [];
  let page = 0;
  while (true) {
    const { data, error } = await client
      .from('members')
      .select('id, full_name, email, phone, status, church_id, church_name, cell_id, cell_name, cell_group_id, cell_group_name, department_name, metadata')
      .range(page * 1000, (page + 1) * 1000 - 1);
    if (error) {
      console.error('Query error:', error);
      break;
    }
    if (!data || data.length === 0) break;
    allMembers.push(...data);
    if (data.length < 1000) break;
    page++;
  }

  console.log('Total members fetched:', allMembers.length);

  // Group by cell_group_name
  const groups = new Map();
  allMembers.forEach(m => {
    const g = m.cell_group_name || 'Sem Grupo';
    if (!groups.has(g)) groups.set(g, { count: 0, cells: new Map() });
    const gObj = groups.get(g);
    gObj.count++;

    const c = m.cell_name || 'Sem Célula';
    gObj.cells.set(c, (gObj.cells.get(c) || 0) + 1);
  });

  console.log('\n=== REAL CELL GROUPS AND CELLS IN SUPABASE MEMBERS ===');
  for (const [groupName, groupData] of groups.entries()) {
    console.log(`\nGroup: [${groupName}] — Total Members: ${groupData.count}, Distinct Cells: ${groupData.cells.size}`);
    const sortedCells = [...groupData.cells.entries()].sort((a,b) => b[1] - a[1]);
    for (const [cellName, cellCount] of sortedCells) {
      console.log(`   - "${cellName}": ${cellCount} members`);
    }
  }

  // Check ALEC data in members
  let alecMembersCount = 0;
  const alecStatuses = {};
  allMembers.forEach(m => {
    const meta = m.metadata || {};
    if (meta.legacy_alec_status || meta.alec_status || meta.alec_score || meta.alec || meta.alec_registration) {
      alecMembersCount++;
      const st = meta.legacy_alec_status || meta.alec_status || 'Sim';
      alecStatuses[st] = (alecStatuses[st] || 0) + 1;
    }
  });
  console.log('\n=== ALEC METADATA IN MEMBERS ===');
  console.log('Total members with ALEC metadata:', alecMembersCount);
  console.log('ALEC statuses:', alecStatuses);

  // Check how members are filtered in listMembersPage
  console.log('\n=== CHURCH DISTRIBUTION ===');
  const churchCounts = {};
  allMembers.forEach(m => {
    const ch = m.church_name || m.church_id || 'Sem Igreja';
    churchCounts[ch] = (churchCounts[ch] || 0) + 1;
  });
  console.log(churchCounts);
}

analyzeMembers().catch(console.error);
