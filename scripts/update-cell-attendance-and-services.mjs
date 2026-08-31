import fs from "node:fs";

const DASHBOARD_PATH = "js/dashboard.js";
let code = fs.readFileSync(DASHBOARD_PATH, "utf8");

// 1. Update services list in analytics and state
code = code.replace(
  'const servicesList = ["Domingo - 1º Culto", "Domingo - 2º Culto", "Quarta-feira", "Reunião de Célula", "Culto Especial"];',
  'const servicesList = ["Domingo", "Quarta-feira", "Reunião de Célula", "Culto Especial"];'
);

code = code.replace(
  'service: "Domingo - 1º Culto",',
  'service: "Domingo",'
);

code = code.replace(
  /const serviceType = form\.querySelector\('\[data-attendance-field="serviceType"\]'\)\?\.value \|\| "Domingo - 1º Culto";/,
  'const serviceType = form.querySelector(\'[data-attendance-field="serviceType"]\')?.value || "Domingo";'
);

// 2. Replace the cell attendance section in renderCellLeaderPortal
const oldAttendanceSectionRegex = /<section id="cell-portal-attendance" class="cell-portal-section">[\s\S]*?<\/form>\s*<\/section>/m;

const newAttendanceSectionHtml = `<section id="cell-portal-attendance" class="cell-portal-section">
        \${cellPortalSectionTitle("bi-calendar-check-fill", "Registo de Presenças & Visitantes da Célula", "Marque os membros presentes e registe os novos visitantes (First Timers e Novos Convertidos). As presenças serão consolidadas automaticamente no relatório geral da Igreja.")}
        <form class="panel glass-panel mb-4" data-cell-attendance-form>
          <div class="row g-3 mb-3">
            <div class="col-md-4">
              <label class="form-label">Culto / Serviço</label>
              <select class="form-select" name="serviceType" data-attendance-field="serviceType">
                <option value="Domingo" selected>Domingo (Culto Geral)</option>
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

          <div class="cell-portal-table-wrap mb-4" style="max-height: 240px; overflow-y: auto;">
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

          <!-- Add New Visitors / First Timers / New Converts Section -->
          <div class="panel glass-panel mb-4 p-3" style="background: rgba(15, 23, 42, 0.55); border: 1px solid rgba(234, 179, 8, 0.25);">
            <h4 class="fs-6 mb-3 text-warning"><i class="bi bi-person-plus-fill me-2"></i>Registar Novo Membro ou First Timer (Primeira Vez)</h4>
            <div class="row g-2 align-items-end mb-3">
              <div class="col-md-5">
                <label class="form-label small mb-1">Nome Completo</label>
                <input type="text" class="form-control form-control-sm" id="newVisitorName" placeholder="Ex: Lucas Manuel">
              </div>
              <div class="col-md-3">
                <label class="form-label small mb-1">Telefone</label>
                <input type="tel" class="form-control form-control-sm" id="newVisitorPhone" placeholder="Ex: 841234567">
              </div>
              <div class="col-md-2">
                <label class="form-label small mb-1">Tipo</label>
                <select class="form-select form-select-sm" id="newVisitorType">
                  <option value="FT">First Timer (FT)</option>
                  <option value="NC">Novo Convertido (NC)</option>
                  <option value="FT_NC">FT & NC (Ambos)</option>
                </select>
              </div>
              <div class="col-md-2">
                <button type="button" class="btn btn-sm btn-warning w-100" data-add-visitor-row>
                  <i class="bi bi-plus-lg me-1"></i>Adicionar
                </button>
              </div>
            </div>

            <!-- Dynamic Visitors List Container -->
            <div id="cellAttendanceVisitorsList" class="table-responsive" style="display: none;">
              <table class="table table-sm text-light mb-2">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Telefone</th>
                    <th>Classificação</th>
                    <th style="width: 50px;">Acção</th>
                  </tr>
                </thead>
                <tbody id="cellAttendanceVisitorsTableBody"></tbody>
              </table>
            </div>
          </div>

          <!-- FT & NC Counters and Notes -->
          <div class="row g-3 p-3 glass-panel mb-3 rounded" style="background: rgba(15, 23, 42, 0.45);">
            <div class="col-md-6">
              <label class="form-label text-warning font-weight-bold"><i class="bi bi-person-heart me-1"></i>Total First Timers (FT)</label>
              <div class="input-group">
                <button class="btn btn-outline-secondary" type="button" data-step-counter="ftCount" data-step-delta="-1">-</button>
                <input type="number" min="0" class="form-control text-center font-weight-bold fs-5 text-warning" name="ftCount" value="0" data-attendance-field="ftCount">
                <button class="btn btn-outline-secondary" type="button" data-step-counter="ftCount" data-step-delta="1">+</button>
              </div>
              <small class="text-secondary">Pessoas que vieram pela 1ª vez</small>
            </div>
            <div class="col-md-6">
              <label class="form-label text-success font-weight-bold"><i class="bi bi-stars me-1"></i>Total Novos Convertidos (NC)</label>
              <div class="input-group">
                <button class="btn btn-outline-secondary" type="button" data-step-counter="ncCount" data-step-delta="-1">-</button>
                <input type="number" min="0" class="form-control text-center font-weight-bold fs-5 text-success" name="ncCount" value="0" data-attendance-field="ncCount">
                <button class="btn btn-outline-secondary" type="button" data-step-counter="ncCount" data-step-delta="1">+</button>
              </div>
              <small class="text-secondary">Entregaram a sua vida a Cristo no culto</small>
            </div>
            <div class="col-12">
              <label class="form-label"><i class="bi bi-chat-left-text me-1"></i>Observações / Testemunhos do Culto</label>
              <textarea class="form-control" name="attendanceNotes" rows="2" placeholder="Notas sobre a reunião ou culto de domingo..." data-attendance-field="attendanceNotes"></textarea>
            </div>
          </div>

          <div class="d-flex justify-content-end">
            <button type="button" class="btn btn-ce-gold btn-lg btn-touch" data-save-cell-attendance>
              <i class="bi bi-cloud-arrow-up-fill me-2"></i>Guardar Presenças & Consolidar no Relatório de Igreja
            </button>
          </div>
        </form>
      </section>`;

