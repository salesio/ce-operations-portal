import xlsx from 'xlsx';

const filePath = 'C:/Users/Alves King Edition/Downloads/DATA BASE NOVEMBER (1).xlsx';
const workbook = xlsx.readFile(filePath);

for (const sheetName of workbook.SheetNames) {
  const sheet = workbook.Sheets[sheetName];
  const rawRows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  
  // find first row with 'Nome' or 'Nr'
  let headerRow = null;
  let sampleRow = null;
  for (let r = 0; r < Math.min(10, rawRows.length); r++) {
    const row = rawRows[r];
    const str = row.join(' ').toLowerCase();
    if (str.includes('nome') || str.includes('contact') || str.includes('nr')) {
      headerRow = row;
      sampleRow = rawRows[r + 1];
      break;
    }
  }

  console.log(`\n=== Sheet: "${sheetName}" ===`);
  console.log('Headers:', headerRow ? headerRow.filter(Boolean) : 'No header row found');
  console.log('Sample Row:', sampleRow ? sampleRow.slice(0, 8) : 'No sample');
}
