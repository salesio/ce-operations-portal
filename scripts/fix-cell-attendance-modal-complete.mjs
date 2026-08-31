import fs from "node:fs";

const DASHBOARD_PATH = "js/dashboard.js";
let code = fs.readFileSync(DASHBOARD_PATH, "utf8");

// 1. Declare currentSessionVisitors at the top with modalType
if (!code.includes("let currentSessionVisitors = [];")) {
  code = code.replace("let modalType = null;", "let modalType = null;\nlet currentSessionVisitors = [];");
} else {
  // Move it to top if only at bottom
  code = code.replace("let modalType = null;", "let modalType = null;\nlet currentSessionVisitors = [];");
}

// Remove any duplicate bottom declaration of let currentSessionVisitors
code = code.replace("// Track current attendance session dynamic visitors\nlet currentSessionVisitors = [];", "// Track current attendance session dynamic visitors\n// (declared at top of file)");

// 2. Ensure openCellAttendanceModal has robust error handling and is attached to window
const oldOpenFuncRegex = /function openCellAttendanceModal\(\) \{[\s\S]*?bootstrap\.Modal\.getOrCreateInstance\(byId\("entryModal"\)\)\.show\(\);\s*\}/;

const newOpenFunc = `function openCellAttendanceModal() {
  try {
    const context = getCellLeaderContext(activeUser?.id, cellPortalPageState.cellId);
    const authorized = getAuthorizedCellsForUser(activeUser?.id) || [];
    const cellId = context?.cell_id || (authorized[0]?.id) || "cell-1";
    const members = getCellMembersProfile(cellId, {}) || [];
    currentSessionVisitors = [];
    if (typeof window !== "undefined") window.currentSessionVisitors = currentSessionVisitors;
    modalType = "cellAttendance";

    const modalEyebrow = byId("modalEyebrow");
    if (modalEyebrow) modalEyebrow.textContent = "Portal de Célula • " + (context?.cell_name || "Célula");
    const modalTitle = byId("modalTitle");
    if (modalTitle) modalTitle.innerHTML = '<i class="bi bi-calendar-check-fill text-warning me-2"></i>Registo de Presenças & Visitantes da Célula';

    const todayStr = new Date().toISOString().slice(0, 10);
    const reportWeekStr = \`\${new Date().toLocaleString(lang === "pt" ? "pt-PT" : "en-US", { month: "long" })} Semana \${Math.ceil(new Date().getDate() / 7)}\`;

    const modalFields = byId("modalFields");
    if (modalFields) {
      modalFields.innerHTML = \`
        <div class="col-12">
          <div class="alert alert-info mb-2 small">
            <i class="bi bi-info-circle me-1"></i>Marque os membros oficiais presentes no culto e adicione novos visitantes.
            <strong>Regra de Membresia:</strong> Novos visitantes que atingirem <strong>3 presenças</strong> em cultos/reuniões tornam-se membros oficiais da célula.
          </div>
        </div>
        <div class="col-md-4">
          <label class="form-label">Culto / Serviço *</label>
          <select class="form-select" name="serviceType" data-attendance-field="serviceType">
            <option value="Domingo" selected>Domingo (Culto Geral)</option>
            <option value="Quarta-feira">Quarta-feira</option>
            <option value="Reunião de Célula">Reunião de Célula</option>
            <option value="Culto Especial">Culto Especial</option>
          </select>
        </div>
        <div class="col-md-4">
          <label class="form-label">Data do Culto *</label>
          <input type="date" class="form-control" name="serviceDate" value="\${todayStr}" data-attendance-field="serviceDate">
        </div>
        <div class="col-md-4">
          <label class="form-label">Semana do Relatório</label>
          <input type="text" class="form-control" name="reportWeek" value="\${reportWeekStr}" data-attendance-field="reportWeek">
        </div>

        <!-- Official Members Checklist (Default: UNCHECKED) -->
        <div class="col-12 mt-3">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <label class="form-label mb-0 fw-bold text-info"><i class="bi bi-people-fill me-1"></i>Membros Oficiais da Célula (\${members.length})</label>
            <div class="btn-group btn-group-sm">
              <button type="button" class="btn btn-outline-success" data-cell-attendance-check-all="1"><i class="bi bi-check-all me-1"></i>Marcar Todos</button>
              <button type="button" class="btn btn-outline-secondary" data-cell-attendance-check-all="0"><i class="bi bi-x-lg me-1"></i>Desmarcar</button>
            </div>
          </div>
          <div class="table-responsive border rounded p-2" style="max-height: 220px; overflow-y: auto; background: rgba(15, 23, 42, 0.45);">
            <table class="table table-sm text-light mb-0 align-middle">
              <thead>
                <tr>
                  <th style="width: 45px;">Presença</th>
                  <th>Nome do Membro</th>
                  <th>Telefone</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                \${members.map((m) => \`
                  <tr>
                    <td>
                      <input type="checkbox" class="form-check-input" data-attendance-member-check="\${escapeAttr(m.id)}" style="width: 1.25rem; height: 1.25rem; cursor: pointer;">
                    </td>
                    <td><strong>\${escapeAttr(m.name || "—")}</strong></td>
                    <td>\${escapeAttr(m.phone || "—")}</td>
                    <td>\${badge(m.status || "Activo")}</td>
                  </tr>
                \`).join("") || \`<tr><td colspan="4" class="text-secondary text-center">Nenhum membro oficial registado na célula.</td></tr>\`}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Register New Visitor / First Timer Section -->
        <div class="col-12 mt-3">
          <div class="p-3 rounded" style="background: rgba(15, 23, 42, 0.65); border: 1px solid rgba(234, 179, 8, 0.35);">
            <h5 class="fs-6 text-warning mb-2"><i class="bi bi-person-plus-fill me-1"></i>Registar Novo Membro ou First Timer (Primeira Vez)</h5>
            <div class="row g-2 align-items-end mb-2">
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
            <div id="cellAttendanceVisitorsList" class="table-responsive" style="display: none;">
              <table class="table table-sm text-light mb-0">
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
        </div>

        <!-- Counters for FT & NC -->
        <div class="col-md-6 mt-3">
          <label class="form-label text-warning fw-bold"><i class="bi bi-person-heart me-1"></i>Total First Timers (FT)</label>
          <div class="input-group">
            <button class="btn btn-outline-secondary" type="button" data-step-counter="ftCount" data-step-delta="-1">-</button>
            <input type="number" min="0" class="form-control text-center fw-bold fs-5 text-warning" name="ftCount" value="0" data-attendance-field="ftCount">
            <button class="btn btn-outline-secondary" type="button" data-step-counter="ftCount" data-step-delta="1">+</button>
          </div>
          <small class="text-secondary">Pessoas que vieram pela 1ª vez</small>
        </div>
        <div class="col-md-6 mt-3">
          <label class="form-label text-success fw-bold"><i class="bi bi-stars me-1"></i>Total Novos Convertidos (NC)</label>
          <div class="input-group">
            <button class="btn btn-outline-secondary" type="button" data-step-counter="ncCount" data-step-delta="-1">-</button>
            <input type="number" min="0" class="form-control text-center fw-bold fs-5 text-success" name="ncCount" value="0" data-attendance-field="ncCount">
            <button class="btn btn-outline-secondary" type="button" data-step-counter="ncCount" data-step-delta="1">+</button>
          </div>
          <small class="text-secondary">Entregaram a vida a Cristo</small>
        </div>
        <div class="col-12 mt-3">
          <label class="form-label"><i class="bi bi-chat-left-text me-1"></i>Observações / Testemunhos do Culto</label>
          <textarea class="form-control" name="attendanceNotes" rows="2" placeholder="Notas sobre a reunião ou culto..." data-attendance-field="attendanceNotes"></textarea>
        </div>
      \`;
    }

    const submitButton = byId("entryForm")?.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.innerHTML = '<i class="bi bi-cloud-arrow-up-fill me-1"></i>Guardar Presenças & Sincronizar';
      submitButton.className = "btn btn-ce-gold btn-touch";
      submitButton.classList.remove("d-none");
    }

    const modalEl = byId("entryModal");
    if (modalEl) {
      const bs = window.bootstrap || (typeof bootstrap !== "undefined" ? bootstrap : null);
      if (bs && bs.Modal) {
        const instance = bs.Modal.getOrCreateInstance(modalEl);
        instance.show();
      }
    }
  } catch (err) {
    console.error("[CE Dashboard] openCellAttendanceModal error:", err);
  }
}
if (typeof window !== "undefined") window.openCellAttendanceModal = openCellAttendanceModal;`;

