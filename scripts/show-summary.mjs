import fs from 'node:fs';

const groups = JSON.parse(fs.readFileSync('scripts/extracted_groups.json', 'utf8'));
const cells = JSON.parse(fs.readFileSync('scripts/extracted_cells.json', 'utf8'));
const members = JSON.parse(fs.readFileSync('scripts/extracted_members.json', 'utf8'));

console.log('=== EXTRACTED GROUPS & CELL BREAKDOWN ===');
groups.forEach(g => {
  const gCells = cells.filter(c => c.group_id === g.id);
  const gMembers = members.filter(m => m.cell_group_id === g.id);
  console.log(`\n📁 Grupo: ${g.name} (${gCells.length} células, ${gMembers.length} membros) [ID: ${g.id}]`);
  gCells.forEach(c => {
    console.log(`   ├── 🔹 ${c.name} (${c.member_count} membros) [ID: ${c.id}]`);
  });
});
