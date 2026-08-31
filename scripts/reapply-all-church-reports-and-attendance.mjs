import fs from "node:fs";

const DASHBOARD_PATH = "js/dashboard.js";
let code = fs.readFileSync(DASHBOARD_PATH, "utf8");

// First, check if consolidateCellReportToChurchReport exists
if (!code.includes("function consolidateCellReportToChurchReport(")) {
  const helpersAndChurchView = `
// ============================================================================
// CHURCH REPORTS & CELL ATTENDANCE ANALYTICS ENGINE
// ============================================================================

const churchReportPageState = {
  level: "church", // "church" | "group" | "cell"
  service: "", // "", "Domingo - 1º Culto", "Domingo - 2º Culto", "Quarta-feira", etc.
  period: "month", // "week" | "month" | "quarter" | "semester" | "year" | "custom"
  dateFrom: "",
  dateTo: "",
  churchId: "",
  cellGroupId: "",
  cellId: "",
  search: "",
  chartType: "trend" // "trend" | "comparative"
};

const cellAttendancePageState = {
  service: "Domingo - 1º Culto",
  date: new Date().toISOString().slice(0, 10),
  week: "",
  search: "",
  checkedMembers: new Set(),
  ft: 0,
  nc: 0,
  rs: 0,
  offering: 0,
  notes: ""
};

/**
 * Generates an interactive SVG line chart highlighting Peaks and Lows.
 */
function renderPeakLowChartSvg(dataPoints = [], options = {}) {
  const width = options.width || 760;
  const height = options.height || 260;
  const padding = { top: 35, right: 40, bottom: 45, left: 55 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  if (!dataPoints.length) {
    return \`<div class="p-4 text-center text-secondary"><i class="bi bi-graph-up me-2"></i>Sem dados para o período seleccionado.</div>\`;
  }

  const values = dataPoints.map((d) => Number(d.value || 0));
  const maxVal = Math.max(...values, 10);
  const minVal = Math.min(...values);
  const avgVal = Math.round(values.reduce((a, b) => a + b, 0) / (values.length || 1));

  const maxIndex = values.indexOf(maxVal);
  let minIndex = -1;
  let lowestNonZero = Infinity;
  values.forEach((v, idx) => {
    if (v < lowestNonZero) {
      lowestNonZero = v;
      minIndex = idx;
    }
  });
  if (minIndex < 0) minIndex = 0;

  const getX = (i) => padding.left + (dataPoints.length === 1 ? chartW / 2 : (i / (dataPoints.length - 1)) * chartW);
  const getY = (val) => padding.top + chartH - (maxVal > 0 ? (val / maxVal) * chartH : 0);

  const points = dataPoints.map((d, i) => ({ x: getX(i), y: getY(d.value), val: d.value, label: d.label, date: d.date }));

  let pathD = \`M \${points[0].x} \${points[0].y}\`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpX = (prev.x + curr.x) / 2;
    pathD += \` C \${cpX} \${prev.y}, \${cpX} \${curr.y}, \${curr.x} \${curr.y}\`;
  }

  const areaD = \`\${pathD} L \${points[points.length - 1].x} \${padding.top + chartH} L \${points[0].x} \${padding.top + chartH} Z\`;
  const avgY = getY(avgVal);

  return \`
    <div class="peak-low-chart-wrap" style="position:relative; width:100%;">
      <svg viewBox="0 0 \${width} \${height}" class="peak-low-svg" style="width:100%; height:auto; overflow:visible;">
        <defs>
          <linearGradient id="peakAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.35"/>
            <stop offset="100%" stop-color="#06b6d4" stop-opacity="0.0"/>
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <!-- Grid Lines -->
        <line x1="\${padding.left}" y1="\${padding.top}" x2="\${padding.left + chartW}" y2="\${padding.top}" stroke="rgba(255,255,255,0.08)" stroke-dasharray="4"/>
        <line x1="\${padding.left}" y1="\${padding.top + chartH / 2}" x2="\${padding.left + chartW}" y2="\${padding.top + chartH / 2}" stroke="rgba(255,255,255,0.08)" stroke-dasharray="4"/>
        <line x1="\${padding.left}" y1="\${padding.top + chartH}" x2="\${padding.left + chartW}" y2="\${padding.top + chartH}" stroke="rgba(255,255,255,0.15)"/>

        <!-- Y Axis Labels -->
        <text x="\${padding.left - 10}" y="\${padding.top + 4}" fill="#94a3b8" font-size="11" text-anchor="end">\${maxVal}</text>
        <text x="\${padding.left - 10}" y="\${padding.top + chartH / 2 + 4}" fill="#94a3b8" font-size="11" text-anchor="end">\${Math.round(maxVal / 2)}</text>
        <text x="\${padding.left - 10}" y="\${padding.top + chartH + 4}" fill="#94a3b8" font-size="11" text-anchor="end">0</text>

        <!-- Average Dotted Line -->
        <line x1="\${padding.left}" y1="\${avgY}" x2="\${padding.left + chartW}" y2="\${avgY}" stroke="#eab308" stroke-dasharray="4" stroke-width="1.5" opacity="0.75"/>
        <text x="\${padding.left + chartW - 5}" y="\${avgY - 6}" fill="#eab308" font-size="10" font-weight="600" text-anchor="end">Média: \${avgVal}</text>

        <!-- Area & Line -->
        <path d="\${areaD}" fill="url(#peakAreaGrad)"/>
        <path d="\${pathD}" fill="none" stroke="#06b6d4" stroke-width="3" stroke-linecap="round"/>

        <!-- Data Nodes -->
        \${points.map((p, i) => {
          const isMax = i === maxIndex;
          const isMin = i === minIndex && minIndex !== maxIndex && points.length > 1;
          const nodeColor = isMax ? "#10b981" : isMin ? "#ef4444" : "#38bdf8";
          const nodeRadius = isMax || isMin ? 6.5 : 4;
          return \`
            <g class="chart-node" tabindex="0">
              \${isMax || isMin ? \`<circle cx="\${p.x}" cy="\${p.y}" r="\${nodeRadius + 4}" fill="\${nodeColor}" opacity="0.25"/>\` : ""}
              <circle cx="\${p.x}" cy="\${p.y}" r="\${nodeRadius}" fill="\${nodeColor}" stroke="#0f172a" stroke-width="2"/>
              <!-- X Label -->
              <text x="\${p.x}" y="\${padding.top + chartH + 20}" fill="#94a3b8" font-size="10.5" text-anchor="middle">\${p.label || ""}</text>
              \${isMax ? \`
                <!-- Peak Flag -->
                <rect x="\${p.x - 38}" y="\${p.y - 30}" width="76" height="20" rx="4" fill="#10b981" filter="url(#glow)"/>
                <text x="\${p.x}" y="\${p.y - 16}" fill="#ffffff" font-size="10" font-weight="bold" text-anchor="middle">▲ Pico: \${p.val}</text>
              \` : isMin ? \`
                <!-- Low Flag -->
                <rect x="\${p.x - 40}" y="\${p.y + 10}" width="80" height="20" rx="4" fill="#ef4444" filter="url(#glow)"/>
                <text x="\${p.x}" y="\${p.y + 24}" fill="#ffffff" font-size="10" font-weight="bold" text-anchor="middle">▼ Baixa: \${p.val}</text>
              \` : ""}
            </g>
          \`;
        }).join("")}
      </svg>
    </div>
  \`;
}

/**
 * Generates an interactive SVG Bar chart comparing Attendance, FT and NC.
 */
function renderComparativeBarsSvg(seriesData = [], options = {}) {
  const width = options.width || 760;
  const height = options.height || 260;
  const padding = { top: 30, right: 30, bottom: 45, left: 55 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  if (!seriesData.length) {
    return \`<div class="p-4 text-center text-secondary"><i class="bi bi-bar-chart me-2"></i>Sem dados para comparação no período.</div>\`;
  }

  const maxVal = Math.max(...seriesData.map((d) => Math.max(Number(d.att || 0), Number(d.ft || 0) + Number(d.nc || 0))), 10);
  const barGroupWidth = chartW / seriesData.length;
  const barWidth = Math.min(Math.max(barGroupWidth * 0.22, 10), 28);

  return \`
    <div class="comparative-bar-chart-wrap" style="position:relative; width:100%;">
      <div class="d-flex gap-4 justify-content-end mb-2 small">
        <span><span class="d-inline-block rounded-circle me-1" style="width:10px;height:10px;background:#38bdf8;"></span>Presentes (Membros)</span>
        <span><span class="d-inline-block rounded-circle me-1" style="width:10px;height:10px;background:#eab308;"></span>Primeiras Vezes (FT)</span>
        <span><span class="d-inline-block rounded-circle me-1" style="width:10px;height:10px;background:#10b981;"></span>Novos Convertidos (NC)</span>
      </div>
      <svg viewBox="0 0 \${width} \${height}" style="width:100%; height:auto; overflow:visible;">
        <!-- Grid -->
        <line x1="\${padding.left}" y1="\${padding.top}" x2="\${padding.left + chartW}" y2="\${padding.top}" stroke="rgba(255,255,255,0.08)" stroke-dasharray="4"/>
        <line x1="\${padding.left}" y1="\${padding.top + chartH / 2}" x2="\${padding.left + chartW}" y2="\${padding.top + chartH / 2}" stroke="rgba(255,255,255,0.08)" stroke-dasharray="4"/>
        <line x1="\${padding.left}" y1="\${padding.top + chartH}" x2="\${padding.left + chartW}" y2="\${padding.top + chartH}" stroke="rgba(255,255,255,0.15)"/>

        <!-- Y Axis -->
        <text x="\${padding.left - 10}" y="\${padding.top + 4}" fill="#94a3b8" font-size="11" text-anchor="end">\${maxVal}</text>
        <text x="\${padding.left - 10}" y="\${padding.top + chartH / 2 + 4}" fill="#94a3b8" font-size="11" text-anchor="end">\${Math.round(maxVal / 2)}</text>
        <text x="\${padding.left - 10}" y="\${padding.top + chartH + 4}" fill="#94a3b8" font-size="11" text-anchor="end">0</text>

        <!-- Bars -->
        \${seriesData.map((d, i) => {
          const groupCenterX = padding.left + i * barGroupWidth + barGroupWidth / 2;
          const attH = maxVal > 0 ? (Number(d.att || 0) / maxVal) * chartH : 0;
          const ftH = maxVal > 0 ? (Number(d.ft || 0) / maxVal) * chartH : 0;
          const ncH = maxVal > 0 ? (Number(d.nc || 0) / maxVal) * chartH : 0;

          const attX = groupCenterX - barWidth * 1.6;
          const ftX = groupCenterX - barWidth * 0.5;
          const ncX = groupCenterX + barWidth * 0.6;

          const baseY = padding.top + chartH;

          return \`
            <g class="bar-group">
              <!-- Att Bar -->
              <rect x="\${attX}" y="\${baseY - attH}" width="\${barWidth}" height="\${attH}" rx="3" fill="#38bdf8" opacity="0.9"/>
              \${attH > 14 ? \`<text x="\${attX + barWidth / 2}" y="\${baseY - attH - 4}" fill="#38bdf8" font-size="9.5" font-weight="bold" text-anchor="middle">\${d.att}</text>\` : ""}

              <!-- FT Bar -->
              <rect x="\${ftX}" y="\${baseY - ftH}" width="\${barWidth}" height="\${ftH}" rx="3" fill="#eab308" opacity="0.9"/>
              \${ftH > 14 ? \`<text x="\${ftX + barWidth / 2}" y="\${baseY - ftH - 4}" fill="#eab308" font-size="9.5" font-weight="bold" text-anchor="middle">\${d.ft}</text>\` : ""}

              <!-- NC Bar -->
              <rect x="\${ncX}" y="\${baseY - ncH}" width="\${barWidth}" height="\${ncH}" rx="3" fill="#10b981" opacity="0.9"/>
              \${ncH > 14 ? \`<text x="\${ncX + barWidth / 2}" y="\${baseY - ncH - 4}" fill="#10b981" font-size="9.5" font-weight="bold" text-anchor="middle">\${d.nc}</text>\` : ""}

              <!-- X Label -->
              <text x="\${groupCenterX}" y="\${baseY + 20}" fill="#94a3b8" font-size="10.5" text-anchor="middle">\${d.label || ""}</text>
            </g>
          \`;
        }).join("")}
      </svg>
    </div>
  \`;
}

/**
 * Filter and consolidate reports by temporal period.
 */
function filterReportsByPeriod(records = [], period = "month", dateFrom = "", dateTo = "") {
  const now = new Date();
  return records.filter((r) => {
    const rawDate = r.data_do_culto || r.data_inicio || r.data || r.created_at || "";
    if (!rawDate) return true;
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return true;

    if (period === "week") {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      return d >= oneWeekAgo && d <= now;
    } else if (period === "month") {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    } else if (period === "quarter") {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(now.getMonth() - 3);
      return d >= threeMonthsAgo && d <= now;
    } else if (period === "semester") {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(now.getMonth() - 6);
      return d >= sixMonthsAgo && d <= now;
    } else if (period === "year") {
      return d.getFullYear() === now.getFullYear();
    } else if (period === "custom") {
      if (dateFrom && d < new Date(dateFrom)) return false;
      if (dateTo && d > new Date(dateTo + "T23:59:59")) return false;
      return true;
    }
    return true;
  });
}

/**
 * Automatically consolidates cell attendance into the general Church Report.
 */
function consolidateCellReportToChurchReport(cellReport) {
  if (!cellReport || !state.cellLeadership) return;
  if (!Array.isArray(state.cellLeadership.churchReports)) state.cellLeadership.churchReports = [];

  const churchId = cellReport.church_id || state.churches?.[0]?.id || "church-hq";
  const serviceDate = cellReport.data_do_culto || cellReport.data_inicio || new Date().toISOString().slice(0, 10);
  const serviceType = cellReport.culto || "Domingo";
  const reportWeek = cellReport.semana || \`\${new Date(serviceDate).toLocaleString(lang === "pt" ? "pt-PT" : "en-US", { month: "long" })} Semana \${Math.ceil(new Date(serviceDate).getDate() / 7)}\`;

  // Collect all cell reports for this church, date and service
  const matchingCellReports = (state.cellLeadership.cellReports || []).filter((r) => {
    const rDate = r.data_do_culto || r.data_inicio;
    return (r.church_id === churchId || !r.church_id) && rDate === serviceDate && (r.culto === serviceType || !r.culto || !serviceType);
  });

  const totalAtt = matchingCellReports.reduce((sum, r) => sum + Number(r.att || r.members_present_count || 0), 0);
  const totalFt = matchingCellReports.reduce((sum, r) => sum + Number(r.ft || r.first_timers_count || 0), 0);
  const totalNc = matchingCellReports.reduce((sum, r) => sum + Number(r.nc || r.new_converts || 0), 0);
  const totalRs = matchingCellReports.reduce((sum, r) => sum + Number(r.rs || 0), 0);
  const totalOffering = matchingCellReports.reduce((sum, r) => sum + Number(r.oferta || 0), 0);

  let existing = state.cellLeadership.churchReports.find((r) => {
    const rDate = r.data_do_culto || r.data_inicio;
    return r.church_id === churchId && rDate === serviceDate && r.culto === serviceType;
  });

  if (existing) {
    existing.att = totalAtt;
    existing.ft = totalFt;
    existing.nc = totalNc;
    existing.rs = totalRs;
    existing.total_ft_reached = totalFt;
    existing.oferta = totalOffering;
    existing.updated_at = new Date().toISOString().slice(0, 10);
  } else {
    existing = {
      id: typeof generateUuid === "function" ? generateUuid() : \`church-report-\${Date.now()}\`,
      church_id: churchId,
      created_by: activeUser?.name || "Consolidação Automática (Células)",
      updated_by: activeUser?.name || "Consolidação Automática (Células)",
      created_at: new Date().toISOString().slice(0, 10),
      updated_at: new Date().toISOString().slice(0, 10),
      status: "Submetido",
      semana: reportWeek,
      data_do_culto: serviceDate,
      data_inicio: serviceDate,
      data_fim: serviceDate,
      culto: serviceType,
      att: totalAtt,
      ft: totalFt,
      nc: totalNc,
      rs: totalRs,
      total_ft_reached: totalFt,
      comentarios: \`Consolidação automática de presenças das células (\${matchingCellReports.length} célula(s) reportadas).\`,
      submetido_por: "Portal de Células",
      estado: "Submetido"
    };
    state.cellLeadership.churchReports.unshift(existing);
  }

  saveState("Consolidated cell attendance into church report");
  return existing;
}

window.consolidateCellReportToChurchReport = consolidateCellReportToChurchReport;
`;

  code = code.replace("function renderChurchReportsAnalyticalView() {", helpersAndChurchView + "\nfunction renderChurchReportsAnalyticalView() {");
}

fs.writeFileSync(DASHBOARD_PATH, code, "utf8");
console.log("Successfully ensured all helpers and analytical view in dashboard.js!");
