import fs from "node:fs";

const DASHBOARD_PATH = "js/dashboard.js";
let code = fs.readFileSync(DASHBOARD_PATH, "utf8");

// 1. Update filter visibility in renderCellLeaderPortal
const oldCanChooseCell = `    const canChooseCell = ["Cell Ministry Reviewer", "Cell Ministry Head", "Super Admin", "Main Pastor", "National Admin"].includes(activeUser?.role) || (activeUser?.can_view_all_churches) || authorizedCells.length > 1;`;

const newCanChooseCell = `    const isGroupLeaderOrAbove = [
      "Cell Group Leader", "cell_group_leader", "Cell Ministry Reviewer", "Cell Ministry Head",
      "Cell Coordinator", "cell_coordinator", "Church Admin", "Super Admin", "super_admin", "Main Pastor", "National Admin"
    ].includes(activeUser?.role) || (activeUser?.can_view_all_churches);

    const isSpecificSingleCellLeader = (activeUser?.auth_user_id === "47df0cce-9701-492c-90aa-b3cb205bbd4b") ||
      (activeUser?.id === "47df0cce-9701-492c-90aa-b3cb205bbd4b") ||
      ["Cell Leader", "Cell Assistant", "cell_leader", "assistant_cell_leader", "cell_assistant"].includes(activeUser?.role);

    const showCellGroupSelectors = isGroupLeaderOrAbove && !isSpecificSingleCellLeader;
    const canChooseCell = showCellGroupSelectors && authorizedCells.length > 1;`;

if (code.includes(oldCanChooseCell)) {
  code = code.replace(oldCanChooseCell, newCanChooseCell);
}

// 2. Hide group and cell select dropdowns if showCellGroupSelectors is false
const oldFilterGroupSelectors = `        <label>Grupo de Célula<select class="form-select" data-cell-portal-filter="cellGroupId"><option value="">Todos os Grupos</option>\${safeCellGroups.map((g) => \`<option value="\${escapeAttr(g.id)}" \${String(g.id) === String(cellPortalPageState.cellGroupId || "") ? "selected" : ""}>\${escapeAttr(g.group_name || g.name || "Grupo")}</option>\`).join("")}</select></label>
        <label>Célula<select class="form-select" data-cell-portal-filter="cellId"><option value="">Todas as Células</option>\${safeCellRegistry.map((c) => \`<option value="\${escapeAttr(c.id)}" \${String(c.id) === String(cellPortalPageState.cellId || "") ? "selected" : ""}>\${escapeAttr(c.cell_name || c.name || "Célula")}</option>\`).join("")}</select></label>`;

const newFilterGroupSelectors = `        \${showCellGroupSelectors ? \`
        <label>Grupo de Célula<select class="form-select" data-cell-portal-filter="cellGroupId"><option value="">Todos os Grupos</option>\${safeCellGroups.map((g) => \`<option value="\${escapeAttr(g.id)}" \${String(g.id) === String(cellPortalPageState.cellGroupId || "") ? "selected" : ""}>\${escapeAttr(g.group_name || g.name || "Grupo")}</option>\`).join("")}</select></label>
        <label>Célula<select class="form-select" data-cell-portal-filter="cellId"><option value="">Todas as Células</option>\${safeCellRegistry.map((c) => \`<option value="\${escapeAttr(c.id)}" \${String(c.id) === String(cellPortalPageState.cellId || "") ? "selected" : ""}>\${escapeAttr(c.cell_name || c.name || "Célula")}</option>\`).join("")}</select></label>
        \` : ""}`;

if (code.includes(oldFilterGroupSelectors)) {
  code = code.replace(oldFilterGroupSelectors, newFilterGroupSelectors);
}

// 3. Update #cell-portal-attendance section in renderCellLeaderPortal to show Action Banner + Recent Sessions Table + 3-Service Visitor Tracking
const oldAttendanceSectionRegex = /<section id="cell-portal-attendance" class="cell-portal-section">[\s\S]*?<\/section>/;

