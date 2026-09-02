import fs from "node:fs";

let dashCode = fs.readFileSync("js/dashboard.js", "utf8");
dashCode = dashCode.replace(/\r\n/g, "\n");

// 1. In renderUsers: add delete action button
const oldUserActions = `actionButtons([["view", "user", u.id, L("view")], ["edit", "user", u.id, L("edit")]])`;
const newUserActions = `actionButtons([["view", "user", u.id, L("view")], ["edit", "user", u.id, L("edit")], ["delete", "user", u.id, L("delete")]])`;

if (dashCode.includes(oldUserActions)) {
  dashCode = dashCode.replace(oldUserActions, newUserActions);
  console.log("Added delete action button to renderUsers");
} else {
  console.warn("oldUserActions not found!");
}

// 2. Add renderUserForm, mountUserFormControls, saveUserToSupabase, deleteUserFromSupabase functions
const userFormFunctions = `
function renderUserForm(record = {}, modalMode = "create") {
  const isEdit = modalMode === "edit";
  const name = record.name || record.full_name || "";
  const email = record.email || "";
  const currentRole = record.role || record.role_name || "Cell Leader";
  const churchId = record.church_id || record.churchId || activeUser?.church_id || "a1111111-1111-4111-8111-111111111101";
  const cellGroupId = record.cell_group_id || record.groupId || "";
  const cellId = record.cell_id || record.cellId || "";
  const status = record.status || "Active";
  const cannotCreateClasses = Boolean(record.cannot_create_classes);
  const canViewAllChurches = Boolean(record.can_view_all_churches);

  const rawDept = record.department_permissions;
  const deptPerms = new Set(Array.isArray(rawDept) ? rawDept : String(rawDept || "").split(",").map((s) => s.trim()).filter(Boolean));

  // Real 18 groups from Supabase/Seed
  const allGroups = [...(window.REAL_CELL_GROUPS || []), ...(state.cellGroups || [])];
  const groups = allGroups
    .filter((g, idx, arr) => g && g.id && arr.findIndex((x) => String(x.id) === String(g.id) || x.group_name === g.group_name) === idx)
    .sort((a, b) => String(a.group_name || "").localeCompare(String(b.group_name || "")));

  // Real Cells from Supabase/Seed
  const allCells = [...(window.REAL_CELLS_REGISTRY || []), ...(state.cellRegistry || state.cells || [])]
    .filter((c, idx, arr) => c && c.id && arr.findIndex((x) => String(x.id) === String(c.id)) === idx);
  
  const cells = allCells
    .filter((c) => !cellGroupId || String(c.group_id) === String(cellGroupId) || String(c.cell_group_id) === String(cellGroupId))
    .sort((a, b) => String(a.cell_name || "").localeCompare(String(b.cell_name || "")));

  const hasAllSubcells = Array.isArray(record.assigned_cells) && record.assigned_cells.length > 1;

  const roles = [
    { value: "Super Admin", label: "Super Admin (Acesso Total ao Sistema)" },
    { value: "Main Pastor", label: "Pastor Principal" },
    { value: "National Admin", label: "Administrador Nacional" },
    { value: "Church Pastor", label: "Pastor da Igreja" },
    { value: "Church Admin", label: "Administrador da Igreja" },
    { value: "Cell Group Leader", label: "Líder de Grupo de Células" },
    { value: "Cell Leader", label: "Líder de Célula" },
    { value: "Cell Assistant", label: "Assistente de Célula" },
    { value: "Cell Ministry Head", label: "Responsável do Ministério de Células" },
    { value: "Follow-Up Coordinator", label: "Coordenador de Acompanhamento (Follow-Up)" },
    { value: "Foundation Teacher", label: "Professor da Escola de Fundação" },
    { value: "Foundation Rector", label: "Reitor da Escola de Fundação" },
    { value: "Venue Manager", label: "Gestor de Património & Instalações (Venue)" },
    { value: "Finance Head", label: "Responsável de Finanças" },
    { value: "Finance Officer", label: "Oficial de Finanças" },
    { value: "Counselor", label: "Conselheiro Pastoral" },
    { value: "HR Manager", label: "Gestor de Recursos Humanos (RH)" },
    { value: "Media Director", label: "Director de Mídia & Transmissão" },
    { value: "Requisition Officer", label: "Oficial de Requisições" },
    { value: "Staff Member", label: "Membro de Staff" },
    { value: "Viewer", label: "Visualizador (Apenas Leitura)" }
  ];

  const churches = typeof relationalChurches === "function" ? relationalChurches() : (state.churches || []);

  return \`
    <div class="row g-3">
      <div class="col-md-6">
        <label class="form-label">Nome Completo *</label>
        <input name="name" type="text" class="form-control" value="\${escapeAttr(name)}" required placeholder="Ex: Filipe Chamango">
      </div>
      <div class="col-md-6">
        <label class="form-label">E-mail *</label>
        <input name="email" type="email" class="form-control" value="\${escapeAttr(email)}" required placeholder="utilizador@embaixadadecristo.org">
      </div>

      <div class="col-md-6">
        <label class="form-label">Função Principal (Cargo Base) *</label>
        <select name="role" class="form-select" id="userFormRoleSelect" required>
          \${roles.map((r) => \`<option value="\${escapeAttr(r.value)}" \${String(currentRole).toLowerCase() === r.value.toLowerCase() ? "selected" : ""}>\${escapeAttr(r.label)}</option>\`).join("")}
        </select>
      </div>
      <div class="col-md-6">
        <label class="form-label">Igreja *</label>
        <select name="church_id" class="form-select" id="userFormChurchSelect" required>
          \${churches.map((c) => \`<option value="\${escapeAttr(c.id)}" \${String(c.id) === String(churchId) ? "selected" : ""}>\${escapeAttr(c.public_name || c.church_name || "Igreja")}</option>\`).join("")}
        </select>
      </div>

      <!-- Cell Group & Cell dynamic selection -->
      <div class="col-md-6">
        <label class="form-label">Grupo de Célula</label>
        <select name="cell_group_id" class="form-select" id="userFormCellGroupSelect">
          <option value="">Nenhum / Não aplicável</option>
          \${groups.map((g) => \`<option value="\${escapeAttr(g.id)}" \${String(g.id) === String(cellGroupId) || g.group_name === cellGroupId ? "selected" : ""}>\${escapeAttr(g.group_name || g.name)}</option>\`).join("")}
        </select>
        <small class="text-secondary">Selecione para carregar as células em tempo real</small>
      </div>
      <div class="col-md-6">
        <label class="form-label">Célula Principal</label>
        <select name="cell_id" class="form-select" id="userFormCellSelect">
          <option value="">Nenhuma / Todas as células do grupo</option>
          \${cells.map((c) => \`<option value="\${escapeAttr(c.id)}" \${String(c.id) === String(cellId) || c.cell_name === cellId ? "selected" : ""}>\${escapeAttr(c.cell_name)}</option>\`).join("")}
        </select>
      </div>

      <div class="col-12">
        <div class="form-check p-2 rounded" style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);">
          <input name="assign_all_subcells" class="form-check-input ms-1" type="checkbox" id="userFormAllSubcells" \${hasAllSubcells || (!cellId && cellGroupId) ? "checked" : ""}>
          <label class="form-check-label ms-2" for="userFormAllSubcells">
            <strong>Permitir acesso de gestão a todas as sub-células deste grupo</strong>
            <div class="small text-secondary">Permite ao utilizador visualizar, alternar e gerir relatórios e membros de todas as 10 células do grupo (ex.: Diamantes Main)</div>
          </label>
        </div>
      </div>

      <!-- Multi-Department Permissions -->
      <div class="col-12">
        <label class="form-label d-flex justify-content-between align-items-center">
          <span><strong>Múltiplas Funções & Permissões por Departamento</strong></span>
          <span class="badge bg-secondary">Atribua múltiplos acessos</span>
        </label>
        <div class="p-3 rounded" style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(148, 163, 184, 0.2);">
          <div class="row g-2">
            <div class="col-sm-6 col-lg-4">
              <label class="form-check">
                <input type="checkbox" name="dept_perm" value="cellReports" class="form-check-input" \${deptPerms.has("cellReports") || deptPerms.has("*") ? "checked" : ""}>
                <span class="form-check-label"><i class="bi bi-diagram-3 me-1 text-info"></i> Portal & Relatórios de Células</span>
              </label>
            </div>
            <div class="col-sm-6 col-lg-4">
              <label class="form-check">
                <input type="checkbox" name="dept_perm" value="followUp" class="form-check-input" \${deptPerms.has("followUp") || deptPerms.has("*") ? "checked" : ""}>
                <span class="form-check-label"><i class="bi bi-telephone-outbound me-1 text-primary"></i> Acompanhamento (Follow-Up)</span>
              </label>
            </div>
            <div class="col-sm-6 col-lg-4">
              <label class="form-check">
                <input type="checkbox" name="dept_perm" value="foundation" class="form-check-input" \${deptPerms.has("foundation") || deptPerms.has("*") ? "checked" : ""}>
                <span class="form-check-label"><i class="bi bi-mortarboard me-1 text-success"></i> Escola de Fundação (Geral)</span>
              </label>
            </div>
            <div class="col-sm-6 col-lg-4">
              <label class="form-check">
                <input type="checkbox" name="dept_perm" value="foundation_teacher" class="form-check-input" \${deptPerms.has("foundation_teacher") || deptPerms.has("*") ? "checked" : ""}>
                <span class="form-check-label"><i class="bi bi-person-video3 me-1 text-success"></i> Professor de Fundação (Presenças/Testes)</span>
              </label>
            </div>
            <div class="col-sm-6 col-lg-4">
              <label class="form-check">
                <input type="checkbox" name="dept_perm" value="reports" class="form-check-input" \${deptPerms.has("reports") || deptPerms.has("*") ? "checked" : ""}>
                <span class="form-check-label"><i class="bi bi-graph-up-arrow me-1 text-warning"></i> Relatórios & Indicadores</span>
              </label>
            </div>
            <div class="col-sm-6 col-lg-4">
              <label class="form-check">
                <input type="checkbox" name="dept_perm" value="venueInventory" class="form-check-input" \${deptPerms.has("venueInventory") || deptPerms.has("*") ? "checked" : ""}>
                <span class="form-check-label"><i class="bi bi-building me-1 text-cyan"></i> Património & Instalações (Venue)</span>
              </label>
            </div>
            <div class="col-sm-6 col-lg-4">
              <label class="form-check">
                <input type="checkbox" name="dept_perm" value="finance" class="form-check-input" \${deptPerms.has("finance") || deptPerms.has("*") ? "checked" : ""}>
                <span class="form-check-label"><i class="bi bi-cash-stack me-1 text-warning"></i> Finanças & Tesouraria</span>
              </label>
            </div>
            <div class="col-sm-6 col-lg-4">
              <label class="form-check">
                <input type="checkbox" name="dept_perm" value="counseling" class="form-check-input" \${deptPerms.has("counseling") || deptPerms.has("*") ? "checked" : ""}>
                <span class="form-check-label"><i class="bi bi-chat-heart me-1 text-danger"></i> Aconselhamento Pastoral</span>
              </label>
            </div>
            <div class="col-sm-6 col-lg-4">
              <label class="form-check">
                <input type="checkbox" name="dept_perm" value="sacraments" class="form-check-input" \${deptPerms.has("sacraments") || deptPerms.has("*") ? "checked" : ""}>
                <span class="form-check-label"><i class="bi bi-droplet me-1 text-info"></i> Sacramentos</span>
              </label>
            </div>
            <div class="col-sm-6 col-lg-4">
              <label class="form-check">
                <input type="checkbox" name="dept_perm" value="media" class="form-check-input" \${deptPerms.has("media") || deptPerms.has("*") ? "checked" : ""}>
                <span class="form-check-label"><i class="bi bi-camera-video me-1 text-secondary"></i> Mídia & Transmissão</span>
              </label>
            </div>
            <div class="col-sm-6 col-lg-4">
              <label class="form-check">
                <input type="checkbox" name="dept_perm" value="staffHr" class="form-check-input" \${deptPerms.has("staffHr") || deptPerms.has("*") ? "checked" : ""}>
                <span class="form-check-label"><i class="bi bi-people me-1 text-light"></i> Recursos Humanos & Staff</span>
              </label>
            </div>
            <div class="col-sm-6 col-lg-4">
              <label class="form-check">
                <input type="checkbox" name="dept_perm" value="requisitions" class="form-check-input" \${deptPerms.has("requisitions") || deptPerms.has("*") ? "checked" : ""}>
                <span class="form-check-label"><i class="bi bi-cart-check me-1 text-primary"></i> Requisições & Compras</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Advanced options -->
      <div class="col-md-6">
        <label class="form-label">Estado da Conta</label>
        <select name="status" class="form-select">
          <option value="Active" \${status === "Active" ? "selected" : ""}>Activo</option>
          <option value="Pending Auth Setup" \${status === "Pending Auth Setup" ? "selected" : ""}>Pendente Configuração Auth</option>
          <option value="Suspended" \${status === "Suspended" ? "selected" : ""}>Suspenso</option>
          <option value="Inactive" \${status === "Inactive" ? "selected" : ""}>Inactivo</option>
        </select>
      </div>
      <div class="col-md-6 d-flex flex-column justify-content-end">
        <label class="form-check mb-2">
          <input name="cannot_create_classes" type="checkbox" class="form-check-input" \${cannotCreateClasses ? "checked" : ""}>
          <span class="form-check-label">Restringir criação de novas turmas na Fundação</span>
        </label>
        <label class="form-check">
          <input name="can_view_all_churches" type="checkbox" class="form-check-input" \${canViewAllChurches ? "checked" : ""}>
          <span class="form-check-label">Acesso de âmbito nacional (todas as igrejas)</span>
        </label>
      </div>
    </div>
  \`;
}

function mountUserFormControls(form) {
  if (!form) return;
  const groupSelect = form.querySelector("#userFormCellGroupSelect");
  const cellSelect = form.querySelector("#userFormCellSelect");
  const roleSelect = form.querySelector("#userFormRoleSelect");

  if (groupSelect && cellSelect) {
    groupSelect.addEventListener("change", () => {
      const selectedGroupId = groupSelect.value;
      const allCells = [...(window.REAL_CELLS_REGISTRY || []), ...(state.cellRegistry || state.cells || [])]
        .filter((c, idx, arr) => c && c.id && arr.findIndex((x) => String(x.id) === String(c.id)) === idx);
      
      const filteredCells = selectedGroupId
        ? allCells.filter((c) => String(c.group_id) === String(selectedGroupId) || String(c.cell_group_id) === String(selectedGroupId))
        : allCells;
      
      cellSelect.innerHTML = '<option value="">Nenhuma / Todas as células do grupo</option>' +
        filteredCells.map((c) => \`<option value="\${escapeAttr(c.id)}">\${escapeAttr(c.cell_name)}</option>\`).join("");
    });
  }

  if (roleSelect) {
    roleSelect.addEventListener("change", () => {
      const role = roleSelect.value;
      const roleDefaults = {
        "Cell Leader": ["cellReports"],
        "Cell Assistant": ["cellReports"],
        "Cell Group Leader": ["cellReports", "reports"],
        "Follow-Up Coordinator": ["followUp", "firstTimers"],
        "Foundation Teacher": ["foundation", "foundation_teacher"],
        "Foundation Rector": ["foundation", "foundation_teacher", "reports"],
        "Venue Manager": ["venueInventory"],
        "Finance Head": ["finance", "reports"],
        "Finance Officer": ["finance"],
        "Counselor": ["counseling", "followUp"],
        "Media Director": ["media"],
        "Super Admin": ["*"],
        "Church Pastor": ["cellReports", "followUp", "foundation", "reports"]
      };
      const defaults = roleDefaults[role];
      if (defaults) {
        form.querySelectorAll('input[name="dept_perm"]').forEach((cb) => {
          if (defaults.includes("*") || defaults.includes(cb.value)) cb.checked = true;
        });
      }
    });
  }
}

async function saveUserToSupabase(user) {
  const sbClient = window.CESupabase?.getSupabaseFoundationClient?.() || window.CESupabase?.getSupabaseAuthClient?.() || (typeof supabase !== "undefined" ? supabase : null);
  if (!sbClient) return false;
  try {
    const payload = {
      id: user.id,
      full_name: user.name || user.full_name,
      email: user.email ? String(user.email).trim().toLowerCase() : null,
      church_id: user.church_id || null,
      cell_group_id: user.cell_group_id || null,
      cell_id: user.cell_id || null,
      assigned_cells: user.assigned_cells || [],
      assigned_cell_groups: user.assigned_cell_groups || [],
      status: user.status || "Active",
      metadata: {
        role_name: user.role || user.role_name,
        display_name: user.name || user.full_name,
        cell_id: user.cell_id || null,
        cell_name: user.cell_name || null,
        cell_group_id: user.cell_group_id || null,
        cell_group_name: user.cell_group_name || null,
        assigned_cells: user.assigned_cells || [],
        assigned_cell_groups: user.assigned_cell_groups || [],
        department_permissions: user.department_permissions || [],
        cannot_create_classes: Boolean(user.cannot_create_classes),
        can_view_all_churches: Boolean(user.can_view_all_churches),
        has_dashboard_access: true
      },
      updated_at: new Date().toISOString()
    };
    if (user.auth_user_id) payload.auth_user_id = user.auth_user_id;

    const res = await sbClient.from("users").upsert(payload, { onConflict: "id" });
    if (res.error) {
      console.warn("[CE Users] Supabase upsert notice:", res.error);
    }
    return true;
  } catch (err) {
    console.warn("[CE Users] saveUserToSupabase skipped", err);
    return false;
  }
}

async function deleteUserFromSupabase(userId, authUserId) {
  const sbClient = window.CESupabase?.getSupabaseFoundationClient?.() || window.CESupabase?.getSupabaseAuthClient?.() || (typeof supabase !== "undefined" ? supabase : null);
  if (!sbClient || !userId) return false;
  try {
    await sbClient.from("users").delete().eq("id", userId);
    if (authUserId && authUserId !== userId) {
      await sbClient.from("users").delete().eq("auth_user_id", authUserId);
    }
    return true;
  } catch (err) {
    console.warn("[CE Users] deleteUserFromSupabase skipped", err);
    return false;
  }
}
`;