if (oldOpenFuncRegex.test(code)) {
  code = code.replace(oldOpenFuncRegex, newOpenFunc);
  console.log("Replaced openCellAttendanceModal with robust version!");
}

// 3. Update entryForm submit handler to include modalType === "cellAttendance"
const oldSubmitHandler = `  if (modalType === "memberCandidate") return submitMemberCandidateForm(event.target);
  if (modalType) submitForm(event.target);`;

const newSubmitHandler = `  if (modalType === "memberCandidate") return submitMemberCandidateForm(event.target);
  if (modalType === "cellAttendance") return submitCellAttendanceModal(event.target);
  if (modalType) submitForm(event.target);`;

if (code.includes(oldSubmitHandler)) {
  code = code.replace(oldSubmitHandler, newSubmitHandler);
  console.log("Added modalType === 'cellAttendance' to entryForm submit handler!");
}

// 4. Update the button in renderCellLeaderPortal to include onclick fallback
const oldButtonHtml = `<button type="button" class="btn btn-ce-gold btn-lg btn-touch shadow" data-open-cell-attendance-modal>`;
const newButtonHtml = `<button type="button" class="btn btn-ce-gold btn-lg btn-touch shadow" data-open-cell-attendance-modal onclick="window.openCellAttendanceModal &amp;&amp; window.openCellAttendanceModal(); return false;">`;

if (code.includes(oldButtonHtml)) {
  code = code.replace(oldButtonHtml, newButtonHtml);
  console.log("Added onclick attribute to Registar Presencas button!");
}

// 5. Expose submitCellAttendanceModal on window
if (!code.includes("window.submitCellAttendanceModal = submitCellAttendanceModal;")) {
  code = code.replace("async function submitCellAttendanceModal(form) {", "async function submitCellAttendanceModal(form) {\n  if (typeof window !== 'undefined') window.submitCellAttendanceModal = submitCellAttendanceModal;");
}

fs.writeFileSync(DASHBOARD_PATH, code, "utf8");
console.log("Successfully updated dashboard.js with complete cell attendance modal fixes!");
