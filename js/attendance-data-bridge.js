/**
 * Staff Biometric Attendance Data Bridge — Dual-write / Supabase / LocalStorage fallback.
 * Christ Embassy Mozambique Operations Portal.
 * Handles biometric device uploads, daily attendance logs, delay calculations,
 * staff trajectory tracking, monthly statistics, shift configurations,
 * multi-period temporal comparison engine (days, weeks, months, years),
 * and the 3-Step Pastoral Executive Workflow Pipeline:
 *   Brother Lio (Extraction/Upload - Paixão à Primeira Vista / Leopold Youngpet & Koutou)
 *   -> Pastor Valdemiro (Pastoral Care Head Review & Consolidation)
 *   -> Pastor Kéne (Group Pastor / Executive Overseer / MAIN Dashboard)
 */
(function () {
  "use strict";

  var KEYS = {
    attendance: "ce-data-layer:biometric-attendance",
    uploads: "ce-data-layer:attendance-uploads",
    settings: "ce-data-layer:attendance-settings",
    submissions: "ce-data-layer:attendance-workflow-submissions",
  };

  var memory = {
    attendance: null,
    uploads: null,
    settings: null,
    submissions: null,
  };

  var DEFAULT_SETTINGS = {
    id: "00000000-0000-0000-0000-000000000001",
    standard_start_time: "08:00",
    standard_end_time: "17:00",
    grace_period_minutes: 15,
    minor_delay_threshold_minutes: 30,
    severe_delay_threshold_minutes: 60,
    working_days: ["mon", "tue", "wed", "thu", "fri"],
    is_active: true,
  };

  var STAFF_LIST = [
    { id: "1", name: "Leo", fullName: "Brother Lio (Leopold Youngpet & Koutou)", dept: "Paixão à Primeira Vista / CESTAFF", role: "Group Leader" },
    { id: "2", name: "Marcelo", fullName: "Marcelo Machava", dept: "CESTAFF", role: "Staff Member" },
    { id: "3", name: "Deacon", fullName: "Deacon Rui", dept: "CESTAFF", role: "Deacon" },
    { id: "4", name: "Flavia", fullName: "Flavia Cossa", dept: "CESTAFF", role: "Staff Member" },
    { id: "5", name: "Gil", fullName: "Gilberto Tembe", dept: "CESTAFF", role: "Staff Member" },
    { id: "7", name: "Pk", fullName: "Pastor Kéne (Kenneth)", dept: "Liderança Geral / MAIN", role: "Group Pastor" },
    { id: "8", name: "Service", fullName: "Service Team Admin", dept: "Operações", role: "Staff Member" },
    { id: "9", name: "Staff", fullName: "Staff Central", dept: "CESTAFF", role: "Staff Member" },
    { id: "10", name: "Valdemiro", fullName: "Pastor Valdemiro", dept: "Cuidados Pastorais", role: "Pastoral Care Head" },
    { id: "11", name: "Janet", fullName: "Janet Sitoe", dept: "CESTAFF", role: "Staff Member" },
    { id: "13", name: "Pstreina", fullName: "Pastora Reina", dept: "Cuidados Pastorais", role: "Pastor" },
    { id: "15", name: "Laiza", fullName: "Laiza Nhantumbo", dept: "CESTAFF", role: "Staff Member" },
    { id: "2025", name: "Claudina", fullName: "Claudina Matsinhe", dept: "CESTAFF", role: "Staff Member" },
    { id: "10000013", name: "Eduarda", fullName: "Eduarda Mondlane", dept: "CESTAFF", role: "Staff Member" },
    { id: "10000014", name: "Angelica", fullName: "Angelica Guambe", dept: "CESTAFF", role: "Staff Member" },
    { id: "10000017", name: "Junia", fullName: "Junia Macuacua", dept: "CESTAFF", role: "Staff Member" },
    { id: "10000019", name: "Kassandra", fullName: "Kassandra Langa", dept: "CESTAFF", role: "Staff Member" },
    { id: "10000020", name: "Filipe", fullName: "Filipe Mabunda", dept: "CESTAFF", role: "Staff Member" },
    { id: "10000021", name: "Virginia", fullName: "Virginia Chissano", dept: "CESTAFF", role: "Staff Member" },
    { id: "10000022", name: "Kenneth", fullName: "Kenneth (Pastor Kéne)", dept: "Liderança Geral / MAIN", role: "Group Pastor" },
    { id: "10000023", name: "Salesio", fullName: "Salesio Machava", dept: "Administração Geral", role: "Super Admin" },
    { id: "10000024", name: "Protocols", fullName: "Protocolos & Recepção", dept: "Operações", role: "Staff Member" },
  ];

  // Multi-day sample attendance generation helper
  function buildSeedAttendanceData() {
    var records = [];
    var uploadIdBase = "e1111111-1111-4111-8111-1111111111";

    var checkInProfiles = {
      "2026-07-09": {
        "1": { in: "08:18", out: "17:05", card: "" },
        "2": { in: "08:15", out: "17:00", card: "" },
        "3": { in: "08:29", out: "17:10", card: "" },
        "4": { in: "08:31", out: "17:15", card: "" },
        "5": { in: "08:40", out: "17:30", card: "" },
        "7": { in: null, out: null, card: "0169895558" },
        "8": { in: null, out: null, card: "0169672262" },
        "9": { in: null, out: null, card: "0170207286" },
        "10": { in: "08:16", out: "17:20", card: "" },
        "11": { in: "09:03", out: "17:00", card: "" },
        "13": { in: null, out: null, card: "" },
        "15": { in: null, out: null, card: "" },
        "2025": { in: "08:57", out: "17:00", card: "" },
        "10000013": { in: "08:07", out: "17:00", card: "" },
        "10000014": { in: "08:15", out: "17:05", card: "" },
        "10000017": { in: "08:28", out: "17:00", card: "" },
        "10000019": { in: "08:29", out: "17:10", card: "" },
        "10000020": { in: "07:56", out: "17:00", card: "" },
        "10000021": { in: "09:20", out: "17:35", card: "" },
        "10000022": { in: "08:15", out: "17:30", card: "" },
        "10000023": { in: null, out: null, card: "" },
        "10000024": { in: null, out: null, card: "1512235212" },
      },
      "2026-07-08": {
        "1": { in: "08:05", out: "17:10", card: "" },
        "2": { in: "08:10", out: "17:00", card: "" },
        "3": { in: "08:12", out: "17:05", card: "" },
        "4": { in: "08:25", out: "17:00", card: "" },
        "5": { in: "08:18", out: "17:00", card: "" },
        "7": { in: "08:00", out: "17:45", card: "0169895558" },
        "8": { in: "07:55", out: "17:00", card: "0169672262" },
        "9": { in: "08:14", out: "17:00", card: "0170207286" },
        "10": { in: "08:08", out: "17:15", card: "" },
        "11": { in: "08:35", out: "17:00", card: "" },
        "13": { in: "08:02", out: "17:00", card: "" },
        "15": { in: null, out: null, card: "" },
        "2025": { in: "08:42", out: "17:00", card: "" },
        "10000013": { in: "08:00", out: "17:00", card: "" },
        "10000014": { in: "08:10", out: "17:00", card: "" },
        "10000017": { in: "08:15", out: "17:00", card: "" },
        "10000019": { in: "08:20", out: "17:00", card: "" },
        "10000020": { in: "07:50", out: "17:00", card: "" },
        "10000021": { in: "08:45", out: "17:00", card: "" },
        "10000022": { in: "08:00", out: "17:30", card: "" },
        "10000023": { in: "07:58", out: "18:00", card: "" },
        "10000024": { in: "07:55", out: "17:00", card: "1512235212" },
      },
      "2026-07-07": {
        "1": { in: "07:58", out: "17:10", card: "" },
        "2": { in: "08:02", out: "17:00", card: "" },
        "3": { in: "08:14", out: "17:00", card: "" },
        "4": { in: "08:20", out: "17:00", card: "" },
        "5": { in: "08:15", out: "17:00", card: "" },
        "7": { in: "08:05", out: "17:30", card: "0169895558" },
        "8": { in: "07:50", out: "17:00", card: "0169672262" },
        "9": { in: "08:00", out: "17:00", card: "0170207286" },
        "10": { in: "08:00", out: "17:10", card: "" },
        "11": { in: "08:40", out: "17:00", card: "" },
        "13": { in: "08:10", out: "17:00", card: "" },
        "15": { in: "08:25", out: "17:00", card: "" },
        "2025": { in: "08:30", out: "17:00", card: "" },
        "10000013": { in: "07:55", out: "17:00", card: "" },
        "10000014": { in: "08:05", out: "17:00", card: "" },
        "10000017": { in: "08:10", out: "17:00", card: "" },
        "10000019": { in: "08:15", out: "17:00", card: "" },
        "10000020": { in: "07:52", out: "17:00", card: "" },
        "10000021": { in: "09:05", out: "17:00", card: "" },
        "10000022": { in: "08:05", out: "17:30", card: "" },
        "10000023": { in: "07:55", out: "18:00", card: "" },
        "10000024": { in: "07:58", out: "17:00", card: "1512235212" },
      },
      "2026-07-06": {
        "1": { in: "08:12", out: "17:00", card: "" },
        "2": { in: "08:08", out: "17:00", card: "" },
        "3": { in: "08:19", out: "17:00", card: "" },
        "4": { in: "08:22", out: "17:00", card: "" },
        "5": { in: "08:35", out: "17:00", card: "" },
        "7": { in: "08:00", out: "17:30", card: "0169895558" },
        "8": { in: "07:55", out: "17:00", card: "0169672262" },
        "9": { in: "08:05", out: "17:00", card: "0170207286" },
        "10": { in: "08:04", out: "17:00", card: "" },
        "11": { in: "08:50", out: "17:00", card: "" },
        "13": { in: "08:15", out: "17:00", card: "" },
        "15": { in: null, out: null, card: "" },
        "2025": { in: "08:45", out: "17:00", card: "" },
        "10000013": { in: "07:58", out: "17:00", card: "" },
        "10000014": { in: "08:12", out: "17:00", card: "" },
        "10000017": { in: "08:18", out: "17:00", card: "" },
        "10000019": { in: "08:22", out: "17:00", card: "" },
        "10000020": { in: "07:50", out: "17:00", card: "" },
        "10000021": { in: "09:10", out: "17:00", card: "" },
        "10000022": { in: "08:00", out: "17:30", card: "" },
        "10000023": { in: "07:50", out: "18:00", card: "" },
        "10000024": { in: "07:56", out: "17:00", card: "1512235212" },
      },
      // June 2026 for month-vs-month comparison
      "2026-06-09": {
        "1": { in: "08:22", out: "17:00", card: "" },
        "2": { in: "08:18", out: "17:00", card: "" },
        "3": { in: "08:35", out: "17:00", card: "" },
        "4": { in: "08:40", out: "17:00", card: "" },
        "5": { in: "08:45", out: "17:00", card: "" },
        "7": { in: "08:10", out: "17:00", card: "0169895558" },
        "8": { in: "08:00", out: "17:00", card: "0169672262" },
        "9": { in: null, out: null, card: "0170207286" },
        "10": { in: "08:20", out: "17:00", card: "" },
        "11": { in: "09:15", out: "17:00", card: "" },
        "13": { in: null, out: null, card: "" },
        "15": { in: null, out: null, card: "" },
        "2025": { in: "09:05", out: "17:00", card: "" },
        "10000013": { in: "08:10", out: "17:00", card: "" },
        "10000014": { in: "08:18", out: "17:00", card: "" },
        "10000017": { in: "08:30", out: "17:00", card: "" },
        "10000019": { in: "08:35", out: "17:00", card: "" },
        "10000020": { in: "08:00", out: "17:00", card: "" },
        "10000021": { in: "09:30", out: "17:00", card: "" },
        "10000022": { in: "08:10", out: "17:00", card: "" },
        "10000023": { in: "08:05", out: "18:00", card: "" },
        "10000024": { in: null, out: null, card: "1512235212" },
      },
      // July 2025 for year-vs-year comparison
      "2025-07-09": {
        "1": { in: "08:25", out: "17:00", card: "" },
        "2": { in: "08:20", out: "17:00", card: "" },
        "3": { in: "08:40", out: "17:00", card: "" },
        "4": { in: "08:45", out: "17:00", card: "" },
        "5": { in: "08:50", out: "17:00", card: "" },
        "7": { in: "08:15", out: "17:00", card: "0169895558" },
        "8": { in: "08:05", out: "17:00", card: "0169672262" },
        "9": { in: null, out: null, card: "0170207286" },
        "10": { in: "08:25", out: "17:00", card: "" },
        "11": { in: "09:20", out: "17:00", card: "" },
        "13": { in: null, out: null, card: "" },
        "15": { in: null, out: null, card: "" },
        "2025": { in: "09:10", out: "17:00", card: "" },
        "10000013": { in: "08:15", out: "17:00", card: "" },
        "10000014": { in: "08:22", out: "17:00", card: "" },
        "10000017": { in: "08:35", out: "17:00", card: "" },
        "10000019": { in: "08:40", out: "17:00", card: "" },
        "10000020": { in: "08:05", out: "17:00", card: "" },
        "10000021": { in: "09:40", out: "17:00", card: "" },
        "10000022": { in: "08:15", out: "17:00", card: "" },
        "10000023": { in: "08:10", out: "18:00", card: "" },
        "10000024": { in: null, out: null, card: "1512235212" },
      }
    };

    var dateKeys = Object.keys(checkInProfiles);
    var dayCounter = 1;

    dateKeys.forEach(function (dStr) {
      var uploadId = uploadIdBase + String(dayCounter).padStart(2, "0");
      dayCounter++;

      STAFF_LIST.forEach(function (staff) {
        var dayProf = checkInProfiles[dStr][staff.id] || { in: null, out: null, card: "" };
        var checkIn = dayProf.in;
        var checkOut = dayProf.out;
        var cardNo = dayProf.card || "";

        var punct = calculatePunctualityStatus(checkIn, DEFAULT_SETTINGS);

        records.push({
          id: "att-" + dStr.replace(/-/g, "") + "-" + staff.id,
          attendance_date: dStr,
          employee_id: staff.id,
          employee_name: staff.name,
          employee_full_name: staff.fullName,
          card_no: cardNo,
          department: staff.dept,
          role: staff.role,
          check_in: checkIn,
          check_out: checkOut,
          all_punches: checkIn ? checkIn + " " + (checkOut || "--:--") : "--:-- --:--",
          status: punct.status,
          delay_minutes: punct.delay_minutes,
          is_late: punct.is_late,
          is_present: punct.is_present,
          upload_id: uploadId,
        });
      });
    });

    return records;
  }

  var SEED_ATTENDANCE = buildSeedAttendanceData();

  var SEED_UPLOADS = [
    {
      id: "e1111111-1111-4111-8111-111111111101",
      filename: "Attendance_Record_20260709.xlsx",
      upload_date: "2026-07-09",
      device_create_time: "2026-07-09 09:39:33",
      record_count: 22,
      present_count: 14,
      on_time_count: 1,
      grace_count: 4,
      late_count: 9,
      absent_count: 8,
      uploaded_by: "Brother Lio",
      file_size_bytes: 14500,
      created_at: "2026-07-09T09:40:00Z",
    },
    {
      id: "e1111111-1111-4111-8111-111111111102",
      filename: "Attendance_Record_20260708.xlsx",
      upload_date: "2026-07-08",
      device_create_time: "2026-07-08 09:35:10",
      record_count: 22,
      present_count: 21,
      on_time_count: 7,
      grace_count: 8,
      late_count: 6,
      absent_count: 1,
      uploaded_by: "Brother Lio",
      file_size_bytes: 14200,
      created_at: "2026-07-08T09:36:00Z",
    },
    {
      id: "e1111111-1111-4111-8111-111111111103",
      filename: "Attendance_Record_20260707.xlsx",
      upload_date: "2026-07-07",
      device_create_time: "2026-07-07 09:30:00",
      record_count: 22,
      present_count: 22,
      on_time_count: 10,
      grace_count: 8,
      late_count: 4,
      absent_count: 0,
      uploaded_by: "Brother Lio",
      file_size_bytes: 14100,
      created_at: "2026-07-07T09:31:00Z",
    },
  ];

  var SEED_WORKFLOW_SUBMISSIONS = [
    {
      id: "wf-sub-2026-07-09",
      date: "2026-07-09",
      period_type: "daily",
      title: "Registo Biométrico Diário — 09 de Julho de 2026",
      group_name: "Paixão à Primeira Vista (Leopold Youngpet & Koutou)",
      extracted_by: "Brother Lio",
      extracted_at: "2026-07-09T09:40:00Z",
      extraction_status: "Completed",
      
      // Step 2: Pastoral Care Head Review
      pastoral_head: "Pastor Valdemiro",
      pastoral_reviewed_at: "2026-07-09T10:15:00Z",
      pastoral_status: "Approved",
      pastoral_notes: "Dados conferidos e auditados pelo Departamento de Cuidados Pastorais. Justificações pastorais de atraso verificadas.",
      
      // Step 3: Group Pastor / Overall Overseer
      overseer_name: "Pastor Kéne",
      overseer_received_at: "2026-07-09T10:30:00Z",
      overseer_status: "Delivered_Main",
      overseer_notes: "Visto no MAIN. Relatório homologado com acompanhamento da equipa.",
      
      record_count: 22,
      present_count: 14,
      on_time_count: 1,
      grace_count: 4,
      late_count: 9,
      absent_count: 8,
      total_delay_minutes: 367,
      status: "delivered_to_kene", // "draft" | "submitted_by_lio" | "reviewed_by_valdemiro" | "delivered_to_kene"
      created_at: "2026-07-09T09:40:00Z",
      updated_at: "2026-07-09T10:30:00Z",
    },
    {
      id: "wf-sub-2026-07-08",
      date: "2026-07-08",
      period_type: "daily",
      title: "Registo Biométrico Diário — 08 de Julho de 2026",
      group_name: "Paixão à Primeira Vista (Leopold Youngpet & Koutou)",
      extracted_by: "Brother Lio",
      extracted_at: "2026-07-08T09:36:00Z",
      extraction_status: "Completed",
      
      pastoral_head: "Pastor Valdemiro",
      pastoral_reviewed_at: "2026-07-08T10:00:00Z",
      pastoral_status: "Approved",
      pastoral_notes: "Excelente índice de comparência geral (95%).",
      
      overseer_name: "Pastor Kéne",
      overseer_received_at: "2026-07-08T10:20:00Z",
      overseer_status: "Delivered_Main",
      overseer_notes: "Homologado no Painel Geral da Igreja.",
      
      record_count: 22,
      present_count: 21,
      on_time_count: 7,
      grace_count: 8,
      late_count: 6,
      absent_count: 1,
      total_delay_minutes: 198,
      status: "delivered_to_kene",
      created_at: "2026-07-08T09:36:00Z",
      updated_at: "2026-07-08T10:20:00Z",
    },
  ];

  function loadLocal(key) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  }

  function saveLocal(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn("[CE Attendance] persist failed", key, e);
    }
  }

  function getLocalStore(kind) {
    if (kind === "attendance") {
      var cached = loadLocal(KEYS.attendance);
      if (!cached || !Array.isArray(cached) || !cached.length) {
        cached = SEED_ATTENDANCE.map(function (x) {
          return Object.assign({}, x);
        });
        saveLocal(KEYS.attendance, cached);
      }
      return cached;
    }
    if (kind === "uploads") {
      var cachedUp = loadLocal(KEYS.uploads);
      if (!cachedUp || !Array.isArray(cachedUp) || !cachedUp.length) {
        cachedUp = SEED_UPLOADS.map(function (x) {
          return Object.assign({}, x);
        });
        saveLocal(KEYS.uploads, cachedUp);
      }
      return cachedUp;
    }
    if (kind === "settings") {
      var cachedSet = loadLocal(KEYS.settings);
      if (!cachedSet || typeof cachedSet !== "object") {
        cachedSet = Object.assign({}, DEFAULT_SETTINGS);
        saveLocal(KEYS.settings, cachedSet);
      }
      return cachedSet;
    }
    if (kind === "submissions") {
      var cachedSub = loadLocal(KEYS.submissions);
      if (!cachedSub || !Array.isArray(cachedSub) || !cachedSub.length) {
        cachedSub = SEED_WORKFLOW_SUBMISSIONS.map(function (x) {
          return Object.assign({}, x);
        });
        saveLocal(KEYS.submissions, cachedSub);
      }
      return cachedSub;
    }
    return [];
  }

  function parseTimeToMinutes(timeStr) {
    if (!timeStr || typeof timeStr !== "string") return null;
    var clean = timeStr.trim();
    var match = clean.match(/^(\d{1,2}):(\d{2})/);
    if (!match) return null;
    var h = parseInt(match[1], 10);
    var m = parseInt(match[2], 10);
    if (isNaN(h) || isNaN(m)) return null;
    return h * 60 + m;
  }

  function minutesToTimeStr(mins) {
    if (mins == null || isNaN(mins)) return "--:--";
    var h = Math.floor(mins / 60);
    var m = mins % 60;
    return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
  }

  function calculatePunctualityStatus(checkInTime, settings) {
    var set = settings || DEFAULT_SETTINGS;
    var targetMins = parseTimeToMinutes(set.standard_start_time) || 480; // 08:00 default
    var grace = Number(set.grace_period_minutes) || 15;
    var minorThresh = Number(set.minor_delay_threshold_minutes) || 30;
    var severeThresh = Number(set.severe_delay_threshold_minutes) || 60;

    if (!checkInTime || checkInTime === "--:--" || !checkInTime.trim()) {
      return {
        status: "absent",
        delay_minutes: 0,
        is_late: false,
        is_present: false,
        label_pt: "Falta / Sem Registo",
        label_en: "Absent / No Punch",
        badge_class: "badge-soft-secondary text-secondary",
      };
    }

    var checkInMins = parseTimeToMinutes(checkInTime);
    if (checkInMins == null) {
      return {
        status: "absent",
        delay_minutes: 0,
        is_late: false,
        is_present: false,
        label_pt: "Falta / Sem Registo",
        label_en: "Absent / No Punch",
        badge_class: "badge-soft-secondary text-secondary",
      };
    }

    var diff = checkInMins - targetMins;

    if (diff <= 0) {
      return {
        status: "on_time",
        delay_minutes: 0,
        is_late: false,
        is_present: true,
        label_pt: "Pontual",
        label_en: "On Time",
        badge_class: "badge-soft-success text-success",
      };
    }

    if (diff <= grace) {
      return {
        status: "grace_period",
        delay_minutes: diff,
        is_late: false,
        is_present: true,
        label_pt: "Tolerância (+" + diff + "m)",
        label_en: "Grace (+" + diff + "m)",
        badge_class: "badge-soft-info text-info",
      };
    }

    if (diff <= minorThresh) {
      return {
        status: "minor_delay",
        delay_minutes: diff,
        is_late: true,
        is_present: true,
        label_pt: "Atraso Ligeiro (+" + diff + "m)",
        label_en: "Minor Delay (+" + diff + "m)",
        badge_class: "badge-soft-warning text-warning",
      };
    }

    if (diff <= severeThresh) {
      return {
        status: "late",
        delay_minutes: diff,
        is_late: true,
        is_present: true,
        label_pt: "Atrasado (+" + diff + "m)",
        label_en: "Late (+" + diff + "m)",
        badge_class: "badge-soft-danger text-danger",
      };
    }

    var hours = Math.floor(diff / 60);
    var remMins = diff % 60;
    var delayFormatted = hours > 0 ? "+" + hours + "h" + (remMins > 0 ? String(remMins).padStart(2, "0") + "m" : "") : "+" + diff + "m";

    return {
      status: "severe_delay",
      delay_minutes: diff,
      is_late: true,
      is_present: true,
      label_pt: "Muito Tarde (" + delayFormatted + ")",
      label_en: "Severe Delay (" + delayFormatted + ")",
      badge_class: "badge-soft-danger bg-danger text-white",
    };
  }

  function getSupabaseClient() {
    try {
      if (window.CESupabaseClient) return window.CESupabaseClient;
      if (window.supabaseClient) return window.supabaseClient;
      if (typeof window.supabase !== "undefined" && typeof window.supabase.createClient === "function") {
        var cfg = window.__CE_ENV__ || {};
        if (cfg.VITE_SUPABASE_URL && cfg.VITE_SUPABASE_ANON_KEY) {
          window.CESupabaseClient = window.supabase.createClient(cfg.VITE_SUPABASE_URL, cfg.VITE_SUPABASE_ANON_KEY);
          return window.CESupabaseClient;
        }
      }
    } catch (_) {}
    return null;
  }

  var dataBridge = {
    STAFF_LIST: STAFF_LIST,
    calculatePunctualityStatus: calculatePunctualityStatus,
    parseTimeToMinutes: parseTimeToMinutes,
    minutesToTimeStr: minutesToTimeStr,

    getAttendanceSettings: async function () {
      var client = getSupabaseClient();
      if (client) {
        try {
          var { data, error } = await client.from("staff_attendance_settings").select("*").limit(1).maybeSingle();
          if (!error && data) {
            saveLocal(KEYS.settings, data);
            return { ok: true, data: data };
          }
        } catch (_) {}
      }
      return { ok: true, data: getLocalStore("settings") };
    },

    saveAttendanceSettings: async function (settingsPayload) {
      var client = getSupabaseClient();
      var clean = Object.assign({}, DEFAULT_SETTINGS, settingsPayload, {
        updated_at: new Date().toISOString(),
      });
      saveLocal(KEYS.settings, clean);

      if (client) {
        try {
          await client.from("staff_attendance_settings").upsert(clean);
        } catch (e) {
          console.warn("[CE Attendance] save settings remote failed", e);
        }
      }
      return { ok: true, data: clean };
    },

    listUploads: async function () {
      var client = getSupabaseClient();
      if (client) {
        try {
          var { data, error } = await client.from("staff_attendance_uploads").select("*").order("upload_date", { ascending: false });
          if (!error && Array.isArray(data) && data.length) {
            saveLocal(KEYS.uploads, data);
            return { ok: true, data: data };
          }
        } catch (_) {}
      }
      return { ok: true, data: getLocalStore("uploads") };
    },

    listAttendanceRecords: async function (filters) {
      var client = getSupabaseClient();
      filters = filters || {};

      if (client) {
        try {
          var query = client.from("staff_biometric_attendance").select("*");
          if (filters.date) query = query.eq("attendance_date", filters.date);
          if (filters.startDate) query = query.gte("attendance_date", filters.startDate);
          if (filters.endDate) query = query.lte("attendance_date", filters.endDate);
          if (filters.employeeId && filters.employeeId !== "all") query = query.eq("employee_id", String(filters.employeeId));
          if (filters.department && filters.department !== "all") query = query.eq("department", filters.department);
          if (filters.status && filters.status !== "all") query = query.eq("status", filters.status);
          if (filters.isLateOnly) query = query.eq("is_late", true);

          query = query.order("attendance_date", { ascending: false }).order("employee_id", { ascending: true });

          var { data, error } = await query;
          if (!error && Array.isArray(data) && data.length) {
            return { ok: true, data: data };
          }
        } catch (_) {}
      }

      // Fallback local memory / storage
      var rows = getLocalStore("attendance");
      var filtered = rows.filter(function (r) {
        if (filters.date && r.attendance_date !== filters.date) return false;
        if (filters.startDate && r.attendance_date < filters.startDate) return false;
        if (filters.endDate && r.attendance_date > filters.endDate) return false;
        if (filters.employeeId && filters.employeeId !== "all" && String(r.employee_id) !== String(filters.employeeId)) return false;
        if (filters.department && filters.department !== "all" && r.department !== filters.department) return false;
        if (filters.status && filters.status !== "all" && r.status !== filters.status) return false;
        if (filters.isLateOnly && !r.is_late) return false;
        if (filters.search) {
          var q = String(filters.search).toLowerCase();
          var matchName = String(r.employee_name || "").toLowerCase().includes(q) || String(r.employee_full_name || "").toLowerCase().includes(q);
          var matchId = String(r.employee_id || "").toLowerCase().includes(q);
          var matchDept = String(r.department || "").toLowerCase().includes(q);
          if (!matchName && !matchId && !matchDept) return false;
        }
        return true;
      });

      return { ok: true, data: filtered };
    },

    saveBatchAttendance: async function (records, uploadInfo) {
      if (!Array.isArray(records) || !records.length) {
        return { ok: false, error: "Nenhum registo para gravar" };
      }

      var uploadId = "up-" + Date.now();
      var uploadRecord = Object.assign(
        {
          id: uploadId,
          filename: (uploadInfo && uploadInfo.filename) || "biometric-import.xlsx",
          upload_date: (uploadInfo && uploadInfo.upload_date) || (records[0] && records[0].attendance_date) || new Date().toISOString().slice(0, 10),
          device_create_time: (uploadInfo && uploadInfo.device_create_time) || new Date().toISOString(),
          record_count: records.length,
          present_count: records.filter(function (r) { return r.is_present; }).length,
          on_time_count: records.filter(function (r) { return r.status === "on_time"; }).length,
          grace_count: records.filter(function (r) { return r.status === "grace_period"; }).length,
          late_count: records.filter(function (r) { return r.is_late; }).length,
          absent_count: records.filter(function (r) { return !r.is_present; }).length,
          uploaded_by: (uploadInfo && uploadInfo.uploaded_by) || "Brother Lio",
          created_at: new Date().toISOString(),
        },
        uploadInfo || {}
      );

      var preparedRecords = records.map(function (rec) {
        return Object.assign({}, rec, {
          id: rec.id || "att-" + rec.attendance_date + "-" + rec.employee_id + "-" + Date.now(),
          upload_id: uploadRecord.id,
          updated_at: new Date().toISOString(),
        });
      });

      // Update local storage
      var existingAtt = getLocalStore("attendance");
      var existingUps = getLocalStore("uploads");

      // Merge records by attendance_date and employee_id
      var attMap = {};
      existingAtt.forEach(function (r) {
        attMap[r.attendance_date + "___" + r.employee_id] = r;
      });
      preparedRecords.forEach(function (r) {
        attMap[r.attendance_date + "___" + r.employee_id] = Object.assign({}, attMap[r.attendance_date + "___" + r.employee_id] || {}, r);
      });
      var mergedAtt = Object.values(attMap);
      saveLocal(KEYS.attendance, mergedAtt);

      existingUps.unshift(uploadRecord);
      saveLocal(KEYS.uploads, existingUps);

      // Create workflow submission entry automatically for Brother Lio
      var targetDate = uploadRecord.upload_date;
      await this.submitBatchByLio(targetDate, {
        record_count: uploadRecord.record_count,
        present_count: uploadRecord.present_count,
        on_time_count: uploadRecord.on_time_count,
        grace_count: uploadRecord.grace_count,
        late_count: uploadRecord.late_count,
        absent_count: uploadRecord.absent_count,
      });

      // Remote Supabase write
      var client = getSupabaseClient();
      if (client) {
        try {
          await client.from("staff_attendance_uploads").insert(uploadRecord);
          for (var i = 0; i < preparedRecords.length; i += 50) {
            var chunk = preparedRecords.slice(i, i + 50);
            await client.from("staff_biometric_attendance").upsert(chunk, {
              onConflict: "attendance_date,employee_id",
            });
          }
        } catch (e) {
          console.warn("[CE Attendance] Supabase batch sync error", e);
        }
      }

      return {
        ok: true,
        upload: uploadRecord,
        inserted_count: preparedRecords.length,
      };
    },

    // =========================================================================
    // Pastoral & Executive 3-Step Workflow Pipeline
    // =========================================================================

    listWorkflowSubmissions: async function () {
      var client = getSupabaseClient();
      if (client) {
        try {
          var { data, error } = await client.from("staff_attendance_workflow_submissions").select("*").order("date", { ascending: false });
          if (!error && Array.isArray(data) && data.length) {
            saveLocal(KEYS.submissions, data);
            return { ok: true, data: data };
          }
        } catch (_) {}
      }
      return { ok: true, data: getLocalStore("submissions") };
    },

    getWorkflowSubmissionByDate: async function (dateStr) {
      var res = await this.listWorkflowSubmissions();
      var subs = res.data || [];
      var match = subs.find(function (s) { return s.date === dateStr; });
      return { ok: true, data: match || null };
    },

    submitBatchByLio: async function (dateStr, extraStats) {
      var subs = getLocalStore("submissions");
      var existingIdx = subs.findIndex(function (s) { return s.date === dateStr; });
      var now = new Date().toISOString();

      var entry = Object.assign(
        {
          id: "wf-sub-" + dateStr,
          date: dateStr,
          period_type: "daily",
          title: "Registo Biométrico Diário — " + dateStr,
          group_name: "Paixão à Primeira Vista (Leopold Youngpet & Koutou)",
          extracted_by: "Brother Lio",
          extracted_at: now,
          extraction_status: "Completed",
          pastoral_head: "Pastor Valdemiro",
          pastoral_reviewed_at: null,
          pastoral_status: "Pending",
          pastoral_notes: "",
          overseer_name: "Pastor Kéne",
          overseer_received_at: null,
          overseer_status: "Pending",
          overseer_notes: "",
          status: "submitted_by_lio",
          created_at: now,
          updated_at: now,
        },
        extraStats || {}
      );

      if (existingIdx !== -1) {
        subs[existingIdx] = Object.assign({}, subs[existingIdx], entry, { updated_at: now });
      } else {
        subs.unshift(entry);
      }
      saveLocal(KEYS.submissions, subs);

      var client = getSupabaseClient();
      if (client) {
        try {
          await client.from("staff_attendance_workflow_submissions").upsert(entry);
        } catch (_) {}
      }

      return { ok: true, data: entry };
    },

    forwardToOverseerByValdemiro: async function (submissionIdOrDate, pastoralNotes) {
      var subs = getLocalStore("submissions");
      var idx = subs.findIndex(function (s) {
        return s.id === submissionIdOrDate || s.date === submissionIdOrDate;
      });
      var now = new Date().toISOString();

      if (idx === -1) {
        // Create if missing
        var newSub = {
          id: "wf-sub-" + submissionIdOrDate,
          date: submissionIdOrDate,
          period_type: "daily",
          title: "Registo Biométrico Diário — " + submissionIdOrDate,
          group_name: "Paixão à Primeira Vista (Leopold Youngpet & Koutou)",
          extracted_by: "Brother Lio",
          extracted_at: now,
          extraction_status: "Completed",
          pastoral_head: "Pastor Valdemiro",
          pastoral_reviewed_at: now,
          pastoral_status: "Approved",
          pastoral_notes: pastoralNotes || "Validado pela equipa de Cuidados Pastorais.",
          overseer_name: "Pastor Kéne",
          overseer_received_at: now,
          overseer_status: "Delivered_Main",
          overseer_notes: "",
          status: "delivered_to_kene",
          created_at: now,
          updated_at: now,
        };
        subs.unshift(newSub);
        idx = 0;
      } else {
        subs[idx] = Object.assign({}, subs[idx], {
          pastoral_head: "Pastor Valdemiro",
          pastoral_reviewed_at: now,
          pastoral_status: "Approved",
          pastoral_notes: pastoralNotes || subs[idx].pastoral_notes || "Validado e auditado pelos Cuidados Pastorais.",
          overseer_name: "Pastor Kéne",
          overseer_received_at: now,
          overseer_status: "Delivered_Main",
          status: "delivered_to_kene",
          updated_at: now,
        });
      }

      saveLocal(KEYS.submissions, subs);

      var client = getSupabaseClient();
      if (client) {
        try {
          await client.from("staff_attendance_workflow_submissions").upsert(subs[idx]);
        } catch (_) {}
      }

      return { ok: true, data: subs[idx] };
    },

    acknowledgeByKene: async function (submissionIdOrDate, overseerNotes) {
      var subs = getLocalStore("submissions");
      var idx = subs.findIndex(function (s) {
        return s.id === submissionIdOrDate || s.date === submissionIdOrDate;
      });
      var now = new Date().toISOString();

      if (idx !== -1) {
        subs[idx] = Object.assign({}, subs[idx], {
          overseer_name: "Pastor Kéne",
          overseer_status: "Acknowledged",
          overseer_notes: overseerNotes || "Homologado pelo Pastor do Grupo (Pastor Kéne).",
          status: "delivered_to_kene",
          updated_at: now,
        });
        saveLocal(KEYS.submissions, subs);

        var client = getSupabaseClient();
        if (client) {
          try {
            await client.from("staff_attendance_workflow_submissions").upsert(subs[idx]);
          } catch (_) {}
        }
        return { ok: true, data: subs[idx] };
      }
      return { ok: false, error: "Submissão não encontrada" };
    },

    // =========================================================================
    // Multi-Period Temporal Comparison Engine (Days, Weeks, Months, Years)
    // =========================================================================

    comparePeriods: async function (options) {
      options = options || {};
      var mode = options.mode || "day"; // "day" | "week" | "month" | "year"
      var periodA = options.periodA; // e.g. "2026-07-09", "2026-W28", "2026-07", "2026"
      var periodB = options.periodB; // e.g. "2026-07-08", "2026-W27", "2026-06", "2025"
      var employeeId = options.employeeId || "all";
      var department = options.department || "all";

      var allRes = await this.listAttendanceRecords({
        employeeId: employeeId,
        department: department,
      });
      var all = allRes.data || [];

      function getFilterFn(modeType, periodKey) {
        if (!periodKey) return function () { return false; };
        if (modeType === "day") {
          return function (r) { return r.attendance_date === periodKey; };
        }
        if (modeType === "month") {
          return function (r) { return r.attendance_date.slice(0, 7) === periodKey; };
        }
        if (modeType === "year") {
          return function (r) { return r.attendance_date.slice(0, 4) === periodKey; };
        }
        if (modeType === "week") {
          // periodKey as "YYYY-MM-DD" start date of week
          return function (r) {
            var diff = (new Date(r.attendance_date) - new Date(periodKey)) / (1000 * 60 * 60 * 24);
            return diff >= 0 && diff < 7;
          };
        }
        return function () { return true; };
      }

      var recordsA = all.filter(getFilterFn(mode, periodA));
      var recordsB = all.filter(getFilterFn(mode, periodB));

      function summarizeSet(recList) {
        var total = recList.length;
        var present = recList.filter(function (r) { return r.is_present; }).length;
        var onTime = recList.filter(function (r) { return r.status === "on_time"; }).length;
        var grace = recList.filter(function (r) { return r.status === "grace_period"; }).length;
        var minor = recList.filter(function (r) { return r.status === "minor_delay"; }).length;
        var late = recList.filter(function (r) { return r.status === "late"; }).length;
        var severe = recList.filter(function (r) { return r.status === "severe_delay"; }).length;
        var absent = recList.filter(function (r) { return !r.is_present; }).length;
        var totalDelay = recList.reduce(function (acc, r) { return acc + (r.delay_minutes || 0); }, 0);
        var allLate = minor + late + severe;
        var onTimeRate = total > 0 ? Math.round(((onTime + grace) / total) * 100) : 0;
        var presenceRate = total > 0 ? Math.round((present / total) * 100) : 0;
        var avgDelay = allLate > 0 ? Math.round(totalDelay / allLate) : 0;

        return {
          total: total,
          present: present,
          onTime: onTime,
          grace: grace,
          minor: minor,
          late: late,
          severe: severe,
          allLate: allLate,
          absent: absent,
          totalDelay: totalDelay,
          onTimeRate: onTimeRate,
          presenceRate: presenceRate,
          avgDelay: avgDelay,
          records: recList,
        };
      }

      var statsA = summarizeSet(recordsA);
      var statsB = summarizeSet(recordsB);

      // Compute Deltas (Period A vs Period B: A - B)
      var deltas = {
        presentDelta: statsA.present - statsB.present,
        presenceRateDelta: statsA.presenceRate - statsB.presenceRate,
        onTimeDelta: (statsA.onTime + statsA.grace) - (statsB.onTime + statsB.grace),
        onTimeRateDelta: statsA.onTimeRate - statsB.onTimeRate,
        allLateDelta: statsA.allLate - statsB.allLate,
        absentDelta: statsA.absent - statsB.absent,
        totalDelayDelta: statsA.totalDelay - statsB.totalDelay,
        avgDelayDelta: statsA.avgDelay - statsB.avgDelay,
      };

      // Staff-by-staff comparative matrix
      var staffSet = Array.from(new Set(all.map(function (r) { return r.employee_id; })));
      var staffMatrix = staffSet.map(function (empId) {
        var staffObj = STAFF_LIST.find(function (s) { return s.id === empId; }) || { id: empId, name: empId, fullName: empId, dept: "CESTAFF" };
        var empRecsA = recordsA.filter(function (r) { return r.employee_id === empId; });
        var empRecsB = recordsB.filter(function (r) { return r.employee_id === empId; });

        var sA = summarizeSet(empRecsA);
        var sB = summarizeSet(empRecsB);

        var firstPunchA = empRecsA[0] ? empRecsA[0].check_in : null;
        var firstPunchB = empRecsB[0] ? empRecsB[0].check_in : null;

        var statusA = empRecsA[0] ? empRecsA[0].status : (sA.total ? (sA.onTimeRate >= 80 ? "on_time" : "late") : "no_data");
        var statusB = empRecsB[0] ? empRecsB[0].status : (sB.total ? (sB.onTimeRate >= 80 ? "on_time" : "late") : "no_data");

        // Trend calculation
        var trend = "neutral";
        if (sA.onTimeRate > sB.onTimeRate || (sA.totalDelay < sB.totalDelay && sA.present >= sB.present)) {
          trend = "improved";
        } else if (sA.onTimeRate < sB.onTimeRate || sA.totalDelay > sB.totalDelay) {
          trend = "declined";
        }

        return {
          employee_id: empId,
          employee_name: staffObj.name,
          employee_full_name: staffObj.fullName,
          department: staffObj.dept,
          role: staffObj.role,
          periodA: {
            checkIn: firstPunchA,
            status: statusA,
            delayMins: empRecsA[0] ? empRecsA[0].delay_minutes : sA.totalDelay,
            present: sA.present,
            total: sA.total,
            onTimeRate: sA.onTimeRate,
          },
          periodB: {
            checkIn: firstPunchB,
            status: statusB,
            delayMins: empRecsB[0] ? empRecsB[0].delay_minutes : sB.totalDelay,
            present: sB.present,
            total: sB.total,
            onTimeRate: sB.onTimeRate,
          },
          trend: trend,
          onTimeRateDelta: sA.onTimeRate - sB.onTimeRate,
          delayMinutesDelta: (empRecsA[0]?.delay_minutes || sA.totalDelay) - (empRecsB[0]?.delay_minutes || sB.totalDelay),
        };
      });

      return {
        ok: true,
        mode: mode,
        periodA: periodA,
        periodB: periodB,
        statsA: statsA,
        statsB: statsB,
        deltas: deltas,
        staffMatrix: staffMatrix,
      };
    },

    // =========================================================================
    // Comprehensive Monthly & Daily Reporting Engine
    // =========================================================================

    getComprehensiveMonthlyReport: async function (yearMonth, department, employeeId) {
      yearMonth = yearMonth || "2026-07";
      var res = await this.listAttendanceRecords({
        startDate: yearMonth + "-01",
        endDate: yearMonth + "-31",
        department: department,
        employeeId: employeeId,
      });
      var records = res.data || [];

      var distinctDates = Array.from(new Set(records.map(function (r) { return r.attendance_date; }))).sort();
      var totalLogs = records.length;
      var presentCount = records.filter(function (r) { return r.is_present; }).length;
      var onTimeCount = records.filter(function (r) { return r.status === "on_time"; }).length;
      var graceCount = records.filter(function (r) { return r.status === "grace_period"; }).length;
      var lateCount = records.filter(function (r) { return r.is_late; }).length;
      var absentCount = records.filter(function (r) { return !r.is_present; }).length;
      var totalDelayMinutes = records.reduce(function (acc, r) { return acc + (r.delay_minutes || 0); }, 0);
      var onTimeRate = totalLogs > 0 ? Math.round(((onTimeCount + graceCount) / totalLogs) * 100) : 0;
      var presenceRate = totalLogs > 0 ? Math.round((presentCount / totalLogs) * 100) : 0;

      // Group per employee
      var empMap = {};
      records.forEach(function (r) {
        if (!empMap[r.employee_id]) {
          var staffObj = STAFF_LIST.find(function (s) { return s.id === r.employee_id; }) || {};
          empMap[r.employee_id] = {
            employee_id: r.employee_id,
            employee_name: r.employee_name,
            employee_full_name: staffObj.fullName || r.employee_name,
            department: r.department,
            role: staffObj.role || "Staff",
            totalDays: 0,
            presentDays: 0,
            onTimeDays: 0,
            graceDays: 0,
            lateDays: 0,
            severeLateDays: 0,
            absentDays: 0,
            totalDelayMins: 0,
            checkIns: [],
            dailyLogMap: {},
          };
        }
        var e = empMap[r.employee_id];
        e.totalDays++;
        e.dailyLogMap[r.attendance_date] = r;
        if (r.is_present) e.presentDays++;
        if (r.status === "on_time") e.onTimeDays++;
        if (r.status === "grace_period") e.graceDays++;
        if (r.is_late) {
          e.lateDays++;
          e.totalDelayMins += (r.delay_minutes || 0);
        }
        if (r.status === "severe_delay") e.severeLateDays++;
        if (!r.is_present) e.absentDays++;
        if (r.check_in && r.check_in !== "--:--") {
          var m = parseTimeToMinutes(r.check_in);
          if (m != null) e.checkIns.push(m);
        }
      });

      var employeesList = Object.values(empMap).map(function (e) {
        var rate = e.totalDays > 0 ? Math.round(((e.onTimeDays + e.graceDays) / e.totalDays) * 100) : 0;
        var pRate = e.totalDays > 0 ? Math.round((e.presentDays / e.totalDays) * 100) : 0;
        var avgMins = e.checkIns.length ? Math.round(e.checkIns.reduce(function (a, b) { return a + b; }, 0) / e.checkIns.length) : null;
        return Object.assign({}, e, {
          onTimeRate: rate,
          presenceRate: pRate,
          avgCheckInTime: minutesToTimeStr(avgMins),
          avgDelayMins: e.lateDays > 0 ? Math.round(e.totalDelayMins / e.lateDays) : 0,
        });
      });

      var honorBoard = employeesList.filter(function (e) { return e.onTimeRate >= 80; }).sort(function (a, b) { return b.onTimeRate - a.onTimeRate; });
      var attentionList = employeesList.filter(function (e) { return e.onTimeRate < 60 || e.severeLateDays > 0; }).sort(function (a, b) { return b.totalDelayMins - a.totalDelayMins; });

      return {
        ok: true,
        yearMonth: yearMonth,
        distinctDates: distinctDates,
        totalLogs: totalLogs,
        presentCount: presentCount,
        onTimeCount: onTimeCount,
        graceCount: graceCount,
        lateCount: lateCount,
        absentCount: absentCount,
        totalDelayMinutes: totalDelayMinutes,
        onTimeRate: onTimeRate,
        presenceRate: presenceRate,
        employeesList: employeesList,
        honorBoard: honorBoard,
        attentionList: attentionList,
        records: records,
      };
    },

    getStaffTrajectory: async function (employeeIdOrName, startDate, endDate) {
      var allRes = await this.listAttendanceRecords({
        startDate: startDate,
        endDate: endDate,
      });
      var all = allRes.data || [];
      var needle = String(employeeIdOrName || "").trim().toLowerCase();

      var staffRecords = all.filter(function (r) {
        return String(r.employee_id).toLowerCase() === needle || String(r.employee_name || "").toLowerCase() === needle;
      });

      staffRecords.sort(function (a, b) {
        return b.attendance_date.localeCompare(a.attendance_date);
      });

      var totalRecorded = staffRecords.length;
      var presentCount = staffRecords.filter(function (r) { return r.is_present; }).length;
      var onTimeCount = staffRecords.filter(function (r) { return r.status === "on_time"; }).length;
      var graceCount = staffRecords.filter(function (r) { return r.status === "grace_period"; }).length;
      var lateCount = staffRecords.filter(function (r) { return r.is_late; }).length;
      var absentCount = staffRecords.filter(function (r) { return !r.is_present; }).length;

      var totalDelayMinutes = staffRecords.reduce(function (acc, r) { return acc + (r.delay_minutes || 0); }, 0);
      var avgDelayMinutes = lateCount > 0 ? Math.round(totalDelayMinutes / lateCount) : 0;
      var onTimeRate = totalRecorded > 0 ? Math.round(((onTimeCount + graceCount) / totalRecorded) * 100) : 0;

      var checkInMinutesList = staffRecords
        .filter(function (r) { return r.check_in && r.check_in !== "--:--"; })
        .map(function (r) { return parseTimeToMinutes(r.check_in); })
        .filter(function (m) { return m != null; });

      var avgCheckInMins = checkInMinutesList.length
        ? Math.round(checkInMinutesList.reduce(function (a, b) { return a + b; }, 0) / checkInMinutesList.length)
        : null;

      var staffObj = STAFF_LIST.find(function (s) { return s.id === (staffRecords[0]?.employee_id || employeeIdOrName); }) || {};

      return {
        ok: true,
        employee_id: staffRecords[0] ? staffRecords[0].employee_id : employeeIdOrName,
        employee_name: staffRecords[0] ? staffRecords[0].employee_name : employeeIdOrName,
        employee_full_name: staffObj.fullName || staffRecords[0]?.employee_name || employeeIdOrName,
        department: staffRecords[0] ? staffRecords[0].department : "CESTAFF",
        role: staffObj.role || "Staff",
        totalRecorded: totalRecorded,
        presentCount: presentCount,
        onTimeCount: onTimeCount,
        graceCount: graceCount,
        lateCount: lateCount,
        absentCount: absentCount,
        totalDelayMinutes: totalDelayMinutes,
        avgDelayMinutes: avgDelayMinutes,
        onTimeRate: onTimeRate,
        avgCheckInTime: minutesToTimeStr(avgCheckInMins),
        records: staffRecords,
      };
    },

    getAggregatePeriodStats: async function (startDate, endDate, department) {
      var res = await this.listAttendanceRecords({
        startDate: startDate,
        endDate: endDate,
        department: department,
      });
      var records = res.data || [];

      var distinctDates = Array.from(new Set(records.map(function (r) { return r.attendance_date; }))).sort();
      var distinctEmployees = Array.from(new Set(records.map(function (r) { return r.employee_id; })));

      var totalRecords = records.length;
      var presentRecords = records.filter(function (r) { return r.is_present; });
      var onTimeRecords = records.filter(function (r) { return r.status === "on_time"; });
      var graceRecords = records.filter(function (r) { return r.status === "grace_period"; });
      var minorDelayRecords = records.filter(function (r) { return r.status === "minor_delay"; });
      var lateRecords = records.filter(function (r) { return r.status === "late"; });
      var severeDelayRecords = records.filter(function (r) { return r.status === "severe_delay"; });
      var absentRecords = records.filter(function (r) { return !r.is_present; });

      var totalDelayMinutes = records.reduce(function (acc, r) { return acc + (r.delay_minutes || 0); }, 0);
      var allLateCount = minorDelayRecords.length + lateRecords.length + severeDelayRecords.length;
      var onTimeRate = totalRecords > 0 ? Math.round(((onTimeRecords.length + graceRecords.length) / totalRecords) * 100) : 0;

      var empMap = {};
      records.forEach(function (r) {
        if (!empMap[r.employee_id]) {
          var staffObj = STAFF_LIST.find(function (s) { return s.id === r.employee_id; }) || {};
          empMap[r.employee_id] = {
            employee_id: r.employee_id,
            employee_name: r.employee_name,
            employee_full_name: staffObj.fullName || r.employee_name,
            department: r.department,
            totalDays: 0,
            presentDays: 0,
            onTimeDays: 0,
            graceDays: 0,
            lateDays: 0,
            absentDays: 0,
            totalDelayMins: 0,
            checkIns: [],
          };
        }
        var e = empMap[r.employee_id];
        e.totalDays++;
        if (r.is_present) e.presentDays++;
        if (r.status === "on_time") e.onTimeDays++;
        if (r.status === "grace_period") e.graceDays++;
        if (r.is_late) {
          e.lateDays++;
          e.totalDelayMins += (r.delay_minutes || 0);
        }
        if (!r.is_present) e.absentDays++;
        if (r.check_in && r.check_in !== "--:--") {
          var m = parseTimeToMinutes(r.check_in);
          if (m != null) e.checkIns.push(m);
        }
      });

      var empList = Object.values(empMap).map(function (e) {
        var rate = e.totalDays > 0 ? Math.round(((e.onTimeDays + e.graceDays) / e.totalDays) * 100) : 0;
        var avgMins = e.checkIns.length ? Math.round(e.checkIns.reduce(function (a, b) { return a + b; }, 0) / e.checkIns.length) : null;
        return Object.assign({}, e, {
          onTimeRate: rate,
          avgCheckInTime: minutesToTimeStr(avgMins),
          avgDelayMins: e.lateDays > 0 ? Math.round(e.totalDelayMins / e.lateDays) : 0,
        });
      });

      var topPunctual = empList.slice().sort(function (a, b) {
        if (b.onTimeRate !== a.onTimeRate) return b.onTimeRate - a.onTimeRate;
        return b.presentDays - a.presentDays;
      });

      var topLate = empList.filter(function (e) { return e.lateDays > 0; }).sort(function (a, b) {
        if (b.totalDelayMins !== a.totalDelayMins) return b.totalDelayMins - a.totalDelayMins;
        return b.lateDays - a.lateDays;
      });

      return {
        totalRecords: totalRecords,
        distinctDaysCount: distinctDates.length,
        distinctEmployeesCount: distinctEmployees.length,
        presentCount: presentRecords.length,
        onTimeCount: onTimeRecords.length,
        graceCount: graceRecords.length,
        minorDelayCount: minorDelayRecords.length,
        lateCount: lateRecords.length,
        severeDelayCount: severeDelayRecords.length,
        allLateCount: allLateCount,
        absentCount: absentRecords.length,
        totalDelayMinutes: totalDelayMinutes,
        onTimeRate: onTimeRate,
        topPunctual: topPunctual,
        topLate: topLate,
        employeesList: empList,
        datesList: distinctDates,
        records: records,
      };
    },
  };

  window.CEAttendanceBridge = dataBridge;
  window.CEDataLayer = window.CEDataLayer || {};
  window.CEDataLayer.attendance = dataBridge;
})();