// Insert userFormFunctions before openForm
const openFormDef = "function openForm(type, id = null) {";
if (dashCode.includes(openFormDef)) {
  dashCode = dashCode.replace(openFormDef, userFormFunctions + "\n" + openFormDef);
  console.log("Inserted user form helper functions");
} else {
  console.warn("openFormDef not found!");
}

// 3. In openForm: handle type === "user" with renderUserForm and mountUserFormControls
const oldOpenFormUserCheck = `    } else if (type === "mediaSchedule") {
      byId("modalFields").innerHTML = renderMediaScheduleForm(record || {});
    } else {`;

const newOpenFormUserCheck = `    } else if (type === "mediaSchedule") {
      byId("modalFields").innerHTML = renderMediaScheduleForm(record || {});
    } else if (type === "user") {
      byId("modalFields").innerHTML = renderUserForm(record || {}, modalMode);
    } else {`;

if (dashCode.includes(oldOpenFormUserCheck)) {
  dashCode = dashCode.replace(oldOpenFormUserCheck, newOpenFormUserCheck);
  console.log("Updated openForm user rendering");
} else {
  console.warn("oldOpenFormUserCheck not found!");
}

const oldMountCall = `      mountMediaScheduleFormControls(byId("entryForm"));`;
const newMountCall = `      mountMediaScheduleFormControls(byId("entryForm"));
      if (type === "user") mountUserFormControls(byId("entryForm"));`;

