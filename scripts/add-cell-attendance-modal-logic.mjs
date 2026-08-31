import fs from "node:fs";

const DASHBOARD_PATH = "js/dashboard.js";
let code = fs.readFileSync(DASHBOARD_PATH, "utf8");

// 1. Add openCellAttendanceModal and submitCellAttendanceModal functions
const modalFunctionsCode = `
function openCellAttendanceModal() {
  const context = getCellLeaderContext(activeUser?.id, cellPortalPageState.cellId);
  const cellId = context?.cell_id || (getAuthorizedCellsForUser(activeUser?.id)[0]?.id) || "cell-1";
  const members = getCellMembersProfile(cellId, {}) || [];
  currentSessionVisitors = [];
  modalType = "cellAttendance";

  byId("modalEyebrow").textContent = "Portal de Célula • " + (context?.cell_name || "Célula");
  byId("modalTitle").innerHTML = '<i class="bi bi-calendar-check-fill text-warning me-2"></i>Registo de Presenças & Visitantes da Célula';

  const todayStr = new Date().toISOString().slice(0, 10);
  const reportWeekStr = \`\${new Date().toLocaleString(lang === "pt" ? "pt-PT" : "en-US", { month: "long" })} Semana \${Math.ceil(new Date().getDate() / 7)}\`;

  byId("modalFields").innerHTML = \`
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

  const submitButton = byId("entryForm")?.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.innerHTML = '<i class="bi bi-cloud-arrow-up-fill me-1"></i>Guardar Presenças & Sincronizar';
    submitButton.className = "btn btn-ce-gold btn-touch";
  }

  bootstrap.Modal.getOrCreateInstance(byId("entryModal")).show();
}

async function submitCellAttendanceModal(form) {
  const context = getCellLeaderContext(activeUser?.id, cellPortalPageState.cellId);
  const cellId = context?.cell_id || (getAuthorizedCellsForUser(activeUser?.id)[0]?.id) || "cell-1";
  const cell = findCellSafe(cellId) || (getAuthorizedCellsForUser(activeUser?.id)[0]) || {};
  const churchId = cell.church_id || activeUser?.church_id || "church-hq";

  const serviceType = form.querySelector('[data-attendance-field="serviceType"]')?.value || "Domingo";
  const serviceDate = form.querySelector('[data-attendance-field="serviceDate"]')?.value || new Date().toISOString().slice(0, 10);
  const reportWeek = form.querySelector('[data-attendance-field="reportWeek"]')?.value || "Semana 1";
  const ftCount = Number(form.querySelector('[data-attendance-field="ftCount"]')?.value || 0);
  const ncCount = Number(form.querySelector('[data-attendance-field="ncCount"]')?.value || 0);
  const notes = form.querySelector('[data-attendance-field="attendanceNotes"]')?.value || "";

  if (!state.cellLeadership) state.cellLeadership = { ...seedData.cellLeadership };
  if (!Array.isArray(state.cellLeadership.cellVisitors)) state.cellLeadership.cellVisitors = [];
  if (!Array.isArray(state.cellLeadership.cellReports)) state.cellLeadership.cellReports = [];
  if (!Array.isArray(state.firstTimers)) state.firstTimers = [];

  const promotedNames = [];

  // Register dynamic visitors and apply 3-attendance rule
  if (currentSessionVisitors && currentSessionVisitors.length) {
    currentSessionVisitors.forEach((v) => {
      const parts = v.name.split(" ");
      const firstName = parts[0] || v.name;
      const lastName = parts.slice(1).join(" ") || "";

      // Add to state.firstTimers
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

      // Track cell visitor attendances
      const cleanPhone = String(v.phone || "").replace(/\\D/g, "");
      let cellVisitor = state.cellLeadership.cellVisitors.find((item) => {
        if (String(item.cell_id) !== String(cellId)) return false;
        const itemPhone = String(item.phone || "").replace(/\\D/g, "");
        if (cleanPhone && itemPhone && cleanPhone === itemPhone) return true;
        return item.name.toLowerCase().trim() === v.name.toLowerCase().trim();
      });

      if (cellVisitor) {
        if (!Array.isArray(cellVisitor.attended_dates)) cellVisitor.attended_dates = [];
        if (!cellVisitor.attended_dates.includes(serviceDate)) {
          cellVisitor.attended_dates.push(serviceDate);
          cellVisitor.attendance_count = (Number(cellVisitor.attendance_count) || 1) + 1;
        }
        cellVisitor.last_attended_at = serviceDate;
      } else {
        cellVisitor = {
          id: typeof generateUuid === "function" ? generateUuid() : "cv-" + Date.now(),
          cell_id: cellId,
          cell_name: cell.cell_name || cell.name || context?.cell_name || "Célula",
          church_id: churchId,
          name: v.name,
          phone: v.phone || "",
          type: v.type || "FT",
          attendance_count: 1,
          attended_dates: [serviceDate],
          first_attended_at: serviceDate,
          last_attended_at: serviceDate,
          promoted_to_member: false,
          status: "Visitante (1/3 Cultos)",
          created_at: serviceDate,
          updated_at: serviceDate
        };
        state.cellLeadership.cellVisitors.unshift(cellVisitor);
      }

      // Check 3-attendance rule for promotion to official member
      if (Number(cellVisitor.attendance_count) >= 3 && !cellVisitor.promoted_to_member) {
        const memberId = typeof generateUuid === "function" ? generateUuid() : "m-" + Date.now();
        const existingMember = (state.members || []).find((m) => {
          const mPhone = String(m.telefone || m.phone || "").replace(/\\D/g, "");
          if (cleanPhone && mPhone && cleanPhone === mPhone) return true;
          return String(m.full_name || m.nome || "").toLowerCase().trim() === v.name.toLowerCase().trim();
        });

        if (!existingMember) {
          const newOfficialMember = {
            id: memberId,
            first_name: firstName,
            last_name: lastName,
            nome: v.name,
            full_name: v.name,
            telefone: v.phone || "",
            phone: v.phone || "",
            celula: cell.cell_name || cell.name || context?.cell_name || "Célula",
            cell_id: cellId,
            cell_name: cell.cell_name || cell.name || context?.cell_name || "Célula",
            grupo_de_celula: cell.group_name || context?.cell_group_name || "",
            church_id: churchId,
            church_name: context?.church_name || "Christ Embassy",
            estado: "Activo",
            status: "Activo",
            reconciliation_status: "Confirmed",
            joined_at: serviceDate,
            promoted_from_visitor: true,
            promoted_after_3_attendances: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          state.members = state.members || [];
          state.members.unshift(newOfficialMember);

          if (usesSupabaseMembers()) {
            const repo = getMembersRepoSafe();
            if (repo?.createMember) void repo.createMember(newOfficialMember);
          }
        }
        cellVisitor.promoted_to_member = true;
        cellVisitor.status = "Promovido a Membro Oficial";
        promotedNames.push(v.name);
      }
    });
  }

  const checkedBoxes = Array.from(form.querySelectorAll("[data-attendance-member-check]:checked"));
  const checkedMemberIds = checkedBoxes.map((cb) => cb.dataset.attendanceMemberCheck);
  const membersPresentCount = checkedMemberIds.length;
  const totalAtt = membersPresentCount + ftCount;

  // Find or create cell report
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
      observacoes: notes,
      submetido_por: activeUser?.name || "Líder de Célula",
      submitted_by_user_id: activeUser?.id,
      created_at: new Date().toISOString().slice(0, 10),
      updated_at: new Date().toISOString().slice(0, 10),
      estado: "Submetido"
    };
    state.cellLeadership.cellReports.unshift(cellReport);
  }

  // Consolidate to Church Reports
  consolidateCellReportToChurchReport(cellReport);

  saveState("Cell attendance recorded");
  bootstrap.Modal.getInstance(byId("entryModal"))?.hide();

  let successMsg = \`Presenças da célula guardadas com sucesso! (\${membersPresentCount} membros + \${ftCount} FT = \${totalAtt} presentes). Os dados foram consolidados no Relatório Geral da Igreja.\`;
  if (promotedNames.length) {
    successMsg += \`\\n\\n🎉 Parabéns! \${promotedNames.join(", ")} completou 3 cultos e foi promovido(a) a Membro Oficial da Célula!\`;
  }
  alert(successMsg);

  if (activeRoute === "cellPortal") {
    renderCellLeaderPortal();
  }
}
`;

