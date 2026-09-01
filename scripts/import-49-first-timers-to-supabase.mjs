import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import { executeSql } from "./run-supabase-sql.mjs";

const require = createRequire(import.meta.url);
const xlsx = require("xlsx");

function parseExcelDate(value) {
  if (!value) return null;
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return null;
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "number" || (/^\d{4,6}$/.test(String(value || "").trim()))) {
    const num = Number(value);
    if (xlsx?.SSF?.parse_date_code) {
      const parsed = xlsx.SSF.parse_date_code(num);
      if (parsed?.y && parsed?.m && parsed?.d) {
        return `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`;
      }
    }
    const utcDays = Math.floor(num - 25569);
    const dateInfo = new Date(utcDays * 86400 * 1000);
    if (!isNaN(dateInfo.getTime())) return dateInfo.toISOString().slice(0, 10);
  }
  const str = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    const [d, m, y] = str.split("/");
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(str)) {
    const [d, m, y] = str.split(".");
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return null;
}

function parseExcelPhone(value) {
  if (!value) return "";
  const str = String(value).trim();
  if (str === "N" || str === "n" || str.toLowerCase() === "sem contacto") return "";
  const digits = str.replace(/[^\d+]/g, "");
  if (!digits) return "";
  if (digits.startsWith("+258")) return digits;
  if (digits.startsWith("258")) return `+${digits}`;
  if (digits.length === 8 || digits.length === 9) return `+258 ${digits}`;
  return digits;
}

function escapeSql(val) {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "boolean") return val ? "true" : "false";
  if (typeof val === "number") return String(val);
  return `'${String(val).replace(/'/g, "''")}'`;
}

async function importFirstTimers() {
  const filePath = "C:\\Users\\Alves King Edition\\Downloads\\PRIMEIRAS VEZES 19.08.xlsx";
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const wb = xlsx.readFile(filePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet, { defval: "" });
  console.log(`Found ${rows.length} rows in ${filePath}`);

  const defaultChurchId = "a1111111-1111-4111-8111-111111111101";
  const defaultChurchName = "E.C. Maputo Central - Sede";

  const ftValues = [];
  const fuValues = [];

  rows.forEach((row, index) => {
    const no = index + 1;
    const firstName = String(row.NOME || "").trim();
    const lastName = String(row.APELIDO || "").trim();
    const fullName = `${firstName} ${lastName}`.trim() || `Visitante ${no}`;
    const phone = parseExcelPhone(row.CONTACTO);
    const dob = parseExcelDate(row.NASCIMENTO);
    const invitedBy = String(row["QUEM CONVIDOU"] || "").trim();
    const profession = String(row["PROFISSÃO"] || "").trim();
    const neighborhood = String(row.BAIRRO || "").trim();

    // Deterministic unique UUID based on sequential row index 1..49
    const ftId = `c4444444-4444-4000-8000-${String(no).padStart(12, "0")}`;
    const fuId = `f4444444-4444-4000-8000-${String(no).padStart(12, "0")}`;
    const ftNum = `FT-2026-${String(no).padStart(4, "0")}`;

    ftValues.push(`(
      ${escapeSql(ftId)},
      ${escapeSql(fullName)},
      ${escapeSql(firstName)},
      ${escapeSql(lastName)},
      'Irmão/Irmã',
      ${escapeSql(phone)},
      ${escapeSql(phone)},
      ${escapeSql(dob)},
      ${escapeSql(neighborhood)},
      ${escapeSql(profession)},
      ${escapeSql(defaultChurchId)},
      ${escapeSql(defaultChurchName)},
      '2026-08-19',
      'Culto de Domingo',
      ${escapeSql(invitedBy)},
      ${escapeSql(invitedBy)},
      true,
      true,
      false,
      true,
      'Pending',
      'Active',
      ${escapeSql(ftNum)},
      'DRAFT'
    )`);

    fuValues.push(`(
      ${escapeSql(fuId)},
      ${escapeSql(ftId)},
      'FirstTimer',
      ${escapeSql(fullName)},
      ${escapeSql(fullName)},
      ${escapeSql(phone)},
      ${escapeSql(phone)},
      ${escapeSql(defaultChurchId)},
      ${escapeSql(defaultChurchName)},
      'Sunday Service',
      'New Visitors',
      'Pending',
      'Normal',
      'Filipe Chamango',
      'First timer from 19.08 service intake sheet'
    )`);
  });

  const sql = `
    BEGIN;

    -- 1. Ensure table permissions
    GRANT ALL ON public.first_timers TO authenticated;
    GRANT ALL ON public.follow_ups TO authenticated;
    GRANT SELECT ON public.first_timers TO anon;
    GRANT SELECT ON public.follow_ups TO anon;

    -- 2. Insert First Timers
    INSERT INTO public.first_timers (
      id,
      full_name,
      first_name,
      last_name,
      title,
      phone,
      whatsapp,
      date_of_birth,
      neighborhood,
      profession,
      church_id,
      church_name,
      visit_date,
      service_name,
      invited_by,
      invited_by_name,
      born_again,
      foundation_school_interest,
      counseling_interest,
      cell_interest,
      follow_up_status,
      status,
      first_timer_number,
      workflow_status
    ) VALUES 
    ${ftValues.join(",\n")}
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      phone = EXCLUDED.phone,
      whatsapp = EXCLUDED.whatsapp,
      date_of_birth = EXCLUDED.date_of_birth,
      neighborhood = EXCLUDED.neighborhood,
      profession = EXCLUDED.profession,
      church_id = EXCLUDED.church_id,
      church_name = EXCLUDED.church_name,
      invited_by = EXCLUDED.invited_by,
      invited_by_name = EXCLUDED.invited_by_name,
      updated_at = NOW();

    -- 3. Insert Follow-Ups
    INSERT INTO public.follow_ups (
      id,
      first_timer_id,
      person_type,
      person_name,
      full_name,
      phone,
      whatsapp,
      church_id,
      church_name,
      source,
      category,
      status,
      priority,
      responsible_name,
      notes
    ) VALUES
    ${fuValues.join(",\n")}
    ON CONFLICT (id) DO UPDATE SET
      person_name = EXCLUDED.person_name,
      full_name = EXCLUDED.full_name,
      phone = EXCLUDED.phone,
      whatsapp = EXCLUDED.whatsapp,
      church_id = EXCLUDED.church_id,
      church_name = EXCLUDED.church_name,
      status = EXCLUDED.status,
      responsible_name = EXCLUDED.responsible_name,
      updated_at = NOW();

    COMMIT;
  `;

  console.log("Executing Supabase SQL import for 49 First Timers...");
  const res = await executeSql(sql);
  console.log("Import Result:", res);
  console.log(`[SUCCESS] Imported ${rows.length} First Timers & Follow-ups directly into Supabase!`);
}

importFirstTimers().catch(console.error);