if (dashCode.includes(oldMountCall)) {
  dashCode = dashCode.replace(oldMountCall, newMountCall);
  console.log("Updated openForm mount controls for user");
} else {
  console.warn("oldMountCall not found!");
}

// 4. In submitForm: handle modalType === "user" multi-role extraction and Supabase save
const oldUserSubmit = `    if (modalType === "user") {
      record.name = record.name || record.full_name || "";
      record.full_name = record.full_name || record.name;
      record.department_permissions = Array.isArray(record.department_permissions)
        ? record.department_permissions
        : String(record.department_permissions || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
      record.status = record.status || "Active";
      record.has_dashboard_access = true;
      delete record.password;
    }`;

const newUserSubmit = `    if (modalType === "user") {
      const formData = new FormData(form);
      const checkedPerms = formData.getAll("dept_perm").map((s) => String(s).trim()).filter(Boolean);
      record.name = String(record.name || record.full_name || "").trim();
      record.full_name = record.name;
      record.email = String(record.email || "").trim().toLowerCase();
      record.role = record.role || "Cell Leader";
      record.role_name = record.role;
      record.department_permissions = checkedPerms.length ? checkedPerms : (record.role === "Super Admin" ? ["*"] : ["cellReports"]);
      record.cannot_create_classes = formData.has("cannot_create_classes");
      record.can_view_all_churches = formData.has("can_view_all_churches") || record.role === "Super Admin";
      record.status = record.status || "Active";
      record.has_dashboard_access = true;

      // Group & Cell names
      if (record.cell_group_id) {
        const grp = [...(window.REAL_CELL_GROUPS || []), ...(state.cellGroups || [])].find((g) => String(g.id) === String(record.cell_group_id));
        record.cell_group_name = grp?.group_name || grp?.name || "";
      }
      if (record.cell_id) {
        const cl = [...(window.REAL_CELLS_REGISTRY || []), ...(state.cellRegistry || state.cells || [])].find((c) => String(c.id) === String(record.cell_id));
        record.cell_name = cl?.cell_name || "";
      }

      // Assign all subcells if requested
      if (formData.has("assign_all_subcells") && record.cell_group_id) {
        const subcells = [...(window.REAL_CELLS_REGISTRY || []), ...(state.cellRegistry || state.cells || [])]
          .filter((c) => String(c.group_id) === String(record.cell_group_id) || String(c.cell_group_id) === String(record.cell_group_id))
          .map((c) => c.id);
        record.assigned_cells = subcells.length ? subcells : (record.cell_id ? [record.cell_id] : []);
        record.assigned_cell_groups = [record.cell_group_id];
      } else if (record.cell_id) {
        record.assigned_cells = [record.cell_id];
        record.assigned_cell_groups = record.cell_group_id ? [record.cell_group_id] : [];
      }

      delete record.password;
      void saveUserToSupabase(record);
    }`;

