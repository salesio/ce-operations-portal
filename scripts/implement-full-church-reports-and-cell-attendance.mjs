import fs from "node:fs";

const DASHBOARD_PATH = "js/dashboard.js";
let code = fs.readFileSync(DASHBOARD_PATH, "utf8");

// 1. Implementation of renderChurchReportsAnalyticalView
const churchReportsViewFunction = `
function renderChurchReportsAnalyticalView() {
  const leadership = state.cellLeadership || seedData.cellLeadership;
  const churchReports = scopedNested(leadership.churchReports || []);
  const cellReports = sortCellReportsNewestFirst(scopedNested(leadership.cellReports || []));
  const groups = scopedNested(state.cellGroups || []);
  const cells = scopedNested(state.cellRegistry || state.cells || []);

  const st = churchReportPageState;

  // Filter church reports by level, service, period, church, group, cell and search
  let filteredChurch = filterReportsByPeriod(churchReports, st.period, st.dateFrom, st.dateTo);
  let filteredCells = filterReportsByPeriod(cellReports, st.period, st.dateFrom, st.dateTo);

  if (st.service) {
    filteredChurch = filteredChurch.filter((r) => String(r.culto || "").toLowerCase().includes(st.service.toLowerCase()));
    filteredCells = filteredCells.filter((r) => String(r.culto || "").toLowerCase().includes(st.service.toLowerCase()));
  }

  if (st.churchId) {
    filteredChurch = filteredChurch.filter((r) => r.church_id === st.churchId);
    filteredCells = filteredCells.filter((r) => r.church_id === st.churchId);
  }

  if (st.cellGroupId) {
    filteredCells = filteredCells.filter((r) => String(r.cell_group_id || r.group_id) === String(st.cellGroupId));
  }

  if (st.cellId) {
    filteredCells = filteredCells.filter((r) => String(r.cell_id) === String(st.cellId));
  }

  if (st.search) {
    const q = st.search.toLowerCase();
    filteredChurch = filteredChurch.filter((r) => (r.semana || "").toLowerCase().includes(q) || (r.culto || "").toLowerCase().includes(q) || (r.comentarios || "").toLowerCase().includes(q));
    filteredCells = filteredCells.filter((r) => (r.celula || "").toLowerCase().includes(q) || (r.nome_do_lider || "").toLowerCase().includes(q) || (r.semana || "").toLowerCase().includes(q));
  }

  // Calculate summary metrics
  const activeDataset = st.level === "cell" ? filteredCells : filteredChurch;
  const totalAtt = activeDataset.reduce((sum, r) => sum + Number(r.att || r.members_present_count || 0), 0);
  const totalFt = activeDataset.reduce((sum, r) => sum + Number(r.ft || r.first_timers_count || 0), 0);
  const totalNc = activeDataset.reduce((sum, r) => sum + Number(r.nc || r.new_converts || 0), 0);
  const totalRs = activeDataset.reduce((sum, r) => sum + Number(r.rs || 0), 0);

  // Peak & Low calculations
  const attValues = activeDataset.map((r) => ({
    val: Number(r.att || r.members_present_count || 0),
    date: r.data_do_culto || r.data_inicio || r.data || "",
    service: r.culto || "Domingo",
    label: \`\${String(r.data_do_culto || r.data_inicio || "").slice(5)} (\${r.culto || "Culto"})\`
  }));

  let peakPoint = { val: 0, label: "—", date: "—" };
  let lowPoint = { val: 0, label: "—", date: "—" };

  if (attValues.length) {
    attValues.sort((a, b) => b.val - a.val);
    peakPoint = attValues[0];
    lowPoint = attValues[attValues.length - 1];
  }

  // Prepare chart data points sorted chronologically
  const chronological = [...activeDataset].sort((a, b) => {
    const da = Date.parse(a.data_do_culto || a.data_inicio || a.created_at || 0);
    const db = Date.parse(b.data_do_culto || b.data_inicio || b.created_at || 0);
    return da - db;
  });

  const chartDataPoints = chronological.map((r) => ({
    label: \`\${String(r.data_do_culto || r.data_inicio || "").slice(5)} (\${(r.culto || "Culto").split(" ")[0]})\`,
    value: Number(r.att || r.members_present_count || 0),
    date: r.data_do_culto || r.data_inicio || ""
  }));

  const comparativeSeries = chronological.slice(-8).map((r) => ({
    label: \`\${String(r.data_do_culto || r.data_inicio || "").slice(5)} \${(r.culto || "").slice(0, 4)}\`,
    att: Number(r.att || r.members_present_count || 0),
    ft: Number(r.ft || 0),
    nc: Number(r.nc || 0)
  }));

  const servicesList = ["Domingo - 1º Culto", "Domingo - 2º Culto", "Quarta-feira", "Reunião de Célula", "Culto Especial"];

  return \`
    <section class="panel glass-panel mb-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <div>
          <h3 class="panel-title mb-1"><i class="bi bi-diagram-3-fill me-2 text-info"></i>Relatórios de Igreja & Células</h3>
          <p class="text-secondary mb-0">Consolidação de presenças, visitantes (FT) e novos convertidos (NC) de todas as células e cultos.</p>
        </div>
        <div class="d-flex gap-2 flex-wrap">
          <button type="button" class="btn btn-ce-gold btn-touch" data-open-form="churchReport"><i class="bi bi-plus-lg me-1"></i>Adicionar Relatório Manual</button>
          <button type="button" class="btn btn-outline-cyan btn-touch" data-export-church-reports><i class="bi bi-download me-1"></i>Exportar Relatórios</button>
        </div>
      </div>

      <!-- Level Selector Tabs -->
      <div class="btn-group w-100 mb-3" role="group" aria-label="Nível de Relatório">
        <button type="button" class="btn \${st.level === "church" ? "btn-primary" : "btn-outline-primary"}" data-church-report-level="church"><i class="bi bi-building me-1"></i>Relatório Geral de Igreja</button>
        <button type="button" class="btn \${st.level === "group" ? "btn-primary" : "btn-outline-primary"}" data-church-report-level="group"><i class="bi bi-collection me-1"></i>Por Grupo de Célula</button>
        <button type="button" class="btn \${st.level === "cell" ? "btn-primary" : "btn-outline-primary"}" data-church-report-level="cell"><i class="bi bi-diagram-3 me-1"></i>Por Célula Individual</button>
      </div>

      <!-- Filters Toolbar -->
      <form class="filter-toolbar filter-bar mb-4" data-church-report-filters>
        <select class="form-select" name="service" data-church-filter-field>
          <option value="">Todos os Cultos</option>
          \${servicesList.map((svc) => \`<option value="\${svc}" \${st.service === svc ? "selected" : ""}>\${svc}</option>\`).join("")}
        </select>

        <select class="form-select" name="period" data-church-filter-field>
          <option value="week" \${st.period === "week" ? "selected" : ""}>Esta Semana (Últimos 7 dias)</option>
          <option value="month" \${st.period === "month" ? "selected" : ""}>Este Mês</option>
          <option value="quarter" \${st.period === "quarter" ? "selected" : ""}>Trimestre</option>
          <option value="semester" \${st.period === "semester" ? "selected" : ""}>Semestre</option>
          <option value="year" \${st.period === "year" ? "selected" : ""}>Este Ano</option>
          <option value="custom" \${st.period === "custom" ? "selected" : ""}>Personalizado</option>
        </select>

        \${st.period === "custom" ? \`
          <input type="date" class="form-control" name="dateFrom" value="\${st.dateFrom || ""}" data-church-filter-field title="Data Início">
          <input type="date" class="form-control" name="dateTo" value="\${st.dateTo || ""}" data-church-filter-field title="Data Fim">
        \` : ""}

        \${st.level !== "church" ? \`
          <select class="form-select" name="cellGroupId" data-church-filter-field>
            <option value="">Todos os Grupos</option>
            \${groups.map((g) => \`<option value="\${g.id}" \${String(st.cellGroupId) === String(g.id) ? "selected" : ""}>\${g.group_name || g.name || "Grupo"}</option>\`).join("")}
          </select>
        \` : ""}

        \${st.level === "cell" ? \`
          <select class="form-select" name="cellId" data-church-filter-field>
            <option value="">Todas as Células</option>
            \${cells.map((c) => \`<option value="\${c.id}" \${String(st.cellId) === String(c.id) ? "selected" : ""}>\${c.cell_name || c.name || "Célula"}</option>\`).join("")}
          </select>
        \` : ""}

        <input type="text" class="form-control" name="search" placeholder="Pesquisar..." value="\${st.search || ""}" data-church-filter-field>
        <button type="button" class="btn btn-outline-cyan btn-touch" data-church-filter-reset><i class="bi bi-arrow-counterclockwise me-1"></i>Limpar</button>
      </form>

      <!-- KPI Summary Cards with Peaks & Lows -->
      <div class="row g-3 summary-cards-row mb-4">
        <div class="col-sm-6 col-xl-2">
          <div class="kpi-card glass-panel text-center p-3">
            <span class="text-secondary small d-block mb-1"><i class="bi bi-people me-1"></i>Total Presentes</span>
            <h3 class="mb-0 text-info font-weight-bold">\${totalAtt}</h3>
          </div>
        </div>
        <div class="col-sm-6 col-xl-2">
          <div class="kpi-card glass-panel text-center p-3">
            <span class="text-secondary small d-block mb-1"><i class="bi bi-person-heart me-1"></i>Primeira Vez (FT)</span>
            <h3 class="mb-0 text-warning font-weight-bold">\${totalFt}</h3>
          </div>
        </div>
        <div class="col-sm-6 col-xl-2">
          <div class="kpi-card glass-panel text-center p-3">
            <span class="text-secondary small d-block mb-1"><i class="bi bi-stars me-1"></i>Novos Convertidos</span>
            <h3 class="mb-0 text-success font-weight-bold">\${totalNc}</h3>
          </div>
        </div>
        <div class="col-sm-6 col-xl-2">
          <div class="kpi-card glass-panel text-center p-3">
            <span class="text-secondary small d-block mb-1"><i class="bi bi-book me-1"></i>Rapsódia (RS)</span>
            <h3 class="mb-0 text-primary font-weight-bold">\${totalRs}</h3>
          </div>
        </div>
        <div class="col-sm-6 col-xl-2">
          <div class="kpi-card glass-panel text-center p-3" style="border-left: 3px solid #10b981;">
            <span class="text-success small d-block mb-1"><i class="bi bi-arrow-up-circle-fill me-1"></i>Pico Máximo</span>
            <h3 class="mb-0 text-success font-weight-bold">\${peakPoint.val}</h3>
            <small class="text-secondary d-block text-truncate" title="\${peakPoint.date}">\${peakPoint.date || "—"}</small>
          </div>
        </div>
        <div class="col-sm-6 col-xl-2">
          <div class="kpi-card glass-panel text-center p-3" style="border-left: 3px solid #ef4444;">
            <span class="text-danger small d-block mb-1"><i class="bi bi-arrow-down-circle-fill me-1"></i>Baixa Mínima</span>
            <h3 class="mb-0 text-danger font-weight-bold">\${lowPoint.val}</h3>
            <small class="text-secondary d-block text-truncate" title="\${lowPoint.date}">\${lowPoint.date || "—"}</small>
          </div>
        </div>
      </div>

      <!-- Two Analytical Charts: Trend with Peaks/Lows and Comparative Bars -->
      <div class="row g-4 mb-4">
        <div class="col-xl-7">
          <article class="chart-card glass-panel light-surface h-100 p-3">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h4 class="panel-title mb-0 fs-6"><i class="bi bi-graph-up-arrow me-2 text-info"></i>Tendência Temporal com Picos & Baixas</h4>
              <span class="badge bg-dark-subtle text-info">\${st.period.toUpperCase()}</span>
            </div>
            \${renderPeakLowChartSvg(chartDataPoints)}
          </article>
        </div>
        <div class="col-xl-5">
          <article class="chart-card glass-panel light-surface h-100 p-3">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h4 class="panel-title mb-0 fs-6"><i class="bi bi-bar-chart-steps me-2 text-warning"></i>Composição (Presentes vs FT vs NC)</h4>
              <span class="badge bg-dark-subtle text-warning">Últimos Cultos</span>
            </div>
            \${renderComparativeBarsSvg(comparativeSeries)}
          </article>
        </div>
      </div>

      <!-- Data Table -->
      <div class="panel glass-panel">
        \${st.level === "church" ? \`
          \${filteredChurch.length ? dataTable([L("week"), L("serviceDate"), L("worshipService"), L("church"), "ATT", "FT", "NC", "RS", L("totalFirstTime"), L("status"), L("actions")], filteredChurch.map((item) => [
            item.semana || "—",
            item.data_do_culto || item.data_inicio || item.data || "—",
            badge(item.culto || "Domingo"),
            churchName(item.church_id || item.igreja),
            \`<strong>\${item.att || 0}</strong>\`,
            item.ft || 0,
            item.nc || 0,
            item.rs || 0,
            item.total_ft_reached || item.ft || 0,
            badge(item.estado || item.status || "Submetido"),
            actionButtons([["view", "churchReport", item.id, L("view")], ["edit", "churchReport", item.id, L("edit")], ["delete", "churchReport", item.id, L("delete")], ["export", "churchReport", item.id, L("export")]])
          ])) : EmptyState({ compact: true, title: "Sem relatórios de igreja", description: "Os relatórios submetidos pelas células serão consolidados aqui automaticamente." })}
        \` : st.level === "group" ? \`
          \${(() => {
            const groupMap = new Map();
            filteredCells.forEach((r) => {
              const gid = r.cell_group_id || r.group_id || "outros";
              const gname = r.cell_group_name || (groups.find((g) => g.id === gid)?.group_name) || "Grupo Geral";
              if (!groupMap.has(gid)) {
                groupMap.set(gid, { gid, gname, semana: r.semana, data: r.data_do_culto || r.data_inicio, culto: r.culto, att: 0, ft: 0, nc: 0, rs: 0, cellCount: 0 });
              }
              const gObj = groupMap.get(gid);
              gObj.att += Number(r.att || r.members_present_count || 0);
              gObj.ft += Number(r.ft || 0);
              gObj.nc += Number(r.nc || 0);
              gObj.rs += Number(r.rs || 0);
              gObj.cellCount += 1;
            });
            const groupRows = Array.from(groupMap.values());
            return groupRows.length ? dataTable(["Grupo de Célula", L("week"), L("serviceDate"), L("worshipService"), "Células Reportadas", "ATT Total", "FT Total", "NC Total", "RS Total", L("actions")], groupRows.map((g) => [
              \`<strong>\${g.gname}</strong>\`,
              g.semana || "—",
              g.data || "—",
              badge(g.culto || "Domingo"),
              \`<span class="badge bg-secondary">\${g.cellCount} célula(s)</span>\`,
              \`<strong>\${g.att}</strong>\`,
              g.ft,
              g.nc,
              g.rs,
              \`<button type="button" class="btn btn-sm btn-outline-cyan" data-church-report-filter-group="\${g.gid}">Ver Células</button>\`
            ])) : EmptyState({ compact: true, title: "Sem dados por grupo", description: "Nenhum relatório de grupo disponível para os filtros seleccionados." });
          })()}
        \` : \`
          \${filteredCells.length ? dataTable([L("cell"), "Grupo", L("week"), L("serviceDate"), L("worshipService"), "Presentes", "FT", "NC", "RS", L("status"), L("actions")], filteredCells.map((item) => [
            \`<strong>\${item.celula || "Célula"}</strong><small class="d-block text-secondary">\${item.nome_do_lider || item.submetido_por || ""}</small>\`,
            item.cell_group_name || "—",
            item.semana || "—",
            item.data_do_culto || item.data_inicio || item.data || "—",
            badge(item.culto || "Domingo"),
            \`<strong>\${item.att || item.members_present_count || 0}</strong>\`,
            item.ft || 0,
            item.nc || 0,
            item.rs || 0,
            badge(cellReportStatusLabel(item)),
            actionButtons([["view", "cellReport", item.id, L("view")], ["edit", "cellReport", item.id, L("edit")], ["export", "cellReport", item.id, L("export")]])
          ])) : EmptyState({ compact: true, title: "Sem relatórios de célula", description: "Nenhum relatório de célula submetido para este período." })}
        \`}
      </div>
    </section>
  \`;
}
`;

code = code.replace("function renderCellMinistry(activeTab = \"alecOverview\") {", churchReportsViewFunction + "\nfunction renderCellMinistry(activeTab = \"alecOverview\") {");

// In renderCellMinistry, replace churchReports panel with renderChurchReportsAnalyticalView()
code = code.replace(
  /churchReports:\s*\(\)\s*=>\s*modulePanel\("churchReport"[\s\S]*?true\),/,
  "churchReports: () => renderChurchReportsAnalyticalView(),"
);

fs.writeFileSync(DASHBOARD_PATH, code, "utf8");
console.log("Successfully integrated renderChurchReportsAnalyticalView in dashboard.js!");
