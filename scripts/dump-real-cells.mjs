import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';

const client = createClient(
  'https://kmurqbgpybrolrrumiue.supabase.co',
  'sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli'
);

async function dumpRealCellHierarchy() {
  const authRes = await client.auth.signInWithPassword({
    email: 'salesiomachava@gmail.com',
    password: 'Ziongate@7',
  });

  let allMembers = [];
  let page = 0;
  while (true) {
    const { data, error } = await client
      .from('members')
      .select('id, full_name, cell_name, cell_group_name, church_id, church_name')
      .range(page * 1000, (page + 1) * 1000 - 1);
    if (error || !data || data.length === 0) break;
    allMembers.push(...data);
    if (data.length < 1000) break;
    page++;
  }

  console.log('Total members:', allMembers.length);

  const groupMap = new Map();

  allMembers.forEach(m => {
    const groupName = (m.cell_group_name || 'Sem Grupo').trim();
    const cellName = (m.cell_name || 'Sem Célula').trim();

    if (!groupMap.has(groupName)) {
      groupMap.set(groupName, new Map());
    }
    const cells = groupMap.get(groupName);
    cells.set(cellName, (cells.get(cellName) || 0) + 1);
  });

  const structured = [];
  let groupIndex = 1;
  let cellIndex = 1;

  for (const [groupName, cells] of groupMap.entries()) {
    const groupId = `cg-${String(groupIndex).padStart(3, '0')}`;
    const cellList = [];
    let groupTotalMembers = 0;

    for (const [cellName, memberCount] of cells.entries()) {
      groupTotalMembers += memberCount;
      cellList.push({
        id: `cr-${String(cellIndex).padStart(4, '0')}`,
        cell_name: cellName,
        group_id: groupId,
        group_name: groupName,
        member_count: memberCount,
      });
      cellIndex++;
    }

    structured.push({
      id: groupId,
      group_name: groupName,
      total_cells: cellList.length,
      total_members: groupTotalMembers,
      cells: cellList,
    });
    groupIndex++;
  }

  // Sort groups by member count descending
  structured.sort((a, b) => b.total_members - a.total_members);

  fs.writeFileSync('scripts/real_cell_hierarchy.json', JSON.stringify(structured, null, 2));
  console.log('Saved real cell hierarchy to scripts/real_cell_hierarchy.json');
  console.log('Total groups:', structured.length);
  console.log('Total cells:', cellIndex - 1);
}

dumpRealCellHierarchy().catch(console.error);