if (dashCode.includes(oldUserSubmit)) {
  dashCode = dashCode.replace(oldUserSubmit, newUserSubmit);
  console.log("Updated user creation in submitForm");
} else {
  console.warn("oldUserSubmit not found!");
}

// 5. In submitForm update path: handle user update
const oldUserUpdate = `    if (modalType === "user") void dualWriteUserRecord("update", collection[index]);`;
const newUserUpdate = `    if (modalType === "user") {
      const formData = new FormData(form);
      const checkedPerms = formData.getAll("dept_perm").map((s) => String(s).trim()).filter(Boolean);
      const u = collection[index];
      u.name = String(u.name || u.full_name || "").trim();
      u.full_name = u.name;
      u.email = String(u.email || "").trim().toLowerCase();
      u.role = u.role || "Cell Leader";
      u.role_name = u.role;
      u.department_permissions = checkedPerms.length ? checkedPerms : (u.role === "Super Admin" ? ["*"] : ["cellReports"]);
      u.cannot_create_classes = formData.has("cannot_create_classes");
      u.can_view_all_churches = formData.has("can_view_all_churches") || u.role === "Super Admin";

      if (u.cell_group_id) {
        const grp = [...(window.REAL_CELL_GROUPS || []), ...(state.cellGroups || [])].find((g) => String(g.id) === String(u.cell_group_id));
        u.cell_group_name = grp?.group_name || grp?.name || "";
      }
      if (u.cell_id) {
        const cl = [...(window.REAL_CELLS_REGISTRY || []), ...(state.cellRegistry || state.cells || [])].find((c) => String(c.id) === String(u.cell_id));
        u.cell_name = cl?.cell_name || "";
      }

      if (formData.has("assign_all_subcells") && u.cell_group_id) {
        const subcells = [...(window.REAL_CELLS_REGISTRY || []), ...(state.cellRegistry || state.cells || [])]
          .filter((c) => String(c.group_id) === String(u.cell_group_id) || String(c.cell_group_id) === String(u.cell_group_id))
          .map((c) => c.id);
        u.assigned_cells = subcells.length ? subcells : (u.cell_id ? [u.cell_id] : []);
        u.assigned_cell_groups = [u.cell_group_id];
      }

      void saveUserToSupabase(u);
      void dualWriteUserRecord("update", u);
    }`;

