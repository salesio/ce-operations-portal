/**
 * Staff Biometric Attendance Data Bridge — Dual-write / Supabase / LocalStorage fallback.
 * Christ Embassy Mozambique Operations Portal.
 * Handles biometric device uploads, daily attendance logs, delay calculations,
 * staff trajectory tracking, monthly statistics, and shift configurations.
 */
(function () {
  "use strict";

  var KEYS = {
    attendance: "ce-data-layer:biometric-attendance",
    uploads: "ce-data-layer:attendance-uploads",
    settings: "ce-data-layer:attendance-settings",
  };

  var memory = {
    attendance: null,
    uploads: null,
    settings: null,
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
      uploaded_by: "Admin",
      file_size_bytes: 14500,
      created_at: "2026-07-09T09:40:00Z",
    },
  ];

  var SEED_ATTENDANCE = [
    { id: "att-001", attendance_date: "2026-07-09", employee_id: "1", employee_name: "Leo", card_no: "", department: "CESTAFF", check_in: "08:18", check_out: null, all_punches: "08:18 --:--", status: "minor_delay", delay_minutes: 18, is_late: true, is_present: true, upload_id: "e1111111-1111-4111-8111-111111111101" },
    { id: "att-002", attendance_date: "2026-07-09", employee_id: "2", employee_name: "Marcelo", card_no: "", department: "CESTAFF", check_in: "08:15", check_out: null, all_punches: "08:15 --:--", status: "grace_period", delay_minutes: 15, is_late: false, is_present: true, upload_id: "e1111111-1111-4111-8111-111111111101" },
    { id: "att-003", attendance_date: "2026-07-09", employee_id: "3", employee_name: "Deacon", card_no: "", department: "CESTAFF", check_in: "08:29", check_out: null, all_punches: "08:29 --:--", status: "minor_delay", delay_minutes: 29, is_late: true, is_present: true, upload_id: "e1111111-1111-4111-8111-111111111101" },
    { id: "att-004", attendance_date: "2026-07-09", employee_id: "4", employee_name: "Flavia", card_no: "", department: "CESTAFF", check_in: "08:31", check_out: null, all_punches: "08:31 --:--", status: "late", delay_minutes: 31, is_late: true, is_present: true, upload_id: "e1111111-1111-4111-8111-111111111101" },
    { id: "att-005", attendance_date: "2026-07-09", employee_id: "5", employee_name: "Gil", card_no: "", department: "CESTAFF", check_in: "08:40", check_out: null, all_punches: "08:40 --:--", status: "late", delay_minutes: 40, is_late: true, is_present: true, upload_id: "e1111111-1111-4111-8111-111111111101" },
    { id: "att-006", attendance_date: "2026-07-09", employee_id: "7", employee_name: "Pk", card_no: "0169895558", department: "CESTAFF", check_in: null, check_out: null, all_punches: "--:-- --:--", status: "absent", delay_minutes: 0, is_late: false, is_present: false, upload_id: "e1111111-1111-4111-8111-111111111101" },
    { id: "att-007", attendance_date: "2026-07-09", employee_id: "8", employee_name: "Service", card_no: "0169672262", department: "CESTAFF", check_in: null, check_out: null, all_punches: "--:-- --:--", status: "absent", delay_minutes: 0, is_late: false, is_present: false, upload_id: "e1111111-1111-4111-8111-111111111101" },
    { id: "att-008", attendance_date: "2026-07-09", employee_id: "9", employee_name: "Staff", card_no: "0170207286", department: "CESTAFF", check_in: null, check_out: null, all_punches: "--:-- --:--", status: "absent", delay_minutes: 0, is_late: false, is_present: false, upload_id: "e1111111-1111-4111-8111-111111111101" },
    { id: "att-009", attendance_date: "2026-07-09", employee_id: "10", employee_name: "Valdemiro", card_no: "", department: "CESTAFF", check_in: "08:16", check_out: null, all_punches: "08:16 --:--", status: "minor_delay", delay_minutes: 16, is_late: true, is_present: true, upload_id: "e1111111-1111-4111-8111-111111111101" },
    { id: "att-010", attendance_date: "2026-07-09", employee_id: "11", employee_name: "Janet", card_no: "", department: "CESTAFF", check_in: "09:03", check_out: null, all_punches: "09:03 --:--", status: "severe_delay", delay_minutes: 63, is_late: true, is_present: true, upload_id: "e1111111-1111-4111-8111-111111111101" },
    { id: "att-011", attendance_date: "2026-07-09", employee_id: "13", employee_name: "Pstreina", card_no: "", department: "CESTAFF", check_in: null, check_out: null, all_punches: "--:-- --:--", status: "absent", delay_minutes: 0, is_late: false, is_present: false, upload_id: "e1111111-1111-4111-8111-111111111101" },
    { id: "att-012", attendance_date: "2026-07-09", employee_id: "15", employee_name: "Laiza", card_no: "", department: "CESTAFF", check_in: null, check_out: null, all_punches: "--:-- --:--", status: "absent", delay_minutes: 0, is_late: false, is_present: false, upload_id: "e1111111-1111-4111-8111-111111111101" },
    { id: "att-013", attendance_date: "2026-07-09", employee_id: "2025", employee_name: "Claudina", card_no: "", department: "CESTAFF", check_in: "08:57", check_out: null, all_punches: "08:57 --:--", status: "late", delay_minutes: 57, is_late: true, is_present: true, upload_id: "e1111111-1111-4111-8111-111111111101" },
    { id: "att-014", attendance_date: "2026-07-09", employee_id: "10000013", employee_name: "Eduarda", card_no: "", department: "CESTAFF", check_in: "08:07", check_out: null, all_punches: "08:07 --:--", status: "grace_period", delay_minutes: 7, is_late: false, is_present: true, upload_id: "e1111111-1111-4111-8111-111111111101" },
    { id: "att-015", attendance_date: "2026-07-09", employee_id: "10000014", employee_name: "Angelica", card_no: "", department: "CESTAFF", check_in: "08:15", check_out: null, all_punches: "08:15 --:--", status: "grace_period", delay_minutes: 15, is_late: false, is_present: true, upload_id: "e1111111-1111-4111-8111-111111111101" },
    { id: "att-016", attendance_date: "2026-07-09", employee_id: "10000017", employee_name: "Junia", card_no: "", department: "CESTAFF", check_in: "08:28", check_out: null, all_punches: "08:28 --:--", status: "minor_delay", delay_minutes: 28, is_late: true, is_present: true, upload_id: "e1111111-1111-4111-8111-111111111101" },
    { id: "att-017", attendance_date: "2026-07-09", employee_id: "10000019", employee_name: "Kassandra", card_no: "", department: "CESTAFF", check_in: "08:29", check_out: null, all_punches: "08:29 --:--", status: "minor_delay", delay_minutes: 29, is_late: true, is_present: true, upload_id: "e1111111-1111-4111-8111-111111111101" },
    { id: "att-018", attendance_date: "2026-07-09", employee_id: "10000020", employee_name: "Filipe", card_no: "", department: "CESTAFF", check_in: "07:56", check_out: null, all_punches: "07:56 --:--", status: "on_time", delay_minutes: 0, is_late: false, is_present: true, upload_id: "e1111111-1111-4111-8111-111111111101" },
    { id: "att-019", attendance_date: "2026-07-09", employee_id: "10000021", employee_name: "Virginia", card_no: "", department: "CESTAFF", check_in: "09:20", check_out: null, all_punches: "09:20 --:--", status: "severe_delay", delay_minutes: 80, is_late: true, is_present: true, upload_id: "e1111111-1111-4111-8111-111111111101" },
    { id: "att-020", attendance_date: "2026-07-09", employee_id: "10000022", employee_name: "Kenneth", card_no: "", department: "CESTAFF", check_in: "08:15", check_out: null, all_punches: "08:15 --:--", status: "grace_period", delay_minutes: 15, is_late: false, is_present: true, upload_id: "e1111111-1111-4111-8111-111111111101" },
    { id: "att-021", attendance_date: "2026-07-09", employee_id: "10000023", employee_name: "Salesio", card_no: "", department: "CESTAFF", check_in: null, check_out: null, all_punches: "--:-- --:--", status: "absent", delay_minutes: 0, is_late: false, is_present: false, upload_id: "e1111111-1111-4111-8111-111111111101" },
    { id: "att-022", attendance_date: "2026-07-09", employee_id: "10000024", employee_name: "Protocols", card_no: "1512235212", department: "CESTAFF", check_in: null, check_out: null, all_punches: "--:-- --:--", status: "absent", delay_minutes: 0, is_late: false, is_present: false, upload_id: "e1111111-1111-4111-8111-111111111101" },
  ];

  function loadLocal(key) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      return parsed;
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
          if (filters.employeeId) query = query.eq("employee_id", String(filters.employeeId));
          if (filters.department) query = query.eq("department", filters.department);
          if (filters.status && filters.status !== "all") query = query.eq("status", filters.status);
          if (filters.isLateOnly) query = query.eq("is_late", true);

          query = query.order("attendance_date", { ascending: false }).order("employee_id", { ascending: true });

          var { data, error } = await query;
          if (!error && Array.isArray(data)) {
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
        if (filters.employeeId && String(r.employee_id) !== String(filters.employeeId)) return false;
        if (filters.department && r.department !== filters.department) return false;
        if (filters.status && filters.status !== "all" && r.status !== filters.status) return false;
        if (filters.isLateOnly && !r.is_late) return false;
        if (filters.search) {
          var q = String(filters.search).toLowerCase();
          var matchName = String(r.employee_name || "").toLowerCase().includes(q);
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
          uploaded_by: (uploadInfo && uploadInfo.uploaded_by) || "Admin",
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

      // Remote Supabase write
      var client = getSupabaseClient();
      if (client) {
        try {
          await client.from("staff_attendance_uploads").insert(uploadRecord);
          // Insert / upsert in chunks of 50
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

    updateAttendanceRecord: async function (id, updates) {
      var existingAtt = getLocalStore("attendance");
      var idx = existingAtt.findIndex(function (r) { return r.id === id; });
      if (idx === -1) {
        // Try match by date + employee_id if id differs
        idx = existingAtt.findIndex(function (r) {
          return updates.attendance_date && updates.employee_id && r.attendance_date === updates.attendance_date && r.employee_id === updates.employee_id;
        });
      }

      if (idx !== -1) {
        existingAtt[idx] = Object.assign({}, existingAtt[idx], updates, { updated_at: new Date().toISOString() });
        saveLocal(KEYS.attendance, existingAtt);
      }

      var client = getSupabaseClient();
      if (client) {
        try {
          await client.from("staff_biometric_attendance").update(updates).eq("id", id);
        } catch (_) {}
      }

      return { ok: true, data: idx !== -1 ? existingAtt[idx] : updates };
    },

    deleteAttendanceRecord: async function (id) {
      var existingAtt = getLocalStore("attendance");
      var filtered = existingAtt.filter(function (r) { return r.id !== id; });
      saveLocal(KEYS.attendance, filtered);

      var client = getSupabaseClient();
      if (client) {
        try {
          await client.from("staff_biometric_attendance").delete().eq("id", id);
        } catch (_) {}
      }
      return { ok: true };
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

      // Calculate average check-in time
      var checkInMinutesList = staffRecords
        .filter(function (r) { return r.check_in && r.check_in !== "--:--"; })
        .map(function (r) { return parseTimeToMinutes(r.check_in); })
        .filter(function (m) { return m != null; });

      var avgCheckInMins = checkInMinutesList.length
        ? Math.round(checkInMinutesList.reduce(function (a, b) { return a + b; }, 0) / checkInMinutesList.length)
        : null;

      return {
        ok: true,
        employee_id: staffRecords[0] ? staffRecords[0].employee_id : employeeIdOrName,
        employee_name: staffRecords[0] ? staffRecords[0].employee_name : employeeIdOrName,
        department: staffRecords[0] ? staffRecords[0].department : "CESTAFF",
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

      // Group by employee for rankings
      var empMap = {};
      records.forEach(function (r) {
        if (!empMap[r.employee_id]) {
          empMap[r.employee_id] = {
            employee_id: r.employee_id,
            employee_name: r.employee_name,
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
