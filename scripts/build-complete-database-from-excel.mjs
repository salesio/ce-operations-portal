import xlsx from 'xlsx';
import fs from 'node:fs';
import crypto from 'node:crypto';

const filePath = 'C:/Users/Alves King Edition/Downloads/DATA BASE NOVEMBER (1).xlsx';
const workbook = xlsx.readFile(filePath);

const CHURCH_HQ_ID = 'a1111111-1111-4111-8111-111111111101';
const CHURCH_HQ_NAME = 'E.C. Maputo Central - Sede';

function cleanPhone(raw) {
  if (!raw) return null;
  let str = String(raw).replace(/[\r\n\t]/g, '').trim();
  if (str.includes('/')) str = str.split('/')[0].trim();
  if (str.includes(',')) str = str.split(',')[0].trim();
  str = str.replace(/[^\d+]/g, '');
  if (!str) return null;
  if (str.startsWith('+')) return str;
  if (str.startsWith('258')) return '+' + str;
  if (/^8[2-7]\d{7}$/.test(str)) return '+258' + str;
  return str;
}

function parseBool(val) {
  if (!val) return false;
  const s = String(val).toLowerCase().trim();
  return ['sim', 'yes', 'true', '1', 'concluída', 'concluido', 'concluida', 'graduado'].some(w => s.includes(w));
}

function cleanCellName(raw) {
  let name = String(raw || '').trim();
  name = name.replace(/^c[eé]lula\s*:\s*/i, '');
  name = name.replace(/^nome\s+c[eé]lula\s*:\s*/i, '');
  name = name.replace(/^cell\s+/i, '');
  return name.trim();
}