code = code.replace(oldAttendanceSectionRegex, newAttendanceSectionHtml);

// 3. Update dynamic visitors handling in event listeners
const visitorHandlersCode = `
// Track current attendance session dynamic visitors
let currentSessionVisitors = [];

function refreshAttendanceVisitorsList() {
  const container = document.getElementById("cellAttendanceVisitorsList");
  const tbody = document.getElementById("cellAttendanceVisitorsTableBody");
  if (!container || !tbody) return;

  if (!currentSessionVisitors.length) {
    container.style.display = "none";
    tbody.innerHTML = "";
    return;
  }

  container.style.display = "block";
  tbody.innerHTML = currentSessionVisitors.map((v, idx) => \`
    <tr>
      <td><strong>\${escapeAttr(v.name)}</strong></td>
      <td>\${escapeAttr(v.phone || "—")}</td>
      <td>
        \${v.isFT ? '<span class="badge bg-warning text-dark me-1">FT</span>' : ""}
        \${v.isNC ? '<span class="badge bg-success">NC</span>' : ""}
      </td>
      <td>
        <button type="button" class="btn btn-sm btn-outline-danger py-0 px-1" data-remove-visitor-idx="\${idx}" title="Remover">&times;</button>
      </td>
    </tr>
  \`).join("");

  // Sync counters
  const ftTotal = currentSessionVisitors.filter((v) => v.isFT).length;
  const ncTotal = currentSessionVisitors.filter((v) => v.isNC).length;
  const ftInput = document.querySelector('[data-attendance-field="ftCount"]');
  const ncInput = document.querySelector('[data-attendance-field="ncCount"]');
  if (ftInput) ftInput.value = ftTotal;
  if (ncInput) ncInput.value = ncTotal;
}

document.addEventListener("click", (event) => {
  // Add visitor row
  if (event.target.closest("[data-add-visitor-row]")) {
    const nameInput = document.getElementById("newVisitorName");
    const phoneInput = document.getElementById("newVisitorPhone");
    const typeSelect = document.getElementById("newVisitorType");

    const name = (nameInput?.value || "").trim();
    const phone = (phoneInput?.value || "").trim();
    const type = typeSelect?.value || "FT";

    if (!name) {
      alert("Por favor introduza o nome do visitante / novo membro.");
      nameInput?.focus();
      return;
    }

    const isFT = type === "FT" || type === "FT_NC";
    const isNC = type === "NC" || type === "FT_NC";

    currentSessionVisitors.push({
      name,
      phone,
      type,
      isFT,
      isNC,
      id: typeof generateUuid === "function" ? generateUuid() : "v-" + Date.now()
    });

    if (nameInput) nameInput.value = "";
    if (phoneInput) phoneInput.value = "";
    nameInput?.focus();

    refreshAttendanceVisitorsList();
    return;
  }

  // Remove visitor row
  const removeVisitorBtn = event.target.closest("[data-remove-visitor-idx]");
  if (removeVisitorBtn) {
    const idx = Number(removeVisitorBtn.dataset.removeVisitorIdx);
    if (!isNaN(idx) && idx >= 0 && idx < currentSessionVisitors.length) {
      currentSessionVisitors.splice(idx, 1);
      refreshAttendanceVisitorsList();
    }
    return;
  }
});
`;

