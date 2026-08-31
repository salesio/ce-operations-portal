import fs from "node:fs";

const DASHBOARD_PATH = "js/dashboard.js";
let code = fs.readFileSync(DASHBOARD_PATH, "utf8");

// 1. Update cell-portal-nav in renderCellLeaderPortal to include "attendance"
code = code.replace(
  /\[\["overview","Visão Geral"\],\["members","Membros & Reconciliação"\]/m,
  '[["overview","Visão Geral"],["attendance","Presenças & Visitantes"],["members","Membros & Reconciliação"]'
);

// 2. Insert attendance section right before members section
const attendanceSectionHtml = `      <section id="cell-portal-attendance" class="cell-portal-section">
        \${cellPortalSectionTitle("bi-calendar-check-fill", "Registo de Presenças & Visitantes da Célula", "Marque os membros presentes e adicione First Timers (FT) e Novos Convertidos (NC). As presenças serão consolidadas automaticamente no relatório geral da Igreja.")}
        <form class="panel glass-panel mb-4" data-cell-attendance-form>
          <div class="row g-3 mb-3">
            <div class="col-md-4">
              <label class="form-label">Culto / Serviço</label>
              <select class="form-select" name="serviceType" data-attendance-field="serviceType">
                <option value="Domingo - 1º Culto">Domingo - 1º Culto</option>
                <option value="Domingo - 2º Culto">Domingo - 2º Culto</option>
                <option value="Quarta-feira">Quarta-feira</option>
                <option value="Reunião de Célula">Reunião de Célula</option>
                <option value="Culto Especial">Culto Especial</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label">Data do Culto</label>
              <input type="date" class="form-control" name="serviceDate" value="\${new Date().toISOString().slice(0, 10)}" data-attendance-field="serviceDate">
            </div>
            <div class="col-md-4">
              <label class="form-label">Semana do Relatório</label>
              <input type="text" class="form-control" name="reportWeek" value="\${new Date().toLocaleString(lang === "pt" ? "pt-PT" : "en-US", { month: "long" })} Semana \${Math.ceil(new Date().getDate() / 7)}" data-attendance-field="reportWeek">
            </div>
          </div>

          <!-- Members Checklist -->
          <div class="d-flex justify-content-between align-items-center mb-2">
            <h4 class="fs-6 mb-0 text-info"><i class="bi bi-people-fill me-2"></i>Membros da Célula (\${safeMembers.length})</h4>
            <div class="btn-group btn-group-sm">
              <button type="button" class="btn btn-outline-success" data-cell-attendance-check-all="1"><i class="bi bi-check-all me-1"></i>Marcar Todos</button>
              <button type="button" class="btn btn-outline-secondary" data-cell-attendance-check-all="0"><i class="bi bi-x-lg me-1"></i>Desmarcar</button>
            </div>
          </div>

          <div class="cell-portal-table-wrap mb-4" style="max-height: 280px; overflow-y: auto;">
            <table class="table cell-portal-table mb-0">
              <thead>
                <tr>
                  <th style="width: 45px;">Presença</th>
                  <th>Nome do Membro</th>
                  <th>Telefone</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                \${safeMembers.map((m) => \`
                  <tr>
                    <td>
                      <input type="checkbox" class="form-check-input" data-attendance-member-check="\${escapeAttr(m.id)}" checked style="width: 1.3rem; height: 1.3rem; cursor: pointer;">
                    </td>
                    <td><strong>\${escapeAttr(m.name || "—")}</strong></td>
                    <td>\${escapeAttr(m.phone || "—")}</td>
                    <td>\${badge(m.status || "Activo")}</td>
                  </tr>
                \`).join("") || \`<tr><td colspan="4">Nenhum membro registado na célula.</td></tr>\`}
              </tbody>
            </table>
          </div>

          <!-- FT, NC, RS & Offering Section -->
          <div class="row g-3 p-3 glass-panel mb-3 rounded" style="background: rgba(15, 23, 42, 0.45);">
            <div class="col-md-3">
              <label class="form-label text-warning font-weight-bold"><i class="bi bi-person-heart me-1"></i>First Timers (FT)</label>
              <div class="input-group">
                <button class="btn btn-outline-secondary" type="button" data-step-counter="ftCount" data-step-delta="-1">-</button>
                <input type="number" min="0" class="form-control text-center" name="ftCount" value="0" data-attendance-field="ftCount">
                <button class="btn btn-outline-secondary" type="button" data-step-counter="ftCount" data-step-delta="1">+</button>
              </div>
              <small class="text-secondary">Pessoas pela 1ª vez</small>
            </div>
            <div class="col-md-3">
              <label class="form-label text-success font-weight-bold"><i class="bi bi-stars me-1"></i>Novos Convertidos (NC)</label>
              <div class="input-group">
                <button class="btn btn-outline-secondary" type="button" data-step-counter="ncCount" data-step-delta="-1">-</button>
                <input type="number" min="0" class="form-control text-center" name="ncCount" value="0" data-attendance-field="ncCount">
                <button class="btn btn-outline-secondary" type="button" data-step-counter="ncCount" data-step-delta="1">+</button>
              </div>
              <small class="text-secondary">Entregaram a vida a Cristo</small>
            </div>
            <div class="col-md-3">
              <label class="form-label text-primary"><i class="bi bi-book me-1"></i>Rapsódia (RS)</label>
              <input type="number" min="0" class="form-control text-center" name="rsCount" value="0" data-attendance-field="rsCount">
              <small class="text-secondary">Rapsódias distribuídas</small>
            </div>
            <div class="col-md-3">
              <label class="form-label"><i class="bi bi-cash-coin me-1"></i>Oferta (MT)</label>
              <input type="number" min="0" step="10" class="form-control text-center" name="offeringAmount" value="0" data-attendance-field="offeringAmount">
              <small class="text-secondary">Opcional</small>
            </div>
            <div class="col-12">
              <label class="form-label"><i class="bi bi-chat-left-text me-1"></i>Observações / Testemunhos do Culto</label>
              <textarea class="form-control" name="attendanceNotes" rows="2" placeholder="Notas sobre a reunião ou cultos..." data-attendance-field="attendanceNotes"></textarea>
            </div>
          </div>

          <div class="d-flex justify-content-end">
            <button type="button" class="btn btn-ce-gold btn-lg btn-touch" data-save-cell-attendance>
              <i class="bi bi-cloud-arrow-up-fill me-2"></i>Guardar Presenças & Consolidar no Relatório de Igreja
            </button>
          </div>
        </form>
      </section>
`;

code = code.replace(
  /<section id="cell-portal-members" class="cell-portal-section">/m,
  attendanceSectionHtml + '      <section id="cell-portal-members" class="cell-portal-section">'
);

// 3. Add Event Listeners for Church Reports and Cell Attendance
const eventListenersCode = `
// ============================================================================
// EVENT LISTENERS FOR CHURCH REPORTS & CELL ATTENDANCE
// ============================================================================

document.addEventListener("click", (event) => {
  // Level switch in Church Reports
  const levelBtn = event.target.closest("[data-church-report-level]");
  if (levelBtn) {
    churchReportPageState.level = levelBtn.dataset.churchReportLevel;
    if (activeRoute === "cellChurchReports") renderCellMinistry("churchReports");
    return;
  }

  // Filter group in Church Reports
  const filterGroupBtn = event.target.closest("[data-church-report-filter-group]");
  if (filterGroupBtn) {
    churchReportPageState.level = "cell";
    churchReportPageState.cellGroupId = filterGroupBtn.dataset.churchReportFilterGroup;
    if (activeRoute === "cellChurchReports") renderCellMinistry("churchReports");
    return;
  }

  // Reset filters
  if (event.target.closest("[data-church-filter-reset]")) {
    churchReportPageState.service = "";
    churchReportPageState.period = "month";
    churchReportPageState.dateFrom = "";
    churchReportPageState.dateTo = "";
    churchReportPageState.churchId = "";
    churchReportPageState.cellGroupId = "";
    churchReportPageState.cellId = "";
    churchReportPageState.search = "";
    if (activeRoute === "cellChurchReports") renderCellMinistry("churchReports");
    return;
  }

  // Export Church Reports
  if (event.target.closest("[data-export-church-reports]")) {
    const list = churchReportPageState.level === "cell"
      ? (state.cellLeadership?.cellReports || [])
      : (state.cellLeadership?.churchReports || []);
    exportTableAsCsv("church_reports.csv", list);
    return;
  }

  // Check all / Uncheck all in Cell Attendance
  const checkAllBtn = event.target.closest("[data-cell-attendance-check-all]");
  if (checkAllBtn) {
    const checkState = checkAllBtn.dataset.cellAttendanceCheckAll === "1";
    document.querySelectorAll("[data-attendance-member-check]").forEach((cb) => {
      cb.checked = checkState;
    });
    return;
  }

  // Step counter +/- buttons for FT / NC
  const stepBtn = event.target.closest("[data-step-counter]");
  if (stepBtn) {
    const targetField = stepBtn.dataset.stepCounter;
    const delta = Number(stepBtn.dataset.stepDelta || 0);
    const input = document.querySelector(\`[data-attendance-field="\${targetField}"]\`);
    if (input) {
      input.value = Math.max(0, Number(input.value || 0) + delta);
    }
    return;
  }

  // Save Cell Attendance & Consolidate to Church Report
  if (event.target.closest("[data-save-cell-attendance]")) {
    const form = document.querySelector("[data-cell-attendance-form]");
    if (!form) return;

    const serviceType = form.querySelector('[data-attendance-field="serviceType"]')?.value || "Domingo - 1º Culto";
    const serviceDate = form.querySelector('[data-attendance-field="serviceDate"]')?.value || new Date().toISOString().slice(0, 10);
    const reportWeek = form.querySelector('[data-attendance-field="reportWeek"]')?.value || "Semana 1";
    const ftCount = Number(form.querySelector('[data-attendance-field="ftCount"]')?.value || 0);
    const ncCount = Number(form.querySelector('[data-attendance-field="ncCount"]')?.value || 0);
    const rsCount = Number(form.querySelector('[data-attendance-field="rsCount"]')?.value || 0);
    const offeringAmount = Number(form.querySelector('[data-attendance-field="offeringAmount"]')?.value || 0);
    const notes = form.querySelector('[data-attendance-field="attendanceNotes"]')?.value || "";

    const checkedBoxes = Array.from(form.querySelectorAll("[data-attendance-member-check]:checked"));
    const checkedMemberIds = checkedBoxes.map((cb) => cb.dataset.attendanceMemberCheck);
    const membersPresentCount = checkedMemberIds.length;
    const totalAtt = membersPresentCount + ftCount;

    const cellId = cellPortalPageState.cellId || (getAuthorizedCellsForUser(activeUser?.id)[0]?.id) || "cell-1";
    const cell = findCellSafe(cellId) || (getAuthorizedCellsForUser(activeUser?.id)[0]) || {};
    const churchId = cell.church_id || activeUser?.church_id || "church-hq";

    if (!state.cellLeadership) state.cellLeadership = { ...seedData.cellLeadership };
    if (!Array.isArray(state.cellLeadership.cellReports)) state.cellLeadership.cellReports = [];

    // Find or create cell report for this cell, date and service
    let cellReport = state.cellLeadership.cellReports.find((r) => {
      const rDate = r.data_do_culto || r.data_inicio;
      return String(r.cell_id) === String(cellId) && rDate === serviceDate && r.culto === serviceType;
    });

    if (cellReport) {
      cellReport.att = totalAtt;
      cellReport.members_present_count = membersPresentCount;
      cellReport.members_present_ids = checkedMemberIds;
      cellReport.ft = ftCount;
      cellReport.nc = ncCount;
      cellReport.rs = rsCount;
      cellReport.oferta = offeringAmount;
      cellReport.observacoes = notes;
      cellReport.semana = reportWeek;
      cellReport.updated_at = new Date().toISOString().slice(0, 10);
      cellReport.estado = "Submetido";
    } else {
      cellReport = {
        id: typeof generateUuid === "function" ? generateUuid() : \`cell-report-\${Date.now()}\`,
        church_id: churchId,
        cell_id: cellId,
        celula: cell.cell_name || cell.name || "Célula",
        cell_group_id: cell.group_id || cell.cell_group_id || "",
        cell_group_name: cell.group_name || cell.cell_group_name || "",
        leader_id: activeUser?.id,
        nome_do_lider: activeUser?.name || "Líder de Célula",
        titulo_do_lider: "Líder",
        data_do_culto: serviceDate,
        data_inicio: serviceDate,
        data_fim: serviceDate,
        culto: serviceType,
        semana: reportWeek,
        att: totalAtt,
        members_present_count: membersPresentCount,
        members_present_ids: checkedMemberIds,
        ft: ftCount,
        nc: ncCount,
        rs: rsCount,
        oferta: offeringAmount,
        observacoes: notes,
        submetido_por: activeUser?.name || "Líder de Célula",
        submitted_by_user_id: activeUser?.id,
        created_at: new Date().toISOString().slice(0, 10),
        updated_at: new Date().toISOString().slice(0, 10),
        estado: "Submetido"
      };
      state.cellLeadership.cellReports.unshift(cellReport);
    }

    // Automatically consolidate to Church Reports
    consolidateCellReportToChurchReport(cellReport);

    alert(lang === "pt"
      ? \`Presenças da célula salvas com sucesso! (\${membersPresentCount} membros + \${ftCount} FT = \${totalAtt} presentes). Os dados foram consolidados no Relatório Geral da Igreja.\`
      : \`Cell attendance saved successfully! Consolidated into Church Report.\`);

    if (activeRoute === "cellPortal") {
      renderCellLeaderPortal();
    }
  }
});

// Dynamic change listener for Church Report Filters
document.addEventListener("change", (event) => {
  if (event.target.closest("[data-church-report-filters]")) {
    const form = event.target.closest("[data-church-report-filters]");
    churchReportPageState.service = form.querySelector('[name="service"]')?.value || "";
    churchReportPageState.period = form.querySelector('[name="period"]')?.value || "month";
    churchReportPageState.dateFrom = form.querySelector('[name="dateFrom"]')?.value || "";
    churchReportPageState.dateTo = form.querySelector('[name="dateTo"]')?.value || "";
    churchReportPageState.cellGroupId = form.querySelector('[name="cellGroupId"]')?.value || "";
    churchReportPageState.cellId = form.querySelector('[name="cellId"]')?.value || "";
    if (activeRoute === "cellChurchReports") renderCellMinistry("churchReports");
  }
});

document.addEventListener("input", (event) => {
  if (event.target.matches('[data-church-report-filters] [name="search"]')) {
    churchReportPageState.search = event.target.value;
    if (activeRoute === "cellChurchReports") renderCellMinistry("churchReports");
  }
});
`;

code += "\n" + eventListenersCode;

fs.writeFileSync(DASHBOARD_PATH, code, "utf8");
console.log("Successfully implemented Cell Attendance section and event listeners!");
