/**
 * Staff Biometric Attendance Module — UI, Parser, Temporal Comparisons,
 * Pastoral Executive Workflow & Comprehensive Monthly Reporting
 * Christ Embassy Mozambique Operations Portal
 * Full Bilingual (PT/EN) & High-Contrast Dark Glass / Light UI
 */
(function () {
  "use strict";

  var getTodayStr = function () {
    try {
      var d = new Date();
      if (!isNaN(d.getTime())) {
        var y = d.getFullYear();
        var m = String(d.getMonth() + 1).padStart(2, "0");
        var day = String(d.getDate()).padStart(2, "0");
        return y + "-" + m + "-" + day;
      }
    } catch (_) {}
    return "2026-10-02";
  };

  var todayDateStr = getTodayStr();

  var attendancePageState = {
    tab: "daily", // "daily" | "manual" | "comparison" | "monthly" | "trajectory" | "workflow" | "upload" | "reports" | "settings"
    selectedDate: todayDateStr,
    dailyFilter: "all", // "all" | "on_time" | "grace_period" | "minor_delay" | "late" | "severe_delay" | "late_all" | "absent"
    searchQuery: "",
    selectedDepartment: "all",
    // Manual & WhatsApp entry state
    manualEntryMode: "whatsapp", // "whatsapp" | "grid"
    manualParsedPreview: null,
    manualGridDate: todayDateStr,
    // Comparison tab state
    comparisonMode: "day", // "day" | "week" | "month" | "year"
    comparisonPeriodA: todayDateStr,
    comparisonPeriodB: "2026-10-01",
    comparisonEmployeeId: "all",
    comparisonDepartment: "all",
    // Monthly tab state
    monthlyPeriod: "this_month", // "this_month" | "last_month" | "3_months" | "6_months" | "year" | "custom"
    monthlySelectedMonth: todayDateStr.slice(0, 7),
    startDate: todayDateStr.slice(0, 7) + "-01",
    endDate: todayDateStr,
    // Trajectory & Workflow state
    selectedStaffId: "11",
    workflowSelectedDate: todayDateStr,
    trajectoryRange: "1_month",
    uploadPreview: null,
    uploadFileName: "",
    uploadFileStats: null,
    uploadCreateTime: "",
    cardFilters: {},
  };

  window.attendancePageState = attendancePageState;

  function isEn() {
    var lang = window.lang || localStorage.getItem("ce_lang") || localStorage.getItem("ce-dashboard-lang") || (document.documentElement ? document.documentElement.lang : "pt");
    return String(lang).toLowerCase() === "en";
  }

  function t(ptText, enText) {
    return isEn() ? enText : ptText;
  }

  function getBridge() {
    return window.CEAttendanceBridge || window.CEDataLayer?.attendance;
  }

  function resolveStaffFullName(recOrIdOrName, fallback) {
    var bridge = getBridge();
    if (bridge && typeof bridge.resolveOfficialStaffName === "function") {
      return bridge.resolveOfficialStaffName(recOrIdOrName, fallback);
    }
    if (window.resolveOfficialStaffName) {
      return window.resolveOfficialStaffName(recOrIdOrName, fallback);
    }
    if (typeof recOrIdOrName === "object" && recOrIdOrName !== null) {
      return recOrIdOrName.employee_full_name || recOrIdOrName.employee_name || fallback || "Colaborador";
    }
    return String(recOrIdOrName || fallback || "Colaborador");
  }

  // Format minutes delay
  function formatDelay(minutes) {
    if (!minutes || minutes <= 0) {
      return `<span class="text-success fw-semibold"><i class="bi bi-check-circle me-1"></i>${t("No Horário", "On Time")}</span>`;
    }
    var h = Math.floor(minutes / 60);
    var m = minutes % 60;
    var str = h > 0 ? `+${h}h ${m > 0 ? m + "m" : ""}` : `+${m} min`;
    if (minutes <= 15) return `<span class="text-info fw-semibold">${str}</span>`;
    if (minutes <= 30) return `<span class="text-warning fw-semibold">${str}</span>`;
    return `<span class="text-danger fw-bold"><i class="bi bi-exclamation-triangle-fill me-1"></i>${str}</span>`;
  }

  function getStatusBadge(status, delayMins) {
    switch (status) {
      case "on_time":
        return `<span class="badge rounded-pill bg-success-subtle text-success border border-success border-opacity-25 px-2 py-1"><i class="bi bi-check-circle-fill me-1"></i>${t("Pontual", "On Time")}</span>`;
      case "grace_period":
        return `<span class="badge rounded-pill bg-info-subtle text-info border border-info border-opacity-25 px-2 py-1"><i class="bi bi-clock-history me-1"></i>${t("Tolerância", "Grace")} (${delayMins}m)</span>`;
      case "minor_delay":
        return `<span class="badge rounded-pill bg-warning-subtle text-warning border border-warning border-opacity-25 px-2 py-1"><i class="bi bi-clock me-1"></i>${t("Atraso Ligeiro", "Minor Delay")} (+${delayMins}m)</span>`;
      case "late":
        return `<span class="badge rounded-pill bg-danger-subtle text-danger border border-danger border-opacity-25 px-2 py-1"><i class="bi bi-exclamation-circle-fill me-1"></i>${t("Atrasado", "Late")} (+${delayMins}m)</span>`;
      case "severe_delay":
        var h = Math.floor(delayMins / 60);
        var m = delayMins % 60;
        var f = h > 0 ? `${h}h${m > 0 ? m + "m" : ""}` : `${delayMins}m`;
        return `<span class="badge rounded-pill bg-danger text-white px-2 py-1"><i class="bi bi-fire me-1"></i>${t("Muito Tarde", "Severe Delay")} (+${f})</span>`;
      case "absent":
      default:
        return `<span class="badge rounded-pill bg-secondary-subtle text-secondary border border-secondary border-opacity-25 px-2 py-1"><i class="bi bi-dash-circle me-1"></i>${t("Sem Registo", "No Record")}</span>`;
    }
  }

  function formatAttendanceDate(dateStr) {
    if (!dateStr) return "";
    var parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    var monthsPt = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    var monthsEn = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    var mIdx = parseInt(parts[1], 10) - 1;
    if (isEn()) {
      return `${monthsEn[mIdx] || parts[1]} ${parseInt(parts[2], 10)}, ${parts[0]}`;
    }
    return `${parts[2]} de ${monthsPt[mIdx] || parts[1]} de ${parts[0]}`;
  }

  function getWeekday(dateStr) {
    if (!dateStr) return "";
    var d = new Date(dateStr + "T00:00:00");
    var daysPt = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
    var daysEn = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var list = isEn() ? daysEn : daysPt;
    return list[d.getDay()] || "";
  }

  // =========================================================================
  // Biometric File Parser (Excel / CSV)
  // =========================================================================

  function parseBiometricFile(file, onComplete, onError) {
    var reader = new FileReader();
    var isExcel = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");

    reader.onload = async function (e) {
      try {
        var settingsRes = await getBridge().getAttendanceSettings();
        var settings = settingsRes.data;
        var parsedRecords = [];

        if (isExcel && typeof XLSX !== "undefined") {
          var data = new Uint8Array(e.target.result);
          var workbook = XLSX.read(data, { type: "array" });
          var firstSheetName = workbook.SheetNames[0];
          var worksheet = workbook.Sheets[firstSheetName];
          var rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
          parsedRecords = extractRecordsFromRawMatrix(rawRows, settings);
        } else {
          var text = e.target.result;
          parsedRecords = extractRecordsFromCsvText(text, settings);
        }

        if (!parsedRecords || !parsedRecords.records || parsedRecords.records.length === 0) {
          if (onError) onError(t("Não foram encontrados registos válidos no ficheiro.", "No valid attendance records found in file."));
          return;
        }

        parsedRecords.filename = file.name;
        parsedRecords.fileSize = file.size;

        if (onComplete) onComplete(parsedRecords);
      } catch (err) {
        console.error("[Biometric Parser Error]", err);
        if (onError) onError(t("Erro ao analisar ficheiro biométrico: ", "Error parsing biometric file: ") + err.message);
      }
    };

    if (isExcel) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  }

  function extractRecordsFromRawMatrix(rows, settings) {
    if (!rows || rows.length < 2) return { createTime: "", dates: [], records: [], stats: {} };

    var createTime = "";
    var dateMatch = null;

    for (var i = 0; i < Math.min(10, rows.length); i++) {
      var rowStr = (rows[i] || []).join(" ");
      var m = rowStr.match(/Create-time:\s*([\d\-:\s]+)/i) || rowStr.match(/(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})/);
      if (m) {
        createTime = m[1].trim();
        break;
      }
    }

    var headerRowIdx = -1;
    for (var r = 0; r < Math.min(15, rows.length); r++) {
      var joined = (rows[r] || []).map(function (c) { return String(c).trim().toLowerCase(); });
      if (joined.includes("no.") || joined.includes("name") || joined.includes("nome") || joined.includes("id")) {
        headerRowIdx = r;
        break;
      }
    }

    if (headerRowIdx === -1) headerRowIdx = 0;

    var header = (rows[headerRowIdx] || []).map(function (c) { return String(c).trim().toLowerCase(); });
    var idCol = header.findIndex(function (h) { return h === "no." || h === "id" || h === "employee_id" || h === "nº"; });
    var nameCol = header.findIndex(function (h) { return h === "name" || h === "nome" || h === "employee_name"; });
    var dateCol = header.findIndex(function (h) { return h === "date" || h === "data" || h === "attendance_date"; });
    var punchesCol = header.findIndex(function (h) { return h.includes("punch") || h.includes("picagem") || h.includes("time") || h.includes("hora"); });

    if (idCol === -1) idCol = 0;
    if (nameCol === -1) nameCol = 1;

    var defaultDate = createTime ? createTime.slice(0, 10) : new Date().toISOString().slice(0, 10);

    var records = [];
    var datesSeen = new Set();

    for (var rowIdx = headerRowIdx + 1; rowIdx < rows.length; rowIdx++) {
      var row = rows[rowIdx];
      if (!row || row.length === 0) continue;

      var empId = String(row[idCol] || "").trim();
      var empName = String(row[nameCol] || "").trim();
      if (!empId && !empName) continue;

      var recDate = dateCol !== -1 && row[dateCol] ? String(row[dateCol]).trim() : defaultDate;
      recDate = recDate.slice(0, 10);
      datesSeen.add(recDate);

      var punchesRaw = "";
      if (punchesCol !== -1 && row[punchesCol]) {
        punchesRaw = String(row[punchesCol]).trim();
      } else {
        punchesRaw = row.slice(Math.max(idCol, nameCol) + 1).filter(Boolean).join(" ");
      }

      var timeRegex = /(\d{1,2}:\d{2}(?::\d{2})?)/g;
      var matches = punchesRaw.match(timeRegex) || [];
      var normalizedTimes = matches.map(function (tStr) {
        var p = tStr.split(":");
        return p[0].padStart(2, "0") + ":" + p[1].padStart(2, "0");
      });

      var checkIn = normalizedTimes[0] || null;
      var checkOut = normalizedTimes.length > 1 ? normalizedTimes[normalizedTimes.length - 1] : null;

      var punct = getBridge().calculatePunctualityStatus(checkIn, settings);

      var staffMatch = (getBridge().STAFF_LIST || []).find(function (s) {
        return s.id === empId || s.name.toLowerCase() === empName.toLowerCase() || (s.fullName && s.fullName.toLowerCase().includes(empName.toLowerCase()));
      });

      records.push({
        id: "att-" + recDate.replace(/-/g, "") + "-" + (empId || "unk"),
        attendance_date: recDate,
        employee_id: empId || (staffMatch ? staffMatch.id : "999"),
        employee_name: empName || (staffMatch ? staffMatch.name : "Funcionário"),
        employee_full_name: staffMatch ? staffMatch.fullName : empName,
        card_no: staffMatch ? staffMatch.cardNo || "" : "",
        department: staffMatch ? staffMatch.dept : "CESTAFF",
        role: staffMatch ? staffMatch.role : "",
        check_in: checkIn,
        check_out: checkOut,
        all_punches: normalizedTimes.length ? normalizedTimes.join("\n") : (checkIn ? checkIn : "--:--"),
        status: punct.status,
        delay_minutes: punct.delay_minutes,
        is_late: punct.is_late,
        is_present: punct.is_present,
      });
    }

    var dates = Array.from(datesSeen);
    var stats = {
      total: records.length,
      present: records.filter(function (r) { return r.is_present; }).length,
      on_time: records.filter(function (r) { return r.status === "on_time"; }).length,
      grace_period: records.filter(function (r) { return r.status === "grace_period"; }).length,
      minor_delay: records.filter(function (r) { return r.status === "minor_delay"; }).length,
      late: records.filter(function (r) { return r.status === "late"; }).length,
      severe_delay: records.filter(function (r) { return r.status === "severe_delay"; }).length,
      absent: records.filter(function (r) { return !r.is_present; }).length,
    };

    return { createTime: createTime, dates: dates, records: records, stats: stats };
  }

  function extractRecordsFromCsvText(csvText, settings) {
    var lines = csvText.split(/\r?\n/);
    var matrix = lines.map(function (line) {
      var cells = [];
      var inQuotes = false;
      var currentCell = "";
      for (var i = 0; i < line.length; i++) {
        var c = line[i];
        if (c === '"') {
          inQuotes = !inQuotes;
        } else if (c === "," && !inQuotes) {
          cells.push(currentCell);
          currentCell = "";
        } else {
          currentCell += c;
        }
      }
      cells.push(currentCell);
      return cells;
    });
    return extractRecordsFromRawMatrix(matrix, settings);
  }

  // =========================================================================
  // Main Module Entrypoint & Router
  // =========================================================================

  window.renderAttendance = async function (subTab, customMount) {
    if (subTab) attendancePageState.tab = subTab;

    var container = customMount || document.getElementById("content");
    if (!container) return;

    var activeTab = attendancePageState.tab || "daily";
    var isEmbedded = Boolean(customMount && customMount !== document.getElementById("content"));

    var tabs = [
      { id: "daily", label: t("Visão Diária", "Daily View"), icon: "bi-calendar-day" },
      { id: "manual", label: t("Entrada Rápida / WhatsApp", "WhatsApp / Quick Entry"), icon: "bi-chat-left-text-fill" },
      { id: "comparison", label: t("Comparador Temporal", "Temporal Comparison"), icon: "bi-arrow-left-right" },
      { id: "monthly", label: t("Relatório Mensal", "Monthly Report"), icon: "bi-bar-chart-steps" },
      { id: "trajectory", label: t("Dossiê Individual", "Individual Dossier"), icon: "bi-person-badge" },
      { id: "workflow", label: t("Fluxo Pastoral (Lio ➔ Valdemiro ➔ Kéne)", "Pastoral Pipeline"), icon: "bi-diagram-3-fill" },
      { id: "upload", label: t("Importar Ficheiro", "Import File"), icon: "bi-cloud-arrow-up-fill" },
      { id: "reports", label: t("Exportações PDF", "PDF Exports"), icon: "bi-file-earmark-pdf-fill" },
      { id: "settings", label: t("Configurações", "Settings"), icon: "bi-sliders" },
    ];

    var tabNavHtml = `
      <div class="dept-nav-wrapper mb-4">
        <ul class="att-nav-pills" role="tablist">
          ${tabs.map(function (tab) {
            var active = tab.id === activeTab ? "active" : "";
            return `
              <li class="nav-item" role="presentation">
                <button type="button" class="att-nav-link ${active}" data-attendance-tab="${tab.id}">
                  <i class="bi ${tab.icon}"></i><span>${tab.label}</span>
                </button>
              </li>`;
          }).join("")}
        </ul>
      </div>`;

    var contentHtml = `<div class="p-4 text-center text-muted"><div class="spinner-border spinner-border-sm me-2"></div>${t("A carregar dados de assiduidade...", "Loading attendance data...")}</div>`;

    var headerHtml = isEmbedded ? `
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3 pb-2 border-bottom border-secondary border-opacity-25">
        <div>
          <h3 class="h5 fw-bold text-white mb-0">${t("Controlo de Assiduidade & Ponto Biométrico", "Staff Biometric Attendance & Tracking")}</h3>
          <p class="text-secondary small mb-0">${t("Pipeline pastoral: Brother Lio ➔ Pastor Valdemiro ➔ Pastor Kéne", "Pastoral pipeline: Brother Lio ➔ Pastor Valdemiro ➔ Pastor Kéne")}</p>
        </div>
        <div class="d-flex align-items-center gap-2">
          <button type="button" class="btn btn-sm" style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.28); color: #4ade80; font-weight: 600; font-size: 0.82rem;" data-attendance-tab="manual">
            <i class="bi bi-chat-left-text-fill me-1.5"></i>${t("Colar WhatsApp", "Paste WhatsApp")}
          </button>
          <button type="button" class="btn btn-sm" style="background: rgba(234, 179, 8, 0.1); border: 1px solid rgba(234, 179, 8, 0.28); color: #facc15; font-weight: 600; font-size: 0.82rem;" data-attendance-tab="comparison">
            <i class="bi bi-arrow-left-right me-1.5"></i>${t("Comparar Períodos", "Compare Periods")}
          </button>
          <button type="button" class="btn btn-sm" style="background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.28); color: #38bdf8; font-weight: 600; font-size: 0.82rem;" data-attendance-quick-export="daily">
            <i class="bi bi-file-earmark-pdf me-1.5"></i>${t("Dossiê em PDF", "PDF Dossier")}
          </button>
        </div>
      </div>
    ` : `
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <div class="d-flex align-items-center gap-2 mb-1">
            <span class="badge" style="background: rgba(234, 179, 8, 0.12); color: #facc15; border: 1px solid rgba(234, 179, 8, 0.25); font-size: 0.72rem; letter-spacing: 0.05em; font-weight: 700;">
              <i class="bi bi-fingerprint me-1"></i>${t("RECURSOS HUMANOS & ASSIDUIDADE", "HUMAN RESOURCES & ATTENDANCE")}
            </span>
            <span class="badge" style="background: rgba(16, 185, 129, 0.12); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.25); font-size: 0.72rem; font-weight: 600;">
              <i class="bi bi-shield-check me-1"></i>${t("Fluxo Pastoral Ativo", "Pastoral Pipeline Active")}
            </span>
          </div>
          <h2 class="h3 fw-bold text-white mb-0">${t("Controlo de Assiduidade, Comparações & Fluxo Pastoral", "Staff Attendance, Comparisons & Pastoral Pipeline")}</h2>
          <p class="text-secondary small mb-0 mt-0.5">${t("Extração por Ir. Lio (Paixão à Primeira Vista) ➔ Auditoria por Pr. Valdemiro (Cuidados Pastorais) ➔ Homologação por Pr. Kéne", "Extraction by Br. Lio ➔ Pastoral Audit by Pr. Valdemiro ➔ Homologation by Pr. Kéne")}</p>
        </div>
        <div class="d-flex align-items-center gap-2">
          <button type="button" class="btn btn-sm" style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.28); color: #4ade80; font-weight: 600; font-size: 0.82rem;" data-attendance-tab="manual">
            <i class="bi bi-whatsapp me-1.5"></i>${t("Registo Rápido WhatsApp", "Quick WhatsApp Entry")}
          </button>
          <button type="button" class="btn btn-sm" style="background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.28); color: #38bdf8; font-weight: 600; font-size: 0.82rem;" data-attendance-tab="workflow">
            <i class="bi bi-diagram-3-fill me-1.5"></i>${t("Fluxo de Submissão", "Submission Pipeline")}
          </button>
          <button type="button" class="btn btn-sm" style="background: rgba(234, 179, 8, 0.1); border: 1px solid rgba(234, 179, 8, 0.28); color: #facc15; font-weight: 600; font-size: 0.82rem;" data-attendance-tab="comparison">
            <i class="bi bi-arrow-left-right me-1.5"></i>${t("Comparar Períodos", "Compare Periods")}
          </button>
          <button type="button" class="btn btn-sm" style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.12); color: #cbd5e1; font-weight: 600; font-size: 0.82rem;" data-attendance-quick-export="daily">
            <i class="bi bi-file-earmark-pdf me-1.5"></i>${t("Dossiê PDF", "PDF Dossier")}
          </button>
        </div>
      </div>
    `;

    container.innerHTML = `
      <div class="attendance-module-root">
        ${headerHtml}
        ${tabNavHtml}

        <div id="attendanceTabBody" class="attendance-tab-content">
          ${contentHtml}
        </div>
      </div>`;

    renderTabContent(activeTab);
    attachModuleEventListeners();
  };

  async function renderTabContent(tab) {
    var body = document.getElementById("attendanceTabBody");
    if (!body) return;

    if (tab === "daily") {
      body.innerHTML = await renderDailyViewHtml();
    } else if (tab === "manual") {
      body.innerHTML = await renderManualViewHtml();
    } else if (tab === "comparison") {
      body.innerHTML = await renderComparisonTabHtml();
    } else if (tab === "monthly") {
      body.innerHTML = await renderMonthlyViewHtml();
    } else if (tab === "trajectory") {
      body.innerHTML = await renderTrajectoryViewHtml();
    } else if (tab === "workflow") {
      body.innerHTML = await renderWorkflowTabHtml();
    } else if (tab === "upload") {
      body.innerHTML = await renderUploadViewHtml();
    } else if (tab === "reports") {
      body.innerHTML = await renderReportsViewHtml();
    } else if (tab === "settings") {
      body.innerHTML = await renderSettingsViewHtml();
    }

    attachModuleEventListeners();
  }

  // =========================================================================
  // Tab 1: Daily View (Visão Diária)
  // =========================================================================

  async function renderDailyViewHtml() {
    var date = attendancePageState.selectedDate || "2026-07-09";
    var res = await getBridge().listAttendanceRecords({ date: date });
    var records = res.data || [];

    // Filter by department
    if (attendancePageState.selectedDepartment && attendancePageState.selectedDepartment !== "all") {
      records = records.filter(function (r) { return r.department === attendancePageState.selectedDepartment; });
    }

    // Filter by search
    if (attendancePageState.searchQuery) {
      var q = attendancePageState.searchQuery.toLowerCase();
      records = records.filter(function (r) {
        return (
          String(r.employee_name || "").toLowerCase().includes(q) ||
          String(r.employee_id || "").toLowerCase().includes(q) ||
          String(r.department || "").toLowerCase().includes(q)
        );
      });
    }

    // KPI Counts
    var totalRecords = records.length;
    var presentRecords = records.filter(function (r) { return r.is_present; });
    var onTimeRecords = records.filter(function (r) { return r.status === "on_time"; });
    var graceRecords = records.filter(function (r) { return r.status === "grace_period"; });
    var minorDelayRecords = records.filter(function (r) { return r.status === "minor_delay"; });
    var lateRecords = records.filter(function (r) { return r.status === "late"; });
    var severeDelayRecords = records.filter(function (r) { return r.status === "severe_delay"; });
    var allLateRecords = records.filter(function (r) { return r.is_late; });
    var absentRecords = records.filter(function (r) { return !r.is_present; });

    // Calculate average check-in
    var checkInMinutesList = presentRecords
      .map(function (r) { return getBridge().parseTimeToMinutes(r.check_in); })
      .filter(function (m) { return m != null; });

    var avgCheckInStr = checkInMinutesList.length
      ? getBridge().minutesToTimeStr(Math.round(checkInMinutesList.reduce(function (a, b) { return a + b; }, 0) / checkInMinutesList.length))
      : "--:--";

    // Workflow banner for current date
    var wfSub = await getBridge().getWorkflowSubmissionByDate(date);
    var wfBanner = `
      <div class="p-3 mb-3 rounded" style="background: rgba(255, 255, 255, 0.025); border: 1px solid rgba(255, 255, 255, 0.08);">
        <div class="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div class="d-flex align-items-center gap-3">
            <div class="att-avatar" style="width: 38px; height: 38px; font-size: 1.1rem; background: rgba(234, 179, 8, 0.1); color: #facc15; border: 1px solid rgba(234, 179, 8, 0.25);">
              <i class="bi bi-shield-check"></i>
            </div>
            <div>
              <div class="d-flex align-items-center gap-2">
                <strong class="text-white">${t("Estado do Fluxo Executivo", "Executive Pipeline Status")}:</strong>
                ${wfSub && wfSub.overseer_status === "Acknowledged" ? `<span class="badge" style="background: rgba(16, 185, 129, 0.12); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.25);"><i class="bi bi-check-all me-1"></i>${t("Homologado pelo Pastor Kéne", "Homologated by Pastor Kéne")}</span>` : wfSub && wfSub.pastoral_status === "Approved" ? `<span class="badge" style="background: rgba(56, 189, 248, 0.12); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.25);"><i class="bi bi-send-check me-1"></i>${t("Auditado por Pr. Valdemiro ➔ No Painel do Pr. Kéne", "Audited by Pr. Valdemiro ➔ On Pr. Kéne Dashboard")}</span>` : `<span class="badge" style="background: rgba(234, 179, 8, 0.12); color: #facc15; border: 1px solid rgba(234, 179, 8, 0.25);"><i class="bi bi-clock-history me-1"></i>${t("Extração por Ir. Lio (Paixão à Primeira Vista)", "Extracted by Br. Lio")}</span>`}
              </div>
              <small class="text-secondary">${wfSub ? `${t("Encaminhamento:", "Routing:")} ${wfSub.extracted_by || "Ir. Lio (Paixão à Primeira Vista)"} ➔ ${wfSub.pastoral_head || "Pr. Valdemiro (Cuidados Pastorais)"} ➔ ${wfSub.overseer_name || "Pr. Kéne (Superintendente)"}` : `${t("Encaminhamento Padrão:", "Default Routing:")} Ir. Lio (Paixão à Primeira Vista) ➔ Pr. Valdemiro (Cuidados Pastorais) ➔ Pr. Kéne (Superintendente)`}</small>
            </div>
          </div>
          <div class="d-flex align-items-center gap-2">
            <button type="button" class="btn btn-sm" style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.12); color: #cbd5e1; font-weight: 500; font-size: 0.82rem;" data-attendance-tab="workflow">
              <i class="bi bi-diagram-3 me-1" style="color: #38bdf8;"></i>${t("Ver Pipeline Completo", "View Full Pipeline")}
            </button>
            <button type="button" class="btn btn-sm" style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.12); color: #cbd5e1; font-weight: 500; font-size: 0.82rem;" data-attendance-tab="comparison">
              <i class="bi bi-arrow-left-right me-1" style="color: #facc15;"></i>${t("Comparar com Outro Dia", "Compare with Another Day")}
            </button>
          </div>
        </div>
      </div>
    `;

    // Filter table by status
    var displayedRecords = records;
    if (attendancePageState.dailyFilter === "on_time") displayedRecords = onTimeRecords;
    else if (attendancePageState.dailyFilter === "grace_period") displayedRecords = graceRecords;
    else if (attendancePageState.dailyFilter === "minor_delay") displayedRecords = minorDelayRecords;
    else if (attendancePageState.dailyFilter === "late") displayedRecords = lateRecords;
    else if (attendancePageState.dailyFilter === "severe_delay") displayedRecords = severeDelayRecords;
    else if (attendancePageState.dailyFilter === "late_all") displayedRecords = allLateRecords;
    else if (attendancePageState.dailyFilter === "absent") displayedRecords = absentRecords;

    // Build KPI Cards HTML matching Dashboard Attendance KPI Style
    var kpisHtml = `
      <div class="row g-3 mb-3" id="attendanceDailyKpis">
        <div class="col-6 col-md-4 col-xl-2">
          <div class="p-3 rounded att-card-clickable text-center" data-attendance-filter="all" role="button" tabindex="0" title="${t("Clique para ver todos os colaboradores", "Click to view all staff")}">
            <span class="text-secondary small d-block mb-1" style="font-size: 0.72rem; letter-spacing: 0.04em;">${t("TOTAL REGISTADOS", "TOTAL EXPECTED")}</span>
            <strong class="fs-4" style="color: #f1f5f9;">${totalRecords}</strong>
          </div>
        </div>

        <div class="col-6 col-md-4 col-xl-2">
          <div class="p-3 rounded att-card-clickable text-center" data-attendance-filter="all" role="button" tabindex="0" title="${t("Clique para filtrar presentes", "Click to view present staff")}">
            <span class="text-secondary small d-block mb-1" style="font-size: 0.72rem; letter-spacing: 0.04em;">${t("PRESENTES NO POSTO", "PRESENT")}</span>
            <strong class="fs-4" style="color: #38bdf8;">${presentRecords.length} <small class="text-secondary fw-normal fs-6">(${totalRecords ? Math.round((presentRecords.length / totalRecords) * 100) : 0}%)</small></strong>
          </div>
        </div>

        <div class="col-6 col-md-4 col-xl-2">
          <div class="p-3 rounded att-card-clickable text-center" data-attendance-filter="on_time" role="button" tabindex="0" title="${t("Clique para ver pontuais", "Click to view on-time staff")}">
            <span class="text-secondary small d-block mb-1" style="font-size: 0.72rem; letter-spacing: 0.04em;">${t("TAXA PONTUALIDADE", "PUNCTUALITY RATE")}</span>
            <strong class="fs-4" style="color: #34d399;">${totalRecords ? Math.round((onTimeRecords.length / totalRecords) * 100) : 0}%</strong>
          </div>
        </div>

        <div class="col-6 col-md-4 col-xl-2">
          <div class="p-3 rounded att-card-clickable text-center" data-attendance-filter="late_all" role="button" tabindex="0" title="${t("Clique para filtrar atrasados", "Click to view late staff")}">
            <span class="text-secondary small d-block mb-1" style="font-size: 0.72rem; letter-spacing: 0.04em;">${t("EM ATRASO (>08:15)", "TOTAL LATE")}</span>
            <strong class="fs-4" style="color: #f87171;">${allLateRecords.length}</strong>
          </div>
        </div>

        <div class="col-6 col-md-4 col-xl-2">
          <div class="p-3 rounded att-card-clickable text-center">
            <span class="text-secondary small d-block mb-1" style="font-size: 0.72rem; letter-spacing: 0.04em;">${t("HORA MÉDIA ENTRADA", "AVG CHECK-IN")}</span>
            <strong class="fs-4" style="color: #facc15; font-variant-numeric: tabular-nums;">${avgCheckInStr}</strong>
          </div>
        </div>

        <div class="col-6 col-md-4 col-xl-2">
          <div class="p-3 rounded att-card-clickable text-center" data-attendance-filter="absent" role="button" tabindex="0" title="${t("Clique para filtrar ausências", "Click to view absences")}">
            <span class="text-secondary small d-block mb-1" style="font-size: 0.72rem; letter-spacing: 0.04em;">${t("SEM REGISTO / AUSENTES", "UNRECORDED / ABSENT")}</span>
            <strong class="fs-4" style="color: #94a3b8;">${absentRecords.length}</strong>
          </div>
        </div>
      </div>`;

    // Filter Chips & Date Toolbar
    var toolbarHtml = `
      <div class="att-card p-3 mb-4">
        <div class="row g-3 align-items-center">
          <div class="col-12 col-md-auto d-flex flex-wrap align-items-center gap-2">
            <span class="text-secondary small fw-bold text-uppercase" style="letter-spacing: 0.05em; font-size: 0.75rem;"><i class="bi bi-calendar-event text-gold me-1"></i>${t("Data do Registo:", "Record Date:")}</span>
            <input type="date" class="form-control form-control-sm" id="attendanceDatePicker" value="${date}" onchange="window.handleAttendanceDateChange(this.value)" style="max-width: 155px;">
            <div class="btn-group btn-group-sm">
              <button type="button" class="btn btn-outline-secondary" id="attendancePrevDayBtn" title="${t("Dia Anterior", "Previous Day")}"><i class="bi bi-chevron-left"></i></button>
              <button type="button" class="btn btn-outline-secondary" id="attendanceTodayBtn" title="${t("Hoje", "Today")}">${t("Hoje", "Today")}</button>
              <button type="button" class="btn btn-outline-secondary" id="attendanceNextDayBtn" title="${t("Dia Seguinte", "Next Day")}"><i class="bi bi-chevron-right"></i></button>
            </div>
            <!-- Quick Date Presets -->
            <div class="d-none d-lg-flex align-items-center gap-1 ms-1">
              <button type="button" class="btn btn-xs ${date === "2026-10-01" ? "btn-ce-gold fw-bold" : "btn-outline-secondary"}" onclick="window.handleAttendanceDateChange('2026-10-01')">01/10/2026</button>
              <button type="button" class="btn btn-xs ${date === "2026-07-09" ? "btn-ce-gold fw-bold" : "btn-outline-secondary"}" onclick="window.handleAttendanceDateChange('2026-07-09')">09/07/2026</button>
              <button type="button" class="btn btn-xs ${date === "2026-07-08" ? "btn-ce-gold fw-bold" : "btn-outline-secondary"}" onclick="window.handleAttendanceDateChange('2026-07-08')">08/07/2026</button>
            </div>
          </div>

          <div class="col-12 col-md d-flex flex-wrap align-items-center justify-content-md-end gap-2">
            <div class="input-group input-group-sm" style="max-width: 250px;">
              <span class="input-group-text"><i class="bi bi-search"></i></span>
              <input type="text" class="form-control" id="attendanceSearchInput" placeholder="${t("Pesquisar funcionário...", "Search staff...")}" value="${attendancePageState.searchQuery}" oninput="window.handleAttendanceSearch(this.value)">
            </div>

            <select class="form-select form-select-sm" id="attendanceDeptFilter" style="max-width: 180px;" onchange="window.handleAttendanceDeptChange(this.value)">
              <option value="all" ${attendancePageState.selectedDepartment === "all" ? "selected" : ""}>${t("Todos Departamentos", "All Departments")}</option>
              <option value="CESTAFF" ${attendancePageState.selectedDepartment === "CESTAFF" ? "selected" : ""}>CESTAFF</option>
              <option value="Cuidados Pastorais" ${attendancePageState.selectedDepartment === "Cuidados Pastorais" ? "selected" : ""}>Cuidados Pastorais</option>
              <option value="Paixão à Primeira Vista / CESTAFF" ${attendancePageState.selectedDepartment === "Paixão à Primeira Vista / CESTAFF" ? "selected" : ""}>Paixão à Primeira Vista</option>
            </select>

            <button type="button" class="btn btn-sm" style="background: rgba(234, 179, 8, 0.1); border: 1px solid rgba(234, 179, 8, 0.28); color: #facc15; font-weight: 600; font-size: 0.82rem;" onclick="window.generateDailyPreviewModal('${date}')" title="${t("Visualizar / Imprimir PDF do dia", "Preview / Print Daily PDF")}">
              <i class="bi bi-printer me-1"></i>${t("Imprimir / PDF", "Print / PDF")}
            </button>

            <button type="button" class="btn btn-sm" style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.12); color: #94a3b8; font-weight: 500; font-size: 0.82rem;" id="attendanceExportDailyCsv" title="${t("Exportar CSV do dia", "Export Daily CSV")}">
              <i class="bi bi-download me-1"></i>CSV
            </button>
          </div>
        </div>

        <div class="d-flex flex-wrap align-items-center gap-2 mt-3 pt-3 border-top border-secondary border-opacity-15">
          <span class="text-secondary small fw-bold text-uppercase me-1" style="font-size: 0.72rem; letter-spacing: 0.05em;">${t("Filtrar por Status:", "Filter by Status:")}</span>
          <button type="button" class="att-filter-btn ${attendancePageState.dailyFilter === "all" ? "active" : ""}" data-attendance-filter="all">${t("Todos", "All")} (${totalRecords})</button>
          <button type="button" class="att-filter-btn ${attendancePageState.dailyFilter === "on_time" ? "active" : ""}" data-attendance-filter="on_time">${t("Pontual", "On Time")} (${onTimeRecords.length})</button>
          <button type="button" class="att-filter-btn ${attendancePageState.dailyFilter === "grace_period" ? "active" : ""}" data-attendance-filter="grace_period">${t("Tolerância", "Grace")} (${graceRecords.length})</button>
          <button type="button" class="att-filter-btn ${attendancePageState.dailyFilter === "minor_delay" ? "active" : ""}" data-attendance-filter="minor_delay">${t("Atraso Ligeiro", "Minor Delay")} (${minorDelayRecords.length})</button>
          <button type="button" class="att-filter-btn ${attendancePageState.dailyFilter === "late" ? "active" : ""}" data-attendance-filter="late">${t("Atrasado", "Late")} (${lateRecords.length})</button>
          <button type="button" class="att-filter-btn ${attendancePageState.dailyFilter === "severe_delay" ? "active" : ""}" data-attendance-filter="severe_delay">${t("Muito Tarde", "Severe Delay")} (${severeDelayRecords.length})</button>
          <button type="button" class="att-filter-btn ${attendancePageState.dailyFilter === "absent" ? "active" : ""}" data-attendance-filter="absent">${t("Sem Registo", "No Record")} (${absentRecords.length})</button>
        </div>
      </div>`;

    // Records Table
    var tableHtml = `
      <div class="att-card overflow-hidden">
        <div class="att-card-header d-flex flex-wrap align-items-center justify-content-between gap-2" style="padding: 12px 18px;">
          <div class="d-flex align-items-center gap-2">
            <i class="bi bi-clock-history text-cyan fs-5"></i>
            <h5 class="h6 mb-0 fw-semibold text-light">${t("Registos de Ponto", "Attendance Records")} — ${formatAttendanceDate(date)}</h5>
            <span class="badge bg-secondary-subtle text-secondary ms-1">${displayedRecords.length} ${t("colaboradores", "staff")}</span>
          </div>
          <div class="text-secondary small">
            ${t("Hora Média de Entrada:", "Average Check-In Time:")} <strong class="text-cyan font-monospace fs-6 ms-1">${avgCheckInStr}</strong>
          </div>
        </div>

        <div class="table-responsive">
          <table class="table att-table align-middle" id="attendanceDailyTable" style="margin-bottom: 0;">
            <thead>
              <tr>
                <th class="ps-3" style="width: 70px;">ID</th>
                <th>${t("Colaborador / Staff", "Staff Member")}</th>
                <th>${t("Departamento", "Department")}</th>
                <th class="text-center">${t("Hora de Entrada", "Check-In Time")}</th>
                <th class="text-center">${t("Classificação", "Status")}</th>
                <th class="text-center">${t("Tempo de Atraso", "Delay Time")}</th>
                <th>${t("Picagens Brutas", "Raw Punches")}</th>
                <th class="text-end pe-3">${t("Ações", "Actions")}</th>
              </tr>
            </thead>
            <tbody>
              ${displayedRecords.length ? displayedRecords.map(function (rec) {
                var isLate = rec.is_late;
                var staffDisplayName = resolveStaffFullName(rec, rec.employee_full_name || rec.employee_name);
                return `
                  <tr class="${isLate ? "att-row-late" : ""}">
                    <td class="ps-3 font-monospace text-secondary" style="font-size: 0.82rem;">${rec.employee_id}</td>
                    <td>
                      <div class="d-flex align-items-center gap-2">
                        <div class="att-avatar">
                          ${(staffDisplayName || "S").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div class="fw-semibold text-light" style="font-size: 0.88rem;">${staffDisplayName}</div>
                          ${rec.card_no ? `<span class="text-secondary font-monospace" style="font-size: 0.7rem;">Card: ${rec.card_no}</span>` : ""}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="badge bg-secondary-subtle text-secondary border border-secondary border-opacity-25" style="font-size: 0.72rem;">${rec.department || "CESTAFF"}</span>
                    </td>
                    <td class="text-center font-monospace fw-semibold ${isLate ? "text-danger" : "text-light"}" style="font-size: 0.92rem;">
                      ${rec.check_in ? rec.check_in : '<span class="text-secondary opacity-50">--:--</span>'}
                    </td>
                    <td class="text-center">
                      ${getStatusBadge(rec.status, rec.delay_minutes)}
                    </td>
                    <td class="text-center">
                      ${formatDelay(rec.delay_minutes)}
                    </td>
                    <td>
                      <span class="text-secondary small font-monospace" style="font-size: 0.76rem;">
                        ${(rec.all_punches || "--:--").replace(/\n/g, " | ")}
                      </span>
                    </td>
                    <td class="text-end pe-3">
                      <div class="btn-group btn-group-sm">
                        <button type="button" class="btn btn-outline-secondary text-cyan" data-view-trajectory="${rec.employee_id}" title="${t("Ver Trajetória Individual", "View Staff Dossier")}">
                          <i class="bi bi-graph-up-arrow"></i>
                        </button>
                        <button type="button" class="btn btn-outline-secondary" data-edit-attendance="${rec.id || ""}" data-emp-id="${rec.employee_id}" data-date="${rec.attendance_date}" title="${t("Editar / Adicionar Nota", "Edit / Add Note")}">
                          <i class="bi bi-pencil"></i>
                        </button>
                      </div>
                    </td>
                  </tr>`;
              }).join("") : `
                <tr>
                  <td colspan="8" class="text-center py-5 text-muted">
                    <i class="bi bi-inbox fs-2 d-block mb-2 text-secondary"></i>
                    ${t("Nenhum registo de ponto encontrado para os filtros selecionados", "No attendance records found for selected filters")} (${date}).
                    <div class="mt-2">
                      <button type="button" class="btn btn-xs btn-ce-gold" data-attendance-tab="upload"><i class="bi bi-upload me-1"></i>${t("Importar Ficheiro do Dia", "Import Daily File")}</button>
                    </div>
                  </td>
                </tr>`}
            </tbody>
          </table>
        </div>
      </div>`;

    return wfBanner + kpisHtml + toolbarHtml + tableHtml;
  }

  // =========================================================================
  // Tab 2: Temporal Comparison Engine (Dias / Semanas / Meses / Anos)
  // =========================================================================

  async function renderComparisonTabHtml() {
    var mode = attendancePageState.comparisonMode || "day";
    var pA = attendancePageState.comparisonPeriodA || "2026-07-09";
    var pB = attendancePageState.comparisonPeriodB || "2026-07-08";
    var empId = attendancePageState.comparisonEmployeeId || "all";
    var dept = attendancePageState.comparisonDepartment || "all";

    var comp = await getBridge().comparePeriods({
      mode: mode,
      periodA: pA,
      periodB: pB,
      employeeId: empId,
      department: dept,
    });

    var statsA = comp.statsA;
    var statsB = comp.statsB;
    var deltas = comp.deltas;
    var staffMatrix = comp.staffMatrix || [];

    var allStaff = await getBridge().getStaffList();

    // Mode Selector Toolbar
    var modeSelectorHtml = `
      <div class="att-card p-3 mb-4">
        <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3 pb-2 border-bottom border-secondary border-opacity-25">
          <div>
            <span class="badge bg-warning-subtle text-warning text-uppercase px-2 py-0.5 fw-bold" style="font-size: 0.7rem;">
              <i class="bi bi-arrow-left-right me-1"></i>${t("COMPARADOR TEMPORAL MULTI-PERÍODO", "MULTI-PERIOD TEMPORAL COMPARATOR")}
            </span>
            <h4 class="h5 fw-bold text-white mb-0 mt-1">${t("Comparação de Assiduidade e Pontualidade", "Attendance & Punctuality Comparative Matrix")}</h4>
          </div>
          <div class="d-flex flex-wrap align-items-center gap-2">
            <div class="btn-group btn-group-sm" role="group">
              <button type="button" class="btn ${mode === "day" ? "btn-ce-gold fw-bold" : "btn-outline-secondary"}" onclick="window.handleCompModeChange('day')">
                <i class="bi bi-calendar-day me-1"></i>${t("Dia vs Dia", "Day vs Day")}
              </button>
              <button type="button" class="btn ${mode === "week" ? "btn-ce-gold fw-bold" : "btn-outline-secondary"}" onclick="window.handleCompModeChange('week')">
                <i class="bi bi-calendar-week me-1"></i>${t("Semana vs Semana", "Week vs Week")}
              </button>
              <button type="button" class="btn ${mode === "month" ? "btn-ce-gold fw-bold" : "btn-outline-secondary"}" onclick="window.handleCompModeChange('month')">
                <i class="bi bi-calendar-month me-1"></i>${t("Mês vs Mês", "Month vs Month")}
              </button>
              <button type="button" class="btn ${mode === "year" ? "btn-ce-gold fw-bold" : "btn-outline-secondary"}" onclick="window.handleCompModeChange('year')">
                <i class="bi bi-calendar3 me-1"></i>${t("Ano vs Ano", "Year vs Year")}
              </button>
            </div>
            <button type="button" class="btn btn-sm btn-outline-warning" onclick="window.generateComparisonPreviewModal()" title="${t("Visualizar / Imprimir Relatório Comparativo", "Preview / Print Comparative Report")}">
              <i class="bi bi-printer-fill me-1"></i>${t("Imprimir Comparação", "Print Comparison")}
            </button>
          </div>
        </div>

        <div class="row g-3 align-items-center">
          <div class="col-12 col-md-3">
            <label class="form-label text-secondary small fw-semibold mb-1">${t("Período A (Atual):", "Period A (Current):")}</label>
            ${mode === "day" ? `<input type="date" class="form-control form-control-sm" id="compPeriodAInput" value="${pA}" onchange="window.handleCompPeriodChange()">` : mode === "month" ? `<input type="month" class="form-control form-control-sm" id="compPeriodAInput" value="${pA}" onchange="window.handleCompPeriodChange()">` : mode === "year" ? `<input type="number" min="2020" max="2030" class="form-control form-control-sm" id="compPeriodAInput" value="${pA}" onchange="window.handleCompPeriodChange()">` : `<input type="date" class="form-control form-control-sm" id="compPeriodAInput" value="${pA}" onchange="window.handleCompPeriodChange()">`}
          </div>

          <div class="col-12 col-md-3">
            <label class="form-label text-secondary small fw-semibold mb-1">${t("Período B (Comparar com):", "Period B (Compare with):")}</label>
            ${mode === "day" ? `<input type="date" class="form-control form-control-sm" id="compPeriodBInput" value="${pB}" onchange="window.handleCompPeriodChange()">` : mode === "month" ? `<input type="month" class="form-control form-control-sm" id="compPeriodBInput" value="${pB}" onchange="window.handleCompPeriodChange()">` : mode === "year" ? `<input type="number" min="2020" max="2030" class="form-control form-control-sm" id="compPeriodBInput" value="${pB}" onchange="window.handleCompPeriodChange()">` : `<input type="date" class="form-control form-control-sm" id="compPeriodBInput" value="${pB}" onchange="window.handleCompPeriodChange()">`}
          </div>

          <div class="col-12 col-md-4">
            <label class="form-label text-secondary small fw-semibold mb-1">${t("Colaborador:", "Staff Member:")}</label>
            <select class="form-select form-select-sm" id="compEmployeeSelect" onchange="window.handleCompPeriodChange()">
              <option value="all" ${empId === "all" ? "selected" : ""}>${t("Todos os Colaboradores (Visão Geral)", "All Staff Members (Overview)")}</option>
              ${(allStaff || []).map(function (s) {
                return `<option value="${s.id}" ${String(empId) === String(s.id) ? "selected" : ""}>${s.fullName || s.name} (ID: ${s.id}) — ${s.dept}</option>`;
              }).join("")}
            </select>
          </div>

          <div class="col-12 col-md-2 d-flex align-items-end gap-2">
            <button type="button" class="btn btn-sm btn-outline-info w-100" onclick="window.swapComparisonPeriods()" title="${t("Inverter Períodos A e B", "Swap Periods A and B")}">
              <i class="bi bi-arrow-left-right me-1"></i>${t("Inverter ⇄", "Swap ⇄")}
            </button>
          </div>
        </div>

        <!-- Quick Comparison Presets -->
        <div class="d-flex flex-wrap align-items-center gap-1.5 mt-2.5 pt-2 border-top border-secondary border-opacity-25">
          <span class="text-secondary small fw-semibold me-1" style="font-size: 0.72rem;">${t("Atalhos Rápidos:", "Quick Presets:")}</span>
          <button type="button" class="btn btn-xs ${pA === "2026-10-01" && pB === "2026-07-09" ? "btn-ce-gold fw-bold" : "btn-outline-secondary"}" onclick="window.setComparisonPreset('2026-10-01', '2026-07-09', 'day')">
            <i class="bi bi-lightning-charge text-warning me-1"></i>01 Out vs 09 Jul (2026)
          </button>
          <button type="button" class="btn btn-xs ${pA === "2026-07-09" && pB === "2026-07-08" ? "btn-ce-gold fw-bold" : "btn-outline-secondary"}" onclick="window.setComparisonPreset('2026-07-09', '2026-07-08', 'day')">
            09 Jul vs 08 Jul (2026)
          </button>
          <button type="button" class="btn btn-xs ${mode === "month" && pA === "2026-10" && pB === "2026-07" ? "btn-ce-gold fw-bold" : "btn-outline-secondary"}" onclick="window.setComparisonPreset('2026-10', '2026-07', 'month')">
            Out/2026 vs Jul/2026
          </button>
          <button type="button" class="btn btn-xs ${mode === "year" && pA === "2026" && pB === "2025" ? "btn-ce-gold fw-bold" : "btn-outline-secondary"}" onclick="window.setComparisonPreset('2026', '2025', 'year')">
            Ano 2026 vs 2025
          </button>
        </div>
      </div>
    `;

    // KPI Summary Comparison Cards with Deltas
    function renderDeltaBadge(val, suffix, isBetterWhenPositive) {
      if (val === 0 || isNaN(val)) {
        return `<span class="badge bg-secondary-subtle text-secondary ms-1">0${suffix || ""}</span>`;
      }
      var isPositive = val > 0;
      var isGood = isBetterWhenPositive ? isPositive : !isPositive;
      var badgeClass = isGood ? "bg-success text-white" : "bg-danger text-white";
      var icon = isPositive ? "▲ +" : "▼ ";
      return `<span class="badge ${badgeClass} ms-1" style="font-size: 0.72rem;">${icon}${val}${suffix || ""}</span>`;
    }

    var summaryCardsHtml = `
      <div class="row g-3 mb-4">
        <!-- Taxa de Pontualidade Delta -->
        <div class="col-12 col-md-6 col-xl-3">
          <div class="att-card p-3.5 h-100">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <span class="text-secondary small fw-bold text-uppercase" style="font-size: 0.72rem; letter-spacing: 0.05em;">${t("Taxa de Pontualidade", "Punctuality Rate")}</span>
              <span class="badge bg-info-subtle text-info">${mode.toUpperCase()}</span>
            </div>
            <div class="d-flex align-items-baseline gap-2 mb-1">
              <h3 class="h2 fw-bold mb-0 text-white">${statsA.onTimeRate}%</h3>
              <span class="text-secondary small font-monospace">vs ${statsB.onTimeRate}%</span>
              ${renderDeltaBadge(deltas.onTimeRateDelta, "%", true)}
            </div>
            <div class="progress progress-sm bg-secondary bg-opacity-25 mt-2" style="height: 6px;">
              <div class="progress-bar bg-success" style="width: ${statsA.onTimeRate}%"></div>
            </div>
            <div class="d-flex justify-content-between text-secondary small mt-1" style="font-size: 0.7rem;">
              <span>${t("Período A:", "Period A:")} ${pA}</span>
              <span>${t("Período B:", "Period B:")} ${pB}</span>
            </div>
          </div>
        </div>

        <!-- Presenças Registadas Delta -->
        <div class="col-12 col-md-6 col-xl-3">
          <div class="att-card p-3.5 h-100">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <span class="text-secondary small fw-bold text-uppercase" style="font-size: 0.72rem; letter-spacing: 0.05em;">${t("Presenças no Posto", "Present Staff")}</span>
              <i class="bi bi-people-fill text-info"></i>
            </div>
            <div class="d-flex align-items-baseline gap-2 mb-1">
              <h3 class="h2 fw-bold mb-0 text-info">${statsA.present}</h3>
              <span class="text-secondary small font-monospace">vs ${statsB.present}</span>
              ${renderDeltaBadge(deltas.presentDelta, "", true)}
            </div>
            <p class="text-secondary small mb-0 mt-2" style="font-size: 0.75rem;">
              ${t("Taxa de presença:", "Attendance rate:")} <strong>${statsA.presenceRate}%</strong> vs <strong>${statsB.presenceRate}%</strong>
            </p>
          </div>
        </div>

        <!-- Total de Atrasos Delta -->
        <div class="col-12 col-md-6 col-xl-3">
          <div class="att-card p-3.5 h-100">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <span class="text-secondary small fw-bold text-uppercase" style="font-size: 0.72rem; letter-spacing: 0.05em;">${t("Ocorrências em Atraso", "Late Occurrences")}</span>
              <i class="bi bi-clock-history text-danger"></i>
            </div>
            <div class="d-flex align-items-baseline gap-2 mb-1">
              <h3 class="h2 fw-bold mb-0 text-danger">${statsA.allLate}</h3>
              <span class="text-secondary small font-monospace">vs ${statsB.allLate}</span>
              ${renderDeltaBadge(deltas.allLateDelta, "", false)}
            </div>
            <p class="text-secondary small mb-0 mt-2" style="font-size: 0.75rem;">
              ${t("Faltas sem registo:", "Unrecorded absences:")} <strong>${statsA.absent}</strong> (vs ${statsB.absent})
            </p>
          </div>
        </div>

        <!-- Minutos Totais Acumulados Delta -->
        <div class="col-12 col-md-6 col-xl-3">
          <div class="att-card p-3.5 h-100">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <span class="text-secondary small fw-bold text-uppercase" style="font-size: 0.72rem; letter-spacing: 0.05em;">${t("Atraso Acumulado", "Total Delay Time")}</span>
              <i class="bi bi-hourglass-split text-warning"></i>
            </div>
            <div class="d-flex align-items-baseline gap-2 mb-1">
              <h3 class="h2 fw-bold mb-0 text-warning">${statsA.totalDelay}m</h3>
              <span class="text-secondary small font-monospace">vs ${statsB.totalDelay}m</span>
              ${renderDeltaBadge(deltas.totalDelayDelta, "m", false)}
            </div>
            <p class="text-secondary small mb-0 mt-2" style="font-size: 0.75rem;">
              ${t("Atraso médio por colaborador:", "Average delay per staff:")} <strong>${statsA.avgDelay} min</strong>
            </p>
          </div>
        </div>
      </div>
    `;

    // Staff Comparative Matrix Table
    var matrixTableHtml = `
      <div class="att-card overflow-hidden">
        <div class="att-card-header d-flex flex-wrap align-items-center justify-content-between gap-2" style="padding: 14px 20px;">
          <div class="d-flex align-items-center gap-2">
            <i class="bi bi-table text-gold fs-5"></i>
            <h5 class="h6 mb-0 fw-bold">${t("Matriz Comparativa de Colaboradores", "Staff Comparative Matrix")} — (${pA} vs ${pB})</h5>
            <span class="badge bg-gold-subtle text-gold ms-1">${staffMatrix.length} ${t("colaboradores analisados", "staff analyzed")}</span>
          </div>
          <div class="d-flex align-items-center gap-2">
            <span class="badge bg-success-subtle text-success"><i class="bi bi-graph-up-arrow me-1"></i>${staffMatrix.filter(function(s){ return s.trend === "improved"; }).length} ${t("Melhoraram", "Improved")}</span>
            <span class="badge bg-danger-subtle text-danger"><i class="bi bi-graph-down-arrow me-1"></i>${staffMatrix.filter(function(s){ return s.trend === "declined"; }).length} ${t("Pioraram", "Declined")}</span>
            <span class="badge bg-secondary-subtle text-secondary">${staffMatrix.filter(function(s){ return s.trend === "neutral"; }).length} ${t("Estáveis", "Stable")}</span>
          </div>
        </div>

        <div class="table-responsive">
          <table class="table att-table align-middle mb-0" id="attComparisonMatrixTable">
            <thead>
              <tr>
                <th class="ps-3" style="width: 70px;">ID</th>
                <th>${t("Colaborador / Staff", "Staff Member")}</th>
                <th>${t("Departamento", "Department")}</th>
                <th class="text-center">${t("Período A (", "Period A (")}${pA})</th>
                <th class="text-center">${t("Período B (", "Period B (")}${pB})</th>
                <th class="text-center">${t("Delta Pontualidade", "Punctuality Delta")}</th>
                <th class="text-center">${t("Delta Atraso", "Delay Delta")}</th>
                <th class="text-center">${t("Tendência", "Trend")}</th>
                <th class="text-end pe-3">${t("Ação", "Action")}</th>
              </tr>
            </thead>
            <tbody>
              ${staffMatrix.map(function (row) {
                var trendBadge = row.trend === "improved"
                  ? `<span class="badge bg-success"><i class="bi bi-arrow-up-right me-1"></i>${t("Melhorou", "Improved")}</span>`
                  : row.trend === "declined"
                  ? `<span class="badge bg-danger"><i class="bi bi-arrow-down-right me-1"></i>${t("Piorou", "Declined")}</span>`
                  : `<span class="badge bg-secondary"><i class="bi bi-dash me-1"></i>${t("Neutro", "Neutral")}</span>`;

                var formatCell = function(p) {
                  if (mode === "day") {
                    return p.checkIn
                      ? `<div><span class="font-monospace fw-bold ${p.delayMins > 0 ? "text-danger" : "text-success"}">${p.checkIn}</span> ${getStatusBadge(p.status, p.delayMins)}</div>`
                      : `<span class="badge bg-secondary-subtle text-secondary">${t("Sem Registo", "No Record")}</span>`;
                  } else {
                    return `<div><strong class="${p.onTimeRate >= 80 ? "text-success" : "text-danger"}">${p.onTimeRate}%</strong> <small class="text-secondary">(${p.delayMins}m atraso)</small></div>`;
                  }
                };

                var staffDisplayName = resolveStaffFullName(row, row.employee_full_name || row.employee_name);
                return `
                  <tr>
                    <td class="ps-3 font-monospace text-secondary">${row.employee_id}</td>
                    <td>
                      <div>
                        <div class="fw-semibold text-white">${staffDisplayName}</div>
                        <span class="text-secondary small" style="font-size: 0.72rem;">${row.role || row.department}</span>
                      </div>
                    </td>
                    <td><span class="badge bg-secondary-subtle text-secondary">${row.department}</span></td>
                    <td class="text-center">${formatCell(row.periodA)}</td>
                    <td class="text-center">${formatCell(row.periodB)}</td>
                    <td class="text-center font-monospace">${renderDeltaBadge(row.onTimeRateDelta, "%", true)}</td>
                    <td class="text-center font-monospace">${renderDeltaBadge(row.delayMinutesDelta, "m", false)}</td>
                    <td class="text-center">${trendBadge}</td>
                    <td class="text-end pe-3">
                      <button type="button" class="btn btn-xs btn-outline-warning" data-view-trajectory="${row.employee_id}" title="${t("Ver Dossiê", "View Dossier")}">
                        <i class="bi bi-eye me-1"></i>${t("Dossiê", "Dossier")}
                      </button>
                    </td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;

    return modeSelectorHtml + summaryCardsHtml + matrixTableHtml;
  }

  // =========================================================================
  // Tab 3: Pastoral Executive Workflow Pipeline (Lio ➔ Valdemiro ➔ Kéne)
  // =========================================================================

  async function renderWorkflowTabHtml() {
    var date = attendancePageState.workflowSelectedDate || attendancePageState.selectedDate || "2026-07-09";
    var submissionsRes = await getBridge().listWorkflowSubmissions();
    var submissions = submissionsRes.data || [];
    var currentSub = await getBridge().getWorkflowSubmissionByDate(date);

    var pipelineHtml = `
      <div class="att-card p-4 mb-4">
        <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 pb-3 border-bottom border-secondary border-opacity-25">
          <div>
            <div class="d-flex align-items-center gap-2 mb-1">
              <span class="badge bg-gold-subtle text-gold text-uppercase px-2 py-1 fw-bold" style="font-size: 0.72rem;">
                <i class="bi bi-diagram-3-fill me-1"></i>${t("FLUXO HIERÁRQUICO DE SUBMISSÃO & AUDITORIA", "HIERARCHICAL SUBMISSION & AUDIT PIPELINE")}
              </span>
            </div>
            <h3 class="h4 fw-bold text-white mb-0">${t("Fluxo de Assiduidade: Extração ➔ Cuidados Pastorais ➔ Pastor do Grupo", "Attendance Pipeline: Extraction ➔ Pastoral Care ➔ Group Pastor")}</h3>
            <p class="text-secondary small mb-0 mt-1">${t("Processo de validação diária com 3 intervenientes centrais do ministério.", "Daily validation process with the 3 central ministry leaders.")}</p>
          </div>
          <div class="d-flex align-items-center gap-2">
            <label class="text-secondary small fw-semibold text-nowrap">${t("Data do Lote:", "Batch Date:")}</label>
            <input type="date" class="form-control form-control-sm" id="workflowDatePicker" value="${date}" style="max-width: 150px;">
          </div>
        </div>

        <!-- 3 Step Visual Pipeline Cards -->
        <div class="row g-4 mb-4">
          <!-- Step 1: Brother Lio -->
          <div class="col-12 col-lg-4">
            <div class="att-card p-3.5 h-100 border-primary border-opacity-50 position-relative">
              <div class="d-flex align-items-center justify-content-between mb-3">
                <span class="badge bg-primary text-white font-monospace px-2.5 py-1">ETAPA 1</span>
                <span class="badge bg-primary-subtle text-primary"><i class="bi bi-cloud-arrow-up-fill me-1"></i>${t("Extração & Submissão", "Extraction & Submit")}</span>
              </div>
              <div class="d-flex align-items-center gap-3 mb-3">
                <div class="att-avatar" style="width: 48px; height: 48px; font-size: 1.25rem; background: rgba(59, 130, 246, 0.2); border-color: #3b82f6; color: #60a5fa;">
                  BL
                </div>
                <div>
                  <h5 class="h6 fw-bold mb-0 text-white">Brother Lio</h5>
                  <div class="text-primary small fw-semibold" style="font-size: 0.75rem;">${t("Líder do Grupo — Paixão à Primeira Vista", "Group Leader — Paixão à Primeira Vista")}</div>
                  <span class="text-secondary" style="font-size: 0.7rem;">Leopold Youngpet & Koutou</span>
                </div>
              </div>
              <p class="text-secondary small mb-3" style="font-size: 0.78rem;">
                ${t("Responsável por extrair os dados biométricos do terminal da igreja e submeter o lote oficial para validação pastoral.", "Responsible for downloading fingerprint logs and submitting official batch for pastoral care.")}
              </p>
              <div class="p-2.5 rounded bg-dark bg-opacity-40 border border-secondary border-opacity-25 mb-3" style="font-size: 0.75rem;">
                <div class="text-secondary mb-1"><strong>${t("Estado:", "Status:")}</strong> <span class="text-info">${currentSub ? currentSub.extraction_status : t("Pendente", "Pending")}</span></div>
                <div class="text-secondary"><strong>${t("Data / Hora:", "Timestamp:")}</strong> <span class="text-white font-monospace">${currentSub ? currentSub.extracted_at?.slice(0, 19).replace("T", " ") : "—"}</span></div>
              </div>
              <button type="button" class="btn btn-sm btn-primary w-100" id="wfSubmitByLioBtn">
                <i class="bi bi-send-fill me-1.5"></i>${t("Submeter Lote como Brother Lio", "Submit Batch as Brother Lio")}
              </button>
            </div>
          </div>

          <!-- Step 2: Pastor Valdemiro -->
          <div class="col-12 col-lg-4">
            <div class="att-card p-3.5 h-100 position-relative" style="background: rgba(255, 255, 255, 0.025); border: 1px solid rgba(255, 255, 255, 0.08);">
              <div class="d-flex align-items-center justify-content-between mb-3">
                <span class="badge" style="background: rgba(56, 189, 248, 0.12); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.25); font-family: monospace; font-size: 0.72rem;">ETAPA 2</span>
                <span class="badge" style="background: rgba(56, 189, 248, 0.12); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.25);"><i class="bi bi-check2-circle me-1"></i>${t("Auditoria Pastoral", "Pastoral Audit")}</span>
              </div>
              <div class="d-flex align-items-center gap-3 mb-3">
                <div class="att-avatar" style="width: 48px; height: 48px; font-size: 1.25rem; background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.28); color: #38bdf8;">
                  PV
                </div>
                <div>
                  <h5 class="h6 fw-bold mb-0 text-white">Pastor Valdemiro</h5>
                  <div class="text-info small fw-semibold" style="font-size: 0.75rem;">${t("Responsável — Cuidados Pastorais", "Head — Pastoral Care")}</div>
                  <span class="text-secondary" style="font-size: 0.7rem;">Pastoral Care Dept</span>
                </div>
              </div>
              <p class="text-secondary small mb-3" style="font-size: 0.78rem;">
                ${t("Recebe os dados na secção de Cuidados Pastorais, audita justificação de atrasos e encaminha diretamente ao Pastor Kéne.", "Receives data in Pastoral Care, audits delay justifications and forwards directly to Pastor Kéne.")}
              </p>
              <div class="p-2.5 rounded bg-dark bg-opacity-40 border border-secondary border-opacity-25 mb-3" style="font-size: 0.75rem;">
                <div class="text-secondary mb-1"><strong>${t("Estado:", "Status:")}</strong> <span class="text-warning">${currentSub ? currentSub.pastoral_status : t("Aguardando Envio", "Awaiting Submission")}</span></div>
                <div class="text-secondary mb-1"><strong>${t("Auditoria:", "Audited At:")}</strong> <span class="text-white font-monospace">${currentSub ? currentSub.pastoral_reviewed_at?.slice(0, 19).replace("T", " ") : "—"}</span></div>
                <div class="text-secondary text-truncate"><strong>${t("Nota:", "Note:")}</strong> <em>"${currentSub?.pastoral_notes || t("Sem notas", "No notes")}"</em></div>
              </div>
              <button type="button" class="btn btn-sm w-100" style="background: rgba(56, 189, 248, 0.12); border: 1px solid rgba(56, 189, 248, 0.3); color: #38bdf8; font-weight: 600;" id="wfForwardByValdemiroBtn">
                <i class="bi bi-arrow-right-circle-fill me-1.5"></i>${t("Auditado ➔ Encaminhar ao Pastor Kéne", "Audit ➔ Forward to Pastor Kéne")}
              </button>
            </div>
          </div>

          <!-- Step 3: Pastor Kéne -->
          <div class="col-12 col-lg-4">
            <div class="att-card p-3.5 h-100 position-relative" style="background: rgba(255, 255, 255, 0.025); border: 1px solid rgba(255, 255, 255, 0.08);">
              <div class="d-flex align-items-center justify-content-between mb-3">
                <span class="badge" style="background: rgba(234, 179, 8, 0.12); color: #facc15; border: 1px solid rgba(234, 179, 8, 0.25); font-family: monospace; font-size: 0.72rem;">ETAPA 3 (FINAL)</span>
                <span class="badge" style="background: rgba(234, 179, 8, 0.12); color: #facc15; border: 1px solid rgba(234, 179, 8, 0.25);"><i class="bi bi-star-fill me-1"></i>${t("Painel Geral / MAIN", "MAIN Dashboard")}</span>
              </div>
              <div class="d-flex align-items-center gap-3 mb-3">
                <div class="att-avatar" style="width: 48px; height: 48px; font-size: 1.25rem; background: rgba(234, 179, 8, 0.1); border: 1px solid rgba(234, 179, 8, 0.28); color: #facc15;">
                  PK
                </div>
                <div>
                  <h5 class="h6 fw-bold mb-0 text-white">Pastor Kéne</h5>
                  <div class="text-gold small fw-semibold" style="font-size: 0.75rem;">${t("Pastor do Grupo / Supervisor Geral", "Group Pastor / Overall Overseer")}</div>
                  <span class="text-secondary" style="font-size: 0.7rem;">Dashboard Leader • MAIN</span>
                </div>
              </div>
              <p class="text-secondary small mb-3" style="font-size: 0.78rem;">
                ${t("Recebe os dados diretamente na aba MAIN (com Igrejas e Membros) para visualização diária executiva e homologação final.", "Receives data on MAIN tab (alongside Churches and Members) for executive overview and approval.")}
              </p>
              <div class="p-2.5 rounded bg-dark bg-opacity-40 border border-secondary border-opacity-25 mb-3" style="font-size: 0.75rem;">
                <div class="text-secondary mb-1"><strong>${t("Estado:", "Status:")}</strong> <span class="text-success fw-bold">${currentSub?.overseer_status === "Acknowledged" ? t("Homologado", "Homologated") : currentSub?.overseer_status === "Delivered_Main" ? t("Entregue no MAIN", "Delivered on MAIN") : t("Aguardando", "Pending")}</span></div>
                <div class="text-secondary mb-1"><strong>${t("Receção no MAIN:", "Received on MAIN:")}</strong> <span class="text-white font-monospace">${currentSub ? currentSub.overseer_received_at?.slice(0, 19).replace("T", " ") : "—"}</span></div>
                <div class="text-secondary text-truncate"><strong>${t("Despacho:", "Pastoral Direction:")}</strong> <em>"${currentSub?.overseer_notes || t("Sem despacho", "No notes")}"</em></div>
              </div>
              <button type="button" class="btn btn-sm w-100" style="background: rgba(234, 179, 8, 0.12); border: 1px solid rgba(234, 179, 8, 0.3); color: #facc15; font-weight: 600;" id="wfAcknowledgeByKeneBtn">
                <i class="bi bi-patch-check-fill me-1.5"></i>${t("Homologar como Pastor Kéne", "Homologate as Pastor Kéne")}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- History of Workflow Submissions -->
      <div class="att-card overflow-hidden">
        <div class="att-card-header d-flex flex-wrap align-items-center justify-content-between gap-2" style="padding: 14px 20px;">
          <div class="d-flex align-items-center gap-2">
            <i class="bi bi-clock-history text-gold fs-5"></i>
            <h5 class="h6 mb-0 fw-bold">${t("Histórico de Submissões e Encaminhamentos", "Submission & Forwarding History")}</h5>
          </div>
          <span class="badge bg-secondary-subtle text-secondary">${submissions.length} ${t("lotes registados", "recorded batches")}</span>
        </div>

        <div class="table-responsive">
          <table class="table att-table align-middle mb-0">
            <thead>
              <tr>
                <th class="ps-3">${t("Data do Lote", "Batch Date")}</th>
                <th>${t("Título & Grupo", "Title & Group")}</th>
                <th>${t("Extraído por (Lio)", "Extracted by (Lio)")}</th>
                <th>${t("Auditoria Pastoral (Valdemiro)", "Pastoral Audit (Valdemiro)")}</th>
                <th>${t("Receção no MAIN (Pastor Kéne)", "MAIN Receipt (Pastor Kéne)")}</th>
                <th class="text-center">${t("Estado Geral", "Overall Status")}</th>
                <th class="text-end pe-3">${t("Ações", "Actions")}</th>
              </tr>
            </thead>
            <tbody>
              ${submissions.length ? submissions.map(function (s) {
                var statusBadge = s.status === "delivered_to_kene" && s.overseer_status === "Acknowledged"
                  ? `<span class="badge bg-success"><i class="bi bi-check-all me-1"></i>${t("Homologado", "Homologated")}</span>`
                  : s.status === "delivered_to_kene"
                  ? `<span class="badge bg-info text-dark"><i class="bi bi-send-check me-1"></i>${t("No MAIN (Pr. Kéne)", "On MAIN (Pr. Kéne)")}</span>`
                  : `<span class="badge bg-warning text-dark">${t("Em Extração", "In Extraction")}</span>`;

                return `
                  <tr>
                    <td class="ps-3 font-monospace fw-bold text-white">${s.date}</td>
                    <td>
                      <div>
                        <div class="fw-semibold small">${s.title}</div>
                        <span class="text-secondary" style="font-size: 0.72rem;">${s.group_name}</span>
                      </div>
                    </td>
                    <td>
                      <div>
                        <span class="badge bg-primary-subtle text-primary">${s.extracted_by}</span>
                        <div class="text-secondary small font-monospace" style="font-size: 0.7rem;">${s.extracted_at?.slice(11, 16)}</div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <span class="badge bg-info-subtle text-info">${s.pastoral_head}</span>
                        <div class="text-secondary small" style="font-size: 0.7rem;">${s.pastoral_notes ? `"${s.pastoral_notes}"` : "—"}</div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <span class="badge bg-gold-subtle text-gold">${s.overseer_name}</span>
                        <div class="text-secondary small font-monospace" style="font-size: 0.7rem;">${s.overseer_received_at?.slice(11, 16)} • ${s.overseer_status || "Recebido"}</div>
                      </div>
                    </td>
                    <td class="text-center">${statusBadge}</td>
                    <td class="text-end pe-3">
                      <button type="button" class="btn btn-xs btn-outline-warning" data-load-wf-date="${s.date}" title="${t("Ver / Auditar este Lote", "View / Audit this batch")}">
                        <i class="bi bi-arrow-clockwise me-1"></i>${t("Selecionar", "Select")}
                      </button>
                    </td>
                  </tr>
                `;
              }).join("") : `<tr><td colspan="7" class="text-center py-4 text-muted">${t("Nenhum lote submetido anteriormente.", "No batches submitted yet.")}</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;

    return pipelineHtml;
  }

  // =========================================================================
  // Tab 4: Comprehensive Monthly & Periodic Report (Análise Mensal)
  // =========================================================================

  async function renderMonthlyViewHtml() {
    var month = attendancePageState.monthlySelectedMonth || "2026-07";
    var report = await getBridge().getComprehensiveMonthlyReport(month);

    var topPunctual = report.topPunctual || [];
    var topLate = report.topLate || [];
    var buckets = report.buckets || {};
    var totalPresentWithTime = (buckets.before_8 || 0) + (buckets.grace_8_15 || 0) + (buckets.minor_8_30 || 0) + (buckets.late_9_00 || 0) + (buckets.severe_after_9 || 0) || 1;

    var headerHtml = `
      <div class="att-card p-3 mb-4">
        <div class="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div class="d-flex align-items-center gap-3">
            <div class="att-avatar" style="width: 40px; height: 40px; font-size: 1.2rem; background: rgba(212,175,55,0.15); color: #d4af37; border-color: #d4af37;">
              <i class="bi bi-calendar3"></i>
            </div>
            <div>
              <span class="badge bg-gold-subtle text-gold text-uppercase px-2 py-0.5 fw-bold" style="font-size: 0.7rem;">
                <i class="bi bi-file-earmark-bar-graph me-1"></i>${t("RELATÓRIO MENSAL EXECUTIVO", "EXECUTIVE MONTHLY REPORT")}
              </span>
              <h4 class="h5 fw-bold text-white mb-0 mt-0.5">${t("Consolidação de Assiduidade e Pontualidade — Mês de ", "Attendance & Punctuality Consolidation — ")}${month}</h4>
            </div>
          </div>
          <div class="d-flex align-items-center gap-2">
            <input type="month" class="form-control form-control-sm" id="monthlyReportMonthPicker" value="${month}" style="max-width: 160px;">
            <button type="button" class="btn btn-sm btn-ce-gold" id="printMonthlyReportBtn">
              <i class="bi bi-printer-fill me-1.5"></i>${t("Imprimir Relatório Mensal", "Print Monthly Report")}
            </button>
          </div>
        </div>
      </div>
    `;

    var kpisHtml = `
      <div class="row g-3 mb-4">
        <div class="col-12 col-md-6 col-xl-3">
          <div class="att-card p-3.5 h-100">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <span class="text-secondary small fw-bold text-uppercase" style="font-size: 0.72rem; letter-spacing: 0.05em;">${t("Taxa Global de Pontualidade", "Global Punctuality Rate")}</span>
              <div class="att-avatar" style="width: 28px; height: 28px; font-size: 0.8rem; background: rgba(34, 197, 94, 0.15); border-color: #22c55e; color: #22c55e;"><i class="bi bi-pie-chart-fill"></i></div>
            </div>
            <h3 class="h2 fw-bold mb-1 ${report.onTimeRate >= 80 ? "text-success" : "text-warning"}">${report.onTimeRate}%</h3>
            <div class="progress progress-sm bg-secondary bg-opacity-25 mb-2" style="height: 6px;">
              <div class="progress-bar bg-success" style="width: ${report.onTimeRate}%"></div>
            </div>
            <p class="text-secondary small mb-0" style="font-size: 0.76rem;">${report.onTimeCount + report.graceCount} ${t("de", "of")} ${report.totalRecords} ${t("presenças pontuais / tolerância", "punctual / grace attendances")}</p>
          </div>
        </div>

        <div class="col-12 col-md-6 col-xl-3">
          <div class="att-card p-3.5 h-100">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <span class="text-secondary small fw-bold text-uppercase" style="font-size: 0.72rem; letter-spacing: 0.05em;">${t("Horas de Atraso Acumuladas", "Accumulated Delay Hours")}</span>
              <div class="att-avatar" style="width: 28px; height: 28px; font-size: 0.8rem; background: rgba(239, 68, 68, 0.15); border-color: #ef4444; color: #ef4444;"><i class="bi bi-clock-history"></i></div>
            </div>
            <h3 class="h2 fw-bold text-danger mb-1">${Math.floor(report.totalDelayMinutes / 60)}h ${report.totalDelayMinutes % 60}m</h3>
            <div class="text-secondary small mb-0 mt-2" style="font-size: 0.76rem;">
              ${t("Acumulado em", "Accumulated across")} <strong>${report.allLateCount}</strong> ${t("ocorrências de atraso", "delay occurrences")}
            </div>
          </div>
        </div>

        <div class="col-12 col-md-6 col-xl-3">
          <div class="att-card p-3.5 h-100">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <span class="text-secondary small fw-bold text-uppercase" style="font-size: 0.72rem; letter-spacing: 0.05em;">${t("Colaboradores Monitorizados", "Monitored Staff")}</span>
              <div class="att-avatar" style="width: 28px; height: 28px; font-size: 0.8rem; background: rgba(56, 189, 248, 0.15); border-color: #38bdf8; color: #38bdf8;"><i class="bi bi-people-fill"></i></div>
            </div>
            <h3 class="h2 fw-bold text-info mb-1">${report.distinctEmployeesCount}</h3>
            <div class="text-secondary small mb-0 mt-2" style="font-size: 0.76rem;">
              ${t("Em", "Across")} <strong>${report.distinctDaysCount}</strong> ${t("dias com registo de ponto", "days with punch records")}
            </div>
          </div>
        </div>

        <div class="col-12 col-md-6 col-xl-3">
          <div class="att-card p-3.5 h-100">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <span class="text-secondary small fw-bold text-uppercase" style="font-size: 0.72rem; letter-spacing: 0.05em;">${t("Consistência de Presenças", "Attendance Consistency")}</span>
              <div class="att-avatar" style="width: 28px; height: 28px; font-size: 0.8rem; background: rgba(245, 158, 11, 0.15); border-color: #f59e0b; color: #f59e0b;"><i class="bi bi-award-fill"></i></div>
            </div>
            <h3 class="h2 fw-bold text-warning mb-1">${report.presenceRate}%</h3>
            <div class="text-secondary small mb-0 mt-2" style="font-size: 0.76rem;">
              ${report.presentCount} ${t("presenças de", "presences out of")} ${report.totalRecords} ${t("registos esperados", "expected records")}
            </div>
          </div>
        </div>
      </div>
    `;

    // Leaderboard / Honor Board
    var honorBoardHtml = `
      <div class="row g-4 mb-4">
        <!-- Top Mais Pontuais -->
        <div class="col-12 col-lg-6">
          <div class="att-card h-100 overflow-hidden">
            <div class="att-card-header d-flex align-items-center justify-content-between">
              <div class="d-flex align-items-center gap-2">
                <i class="bi bi-trophy-fill text-gold fs-5"></i>
                <h5 class="h6 mb-0 fw-bold">${t("Quadro de Honra (Mais Pontuais)", "Honor Roll (Most Punctual)")}</h5>
              </div>
              <span class="badge bg-success-subtle text-success">${t("Top Consistência", "Top Consistency")}</span>
            </div>
            <div class="table-responsive">
              <table class="table att-table align-middle mb-0">
                <thead>
                  <tr>
                    <th class="ps-3" style="width: 40px;">#</th>
                    <th>${t("Colaborador", "Staff Member")}</th>
                    <th class="text-center">${t("Hora Média", "Avg Time")}</th>
                    <th class="text-center">${t("Pontuais", "On Time")}</th>
                    <th class="text-end pe-3">${t("Taxa", "Rate")}</th>
                  </tr>
                </thead>
                <tbody>
                  ${topPunctual.length ? topPunctual.map(function (emp, idx) {
                    var medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}º`;
                    var staffDisplayName = resolveStaffFullName(emp, emp.employee_full_name || emp.employee_name);
                    return `
                      <tr>
                        <td class="ps-3 fw-bold text-gold">${medal}</td>
                        <td>
                          <div>
                            <div class="fw-semibold small text-white">${staffDisplayName}</div>
                            <span class="text-secondary" style="font-size: 0.7rem;">ID: ${emp.employee_id} • ${emp.department}</span>
                          </div>
                        </td>
                        <td class="text-center font-monospace text-info small">${emp.avgCheckInTime}</td>
                        <td class="text-center small"><strong class="text-success">${emp.onTimeDays + emp.graceDays}</strong> / ${emp.totalDays}</td>
                        <td class="text-end pe-3">
                          <span class="badge ${emp.onTimeRate >= 80 ? "bg-success" : "bg-warning text-dark"}">${emp.onTimeRate}%</span>
                        </td>
                      </tr>`;
                  }).join("") : `<tr><td colspan="5" class="text-center py-4 text-muted">${t("Sem dados", "No data")}</td></tr>`}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Top Atrasos Recorrentes -->
        <div class="col-12 col-lg-6">
          <div class="att-card h-100 overflow-hidden">
            <div class="att-card-header d-flex align-items-center justify-content-between">
              <div class="d-flex align-items-center gap-2">
                <i class="bi bi-exclamation-triangle-fill text-danger fs-5"></i>
                <h5 class="h6 mb-0 fw-bold">${t("Atenção RH & Pastoral (Atrasos Recorrentes)", "HR & Pastoral Attention (Delays)")}</h5>
              </div>
              <span class="badge bg-danger-subtle text-danger">${t("Necessita Acompanhamento", "Requires Attention")}</span>
            </div>
            <div class="table-responsive">
              <table class="table att-table align-middle mb-0">
                <thead>
                  <tr>
                    <th class="ps-3" style="width: 40px;">#</th>
                    <th>${t("Colaborador", "Staff Member")}</th>
                    <th class="text-center">${t("Dias Atraso", "Late Days")}</th>
                    <th class="text-center">${t("Tempo Total", "Total Delay")}</th>
                    <th class="text-end pe-3">${t("Ação", "Action")}</th>
                  </tr>
                </thead>
                <tbody>
                  ${topLate.length ? topLate.map(function (emp, idx) {
                    var delayH = Math.floor(emp.totalDelayMins / 60);
                    var delayM = emp.totalDelayMins % 60;
                    var delayF = delayH > 0 ? `${delayH}h ${delayM}m` : `${delayM} min`;
                    var staffDisplayName = resolveStaffFullName(emp, emp.employee_full_name || emp.employee_name);
                    return `
                      <tr>
                        <td class="ps-3 fw-bold text-danger">${idx + 1}º</td>
                        <td>
                          <div>
                            <div class="fw-semibold small text-white">${staffDisplayName}</div>
                            <span class="text-secondary" style="font-size: 0.7rem;">ID: ${emp.employee_id} • ${emp.department}</span>
                          </div>
                        </td>
                        <td class="text-center">
                          <span class="badge bg-danger-subtle text-danger">${emp.lateDays} ${t("dias", "days")}</span>
                        </td>
                        <td class="text-center font-monospace fw-bold text-danger small">
                          ${delayF}
                        </td>
                        <td class="text-end pe-3">
                          <button type="button" class="btn btn-xs btn-outline-warning" data-view-trajectory="${emp.employee_id}" title="${t("Ver Dossiê Individual", "View Dossier")}">
                            <i class="bi bi-eye me-1"></i>${t("Dossiê", "Dossier")}
                          </button>
                        </td>
                      </tr>`;
                  }).join("") : `<tr><td colspan="5" class="text-center py-4 text-muted">${t("Nenhum atraso crítico registado.", "No critical delays recorded.")}</td></tr>`}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;

    // Distribution Brackets
    var distributionHtml = `
      <div class="att-card p-4 mb-4">
        <h5 class="h6 mb-3 fw-bold"><i class="bi bi-bar-chart-fill text-gold me-2"></i>${t("Distribuição das Horas de Entrada no Mês", "Monthly Check-In Time Distribution")}</h5>
        <div class="row g-3">
          <div class="col-12 col-md">
            <div class="p-3 rounded border border-secondary border-opacity-25 text-center">
              <span class="text-success small fw-semibold d-block mb-1">${t("Até 08:30 (No Horário)", "Up to 08:30 (On Time)")}</span>
              <h4 class="text-success fw-bold mb-1">${buckets.before_8_30 || buckets.before_8 || 0}</h4>
              <span class="text-secondary small">${Math.round(((buckets.before_8_30 || buckets.before_8 || 0) / totalPresentWithTime) * 100)}%</span>
            </div>
          </div>
          <div class="col-12 col-md">
            <div class="p-3 rounded border border-secondary border-opacity-25 text-center">
              <span class="text-info small fw-semibold d-block mb-1">${t("08:31 – 08:45 (Atraso Ligeiro)", "08:31 – 08:45 (Minor Delay)")}</span>
              <h4 class="text-info fw-bold mb-1">${buckets.minor_8_45 || buckets.grace_8_15 || 0}</h4>
              <span class="text-secondary small">${Math.round(((buckets.minor_8_45 || buckets.grace_8_15 || 0) / totalPresentWithTime) * 100)}%</span>
            </div>
          </div>
          <div class="col-12 col-md">
            <div class="p-3 rounded border border-secondary border-opacity-25 text-center">
              <span class="text-warning small fw-semibold d-block mb-1">${t("08:46 – 09:00 (Atrasado)", "08:46 – 09:00 (Late)")}</span>
              <h4 class="text-warning fw-bold mb-1">${buckets.late_9_00 || 0}</h4>
              <span class="text-secondary small">${Math.round(((buckets.late_9_00 || 0) / totalPresentWithTime) * 100)}%</span>
            </div>
          </div>
          <div class="col-12 col-md">
            <div class="p-3 rounded border border-secondary border-opacity-25 text-center">
              <span class="text-danger small fw-semibold d-block mb-1">${t("09:01 – 09:30 (Atraso +60m)", "09:01 – 09:30 (Late +60m)")}</span>
              <h4 class="text-danger fw-bold mb-1">${buckets.late_9_30 || 0}</h4>
              <span class="text-secondary small">${Math.round(((buckets.late_9_30 || 0) / totalPresentWithTime) * 100)}%</span>
            </div>
          </div>
          <div class="col-12 col-md">
            <div class="p-3 rounded border border-secondary border-opacity-25 text-center">
              <span class="text-danger fw-bold small d-block mb-1">${t("Após 09:30 (Atraso Grave)", "After 09:30 (Severe Delay)")}</span>
              <h4 class="fw-bold mb-1 text-danger">${buckets.severe_after_9_30 || buckets.severe_after_9 || 0}</h4>
              <span class="text-secondary small">${Math.round(((buckets.severe_after_9_30 || buckets.severe_after_9 || 0) / totalPresentWithTime) * 100)}%</span>
            </div>
          </div>
        </div>
      </div>
    `;

    return headerHtml + kpisHtml + honorBoardHtml + distributionHtml;
  }

  // =========================================================================
  // Tab 5: Staff Individual Trajectory (Dossiê Individual & Ficha)
  // =========================================================================

  async function renderTrajectoryViewHtml() {
    var allStaff = await getBridge().getStaffList();
    var distinctEmployees = (allStaff || []).map(function (s) {
      return {
        id: String(s.id),
        name: s.fullName || s.name,
        shortName: s.name,
        dept: s.dept || "CESTAFF",
        role: s.role || "Staff"
      };
    });

    var selectedId = String(attendancePageState.selectedStaffId || (distinctEmployees[0] ? distinctEmployees[0].id : "11"));
    var trajectory = await getBridge().getStaffTrajectory(selectedId, "2026-01-01", "2026-12-31");
    var trajectoryOfficialName = resolveStaffFullName(trajectory, trajectory.employee_full_name || trajectory.employee_name);

    var selectorHtml = `
      <div class="att-card p-3 mb-4">
        <div class="row g-3 align-items-center justify-content-between mb-2">
          <div class="col-12 col-md-6 d-flex align-items-center gap-3">
            <label class="text-secondary small fw-semibold mb-0 text-nowrap"><i class="bi bi-person-bounding-box text-gold me-1"></i>${t("Selecionar Colaborador:", "Select Staff Member:")}</label>
            <select class="form-select form-select-sm" id="trajectoryStaffSelect" onchange="window.handleTrajectoryStaffChange(this.value)">
              ${distinctEmployees.map(function (e) {
                return `<option value="${e.id}" ${String(e.id) === String(selectedId) ? "selected" : ""}>${e.name} (ID: ${e.id}) — ${e.dept}</option>`;
              }).join("")}
            </select>
          </div>
          <div class="col-12 col-md-auto d-flex align-items-center gap-2">
            <button type="button" class="btn btn-sm btn-ce-gold fw-semibold px-3" id="exportStaffDossierPdfBtn" onclick="window.generateStaffDossierPreviewModal(document.getElementById('trajectoryStaffSelect') ? document.getElementById('trajectoryStaffSelect').value : '${selectedId}')">
              <i class="bi bi-file-earmark-pdf-fill me-1.5"></i>${t("Imprimir Dossiê Individual", "Print Staff Dossier")}
            </button>
          </div>
        </div>

        <!-- Quick Staff Chips for Instant Selection -->
        <div class="d-flex flex-wrap align-items-center gap-1.5 pt-2 border-top border-secondary border-opacity-25">
          <span class="text-secondary small fw-semibold me-1" style="font-size: 0.72rem;">${t("Acesso Rápido:", "Quick Access:")}</span>
          ${distinctEmployees.slice(0, 10).map(function (e) {
            var isCurrent = String(e.id) === String(selectedId);
            return `
              <button type="button" class="btn btn-xs ${isCurrent ? "btn-ce-gold fw-bold" : "btn-outline-secondary"}" onclick="window.handleTrajectoryStaffChange('${e.id}')">
                <i class="bi bi-person-fill me-0.5"></i>${e.shortName || e.name}
              </button>
            `;
          }).join("")}
        </div>
      </div>`;

    var profileHeaderHtml = `
      <div class="att-card p-4 mb-4">
        <div class="row g-4 align-items-center">
          <div class="col-12 col-md-auto text-center text-md-start">
            <div class="d-flex align-items-center justify-content-center mx-auto" style="width: 58px; height: 58px; font-size: 1.6rem; border: 1px solid rgba(212, 175, 55, 0.4); color: #d4af37; background: rgba(212, 175, 55, 0.12); border-radius: 16px;">
              <i class="bi bi-person-badge"></i>
            </div>
          </div>
          <div class="col-12 col-md">
            <div class="d-flex flex-wrap align-items-center gap-2 mb-1">
              <h3 class="h4 fw-bold mb-0 text-white">${trajectoryOfficialName}</h3>
              <span class="badge bg-gold-subtle text-gold">ID: ${trajectory.employee_id}</span>
              <span class="badge bg-secondary-subtle text-secondary border border-secondary border-opacity-40">${trajectory.department}</span>
            </div>
            <p class="text-secondary small mb-0">${t("LoveWorld Christ Embassy Mozambique • Assiduidade e Pontualidade", "LoveWorld Christ Embassy Mozambique • Attendance & Punctuality")}</p>
          </div>
          <div class="col-12 col-md-auto">
            <div class="d-flex flex-wrap gap-2 justify-content-center justify-content-md-end">
              <div class="px-3 py-2 rounded border border-secondary border-opacity-25 text-center" style="min-width: 100px;">
                <span class="text-secondary small d-block" style="font-size: 0.7rem; letter-spacing: 0.05em;">${t("TAXA PONTUALIDADE", "PUNCTUALITY RATE")}</span>
                <span class="fs-5 fw-bold ${trajectory.onTimeRate >= 80 ? "text-success" : trajectory.onTimeRate >= 60 ? "text-warning" : "text-danger"}">${trajectory.onTimeRate}%</span>
              </div>
              <div class="px-3 py-2 rounded border border-secondary border-opacity-25 text-center" style="min-width: 100px;">
                <span class="text-secondary small d-block" style="font-size: 0.7rem; letter-spacing: 0.05em;">${t("MÉDIA ENTRADA", "AVG CHECK-IN")}</span>
                <span class="fs-5 fw-bold text-info font-monospace">${trajectory.avgCheckInTime}</span>
              </div>
              <div class="px-3 py-2 rounded border border-secondary border-opacity-25 text-center" style="min-width: 100px;">
                <span class="text-secondary small d-block" style="font-size: 0.7rem; letter-spacing: 0.05em;">${t("TOTAL ATRASO", "TOTAL DELAY")}</span>
                <span class="fs-5 fw-bold text-danger font-monospace">${trajectory.totalDelayMinutes}m</span>
              </div>
            </div>
          </div>
        </div>
      </div>`;

    var historyTableHtml = `
      <div class="att-card overflow-hidden">
        <div class="att-card-header d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center gap-2">
            <i class="bi bi-clock-history text-gold fs-5"></i>
            <h5 class="h6 mb-0 fw-bold">${t("Histórico Completo de Picagens de Ponto", "Complete Check-In Punch History")}</h5>
          </div>
          <span class="badge bg-gold-subtle text-gold">${trajectory.records.length} ${t("registos no histórico", "records in history")}</span>
        </div>

        <div class="table-responsive">
          <table class="table att-table align-middle mb-0">
            <thead>
              <tr>
                <th class="ps-3">${t("Data", "Date")}</th>
                <th>${t("Dia da Semana", "Weekday")}</th>
                <th class="text-center">${t("Entrada (Check-In)", "Check-In")}</th>
                <th class="text-center">${t("Classificação", "Status")}</th>
                <th class="text-center">${t("Atraso", "Delay")}</th>
                <th>${t("Picagens Completas", "All Punches")}</th>
                <th class="text-end pe-3">${t("Observações", "Notes")}</th>
              </tr>
            </thead>
            <tbody>
              ${trajectory.records.length ? trajectory.records.map(function (rec) {
                var weekday = getWeekday(rec.attendance_date);
                return `
                  <tr>
                    <td class="ps-3 fw-semibold font-monospace text-white">${rec.attendance_date}</td>
                    <td class="text-secondary small">${weekday}</td>
                    <td class="text-center font-monospace fw-bold ${rec.is_late ? "text-danger" : "text-white"}">${rec.check_in || "--:--"}</td>
                    <td class="text-center">${getStatusBadge(rec.status, rec.delay_minutes)}</td>
                    <td class="text-center">${formatDelay(rec.delay_minutes)}</td>
                    <td class="text-secondary small font-monospace" style="font-size: 0.76rem;">${(rec.all_punches || "--:--").replace(/\n/g, " | ")}</td>
                    <td class="text-end pe-3 text-secondary small">${rec.notes || "—"}</td>
                  </tr>`;
              }).join("") : `<tr><td colspan="7" class="text-center py-4 text-muted">${t("Sem registos para este funcionário", "No records found for this staff member")}</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>`;

    return selectorHtml + profileHeaderHtml + historyTableHtml;
  }

  // =========================================================================
  // Tab: Manual & WhatsApp Quick Entry (Entrada Rápida / WhatsApp)
  // =========================================================================

  async function renderManualViewHtml() {
    var isWhatsApp = attendancePageState.manualEntryMode !== "grid";
    var defaultText = `Relatório diário de chegada 01/10/2026

Nome: Hora da Chegada

1. Janet Marquel (8:30) 🟢
2. Leopold Kusi (8:30) 🟢
3. Deacon Oliver (8:38) 🚨
4. Angélica Amílcar (7:43) 🟢
5. Marcelo Panguene (7:43) 🟢
6. Eduarda Paula (8:25) 🟢
7. Gilberto Baule (7:50) 🟢
8. Pastor Valdemiro (8:23) 🟢
9. Sis. Virgínia Filipe (8:22) 🟢
10. Junya Clementina (8:49) 🚨
11. Laiza Chirindza (8:33) 🚨
12. Pastor Clarissa (8:11) 🟢
13. Sister Kassandra (8:14) 🟢
14. Bro Filipe (8:30) 🟢

Thank you for the opportunity Pastor Sir`;

    var parsed = attendancePageState.manualParsedPreview;
    var rawText = attendancePageState.manualRawText || (parsed ? "" : defaultText);
    var targetDate = (parsed && parsed.attendance_date) || attendancePageState.manualGridDate || attendancePageState.selectedDate || "2026-10-01";

    var staffList = await getBridge().getStaffList();

    // Mode Toggle Bar
    var modeToggleHtml = `
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 p-3 rounded bg-dark bg-opacity-40 border border-secondary border-opacity-25">
        <div>
          <h4 class="h5 fw-bold text-white mb-1">
            <i class="bi bi-pencil-square text-gold me-2"></i>${t("Registo Rápido de Assiduidade e Chegadas", "Quick Attendance & Arrival Log")}
          </h4>
          <p class="text-secondary small mb-0">
            ${t("Insira os dados colando o relatório do WhatsApp enviado pelo Ir. Leopold ou preencha a matriz manual.", "Enter data by pasting Brother Leopold's WhatsApp arrival report or filling the manual table.")}
          </p>
        </div>

        <div class="btn-group btn-group-sm" role="group">
          <button type="button" class="btn ${isWhatsApp ? "btn-ce-gold" : "btn-outline-secondary"}" id="switchToWhatsAppModeBtn">
            <i class="bi bi-whatsapp me-1.5 text-success"></i>${t("Colar Texto do WhatsApp", "Paste WhatsApp Text")}
          </button>
          <button type="button" class="btn ${!isWhatsApp ? "btn-ce-gold" : "btn-outline-secondary"}" id="switchToGridModeBtn">
            <i class="bi bi-table me-1.5"></i>${t("Matriz de Formulário Manual", "Manual Form Grid")}
          </button>
        </div>
      </div>
    `;

    if (isWhatsApp) {
      // WhatsApp View
      var previewSectionHtml = "";
      if (parsed && parsed.records && parsed.records.length) {
        var recs = parsed.records;
        var presentCount = recs.filter(function (r) { return r.is_present; }).length;
        var onTimeCount = recs.filter(function (r) { return r.status === "on_time"; }).length;
        var graceCount = recs.filter(function (r) { return r.status === "grace_period"; }).length;
        var lateCount = recs.filter(function (r) { return r.is_late; }).length;
        var absentCount = recs.filter(function (r) { return !r.is_present; }).length;

        previewSectionHtml = `
          <div class="att-card p-4 mb-4" id="manualParsedPreviewCard" style="background: rgba(255, 255, 255, 0.025); border: 1px solid rgba(255, 255, 255, 0.08);">
            <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3 pb-3 border-bottom border-secondary border-opacity-25">
              <div>
                <span class="badge mb-1" style="background: rgba(234, 179, 8, 0.12); color: #facc15; border: 1px solid rgba(234, 179, 8, 0.25);"><i class="bi bi-check2-all me-1"></i>${t("Dados Processados do WhatsApp", "Parsed WhatsApp Data")}</span>
                <h5 class="fw-bold text-white mb-0">${t("Pré-visualização do Relatório — Data:", "Report Preview — Date:")} <span style="color: #facc15; font-family: monospace;">${parsed.attendance_date}</span></h5>
                <span class="text-secondary small">${t("Verifique e faça pequenos ajustes antes de gravar no sistema.", "Review and adjust any punch time before saving.")}</span>
              </div>
              <div class="d-flex align-items-center gap-2">
                <button type="button" class="btn btn-sm" style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.12); color: #94a3b8; font-weight: 500;" id="clearParsedWhatsAppBtn">
                  <i class="bi bi-trash me-1"></i>${t("Descartar", "Discard")}
                </button>
                <button type="button" class="btn btn-sm" style="background: rgba(34, 197, 94, 0.14); border: 1px solid rgba(34, 197, 94, 0.35); color: #4ade80; font-weight: 600;" id="confirmSaveParsedWhatsAppBtn">
                  <i class="bi bi-cloud-check-fill me-1.5"></i>${t("Gravar e Submeter Lote", "Save & Submit Batch")}
                </button>
              </div>
            </div>

            <!-- Stats Chips -->
            <div class="row g-2 mb-3">
              <div class="col-6 col-md-2">
                <div class="p-2 rounded text-center" style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08);">
                  <span class="text-secondary small d-block" style="font-size: 0.7rem; letter-spacing: 0.04em;">${t("TOTAL", "TOTAL")}</span>
                  <strong class="fs-5 text-white">${recs.length}</strong>
                </div>
              </div>
              <div class="col-6 col-md-2">
                <div class="p-2 rounded text-center" style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08);">
                  <span class="text-secondary small d-block" style="font-size: 0.7rem; letter-spacing: 0.04em;">${t("PRESENTES", "PRESENT")}</span>
                  <strong class="fs-5 text-info">${presentCount}</strong>
                </div>
              </div>
              <div class="col-6 col-md-2">
                <div class="p-2 rounded text-center" style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08);">
                  <span class="text-secondary small d-block" style="font-size: 0.7rem; letter-spacing: 0.04em;">${t("PONTUAIS", "ON TIME")}</span>
                  <strong class="fs-5 text-success">${onTimeCount}</strong>
                </div>
              </div>
              <div class="col-6 col-md-2">
                <div class="p-2 rounded text-center" style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08);">
                  <span class="text-secondary small d-block" style="font-size: 0.7rem; letter-spacing: 0.04em;">${t("TOLERÂNCIA", "GRACE")}</span>
                  <strong class="fs-5 text-info">${graceCount}</strong>
                </div>
              </div>
              <div class="col-6 col-md-2">
                <div class="p-2 rounded text-center" style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08);">
                  <span class="text-secondary small d-block" style="font-size: 0.7rem; letter-spacing: 0.04em;">${t("ATRASADOS", "LATE")}</span>
                  <strong class="fs-5 text-danger">${lateCount}</strong>
                </div>
              </div>
              <div class="col-6 col-md-2">
                <div class="p-2 rounded text-center" style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08);">
                  <span class="text-secondary small d-block" style="font-size: 0.7rem; letter-spacing: 0.04em;">${t("SEM REGISTO", "ABSENT")}</span>
                  <strong class="fs-5 text-warning">${absentCount}</strong>
                </div>
              </div>
            </div>

            <!-- Parsed Records Table -->
            <div class="table-responsive rounded border border-secondary border-opacity-25">
              <table class="table att-table align-middle mb-0" style="font-size: 0.84rem;">
                <thead>
                  <tr>
                    <th class="ps-3" style="width: 50px;">#</th>
                    <th>${t("Colaborador Identificado", "Identified Staff")}</th>
                    <th>${t("Departamento", "Department")}</th>
                    <th class="text-center" style="width: 140px;">${t("Hora Chegada", "Arrival Time")}</th>
                    <th class="text-center">${t("Classificação", "Punctuality Status")}</th>
                    <th class="text-center">${t("Atraso", "Delay")}</th>
                    <th>${t("Texto Original", "Raw Text")}</th>
                  </tr>
                </thead>
                <tbody>
                  ${recs.map(function (r, idx) {
                    return `
                      <tr class="${r.is_late ? "att-row-late" : ""}">
                        <td class="ps-3 font-monospace text-secondary">${idx + 1}</td>
                        <td>
                          <div class="d-flex align-items-center gap-2">
                            <div class="att-avatar" style="width: 28px; height: 28px; font-size: 0.75rem; background: rgba(212,175,55,0.15); color: #d4af37; border-color: rgba(212,175,55,0.3);">
                              ${(r.employee_name || "S").slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div class="fw-semibold text-white">${r.employee_full_name || r.employee_name}</div>
                              <span class="text-secondary" style="font-size: 0.7rem;">${r.role || "Staff Member"}</span>
                            </div>
                          </div>
                        </td>
                        <td><span class="badge bg-secondary-subtle text-secondary" style="font-size: 0.7rem;">${r.department || "CESTAFF"}</span></td>
                        <td class="text-center">
                          <input type="time" class="form-control form-control-sm text-center font-monospace parsed-checkin-edit" data-record-index="${idx}" value="${r.check_in || ""}" style="max-width: 110px; margin: 0 auto;">
                        </td>
                        <td class="text-center" id="statusBadgeCell-${idx}">${getStatusBadge(r.status, r.delay_minutes)}</td>
                        <td class="text-center font-monospace small" id="delayCell-${idx}">
                          ${r.delay_minutes > 0 ? `<span class="text-danger fw-bold">+${r.delay_minutes}m</span>` : (r.is_present ? `<span class="text-success"><i class="bi bi-check"></i> 0m</span>` : `<span class="text-secondary">--</span>`)}
                        </td>
                        <td><span class="text-secondary small font-monospace" style="font-size: 0.72rem;">${r.raw_line || ""}</span></td>
                      </tr>
                    `;
                  }).join("")}
                </tbody>
              </table>
            </div>
          </div>
        `;
      }

      return `
        ${modeToggleHtml}
        ${previewSectionHtml}

        <div class="att-card p-4">
          <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
            <div>
              <h5 class="h6 fw-bold text-white mb-1"><i class="bi bi-chat-quote-fill text-success me-2"></i>${t("Colar Mensagem do WhatsApp", "Paste WhatsApp Message")}</h5>
              <span class="text-secondary small">${t("Cole diretamente o texto copiado da conversa do WhatsApp.", "Paste the text directly from the WhatsApp group or chat.")}</span>
            </div>
            <div class="d-flex align-items-center gap-2">
              <button type="button" class="btn btn-xs btn-outline-info" id="insertSampleWhatsAppTextBtn">
                <i class="bi bi-magic me-1"></i>${t("Carregar Exemplo (01/10/2026)", "Load Sample (01/10/2026)")}
              </button>
            </div>
          </div>

          <div class="row g-3 mb-3">
            <div class="col-12 col-md-4">
              <label class="form-label text-secondary small fw-semibold">${t("Data do Relatório (Fallback)", "Report Date (Fallback)")}</label>
              <input type="date" class="form-control form-control-sm" id="whatsAppDateFallbackInput" value="${targetDate}">
              <div class="form-text text-secondary" style="font-size: 0.7rem;">${t("Se o texto contiver a data (ex: 01/10/2026), ela é detectada automaticamente.", "If text contains a date (e.g. 01/10/2026), it is detected automatically.")}</div>
            </div>
          </div>

          <div class="mb-3">
            <textarea class="form-control font-monospace" id="whatsAppRawTextInput" rows="10" placeholder="${t("Cole aqui a mensagem do WhatsApp com as chegadas...\nExemplo:\nRelatório diário de chegada 01/10/2026\n1. Janet Marquel (8:30) 🟢\n2. Leopold Kusi (8:30) 🟢\n3. Deacon Oliver (8:38) 🚨\n...", "Paste WhatsApp message here...")}">${rawText}</textarea>
          </div>

          <div class="d-flex flex-wrap align-items-center justify-content-between gap-2">
            <span class="text-secondary small">
              <i class="bi bi-info-circle me-1 text-gold"></i>${t("Compatível com emojis 🟢, 🚨, formatos (8:30), (08:30), 8h30 e nomes de todo o corpo de staff.", "Supports emojis, punch formats (8:30) and all staff member names.")}
            </span>
            <div class="d-flex align-items-center gap-2">
              <button type="button" class="btn btn-sm btn-outline-secondary" id="clearWhatsAppRawTextBtn">
                <i class="bi bi-x-circle me-1"></i>${t("Limpar", "Clear")}
              </button>
              <button type="button" class="btn btn-sm btn-ce-gold px-3" id="parseWhatsAppTextBtn">
                <i class="bi bi-cpu-fill me-1.5"></i>${t("Analisar e Processar Chegadas", "Parse & Process Arrivals")}
              </button>
            </div>
          </div>
        </div>
      `;
    } else {
      // Manual Grid View
      return `
        ${modeToggleHtml}

        <div class="att-card p-4">
          <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3 pb-3 border-bottom border-secondary border-opacity-25">
            <div>
              <h5 class="h6 fw-bold text-white mb-1"><i class="bi bi-grid-3x3-gap-fill text-gold me-2"></i>${t("Matriz de Marcação Rápida por Colaborador", "Direct Staff Punch Matrix")}</h5>
              <span class="text-secondary small">${t("Sincronizado dinamicamente com o módulo de Recursos Humanos.", "Dynamically synchronized with the Staff & HR module.")}</span>
            </div>

            <div class="d-flex flex-wrap align-items-center gap-2">
              <div class="d-flex align-items-center gap-1">
                <label class="text-secondary small me-1">${t("Data:", "Date:")}</label>
                <input type="date" class="form-control form-control-sm" id="manualGridDateInput" value="${targetDate}" style="max-width: 145px;">
              </div>
              <button type="button" class="btn btn-xs btn-outline-success" id="fillAllOnTimeGridBtn">
                <i class="bi bi-clock-fill me-1"></i>${t("Todos Pontuais (08:00)", "All On Time (08:00)")}
              </button>
              <button type="button" class="btn btn-xs btn-outline-warning" id="clearAllGridBtn">
                <i class="bi bi-eraser-fill me-1"></i>${t("Limpar Todos", "Clear All")}
              </button>
              <button type="button" class="btn btn-sm btn-success px-3" id="saveManualGridAttendanceBtn">
                <i class="bi bi-check2-circle me-1.5"></i>${t("Gravar no Sistema", "Save Attendance")}
              </button>
            </div>
          </div>

          <div class="table-responsive rounded border border-secondary border-opacity-25" style="max-height: 520px;">
            <table class="table att-table align-middle mb-0" style="font-size: 0.84rem;">
              <thead class="sticky-top">
                <tr>
                  <th class="ps-3" style="width: 50px;">#</th>
                  <th>${t("Colaborador / Cargo", "Staff / Role")}</th>
                  <th>${t("Departamento", "Department")}</th>
                  <th class="text-center" style="width: 140px;">${t("Hora de Entrada", "Check-In")}</th>
                  <th>${t("Predefinições Rápidas", "Quick Presets")}</th>
                  <th class="text-center" style="width: 110px;">${t("Status", "Status")}</th>
                  <th class="text-center" style="width: 100px;">${t("Presente?", "Present?")}</th>
                </tr>
              </thead>
              <tbody>
                ${staffList.map(function (st, idx) {
                  return `
                    <tr class="manual-grid-row" data-staff-id="${st.id}" data-staff-name="${st.name}" data-staff-fullname="${st.fullName}" data-staff-dept="${st.dept}" data-staff-role="${st.role}">
                      <td class="ps-3 font-monospace text-secondary">${idx + 1}</td>
                      <td>
                        <div class="d-flex align-items-center gap-2">
                          <div class="att-avatar" style="width: 28px; height: 28px; font-size: 0.75rem; background: rgba(212,175,55,0.15); color: #d4af37; border-color: rgba(212,175,55,0.3);">
                            ${(st.name || "S").slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div class="fw-semibold text-white">${st.fullName || st.name}</div>
                            <span class="text-secondary" style="font-size: 0.7rem;">${st.role || "Staff Member"}</span>
                          </div>
                        </div>
                      </td>
                      <td><span class="badge bg-secondary-subtle text-secondary" style="font-size: 0.7rem;">${st.dept || "CESTAFF"}</span></td>
                      <td class="text-center">
                        <input type="time" class="form-control form-control-sm font-monospace text-center manual-time-input" data-row-index="${idx}" value="08:00" style="max-width: 110px; margin: 0 auto;">
                      </td>
                      <td>
                        <div class="btn-group btn-group-sm">
                          <button type="button" class="btn btn-xs btn-outline-secondary quick-preset-btn" data-row-index="${idx}" data-time="07:45">07:45</button>
                          <button type="button" class="btn btn-xs btn-outline-secondary quick-preset-btn" data-row-index="${idx}" data-time="08:00">08:00</button>
                          <button type="button" class="btn btn-xs btn-outline-secondary quick-preset-btn" data-row-index="${idx}" data-time="08:15">08:15</button>
                          <button type="button" class="btn btn-xs btn-outline-secondary quick-preset-btn" data-row-index="${idx}" data-time="08:30">08:30</button>
                          <button type="button" class="btn btn-xs btn-outline-secondary quick-preset-btn" data-row-index="${idx}" data-time="08:45">08:45</button>
                          <button type="button" class="btn btn-xs btn-outline-secondary quick-preset-btn" data-row-index="${idx}" data-time="09:00">09:00</button>
                        </div>
                      </td>
                      <td class="text-center" id="gridStatusBadge-${idx}">
                        <span class="badge rounded-pill bg-success-subtle text-success border border-success border-opacity-25 px-2 py-1"><i class="bi bi-check-circle-fill me-1"></i>${t("Pontual", "On Time")}</span>
                      </td>
                      <td class="text-center">
                        <div class="form-check form-switch d-inline-block">
                          <input class="form-check-input manual-present-toggle" type="checkbox" data-row-index="${idx}" checked>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join("")}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }
  }

  // =========================================================================
  // Tab 6: Upload & Biometric Parser View
  // =========================================================================

  async function renderUploadViewHtml() {
    var uploadsRes = await getBridge().listUploads();
    var uploads = uploadsRes.data || [];
    var preview = attendancePageState.uploadPreview;

    var previewHtml = "";
    if (preview && preview.records && preview.records.length) {
      previewHtml = `
        <div class="att-card p-4 mb-4 border-warning border-opacity-40" id="uploadPreviewSection">
          <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
            <div>
              <span class="badge bg-warning-subtle text-warning mb-1"><i class="bi bi-eye me-1"></i>${t("Pré-visualização da Importação", "Import Preview")}</span>
              <h4 class="h5 fw-bold mb-0 text-white">${preview.filename}</h4>
              <p class="text-secondary small mb-0">${t("Criado pelo dispositivo:", "Created by device:")} <strong>${preview.createTime}</strong> • ${t("Total:", "Total:")} <strong>${preview.records.length} ${t("registos", "records")}</strong></p>
            </div>
            <div class="d-flex align-items-center gap-2">
              <button type="button" class="btn btn-outline-secondary btn-sm" id="cancelUploadPreviewBtn">${t("Descartar", "Discard")}</button>
              <button type="button" class="btn btn-ce-gold btn-sm" id="confirmSaveUploadBtn">
                <i class="bi bi-check-lg me-1.5"></i>${t("Confirmar e Gravar no Sistema", "Confirm and Save to System")}
              </button>
            </div>
          </div>

          <div class="row g-2 mb-3">
            <div class="col-6 col-md-3">
              <div class="p-2.5 rounded border border-secondary border-opacity-25 text-center">
                <span class="text-secondary small d-block" style="font-size: 0.7rem;">${t("PRESENTES", "PRESENT")}</span>
                <span class="fs-6 fw-bold text-info">${preview.stats.present}</span>
              </div>
            </div>
            <div class="col-6 col-md-3">
              <div class="p-2.5 rounded border border-secondary border-opacity-25 text-center">
                <span class="text-secondary small d-block" style="font-size: 0.7rem;">${t("NO HORÁRIO", "ON TIME")}</span>
                <span class="fs-6 fw-bold text-success">${preview.stats.on_time}</span>
              </div>
            </div>
            <div class="col-6 col-md-3">
              <div class="p-2.5 rounded border border-secondary border-opacity-25 text-center">
                <span class="text-secondary small d-block" style="font-size: 0.7rem;">${t("EM ATRASO", "LATE")}</span>
                <span class="fs-6 fw-bold text-danger">${preview.stats.minor_delay + preview.stats.late + preview.stats.severe_delay}</span>
              </div>
            </div>
            <div class="col-6 col-md-3">
              <div class="p-2.5 rounded border border-secondary border-opacity-25 text-center">
                <span class="text-secondary small d-block" style="font-size: 0.7rem;">${t("SEM REGISTO / FALTAS", "NO RECORD / ABSENT")}</span>
                <span class="fs-6 fw-bold text-secondary">${preview.stats.absent}</span>
              </div>
            </div>
          </div>

          <div class="table-responsive border border-secondary border-opacity-25 rounded" style="max-height: 380px;">
            <table class="table att-table table-sm align-middle mb-0" style="font-size: 0.8rem;">
              <thead class="sticky-top">
                <tr>
                  <th class="ps-3">ID</th>
                  <th>${t("Funcionário", "Employee")}</th>
                  <th>${t("Data", "Date")}</th>
                  <th class="text-center">${t("Entrada", "Check-In")}</th>
                  <th class="text-center">${t("Classificação", "Status")}</th>
                  <th class="text-center">${t("Atraso", "Delay")}</th>
                  <th>${t("Picagens", "Punches")}</th>
                </tr>
              </thead>
              <tbody>
                ${preview.records.slice(0, 50).map(function (rec) {
                  return `
                    <tr>
                      <td class="ps-3 font-monospace text-secondary">${rec.employee_id}</td>
                      <td class="fw-semibold text-white">${rec.employee_name}</td>
                      <td class="font-monospace text-secondary">${rec.attendance_date}</td>
                      <td class="text-center font-monospace ${rec.is_late ? "text-danger fw-bold" : "text-white"}">${rec.check_in || "--:--"}</td>
                      <td class="text-center">${getStatusBadge(rec.status, rec.delay_minutes)}</td>
                      <td class="text-center">${formatDelay(rec.delay_minutes)}</td>
                      <td class="text-secondary small font-monospace" style="font-size: 0.76rem;">${(rec.all_punches || "--:--").replace(/\n/g, " | ")}</td>
                    </tr>`;
                }).join("")}
              </tbody>
            </table>
          </div>
        </div>`;
    }

    var uploadFormHtml = `
      <div class="att-card p-4 mb-4">
        <h5 class="h6 fw-bold mb-3 text-white"><i class="bi bi-cloud-arrow-up text-gold me-2"></i>${t("Carregar Relatório Diário / Mensal da Máquina Biométrica", "Upload Biometric Attendance File")}</h5>
        <p class="text-secondary small mb-3">
          ${t("Arraste e solte ou selecione o ficheiro Excel (.xlsx, .xls) ou CSV extraído pelo Brother Lio para o grupo Paixão à Primeira Vista.", "Drag and drop or select Excel/CSV file extracted by Brother Lio for Paixão à Primeira Vista.")}
        </p>

        <div class="upload-dropzone p-5 text-center rounded border-2 border-dashed border-secondary border-opacity-50" id="biometricDropzone" style="cursor: pointer; transition: all 0.2s;">
          <input type="file" id="biometricFileInput" class="d-none" accept=".xlsx, .xls, .csv, .txt">
          <i class="bi bi-file-earmark-spreadsheet text-gold fs-1 d-block mb-3"></i>
          <h5 class="fw-semibold mb-1 text-white">${t("Clique para selecionar ou arraste o ficheiro Excel aqui", "Click to select or drag Excel file here")}</h5>
          <p class="text-muted small mb-0">${t("Suporta relatórios diários e matrizes mensais extraídas dos terminais biométricos", "Supports daily logs and monthly punch matrices")}</p>
        </div>
      </div>`;

    var historyHtml = `
      <div class="att-card overflow-hidden">
        <div class="att-card-header">
          <h5 class="h6 mb-0 fw-bold text-white"><i class="bi bi-clock-history text-gold me-2"></i>${t("Histórico de Ficheiros Importados", "Imported Files History")}</h5>
        </div>
        <div class="table-responsive">
          <table class="table att-table align-middle mb-0">
            <thead>
              <tr>
                <th class="ps-3">${t("Data de Upload", "Upload Date")}</th>
                <th>${t("Nome do Ficheiro", "Filename")}</th>
                <th>${t("Data do Relatório", "Report Date")}</th>
                <th class="text-center">${t("Total Registos", "Total Records")}</th>
                <th class="text-center">${t("Presentes", "Present")}</th>
                <th class="text-center">${t("Atrasos", "Late")}</th>
                <th class="text-center">${t("Faltas", "Absent")}</th>
                <th class="text-end pe-3">${t("Utilizador", "Uploaded By")}</th>
              </tr>
            </thead>
            <tbody>
              ${uploads.length ? uploads.map(function (u) {
                return `
                  <tr>
                    <td class="ps-3 font-monospace text-secondary">${u.upload_date || u.created_at?.slice(0, 10)}</td>
                    <td class="fw-semibold text-white"><i class="bi bi-file-earmark-excel text-success me-1.5"></i>${u.filename}</td>
                    <td class="text-secondary small">${u.device_create_time || "—"}</td>
                    <td class="text-center"><span class="badge bg-secondary-subtle text-secondary border border-secondary border-opacity-25">${u.record_count}</span></td>
                    <td class="text-center text-info">${u.present_count}</td>
                    <td class="text-center text-danger fw-bold">${u.late_count}</td>
                    <td class="text-center text-secondary">${u.absent_count}</td>
                    <td class="text-end pe-3 text-secondary small">${u.uploaded_by || "Admin"}</td>
                  </tr>`;
              }).join("") : `<tr><td colspan="8" class="text-center py-4 text-muted">${t("Nenhum upload registado anteriormente.", "No previous uploads recorded.")}</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>`;

    return previewHtml + uploadFormHtml + historyHtml;
  }

  // =========================================================================
  // Tab 7: Reports & PDF Exports
  // =========================================================================

  async function renderReportsViewHtml() {
    var date = attendancePageState.selectedDate || "2026-07-09";
    var start = attendancePageState.startDate || "2026-07-01";
    var end = attendancePageState.endDate || "2026-07-31";

    return `
      <div class="row g-4">
        <!-- Relatório Diário -->
        <div class="col-12 col-md-6">
          <div class="att-card p-4 h-100 d-flex flex-column">
            <div class="d-flex align-items-center gap-3 mb-3">
              <div class="att-avatar" style="width: 44px; height: 44px; font-size: 1.2rem; background: rgba(212, 175, 55, 0.15); border-color: #d4af37; color: #d4af37;">
                <i class="bi bi-file-earmark-pdf"></i>
              </div>
              <div>
                <h5 class="h6 fw-bold mb-0 text-white">${t("Relatório Diário de Assiduidade", "Daily Attendance Report")}</h5>
                <span class="text-secondary small">${t("Dossiê de presenças e atrasos de um dia específico", "Attendance and delay dossier for a specific date")}</span>
              </div>
            </div>
            <div class="mb-3">
              <label class="form-label text-secondary small">${t("Data do Relatório:", "Report Date:")}</label>
              <input type="date" class="form-control form-control-sm" id="reportDailyDateInput" value="${date}">
            </div>
            <div class="mt-auto d-flex gap-2">
              <button type="button" class="btn btn-sm btn-ce-gold w-100" id="generateDailyPdfBtn">
                <i class="bi bi-printer me-1.5"></i>${t("Gerar PDF Oficial", "Generate Official PDF")}
              </button>
              <button type="button" class="btn btn-sm btn-outline-secondary" id="attendanceExportDailyCsv">
                <i class="bi bi-file-earmark-excel text-success me-1"></i>Excel / CSV
              </button>
            </div>
          </div>
        </div>

        <!-- Relatório Periódico / Mensal -->
        <div class="col-12 col-md-6">
          <div class="att-card p-4 h-100 d-flex flex-column">
            <div class="d-flex align-items-center gap-3 mb-3">
              <div class="att-avatar" style="width: 44px; height: 44px; font-size: 1.2rem; background: rgba(56, 189, 248, 0.15); border-color: #38bdf8; color: #38bdf8;">
                <i class="bi bi-file-earmark-bar-graph"></i>
              </div>
              <div>
                <h5 class="h6 fw-bold mb-0 text-white">${t("Relatório Mensal / Periódico Consolidado", "Consolidated Monthly / Periodic Report")}</h5>
                <span class="text-secondary small">${t("Taxa de pontualidade, top atrasos e horas acumuladas", "Punctuality rate, top late staff and accumulated delay")}</span>
              </div>
            </div>
            <div class="row g-2 mb-3">
              <div class="col-6">
                <label class="form-label text-secondary small">${t("Data Inicial:", "Start Date:")}</label>
                <input type="date" class="form-control form-control-sm" id="reportPeriodStartInput" value="${start}">
              </div>
              <div class="col-6">
                <label class="form-label text-secondary small">${t("Data Final:", "End Date:")}</label>
                <input type="date" class="form-control form-control-sm" id="reportPeriodEndInput" value="${end}">
              </div>
            </div>
            <div class="mt-auto d-flex gap-2">
              <button type="button" class="btn btn-sm btn-ce-gold w-100" id="generatePeriodPdfBtn">
                <i class="bi bi-printer me-1.5"></i>${t("Gerar PDF Mensal", "Generate Monthly PDF")}
              </button>
            </div>
          </div>
        </div>
      </div>`;
  }

  // =========================================================================
  // Tab 8: Settings (Configurações de Horário e Tolerância)
  // =========================================================================

  async function renderSettingsViewHtml() {
    var res = await getBridge().getAttendanceSettings();
    var s = res.data;

    return `
      <div class="att-card p-4 mb-4" style="max-width: 800px;">
        <h5 class="h6 fw-bold mb-3 text-white"><i class="bi bi-sliders text-gold me-2"></i>${t("Parâmetros de Horário e Regras de Pontualidade", "Schedule Parameters & Punctuality Rules")}</h5>
        <p class="text-secondary small mb-4">
          ${t("Defina o horário oficial de entrada da igreja, tempo de tolerância e escalões de atraso para classificação automática das picagens biométricas.", "Set church standard arrival time, grace period and delay brackets for automated biometric calculation.")}
        </p>

        <form id="attendanceSettingsForm">
          <div class="row g-3 mb-3">
            <div class="col-12 col-md-6">
              <label class="form-label text-secondary small fw-semibold">${t("Horário Oficial de Entrada (Padrão: 08:30)", "Standard Check-In Time (Default: 08:30)")}</label>
              <input type="time" class="form-control" name="standard_start_time" value="${s.standard_start_time || "08:30"}" required>
            </div>

            <div class="col-12 col-md-6">
              <label class="form-label text-secondary small fw-semibold">${t("Minutos de Tolerância (Grace Period)", "Grace Period Minutes")}</label>
              <input type="number" class="form-control" name="grace_period_minutes" value="${s.grace_period_minutes != null ? s.grace_period_minutes : 0}" min="0" max="60" required>
            </div>

            <div class="col-12 col-md-6">
              <label class="form-label text-secondary small fw-semibold">${t("Limite Atraso Ligeiro (Minutos)", "Minor Delay Threshold (Minutes)")}</label>
              <input type="number" class="form-control" name="minor_delay_threshold_minutes" value="${s.minor_delay_threshold_minutes || 30}" min="15" max="120" required>
            </div>

            <div class="col-12 col-md-6">
              <label class="form-label text-secondary small fw-semibold">${t("Limite Atraso Grave (Minutos)", "Severe Delay Threshold (Minutes)")}</label>
              <input type="number" class="form-control" name="severe_delay_threshold_minutes" value="${s.severe_delay_threshold_minutes || 60}" min="30" max="240" required>
            </div>

            <div class="col-12 col-md-6">
              <label class="form-label text-secondary small fw-semibold">${t("Horário de Saída Previsto (Padrão: 17:00)", "Expected Departure Time (Default: 17:00)")}</label>
              <input type="time" class="form-control" name="standard_end_time" value="${s.standard_end_time || "17:00"}">
            </div>
          </div>

          <div class="d-flex align-items-center justify-content-end gap-2 mt-4 pt-3 border-top border-secondary border-opacity-25">
            <button type="submit" class="btn btn-ce-gold"><i class="bi bi-save me-1.5"></i>${t("Gravar Configurações", "Save Settings")}</button>
          </div>
        </form>
      </div>`;
  }

  // =========================================================================
  // PDF Generation Engines
  // =========================================================================

  async function generateDailyPdf(targetDate) {
    var date = targetDate || attendancePageState.selectedDate || "2026-07-09";
    var res = await getBridge().listAttendanceRecords({ date: date });
    var records = res.data || [];
    var settingsRes = await getBridge().getAttendanceSettings();
    var set = settingsRes.data;

    var present = records.filter(function (r) { return r.is_present; });
    var onTime = records.filter(function (r) { return r.status === "on_time"; });
    var grace = records.filter(function (r) { return r.status === "grace_period"; });
    var late = records.filter(function (r) { return r.is_late; });

    var tableRowsHtml = records.map(function (r) {
      var statusText = r.status === "on_time" ? t("Pontual", "On Time") : r.status === "grace_period" ? `${t("Tolerância", "Grace")} (+${r.delay_minutes}m)` : r.is_late ? `${t("Atrasado", "Late")} (+${r.delay_minutes}m)` : t("Sem Registo", "No Record");
      var statusColor = r.status === "on_time" ? "#198754" : r.status === "grace_period" ? "#0dcaf0" : r.is_late ? "#dc3545" : "#6c757d";
      var staffDisplayName = resolveStaffFullName(r, r.employee_full_name || r.employee_name);
      return `
        <tr>
          <td style="padding: 6px 8px; border: 1px solid #ddd; font-family: monospace;">${r.employee_id}</td>
          <td style="padding: 6px 8px; border: 1px solid #ddd; font-weight: bold;">${staffDisplayName}</td>
          <td style="padding: 6px 8px; border: 1px solid #ddd;">${r.department || "CESTAFF"}</td>
          <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: center; font-family: monospace;">${r.check_in || "--:--"}</td>
          <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: center; color: ${statusColor}; font-weight: bold;">${statusText}</td>
          <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: center;">${r.delay_minutes > 0 ? `+${r.delay_minutes} min` : "0 min"}</td>
          <td style="padding: 6px 8px; border: 1px solid #ddd; font-size: 10px; font-family: monospace;">${(r.all_punches || "--:--").replace(/\n/g, " | ")}</td>
        </tr>`;
    }).join("");

    var printHtml = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; padding: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #c5a059; padding-bottom: 12px; margin-bottom: 15px;">
          <div>
            <h1 style="margin: 0; font-size: 18px; color: #0b1f3f; text-transform: uppercase;">Christ Embassy Mozambique</h1>
            <h2 style="margin: 3px 0 0 0; font-size: 14px; color: #c5a059;">${t("Relatório Diário de Assiduidade e Pontualidade", "Daily Staff Attendance & Punctuality Report")}</h2>
          </div>
          <div style="text-align: right; font-size: 11px; color: #666;">
            <div><strong>${t("Data do Relatório:", "Report Date:")}</strong> ${formatAttendanceDate(date)}</div>
            <div><strong>${t("Horário Padrão:", "Standard Time:")}</strong> ${set.standard_start_time || "08:00"} (Tol: ${set.grace_period_minutes}m)</div>
            <div><strong>${t("Gerado em:", "Generated at:")}</strong> ${new Date().toLocaleString(isEn() ? "en-US" : "pt-PT")}</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px;">
          <div style="background: #f8f9fa; border: 1px solid #ddd; padding: 10px; border-radius: 4px; text-align: center;">
            <div style="font-size: 11px; color: #666;">${t("TOTAL REGISTADOS", "TOTAL REGISTERED")}</div>
            <div style="font-size: 18px; font-weight: bold; color: #0b1f3f;">${records.length}</div>
          </div>
          <div style="background: #f8f9fa; border: 1px solid #ddd; padding: 10px; border-radius: 4px; text-align: center;">
            <div style="font-size: 11px; color: #666;">${t("PRESENTES", "PRESENT")}</div>
            <div style="font-size: 18px; font-weight: bold; color: #0dcaf0;">${present.length}</div>
          </div>
          <div style="background: #f8f9fa; border: 1px solid #ddd; padding: 10px; border-radius: 4px; text-align: center;">
            <div style="font-size: 11px; color: #666;">${t("PONTUAIS / TOLERÂNCIA", "ON TIME / GRACE")}</div>
            <div style="font-size: 18px; font-weight: bold; color: #198754;">${onTime.length + grace.length}</div>
          </div>
          <div style="background: #f8f9fa; border: 1px solid #ddd; padding: 10px; border-radius: 4px; text-align: center;">
            <div style="font-size: 11px; color: #666;">${t("EM ATRASO", "LATE")}</div>
            <div style="font-size: 18px; font-weight: bold; color: #dc3545;">${late.length}</div>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 30px;">
          <thead>
            <tr style="background: #0b1f3f; color: white;">
              <th style="padding: 8px; border: 1px solid #0b1f3f;">ID</th>
              <th style="padding: 8px; border: 1px solid #0b1f3f; text-align: left;">${t("Funcionário", "Staff Member")}</th>
              <th style="padding: 8px; border: 1px solid #0b1f3f; text-align: left;">${t("Departamento", "Department")}</th>
              <th style="padding: 8px; border: 1px solid #0b1f3f;">${t("Entrada", "Check-In")}</th>
              <th style="padding: 8px; border: 1px solid #0b1f3f;">${t("Status", "Status")}</th>
              <th style="padding: 8px; border: 1px solid #0b1f3f;">${t("Atraso", "Delay")}</th>
              <th style="padding: 8px; border: 1px solid #0b1f3f; text-align: left;">${t("Picagens Brutas", "Raw Punches")}</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>

        <div style="display: flex; justify-content: space-between; margin-top: 40px; padding-top: 15px;">
          <div style="text-align: center; width: 220px; border-top: 1px solid #999; padding-top: 5px; font-size: 11px;">
            ${t("Brother Leopold Kusi (Extração)", "Brother Leopold Kusi (Extraction)")}
          </div>
          <div style="text-align: center; width: 220px; border-top: 1px solid #999; padding-top: 5px; font-size: 11px;">
            ${t("Pastor Valdemiro (Cuidados Pastorais)", "Pastor Valdemiro (Pastoral Care)")}
          </div>
          <div style="text-align: center; width: 220px; border-top: 1px solid #999; padding-top: 5px; font-size: 11px;">
            ${t("Pastor Kéne (Pastor do Grupo)", "Pastor Kéne (Group Pastor)")}
          </div>
        </div>
      </div>`;

    openAttendancePrintModal(
      `${t("Relatório Diário", "Daily Report")} — ${formatAttendanceDate(date)}`,
      printHtml,
      `Relatorio-Assiduidade-${date}`,
      records
    );
  }

  async function generatePeriodPdf(start, end) {
    var stats = await getBridge().getAggregatePeriodStats(start, end);

    var rowsHtml = stats.employeesList.map(function (emp) {
      var staffDisplayName = resolveStaffFullName(emp, emp.employee_full_name || emp.employee_name);
      return `
        <tr>
          <td style="padding: 6px 8px; border: 1px solid #ddd; font-family: monospace;">${emp.employee_id}</td>
          <td style="padding: 6px 8px; border: 1px solid #ddd; font-weight: bold;">${staffDisplayName}</td>
          <td style="padding: 6px 8px; border: 1px solid #ddd;">${emp.department}</td>
          <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: center;">${emp.presentDays} / ${emp.totalDays}</td>
          <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: center; color: ${emp.onTimeRate >= 80 ? "#198754" : "#dc3545"}; font-weight: bold;">${emp.onTimeRate}%</td>
          <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: center;">${emp.lateDays} ${t("dias", "days")}</td>
          <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: center; font-family: monospace; color: #dc3545;">${emp.totalDelayMins}m</td>
          <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: center; font-family: monospace;">${emp.avgCheckInTime}</td>
        </tr>`;
    }).join("");

    var printHtml = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; padding: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #c5a059; padding-bottom: 12px; margin-bottom: 15px;">
          <div>
            <h1 style="margin: 0; font-size: 18px; color: #0b1f3f; text-transform: uppercase;">Christ Embassy Mozambique</h1>
            <h2 style="margin: 3px 0 0 0; font-size: 14px; color: #c5a059;">${t("Relatório Periódico Consolidado de Assiduidade", "Consolidated Periodic Staff Attendance Report")}</h2>
          </div>
          <div style="text-align: right; font-size: 11px; color: #666;">
            <div><strong>${t("Período:", "Period:")}</strong> ${formatAttendanceDate(start)} ${t("até", "to")} ${formatAttendanceDate(end)}</div>
            <div><strong>${t("Gerado em:", "Generated at:")}</strong> ${new Date().toLocaleString(isEn() ? "en-US" : "pt-PT")}</div>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 30px;">
          <thead>
            <tr style="background: #0b1f3f; color: white;">
              <th style="padding: 8px; border: 1px solid #0b1f3f;">ID</th>
              <th style="padding: 8px; border: 1px solid #0b1f3f; text-align: left;">${t("Funcionário", "Staff Member")}</th>
              <th style="padding: 8px; border: 1px solid #0b1f3f; text-align: left;">${t("Departamento", "Department")}</th>
              <th style="padding: 8px; border: 1px solid #0b1f3f;">${t("Presenças", "Presences")}</th>
              <th style="padding: 8px; border: 1px solid #0b1f3f;">${t("Pontualidade", "Punctuality")}</th>
              <th style="padding: 8px; border: 1px solid #0b1f3f;">${t("Atrasos", "Late Days")}</th>
              <th style="padding: 8px; border: 1px solid #0b1f3f;">${t("Total Atraso", "Total Delay")}</th>
              <th style="padding: 8px; border: 1px solid #0b1f3f;">${t("Hora Média", "Avg Time")}</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>`;

    openAttendancePrintModal(
      `${t("Relatório Periódico", "Periodic Report")} (${start} - ${end})`,
      printHtml,
      `Relatorio-Periodico-${start}-${end}`,
      stats.employeesList
    );
  }

  async function generateStaffDossierPdf(staffId) {
    var trajectory = await getBridge().getStaffTrajectory(staffId, "2026-01-01", "2026-12-31");
    var sName = resolveStaffFullName(trajectory, trajectory.employee_full_name || trajectory.employee_name || "Colaborador");

    var rowsHtml = trajectory.records.map(function (rec) {
      var statusBadge = rec.status === "on_time" 
        ? `<span style="color: #198754; font-weight: bold;">● ${t("Pontual", "On Time")}</span>` 
        : rec.status === "grace_period" 
        ? `<span style="color: #0dcaf0; font-weight: bold;">● ${t("Tolerância", "Grace")}</span>` 
        : rec.is_late 
        ? `<span style="color: #dc3545; font-weight: bold;">● ${t("Atrasado", "Late")}</span>` 
        : `<span style="color: #6c757d;">— ${t("Sem Registo", "No Record")}</span>`;

      return `
        <tr>
          <td style="padding: 6px 8px; border: 1px solid #ddd; font-family: monospace; font-weight: 600;">${rec.attendance_date}</td>
          <td style="padding: 6px 8px; border: 1px solid #ddd; color: #555;">${getWeekday(rec.attendance_date)}</td>
          <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: center; font-family: monospace; font-weight: bold; ${rec.is_late ? "color: #dc3545;" : ""}">${rec.check_in || "--:--"}</td>
          <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: center;">${statusBadge}</td>
          <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: center; font-weight: 600; ${rec.delay_minutes > 0 ? "color: #dc3545;" : "color: #198754;"}">${rec.delay_minutes > 0 ? `+${rec.delay_minutes} min` : "0 min"}</td>
          <td style="padding: 6px 8px; border: 1px solid #ddd; font-size: 10px; font-family: monospace; color: #444;">${(rec.all_punches || "--:--").replace(/\n/g, " | ")}</td>
          <td style="padding: 6px 8px; border: 1px solid #ddd; font-size: 10px; color: #666;">${rec.notes || "—"}</td>
        </tr>`;
    }).join("");

    var printHtml = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; padding: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #c5a059; padding-bottom: 12px; margin-bottom: 18px;">
          <div>
            <div style="font-size: 11px; font-weight: bold; color: #c5a059; letter-spacing: 0.08em; text-transform: uppercase;">Christ Embassy Mozambique • LoveWorld</div>
            <h2 style="margin: 3px 0 0 0; font-size: 18px; color: #0b1f3f; font-weight: 800;">${t("DOSSIÊ INDIVIDUAL DE ASSIDUIDADE", "INDIVIDUAL ATTENDANCE DOSSIER")}</h2>
            <div style="font-size: 12px; color: #555; margin-top: 2px;">${t("Relatório Oficial de Trajetória, Pontualidade & Disciplina Horária", "Official Trajectory, Punctuality & Time Discipline Report")}</div>
          </div>
          <div style="text-align: right; font-size: 11px; color: #666;">
            <div><strong>${t("Data de Emissão:", "Issue Date:")}</strong> ${new Date().toLocaleDateString(isEn() ? "en-US" : "pt-PT")}</div>
            <div><strong>${t("Ano de Referência:", "Reference Year:")}</strong> 2026</div>
            <div style="color: #198754; font-weight: bold; margin-top: 3px;">✓ ${t("Auditado & Homologado", "Audited & Approved")}</div>
          </div>
        </div>

        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px;">
          <div>
            <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.05em;">${t("Colaborador Selecionado", "Selected Staff Member")}</div>
            <h3 style="margin: 2px 0 2px 0; color: #0b1f3f; font-size: 18px; font-weight: 800;">${sName}</h3>
            <div style="font-size: 12px; color: #475569;">
              ${t("ID / Cartão:", "ID / Card:")} <strong style="font-family: monospace; color: #0b1f3f;">${trajectory.employee_id}</strong> • ${t("Departamento:", "Department:")} <strong>${trajectory.department}</strong>
            </div>
          </div>
          <div style="display: flex; gap: 12px;">
            <div style="text-align: center; background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 12px; min-width: 90px;">
              <div style="font-size: 9px; color: #64748b; font-weight: bold; text-transform: uppercase;">${t("PONTUALIDADE", "PUNCTUALITY")}</div>
              <div style="font-size: 16px; font-weight: 800; color: ${trajectory.onTimeRate >= 80 ? "#16a34a" : trajectory.onTimeRate >= 60 ? "#d97706" : "#dc2626"};">${trajectory.onTimeRate}%</div>
            </div>
            <div style="text-align: center; background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 12px; min-width: 90px;">
              <div style="font-size: 9px; color: #64748b; font-weight: bold; text-transform: uppercase;">${t("MÉDIA ENTRADA", "AVG CHECK-IN")}</div>
              <div style="font-size: 16px; font-weight: 800; color: #0284c7; font-family: monospace;">${trajectory.avgCheckInTime || "--:--"}</div>
            </div>
            <div style="text-align: center; background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 12px; min-width: 90px;">
              <div style="font-size: 9px; color: #64748b; font-weight: bold; text-transform: uppercase;">${t("TOTAL ATRASO", "TOTAL DELAY")}</div>
              <div style="font-size: 16px; font-weight: 800; color: #dc2626; font-family: monospace;">${trajectory.totalDelayMinutes}m</div>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 8px; font-size: 12px; font-weight: bold; color: #0b1f3f;">
          <i class="bi bi-table me-1"></i>${t("Registo Histórico de Picagens de Ponto (Total:", "Historical Check-In Punch Record (Total:")} ${trajectory.records.length} ${t("registos)", "records)")}
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 25px;">
          <thead>
            <tr style="background: #0b1f3f; color: white;">
              <th style="padding: 7px 8px; border: 1px solid #0b1f3f;">${t("Data", "Date")}</th>
              <th style="padding: 7px 8px; border: 1px solid #0b1f3f;">${t("Dia da Semana", "Weekday")}</th>
              <th style="padding: 7px 8px; border: 1px solid #0b1f3f; text-align: center;">${t("Entrada", "Check-In")}</th>
              <th style="padding: 7px 8px; border: 1px solid #0b1f3f; text-align: center;">${t("Classificação", "Status")}</th>
              <th style="padding: 7px 8px; border: 1px solid #0b1f3f; text-align: center;">${t("Atraso", "Delay")}</th>
              <th style="padding: 7px 8px; border: 1px solid #0b1f3f;">${t("Picagens Brutas", "Raw Punches")}</th>
              <th style="padding: 7px 8px; border: 1px solid #0b1f3f;">${t("Observações", "Notes")}</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || `<tr><td colspan="7" style="text-align: center; padding: 20px; color: #888;">${t("Sem registos de assiduidade encontrados para este colaborador.", "No attendance records found for this staff member.")}</td></tr>`}
          </tbody>
        </table>

        <div style="display: flex; justify-content: space-between; margin-top: 35px; padding-top: 15px; font-size: 11px; color: #475569;">
          <div style="text-align: center; width: 190px; border-top: 1px solid #94a3b8; padding-top: 6px;">
            <strong>Brother Leopold Kusi</strong><br><span style="font-size: 10px; color: #64748b;">${t("Extração e Verificação", "Extraction & Verification")}</span>
          </div>
          <div style="text-align: center; width: 190px; border-top: 1px solid #94a3b8; padding-top: 6px;">
            <strong>Pastor Valdemiro</strong><br><span style="font-size: 10px; color: #64748b;">${t("Cuidados Pastorais / Auditoria", "Pastoral Care / Audit")}</span>
          </div>
          <div style="text-align: center; width: 190px; border-top: 1px solid #94a3b8; padding-top: 6px;">
            <strong>Pastor Kéne</strong><br><span style="font-size: 10px; color: #64748b;">${t("Pastor do Grupo / Homologação", "Group Pastor / Approval")}</span>
          </div>
        </div>
      </div>`;

    openAttendancePrintModal(
      `${t("Dossiê Individual", "Staff Dossier")} — ${sName}`,
      printHtml,
      `Dossie-Individual-${trajectory.employee_id}-${sName.replace(/\s+/g, "_")}`,
      trajectory.records
    );
  }

  // =========================================================================
  // Modal Preview & Printable Document Infrastructure
  // =========================================================================

  function openAttendancePrintModal(title, htmlContent, filename, csvData) {
    var modalId = "attendancePreviewPrintModal";
    var existing = document.getElementById("attendancePrintModalWrapper");
    if (existing) existing.remove();

    var modalHtml = `
      <div class="modal fade show d-block" id="${modalId}" tabindex="-1" style="background: rgba(3, 7, 18, 0.85); z-index: 1060; backdrop-filter: blur(4px);" aria-modal="true" role="dialog">
        <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable" style="max-width: 960px;">
          <div class="modal-content border-0 shadow-lg" style="background: #0d131f; color: #f3f4f6; border-radius: 14px; overflow: hidden; border: 1px solid rgba(212, 175, 55, 0.4) !important;">
            <!-- Modal Header -->
            <div class="modal-header py-3 px-4 border-bottom border-secondary border-opacity-25 d-flex align-items-center justify-content-between" style="background: linear-gradient(90deg, #0b1528, #111e38);">
              <div class="d-flex align-items-center gap-3">
                <div class="d-flex align-items-center justify-content-center rounded-circle" style="width: 40px; height: 40px; background: rgba(212, 175, 55, 0.15); color: #d4af37; border: 1px solid rgba(212, 175, 55, 0.3);">
                  <i class="bi bi-file-earmark-pdf-fill fs-5"></i>
                </div>
                <div>
                  <h6 class="modal-title fw-bold text-white mb-0" style="font-size: 1.05rem;">${title || t("Previsão do Documento para Impressão", "Print Document Preview")}</h6>
                  <span class="text-secondary small" style="font-size: 0.78rem;">${t("Previsão fiel em alta definição • Pronto para Impressão e PDF", "High definition preview • Ready to print or export PDF")}</span>
                </div>
              </div>
              <div class="d-flex align-items-center gap-2">
                <button type="button" class="btn btn-sm btn-ce-gold fw-bold px-3 py-1.5 shadow-sm" onclick="window.printAttendanceModalDoc()">
                  <i class="bi bi-printer-fill me-1.5"></i>${t("Imprimir / Salvar PDF", "Print / Save PDF")}
                </button>
                ${csvData ? `
                <button type="button" class="btn btn-sm btn-outline-light px-2.5 py-1.5" onclick="window.downloadAttendanceModalCsv()" title="${t("Descarregar ficheiro CSV", "Download CSV")}">
                  <i class="bi bi-filetype-csv me-1"></i>CSV
                </button>` : ""}
                <button type="button" class="btn btn-sm btn-secondary px-2.5 py-1.5" onclick="window.closeAttendancePrintModal()" title="${t("Fechar janela", "Close modal")}">
                  <i class="bi bi-x-lg"></i>
                </button>
              </div>
            </div>

            <!-- Modal Body (Paper Sheet Preview) -->
            <div class="modal-body p-3 p-md-4" style="background: #141c2e; overflow-y: auto; max-height: calc(85vh - 130px);">
              <div class="d-flex justify-content-center">
                <div id="attendancePrintPaperContent" class="shadow-lg text-dark bg-white rounded p-4 p-md-5" style="width: 100%; max-width: 840px; min-height: 520px; color: #111827; font-family: 'Segoe UI', Arial, sans-serif;">
                  ${htmlContent}
                </div>
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="modal-footer py-2.5 px-4 border-top border-secondary border-opacity-25 d-flex justify-content-between align-items-center" style="background: #0b1528;">
              <span class="text-secondary small"><i class="bi bi-shield-check text-success me-1"></i>${t("LoveWorld Christ Embassy Mozambique • Assiduidade & Pontualidade", "LoveWorld Christ Embassy Mozambique • Attendance & Punctuality")}</span>
              <button type="button" class="btn btn-sm btn-outline-secondary px-3" onclick="window.closeAttendancePrintModal()">${t("Fechar", "Close")}</button>
            </div>
          </div>
        </div>
      </div>
    `;

    var wrapper = document.createElement("div");
    wrapper.id = "attendancePrintModalWrapper";
    wrapper.innerHTML = modalHtml;
    document.body.appendChild(wrapper);

    window._attendanceCurrentPrintData = {
      title: title,
      htmlContent: htmlContent,
      filename: filename || "attendance-document",
      csvData: csvData
    };
  }

  window.openAttendancePrintModal = openAttendancePrintModal;

  window.closeAttendancePrintModal = function () {
    var el = document.getElementById("attendancePrintModalWrapper");
    if (el) el.remove();
  };

  window.printAttendanceModalDoc = function () {
    var contentEl = document.getElementById("attendancePrintPaperContent");
    if (!contentEl) return;

    var iframeId = "__att_print_isolated_iframe";
    var iframe = document.getElementById(iframeId);
    if (iframe) iframe.remove();

    iframe = document.createElement("iframe");
    iframe.id = iframeId;
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    var doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${window._attendanceCurrentPrintData?.title || "Relatório de Assiduidade"}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm 15mm; }
    body { margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; color: #111827; background: #fff; font-size: 11px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    * { box-sizing: border-box; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th, td { border: 1px solid #d1d5db; padding: 6px 8px; text-align: left; }
    th { background: #0b1f3f !important; color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; font-weight: 600; }
    .text-center { text-align: center !important; }
    .text-end { text-align: right !important; }
    .font-monospace { font-family: monospace !important; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  ${contentEl.innerHTML}
</body>
</html>`);
    doc.close();

    setTimeout(function () {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }, 250);
  };

  window.downloadAttendanceModalCsv = function () {
    var data = window._attendanceCurrentPrintData;
    if (data && data.csvData) {
      exportRecordsToCsv(data.csvData, (data.filename || "attendance") + ".csv");
    }
  };

  window.generateStaffDossierPreviewModal = function (staffId) {
    var sId = staffId || attendancePageState.selectedStaffId || "11";
    generateStaffDossierPdf(sId);
  };

  window.generateDailyPreviewModal = function (targetDate) {
    var d = targetDate || attendancePageState.selectedDate || "2026-10-01";
    generateDailyPdf(d);
  };

  window.generateComparisonPreviewModal = async function () {
    var mode = attendancePageState.comparisonMode || "day";
    var pA = attendancePageState.comparisonPeriodA || "2026-10-01";
    var pB = attendancePageState.comparisonPeriodB || "2026-07-09";
    var empId = attendancePageState.comparisonEmployeeId || "all";
    var dept = attendancePageState.comparisonDepartment || "all";

    var comp = await getBridge().comparePeriods({
      mode: mode,
      periodA: pA,
      periodB: pB,
      employeeId: empId,
      department: dept,
    });

    var statsA = comp.statsA;
    var statsB = comp.statsB;
    var deltas = comp.deltas;
    var staffMatrix = comp.staffMatrix || [];

    var matrixRows = staffMatrix.map(function (row) {
      var trendColor = row.trend === "improved" ? "#198754" : row.trend === "declined" ? "#dc3545" : "#6c757d";
      var trendText = row.trend === "improved" ? "▲ Melhorou" : row.trend === "declined" ? "▼ Piorou" : "— Estável";
      var staffDisplayName = resolveStaffFullName(row, row.employee_full_name || row.employee_name);
      return `
        <tr>
          <td style="padding: 6px 8px; border: 1px solid #ddd; font-family: monospace;">${row.employee_id}</td>
          <td style="padding: 6px 8px; border: 1px solid #ddd; font-weight: bold;">${staffDisplayName}</td>
          <td style="padding: 6px 8px; border: 1px solid #ddd;">${row.department}</td>
          <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: center; font-family: monospace;">${row.periodA.checkIn || (row.periodA.onTimeRate + "%")}</td>
          <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: center; font-family: monospace;">${row.periodB.checkIn || (row.periodB.onTimeRate + "%")}</td>
          <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: center; font-weight: bold; color: ${row.deltaOnTimeRate >= 0 ? "#198754" : "#dc3545"};">${row.deltaOnTimeRate >= 0 ? "+" : ""}${row.deltaOnTimeRate}%</td>
          <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: center; font-weight: bold; color: ${trendColor};">${trendText}</td>
        </tr>`;
    }).join("");

    var printHtml = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; padding: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #c5a059; padding-bottom: 12px; margin-bottom: 18px;">
          <div>
            <div style="font-size: 11px; font-weight: bold; color: #c5a059; letter-spacing: 0.08em; text-transform: uppercase;">Christ Embassy Mozambique • LoveWorld</div>
            <h2 style="margin: 3px 0 0 0; font-size: 18px; color: #0b1f3f; font-weight: 800;">${t("RELATÓRIO COMPARATIVO MULTI-PERÍODO", "MULTI-PERIOD COMPARISON REPORT")}</h2>
            <div style="font-size: 12px; color: #555; margin-top: 2px;">${t("Matriz Comparativa de Assiduidade e Pontualidade", "Attendance & Punctuality Comparative Matrix")}</div>
          </div>
          <div style="text-align: right; font-size: 11px; color: #666;">
            <div><strong>${t("Modo:", "Mode:")}</strong> ${mode.toUpperCase()}</div>
            <div><strong>${t("Período A (Atual):", "Period A:")}</strong> ${pA}</div>
            <div><strong>${t("Período B (Base):", "Period B:")}</strong> ${pB}</div>
            <div><strong>${t("Gerado em:", "Generated at:")}</strong> ${new Date().toLocaleDateString(isEn() ? "en-US" : "pt-PT")}</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px;">
          <div style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 10px; border-radius: 6px; text-align: center;">
            <div style="font-size: 10px; color: #64748b; font-weight: bold; text-transform: uppercase;">${t("PONTUALIDADE A vs B", "PUNCTUALITY A vs B")}</div>
            <div style="font-size: 16px; font-weight: 800; color: #0b1f3f;">${statsA.onTimeRate}% <span style="font-size: 12px; color: #64748b;">vs ${statsB.onTimeRate}%</span></div>
            <div style="font-size: 11px; font-weight: bold; color: ${deltas.onTimeRateDelta >= 0 ? "#16a34a" : "#dc2626"};">${deltas.onTimeRateDelta >= 0 ? "▲ +" : "▼ "}${deltas.onTimeRateDelta}%</div>
          </div>
          <div style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 10px; border-radius: 6px; text-align: center;">
            <div style="font-size: 10px; color: #64748b; font-weight: bold; text-transform: uppercase;">${t("PRESENTES A vs B", "PRESENT A vs B")}</div>
            <div style="font-size: 16px; font-weight: 800; color: #0284c7;">${statsA.present} <span style="font-size: 12px; color: #64748b;">vs ${statsB.present}</span></div>
            <div style="font-size: 11px; font-weight: bold; color: ${deltas.presentDelta >= 0 ? "#16a34a" : "#dc2626"};">${deltas.presentDelta >= 0 ? "▲ +" : "▼ "}${deltas.presentDelta}</div>
          </div>
          <div style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 10px; border-radius: 6px; text-align: center;">
            <div style="font-size: 10px; color: #64748b; font-weight: bold; text-transform: uppercase;">${t("ATRASOS A vs B", "LATE A vs B")}</div>
            <div style="font-size: 16px; font-weight: 800; color: #dc2626;">${statsA.allLate} <span style="font-size: 12px; color: #64748b;">vs ${statsB.allLate}</span></div>
            <div style="font-size: 11px; font-weight: bold; color: ${deltas.allLateDelta <= 0 ? "#16a34a" : "#dc2626"};">${deltas.allLateDelta > 0 ? "▲ +" : "▼ "}${deltas.allLateDelta}</div>
          </div>
          <div style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 10px; border-radius: 6px; text-align: center;">
            <div style="font-size: 10px; color: #64748b; font-weight: bold; text-transform: uppercase;">${t("MINUTOS ATRASO A vs B", "DELAY MINS A vs B")}</div>
            <div style="font-size: 16px; font-weight: 800; color: #d97706;">${statsA.totalDelay}m <span style="font-size: 12px; color: #64748b;">vs ${statsB.totalDelay}m</span></div>
            <div style="font-size: 11px; font-weight: bold; color: ${deltas.totalDelayDelta <= 0 ? "#16a34a" : "#dc2626"};">${deltas.totalDelayDelta > 0 ? "▲ +" : "▼ "}${deltas.totalDelayDelta}m</div>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 25px;">
          <thead>
            <tr style="background: #0b1f3f; color: white;">
              <th style="padding: 7px 8px; border: 1px solid #0b1f3f;">ID</th>
              <th style="padding: 7px 8px; border: 1px solid #0b1f3f;">${t("Colaborador", "Staff")}</th>
              <th style="padding: 7px 8px; border: 1px solid #0b1f3f;">${t("Departamento", "Department")}</th>
              <th style="padding: 7px 8px; border: 1px solid #0b1f3f; text-align: center;">${t("Período A", "Period A")} (${pA})</th>
              <th style="padding: 7px 8px; border: 1px solid #0b1f3f; text-align: center;">${t("Período B", "Period B")} (${pB})</th>
              <th style="padding: 7px 8px; border: 1px solid #0b1f3f; text-align: center;">${t("Delta Pontualidade", "Punctuality Delta")}</th>
              <th style="padding: 7px 8px; border: 1px solid #0b1f3f; text-align: center;">${t("Tendência", "Trend")}</th>
            </tr>
          </thead>
          <tbody>
            ${matrixRows}
          </tbody>
        </table>
      </div>`;

    openAttendancePrintModal(
      `${t("Comparação", "Comparison")} (${pA} vs ${pB})`,
      printHtml,
      `Comparacao-${pA}-vs-${pB}`,
      staffMatrix
    );
  };

  // =========================================================================
  // Real-Time Interaction Handlers (Exposed on window)
  // =========================================================================

  window.handleTrajectoryStaffChange = async function (staffId) {
    if (!staffId) return;
    attendancePageState.selectedStaffId = String(staffId);
    await renderTabContent("trajectory");
  };

  window.handleCompModeChange = async function (mode) {
    attendancePageState.comparisonMode = mode;
    if (mode === "month") {
      attendancePageState.comparisonPeriodA = "2026-10";
      attendancePageState.comparisonPeriodB = "2026-07";
    } else if (mode === "year") {
      attendancePageState.comparisonPeriodA = "2026";
      attendancePageState.comparisonPeriodB = "2025";
    } else if (mode === "day") {
      attendancePageState.comparisonPeriodA = "2026-10-01";
      attendancePageState.comparisonPeriodB = "2026-07-09";
    } else if (mode === "week") {
      attendancePageState.comparisonPeriodA = "2026-W40";
      attendancePageState.comparisonPeriodB = "2026-W28";
    }
    await renderTabContent("comparison");
  };

  window.handleCompPeriodChange = async function () {
    var pA = document.getElementById("compPeriodAInput")?.value;
    var pB = document.getElementById("compPeriodBInput")?.value;
    var emp = document.getElementById("compEmployeeSelect")?.value;
    if (pA) attendancePageState.comparisonPeriodA = pA;
    if (pB) attendancePageState.comparisonPeriodB = pB;
    if (emp) attendancePageState.comparisonEmployeeId = emp;
    await renderTabContent("comparison");
  };

  window.swapComparisonPeriods = async function () {
    var tmp = attendancePageState.comparisonPeriodA;
    attendancePageState.comparisonPeriodA = attendancePageState.comparisonPeriodB;
    attendancePageState.comparisonPeriodB = tmp;
    await renderTabContent("comparison");
  };

  window.setComparisonPreset = async function (pA, pB, mode) {
    if (mode) attendancePageState.comparisonMode = mode;
    attendancePageState.comparisonPeriodA = pA;
    attendancePageState.comparisonPeriodB = pB;
    await renderTabContent("comparison");
  };

  window.handleAttendanceDateChange = async function (date) {
    if (!date) return;
    attendancePageState.selectedDate = date;
    await renderTabContent("daily");
  };

  window.handleAttendanceDeptChange = async function (dept) {
    attendancePageState.selectedDepartment = dept || "all";
    await renderTabContent("daily");
  };

  window.handleAttendanceSearch = async function (q) {
    attendancePageState.searchQuery = q || "";
    await renderTabContent("daily");
  };

  function exportRecordsToCsv(records, filename) {
    var headers = ["ID", "Employee", "Date", "CheckIn", "Status", "DelayMinutes", "Punches", "Department"];
    var rows = (records || []).map(function (r) {
      return [
        r.employee_id,
        `"${(r.employee_name || "").replace(/"/g, '""')}"`,
        r.attendance_date,
        r.check_in || "",
        r.status,
        r.delay_minutes || 0,
        `"${(r.all_punches || "").replace(/\n/g, " | ").replace(/"/g, '""')}"`,
        r.department || "CESTAFF",
      ];
    });

    var csvContent = [headers.join(",")].concat(rows.map(function (r) { return r.join(","); })).join("\n");
    var blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename || "attendance-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  // =========================================================================
  // Event Listeners & Interactions
  // =========================================================================

  function attachModuleEventListeners() {
    var root = document.querySelector(".attendance-module-root");
    if (!root) return;

    // Tabs switching
    root.querySelectorAll("[data-attendance-tab]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var targetTab = this.getAttribute("data-attendance-tab");
        attendancePageState.tab = targetTab;
        root.querySelectorAll("[data-attendance-tab]").forEach(function (b) {
          b.classList.toggle("active", b.getAttribute("data-attendance-tab") === targetTab);
        });
        renderTabContent(targetTab);
      });
    });

    // Daily Filters
    root.querySelectorAll("[data-attendance-filter]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        attendancePageState.dailyFilter = this.getAttribute("data-attendance-filter") || "all";
        renderTabContent("daily");
      });
    });

    // Date picker
    var datePicker = document.getElementById("attendanceDatePicker");
    if (datePicker) {
      datePicker.addEventListener("change", function () {
        attendancePageState.selectedDate = this.value;
        renderTabContent("daily");
      });
    }

    // Prev / Today / Next Date buttons
    var prevBtn = document.getElementById("attendancePrevDayBtn");
    if (prevBtn) {
      prevBtn.addEventListener("click", function () {
        var d = new Date(attendancePageState.selectedDate || "2026-07-09");
        d.setDate(d.getDate() - 1);
        attendancePageState.selectedDate = d.toISOString().slice(0, 10);
        renderTabContent("daily");
      });
    }

    var nextBtn = document.getElementById("attendanceNextDayBtn");
    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        var d = new Date(attendancePageState.selectedDate || "2026-07-09");
        d.setDate(d.getDate() + 1);
        attendancePageState.selectedDate = d.toISOString().slice(0, 10);
        renderTabContent("daily");
      });
    }

    var todayBtn = document.getElementById("attendanceTodayBtn");
    if (todayBtn) {
      todayBtn.addEventListener("click", function () {
        attendancePageState.selectedDate = new Date().toISOString().slice(0, 10);
        renderTabContent("daily");
      });
    }

    // Search input
    var searchInput = document.getElementById("attendanceSearchInput");
    if (searchInput) {
      searchInput.addEventListener("input", function () {
        attendancePageState.searchQuery = this.value;
        renderTabContent("daily");
      });
    }

    // Department filter
    var deptFilter = document.getElementById("attendanceDeptFilter");
    if (deptFilter) {
      deptFilter.addEventListener("change", function () {
        attendancePageState.selectedDepartment = this.value;
        renderTabContent("daily");
      });
    }

    // Comparison Mode switches
    root.querySelectorAll("[data-comp-mode]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var m = this.getAttribute("data-comp-mode");
        attendancePageState.comparisonMode = m;
        if (m === "month") {
          attendancePageState.comparisonPeriodA = "2026-07";
          attendancePageState.comparisonPeriodB = "2026-06";
        } else if (m === "year") {
          attendancePageState.comparisonPeriodA = "2026";
          attendancePageState.comparisonPeriodB = "2025";
        } else if (m === "day") {
          attendancePageState.comparisonPeriodA = "2026-07-09";
          attendancePageState.comparisonPeriodB = "2026-07-08";
        }
        renderTabContent("comparison");
      });
    });

    var execCompBtn = document.getElementById("executeComparisonBtn");
    if (execCompBtn) {
      execCompBtn.addEventListener("click", function () {
        var pA = document.getElementById("compPeriodAInput")?.value;
        var pB = document.getElementById("compPeriodBInput")?.value;
        var emp = document.getElementById("compEmployeeSelect")?.value;
        if (pA) attendancePageState.comparisonPeriodA = pA;
        if (pB) attendancePageState.comparisonPeriodB = pB;
        if (emp) attendancePageState.comparisonEmployeeId = emp;
        renderTabContent("comparison");
      });
    }

    // Workflow actions
    var wfDatePicker = document.getElementById("workflowDatePicker");
    if (wfDatePicker) {
      wfDatePicker.addEventListener("change", function () {
        attendancePageState.workflowSelectedDate = this.value;
        renderTabContent("workflow");
      });
    }

    var submitLioBtn = document.getElementById("wfSubmitByLioBtn");
    if (submitLioBtn) {
      submitLioBtn.addEventListener("click", async function () {
        var dateVal = attendancePageState.workflowSelectedDate || attendancePageState.selectedDate;
        await getBridge().submitBatchByLio(dateVal);
        if (typeof window.showToast === "function") {
          window.showToast(t("Lote biométrico submetido por Brother Lio e enviado aos Cuidados Pastorais!", "Batch submitted by Brother Lio and sent to Pastoral Care!"), "success");
        } else {
          alert(t("Lote biométrico submetido com sucesso pelo Brother Lio!", "Batch submitted by Brother Lio!"));
        }
        renderTabContent("workflow");
      });
    }

    var forwardValdemiroBtn = document.getElementById("wfForwardByValdemiroBtn");
    if (forwardValdemiroBtn) {
      forwardValdemiroBtn.addEventListener("click", async function () {
        var dateVal = attendancePageState.workflowSelectedDate || attendancePageState.selectedDate;
        var note = prompt(t("Adicionar observação pastoral para o Pastor Kéne:", "Add pastoral note for Pastor Kéne:"), t("Validado e auditado pelos Cuidados Pastorais. Justificativas verificadas.", "Validated and audited by Pastoral Care. Justifications verified."));
        if (note != null) {
          await getBridge().forwardToOverseerByValdemiro(dateVal, note);
          if (typeof window.showToast === "function") {
            window.showToast(t("Lote auditado por Pr. Valdemiro e entregue na aba MAIN ao Pastor Kéne!", "Batch audited by Pr. Valdemiro and delivered to Pastor Kéne on MAIN tab!"), "success");
          } else {
            alert(t("Lote auditado e entregue com sucesso ao Pastor Kéne!", "Batch audited and delivered to Pastor Kéne!"));
          }
          renderTabContent("workflow");
        }
      });
    }

    var ackKeneBtn = document.getElementById("wfAcknowledgeByKeneBtn");
    if (ackKeneBtn) {
      ackKeneBtn.addEventListener("click", async function () {
        var dateVal = attendancePageState.workflowSelectedDate || attendancePageState.selectedDate;
        var note = prompt(t("Despacho pastoral de homologação (Pastor Kéne):", "Pastoral approval note (Pastor Kéne):"), t("Homologado pelo Pastor do Grupo (Pastor Kéne).", "Approved by Group Pastor (Pastor Kéne)."));
        if (note != null) {
          await getBridge().acknowledgeByKene(dateVal, note);
          if (typeof window.showToast === "function") {
            window.showToast(t("Assiduidade homologada com sucesso pelo Pastor Kéne!", "Attendance homologated successfully by Pastor Kéne!"), "success");
          } else {
            alert(t("Homologação concluída pelo Pastor Kéne!", "Approval completed by Pastor Kéne!"));
          }
          renderTabContent("workflow");
        }
      });
    }

    root.querySelectorAll("[data-load-wf-date]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var d = this.getAttribute("data-load-wf-date");
        attendancePageState.workflowSelectedDate = d;
        attendancePageState.selectedDate = d;
        renderTabContent("workflow");
      });
    });

    // Monthly month picker
    var mPicker = document.getElementById("monthlyReportMonthPicker");
    if (mPicker) {
      mPicker.addEventListener("change", function () {
        attendancePageState.monthlySelectedMonth = this.value;
        renderTabContent("monthly");
      });
    }

    var printMonthBtn = document.getElementById("printMonthlyReportBtn");
    if (printMonthBtn) {
      printMonthBtn.addEventListener("click", function () {
        var m = attendancePageState.monthlySelectedMonth || "2026-07";
        generatePeriodPdf(m + "-01", m + "-31");
      });
    }

    // Trajectory jump from table
    root.querySelectorAll("[data-view-trajectory]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        attendancePageState.selectedStaffId = this.getAttribute("data-view-trajectory");
        attendancePageState.tab = "trajectory";
        window.renderAttendance("trajectory");
      });
    });

    // Edit attendance / note prompt
    root.querySelectorAll("[data-edit-attendance]").forEach(function (btn) {
      btn.addEventListener("click", async function () {
        var recId = this.getAttribute("data-edit-attendance");
        var newNote = prompt(t("Adicionar observação / justificativa para este registo de assiduidade:", "Add note / justification for this attendance record:"));
        if (newNote != null) {
          await getBridge().updateAttendanceRecord(recId, { notes: newNote });
          if (typeof window.showToast === "function") {
            window.showToast(t("Observação atualizada com sucesso!", "Note updated successfully!"), "success");
          }
          renderTabContent("daily");
        }
      });
    });

    // Trajectory staff select
    var trajSelect = document.getElementById("trajectoryStaffSelect");
    if (trajSelect) {
      trajSelect.addEventListener("change", function () {
        attendancePageState.selectedStaffId = this.value;
        renderTabContent("trajectory");
      });
    }

    // Settings Form submit
    var settingsForm = document.getElementById("attendanceSettingsForm");
    if (settingsForm) {
      settingsForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        var formData = new FormData(this);
        var payload = {
          standard_start_time: formData.get("standard_start_time"),
          grace_period_minutes: parseInt(formData.get("grace_period_minutes"), 10),
          minor_delay_threshold_minutes: parseInt(formData.get("minor_delay_threshold_minutes"), 10),
          severe_delay_threshold_minutes: parseInt(formData.get("severe_delay_threshold_minutes"), 10),
          standard_end_time: formData.get("standard_end_time"),
        };
        await getBridge().saveAttendanceSettings(payload);
        if (typeof window.showToast === "function") {
          window.showToast(t("Configurações de assiduidade guardadas com sucesso!", "Attendance settings saved successfully!"), "success");
        } else {
          alert(t("Configurações guardadas com sucesso!", "Settings saved successfully!"));
        }
      });
    }

    // Upload Dropzone & File Input
    var dropzone = document.getElementById("biometricDropzone");
    var fileInput = document.getElementById("biometricFileInput");
    if (dropzone && fileInput) {
      dropzone.addEventListener("click", function () {
        fileInput.click();
      });

      dropzone.addEventListener("dragover", function (e) {
        e.preventDefault();
        dropzone.classList.add("border-gold");
      });

      dropzone.addEventListener("dragleave", function () {
        dropzone.classList.remove("border-gold");
      });

      dropzone.addEventListener("drop", function (e) {
        e.preventDefault();
        dropzone.classList.remove("border-gold");
        if (e.dataTransfer.files.length) {
          handleFile(e.dataTransfer.files[0]);
        }
      });

      fileInput.addEventListener("change", function () {
        if (fileInput.files.length) {
          handleFile(fileInput.files[0]);
        }
      });
    }

    function handleFile(file) {
      parseBiometricFile(
        file,
        function (parsed) {
          attendancePageState.uploadPreview = parsed;
          renderTabContent("upload");
        },
        function (err) {
          alert(err);
        }
      );
    }

    // Confirm upload button
    var confirmUploadBtn = document.getElementById("confirmSaveUploadBtn");
    if (confirmUploadBtn) {
      confirmUploadBtn.addEventListener("click", async function () {
        var preview = attendancePageState.uploadPreview;
        if (!preview || !preview.records) return;

        this.disabled = true;
        this.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span>${t("A gravar registos...", "Saving records...")}`;

        var res = await getBridge().saveBatchAttendance(preview.records, {
          filename: preview.filename,
          upload_date: preview.dates[0] || new Date().toISOString().slice(0, 10),
          device_create_time: preview.createTime,
          uploaded_by: window.activeUser?.name || "Brother Lio",
          file_size_bytes: preview.fileSize,
        });

        if (res.ok) {
          if (typeof window.showToast === "function") {
            window.showToast(`${res.inserted_count} ${t("registos de assiduidade guardados com sucesso!", "attendance records saved successfully!")}`, "success");
          } else {
            alert(`${res.inserted_count} ${t("registos de assiduidade guardados com sucesso!", "attendance records saved successfully!")}`);
          }
          attendancePageState.uploadPreview = null;
          attendancePageState.selectedDate = preview.dates[0] || attendancePageState.selectedDate;
          attendancePageState.tab = "daily";
          window.renderAttendance("daily");
        } else {
          alert(t("Erro ao gravar: ", "Error saving: ") + (res.error || t("Erro desconhecido", "Unknown error")));
          this.disabled = false;
          this.innerHTML = `<i class="bi bi-check-lg me-1.5"></i>${t("Confirmar e Gravar no Sistema", "Confirm and Save to System")}`;
        }
      });
    }

    var cancelPreviewBtn = document.getElementById("cancelUploadPreviewBtn");
    if (cancelPreviewBtn) {
      cancelPreviewBtn.addEventListener("click", function () {
        attendancePageState.uploadPreview = null;
        renderTabContent("upload");
      });
    }

    // PDF & Export triggers
    var genDailyPdf = document.getElementById("generateDailyPdfBtn");
    if (genDailyPdf) {
      genDailyPdf.addEventListener("click", function () {
        var dateVal = document.getElementById("reportDailyDateInput")?.value;
        generateDailyPdf(dateVal);
      });
    }

    var genPeriodPdf = document.getElementById("generatePeriodPdfBtn");
    if (genPeriodPdf) {
      genPeriodPdf.addEventListener("click", function () {
        var s = document.getElementById("reportPeriodStartInput")?.value;
        var e = document.getElementById("reportPeriodEndInput")?.value;
        generatePeriodPdf(s, e);
      });
    }

    root.querySelectorAll("[data-attendance-quick-export]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        generateDailyPdf(attendancePageState.selectedDate);
      });
    });

    var exportDossierBtn = document.getElementById("exportStaffDossierPdfBtn");
    if (exportDossierBtn) {
      exportDossierBtn.addEventListener("click", function () {
        generateStaffDossierPdf(attendancePageState.selectedStaffId);
      });
    }

    // CSV export
    var dailyCsvBtn = document.getElementById("attendanceExportDailyCsv");
    if (dailyCsvBtn) {
      dailyCsvBtn.addEventListener("click", async function () {
        var res = await getBridge().listAttendanceRecords({ date: attendancePageState.selectedDate });
        exportRecordsToCsv(res.data, `Attendance-${attendancePageState.selectedDate}.csv`);
      });
    }

    // -------------------------------------------------------------------------
    // Manual & WhatsApp Entry Listeners
    // -------------------------------------------------------------------------
    var switchWhatsAppBtn = document.getElementById("switchToWhatsAppModeBtn");
    var switchGridBtn = document.getElementById("switchToGridModeBtn");
    if (switchWhatsAppBtn && switchGridBtn) {
      switchWhatsAppBtn.addEventListener("click", function () {
        attendancePageState.manualEntryMode = "whatsapp";
        renderTabContent("manual");
      });
      switchGridBtn.addEventListener("click", function () {
        attendancePageState.manualEntryMode = "grid";
        renderTabContent("manual");
      });
    }

    var insertSampleBtn = document.getElementById("insertSampleWhatsAppTextBtn");
    var whatsAppTextarea = document.getElementById("whatsAppRawTextInput");
    if (insertSampleBtn && whatsAppTextarea) {
      insertSampleBtn.addEventListener("click", function () {
        whatsAppTextarea.value = `Relatório diário de chegada 01/10/2026\n\nNome: Hora da Chegada\n\n1. Janet Marquel (8:30) 🟢\n2. Leopold Kusi (8:30) 🟢\n3. Deacon Oliver (8:38) 🚨\n4. Angélica Amílcar (7:43) 🟢\n5. Marcelo Panguene (7:43) 🟢\n6. Eduarda Paula (8:25) 🟢\n7. Gilberto Baule (7:50) 🟢\n8. Pastor Valdemiro (8:23) 🟢\n9. Sis. Virgínia Filipe (8:22) 🟢\n10. Junya Clementina (8:49) 🚨\n11. Laiza Chirindza (8:33) 🚨\n12. Pastor Clarissa (8:11) 🟢\n13. Sister Kassandra (8:14) 🟢\n14. Bro Filipe (8:30) 🟢\n\nThank you for the opportunity Pastor Sir`;
        attendancePageState.manualRawText = whatsAppTextarea.value;
      });
    }

    var clearWhatsAppTextBtn = document.getElementById("clearWhatsAppRawTextBtn");
    if (clearWhatsAppTextBtn && whatsAppTextarea) {
      clearWhatsAppTextBtn.addEventListener("click", function () {
        whatsAppTextarea.value = "";
        attendancePageState.manualRawText = "";
      });
    }

    var parseWhatsAppBtn = document.getElementById("parseWhatsAppTextBtn");
    if (parseWhatsAppBtn && whatsAppTextarea) {
      parseWhatsAppBtn.addEventListener("click", function () {
        var rawText = whatsAppTextarea.value;
        if (!rawText || !rawText.trim()) {
          alert(t("Por favor, cole o texto do WhatsApp primeiro.", "Please paste the WhatsApp text first."));
          return;
        }
        var fallbackDate = document.getElementById("whatsAppDateFallbackInput")?.value || attendancePageState.selectedDate || "2026-10-01";
        var parsedResult = getBridge().parseWhatsAppAttendanceText(rawText, fallbackDate);
        if (!parsedResult.ok || !parsedResult.records || !parsedResult.records.length) {
          alert(t("Não foi possível extrair registos do texto. Verifique o formato.", "Could not extract attendance records from text. Check format."));
          return;
        }
        attendancePageState.manualRawText = rawText;
        attendancePageState.manualParsedPreview = parsedResult;
        renderTabContent("manual");
      });
    }

    // Inline edit in parsed preview table
    root.querySelectorAll(".parsed-checkin-edit").forEach(function (input) {
      input.addEventListener("input", function () {
        var idx = parseInt(this.getAttribute("data-record-index"), 10);
        var preview = attendancePageState.manualParsedPreview;
        if (preview && preview.records && preview.records[idx]) {
          var val = this.value;
          preview.records[idx].check_in = val || null;
          preview.records[idx].check_out = val ? "17:00" : null;
          var punct = val ? getBridge().calculatePunctualityStatus(val) : { status: "absent", delay_minutes: 0, is_late: false, is_present: false };
          preview.records[idx].status = punct.status;
          preview.records[idx].delay_minutes = punct.delay_minutes;
          preview.records[idx].is_late = punct.is_late;
          preview.records[idx].is_present = punct.is_present;

          var badgeCell = document.getElementById("statusBadgeCell-" + idx);
          if (badgeCell) badgeCell.innerHTML = getStatusBadge(punct.status, punct.delay_minutes);

          var delayCell = document.getElementById("delayCell-" + idx);
          if (delayCell) {
            delayCell.innerHTML = punct.delay_minutes > 0 ? `<span class="text-danger fw-bold">+${punct.delay_minutes}m</span>` : (punct.is_present ? `<span class="text-success"><i class="bi bi-check"></i> 0m</span>` : `<span class="text-secondary">--</span>`);
          }
        }
      });
    });

    var clearParsedBtn = document.getElementById("clearParsedWhatsAppBtn");
    if (clearParsedBtn) {
      clearParsedBtn.addEventListener("click", function () {
        attendancePageState.manualParsedPreview = null;
        renderTabContent("manual");
      });
    }

    var confirmSaveWhatsAppBtn = document.getElementById("confirmSaveParsedWhatsAppBtn");
    if (confirmSaveWhatsAppBtn) {
      confirmSaveWhatsAppBtn.addEventListener("click", async function () {
        var parsed = attendancePageState.manualParsedPreview;
        if (!parsed || !parsed.records || !parsed.records.length) return;

        this.disabled = true;
        this.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span>${t("A gravar...", "Saving...")}`;

        var res = await getBridge().saveBatchAttendance(parsed.records, {
          filename: "WhatsApp-Relatorio-" + parsed.attendance_date + ".txt",
          upload_date: parsed.attendance_date,
          uploaded_by: window.activeUser?.name || "Brother Lio",
          device_create_time: new Date().toISOString(),
        });

        if (res.ok) {
          if (typeof window.showToast === "function") {
            window.showToast(`${res.inserted_count} ${t("registos do WhatsApp guardados e submetidos com sucesso!", "WhatsApp records saved and submitted successfully!")}`, "success");
          } else {
            alert(`${res.inserted_count} ${t("registos guardados!", "records saved!")}`);
          }
          attendancePageState.selectedDate = parsed.attendance_date;
          attendancePageState.manualParsedPreview = null;
          attendancePageState.tab = "daily";
          window.renderAttendance("daily");
        } else {
          alert(t("Erro ao gravar: ", "Error saving: ") + (res.error || "Erro"));
          this.disabled = false;
        }
      });
    }

    // Grid Matrix actions
    var fillAllBtn = document.getElementById("fillAllOnTimeGridBtn");
    if (fillAllBtn) {
      fillAllBtn.addEventListener("click", function () {
        root.querySelectorAll(".manual-time-input").forEach(function (inp, idx) {
          inp.value = "08:00";
          var badge = document.getElementById("gridStatusBadge-" + idx);
          if (badge) badge.innerHTML = `<span class="badge rounded-pill bg-success-subtle text-success border border-success border-opacity-25 px-2 py-1"><i class="bi bi-check-circle-fill me-1"></i>${t("Pontual", "On Time")}</span>`;
        });
        root.querySelectorAll(".manual-present-toggle").forEach(function (tog) {
          tog.checked = true;
        });
      });
    }

    var clearAllGridBtn = document.getElementById("clearAllGridBtn");
    if (clearAllGridBtn) {
      clearAllGridBtn.addEventListener("click", function () {
        root.querySelectorAll(".manual-time-input").forEach(function (inp, idx) {
          inp.value = "";
          var badge = document.getElementById("gridStatusBadge-" + idx);
          if (badge) badge.innerHTML = `<span class="badge rounded-pill bg-secondary-subtle text-secondary border border-secondary border-opacity-25 px-2 py-1"><i class="bi bi-dash-circle me-1"></i>${t("Sem Registo", "No Punch")}</span>`;
        });
        root.querySelectorAll(".manual-present-toggle").forEach(function (tog) {
          tog.checked = false;
        });
      });
    }

    root.querySelectorAll(".quick-preset-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var idx = this.getAttribute("data-row-index");
        var timeVal = this.getAttribute("data-time");
        var inp = root.querySelector(`.manual-time-input[data-row-index="${idx}"]`);
        if (inp) {
          inp.value = timeVal;
          var punct = getBridge().calculatePunctualityStatus(timeVal);
          var badge = document.getElementById("gridStatusBadge-" + idx);
          if (badge) badge.innerHTML = getStatusBadge(punct.status, punct.delay_minutes);
        }
      });
    });

    root.querySelectorAll(".manual-time-input").forEach(function (inp) {
      inp.addEventListener("input", function () {
        var idx = this.getAttribute("data-row-index");
        var timeVal = this.value;
        var punct = timeVal ? getBridge().calculatePunctualityStatus(timeVal) : { status: "absent", delay_minutes: 0 };
        var badge = document.getElementById("gridStatusBadge-" + idx);
        if (badge) badge.innerHTML = getStatusBadge(punct.status, punct.delay_minutes);
      });
    });

    var saveGridBtn = document.getElementById("saveManualGridAttendanceBtn");
    if (saveGridBtn) {
      saveGridBtn.addEventListener("click", async function () {
        var gridDate = document.getElementById("manualGridDateInput")?.value || attendancePageState.selectedDate || "2026-10-01";
        var rows = root.querySelectorAll(".manual-grid-row");
        var records = [];

        rows.forEach(function (r) {
          var staffId = r.getAttribute("data-staff-id");
          var staffName = r.getAttribute("data-staff-name");
          var staffFullName = r.getAttribute("data-staff-fullname");
          var staffDept = r.getAttribute("data-staff-dept");
          var staffRole = r.getAttribute("data-staff-role");
          var timeInp = r.querySelector(".manual-time-input");
          var tog = r.querySelector(".manual-present-toggle");

          var isPresent = tog ? tog.checked : Boolean(timeInp?.value);
          var checkIn = isPresent && timeInp?.value ? timeInp.value : null;
          var punct = checkIn ? getBridge().calculatePunctualityStatus(checkIn) : { status: "absent", delay_minutes: 0, is_late: false, is_present: false };

          records.push({
            id: "att-" + gridDate.replace(/-/g, "") + "-" + staffId,
            attendance_date: gridDate,
            employee_id: staffId,
            employee_name: staffName,
            employee_full_name: staffFullName,
            department: staffDept,
            role: staffRole,
            check_in: checkIn,
            check_out: checkIn ? "17:00" : null,
            all_punches: checkIn ? checkIn + " 17:00" : "--:-- --:--",
            status: punct.status,
            delay_minutes: punct.delay_minutes,
            is_late: punct.is_late,
            is_present: punct.is_present,
          });
        });

        this.disabled = true;
        this.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span>${t("A gravar...", "Saving...")}`;

        var res = await getBridge().saveBatchAttendance(records, {
          filename: "Manual-Entrada-" + gridDate + ".csv",
          upload_date: gridDate,
          uploaded_by: window.activeUser?.name || "Brother Lio",
          device_create_time: new Date().toISOString(),
        });

        if (res.ok) {
          if (typeof window.showToast === "function") {
            window.showToast(`${res.inserted_count} ${t("registos manuais guardados com sucesso!", "manual records saved successfully!")}`, "success");
          } else {
            alert(`${res.inserted_count} ${t("registos guardados!", "records saved!")}`);
          }
          attendancePageState.selectedDate = gridDate;
          attendancePageState.tab = "daily";
          window.renderAttendance("daily");
        } else {
          alert(t("Erro ao gravar: ", "Error saving: ") + (res.error || "Erro"));
          this.disabled = false;
        }
      });
    }
  }

  window.CEAttendanceModule = {
    render: window.renderAttendance,
    parseBiometricFile: parseBiometricFile,
    generateDailyPdf: generateDailyPdf,
    generatePeriodPdf: generatePeriodPdf,
    generateStaffDossierPdf: generateStaffDossierPdf,
    exportRecordsToCsv: exportRecordsToCsv,
  };
})();
