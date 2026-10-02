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
    standard_start_time: "08:30",
    standard_end_time: "17:00",
    grace_period_minutes: 0,
    minor_delay_threshold_minutes: 15,
    severe_delay_threshold_minutes: 60,
    working_days: ["mon", "tue", "wed", "thu", "fri"],
    is_active: true,
  };

  var STAFF_LIST = [
    { id: "11", code: "STF-01", name: "Janet", fullName: "Janet Marquel", dept: "CESTAFF", role: "Staff Member", aliases: ["janet", "janet marquel", "janet sitoe"] },
    { id: "1", code: "STF-02", name: "Leo", fullName: "Leopold Kusi", dept: "Paixão à Primeira Vista / CESTAFF", role: "Group Leader", aliases: ["leopold", "leopold kusi", "lio", "brother lio", "brother leo", "leopold youngpet & koutou"] },
    { id: "3", code: "STF-03", name: "Oliver", fullName: "Deacon Oliver", dept: "CESTAFF", role: "Deacon", aliases: ["oliver", "deacon oliver", "dc oliver", "deacon", "deacon rui"] },
    { id: "10000014", code: "STF-04", name: "Angelica", fullName: "Angélica Amílcar", dept: "CESTAFF", role: "Staff Member", aliases: ["angelica", "angélica", "angelica amilcar", "angélica amílcar", "angelica guambe"] },
    { id: "2", code: "STF-05", name: "Marcelo", fullName: "Marcelo Panguene", dept: "CESTAFF", role: "Staff Member", aliases: ["marcelo", "marcelo panguene", "marcelo machava"] },
    { id: "10000013", code: "STF-06", name: "Eduarda", fullName: "Eduarda Paula", dept: "CESTAFF", role: "Staff Member", aliases: ["eduarda", "eduarda paula", "eduarda mondlane"] },
    { id: "5", code: "STF-07", name: "Gil", fullName: "Gilberto Baule", dept: "CESTAFF", role: "Staff Member", aliases: ["gilberto", "gilberto baule", "gil", "gilberto tembe"] },
    { id: "10", code: "STF-08", name: "Valdemiro", fullName: "Pastor Valdemiro", dept: "Cuidados Pastorais", role: "Pastoral Care Head", aliases: ["valdemiro", "pastor valdemiro", "pr valdemiro", "pr. valdemiro"] },
    { id: "10000021", code: "STF-09", name: "Virginia", fullName: "Sis. Virgínia Filipe", dept: "CESTAFF", role: "Staff Member", aliases: ["virginia", "virgínia", "sis virginia", "sis. virgínia", "sis virginia filipe", "sis. virgínia filipe", "virginia filipe", "virgínia filipe", "virginia chissano"] },
    { id: "10000017", code: "STF-10", name: "Junia", fullName: "Junya Clementina", dept: "CESTAFF", role: "Staff Member", aliases: ["junya", "junia", "junya clementina", "junia clementina", "junia macuacua"] },
    { id: "15", code: "STF-11", name: "Laiza", fullName: "Laiza Chirindza", dept: "CESTAFF", role: "Staff Member", aliases: ["laiza", "laiza chirindza", "laiza nhantumbo"] },
    { id: "13", code: "STF-12", name: "Clarissa", fullName: "Pastor Clarissa", dept: "Cuidados Pastorais", role: "Pastor", aliases: ["clarissa", "pastor clarissa", "pr clarissa", "pr. clarissa", "pstreina", "reina", "pastora reina"] },
    { id: "10000019", code: "STF-13", name: "Kassandra", fullName: "Sister Kassandra", dept: "CESTAFF", role: "Staff Member", aliases: ["kassandra", "sister kassandra", "sis kassandra", "sis. kassandra", "kassandra langa"] },
    { id: "10000020", code: "STF-14", name: "Filipe", fullName: "Bro Filipe", dept: "CESTAFF", role: "Staff Member", aliases: ["filipe", "bro filipe", "bro. filipe", "brother filipe", "filipe mabunda"] },
    { id: "2025", code: "STF-15", name: "Claudina", fullName: "Claudina Matsinhe", dept: "CESTAFF", role: "Staff Member", aliases: ["claudina", "claudina matsinhe"] },
  ];

  // Multi-day sample attendance generation helper
  function buildSeedAttendanceData() {
    var records = [];
    var uploadIdBase = "e1111111-1111-4111-8111-1111111111";

    var checkInProfiles = {
      // Live Biometric submission for Today (02/10/2026)
      "2026-10-02": {
        "11": { in: "08:28", out: "17:00", card: "" }, // Janet Marquel (8:28) 🟢 On Time
        "1": { in: "08:30", out: "17:00", card: "" }, // Leopold Kusi (8:30) 🟢 On Time
        "3": { in: "08:35", out: "17:00", card: "" }, // Deacon Oliver (8:35) 🚨 (+5m)
        "10000014": { in: "07:45", out: "17:00", card: "" }, // Angélica Amílcar (7:45) 🟢 On Time
        "2": { in: "07:50", out: "17:00", card: "" }, // Marcelo Panguene (7:50) 🟢 On Time
        "10000013": { in: "08:20", out: "17:00", card: "" }, // Eduarda Paula (8:20) 🟢 On Time
        "5": { in: "08:15", out: "17:00", card: "" }, // Gilberto Baule (8:15) 🟢 On Time
        "10": { in: "08:25", out: "17:00", card: "" }, // Pastor Valdemiro (8:25) 🟢 On Time
        "10000021": { in: "08:42", out: "17:00", card: "" }, // Sis. Virgínia Filipe (8:42) 🚨 (+12m)
        "10000017": { in: "08:30", out: "17:00", card: "" }, // Junya Clementina (8:30) 🟢 On Time
        "15": { in: "08:29", out: "17:00", card: "" }, // Laiza Chirindza (8:29) 🟢 On Time
        "13": { in: "08:10", out: "17:00", card: "" }, // Pastor Clarissa (8:10) 🟢 On Time
        "10000019": { in: "08:15", out: "17:00", card: "" }, // Sister Kassandra (8:15) 🟢 On Time
        "10000020": { in: "08:28", out: "17:00", card: "" }, // Bro Filipe (8:28) 🟢 On Time
        "2025": { in: "08:38", out: "17:00", card: "" }, // Claudina Matsinhe (8:38) 🚨 (+8m)
      },
      // Real submission from WhatsApp on 01/10/2026
      "2026-10-01": {
        "11": { in: "08:30", out: "17:00", card: "" }, // Janet Marquel (8:30) 🟢 On Time
        "1": { in: "08:30", out: "17:00", card: "" }, // Leopold Kusi (8:30) 🟢 On Time
        "3": { in: "08:38", out: "17:00", card: "" }, // Deacon Oliver (8:38) 🚨 (+8m)
        "10000014": { in: "07:43", out: "17:00", card: "" }, // Angélica Amílcar (7:43) 🟢 On Time
        "2": { in: "07:43", out: "17:00", card: "" }, // Marcelo Panguene (7:43) 🟢 On Time
        "10000013": { in: "08:25", out: "17:00", card: "" }, // Eduarda Paula (8:25) 🟢 On Time
        "5": { in: "07:50", out: "17:00", card: "" }, // Gilberto Baule (7:50) 🟢 On Time
        "10": { in: "08:23", out: "17:00", card: "" }, // Pastor Valdemiro (8:23) 🟢 On Time
        "10000021": { in: "08:22", out: "17:00", card: "" }, // Sis. Virgínia Filipe (8:22) 🟢 On Time
        "10000017": { in: "08:49", out: "17:00", card: "" }, // Junya Clementina (8:49) 🚨 (+19m)
        "15": { in: "08:33", out: "17:00", card: "" }, // Laiza Chirindza (8:33) 🚨 (+3m)
        "13": { in: "08:11", out: "17:00", card: "" }, // Pastor Clarissa (8:11) 🟢 On Time
        "10000019": { in: "08:14", out: "17:00", card: "" }, // Sister Kassandra (8:14) 🟢 On Time
        "10000020": { in: "08:30", out: "17:00", card: "" }, // Bro Filipe (8:30) 🟢 On Time
        "2025": { in: "08:25", out: "17:00", card: "" }, // Claudina Matsinhe (8:25) 🟢 On Time
      },
      "2026-07-09": {
        "11": { in: "09:03", out: "17:00", card: "" },
        "1": { in: "08:18", out: "17:05", card: "" },
        "3": { in: "08:29", out: "17:10", card: "" },
        "10000014": { in: "08:15", out: "17:05", card: "" },
        "2": { in: "08:15", out: "17:00", card: "" },
        "10000013": { in: "08:07", out: "17:00", card: "" },
        "5": { in: "08:40", out: "17:30", card: "" },
        "10": { in: "08:16", out: "17:20", card: "" },
        "10000021": { in: "09:20", out: "17:35", card: "" },
        "10000017": { in: "08:28", out: "17:00", card: "" },
        "15": { in: null, out: null, card: "" },
        "13": { in: null, out: null, card: "" },
        "10000019": { in: "08:29", out: "17:10", card: "" },
        "10000020": { in: "07:56", out: "17:00", card: "" },
        "2025": { in: "08:57", out: "17:00", card: "" },
      },
      "2026-07-08": {
        "11": { in: "08:35", out: "17:00", card: "" },
        "1": { in: "08:05", out: "17:10", card: "" },
        "3": { in: "08:12", out: "17:05", card: "" },
        "10000014": { in: "08:10", out: "17:00", card: "" },
        "2": { in: "08:10", out: "17:00", card: "" },
        "10000013": { in: "08:00", out: "17:00", card: "" },
        "5": { in: "08:18", out: "17:00", card: "" },
        "10": { in: "08:08", out: "17:15", card: "" },
        "10000021": { in: "08:45", out: "17:00", card: "" },
        "10000017": { in: "08:15", out: "17:00", card: "" },
        "15": { in: null, out: null, card: "" },
        "13": { in: "08:02", out: "17:00", card: "" },
        "10000019": { in: "08:20", out: "17:00", card: "" },
        "10000020": { in: "07:50", out: "17:00", card: "" },
        "2025": { in: "08:42", out: "17:00", card: "" },
      },
      "2026-07-07": {
        "11": { in: "08:40", out: "17:00", card: "" },
        "1": { in: "07:58", out: "17:10", card: "" },
        "3": { in: "08:14", out: "17:00", card: "" },
        "10000014": { in: "08:05", out: "17:00", card: "" },
        "2": { in: "08:02", out: "17:00", card: "" },
        "10000013": { in: "07:55", out: "17:00", card: "" },
        "5": { in: "08:15", out: "17:00", card: "" },
        "10": { in: "08:00", out: "17:10", card: "" },
        "10000021": { in: "09:05", out: "17:00", card: "" },
        "10000017": { in: "08:10", out: "17:00", card: "" },
        "15": { in: "08:25", out: "17:00", card: "" },
        "13": { in: "08:10", out: "17:00", card: "" },
        "10000019": { in: "08:15", out: "17:00", card: "" },
        "10000020": { in: "07:52", out: "17:00", card: "" },
        "2025": { in: "08:30", out: "17:00", card: "" },
      },
      "2026-07-06": {
        "11": { in: "08:50", out: "17:00", card: "" },
        "1": { in: "08:12", out: "17:00", card: "" },
        "3": { in: "08:19", out: "17:00", card: "" },
        "10000014": { in: "08:12", out: "17:00", card: "" },
        "2": { in: "08:08", out: "17:00", card: "" },
        "10000013": { in: "07:58", out: "17:00", card: "" },
        "5": { in: "08:35", out: "17:00", card: "" },
        "10": { in: "08:04", out: "17:00", card: "" },
        "10000021": { in: "09:10", out: "17:00", card: "" },
        "10000017": { in: "08:18", out: "17:00", card: "" },
        "15": { in: null, out: null, card: "" },
        "13": { in: "08:15", out: "17:00", card: "" },
        "10000019": { in: "08:22", out: "17:00", card: "" },
        "10000020": { in: "07:50", out: "17:00", card: "" },
        "2025": { in: "08:45", out: "17:00", card: "" },
      },
      // June 2026 for month-vs-month comparison
      "2026-06-09": {
        "11": { in: "09:15", out: "17:00", card: "" },
        "1": { in: "08:22", out: "17:00", card: "" },
        "3": { in: "08:35", out: "17:00", card: "" },
        "10000014": { in: "08:18", out: "17:00", card: "" },
        "2": { in: "08:18", out: "17:00", card: "" },
        "10000013": { in: "08:10", out: "17:00", card: "" },
        "5": { in: "08:45", out: "17:00", card: "" },
        "10": { in: "08:20", out: "17:00", card: "" },
        "10000021": { in: "09:30", out: "17:00", card: "" },
        "10000017": { in: "08:30", out: "17:00", card: "" },
        "15": { in: null, out: null, card: "" },
        "13": { in: null, out: null, card: "" },
        "10000019": { in: "08:35", out: "17:00", card: "" },
        "10000020": { in: "08:00", out: "17:00", card: "" },
        "2025": { in: "09:05", out: "17:00", card: "" },
      },
      // July 2025 for year-vs-year comparison
      "2025-07-09": {
        "11": { in: "09:20", out: "17:00", card: "" },
        "1": { in: "08:25", out: "17:00", card: "" },
        "3": { in: "08:40", out: "17:00", card: "" },
        "10000014": { in: "08:22", out: "17:00", card: "" },
        "2": { in: "08:20", out: "17:00", card: "" },
        "10000013": { in: "08:15", out: "17:00", card: "" },
        "5": { in: "08:50", out: "17:00", card: "" },
        "10": { in: "08:25", out: "17:00", card: "" },
        "10000021": { in: "09:40", out: "17:00", card: "" },
        "10000017": { in: "08:35", out: "17:00", card: "" },
        "15": { in: null, out: null, card: "" },
        "13": { in: null, out: null, card: "" },
        "10000019": { in: "08:40", out: "17:00", card: "" },
        "10000020": { in: "08:05", out: "17:00", card: "" },
        "2025": { in: "09:10", out: "17:00", card: "" },
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
          employee_name: staff.fullName || staff.name,
          employee_full_name: staff.fullName || staff.name,
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
      id: "e1111111-1111-4111-8111-111111111100",
      filename: "Attendance_Record_20261002.xlsx",
      upload_date: "2026-10-02",
      device_create_time: "2026-10-02 09:00:00",
      record_count: 15,
      present_count: 15,
      on_time_count: 12,
      grace_count: 0,
      late_count: 3,
      absent_count: 0,
      uploaded_by: "Brother Lio",
      file_size_bytes: 14500,
      created_at: "2026-10-02T09:00:00Z",
    },
    {
      id: "e1111111-1111-4111-8111-111111111104",
      filename: "Attendance_Record_20261001.xlsx",
      upload_date: "2026-10-01",
      device_create_time: "2026-10-01 09:00:00",
      record_count: 15,
      present_count: 15,
      on_time_count: 12,
      grace_count: 0,
      late_count: 3,
      absent_count: 0,
      uploaded_by: "Brother Lio",
      file_size_bytes: 14500,
      created_at: "2026-10-01T09:00:00Z",
    },
    {
      id: "e1111111-1111-4111-8111-111111111101",
      filename: "Attendance_Record_20260709.xlsx",
      upload_date: "2026-07-09",
      device_create_time: "2026-07-09 09:39:33",
      record_count: 15,
      present_count: 13,
      on_time_count: 9,
      grace_count: 0,
      late_count: 4,
      absent_count: 2,
      uploaded_by: "Brother Lio",
      file_size_bytes: 14500,
      created_at: "2026-07-09T09:40:00Z",
    },
    {
      id: "e1111111-1111-4111-8111-111111111102",
      filename: "Attendance_Record_20260708.xlsx",
      upload_date: "2026-07-08",
      device_create_time: "2026-07-08 09:35:10",
      record_count: 15,
      present_count: 14,
      on_time_count: 11,
      grace_count: 0,
      late_count: 3,
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
      record_count: 15,
      present_count: 15,
      on_time_count: 13,
      grace_count: 0,
      late_count: 2,
      absent_count: 0,
      uploaded_by: "Brother Lio",
      file_size_bytes: 14100,
      created_at: "2026-07-07T09:31:00Z",
    },
  ];

  var SEED_WORKFLOW_SUBMISSIONS = [
    {
      id: "wf-sub-2026-10-02",
      date: "2026-10-02",
      period_type: "daily",
      title: "Registo Biométrico Diário — 02 de Outubro de 2026",
      group_name: "Paixão à Primeira Vista (Leopold Youngpet & Koutou)",
      extracted_by: "Brother Lio",
      extracted_at: "2026-10-02T09:00:00Z",
      extraction_status: "Completed",
      
      // Step 2: Pastoral Care Head Review
      pastoral_head: "Pastor Valdemiro",
      pastoral_reviewed_at: "2026-10-02T09:30:00Z",
      pastoral_status: "Approved",
      pastoral_notes: "Picagens auditadas pelo Departamento de Cuidados Pastorais. Horário oficial de entrada: 08:30. Relatório de 02/10/2026 validado com sucesso.",
      
      // Step 3: Group Pastor / Overall Overseer
      overseer_name: "Pastor Kéne",
      overseer_received_at: "2026-10-02T09:45:00Z",
      overseer_status: "Delivered_Main",
      overseer_notes: "Homologado no Painel Geral da Igreja (MAIN).",
      
      record_count: 15,
      present_count: 15,
      on_time_count: 12,
      grace_count: 0,
      late_count: 3,
      absent_count: 0,
      total_delay_minutes: 25,
      status: "delivered_to_kene",
      created_at: "2026-10-02T09:00:00Z",
      updated_at: "2026-10-02T09:45:00Z",
    },
    {
      id: "wf-sub-2026-10-01",
      date: "2026-10-01",
      period_type: "daily",
      title: "Registo Biométrico Diário — 01 de Outubro de 2026",
      group_name: "Paixão à Primeira Vista (Leopold Youngpet & Koutou)",
      extracted_by: "Brother Lio",
      extracted_at: "2026-10-01T09:00:00Z",
      extraction_status: "Completed",
      
      // Step 2: Pastoral Care Head Review
      pastoral_head: "Pastor Valdemiro",
      pastoral_reviewed_at: "2026-10-01T09:30:00Z",
      pastoral_status: "Approved",
      pastoral_notes: "Dados conferidos e auditados pelo Departamento de Cuidados Pastorais. Horário base 08:30. Relatório de 01/10/2026 validado.",
      
      // Step 3: Group Pastor / Overall Overseer
      overseer_name: "Pastor Kéne",
      overseer_received_at: "2026-10-01T09:45:00Z",
      overseer_status: "Delivered_Main",
      overseer_notes: "Homologado no Painel Geral da Igreja (MAIN).",
      
      record_count: 15,
      present_count: 15,
      on_time_count: 12,
      grace_count: 0,
      late_count: 3,
      absent_count: 0,
      total_delay_minutes: 30,
      status: "delivered_to_kene",
      created_at: "2026-10-01T09:00:00Z",
      updated_at: "2026-10-01T09:45:00Z",
    },
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
      
      record_count: 15,
      present_count: 13,
      on_time_count: 9,
      grace_count: 0,
      late_count: 4,
      absent_count: 2,
      total_delay_minutes: 120,
      status: "delivered_to_kene",
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
      pastoral_notes: "Excelente índice de comparência geral (93%). Horário base 08:30.",
      
      overseer_name: "Pastor Kéne",
      overseer_received_at: "2026-07-08T10:20:00Z",
      overseer_status: "Delivered_Main",
      overseer_notes: "Homologado no Painel Geral da Igreja.",
      
      record_count: 15,
      present_count: 14,
      on_time_count: 11,
      grace_count: 0,
      late_count: 3,
      absent_count: 1,
      total_delay_minutes: 32,
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
    if (kind === "attendance" || kind === "records") {
      var cached = loadLocal(KEYS.attendance);
      var validStaffIds = new Set(STAFF_LIST.map(function (s) { return String(s.id); }));
      var set = getLocalStore("settings") || DEFAULT_SETTINGS;

      if (!cached || !Array.isArray(cached) || !cached.length) {
        cached = SEED_ATTENDANCE.map(function (x) {
          return Object.assign({}, x);
        });
        saveLocal(KEYS.attendance, cached);
      } else {
        var updated = false;
        var initialCount = cached.length;

        // 1. Purge all records belonging to non-submitting accounts (Salesio, Pastor Kene, Service, Protocols, Flavia, etc.)
        cached = cached.filter(function (r) {
          var idStr = String(r.employee_id || "");
          if (!validStaffIds.has(idStr)) return false;
          var nm = String(r.employee_name || "").toLowerCase();
          var fnm = String(r.employee_full_name || "").toLowerCase();
          if (nm.includes("salesio") || fnm.includes("salesio") ||
              nm.includes("kene") || fnm.includes("kene") ||
              nm.includes("kenneth") || fnm.includes("kenneth") ||
              nm.includes("service team") || fnm.includes("service team") ||
              nm.includes("staff central") || fnm.includes("staff central") ||
              nm.includes("protocolos") || fnm.includes("protocolos")) {
            return false;
          }
          return true;
        });

        if (cached.length !== initialCount) {
          updated = true;
        }

        // Ensure all default seed records (e.g. 2026-10-01, 2026-10-02) exist and have accurate punch data & official full names
        var attMap = {};
        var staffMap = {};
        STAFF_LIST.forEach(function (s) {
          staffMap[String(s.id)] = s;
          if (s.code) staffMap[String(s.code)] = s;
        });

        cached.forEach(function (r) {
          if (r.attendance_date && r.employee_id) {
            attMap[r.attendance_date + "___" + String(r.employee_id)] = r;
          }
          // Ensure official full name is populated
          var st = staffMap[String(r.employee_id)] || matchStaffByName(r.employee_full_name || r.employee_name, STAFF_LIST);
          if (st && st.fullName && (r.employee_name !== st.fullName || r.employee_full_name !== st.fullName)) {
            r.employee_name = st.fullName;
            r.employee_full_name = st.fullName;
            if (!r.department || r.department === "CESTAFF") r.department = st.dept;
            if (!r.role || r.role === "Staff Member") r.role = st.role;
            updated = true;
          }

          // Re-calculate punctuality strictly according to the 08:30 baseline
          if (r.check_in && r.check_in !== "--:--") {
            var punc = calculatePunctualityStatus(r.check_in, set);
            if (r.status !== punc.status || r.delay_minutes !== punc.delay_minutes || r.is_late !== punc.is_late || r.is_present !== punc.is_present) {
              r.status = punc.status;
              r.delay_minutes = punc.delay_minutes;
              r.is_late = punc.is_late;
              r.is_present = punc.is_present;
              updated = true;
            }
          }
        });

        SEED_ATTENDANCE.forEach(function (seed) {
          var key = seed.attendance_date + "___" + String(seed.employee_id);
          var existing = attMap[key];
          if (!existing) {
            cached.push(Object.assign({}, seed));
            attMap[key] = seed;
            updated = true;
          } else if (!existing.check_in && seed.check_in) {
            // Upgrade previously empty/unrecorded placeholder with accurate seed punch
            Object.assign(existing, {
              check_in: seed.check_in,
              check_out: seed.check_out,
              all_punches: seed.all_punches,
              status: seed.status,
              delay_minutes: seed.delay_minutes,
              is_late: seed.is_late,
              is_present: seed.is_present,
              employee_name: seed.employee_name,
              employee_full_name: seed.employee_full_name,
            });
            updated = true;
          }
        });
        if (updated) {
          saveLocal(KEYS.attendance, cached);
        }
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
      if (!cachedSet || typeof cachedSet !== "object" || cachedSet.standard_start_time === "08:00") {
        cachedSet = Object.assign({}, DEFAULT_SETTINGS, cachedSet || {}, {
          standard_start_time: "08:30",
          grace_period_minutes: 0,
        });
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
      } else {
        var existingSubKeys = {};
        var subUpdated = false;
        cachedSub.forEach(function (s) {
          if (s.date) existingSubKeys[s.date] = true;
        });
        SEED_WORKFLOW_SUBMISSIONS.forEach(function (sub) {
          if (!existingSubKeys[sub.date]) {
            cachedSub.unshift(Object.assign({}, sub));
            existingSubKeys[sub.date] = true;
            subUpdated = true;
          }
        });
        if (subUpdated) {
          saveLocal(KEYS.submissions, cachedSub);
        }
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
    var targetMins = parseTimeToMinutes(set.standard_start_time) || 510; // 08:30 default (510 mins)
    var grace = Number(set.grace_period_minutes) || 0;
    var minorThresh = Number(set.minor_delay_threshold_minutes) || 15;
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

    // Arrival on or before standard arrival time (<= 08:30) is On Time
    if (diff <= 0) {
      return {
        status: "on_time",
        delay_minutes: 0,
        is_late: false,
        is_present: true,
        label_pt: "No Horário",
        label_en: "On Time",
        badge_class: "badge-soft-success text-success",
      };
    }

    if (grace > 0 && diff <= grace) {
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

  function normalizeNameForMatching(str) {
    if (!str) return "";
    return String(str)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/^(pastor|pastora|pr\.|pr|sis\.|sis|sister|bro\.|bro|brother|deacon|dc\.|ir\.|irmao|irma)\s+/i, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function getStaffListSync() {
    return STAFF_LIST;
  }

  function matchStaffByName(candidateName, staffList) {
    if (!candidateName) return null;
    var list = staffList || getStaffListSync();
    var cleanCand = normalizeNameForMatching(candidateName);
    var rawCand = String(candidateName).toLowerCase().trim();

    // 1. Direct exact alias or full name match
    for (var i = 0; i < list.length; i++) {
      var s = list[i];
      var sNorm = normalizeNameForMatching(s.fullName || s.name);
      if (sNorm === cleanCand || (s.fullName && s.fullName.toLowerCase() === rawCand) || (s.name && s.name.toLowerCase() === rawCand)) {
        return s;
      }
      if (s.aliases && Array.isArray(s.aliases)) {
        for (var a = 0; a < s.aliases.length; a++) {
          if (normalizeNameForMatching(s.aliases[a]) === cleanCand || s.aliases[a].toLowerCase() === rawCand) {
            return s;
          }
        }
      }
    }

    // 2. Token inclusion match
    var candTokens = cleanCand.split(" ").filter(Boolean);
    for (var j = 0; j < list.length; j++) {
      var st = list[j];
      var stNorm = normalizeNameForMatching(st.fullName || st.name);
      var stTokens = stNorm.split(" ").filter(Boolean);
      
      var matchesAll = candTokens.length > 0 && candTokens.every(function (t) {
        return stTokens.some(function (stk) { return stk === t || stk.startsWith(t) || t.startsWith(stk); });
      });
      if (matchesAll) return st;

      if (candTokens[0] && stTokens[0] && (candTokens[0] === stTokens[0] || candTokens[0] === st.name.toLowerCase())) {
        return st;
      }
    }

    return null;
  }

  function parseWhatsAppAttendanceText(rawText, fallbackDate, customSettings) {
    if (!rawText || typeof rawText !== "string") {
      return { ok: false, error: "Texto vazio fornecido." };
    }

    var settings = Object.assign({}, DEFAULT_SETTINGS, customSettings || {});
    var lines = rawText.split(/\r?\n/);
    var detectedDate = fallbackDate || new Date().toISOString().slice(0, 10);

    // Look for date in header or lines (e.g., 01/10/2026, 01-10-2026, 2026-10-01)
    for (var l = 0; l < Math.min(10, lines.length); l++) {
      var line = lines[l];
      var dMatch = line.match(/\b(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{2,4})\b/);
      if (dMatch) {
        var day = String(dMatch[1]).padStart(2, "0");
        var month = String(dMatch[2]).padStart(2, "0");
        var year = dMatch[3].length === 2 ? "20" + dMatch[3] : dMatch[3];
        detectedDate = year + "-" + month + "-" + day;
        break;
      }
      var isoMatch = line.match(/\b(\d{4})[\/\.-](\d{1,2})[\/\.-](\d{1,2})\b/);
      if (isoMatch) {
        detectedDate = isoMatch[1] + "-" + String(isoMatch[2]).padStart(2, "0") + "-" + String(isoMatch[3]).padStart(2, "0");
        break;
      }
    }

    var staffList = getStaffListSync();
    var records = [];

    lines.forEach(function (line) {
      var trimmed = line.trim();
      if (!trimmed) return;
      if (/^(relat[oó]rio|nome:|hora da chegada|thank you|obrigado|pastor sir|that's what|data:|chegadas)/i.test(trimmed)) {
        return;
      }

      var timeMatch = trimmed.match(/(?:\(|\b)(\d{1,2})[:hH\.](\d{2})(?:\)|\b)?/);
      var checkIn = null;
      if (timeMatch) {
        var hrs = String(timeMatch[1]).padStart(2, "0");
        var mins = String(timeMatch[2]).padStart(2, "0");
        checkIn = hrs + ":" + mins;
      }

      var isSiren = /[🚨🔴⏰⚠️]/.test(trimmed) || /atrasad[oa]|late/i.test(trimmed);

      var cleanName = trimmed
        .replace(/^\s*(?:\d+[\.\)\-:]*|[-*•])\s*/, "")
        .replace(/(?:\(|\b)\d{1,2}[:hH\.]\d{2}(?:\)|\b)?/g, "")
        .replace(/[🟢✅👍🚨🔴⏰⚠️❌⛔]/g, "")
        .replace(/\s+/g, " ")
        .trim();

      if (!cleanName || cleanName.length < 2) return;

      var matchedStaff = matchStaffByName(cleanName, staffList);
      var staffId = matchedStaff ? matchedStaff.id : "manual-" + cleanName.toLowerCase().replace(/[^a-z0-9]/g, "-");
      var staffFullName = matchedStaff ? (matchedStaff.fullName || matchedStaff.name) : cleanName;
      var staffName = staffFullName;
      var dept = matchedStaff ? (matchedStaff.dept || matchedStaff.department || "CESTAFF") : "CESTAFF";
      var role = matchedStaff ? (matchedStaff.role || matchedStaff.role_title || "Staff Member") : "Staff Member";

      var punct = checkIn ? calculatePunctualityStatus(checkIn, settings) : {
        status: "absent",
        delay_minutes: 0,
        is_late: isSiren,
        is_present: false,
        label_pt: isSiren ? "Atrasado / Sem Picagem" : "Sem Registo",
        label_en: isSiren ? "Late / No Punch" : "No Punch",
        badge_class: "badge-soft-secondary text-secondary",
      };

      records.push({
        id: "att-" + detectedDate.replace(/-/g, "") + "-" + staffId,
        attendance_date: detectedDate,
        employee_id: staffId,
        employee_name: staffName,
        employee_full_name: staffFullName,
        department: dept,
        role: role,
        check_in: checkIn,
        check_out: checkIn ? "17:00" : null,
        all_punches: checkIn ? checkIn + " 17:00" : "--:-- --:--",
        status: punct.status,
        delay_minutes: punct.delay_minutes,
        is_late: punct.is_late,
        is_present: punct.is_present,
        raw_line: trimmed,
        matched: Boolean(matchedStaff),
      });
    });

    return {
      ok: true,
      attendance_date: detectedDate,
      record_count: records.length,
      records: records,
      present_count: records.filter(function (r) { return r.is_present; }).length,
      on_time_count: records.filter(function (r) { return r.status === "on_time"; }).length,
      grace_count: records.filter(function (r) { return r.status === "grace_period"; }).length,
      late_count: records.filter(function (r) { return r.is_late; }).length,
      absent_count: records.filter(function (r) { return !r.is_present; }).length,
    };
  }

  function resolveOfficialStaffName(recOrIdOrName, fallback) {
    if (!recOrIdOrName && !fallback) return "Colaborador";
    var staffList = getStaffListSync();

    // If it's an object record
    if (typeof recOrIdOrName === "object" && recOrIdOrName !== null) {
      var rec = recOrIdOrName;
      if (rec.employee_id) {
        var byId = staffList.find(function (s) { return String(s.id) === String(rec.employee_id); });
        if (byId && byId.fullName) return byId.fullName;
      }
      if (rec.employee_full_name && rec.employee_full_name.includes(" ") && rec.employee_full_name.length > 3) {
        return rec.employee_full_name;
      }
      var nameCand = rec.employee_full_name || rec.employee_name || fallback || "";
      var matched = matchStaffByName(nameCand, staffList);
      if (matched && matched.fullName) return matched.fullName;
      return nameCand || fallback || "Colaborador";
    }

    // If it's a string (ID or Name)
    var str = String(recOrIdOrName || fallback || "").trim();
    var byIdDirect = staffList.find(function (s) { return String(s.id) === str; });
    if (byIdDirect && byIdDirect.fullName) return byIdDirect.fullName;

    var matchedStr = matchStaffByName(str, staffList);
    if (matchedStr && matchedStr.fullName) return matchedStr.fullName;

    return str || fallback || "Colaborador";
  }

  var dataBridge = {
    STAFF_LIST: STAFF_LIST,
    getStaffListSync: getStaffListSync,
    resolveOfficialStaffName: resolveOfficialStaffName,
    getStaffList: async function () {
      return STAFF_LIST;
    },
    calculatePunctualityStatus: calculatePunctualityStatus,
    parseTimeToMinutes: parseTimeToMinutes,
    minutesToTimeStr: minutesToTimeStr,
    normalizeNameForMatching: normalizeNameForMatching,
    matchStaffByName: matchStaffByName,
    parseWhatsAppAttendanceText: parseWhatsAppAttendanceText,
    getLocalStore: getLocalStore,
    saveLocal: saveLocal,
    KEYS: KEYS,

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
            var sRemote = getLocalStore("settings") || DEFAULT_SETTINGS;
            var normalizedRemote = data.map(function (r) {
              if (r.check_in && r.check_in !== "--:--") {
                var p = calculatePunctualityStatus(r.check_in, sRemote);
                return Object.assign({}, r, {
                  status: p.status,
                  delay_minutes: p.delay_minutes,
                  is_late: p.is_late,
                  is_present: p.is_present,
                });
              }
              return r;
            });
            return { ok: true, data: normalizedRemote };
          }
        } catch (_) {}
      }

      // Fallback local memory / storage
      var rows = getLocalStore("attendance");
      var sLocal = getLocalStore("settings") || DEFAULT_SETTINGS;
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

      var normalizedFiltered = filtered.map(function (r) {
        if (r.check_in && r.check_in !== "--:--") {
          var punc = calculatePunctualityStatus(r.check_in, sLocal);
          return Object.assign({}, r, {
            status: punc.status,
            delay_minutes: punc.delay_minutes,
            is_late: punc.is_late,
            is_present: punc.is_present,
          });
        }
        return r;
      });

      return { ok: true, data: normalizedFiltered };
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

      var buckets = {
        before_8_30: 0,
        minor_8_45: 0,
        late_9_00: 0,
        late_9_30: 0,
        severe_after_9_30: 0,
        before_8: 0,
        grace_8_15: 0,
        minor_8_30: 0,
        severe_after_9: 0,
      };

      records.forEach(function (r) {
        if (r.check_in && r.check_in !== "--:--") {
          var m = parseTimeToMinutes(r.check_in);
          if (m != null) {
            if (m <= 510) {
              buckets.before_8_30++;
              buckets.before_8++;
            } else if (m <= 525) {
              buckets.minor_8_45++;
              buckets.grace_8_15++;
            } else if (m <= 540) {
              buckets.late_9_00++;
              buckets.minor_8_30++;
            } else if (m <= 570) {
              buckets.late_9_30++;
            } else {
              buckets.severe_after_9_30++;
              buckets.severe_after_9++;
            }
          }
        }
      });

      return {
        ok: true,
        yearMonth: yearMonth,
        distinctDates: distinctDates,
        totalLogs: totalLogs,
        presentCount: presentCount,
        totalRecords: totalLogs,
        onTimeCount: onTimeCount,
        graceCount: graceCount,
        lateCount: lateCount,
        allLateCount: lateCount,
        absentCount: absentCount,
        totalDelayMinutes: totalDelayMinutes,
        onTimeRate: onTimeRate,
        presenceRate: presenceRate,
        distinctEmployeesCount: employeesList.length,
        distinctDaysCount: distinctDates.length,
        employeesList: employeesList,
        honorBoard: honorBoard,
        topPunctual: honorBoard,
        attentionList: attentionList,
        topLate: attentionList,
        buckets: buckets,
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

      var staffList = getStaffListSync();
      var targetStaff = staffList.find(function (s) {
        if (String(s.id).toLowerCase() === needle) return true;
        if (String(s.code || "").toLowerCase() === needle) return true;
        if (String(s.name || "").toLowerCase() === needle) return true;
        if (String(s.fullName || "").toLowerCase() === needle) return true;
        if (s.aliases && Array.isArray(s.aliases)) {
          return s.aliases.some(function (a) { return a.toLowerCase() === needle; });
        }
        return false;
      });

      var staffRecords = all.filter(function (r) {
        var rId = String(r.employee_id || "").toLowerCase();
        var rName = String(r.employee_name || "").toLowerCase();
        var rFullName = String(r.employee_full_name || "").toLowerCase();

        if (rId === needle || rName === needle || rFullName === needle) return true;
        if (targetStaff) {
          if (rId === String(targetStaff.id).toLowerCase() || rId === String(targetStaff.code || "").toLowerCase()) return true;
          if (rName === String(targetStaff.name || "").toLowerCase() || rFullName === String(targetStaff.fullName || "").toLowerCase()) return true;
          if (targetStaff.aliases && Array.isArray(targetStaff.aliases)) {
            var matchAlias = targetStaff.aliases.some(function (a) {
              return rName.includes(a) || a.includes(rName) || rFullName.includes(a);
            });
            if (matchAlias) return true;
          }
        }
        return false;
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

      var finalEmpId = targetStaff ? targetStaff.id : (staffRecords[0] ? staffRecords[0].employee_id : employeeIdOrName);
      var finalEmpName = targetStaff ? targetStaff.name : (staffRecords[0] ? staffRecords[0].employee_name : employeeIdOrName);
      var finalEmpFullName = targetStaff ? targetStaff.fullName : (staffRecords[0]?.employee_full_name || finalEmpName);
      var finalDept = targetStaff ? targetStaff.dept : (staffRecords[0]?.department || "CESTAFF");
      var finalRole = targetStaff ? targetStaff.role : "Staff Member";

      return {
        ok: true,
        employee_id: finalEmpId,
        employee_name: finalEmpName,
        employee_full_name: finalEmpFullName,
        department: finalDept,
        role: finalRole,
        totalRecorded: totalRecorded,
        presentCount: presentCount,
        onTimeCount: onTimeCount,
        graceCount: graceCount,
        lateCount: lateCount,
        absentCount: absentCount,
        totalDelayMinutes: totalDelayMinutes,
        avgDelayMinutes: avgDelayMinutes,
        onTimeRate: onTimeRate,
        avgCheckInTime: minutesToTimeStr(avgCheckInMins) || "--:--",
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
  window.resolveOfficialStaffName = resolveOfficialStaffName;
  window.resolveStaffFullName = resolveOfficialStaffName;
  window.CEDataLayer = window.CEDataLayer || {};
  window.CEDataLayer.attendance = dataBridge;
})();