function generateDeterministicUUID(namespace, text) {
  const hash = crypto.createHash('sha1').update(`${namespace}:${text}`).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-8${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

const allGroups = [];
const allCells = [];
const allMembers = [];

let memberSequence = 1000;

for (const rawSheetName of workbook.SheetNames) {
  const sheet = workbook.Sheets[rawSheetName];
  const groupName = rawSheetName.trim();
  const groupId = generateDeterministicUUID('cell_group', groupName);
  
  const rawRows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  
  let currentCellRawName = '';
  let colIndexMap = {};

  const groupCellsMap = new Map();

  for (let r = 0; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || !Array.isArray(row)) continue;
    const nonEmpties = row.filter(c => c !== '' && c !== null && c !== undefined);
    if (nonEmpties.length === 0) continue;

    const rowStr = row.map(c => String(c).trim().toLowerCase());
    
    // Header detection
    if (rowStr.some(c => c === 'nome' || c === 'nome completo' || c === 'contact' || c === 'contacto')) {
      colIndexMap = {};
      row.forEach((colName, idx) => {
        const c = String(colName).trim().toLowerCase();
        if (c === 'nr' || c === 'ord.' || c === 'nº' || c === 'no') colIndexMap.nr = idx;
        else if (c === 'nome' || c === 'nome ' || c === 'nome completo') colIndexMap.name = idx;
        else if (c === 'apelido') colIndexMap.lastName = idx;
        else if (c.includes('contact') || c.includes('contacto')) colIndexMap.phone = idx;
        else if (c.includes('mail')) colIndexMap.email = idx;
        else if (c.includes('nascimento')) colIndexMap.dob = idx;
        else if (c.includes('civil')) colIndexMap.maritalStatus = idx;
        else if (c.includes('ocupa')) colIndexMap.occupation = idx;
        else if (c.includes('participa na celula') || c.includes('célula?')) colIndexMap.inCell = idx;
        else if (c.includes('culto')) colIndexMap.inChurch = idx;
        else if (c.includes('funda')) colIndexMap.foundation = idx;
        else if (c.includes('parceiro')) colIndexMap.partner = idx;
        else if (c.includes('lideran') || c === 'alec' || c === 'a.l.e.c') colIndexMap.alec = idx;
        else if (c.includes('batiz') || c.includes('btizado')) colIndexMap.baptized = idx;
        else if (c.includes('desde')) colIndexMap.memberSince = idx;
      });
      continue;
    }

    const firstVal = String(row[0] || '').trim();
    const secondVal = String(row[1] || '').trim();
    const isNumbered = /^\d+$/.test(firstVal);

    // Cell title banner detection
    if (!isNumbered && nonEmpties.length <= 4) {
      const banner = firstVal || secondVal;
      if (!['embaixada de cristo', 'base de dados', 'total', 'celula:'].includes(banner.toLowerCase())) {
        currentCellRawName = banner;
        if (!groupCellsMap.has(currentCellRawName)) {
          groupCellsMap.set(currentCellRawName, []);
        }
      }
      continue;
    }

    // Member extraction
    let nameVal = '';
    let lastNameVal = '';

    if (colIndexMap.name !== undefined) {
      nameVal = String(row[colIndexMap.name] || '').trim();
    } else {
      nameVal = isNumbered ? secondVal : firstVal;
    }

    if (colIndexMap.lastName !== undefined) {
      lastNameVal = String(row[colIndexMap.lastName] || '').trim();
    }

    if (!nameVal || ['nome', 'nome completo', 'nr'].includes(nameVal.toLowerCase())) continue;

    const cellRaw = currentCellRawName || `${groupName} Main`;
    if (!groupCellsMap.has(cellRaw)) {
      groupCellsMap.set(cellRaw, []);
    }

    const fullName = lastNameVal ? `${nameVal} ${lastNameVal}`.trim() : nameVal;
    const phone = cleanPhone(colIndexMap.phone !== undefined ? row[colIndexMap.phone] : row[3]);
    const email = (colIndexMap.email !== undefined && String(row[colIndexMap.email]).includes('@')) ? String(row[colIndexMap.email]).trim().toLowerCase() : null;
    const maritalStatus = colIndexMap.maritalStatus !== undefined ? String(row[colIndexMap.maritalStatus] || '').trim() : 'Solteiro(a)';
    const occupation = colIndexMap.occupation !== undefined ? String(row[colIndexMap.occupation] || '').trim() : null;
    const rawFundacao = colIndexMap.foundation !== undefined ? String(row[colIndexMap.foundation] || '').trim() : '';
    const rawPartner = colIndexMap.partner !== undefined ? String(row[colIndexMap.partner] || '').trim() : '';
    const rawAlec = colIndexMap.alec !== undefined ? String(row[colIndexMap.alec] || '').trim() : '';
    const rawBaptized = colIndexMap.baptized !== undefined ? String(row[colIndexMap.baptized] || '').trim() : '';
    const membroDesde = colIndexMap.memberSince !== undefined ? String(row[colIndexMap.memberSince] || '').trim() : '';

    groupCellsMap.get(cellRaw).push({
      fullName,
      firstName: nameVal,
      lastName: lastNameVal,
      phone,
      email,
      maritalStatus,
      occupation,
      rawFundacao,
      rawPartner,
      rawAlec,
      rawBaptized,
      membroDesde,
      sourceRow: r + 1,
      sourceSheet: groupName
    });
  }

  let groupTotalMembers = 0;
  for (const [cellRawName, memberRows] of groupCellsMap.entries()) {
    if (memberRows.length === 0) continue;
    
    const cleanName = cleanCellName(cellRawName);
    const cellId = generateDeterministicUUID('cell', `${groupName}:${cleanName}`);

    allCells.push({
      id: cellId,
      name: cleanName,
      raw_name: cellRawName,
      group_id: groupId,
      group_name: groupName,
      church_id: CHURCH_HQ_ID,
      church_name: CHURCH_HQ_NAME,
      member_count: memberRows.length
    });

    groupTotalMembers += memberRows.length;

    memberRows.forEach((m, idx) => {
      memberSequence++;
      const memberCode = `MEM-HQ-${String(memberSequence).padStart(5, '0')}`;
      const memberId = generateDeterministicUUID('member', `${cellId}:${m.fullName}:${m.phone}:${idx}`);
      
      const isPartner = parseBool(m.rawPartner);
      const isBaptized = parseBool(m.rawBaptized);
      const isFoundation = parseBool(m.rawFundacao);
      const isAlec = parseBool(m.rawAlec);

      let memberSinceYear = null;
      if (m.membroDesde) {
        const yearMatch = m.membroDesde.match(/(?:19|20)\d{2}/);
        if (yearMatch) memberSinceYear = parseInt(yearMatch[0], 10);
      }

      allMembers.push({
        id: memberId,
        member_code: memberCode,
        full_name: m.fullName,
        first_name: m.firstName || m.fullName.split(' ')[0] || '',
        last_name: m.lastName || m.fullName.split(' ').slice(1).join(' ') || '',
        phone: m.phone,
        primary_phone: m.phone,
        secondary_phone: null,
        email: m.email,
        church_id: CHURCH_HQ_ID,
        church_name: CHURCH_HQ_NAME,
        cell_group_id: groupId,
        cell_group_name: groupName,
        cell_id: cellId,
        cell_name: cleanName,
        marital_status: m.maritalStatus,
        occupation: m.occupation,
        legacy_foundation_status: isFoundation ? 'Completed' : (m.rawFundacao ? 'In Progress' : 'Not Started'),
        legacy_foundation_raw_value: m.rawFundacao || null,
        legacy_alec_status: isAlec ? 'Completed' : (m.rawAlec ? 'In Progress' : 'Not Started'),
        legacy_alec_raw_value: m.rawAlec || null,
        legacy_baptism_status: isBaptized ? 'Baptized' : 'Not Baptized',
        legacy_baptism_raw_value: m.rawBaptized || null,
        legacy_partner_status: isPartner ? 'Partner' : 'Non-Partner',
        legacy_partnership_arms: isPartner ? ['General Partnership'] : [],
        member_since_year: memberSinceYear,
        member_since_raw: m.membroDesde || null,
        legacy_source: 'DATA BASE NOVEMBER (1).xlsx',
        legacy_source_sheet: m.sourceSheet,
        legacy_source_row: m.sourceRow,
        data_quality_status: 'Verified',
        reconciliation_status: 'Confirmed',
        status: 'Active',
        source: 'excel_official_november',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    });
  }

  allGroups.push({
    id: groupId,
    name: groupName,
    group_name: groupName,
    church_id: CHURCH_HQ_ID,
    church_name: CHURCH_HQ_NAME,
    total_cells: groupCellsMap.size,
    total_members: groupTotalMembers
  });
}

console.log(`=== DATABASE EXTRACTION SUCCESSFUL ===`);
console.log(`- Grupos de Célula: ${allGroups.length}`);
console.log(`- Células:          ${allCells.length}`);
console.log(`- Membros:          ${allMembers.length}`);

// 1. JSON Datasets
fs.writeFileSync('scripts/extracted_groups.json', JSON.stringify(allGroups, null, 2));
fs.writeFileSync('scripts/extracted_cells.json', JSON.stringify(allCells, null, 2));
fs.writeFileSync('scripts/extracted_members.json', JSON.stringify(allMembers, null, 2));

// 2. CSV Generation for Supabase import or excel review
const csvHeaders = [
  'id',
  'member_code',
  'full_name',
  'first_name',
  'last_name',
  'phone',
  'primary_phone',
  'email',
  'marital_status',
  'occupation',
  'church_id',
  'church_name',
  'cell_group_id',
  'cell_group_name',
  'cell_id',
  'cell_name',
  'legacy_foundation_status',
  'legacy_alec_status',
  'legacy_baptism_status',
  'legacy_partner_status',
  'member_since_year',
  'reconciliation_status',
  'data_quality_status',
  'status',
  'source'
];

function escapeCsv(val) {
  if (val === null || val === undefined) return '';
  const s = String(val).replace(/"/g, '""');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s}"`;
  return s;
}

const csvLines = [csvHeaders.join(',')];
for (const m of allMembers) {
  const line = [
    m.id,
    escapeCsv(m.member_code),
    escapeCsv(m.full_name),
    escapeCsv(m.first_name),
    escapeCsv(m.last_name),
    escapeCsv(m.phone),
    escapeCsv(m.primary_phone),
    escapeCsv(m.email),
    escapeCsv(m.marital_status),
    escapeCsv(m.occupation),
    m.church_id,
    escapeCsv(m.church_name),
    m.cell_group_id,
    escapeCsv(m.cell_group_name),
    m.cell_id,
    escapeCsv(m.cell_name),
    escapeCsv(m.legacy_foundation_status),
    escapeCsv(m.legacy_alec_status),
    escapeCsv(m.legacy_baptism_status),
    escapeCsv(m.legacy_partner_status),
    m.member_since_year || '',
    escapeCsv(m.reconciliation_status),
    escapeCsv(m.data_quality_status),
    escapeCsv(m.status),
    escapeCsv(m.source)
  ];
  csvLines.push(line.join(','));
}

fs.writeFileSync('scripts/members_master_import.csv', csvLines.join('\n'));
console.log('Saved: scripts/members_master_import.csv');

// 3. SQL Script generation for clean reset & load
let sql = `-- RESET & RELATIONAL SEED FOR CE MOZAMBIQUE (MAPUTO CENTRAL)
BEGIN;

-- 1. Truncate legacy members
DELETE FROM public.members;

-- 2. Insert fresh sanitized members with exact cell_id and cell_group_id
`;

const batches = [];
const batchSize = 100;
for (let i = 0; i < allMembers.length; i += batchSize) {
  batches.push(allMembers.slice(i, i + batchSize));
}

batches.forEach((batch, bIdx) => {
  sql += `\n-- Batch ${bIdx + 1}\nINSERT INTO public.members (\n`;
  sql += `  id, member_code, full_name, first_name, last_name, phone, primary_phone, email,\n`;
  sql += `  marital_status, occupation, church_id, church_name, cell_group_id, cell_group_name,\n`;
  sql += `  cell_id, cell_name, legacy_foundation_status, legacy_alec_status, legacy_baptism_status,\n`;
  sql += `  legacy_partner_status, reconciliation_status, data_quality_status, status, source\n) VALUES\n`;
  
  const valRows = batch.map(m => {
    const esc = (s) => s ? `'${String(s).replace(/'/g, "''")}'` : 'NULL';
    return `  (${esc(m.id)}, ${esc(m.member_code)}, ${esc(m.full_name)}, ${esc(m.first_name)}, ${esc(m.last_name)}, ${esc(m.phone)}, ${esc(m.primary_phone)}, ${esc(m.email)}, ${esc(m.marital_status)}, ${esc(m.occupation)}, ${esc(m.church_id)}, ${esc(m.church_name)}, ${esc(m.cell_group_id)}, ${esc(m.cell_group_name)}, ${esc(m.cell_id)}, ${esc(m.cell_name)}, ${esc(m.legacy_foundation_status)}, ${esc(m.legacy_alec_status)}, ${esc(m.legacy_baptism_status)}, ${esc(m.legacy_partner_status)}, ${esc(m.reconciliation_status)}, ${esc(m.data_quality_status)}, ${esc(m.status)}, ${esc(m.source)})`;
  });
  sql += valRows.join(',\n') + ';\n';
});

sql += `\nCOMMIT;\n`;
fs.writeFileSync('scripts/sql_import_fresh_database.sql', sql);
console.log('Saved: scripts/sql_import_fresh_database.sql');