const newAttendanceSection = `<section id="cell-portal-attendance" class="cell-portal-section">
        \${cellPortalSectionTitle("bi-calendar-check-fill", "Registo de Presenças & Visitantes da Célula", "Registe as presenças dos membros e novos visitantes por culto. As presenças serão consolidadas automaticamente no relatório geral da Igreja.")}
        
        <!-- Action Banner to Open Modal -->
        <div class="panel glass-panel mb-4 p-4 d-flex flex-wrap justify-content-between align-items-center gap-3" style="background: linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 41, 59, 0.7) 100%); border: 1px solid rgba(234, 179, 8, 0.35); border-radius: 12px;">
          <div>
            <h4 class="fs-5 text-light mb-1"><i class="bi bi-clipboard2-check-fill text-warning me-2"></i>Lançamento de Presenças por Culto</h4>
            <p class="text-secondary small mb-0">Abra o formulário para marcar presenças e adicionar novos visitantes. <strong>Regra:</strong> Visitantes com 3 presenças viram automaticamente membros oficiais.</p>
          </div>
          <button type="button" class="btn btn-ce-gold btn-lg btn-touch shadow" data-open-cell-attendance-modal>
            <i class="bi bi-plus-circle-fill me-2"></i>Registar Presenças
          </button>
        </div>

        <!-- Recent Cell Attendance Reports -->
        <div class="panel glass-panel mb-4">
          <div class="panel-head mb-3">
            <h4 class="panel-title fs-6 text-warning mb-0"><i class="bi bi-clock-history me-2"></i>Histórico de Presenças Lançadas</h4>
          </div>
          \${(() => {
            const cellReports = (state.cellLeadership?.cellReports || []).filter((r) => String(r.cell_id) === String(context?.cell_id));
            if (!cellReports.length) {
              return EmptyState({ compact: true, title: "Sem presenças registadas", description: "Clique em 'Registar Presenças' para lançar as presenças do último culto." });
            }
            return \`
              <div class="table-responsive">
                <table class="table cell-portal-table mb-0">
                  <thead>
                    <tr>
                      <th>Culto / Serviço</th>
                      <th>Data</th>
                      <th>Semana</th>
                      <th>Membros</th>
                      <th>First Timers (FT)</th>
                      <th>Novos Convertidos (NC)</th>
                      <th>Total Presentes</th>
                      <th>Submetido por</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    \${cellReports.map((r) => \`
                      <tr>
                        <td><strong>\${escapeAttr(r.culto || "Domingo")}</strong></td>
                        <td>\${escapeAttr(r.data_do_culto || r.data_inicio || "—")}</td>
                        <td>\${escapeAttr(r.semana || "—")}</td>
                        <td><span class="badge bg-info text-dark">\${escapeAttr(r.members_present_count || (r.members_present_ids || []).length || 0)}</span></td>
                        <td><span class="badge bg-warning text-dark">\${escapeAttr(r.ft || 0)}</span></td>
                        <td><span class="badge bg-success">\${escapeAttr(r.nc || 0)}</span></td>
                        <td><strong>\${escapeAttr(r.att || 0)}</strong></td>
                        <td><small class="text-secondary">\${escapeAttr(r.submetido_por || r.nome_do_lider || "—")}</small></td>
                        <td>\${badge(r.estado || "Submetido")}</td>
                      </tr>
                    \`).join("")}
                  </tbody>
                </table>
              </div>
            \`;
          })()}
        </div>

        <!-- 3-Attendance Visitor Tracking Table -->
        <div class="panel glass-panel mb-4">
          <div class="panel-head mb-3">
            <div>
              <h4 class="panel-title fs-6 text-info mb-1"><i class="bi bi-person-lines-fill me-2"></i>Acompanhamento de Novos Visitantes (Regra de 3 Cultos)</h4>
              <p class="text-secondary small mb-0">Visitantes em acompanhamento tornam-se membros oficiais da célula após completarem 3 cultos/reuniões.</p>
            </div>
          </div>
          \${(() => {
            const cellVisitors = (state.cellLeadership?.cellVisitors || []).filter((v) => String(v.cell_id) === String(context?.cell_id));
            if (!cellVisitors.length) {
              return \`<p class="text-secondary small mb-0 p-3">Nenhum visitante registado recentemente nesta célula.</p>\`;
            }
            return \`
              <div class="table-responsive">
                <table class="table cell-portal-table mb-0">
                  <thead>
                    <tr>
                      <th>Nome do Visitante</th>
                      <th>Telefone</th>
                      <th>Tipo</th>
                      <th>Cultos Assistidos</th>
                      <th>Progresso para Membro Oficial</th>
                      <th>Último Culto</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    \${cellVisitors.map((v) => {
                      const count = Number(v.attendance_count || 1);
                      const isPromoted = count >= 3 || v.promoted_to_member;
                      const progressPct = Math.min(100, Math.round((count / 3) * 100));
                      return \`
                        <tr>
                          <td><strong>\${escapeAttr(v.name || "—")}</strong></td>
                          <td>\${escapeAttr(v.phone || "—")}</td>
                          <td>
                            \${v.type === "FT" ? '<span class="badge bg-warning text-dark">FT</span>' : ""}
                            \${v.type === "NC" ? '<span class="badge bg-success">NC</span>' : ""}
                            \${v.type === "FT_NC" ? '<span class="badge bg-warning text-dark me-1">FT</span><span class="badge bg-success">NC</span>' : ""}
                          </td>
                          <td><strong>\${count} / 3</strong></td>
                          <td style="min-width: 140px;">
                            <div class="progress" style="height: 8px;">
                              <div class="progress-bar \${isPromoted ? "bg-success" : "bg-warning"}" role="progressbar" style="width: \${progressPct}%;"></div>
                            </div>
                            <small class="text-secondary">\${isPromoted ? "Promovido a Membro Oficial" : \`Falta(m) \${3 - count} culto(s)\`}</small>
                          </td>
                          <td><small>\${escapeAttr(v.last_attended_at || v.first_attended_at || "—")}</small></td>
                          <td>\${isPromoted ? '<span class="badge bg-success"><i class="bi bi-check-circle me-1"></i>Membro Oficial</span>' : '<span class="badge bg-warning text-dark"><i class="bi bi-hourglass-split me-1"></i>Em Acompanhamento</span>'}</td>
                        </tr>
                      \`;
                    }).join("")}
                  </tbody>
                </table>
              </div>
            \`;
          })()}
        </div>
      </section>`;

if (oldAttendanceSectionRegex.test(code)) {
  code = code.replace(oldAttendanceSectionRegex, newAttendanceSection);
}

fs.writeFileSync(DASHBOARD_PATH, code, "utf8");
console.log("Updated Portal do Líder de Célula layout and attendance section!");