// Insert modalFunctionsCode before openMemberCandidateForm
code = code.replace(
  /function openMemberCandidateForm\(id = null\) \{/,
  modalFunctionsCode + "\nfunction openMemberCandidateForm(id = null) {"
);

// 2. Wire entryForm submit event
const oldEntryFormSubmit = `  if (modalType === "cellMemberRemoval") return submitCellMemberRemovalForm(event.target);
  if (modalType === "followup") return submitFollowup(event.target);`;

const newEntryFormSubmit = `  if (modalType === "cellMemberRemoval") return submitCellMemberRemovalForm(event.target);
  if (modalType === "cellAttendance") return submitCellAttendanceModal(event.target);
  if (modalType === "followup") return submitFollowup(event.target);`;

if (code.includes(oldEntryFormSubmit)) {
  code = code.replace(oldEntryFormSubmit, newEntryFormSubmit);
}

// 3. Wire data-open-cell-attendance-modal click event
const oldClickListeners = `  if (event.target.closest("[data-open-member-candidate]")) return openMemberCandidateForm();`;
const newClickListeners = `  if (event.target.closest("[data-open-cell-attendance-modal]")) return openCellAttendanceModal();
  if (event.target.closest("[data-open-member-candidate]")) return openMemberCandidateForm();`;

if (code.includes(oldClickListeners)) {
  code = code.replace(oldClickListeners, newClickListeners);
}

fs.writeFileSync(DASHBOARD_PATH, code, "utf8");
console.log("Successfully added openCellAttendanceModal and submitCellAttendanceModal to dashboard.js!");