// Insert visitorHandlersCode right before event listeners block
code = code.replace(
  "// ============================================================================\n// EVENT LISTENERS FOR CHURCH REPORTS & CELL ATTENDANCE",
  visitorHandlersCode + "\n// ============================================================================\n// EVENT LISTENERS FOR CHURCH REPORTS & CELL ATTENDANCE"
);

// Update save attendance to also push new FTs into state.firstTimers and reset session visitors
const oldSaveAttendanceInside = `    const serviceType = form.querySelector('[data-attendance-field="serviceType"]')?.value || "Domingo";
    const serviceDate = form.querySelector('[data-attendance-field="serviceDate"]')?.value || new Date().toISOString().slice(0, 10);
    const reportWeek = form.querySelector('[data-attendance-field="reportWeek"]')?.value || "Semana 1";
    const ftCount = Number(form.querySelector('[data-attendance-field="ftCount"]')?.value || 0);
    const ncCount = Number(form.querySelector('[data-attendance-field="ncCount"]')?.value || 0);
    const rsCount = Number(form.querySelector('[data-attendance-field="rsCount"]')?.value || 0);
    const offeringAmount = Number(form.querySelector('[data-attendance-field="offeringAmount"]')?.value || 0);
    const notes = form.querySelector('[data-attendance-field="attendanceNotes"]')?.value || "";`;

const newSaveAttendanceInside = `    const serviceType = form.querySelector('[data-attendance-field="serviceType"]')?.value || "Domingo";
    const serviceDate = form.querySelector('[data-attendance-field="serviceDate"]')?.value || new Date().toISOString().slice(0, 10);
    const reportWeek = form.querySelector('[data-attendance-field="reportWeek"]')?.value || "Semana 1";
    const ftCount = Number(form.querySelector('[data-attendance-field="ftCount"]')?.value || 0);
    const ncCount = Number(form.querySelector('[data-attendance-field="ncCount"]')?.value || 0);
    const notes = form.querySelector('[data-attendance-field="attendanceNotes"]')?.value || "";

    // Register any new FT/NC visitors into state.firstTimers if present
    if (currentSessionVisitors && currentSessionVisitors.length) {
      if (!Array.isArray(state.firstTimers)) state.firstTimers = [];
      const cellId = cellPortalPageState.cellId || "cell-1";
      const cell = findCellSafe(cellId) || {};
      const churchId = cell.church_id || activeUser?.church_id || "church-hq";

      currentSessionVisitors.forEach((v) => {
        const parts = v.name.split(" ");
        const firstName = parts[0] || v.name;
        const lastName = parts.slice(1).join(" ") || "";

        const ftRecord = {
          id: typeof generateUuid === "function" ? generateUuid() : "ft-" + Date.now(),
          first_name: firstName,
          last_name: lastName,
          full_name: v.name,
          phone: v.phone || "",
          telefone: v.phone || "",
          church_id: churchId,
          cell_id: cellId,
          convidado_por: activeUser?.name || "Líder de Célula",
          data_do_culto: serviceDate,
          culto: serviceType,
          born_again: v.isNC,
          nasceu_de_novo: v.isNC,
          workflow_status: "DRAFT",
          estado_do_seguimento: "Pending",
          created_at: serviceDate,
          updated_at: serviceDate
        };
        state.firstTimers.unshift(ftRecord);
      });
    }`;

code = code.replace(oldSaveAttendanceInside, newSaveAttendanceInside);

// Clear currentSessionVisitors on successful save
code = code.replace(
  'alert(lang === "pt"',
  'currentSessionVisitors = [];\n    alert(lang === "pt"'
);

fs.writeFileSync(DASHBOARD_PATH, code, "utf8");
console.log("Successfully updated Cell Attendance form with new visitor name fields and clean Sunday service!");
