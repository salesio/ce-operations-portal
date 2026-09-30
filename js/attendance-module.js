/**
 * Staff Biometric Attendance Module — UI, Parser, Analytics & Exports
 * Christ Embassy Mozambique Operations Portal
 */
(function () {
  "use strict";

  var attendancePageState = {
    tab: "daily", // "daily" | "monthly" | "trajectory" | "upload" | "settings" | "reports"
    selectedDate: "2026-07-09",
    dailyFilter: "all", // "all" | "on_time" | "grace_period" | "minor_delay" | "late" | "severe_delay" | "late_all" | "absent"
    searchQuery: "",
    selectedDepartment: "all",
    monthlyPeriod: "this_month", // "this_month" | "last_month" | "3_months" | "6_months" | "year" | "custom"
    startDate: "2026-07-01",
    endDate: "2026-07-31",
    selectedStaffId: "1",
    trajectoryRange: "1_month",
    uploadPreview: null,
    uploadFileName: "",
    uploadFileStats: null,
    uploadCreateTime: "",
    cardFilters: {},
  };

  window.attendancePageState = attendancePageState;

  function L(key) {
    if (typeof window.L === "function") return window.L(key);
    var pt = {
      attendance: "Controlo de Assiduidade",
      attendanceSubtitle: "Gestão biométrica de entradas, pontualidade, histórico e relatórios de assiduidade do staff",
      dailyView: "Visão Diária",
      monthlyView: "Análise Periódica & Tendências",
      trajectoryView: "Trajetória Individual",
      uploadTab: "Importar Ficheiro Biométrico",
      settingsTab: "Regras & Horários",
      reportsTab: "Relatórios & Exportações",
      onTime: "Pontual",
      gracePeriod: "Tolerância",
      minorDelay: "Atraso Ligeiro",
      late: "Atrasado",
      severeDelay: "Muito Tarde",
      absent: "Falta / Sem Registo",
      presentToday: "Presentes Hoje",
      totalRegistered: "Total Registados",
      allLate: "Total em Atraso",
      avgCheckIn: "Média de Entrada",
    };
    return pt[key] || key;
  }

  function getBridge() {
    return window.CEAttendanceBridge || window.CEDataLayer?.attendance;
  }

  // Helper to format minutes delay
  function formatDelay(minutes) {
    if (!minutes || minutes <= 0) return `<span class="text-success"><i class="bi bi-check-circle me-1"></i>No Horário</span>`;
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
        return `<span class="badge rounded-pill bg-success-subtle text-success border border-success border-opacity-25 px-2 py-1"><i class="bi bi-check-circle-fill me-1"></i>Pontual</span>`;
      case "grace_period":
        return `<span class="badge rounded-pill bg-info-subtle text-info border border-info border-opacity-25 px-2 py-1"><i class="bi bi-clock-history me-1"></i>Tolerância (${delayMins}m)</span>`;
      case "minor_delay":
        return `<span class="badge rounded-pill bg-warning-subtle text-warning border border-warning border-opacity-25 px-2 py-1"><i class="bi bi-clock me-1"></i>Atraso Ligeiro (+${delayMins}m)</span>`;
      case "late":
        return `<span class="badge rounded-pill bg-danger-subtle text-danger border border-danger border-opacity-25 px-2 py-1"><i class="bi bi-exclamation-circle-fill me-1"></i>Atrasado (+${delayMins}m)</span>`;
      case "severe_delay":
        var h = Math.floor(delayMins / 60);
        var m = delayMins % 60;
        var f = h > 0 ? `${h}h${m > 0 ? m + "m" : ""}` : `${delayMins}m`;
        return `<span class="badge rounded-pill bg-danger text-white px-2 py-1"><i class="bi bi-fire me-1"></i>Muito Tarde (+${f})</span>`;
      case "absent":
      default:
        return `<span class="badge rounded-pill bg-secondary-subtle text-secondary border border-secondary border-opacity-25 px-2 py-1"><i class="bi bi-dash-circle me-1"></i>Sem Registo</span>`;
    }
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
        var createTime = "";

        if (isExcel && typeof XLSX !== "undefined") {
          var data = new Uint8Array(e.target.result);
          var workbook = XLSX.read(data, { type: "array" });
          var firstSheetName = workbook.SheetNames[0];
          var worksheet = workbook.Sheets[firstSheetName];
          var rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
          parsedRecords = extractRecordsFromRawMatrix(rawRows, settings);
        } else {
          // Text / CSV fallback
          var text = typeof e.target.result === "string" ? e.target.result : new TextDecoder().decode(e.target.result);
          parsedRecords = extractRecordsFromCsvText(text, settings);
        }

        if (!parsedRecords.records || !parsedRecords.records.length) {
          if (onError) onError("Nenhum registo de assiduidade válido encontrado no ficheiro. Verifique o formato.");
          return;
        }

        if (onComplete) {
          onComplete({
            filename: file.name,
            fileSize: file.size,
            createTime: parsedRecords.createTime || new Date().toISOString().slice(0, 19).replace("T", " "),
            records: parsedRecords.records,
            dates: parsedRecords.dates,
            stats: parsedRecords.stats,
          });
        }
      } catch (err) {
        console.error("[CE Attendance] Parse error", err);
        if (onError) onError("Erro ao processar ficheiro: " + err.message);
      }
    };

    reader.onerror = function () {
      if (onError) onError("Erro de leitura do ficheiro.");
    };

    if (isExcel) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  }

  function extractRecordsFromRawMatrix(rows, settings) {
    var createTime = "";
    var dateColumns = []; // { colIndex: number, dateStr: "YYYY-MM-DD" }
    var empIdCol = 0;
    var cardNoCol = 1;
    var nameCol = 2;
    var deptCol = 3;
    var dataStartRow = -1;

    // Scan top 10 rows for metadata and headers
    for (var r = 0; r < Math.min(rows.length, 12); r++) {
      var row = rows[r] || [];
      var rowStr = row.map(function (c) { return String(c || ""); }).join(" ");

      // Look for Create Time
      var createMatch = rowStr.match(/Create Time\s*:\s*([\d\-\/\:\s]+)/i);
      if (createMatch) {
        createTime = createMatch[1].trim();
      }

      // Look for table header row (e.g. Employee ID, Card No, Name, Department)
      for (var c = 0; c < row.length; c++) {
        var cell = String(row[c] || "").trim().toLowerCase();
        if (cell.includes("employee id") || cell.includes("id de funcionário") || cell === "id") {
          empIdCol = c;
          dataStartRow = r + 1;
        }
        if (cell.includes("card no") || cell.includes("cartão") || cell.includes("card")) {
          cardNoCol = c;
        }
        if (cell.includes("name") || cell.includes("nome") || cell === "funcionario") {
          nameCol = c;
        }
        if (cell.includes("department") || cell.includes("departamento") || cell === "dept") {
          deptCol = c;
        }
        // Look for date in header cell (e.g. 2026/07/09 or 2026-07-09 or 09/07/2026)
        var dateMatch = cell.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
        if (dateMatch) {
          var y = dateMatch[1];
          var m = String(dateMatch[2]).padStart(2, "0");
          var d = String(dateMatch[3]).padStart(2, "0");
          dateColumns.push({ colIndex: c, dateStr: `${y}-${m}-${d}` });
        }
      }
    }

    // If sub-header row exists like "SW - EW", skip it
    if (dataStartRow > 0 && dataStartRow < rows.length) {
      var nextRowStr = (rows[dataStartRow] || []).join(" ");
      if (nextRowStr.toLowerCase().includes("sw") || nextRowStr.toLowerCase().includes("ew")) {
        dataStartRow++;
      }
    }

    // Default single date fallback if date column wasn't in header
    if (!dateColumns.length) {
      var fallbackDate = new Date().toISOString().slice(0, 10);
      if (createTime) {
        var ctMatch = createTime.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
        if (ctMatch) {
          fallbackDate = `${ctMatch[1]}-${String(ctMatch[2]).padStart(2, "0")}-${String(ctMatch[3]).padStart(2, "0")}`;
        }
      }
      dateColumns.push({ colIndex: 4, dateStr: fallbackDate });
    }

    if (dataStartRow === -1) dataStartRow = 4; // Biometric default

    var records = [];
    var distinctDates = Array.from(new Set(dateColumns.map(function (d) { return d.dateStr; })));

    for (var i = dataStartRow; i < rows.length; i++) {
      var row = rows[i];
      if (!row || !row.length) continue;

      var rawId = String(row[empIdCol] || "").trim();
      if (!rawId || rawId.toLowerCase().includes("total") || rawId.toLowerCase().includes("create time")) continue;

      // Clean ID (e.g., "1.0" -> "1", "10000020.0" -> "10000020")
      var empId = rawId.replace(/\.0+$/, "");
      var cardNo = String(row[cardNoCol] || "").trim();
      var name = String(row[nameCol] || "").trim();
      var dept = String(row[deptCol] || "CESTAFF").trim() || "CESTAFF";

      if (!name && !empId) continue;
      if (!name) name = "Funcionário " + empId;

      dateColumns.forEach(function (dateCol) {
        var cellContent = String(row[dateCol.colIndex] || "").trim();
        var punchInfo = parsePunchCell(cellContent, settings);

        records.push({
          attendance_date: dateCol.dateStr,
          employee_id: empId,
          employee_name: name,
          card_no: cardNo,
          department: dept,
          check_in: punchInfo.checkIn,
          check_out: punchInfo.checkOut,
          all_punches: cellContent || "--:-- --:--",
          status: punchInfo.status,
          delay_minutes: punchInfo.delayMinutes,
          is_late: punchInfo.isLate,
          is_present: punchInfo.isPresent,
        });
      });
    }

    var stats = {
      total: records.length,
      present: records.filter(function (r) { return r.is_present; }).length,
      on_time: records.filter(function (r) { return r.status === "on_time"; }).length,
      grace: records.filter(function (r) { return r.status === "grace_period"; }).length,
      minor_delay: records.filter(function (r) { return r.status === "minor_delay"; }).length,
      late: records.filter(function (r) { return r.status === "late"; }).length,
      severe_delay: records.filter(function (r) { return r.status === "severe_delay"; }).length,
      absent: records.filter(function (r) { return !r.is_present; }).length,
    };

    return {
      createTime: createTime,
      records: records,
      dates: distinctDates,
      stats: stats,
    };
  }

  function extractRecordsFromCsvText(csvText, settings) {
    var lines = csvText.split(/\r?\n/);
    var matrix = lines.map(function (line) {
      // Basic CSV parser handling quotes
      var result = [];
      var cur = "";
      var inQuotes = false;
      for (var i = 0; i < line.length; i++) {
        var ch = line[i];
        if (ch === '"') {
          inQuotes = !inQuotes;
        } else if (ch === "," && !inQuotes) {
          result.push(cur);
          cur = "";
        } else {
          cur += ch;
        }
      }
      result.push(cur);
      return result;
    });

    return extractRecordsFromRawMatrix(matrix, settings);
  }

  function parsePunchCell(cellContent, settings) {
    if (!cellContent || typeof cellContent !== "string") {
      return {
        checkIn: null,
        checkOut: null,
        status: "absent",
        delayMinutes: 0,
        isLate: false,
        isPresent: false,
      };
    }

    // Extract all time patterns (HH:MM or H:MM)
    var times = cellContent.match(/\b([01]?\d|2[0-3]):[0-5]\d\b/g) || [];
    // Filter out dummy times if any
    var validTimes = times.filter(function (t) { return t !== "--:--"; });

    if (!validTimes.length) {
      return {
        checkIn: null,
        checkOut: null,
        status: "absent",
        delayMinutes: 0,
        isLate: false,
        isPresent: false,
      };
    }

    var checkIn = validTimes[0];
    var checkOut = validTimes.length > 1 ? validTimes[validTimes.length - 1] : null;
    var calc = getBridge().calculatePunctualityStatus(checkIn, settings);

    return {
      checkIn: checkIn,
      checkOut: checkOut,
      status: calc.status,
      delayMinutes: calc.delay_minutes,
      isLate: calc.is_late,
      isPresent: calc.is_present,
    };
  }

  // =========================================================================
  // Main Module Render Dispatcher
  // =========================================================================

  var currentMountContainer = null;

  window.renderAttendance = async function (subTab, customMount) {
    if (subTab) attendancePageState.tab = subTab;
    if (customMount) currentMountContainer = customMount;

    var container = customMount || currentMountContainer || document.getElementById("content");
    if (!container) return;

    var activeTab = attendancePageState.tab || "daily";
    var isEmbedded = Boolean(customMount || (currentMountContainer && currentMountContainer !== document.getElementById("content")));

    var tabs = [
      { id: "daily", label: "Visão Diária", icon: "bi-calendar-day" },
      { id: "monthly", label: "Análise Periódica", icon: "bi-bar-chart-steps" },
      { id: "trajectory", label: "Trajetória Individual", icon: "bi-person-badge" },
      { id: "upload", label: "Importar Ficheiro", icon: "bi-cloud-arrow-up-fill" },
      { id: "reports", label: "Relatórios & Exportações", icon: "bi-file-earmark-pdf-fill" },
      { id: "settings", label: "Configurações", icon: "bi-sliders" },
    ];

    var tabNavHtml = `
      <div class="dept-nav-wrapper mb-4">
        <ul class="nav nav-pills custom-dept-tabs" role="tablist">
          ${tabs.map(function (t) {
            var active = t.id === activeTab ? "active" : "";
            return `
              <li class="nav-item" role="presentation">
                <button type="button" class="nav-link ${active}" data-attendance-tab="${t.id}">
                  <i class="bi ${t.icon} me-1.5"></i>${t.label}
                </button>
              </li>`;
          }).join("")}
        </ul>
      </div>`;

    var contentHtml = `<div class="p-4 text-center text-muted"><div class="spinner-border spinner-border-sm me-2"></div>A carregar dados de assiduidade...</div>`;

    var headerHtml = isEmbedded ? `
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3 pb-2 border-bottom border-secondary border-opacity-25">
        <div>
          <h3 class="h5 fw-bold text-white mb-0">Controlo de Assiduidade & Ponto Biométrico</h3>
          <p class="text-secondary small mb-0">Processamento de picagens biométricas, cálculo de pontualidade e relatórios</p>
        </div>
        <div class="d-flex align-items-center gap-2">
          <button type="button" class="btn btn-sm btn-outline-warning" data-attendance-tab="upload">
            <i class="bi bi-upload me-1.5"></i>Importar Ficheiro
          </button>
          <button type="button" class="btn btn-sm btn-ce-gold" data-attendance-quick-export="daily">
            <i class="bi bi-file-earmark-pdf me-1.5"></i>Dossiê em PDF
          </button>
        </div>
      </div>
    ` : `
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <div class="d-flex align-items-center gap-2 mb-1">
            <span class="badge bg-gold-subtle text-gold text-uppercase px-2 py-1 fw-bold tracking-wider" style="letter-spacing: 0.05em; font-size: 0.72rem;">
              <i class="bi bi-fingerprint me-1"></i>RECURSOS HUMANOS & ASSIDUIDADE
            </span>
          </div>
          <h2 class="h3 fw-bold text-white mb-0">Controlo de Assiduidade e Pontualidade</h2>
          <p class="text-secondary small mb-0 mt-0.5">Sistema de processamento biométrico, pontualidade de funcionários e histórico de presenças</p>
        </div>
        <div class="d-flex align-items-center gap-2">
          <button type="button" class="btn btn-sm btn-outline-warning" data-attendance-tab="upload">
            <i class="bi bi-upload me-1.5"></i>Importar Excel / CSV
          </button>
          <button type="button" class="btn btn-sm btn-ce-gold" data-attendance-quick-export="daily">
            <i class="bi bi-file-earmark-pdf me-1.5"></i>Dossiê em PDF
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

    // Render active tab content
    renderTabContent(activeTab);
    attachModuleEventListeners();
  };

  async function renderTabContent(tab) {
    var body = document.getElementById("attendanceTabBody");
    if (!body) return;

    if (tab === "daily") {
      body.innerHTML = await renderDailyViewHtml();
    } else if (tab === "monthly") {
      body.innerHTML = await renderMonthlyViewHtml();
    } else if (tab === "trajectory") {
      body.innerHTML = await renderTrajectoryViewHtml();
    } else if (tab === "upload") {
      body.innerHTML = await renderUploadViewHtml();
    } else if (tab === "reports") {
      body.innerHTML = await renderReportsViewHtml();
    } else if (tab === "settings") {
      body.innerHTML = await renderSettingsViewHtml();
    }
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

    // Filter table by status
    var displayedRecords = records;
    if (attendancePageState.dailyFilter === "on_time") displayedRecords = onTimeRecords;
    else if (attendancePageState.dailyFilter === "grace_period") displayedRecords = graceRecords;
    else if (attendancePageState.dailyFilter === "minor_delay") displayedRecords = minorDelayRecords;
    else if (attendancePageState.dailyFilter === "late") displayedRecords = lateRecords;
    else if (attendancePageState.dailyFilter === "severe_delay") displayedRecords = severeDelayRecords;
    else if (attendancePageState.dailyFilter === "late_all") displayedRecords = allLateRecords;
    else if (attendancePageState.dailyFilter === "absent") displayedRecords = absentRecords;

    // Build KPI Cards HTML with interactive click triggers
    var kpisHtml = `
      <div class="row g-3 mb-4" id="attendanceDailyKpis">
        <div class="col-6 col-md-4 col-xl-2">
          <div class="metric-card ${attendancePageState.dailyFilter === "all" ? "ring-gold" : ""}" data-attendance-filter="all" role="button" tabindex="0" title="Ver todos os funcionários registados">
            <div class="metric-icon"><i class="bi bi-people-fill"></i></div>
            <div class="metric-value">${totalRecords}</div>
            <div class="metric-label">Total Registados</div>
            <div class="metric-delta"><span class="delta-neutral">Biometria</span></div>
          </div>
        </div>
        <div class="col-6 col-md-4 col-xl-2">
          <div class="metric-card" data-attendance-filter="all" role="button" tabindex="0" title="Presentes no local de trabalho">
            <div class="metric-icon text-info"><i class="bi bi-person-check-fill"></i></div>
            <div class="metric-value text-info">${presentRecords.length}</div>
            <div class="metric-label">Presentes Hoje</div>
            <div class="metric-delta"><span class="delta-positive">${totalRecords ? Math.round((presentRecords.length / totalRecords) * 100) : 0}% taxa</span></div>
          </div>
        </div>
        <div class="col-6 col-md-4 col-xl-2">
          <div class="metric-card ${attendancePageState.dailyFilter === "on_time" ? "ring-gold" : ""}" data-attendance-filter="on_time" role="button" tabindex="0" title="Chegaram antes ou no horário oficial (≤ 08:00)">
            <div class="metric-icon text-success"><i class="bi bi-check-circle-fill"></i></div>
            <div class="metric-value text-success">${onTimeRecords.length}</div>
            <div class="metric-label">No Horário (≤08:00)</div>
            <div class="metric-delta"><span class="delta-positive">Pontuais</span></div>
          </div>
        </div>
        <div class="col-6 col-md-4 col-xl-2">
          <div class="metric-card ${attendancePageState.dailyFilter === "grace_period" ? "ring-gold" : ""}" data-attendance-filter="grace_period" role="button" tabindex="0" title="Chegaram dentro dos 15 minutos de tolerância">
            <div class="metric-icon text-info"><i class="bi bi-clock-history"></i></div>
            <div class="metric-value text-info">${graceRecords.length}</div>
            <div class="metric-label">Tolerância (+15m)</div>
            <div class="metric-delta"><span class="delta-neutral">Autorizado</span></div>
          </div>
        </div>
        <div class="col-6 col-md-4 col-xl-2">
          <div class="metric-card ${attendancePageState.dailyFilter === "late_all" ? "ring-gold" : ""}" data-attendance-filter="late_all" role="button" tabindex="0" title="Chegaram após a tolerância (> 08:15)">
            <div class="metric-icon text-danger"><i class="bi bi-exclamation-triangle-fill"></i></div>
            <div class="metric-value text-danger">${allLateRecords.length}</div>
            <div class="metric-label">Total em Atraso</div>
            <div class="metric-delta"><span class="delta-negative">${allLateRecords.length > 0 ? "Atenção RH" : "Excelente"}</span></div>
          </div>
        </div>
        <div class="col-6 col-md-4 col-xl-2">
          <div class="metric-card ${attendancePageState.dailyFilter === "absent" ? "ring-gold" : ""}" data-attendance-filter="absent" role="button" tabindex="0" title="Sem registo de picagem no terminal">
            <div class="metric-icon text-secondary"><i class="bi bi-dash-circle-fill"></i></div>
            <div class="metric-value text-secondary">${absentRecords.length}</div>
            <div class="metric-label">Sem Registo / Falta</div>
            <div class="metric-delta"><span class="delta-neutral">Não picou</span></div>
          </div>
        </div>
      </div>`;

    // Filter Chips & Date Toolbar
    var toolbarHtml = `
      <div class="card bg-surface-dark border-secondary border-opacity-25 mb-4 p-3 shadow-sm">
        <div class="row g-3 align-items-center">
          <div class="col-12 col-md-auto d-flex align-items-center gap-2">
            <label class="text-secondary small fw-semibold mb-0"><i class="bi bi-calendar-event me-1"></i>Data do Registo:</label>
            <input type="date" class="form-control form-control-sm bg-dark text-white border-secondary" id="attendanceDatePicker" value="${date}" style="max-width: 160px;">
            <button type="button" class="btn btn-sm btn-outline-secondary" id="attendancePrevDayBtn" title="Dia Anterior"><i class="bi bi-chevron-left"></i></button>
            <button type="button" class="btn btn-sm btn-outline-secondary" id="attendanceTodayBtn" title="Hoje">Hoje</button>
            <button type="button" class="btn btn-sm btn-outline-secondary" id="attendanceNextDayBtn" title="Dia Seguinte"><i class="bi bi-chevron-right"></i></button>
          </div>

          <div class="col-12 col-md d-flex flex-wrap align-items-center justify-content-md-end gap-2">
            <div class="input-group input-group-sm" style="max-width: 240px;">
              <span class="input-group-text bg-dark text-secondary border-secondary"><i class="bi bi-search"></i></span>
              <input type="text" class="form-control bg-dark text-white border-secondary" id="attendanceSearchInput" placeholder="Procurar funcionário..." value="${attendancePageState.searchQuery}">
            </div>

            <select class="form-select form-select-sm bg-dark text-white border-secondary" id="attendanceDeptFilter" style="max-width: 160px;">
              <option value="all" ${attendancePageState.selectedDepartment === "all" ? "selected" : ""}>Todos Departamentos</option>
              <option value="CESTAFF" ${attendancePageState.selectedDepartment === "CESTAFF" ? "selected" : ""}>CESTAFF</option>
            </select>

            <button type="button" class="btn btn-sm btn-outline-light" id="attendanceExportDailyCsv" title="Exportar CSV do dia">
              <i class="bi bi-download me-1"></i>CSV
            </button>
          </div>
        </div>

        <div class="d-flex flex-wrap align-items-center gap-1.5 mt-3 pt-2 border-top border-secondary border-opacity-15">
          <span class="text-secondary small me-2">Filtrar por Status:</span>
          <button type="button" class="btn btn-xs ${attendancePageState.dailyFilter === "all" ? "btn-ce-gold" : "btn-outline-secondary text-white"}" data-attendance-filter="all">Todos (${totalRecords})</button>
          <button type="button" class="btn btn-xs ${attendancePageState.dailyFilter === "on_time" ? "btn-success" : "btn-outline-success"}" data-attendance-filter="on_time">Pontual (${onTimeRecords.length})</button>
          <button type="button" class="btn btn-xs ${attendancePageState.dailyFilter === "grace_period" ? "btn-info" : "btn-outline-info"}" data-attendance-filter="grace_period">Tolerância (${graceRecords.length})</button>
          <button type="button" class="btn btn-xs ${attendancePageState.dailyFilter === "minor_delay" ? "btn-warning" : "btn-outline-warning"}" data-attendance-filter="minor_delay">Atraso Ligeiro (${minorDelayRecords.length})</button>
          <button type="button" class="btn btn-xs ${attendancePageState.dailyFilter === "late" ? "btn-danger" : "btn-outline-danger"}" data-attendance-filter="late">Atrasado (${lateRecords.length})</button>
          <button type="button" class="btn btn-xs ${attendancePageState.dailyFilter === "severe_delay" ? "btn-danger" : "btn-outline-danger"}" data-attendance-filter="severe_delay">Muito Tarde (${severeDelayRecords.length})</button>
          <button type="button" class="btn btn-xs ${attendancePageState.dailyFilter === "absent" ? "btn-secondary" : "btn-outline-secondary"}" data-attendance-filter="absent">Sem Registo (${absentRecords.length})</button>
        </div>
      </div>`;

    // Records Table
    var tableHtml = `
      <div class="card bg-surface-dark border-secondary border-opacity-25 shadow-sm overflow-hidden">
        <div class="card-header bg-dark bg-opacity-40 border-bottom border-secondary border-opacity-25 py-3 d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center gap-2">
            <i class="bi bi-clock-history text-gold"></i>
            <h5 class="h6 mb-0 text-white fw-bold">Registos de Ponto — ${formatDatePt(date)}</h5>
            <span class="badge bg-secondary-subtle text-secondary ms-2">${displayedRecords.length} pessoas</span>
          </div>
          <div class="text-secondary small">
            Hora Média de Entrada: <strong class="text-white">${avgCheckInStr}</strong>
          </div>
        </div>

        <div class="table-responsive">
          <table class="table table-dark table-hover align-middle mb-0" id="attendanceDailyTable">
            <thead class="text-secondary text-uppercase small" style="font-size: 0.75rem; letter-spacing: 0.04em;">
              <tr>
                <th class="ps-3" style="width: 70px;">ID</th>
                <th>Funcionário / Staff</th>
                <th>Departamento</th>
                <th class="text-center">Hora de Entrada</th>
                <th class="text-center">Classificação</th>
                <th class="text-center">Tempo de Atraso</th>
                <th>Picagens Brutas</th>
                <th class="text-end pe-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              ${displayedRecords.length ? displayedRecords.map(function (rec) {
                var avatarInitial = (rec.employee_name || "?").charAt(0).toUpperCase();
                return `
                  <tr>
                    <td class="ps-3">
                      <span class="badge bg-dark border border-secondary border-opacity-50 text-secondary font-monospace">${rec.employee_id}</span>
                    </td>
                    <td>
                      <div class="d-flex align-items-center gap-2.5">
                        <div class="avatar-circle-sm bg-gradient-navy text-gold fw-bold">
                          ${avatarInitial}
                        </div>
                        <div>
                          <div class="text-white fw-semibold mb-0">${rec.employee_name}</div>
                          ${rec.card_no ? `<span class="text-muted small" style="font-size: 0.72rem;"><i class="bi bi-credit-card me-1"></i>${rec.card_no}</span>` : ""}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="badge bg-dark text-secondary border border-secondary border-opacity-25">${rec.department || "CESTAFF"}</span>
                    </td>
                    <td class="text-center">
                      ${rec.check_in ? `<span class="fs-6 fw-bold ${rec.is_late ? "text-danger" : "text-white"} font-monospace">${rec.check_in}</span>` : `<span class="text-muted font-monospace">--:--</span>`}
                    </td>
                    <td class="text-center">
                      ${getStatusBadge(rec.status, rec.delay_minutes)}
                    </td>
                    <td class="text-center">
                      ${formatDelay(rec.delay_minutes)}
                    </td>
                    <td>
                      <span class="text-muted small font-monospace" style="font-size: 0.75rem;">
                        ${(rec.all_punches || "--:--").replace(/\n/g, " | ")}
                      </span>
                    </td>
                    <td class="text-end pe-3">
                      <div class="btn-group btn-group-sm">
                        <button type="button" class="btn btn-outline-secondary text-secondary" data-view-trajectory="${rec.employee_id}" title="Ver Trajetória Individual">
                          <i class="bi bi-graph-up-arrow"></i>
                        </button>
                        <button type="button" class="btn btn-outline-secondary text-secondary" data-edit-attendance="${rec.id || ""}" data-emp-id="${rec.employee_id}" data-date="${rec.attendance_date}" title="Editar / Adicionar Nota">
                          <i class="bi bi-pencil"></i>
                        </button>
                      </div>
                    </td>
                  </tr>`;
              }).join("") : `
                <tr>
                  <td colspan="8" class="text-center py-5 text-muted">
                    <i class="bi bi-inbox fs-2 d-block mb-2 text-secondary"></i>
                    Nenhum registo de ponto encontrado para os filtros selecionados (${date}).
                    <div class="mt-2">
                      <button type="button" class="btn btn-xs btn-ce-gold" data-attendance-tab="upload"><i class="bi bi-upload me-1"></i>Importar Ficheiro do Dia</button>
                    </div>
                  </td>
                </tr>`}
            </tbody>
          </table>
        </div>
      </div>`;

    return kpisHtml + toolbarHtml + tableHtml;
  }

  // =========================================================================
  // Tab 2: Monthly & Period Analytics (Análise Periódica & Tendências)
  // =========================================================================

  async function renderMonthlyViewHtml() {
    var start = attendancePageState.startDate || "2026-07-01";
    var end = attendancePageState.endDate || "2026-07-31";

    var stats = await getBridge().getAggregatePeriodStats(start, end);

    var topPunctualList = (stats.topPunctual || []).slice(0, 5);
    var topLateList = (stats.topLate || []).slice(0, 5);

    // Distribution groups
    var bucket1 = stats.records.filter(function (r) { return r.check_in && r.check_in < "08:00"; }).length;
    var bucket2 = stats.records.filter(function (r) { return r.check_in && r.check_in >= "08:00" && r.check_in <= "08:15"; }).length;
    var bucket3 = stats.records.filter(function (r) { return r.check_in && r.check_in > "08:15" && r.check_in <= "08:30"; }).length;
    var bucket4 = stats.records.filter(function (r) { return r.check_in && r.check_in > "08:30" && r.check_in <= "09:00"; }).length;
    var bucket5 = stats.records.filter(function (r) { return r.check_in && r.check_in > "09:00"; }).length;
    var totalPresentWithTime = bucket1 + bucket2 + bucket3 + bucket4 + bucket5 || 1;

    var headerPeriodHtml = `
      <div class="card bg-surface-dark border-secondary border-opacity-25 p-3 mb-4 shadow-sm">
        <div class="row g-3 align-items-center justify-content-between">
          <div class="col-12 col-md-auto d-flex flex-wrap align-items-center gap-2">
            <span class="text-secondary small fw-semibold me-1"><i class="bi bi-calendar-range me-1"></i>Período de Análise:</span>
            <div class="btn-group btn-group-sm" role="group">
              <button type="button" class="btn ${attendancePageState.monthlyPeriod === "this_month" ? "btn-ce-gold" : "btn-outline-secondary text-white"}" data-period-btn="this_month">Julho 2026</button>
              <button type="button" class="btn ${attendancePageState.monthlyPeriod === "3_months" ? "btn-ce-gold" : "btn-outline-secondary text-white"}" data-period-btn="3_months">Últimos 3 Meses</button>
              <button type="button" class="btn ${attendancePageState.monthlyPeriod === "6_months" ? "btn-ce-gold" : "btn-outline-secondary text-white"}" data-period-btn="6_months">Últimos 6 Meses</button>
              <button type="button" class="btn ${attendancePageState.monthlyPeriod === "year" ? "btn-ce-gold" : "btn-outline-secondary text-white"}" data-period-btn="year">Ano 2026</button>
            </div>
          </div>

          <div class="col-12 col-md-auto d-flex align-items-center gap-2">
            <span class="text-secondary small">De:</span>
            <input type="date" class="form-control form-control-sm bg-dark text-white border-secondary" id="periodStartDate" value="${start}" style="max-width: 140px;">
            <span class="text-secondary small">Até:</span>
            <input type="date" class="form-control form-control-sm bg-dark text-white border-secondary" id="periodEndDate" value="${end}" style="max-width: 140px;">
            <button type="button" class="btn btn-sm btn-outline-warning" id="applyPeriodFilterBtn"><i class="bi bi-funnel"></i> Aplicar</button>
          </div>
        </div>
      </div>`;

    // Overview Stats Strip
    var statsStripHtml = `
      <div class="row g-3 mb-4">
        <div class="col-12 col-md-6 col-xl-3">
          <div class="card bg-surface-dark border-secondary border-opacity-25 p-3.5 h-100 shadow-sm">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <span class="text-secondary small fw-semibold text-uppercase">Taxa de Pontualidade</span>
              <div class="avatar-circle-xs bg-success-subtle text-success"><i class="bi bi-pie-chart-fill"></i></div>
            </div>
            <h3 class="h2 fw-bold text-white mb-1">${stats.onTimeRate}%</h3>
            <div class="progress progress-sm bg-dark mb-2" style="height: 6px;">
              <div class="progress-bar bg-success" style="width: ${stats.onTimeRate}%"></div>
            </div>
            <p class="text-muted small mb-0">${stats.onTimeCount + stats.graceCount} de ${stats.totalRecords} presenças pontuais/tolerância</p>
          </div>
        </div>

        <div class="col-12 col-md-6 col-xl-3">
          <div class="card bg-surface-dark border-secondary border-opacity-25 p-3.5 h-100 shadow-sm">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <span class="text-secondary small fw-semibold text-uppercase">Total Horas de Atraso</span>
              <div class="avatar-circle-xs bg-danger-subtle text-danger"><i class="bi bi-clock-history"></i></div>
            </div>
            <h3 class="h2 fw-bold text-danger mb-1">${Math.floor(stats.totalDelayMinutes / 60)}h ${stats.totalDelayMinutes % 60}m</h3>
            <div class="text-secondary small mb-0 mt-2">
              Acumulado em <strong class="text-white">${stats.allLateCount}</strong> ocorrências de atraso
            </div>
          </div>
        </div>

        <div class="col-12 col-md-6 col-xl-3">
          <div class="card bg-surface-dark border-secondary border-opacity-25 p-3.5 h-100 shadow-sm">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <span class="text-secondary small fw-semibold text-uppercase">Funcionários Monitorados</span>
              <div class="avatar-circle-xs bg-info-subtle text-info"><i class="bi bi-people-fill"></i></div>
            </div>
            <h3 class="h2 fw-bold text-info mb-1">${stats.distinctEmployeesCount}</h3>
            <div class="text-secondary small mb-0 mt-2">
              Em <strong class="text-white">${stats.distinctDaysCount}</strong> dias de expediente registados
            </div>
          </div>
        </div>

        <div class="col-12 col-md-6 col-xl-3">
          <div class="card bg-surface-dark border-secondary border-opacity-25 p-3.5 h-100 shadow-sm">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <span class="text-secondary small fw-semibold text-uppercase">Média de Atraso</span>
              <div class="avatar-circle-xs bg-warning-subtle text-warning"><i class="bi bi-hourglass-split"></i></div>
            </div>
            <h3 class="h2 fw-bold text-warning mb-1">${stats.allLateCount ? Math.round(stats.totalDelayMinutes / stats.allLateCount) : 0} min</h3>
            <div class="text-secondary small mb-0 mt-2">
              Por cada funcionário em atraso
            </div>
          </div>
        </div>
      </div>`;

    // Leaderboards & Distribution
    var rankingsHtml = `
      <div class="row g-4 mb-4">
        <!-- Top Mais Pontuais -->
        <div class="col-12 col-lg-6">
          <div class="card bg-surface-dark border-secondary border-opacity-25 shadow-sm h-100">
            <div class="card-header bg-dark bg-opacity-40 border-bottom border-secondary border-opacity-25 py-3 d-flex align-items-center justify-content-between">
              <div class="d-flex align-items-center gap-2">
                <i class="bi bi-award-fill text-gold fs-5"></i>
                <h5 class="h6 mb-0 text-white fw-bold">Hall da Pontualidade (Mais Consistentes)</h5>
              </div>
              <span class="badge bg-success-subtle text-success">Top Assiduidade</span>
            </div>
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-dark table-hover align-middle mb-0">
                  <thead class="text-secondary small text-uppercase" style="font-size: 0.72rem;">
                    <tr>
                      <th class="ps-3" style="width: 40px;">#</th>
                      <th>Funcionário</th>
                      <th class="text-center">Hora Média</th>
                      <th class="text-center">Pontuais</th>
                      <th class="text-end pe-3">Taxa</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${topPunctualList.length ? topPunctualList.map(function (emp, idx) {
                      var medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}º`;
                      return `
                        <tr>
                          <td class="ps-3 fw-bold text-secondary">${medal}</td>
                          <td>
                            <div class="d-flex align-items-center gap-2">
                              <div class="avatar-circle-xs bg-dark text-gold fw-bold">${(emp.employee_name || "?").charAt(0)}</div>
                              <div>
                                <div class="text-white fw-semibold small">${emp.employee_name}</div>
                                <span class="text-muted" style="font-size: 0.7rem;">ID: ${emp.employee_id}</span>
                              </div>
                            </div>
                          </td>
                          <td class="text-center font-monospace text-info small">${emp.avgCheckInTime}</td>
                          <td class="text-center small"><strong class="text-success">${emp.onTimeDays + emp.graceDays}</strong> / ${emp.totalDays}</td>
                          <td class="text-end pe-3">
                            <span class="badge ${emp.onTimeRate >= 80 ? "bg-success" : "bg-warning text-dark"}">${emp.onTimeRate}%</span>
                          </td>
                        </tr>`;
                    }).join("") : `<tr><td colspan="5" class="text-center py-4 text-muted">Sem dados</td></tr>`}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- Top Atrasos Recorrentes -->
        <div class="col-12 col-lg-6">
          <div class="card bg-surface-dark border-secondary border-opacity-25 shadow-sm h-100">
            <div class="card-header bg-dark bg-opacity-40 border-bottom border-secondary border-opacity-25 py-3 d-flex align-items-center justify-content-between">
              <div class="d-flex align-items-center gap-2">
                <i class="bi bi-exclamation-triangle-fill text-danger fs-5"></i>
                <h5 class="h6 mb-0 text-white fw-bold">Atenção RH (Atrasos Recorrentes)</h5>
              </div>
              <span class="badge bg-danger-subtle text-danger">Necessita Ação</span>
            </div>
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-dark table-hover align-middle mb-0">
                  <thead class="text-secondary small text-uppercase" style="font-size: 0.72rem;">
                    <tr>
                      <th class="ps-3" style="width: 40px;">#</th>
                      <th>Funcionário</th>
                      <th class="text-center">Dias Atraso</th>
                      <th class="text-center">Tempo Acumulado</th>
                      <th class="text-end pe-3">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${topLateList.length ? topLateList.map(function (emp, idx) {
                      var delayH = Math.floor(emp.totalDelayMins / 60);
                      var delayM = emp.totalDelayMins % 60;
                      var delayF = delayH > 0 ? `${delayH}h ${delayM}m` : `${delayM} min`;
                      return `
                        <tr>
                          <td class="ps-3 fw-bold text-danger">${idx + 1}º</td>
                          <td>
                            <div class="d-flex align-items-center gap-2">
                              <div class="avatar-circle-xs bg-dark text-danger fw-bold">${(emp.employee_name || "?").charAt(0)}</div>
                              <div>
                                <div class="text-white fw-semibold small">${emp.employee_name}</div>
                                <span class="text-muted" style="font-size: 0.7rem;">ID: ${emp.employee_id} • ${emp.department}</span>
                              </div>
                            </div>
                          </td>
                          <td class="text-center">
                            <span class="badge bg-danger-subtle text-danger">${emp.lateDays} dias</span>
                          </td>
                          <td class="text-center font-monospace fw-bold text-danger small">
                            ${delayF}
                          </td>
                          <td class="text-end pe-3">
                            <button type="button" class="btn btn-xs btn-outline-warning" data-view-trajectory="${emp.employee_id}" title="Ver Histórico Completo">
                              <i class="bi bi-eye me-1"></i>Dossiê
                            </button>
                          </td>
                        </tr>`;
                    }).join("") : `<tr><td colspan="5" class="text-center py-4 text-muted">Nenhum atraso significativo no período.</td></tr>`}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>`;

    // Distribution of arrival times
    var distributionHtml = `
      <div class="card bg-surface-dark border-secondary border-opacity-25 shadow-sm p-4 mb-4">
        <h5 class="h6 mb-3 text-white fw-bold"><i class="bi bi-bar-chart-fill text-gold me-2"></i>Distribuição dos Horários de Chegada no Período</h5>
        
        <div class="row g-3">
          <div class="col-12 col-md">
            <div class="p-3 bg-dark bg-opacity-60 rounded border border-secondary border-opacity-20 text-center">
              <span class="text-success small fw-semibold d-block mb-1">Antes das 08:00</span>
              <h4 class="text-success fw-bold mb-1">${bucket1}</h4>
              <span class="text-muted small">${Math.round((bucket1 / totalPresentWithTime) * 100)}%</span>
            </div>
          </div>
          <div class="col-12 col-md">
            <div class="p-3 bg-dark bg-opacity-60 rounded border border-secondary border-opacity-20 text-center">
              <span class="text-info small fw-semibold d-block mb-1">08:00 – 08:15 (Tolerância)</span>
              <h4 class="text-info fw-bold mb-1">${bucket2}</h4>
              <span class="text-muted small">${Math.round((bucket2 / totalPresentWithTime) * 100)}%</span>
            </div>
          </div>
          <div class="col-12 col-md">
            <div class="p-3 bg-dark bg-opacity-60 rounded border border-secondary border-opacity-20 text-center">
              <span class="text-warning small fw-semibold d-block mb-1">08:16 – 08:30 (Ligeiro)</span>
              <h4 class="text-warning fw-bold mb-1">${bucket3}</h4>
              <span class="text-muted small">${Math.round((bucket3 / totalPresentWithTime) * 100)}%</span>
            </div>
          </div>
          <div class="col-12 col-md">
            <div class="p-3 bg-dark bg-opacity-60 rounded border border-secondary border-opacity-20 text-center">
              <span class="text-danger small fw-semibold d-block mb-1">08:31 – 09:00 (Atraso)</span>
              <h4 class="text-danger fw-bold mb-1">${bucket4}</h4>
              <span class="text-muted small">${Math.round((bucket4 / totalPresentWithTime) * 100)}%</span>
            </div>
          </div>
          <div class="col-12 col-md">
            <div class="p-3 bg-dark bg-opacity-60 rounded border border-secondary border-opacity-20 text-center">
              <span class="text-danger fw-bold small d-block mb-1">Após as 09:00 (Grave)</span>
              <h4 class="text-white fw-bold mb-1">${bucket5}</h4>
              <span class="text-muted small">${Math.round((bucket5 / totalPresentWithTime) * 100)}%</span>
            </div>
          </div>
        </div>
      </div>`;

    return headerPeriodHtml + statsStripHtml + rankingsHtml + distributionHtml;
  }

  // =========================================================================
  // Tab 3: Staff Individual Trajectory (Trajetória Individual & Ficha)
  // =========================================================================

  async function renderTrajectoryViewHtml() {
    var allStaffRes = await getBridge().listAttendanceRecords({});
    var distinctEmployees = [];
    var seen = new Set();
    (allStaffRes.data || []).forEach(function (r) {
      if (!seen.has(r.employee_id)) {
        seen.add(r.employee_id);
        distinctEmployees.push({ id: r.employee_id, name: r.employee_name, dept: r.department });
      }
    });

    var selectedId = attendancePageState.selectedStaffId || (distinctEmployees[0] ? distinctEmployees[0].id : "1");
    var trajectory = await getBridge().getStaffTrajectory(selectedId, "2026-01-01", "2026-12-31");

    var selectorHtml = `
      <div class="card bg-surface-dark border-secondary border-opacity-25 p-3.5 mb-4 shadow-sm">
        <div class="row g-3 align-items-center justify-content-between">
          <div class="col-12 col-md-6 d-flex align-items-center gap-3">
            <label class="text-secondary small fw-semibold mb-0 text-nowrap"><i class="bi bi-person-bounding-box me-1"></i>Selecionar Staff:</label>
            <select class="form-select bg-dark text-white border-secondary" id="trajectoryStaffSelect">
              ${distinctEmployees.map(function (e) {
                return `<option value="${e.id}" ${e.id === selectedId ? "selected" : ""}>${e.name} (ID: ${e.id}) — ${e.dept}</option>`;
              }).join("")}
            </select>
          </div>
          <div class="col-12 col-md-auto d-flex align-items-center gap-2">
            <button type="button" class="btn btn-sm btn-ce-gold" id="exportStaffDossierPdfBtn">
              <i class="bi bi-file-earmark-pdf-fill me-1.5"></i>Imprimir Dossiê do Funcionário
            </button>
          </div>
        </div>
      </div>`;

    var profileHeaderHtml = `
      <div class="card bg-surface-dark border-secondary border-opacity-25 p-4 mb-4 shadow-sm">
        <div class="row g-4 align-items-center">
          <div class="col-12 col-md-auto text-center text-md-start">
            <div class="avatar-circle-lg bg-gradient-navy text-gold fw-bold mx-auto border border-gold border-opacity-30" style="width: 72px; height: 72px; font-size: 1.8rem;">
              ${(trajectory.employee_name || "?").charAt(0)}
            </div>
          </div>
          <div class="col-12 col-md">
            <div class="d-flex flex-wrap align-items-center gap-2 mb-1">
              <h3 class="h4 text-white fw-bold mb-0">${trajectory.employee_name}</h3>
              <span class="badge bg-gold-subtle text-gold">ID: ${trajectory.employee_id}</span>
              <span class="badge bg-dark border border-secondary border-opacity-40 text-secondary">${trajectory.department}</span>
            </div>
            <p class="text-secondary small mb-0">LoveWorld Christ Embassy Mozambique • Assiduidade e Pontualidade</p>
          </div>
          <div class="col-12 col-md-auto">
            <div class="d-flex flex-wrap gap-2 justify-content-center justify-content-md-end">
              <div class="px-3 py-2 bg-dark rounded border border-secondary border-opacity-25 text-center">
                <span class="text-secondary small d-block" style="font-size: 0.7rem;">TAXA PONTUALIDADE</span>
                <span class="fs-5 fw-bold ${trajectory.onTimeRate >= 80 ? "text-success" : trajectory.onTimeRate >= 60 ? "text-warning" : "text-danger"}">${trajectory.onTimeRate}%</span>
              </div>
              <div class="px-3 py-2 bg-dark rounded border border-secondary border-opacity-25 text-center">
                <span class="text-secondary small d-block" style="font-size: 0.7rem;">MÉDIA ENTRADA</span>
                <span class="fs-5 fw-bold text-info font-monospace">${trajectory.avgCheckInTime}</span>
              </div>
              <div class="px-3 py-2 bg-dark rounded border border-secondary border-opacity-25 text-center">
                <span class="text-secondary small d-block" style="font-size: 0.7rem;">TOTAL ATRASO</span>
                <span class="fs-5 fw-bold text-danger font-monospace">${trajectory.totalDelayMinutes}m</span>
              </div>
            </div>
          </div>
        </div>
      </div>`;

    var historyTableHtml = `
      <div class="card bg-surface-dark border-secondary border-opacity-25 shadow-sm overflow-hidden">
        <div class="card-header bg-dark bg-opacity-40 border-bottom border-secondary border-opacity-25 py-3 d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center gap-2">
            <i class="bi bi-clock-history text-gold"></i>
            <h5 class="h6 mb-0 text-white fw-bold">Histórico de Picagens de Ponto</h5>
          </div>
          <span class="badge bg-secondary-subtle text-secondary">${trajectory.records.length} registos no histórico</span>
        </div>

        <div class="table-responsive">
          <table class="table table-dark table-hover align-middle mb-0">
            <thead class="text-secondary text-uppercase small" style="font-size: 0.75rem;">
              <tr>
                <th class="ps-3">Data</th>
                <th>Dia da Semana</th>
                <th class="text-center">Entrada (Check-In)</th>
                <th class="text-center">Status</th>
                <th class="text-center">Atraso</th>
                <th>Picagens Completas</th>
                <th class="text-end pe-3">Observações</th>
              </tr>
            </thead>
            <tbody>
              ${trajectory.records.length ? trajectory.records.map(function (rec) {
                var weekday = getWeekdayPt(rec.attendance_date);
                return `
                  <tr>
                    <td class="ps-3 fw-semibold text-white font-monospace">${rec.attendance_date}</td>
                    <td class="text-secondary small">${weekday}</td>
                    <td class="text-center font-monospace fw-bold ${rec.is_late ? "text-danger" : "text-white"}">${rec.check_in || "--:--"}</td>
                    <td class="text-center">${getStatusBadge(rec.status, rec.delay_minutes)}</td>
                    <td class="text-center">${formatDelay(rec.delay_minutes)}</td>
                    <td class="text-muted small font-monospace">${(rec.all_punches || "--:--").replace(/\n/g, " | ")}</td>
                    <td class="text-end pe-3 text-secondary small">${rec.notes || "—"}</td>
                  </tr>`;
              }).join("") : `<tr><td colspan="7" class="text-center py-4 text-muted">Sem registos para este funcionário</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>`;

    return selectorHtml + profileHeaderHtml + historyTableHtml;
  }

  // =========================================================================
  // Tab 4: Upload & Biometric Parser View
  // =========================================================================

  async function renderUploadViewHtml() {
    var uploadsRes = await getBridge().listUploads();
    var uploads = uploadsRes.data || [];

    var preview = attendancePageState.uploadPreview;

    var previewHtml = "";
    if (preview && preview.records && preview.records.length) {
      previewHtml = `
        <div class="card bg-surface-dark border-warning border-opacity-40 p-4 mb-4 shadow-lg" id="uploadPreviewSection">
          <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
            <div>
              <span class="badge bg-warning-subtle text-warning mb-1"><i class="bi bi-eye me-1"></i>Pré-visualização da Importação</span>
              <h4 class="h5 text-white fw-bold mb-0">${preview.filename}</h4>
              <p class="text-secondary small mb-0">Criado pelo dispositivo: <strong>${preview.createTime}</strong> • Total: <strong class="text-white">${preview.records.length} registos</strong></p>
            </div>
            <div class="d-flex align-items-center gap-2">
              <button type="button" class="btn btn-outline-secondary btn-sm" id="cancelUploadPreviewBtn">Descartar</button>
              <button type="button" class="btn btn-ce-gold btn-sm" id="confirmSaveUploadBtn">
                <i class="bi bi-check-lg me-1.5"></i>Confirmar e Gravar no Sistema
              </button>
            </div>
          </div>

          <div class="row g-2 mb-3">
            <div class="col-6 col-md-3">
              <div class="p-2.5 bg-dark rounded border border-secondary border-opacity-25 text-center">
                <span class="text-secondary small d-block" style="font-size: 0.7rem;">PRESENTES</span>
                <span class="fs-6 fw-bold text-info">${preview.stats.present}</span>
              </div>
            </div>
            <div class="col-6 col-md-3">
              <div class="p-2.5 bg-dark rounded border border-secondary border-opacity-25 text-center">
                <span class="text-secondary small d-block" style="font-size: 0.7rem;">NO HORÁRIO</span>
                <span class="fs-6 fw-bold text-success">${preview.stats.on_time}</span>
              </div>
            </div>
            <div class="col-6 col-md-3">
              <div class="p-2.5 bg-dark rounded border border-secondary border-opacity-25 text-center">
                <span class="text-secondary small d-block" style="font-size: 0.7rem;">EM ATRASO</span>
                <span class="fs-6 fw-bold text-danger">${preview.stats.minor_delay + preview.stats.late + preview.stats.severe_delay}</span>
              </div>
            </div>
            <div class="col-6 col-md-3">
              <div class="p-2.5 bg-dark rounded border border-secondary border-opacity-25 text-center">
                <span class="text-secondary small d-block" style="font-size: 0.7rem;">SEM REGISTO / FALTAS</span>
                <span class="fs-6 fw-bold text-secondary">${preview.stats.absent}</span>
              </div>
            </div>
          </div>

          <div class="table-responsive border border-secondary border-opacity-25 rounded" style="max-height: 380px;">
            <table class="table table-dark table-sm table-hover align-middle mb-0" style="font-size: 0.8rem;">
              <thead class="table-dark sticky-top text-secondary text-uppercase small">
                <tr>
                  <th>ID</th>
                  <th>Funcionário</th>
                  <th>Data</th>
                  <th class="text-center">Entrada</th>
                  <th class="text-center">Status</th>
                  <th class="text-center">Atraso</th>
                  <th>Picagens</th>
                </tr>
              </thead>
              <tbody>
                ${preview.records.slice(0, 50).map(function (rec) {
                  return `
                    <tr>
                      <td class="font-monospace text-secondary">${rec.employee_id}</td>
                      <td class="text-white fw-semibold">${rec.employee_name}</td>
                      <td class="font-monospace text-secondary">${rec.attendance_date}</td>
                      <td class="text-center font-monospace ${rec.is_late ? "text-danger fw-bold" : "text-white"}">${rec.check_in || "--:--"}</td>
                      <td class="text-center">${getStatusBadge(rec.status, rec.delay_minutes)}</td>
                      <td class="text-center">${formatDelay(rec.delay_minutes)}</td>
                      <td class="text-muted small font-monospace">${(rec.all_punches || "--:--").replace(/\n/g, " | ")}</td>
                    </tr>`;
                }).join("")}
              </tbody>
            </table>
          </div>
          ${preview.records.length > 50 ? `<div class="text-muted small mt-2 text-center">Mostrando 50 de ${preview.records.length} registos na pré-visualização. Todos os ${preview.records.length} serão gravados.</div>` : ""}
        </div>`;
    }

    var uploadFormHtml = `
      <div class="card bg-surface-dark border-secondary border-opacity-25 p-4 mb-4 shadow-sm">
        <h5 class="h6 text-white fw-bold mb-3"><i class="bi bi-cloud-arrow-up text-gold me-2"></i>Carregar Relatório Diário / Mensal da Máquina Biométrica</h5>
        <p class="text-secondary small mb-3">
          Arraste e solte ou selecione o ficheiro Excel (<code>.xlsx</code>, <code>.xls</code>) ou CSV descarregado diretamente do terminal biométrico de impressões digitais da igreja.
        </p>

        <div class="upload-dropzone p-5 text-center rounded border-2 border-dashed border-secondary border-opacity-50 bg-dark bg-opacity-40" id="biometricDropzone" style="cursor: pointer; transition: all 0.2s;">
          <input type="file" id="biometricFileInput" class="d-none" accept=".xlsx, .xls, .csv, .txt">
          <i class="bi bi-file-earmark-spreadsheet text-gold fs-1 d-block mb-3"></i>
          <h5 class="text-white fw-semibold mb-1">Clique para selecionar ou arraste o ficheiro Excel aqui</h5>
          <p class="text-muted small mb-0">Suporta relatórios diários e tabelas mensais extraídas dos terminais biométricos</p>
        </div>
      </div>`;

    var historyHtml = `
      <div class="card bg-surface-dark border-secondary border-opacity-25 shadow-sm overflow-hidden">
        <div class="card-header bg-dark bg-opacity-40 border-bottom border-secondary border-opacity-25 py-3">
          <h5 class="h6 mb-0 text-white fw-bold"><i class="bi bi-clock-history text-gold me-2"></i>Histórico de Ficheiros Importados</h5>
        </div>
        <div class="table-responsive">
          <table class="table table-dark table-hover align-middle mb-0">
            <thead class="text-secondary small text-uppercase" style="font-size: 0.75rem;">
              <tr>
                <th class="ps-3">Data de Upload</th>
                <th>Nome do Ficheiro</th>
                <th>Data do Relatório</th>
                <th class="text-center">Total Registos</th>
                <th class="text-center">Presentes</th>
                <th class="text-center">Atrasos</th>
                <th class="text-center">Faltas</th>
                <th class="text-end pe-3">Utilizador</th>
              </tr>
            </thead>
            <tbody>
              ${uploads.length ? uploads.map(function (u) {
                return `
                  <tr>
                    <td class="ps-3 font-monospace text-secondary">${u.upload_date || u.created_at?.slice(0, 10)}</td>
                    <td class="text-white fw-semibold"><i class="bi bi-file-earmark-excel text-success me-1.5"></i>${u.filename}</td>
                    <td class="text-muted small">${u.device_create_time || "—"}</td>
                    <td class="text-center"><span class="badge bg-dark text-white">${u.record_count}</span></td>
                    <td class="text-center text-info">${u.present_count}</td>
                    <td class="text-center text-danger fw-bold">${u.late_count}</td>
                    <td class="text-center text-secondary">${u.absent_count}</td>
                    <td class="text-end pe-3 text-secondary small">${u.uploaded_by || "Admin"}</td>
                  </tr>`;
              }).join("") : `<tr><td colspan="8" class="text-center py-4 text-muted">Nenhum upload registado anteriormente.</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>`;

    return previewHtml + uploadFormHtml + historyHtml;
  }

  // =========================================================================
  // Tab 5: Settings (Configurações de Horário e Tolerância)
  // =========================================================================

  async function renderSettingsViewHtml() {
    var res = await getBridge().getAttendanceSettings();
    var s = res.data;

    return `
      <div class="card bg-surface-dark border-secondary border-opacity-25 p-4 mb-4 shadow-sm" style="max-width: 800px;">
        <h5 class="h6 text-white fw-bold mb-3"><i class="bi bi-sliders text-gold me-2"></i>Parâmetros de Horário e Regras de Pontualidade</h5>
        <p class="text-secondary small mb-4">
          Defina o horário oficial de entrada da igreja, tempo de tolerância e escalões de atraso para classificação automática das picagens biométricas.
        </p>

        <form id="attendanceSettingsForm">
          <div class="row g-3 mb-3">
            <div class="col-12 col-md-6">
              <label class="form-label text-secondary small fw-semibold">Horário Oficial de Entrada (Padrão: 08:00)</label>
              <input type="time" class="form-control bg-dark text-white border-secondary" name="standard_start_time" value="${s.standard_start_time || "08:00"}" required>
              <div class="form-text text-muted small">Chegadas antes ou neste horário são consideradas pontuais.</div>
            </div>

            <div class="col-12 col-md-6">
              <label class="form-label text-secondary small fw-semibold">Minutos de Tolerância (Grace Period)</label>
              <input type="number" class="form-control bg-dark text-white border-secondary" name="grace_period_minutes" value="${s.grace_period_minutes || 15}" min="0" max="60" required>
              <div class="form-text text-muted small">Ex: 15 minutos (até 08:15 é considerado "Tolerância").</div>
            </div>

            <div class="col-12 col-md-6">
              <label class="form-label text-secondary small fw-semibold">Limite Atraso Ligeiro (Minutos)</label>
              <input type="number" class="form-control bg-dark text-white border-secondary" name="minor_delay_threshold_minutes" value="${s.minor_delay_threshold_minutes || 30}" min="15" max="120" required>
              <div class="form-text text-muted small">Ex: 30 minutos (chegadas entre 08:16 e 08:30).</div>
            </div>

            <div class="col-12 col-md-6">
              <label class="form-label text-secondary small fw-semibold">Limite Atraso Grave (Minutos)</label>
              <input type="number" class="form-control bg-dark text-white border-secondary" name="severe_delay_threshold_minutes" value="${s.severe_delay_threshold_minutes || 60}" min="30" max="240" required>
              <div class="form-text text-muted small">Chegadas superiores a este limite são marcadas como "Muito Tarde".</div>
            </div>

            <div class="col-12 col-md-6">
              <label class="form-label text-secondary small fw-semibold">Horário de Saída Previsto (Padrão: 17:00)</label>
              <input type="time" class="form-control bg-dark text-white border-secondary" name="standard_end_time" value="${s.standard_end_time || "17:00"}">
            </div>
          </div>

          <div class="d-flex align-items-center justify-content-end gap-2 mt-4 pt-3 border-top border-secondary border-opacity-25">
            <button type="submit" class="btn btn-ce-gold"><i class="bi bi-save me-1.5"></i>Gravar Configurações</button>
          </div>
        </form>
      </div>`;
  }

  // =========================================================================
  // Tab 6: Reports & Executive PDF Exports
  // =========================================================================

  async function renderReportsViewHtml() {
    var date = attendancePageState.selectedDate || "2026-07-09";
    var start = attendancePageState.startDate || "2026-07-01";
    var end = attendancePageState.endDate || "2026-07-31";

    return `
      <div class="row g-4">
        <!-- Relatório Diário -->
        <div class="col-12 col-md-6">
          <div class="card bg-surface-dark border-secondary border-opacity-25 p-4 shadow-sm h-100">
            <div class="d-flex align-items-center gap-3 mb-3">
              <div class="avatar-circle-sm bg-gold-subtle text-gold"><i class="bi bi-file-earmark-pdf fs-4"></i></div>
              <div>
                <h5 class="h6 text-white fw-bold mb-0">Relatório Diário de Assiduidade</h5>
                <span class="text-muted small">Dossiê de presenças e atrasos de um dia específico</span>
              </div>
            </div>
            <div class="mb-3">
              <label class="form-label text-secondary small">Data do Relatório:</label>
              <input type="date" class="form-control form-control-sm bg-dark text-white border-secondary" id="reportDailyDateInput" value="${date}">
            </div>
            <div class="mt-auto d-flex gap-2">
              <button type="button" class="btn btn-sm btn-ce-gold w-100" id="generateDailyPdfBtn">
                <i class="bi bi-printer me-1.5"></i>Gerar PDF Oficial
              </button>
              <button type="button" class="btn btn-sm btn-outline-secondary" id="generateDailyExcelBtn">
                <i class="bi bi-file-earmark-excel text-success me-1"></i>Excel
              </button>
            </div>
          </div>
        </div>

        <!-- Relatório Periódico / Mensal -->
        <div class="col-12 col-md-6">
          <div class="card bg-surface-dark border-secondary border-opacity-25 p-4 shadow-sm h-100">
            <div class="d-flex align-items-center gap-3 mb-3">
              <div class="avatar-circle-sm bg-info-subtle text-info"><i class="bi bi-file-earmark-bar-graph fs-4"></i></div>
              <div>
                <h5 class="h6 text-white fw-bold mb-0">Relatório Mensal / Periódico Consolidado</h5>
                <span class="text-muted small">Taxa de pontualidade, top atrasos e horas acumuladas</span>
              </div>
            </div>
            <div class="row g-2 mb-3">
              <div class="col-6">
                <label class="form-label text-secondary small">Data Inicial:</label>
                <input type="date" class="form-control form-control-sm bg-dark text-white border-secondary" id="reportPeriodStartInput" value="${start}">
              </div>
              <div class="col-6">
                <label class="form-label text-secondary small">Data Final:</label>
                <input type="date" class="form-control form-control-sm bg-dark text-white border-secondary" id="reportPeriodEndInput" value="${end}">
              </div>
            </div>
            <div class="mt-auto d-flex gap-2">
              <button type="button" class="btn btn-sm btn-ce-gold w-100" id="generatePeriodPdfBtn">
                <i class="bi bi-printer me-1.5"></i>Gerar PDF Mensal
              </button>
              <button type="button" class="btn btn-sm btn-outline-secondary" id="generatePeriodExcelBtn">
                <i class="bi bi-file-earmark-excel text-success me-1"></i>Excel
              </button>
            </div>
          </div>
        </div>
      </div>`;
  }

  // =========================================================================
  // Executive PDF Generation Engine
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
    var absent = records.filter(function (r) { return !r.is_present; });

    var tableRowsHtml = records.map(function (r) {
      var statusText = r.status === "on_time" ? "Pontual" : r.status === "grace_period" ? `Tolerância (+${r.delay_minutes}m)` : r.is_late ? `Atrasado (+${r.delay_minutes}m)` : "Sem Registo";
      var statusColor = r.status === "on_time" ? "#198754" : r.status === "grace_period" ? "#0dcaf0" : r.is_late ? "#dc3545" : "#6c757d";
      return `
        <tr>
          <td style="padding: 6px 8px; border: 1px solid #ddd; font-family: monospace;">${r.employee_id}</td>
          <td style="padding: 6px 8px; border: 1px solid #ddd; font-weight: bold;">${r.employee_name}</td>
          <td style="padding: 6px 8px; border: 1px solid #ddd;">${r.department || "CESTAFF"}</td>
          <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: center; font-family: monospace;">${r.check_in || "--:--"}</td>
          <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: center; color: ${statusColor}; font-weight: bold;">${statusText}</td>
          <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: center;">${r.delay_minutes > 0 ? `+${r.delay_minutes} min` : "0 min"}</td>
          <td style="padding: 6px 8px; border: 1px solid #ddd; font-size: 10px; font-family: monospace;">${(r.all_punches || "--:--").replace(/\n/g, " | ")}</td>
        </tr>`;
    }).join("");

    var printHtml = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; padding: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #c5a059; padding-bottom: 12px; margin-bottom: 15px;">
          <div>
            <h1 style="margin: 0; font-size: 18px; color: #0b1f3f; text-transform: uppercase;">Christ Embassy Mozambique</h1>
            <h2 style="margin: 3px 0 0 0; font-size: 14px; color: #c5a059;">Relatório Diário de Assiduidade e Pontualidade</h2>
          </div>
          <div style="text-align: right; font-size: 11px; color: #666;">
            <div><strong>Data do Relatório:</strong> ${formatDatePt(date)}</div>
            <div><strong>Horário Padrão:</strong> ${set.standard_start_time || "08:00"} (Tol: ${set.grace_period_minutes}m)</div>
            <div><strong>Gerado em:</strong> ${new Date().toLocaleString("pt-PT")}</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px;">
          <div style="background: #f8f9fa; border: 1px solid #ddd; padding: 10px; border-radius: 4px; text-align: center;">
            <div style="font-size: 11px; color: #666;">TOTAL REGISTADOS</div>
            <div style="font-size: 18px; font-weight: bold; color: #0b1f3f;">${records.length}</div>
          </div>
          <div style="background: #f8f9fa; border: 1px solid #ddd; padding: 10px; border-radius: 4px; text-align: center;">
            <div style="font-size: 11px; color: #666;">PRESENTES</div>
            <div style="font-size: 18px; font-weight: bold; color: #0dcaf0;">${present.length}</div>
          </div>
          <div style="background: #f8f9fa; border: 1px solid #ddd; padding: 10px; border-radius: 4px; text-align: center;">
            <div style="font-size: 11px; color: #666;">PONTUAIS / TOLERÂNCIA</div>
            <div style="font-size: 18px; font-weight: bold; color: #198754;">${onTime.length + grace.length}</div>
          </div>
          <div style="background: #f8f9fa; border: 1px solid #ddd; padding: 10px; border-radius: 4px; text-align: center;">
            <div style="font-size: 11px; color: #666;">EM ATRASO</div>
            <div style="font-size: 18px; font-weight: bold; color: #dc3545;">${late.length}</div>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 30px;">
          <thead>
            <tr style="background: #0b1f3f; color: white;">
              <th style="padding: 8px; border: 1px solid #0b1f3f;">ID</th>
              <th style="padding: 8px; border: 1px solid #0b1f3f; text-align: left;">Funcionário</th>
              <th style="padding: 8px; border: 1px solid #0b1f3f; text-align: left;">Departamento</th>
              <th style="padding: 8px; border: 1px solid #0b1f3f;">Entrada</th>
              <th style="padding: 8px; border: 1px solid #0b1f3f;">Status</th>
              <th style="padding: 8px; border: 1px solid #0b1f3f;">Atraso</th>
              <th style="padding: 8px; border: 1px solid #0b1f3f; text-align: left;">Picagens Brutas</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>

        <div style="display: flex; justify-content: space-between; margin-top: 40px; padding-top: 15px;">
          <div style="text-align: center; width: 220px; border-top: 1px solid #999; padding-top: 5px; font-size: 11px;">
            Responsável pelos Recursos Humanos
          </div>
          <div style="text-align: center; width: 220px; border-top: 1px solid #999; padding-top: 5px; font-size: 11px;">
            Pastor / Coordenador da Sede
          </div>
        </div>
      </div>`;

    if (window.exportReportsPrint) {
      window.exportReportsPrint(printHtml, `Relatório-Assiduidade-${date}`);
    } else {
      var win = window.open("", "_blank");
      win.document.write(`<html><head><title>Relatório de Assiduidade - ${date}</title></head><body>${printHtml}</body></html>`);
      win.document.close();
      setTimeout(function () { win.print(); }, 400);
    }
  }

  async function generatePeriodPdf(start, end) {
    var stats = await getBridge().getAggregatePeriodStats(start, end);

    var rowsHtml = stats.employeesList.map(function (emp) {
      return `
        <tr>
          <td style="padding: 6px 8px; border: 1px solid #ddd; font-family: monospace;">${emp.employee_id}</td>
          <td style="padding: 6px 8px; border: 1px solid #ddd; font-weight: bold;">${emp.employee_name}</td>
          <td style="padding: 6px 8px; border: 1px solid #ddd;">${emp.department}</td>
          <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: center;">${emp.presentDays} / ${emp.totalDays}</td>
          <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: center; color: ${emp.onTimeRate >= 80 ? "#198754" : "#dc3545"}; font-weight: bold;">${emp.onTimeRate}%</td>
          <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: center;">${emp.lateDays} dias</td>
          <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: center; font-family: monospace; color: #dc3545;">${emp.totalDelayMins}m</td>
          <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: center; font-family: monospace;">${emp.avgCheckInTime}</td>
        </tr>`;
    }).join("");

    var printHtml = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; padding: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #c5a059; padding-bottom: 12px; margin-bottom: 15px;">
          <div>
            <h1 style="margin: 0; font-size: 18px; color: #0b1f3f; text-transform: uppercase;">Christ Embassy Mozambique</h1>
            <h2 style="margin: 3px 0 0 0; font-size: 14px; color: #c5a059;">Relatório Periódico Consolidado de Assiduidade</h2>
          </div>
          <div style="text-align: right; font-size: 11px; color: #666;">
            <div><strong>Período:</strong> ${formatDatePt(start)} até ${formatDatePt(end)}</div>
            <div><strong>Gerado em:</strong> ${new Date().toLocaleString("pt-PT")}</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px;">
          <div style="background: #f8f9fa; border: 1px solid #ddd; padding: 10px; border-radius: 4px; text-align: center;">
            <div style="font-size: 11px; color: #666;">TAXA GLOBAL PONTUALIDADE</div>
            <div style="font-size: 18px; font-weight: bold; color: #198754;">${stats.onTimeRate}%</div>
          </div>
          <div style="background: #f8f9fa; border: 1px solid #ddd; padding: 10px; border-radius: 4px; text-align: center;">
            <div style="font-size: 11px; color: #666;">HORAS DE ATRASO ACUMULADAS</div>
            <div style="font-size: 18px; font-weight: bold; color: #dc3545;">${Math.floor(stats.totalDelayMinutes / 60)}h ${stats.totalDelayMinutes % 60}m</div>
          </div>
          <div style="background: #f8f9fa; border: 1px solid #ddd; padding: 10px; border-radius: 4px; text-align: center;">
            <div style="font-size: 11px; color: #666;">FUNCIONÁRIOS MONITORADOS</div>
            <div style="font-size: 18px; font-weight: bold; color: #0b1f3f;">${stats.distinctEmployeesCount}</div>
          </div>
          <div style="background: #f8f9fa; border: 1px solid #ddd; padding: 10px; border-radius: 4px; text-align: center;">
            <div style="font-size: 11px; color: #666;">DIAS REGISTADOS</div>
            <div style="font-size: 18px; font-weight: bold; color: #0dcaf0;">${stats.distinctDaysCount}</div>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 30px;">
          <thead>
            <tr style="background: #0b1f3f; color: white;">
              <th style="padding: 8px; border: 1px solid #0b1f3f;">ID</th>
              <th style="padding: 8px; border: 1px solid #0b1f3f; text-align: left;">Funcionário</th>
              <th style="padding: 8px; border: 1px solid #0b1f3f; text-align: left;">Departamento</th>
              <th style="padding: 8px; border: 1px solid #0b1f3f;">Presenças</th>
              <th style="padding: 8px; border: 1px solid #0b1f3f;">Taxa Pontualidade</th>
              <th style="padding: 8px; border: 1px solid #0b1f3f;">Dias Atraso</th>
              <th style="padding: 8px; border: 1px solid #0b1f3f;">Total Atraso</th>
              <th style="padding: 8px; border: 1px solid #0b1f3f;">Média Entrada</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div style="display: flex; justify-content: space-between; margin-top: 40px; padding-top: 15px;">
          <div style="text-align: center; width: 220px; border-top: 1px solid #999; padding-top: 5px; font-size: 11px;">
            Responsável pelos Recursos Humanos
          </div>
          <div style="text-align: center; width: 220px; border-top: 1px solid #999; padding-top: 5px; font-size: 11px;">
            Pastor / Coordenador da Sede
          </div>
        </div>
      </div>`;

    if (window.exportReportsPrint) {
      window.exportReportsPrint(printHtml, `Relatório-Mensal-Assiduidade-${start}-${end}`);
    } else {
      var win = window.open("", "_blank");
      win.document.write(`<html><head><title>Relatório Mensal de Assiduidade</title></head><body>${printHtml}</body></html>`);
      win.document.close();
      setTimeout(function () { win.print(); }, 400);
    }
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

    // Trajectory jump from table
    root.querySelectorAll("[data-view-trajectory]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        attendancePageState.selectedStaffId = this.getAttribute("data-view-trajectory");
        attendancePageState.tab = "trajectory";
        window.renderAttendance("trajectory");
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

    // Period buttons
    root.querySelectorAll("[data-period-btn]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var p = this.getAttribute("data-period-btn");
        attendancePageState.monthlyPeriod = p;
        if (p === "this_month") {
          attendancePageState.startDate = "2026-07-01";
          attendancePageState.endDate = "2026-07-31";
        } else if (p === "3_months") {
          attendancePageState.startDate = "2026-05-01";
          attendancePageState.endDate = "2026-07-31";
        } else if (p === "6_months") {
          attendancePageState.startDate = "2026-02-01";
          attendancePageState.endDate = "2026-07-31";
        } else if (p === "year") {
          attendancePageState.startDate = "2026-01-01";
          attendancePageState.endDate = "2026-12-31";
        }
        renderTabContent("monthly");
      });
    });

    var applyPeriodBtn = document.getElementById("applyPeriodFilterBtn");
    if (applyPeriodBtn) {
      applyPeriodBtn.addEventListener("click", function () {
        var s = document.getElementById("periodStartDate")?.value;
        var e = document.getElementById("periodEndDate")?.value;
        if (s) attendancePageState.startDate = s;
        if (e) attendancePageState.endDate = e;
        renderTabContent("monthly");
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
          window.showToast("Configurações de assiduidade guardadas com sucesso!", "success");
        } else {
          alert("Configurações guardadas com sucesso!");
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
        this.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span>A gravar registos...`;

        var res = await getBridge().saveBatchAttendance(preview.records, {
          filename: preview.filename,
          upload_date: preview.dates[0] || new Date().toISOString().slice(0, 10),
          device_create_time: preview.createTime,
          uploaded_by: window.activeUser?.name || "Admin",
          file_size_bytes: preview.fileSize,
        });

        if (res.ok) {
          if (typeof window.showToast === "function") {
            window.showToast(`${res.inserted_count} registos de assiduidade guardados com sucesso!`, "success");
          } else {
            alert(`${res.inserted_count} registos de assiduidade guardados com sucesso!`);
          }
          attendancePageState.uploadPreview = null;
          attendancePageState.selectedDate = preview.dates[0] || attendancePageState.selectedDate;
          attendancePageState.tab = "daily";
          window.renderAttendance("daily");
        } else {
          alert("Erro ao gravar: " + (res.error || "Erro desconhecido"));
          this.disabled = false;
          this.innerHTML = `<i class="bi bi-check-lg me-1.5"></i>Confirmar e Gravar no Sistema`;
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
        var date = document.getElementById("reportDailyDateInput")?.value;
        generateDailyPdf(date);
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
        exportRecordsToCsv(res.data, `Assiduidade-${attendancePageState.selectedDate}.csv`);
      });
    }
  }

  async function generateStaffDossierPdf(staffId) {
    var trajectory = await getBridge().getStaffTrajectory(staffId, "2026-01-01", "2026-12-31");

    var rowsHtml = trajectory.records.map(function (r) {
      var statusColor = r.status === "on_time" ? "#198754" : r.status === "grace_period" ? "#0dcaf0" : r.is_late ? "#dc3545" : "#6c757d";
      return `
        <tr>
          <td style="padding: 6px 8px; border: 1px solid #ddd; font-family: monospace;">${r.attendance_date}</td>
          <td style="padding: 6px 8px; border: 1px solid #ddd;">${getWeekdayPt(r.attendance_date)}</td>
          <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: center; font-family: monospace;">${r.check_in || "--:--"}</td>
          <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: center; color: ${statusColor}; font-weight: bold;">${r.status}</td>
          <td style="padding: 6px 8px; border: 1px solid #ddd; text-align: center;">${r.delay_minutes > 0 ? `+${r.delay_minutes} min` : "0 min"}</td>
          <td style="padding: 6px 8px; border: 1px solid #ddd; font-size: 10px; font-family: monospace;">${(r.all_punches || "--:--").replace(/\n/g, " | ")}</td>
          <td style="padding: 6px 8px; border: 1px solid #ddd;">${r.notes || "—"}</td>
        </tr>`;
    }).join("");

    var printHtml = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; padding: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #c5a059; padding-bottom: 12px; margin-bottom: 15px;">
          <div>
            <h1 style="margin: 0; font-size: 18px; color: #0b1f3f; text-transform: uppercase;">Christ Embassy Mozambique</h1>
            <h2 style="margin: 3px 0 0 0; font-size: 14px; color: #c5a059;">Dossiê Individual de Assiduidade e Pontualidade</h2>
          </div>
          <div style="text-align: right; font-size: 11px; color: #666;">
            <div><strong>Data:</strong> ${new Date().toLocaleDateString("pt-PT")}</div>
          </div>
        </div>

        <div style="background: #f8f9fa; border: 1px solid #ddd; padding: 15px; border-radius: 4px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h3 style="margin: 0 0 4px 0; color: #0b1f3f; font-size: 16px;">${trajectory.employee_name}</h3>
            <div style="font-size: 12px; color: #666;">ID do Funcionário: <strong>${trajectory.employee_id}</strong> • Departamento: <strong>${trajectory.department}</strong></div>
          </div>
          <div style="display: flex; gap: 15px;">
            <div style="text-align: center;">
              <div style="font-size: 10px; color: #888;">TAXA PONTUALIDADE</div>
              <div style="font-size: 16px; font-weight: bold; color: ${trajectory.onTimeRate >= 80 ? "#198754" : "#dc3545"};">${trajectory.onTimeRate}%</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 10px; color: #888;">MÉDIA ENTRADA</div>
              <div style="font-size: 16px; font-weight: bold; color: #0dcaf0; font-family: monospace;">${trajectory.avgCheckInTime}</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 10px; color: #888;">TOTAL ATRASO</div>
              <div style="font-size: 16px; font-weight: bold; color: #dc3545;">${trajectory.totalDelayMinutes}m</div>
            </div>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 30px;">
          <thead>
            <tr style="background: #0b1f3f; color: white;">
              <th style="padding: 8px; border: 1px solid #0b1f3f;">Data</th>
              <th style="padding: 8px; border: 1px solid #0b1f3f;">Dia da Semana</th>
              <th style="padding: 8px; border: 1px solid #0b1f3f;">Entrada</th>
              <th style="padding: 8px; border: 1px solid #0b1f3f;">Status</th>
              <th style="padding: 8px; border: 1px solid #0b1f3f;">Atraso</th>
              <th style="padding: 8px; border: 1px solid #0b1f3f;">Picagens</th>
              <th style="padding: 8px; border: 1px solid #0b1f3f;">Observações</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div style="display: flex; justify-content: space-between; margin-top: 40px; padding-top: 15px;">
          <div style="text-align: center; width: 220px; border-top: 1px solid #999; padding-top: 5px; font-size: 11px;">
            Assinatura do Funcionário
          </div>
          <div style="text-align: center; width: 220px; border-top: 1px solid #999; padding-top: 5px; font-size: 11px;">
            Responsável pelos Recursos Humanos
          </div>
        </div>
      </div>`;

    if (window.exportReportsPrint) {
      window.exportReportsPrint(printHtml, `Dossie-Staff-${trajectory.employee_id}`);
    } else {
      var win = window.open("", "_blank");
      win.document.write(`<html><head><title>Dossiê - ${trajectory.employee_name}</title></head><body>${printHtml}</body></html>`);
      win.document.close();
      setTimeout(function () { win.print(); }, 400);
    }
  }

  function exportRecordsToCsv(records, filename) {
    var headers = ["ID", "Funcionario", "Data", "Entrada", "Status", "Minutos_Atraso", "Picagens", "Departamento"];
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

  // Format date utilities
  function formatDatePt(dateStr) {
    if (!dateStr) return "";
    var parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    var months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    var mIdx = parseInt(parts[1], 10) - 1;
    return `${parts[2]} de ${months[mIdx] || parts[1]} de ${parts[0]}`;
  }

  function getWeekdayPt(dateStr) {
    if (!dateStr) return "";
    var d = new Date(dateStr + "T00:00:00");
    var days = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
    return days[d.getDay()] || "";
  }

  window.CEAttendanceModule = {
    render: window.renderAttendance,
    parseBiometricFile: parseBiometricFile,
    generateDailyPdf: generateDailyPdf,
    generatePeriodPdf: generatePeriodPdf,
  };
})();
