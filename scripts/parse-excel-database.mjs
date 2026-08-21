import xlsx from 'xlsx';
import fs from 'node:fs';

const filePath = 'C:/Users/Alves King Edition/Downloads/DATA BASE NOVEMBER (1).xlsx';
const workbook = xlsx.readFile(filePath);

console.log('Total Sheets in Workbook:', workbook.SheetNames.length);

const parsedHierarchy = [];

for (const sheetName of workbook.SheetNames) {
  const sheet = workbook.Sheets[sheetName];
  const rawRows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  
  console.log(`\n========================================`);
  console.log(`Sheet: "${sheetName}" (${rawRows.length} raw rows)`);
  console.log(`========================================`);

  // Let's identify the cells within this sheet
  // In Excel, cells are often separated by cell header rows like ['VANGUARD SHINE'] or ['Celula: ...']
  // followed by member records
  let currentCellName = '';
  let headerRow = null;
  const cellsFound = new Map();

  for (let r = 0; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || !Array.isArray(row)) continue;
    
    // Check if non-empty
    const nonEmpties = row.filter(cell => cell !== '' && cell !== null && cell !== undefined);
    if (nonEmpties.length === 0) continue;

    const firstVal = String(row[0] || '').trim();
    const secondVal = String(row[1] || '').trim();

    // Check if this row is a cell banner/title
    // Usually only 1 column populated, or starts with Celula/Cell/Group/ALL CAPS, or doesn't have numeric Nr
    const isHeaderColumnRow = firstVal.toLowerCase() === 'nr' || firstVal.toLowerCase() === 'nº' || firstVal.toLowerCase() === 'no' || secondVal.toLowerCase() === 'nome';
    
    if (isHeaderColumnRow) {
      headerRow = row.map(c => String(c).trim());
      continue;
    }

    const isCellBanner = nonEmpties.length <= 3 && 
      !isHeaderColumnRow && 
      !/^\d+$/.test(firstVal) && 
      (firstVal.length > 2 || secondVal.length > 2);

    if (isCellBanner) {
      const candidateName = firstVal || secondVal;
      if (!['embaixada de cristo', 'base de dados', 'total'].some(t => candidateName.toLowerCase().includes(t))) {
        currentCellName = candidateName;
        if (!cellsFound.has(currentCellName)) {
          cellsFound.set(currentCellName, []);
        }
      }
      continue;
    }

    // Member row
    const isMemberRow = (/^\d+$/.test(firstVal) && secondVal.length > 0) || (secondVal.length > 1 && String(row[2] || '').length > 1);

    if (isMemberRow) {
      const actualCell = currentCellName || `${sheetName.trim()} Main`;
      if (!cellsFound.has(actualCell)) {
        cellsFound.set(actualCell, []);
      }
      cellsFound.get(actualCell).push(row);
    }
  }

  console.log(`Cells found in sheet "${sheetName}": ${cellsFound.size}`);
  let sheetMembersCount = 0;
  for (const [cellName, members] of cellsFound.entries()) {
    console.log(`  - Célula: "${cellName}" -> ${members.length} membros`);
    sheetMembersCount += members.length;
  }
  console.log(`Total Members in "${sheetName}": ${sheetMembersCount}`);
  
  parsedHierarchy.push({
    groupName: sheetName.trim(),
    cellsCount: cellsFound.size,
    membersCount: sheetMembersCount,
    cells: Array.from(cellsFound.entries()).map(([name, m]) => ({ name, count: m.length }))
  });
}

console.log('\n\n================ HIERARCHY SUMMARY ================');
let grandTotalMembers = 0;
let grandTotalCells = 0;
parsedHierarchy.forEach((g, i) => {
  grandTotalMembers += g.membersCount;
  grandTotalCells += g.cellsCount;
  console.log(`[${i+1}] Grupo: ${g.groupName.padEnd(25)} | Células: ${String(g.cellsCount).padStart(3)} | Membros: ${String(g.membersCount).padStart(4)}`);
});
console.log(`====================================================`);
console.log(`TOTAL GRUPOS: ${parsedHierarchy.length} | TOTAL CÉLULAS: ${grandTotalCells} | TOTAL MEMBROS: ${grandTotalMembers}`);
