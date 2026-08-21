import { listCellGroups, listCells } from '../src/data/repositories/cellMinistryRepository.ts';

console.log("=== TESTING CELL MINISTRY REPOSITORY IN SUPABASE MODE ===");

const groupsResult = await listCellGroups();
console.log('listCellGroups:', {
  ok: groupsResult.ok,
  count: groupsResult.data?.length,
  sample: groupsResult.data?.[0]
});

const cellsResult = await listCells();
console.log('listCells:', {
  ok: cellsResult.ok,
  count: cellsResult.data?.length,
  sample: cellsResult.data?.[0]
});