if (dashCode.includes(oldUserUpdate)) {
  dashCode = dashCode.replace(oldUserUpdate, newUserUpdate);
  console.log("Updated user update in submitForm");
} else {
  console.warn("oldUserUpdate not found!");
}

// 6. Handle action === "delete" && type === "user" in document click listener
const oldDeleteActionCheck = `  if (action === "delete") {
    if (type === "member") {`;

const newDeleteActionCheck = `  if (action === "delete") {
    if (type === "user") {
      const user = (state.users || []).find((u) => String(u.id) === String(id));
      if (!user) return;
      const confirmMsg = lang === "pt"
        ? \`Tem a certeza de que deseja eliminar o utilizador "\${user.name || user.full_name}" (\${user.email})?\\nEsta acção não pode ser desfeita.\`
        : \`Are you sure you want to delete user "\${user.name || user.full_name}" (\${user.email})?\\nThis action cannot be undone.\`;
      if (!confirm(confirmMsg)) return;

      state.users = (state.users || []).filter((u) => String(u.id) !== String(id));
      saveState(\`Deleted user \${user.email}\`);
      void deleteUserFromSupabase(user.id, user.auth_user_id || user.id);
      if (typeof showToast === "function") showToast(lang === "pt" ? "Utilizador eliminado com sucesso!" : "User deleted successfully!");
      if (activeRoute === "users") renderUsers();
      else setRoute(activeRoute);
      return;
    }
    if (type === "member") {`;

if (dashCode.includes(oldDeleteActionCheck)) {
  dashCode = dashCode.replace(oldDeleteActionCheck, newDeleteActionCheck);
  console.log("Added user delete action handler in dashboard.js");
} else {
  console.warn("oldDeleteActionCheck not found!");
}

fs.writeFileSync("js/dashboard.js", dashCode, "utf8");
console.log("All User Management patches applied successfully!");
