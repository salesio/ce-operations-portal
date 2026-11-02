/**
 * Feedback & Improvement Center Module — Christ Embassy Mozambique Operations
 * Accessible by every user role across all operational tiers.
 * Enables reporting issues, suggesting improvements, tracking resolution,
 * and comprehensive multi-format export with user role & department identification.
 */
(function () {
  "use strict";

  let feedbackFilterState = {
    search: "",
    type: "all",
    status: "all",
    priority: "all",
    department: "all",
    role: "all",
    church_id: "all",
    activeTab: "all"
  };

  function getLang() {
    if (typeof window !== "undefined") {
      if (typeof window.lang === "string") return window.lang;
      if (typeof window.getLang === "function") return window.getLang();
      try {
        const stored = localStorage.getItem("ce-dashboard-lang") || localStorage.getItem("ce_language");
        if (stored) return stored;
      } catch (_) {}
    }
    return "pt";
  }

  function escapeHtml(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function escapeAttr(str) {
    return escapeHtml(str);
  }

  function getUserInitials(name) {
    if (!name) return "CE";
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function cleanPhoneNumber(phone) {
    return String(phone || "").replace(/[^\d+]/g, "");
  }

  function formatDate(isoStr) {
    if (!isoStr) return "—";
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      return d.toLocaleDateString(getLang() === "pt" ? "pt-MZ" : "en-US", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (_) {
      return isoStr;
    }
  }

  function showFeedbackToast(message, type = "success") {
    if (typeof window !== "undefined" && typeof window.showToast === "function") {
      window.showToast(message);
      return;
    }
    const existing = document.getElementById("ceFeedbackToast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.id = "ceFeedbackToast";
    toast.className = `alert alert-${type === "error" ? "danger" : "success"} shadow-lg`;
    toast.style.position = "fixed";
    toast.style.bottom = "24px";
    toast.style.right = "24px";
    toast.style.zIndex = "9999";
    toast.style.minWidth = "300px";
    toast.style.maxWidth = "480px";
    toast.style.borderRadius = "12px";
    toast.style.boxShadow = "0 10px 30px rgba(0,0,0,0.5)";
    toast.innerHTML = `
      <div class="d-flex align-items-center justify-content-between gap-3">
        <div class="d-flex align-items-center gap-2">
          <i class="bi ${type === "error" ? "bi-exclamation-triangle-fill" : "bi-check-circle-fill"} fs-5"></i>
          <span>${escapeHtml(message)}</span>
        </div>
        <button type="button" class="btn-close btn-close-white" onclick="this.closest('#ceFeedbackToast').remove()"></button>
      </div>`;
    document.body.appendChild(toast);
    setTimeout(() => {
      if (toast.parentNode) toast.remove();
    }, 4500);
  }

  function canManageFeedback(user = (typeof window !== "undefined" ? window.activeUser : null)) {
    if (!user) return false;
    const role = String(user.role || user.role_name || "").toLowerCase().trim();
    const grants = user.department_permissions || [];
    if (grants.includes("*") || role.includes("super admin") || role.includes("super_admin")) return true;
    if (role.includes("national admin") || role.includes("church admin") || role.includes("pastor")) return true;
    if (role.includes("department head") || role.includes("head") || role.includes("coordinator")) return true;
    return false;
  }

  function canDeleteFeedback(user = (typeof window !== "undefined" ? window.activeUser : null)) {
    if (!user) return false;
    const role = String(user.role || user.role_name || "").toLowerCase().trim();
    const grants = user.department_permissions || [];
    return grants.includes("*") || role.includes("super admin") || role.includes("super_admin") || role.includes("national admin");
  }

  let searchDebounceTimer = null;

  function cleanupModalBackdrops() {
    document.querySelectorAll(".modal-backdrop").forEach((el) => el.remove());
    document.body.classList.remove("modal-open");
    document.body.style.removeProperty("overflow");
    document.body.style.removeProperty("padding-right");
  }

  function safeHideModal(modalEl, onHidden) {
    if (!modalEl) {
      cleanupModalBackdrops();
      if (typeof onHidden === "function") onHidden();
      return;
    }
    let executed = false;
    const finish = () => {
      if (executed) return;
      executed = true;
      modalEl.removeEventListener("hidden.bs.modal", finish);
      modalEl.classList.remove("show");
      modalEl.style.display = "none";
      modalEl.setAttribute("aria-hidden", "true");
      modalEl.removeAttribute("aria-modal");
      cleanupModalBackdrops();
      if (typeof onHidden === "function") onHidden();
    };

    if (window.bootstrap?.Modal) {
      try {
        const instance = window.bootstrap.Modal.getOrCreateInstance(modalEl);
        modalEl.addEventListener("hidden.bs.modal", finish, { once: true });
        instance.hide();
      } catch (_) {
        finish();
      }
    }
    setTimeout(finish, 350);
  }

  let hasTriggeredFeedbackSync = false;
  function renderFeedback(options = {}) {
    const isPt = getLang() === "pt";
    const contentEl = document.getElementById("content");
    if (!contentEl) return;

    if (!hasTriggeredFeedbackSync && window.CEFeedback?.syncFeedbackFromSupabase) {
      hasTriggeredFeedbackSync = true;
      setTimeout(() => {
        window.CEFeedback.syncFeedbackFromSupabase().catch(() => {});
      }, 200);
    }

    const user = typeof window !== "undefined" ? window.activeUser : null;
    const userName = user?.name || user?.full_name || (isPt ? "Membro da Equipa" : "Staff Member");
    const userRole = user?.role || user?.role_name || (isPt ? "Função Activa" : "Active Role");
    const userDept = window.CEFeedback?.resolveUserDepartment(user) || "Geral";
    const userChurch = window.CEFeedback?.resolveChurchName(user?.church_id || user?.church) || "Maputo HQ";

    const stats = window.CEFeedback ? window.CEFeedback.getFeedbackStats(feedbackFilterState.church_id, user) : {
      total: 0, pending: 0, inReview: 0, inProgress: 0, resolved: 0, closed: 0, issues: 0, suggestions: 0, featureRequests: 0, resolutionRate: 0
    };

    const items = window.CEFeedback ? window.CEFeedback.getFeedbackList(feedbackFilterState, user) : [];

    // Distinct departments and roles for dropdown filter
    const allItems = window.CEFeedback ? window.CEFeedback.getFeedbackList({}, user) : [];
    const availableDepartments = Array.from(new Set(allItems.map((i) => i.user_department).filter(Boolean))).sort();
    const availableRoles = Array.from(new Set(allItems.map((i) => i.user_role).filter(Boolean))).sort();
    const churches = (typeof window !== "undefined" && window.state?.churches) || [];

    contentEl.innerHTML = `
      <div class="feedback-module-root container-fluid p-3 p-md-4">
        <!-- Module Header -->
        <div class="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 mb-4">
          <div>
            <div class="d-flex align-items-center gap-2 mb-1">
              <span class="badge text-bg-warning px-2 py-1 fs-8 fw-bold text-uppercase">
                <i class="bi bi-chat-heart me-1"></i>${isPt ? "Portal Colaborativo" : "Collaborative Portal"}
              </span>
              <span class="text-white-50 small">•</span>
              <span class="text-white-50 small">${isPt ? "Acesso universal a toda a equipa" : "Universal access for all staff"}</span>
            </div>
            <h1 class="h3 text-white fw-bold mb-1">${isPt ? "Centro de Feedback & Melhorias" : "Feedback & Improvement Center"}</h1>
            <p class="text-white-50 small mb-0">
              ${isPt
                ? "Canal directo para reportar problemas técnicos, submeter sugestões de melhoria e acompanhar resoluções em todos os departamentos."
                : "Direct channel to report system issues, suggest operational improvements, and track resolutions across all departments."}
            </p>
          </div>

          <div class="d-flex align-items-center flex-wrap gap-2">
            <!-- Export Actions -->
            <div class="dropdown">
              <button class="btn btn-outline-glass dropdown-toggle d-flex align-items-center gap-2" type="button" id="feedbackExportDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                <i class="bi bi-download text-gold"></i>
                <span>${isPt ? "Exportar" : "Export"}</span>
              </button>
              <ul class="dropdown-menu dropdown-menu-dark dropdown-menu-end shadow-lg border border-secondary border-opacity-25" aria-labelledby="feedbackExportDropdown">
                <li>
                  <button class="dropdown-item d-flex align-items-center gap-2 py-2" type="button" id="btnExportFeedbackExcel">
                    <i class="bi bi-file-earmark-excel text-success fs-5"></i>
                    <div>
                      <div class="fw-semibold">${isPt ? "Ficheiro Excel (.xlsx)" : "Excel Spreadsheet (.xlsx)"}</div>
                      <small class="text-white-50">${isPt ? "Folha completa com filtros & colunas" : "Full sheet with filters & columns"}</small>
                    </div>
                  </button>
                </li>
                <li>
                  <button class="dropdown-item d-flex align-items-center gap-2 py-2" type="button" id="btnExportFeedbackCsv">
                    <i class="bi bi-file-earmark-text text-info fs-5"></i>
                    <div>
                      <div class="fw-semibold">${isPt ? "Ficheiro CSV (UTF-8)" : "CSV File (UTF-8)"}</div>
                      <small class="text-white-50">${isPt ? "Compatível com Excel & Sheets" : "Compatible with Excel & Sheets"}</small>
                    </div>
                  </button>
                </li>
                <li><hr class="dropdown-divider border-secondary border-opacity-25"></li>
                <li>
                  <button class="dropdown-item d-flex align-items-center gap-2 py-2" type="button" id="btnExportFeedbackPrint">
                    <i class="bi bi-printer text-warning fs-5"></i>
                    <div>
                      <div class="fw-semibold">${isPt ? "Imprimir / Guardar PDF" : "Print / Save PDF"}</div>
                      <small class="text-white-50">${isPt ? "Relatório formatado com cabeçalho" : "Formatted report with header"}</small>
                    </div>
                  </button>
                </li>
              </ul>
            </div>

            <!-- Submit New Feedback Button -->
            <button class="btn btn-ce-gold d-flex align-items-center gap-2 shadow-sm" type="button" id="btnOpenNewFeedbackModal">
              <i class="bi bi-plus-circle-fill"></i>
              <span>${isPt ? "Novo Feedback / Reportar" : "Submit Feedback"}</span>
            </button>
          </div>
        </div>

        <!-- Identity Banner: Clearly identifying current user and department -->
        <div class="card feedback-identity-banner mb-4 border-0">
          <div class="card-body p-3 p-md-4">
            <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
              <div class="d-flex align-items-center gap-3">
                <div class="feedback-avatar-pill">
                  <i class="bi bi-person-badge fs-3 text-gold"></i>
                </div>
                <div>
                  <div class="d-flex align-items-center gap-2 flex-wrap">
                    <span class="text-white fw-bold fs-6">${escapeHtml(userName)}</span>
                    <span class="badge bg-gold-subtle text-gold border border-warning border-opacity-50">${escapeHtml(userRole)}</span>
                    <span class="badge bg-info-subtle text-info border border-info border-opacity-50">
                      <i class="bi bi-diagram-3 me-1"></i>${escapeHtml(userDept)}
                    </span>
                    <span class="badge bg-secondary-subtle text-light border border-secondary border-opacity-50">
                      <i class="bi bi-geo-alt me-1"></i>${escapeHtml(userChurch)}
                    </span>
                  </div>
                  <div class="text-white-50 small mt-1">
                    <i class="bi ${canManageFeedback(user) ? "bi-shield-check text-success" : "bi-lock-fill text-warning"} me-1"></i>
                    ${canManageFeedback(user)
                      ? (isPt
                        ? "Modo de Gestão: Visualização de feedbacks atribuídos ao seu nível de coordenação, departamento e igreja."
                        : "Management Mode: Viewing feedback scoped to your coordination tier, department, and church.")
                      : (isPt
                        ? "Privacidade Activa: A visualizar apenas os feedbacks submetidos por si e respostas oficiais da liderança."
                        : "Privacy Active: Viewing only feedback submitted by you and official leadership responses.")}
                  </div>
                </div>
              </div>
              <div class="text-md-end">
                <button type="button" class="btn btn-sm btn-outline-glass" id="btnQuickReportBug">
                  <i class="bi bi-bug me-1 text-danger"></i>${isPt ? "Reportar Problema Rápido" : "Quick Report Issue"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- KPI Metric Cards -->
        <div class="row g-3 mb-4">
          <div class="col-6 col-lg-3">
            <div class="card feedback-kpi-card h-100">
              <div class="card-body p-3">
                <div class="d-flex justify-content-between align-items-start">
                  <div>
                    <span class="text-white-50 small text-uppercase fw-semibold">${isPt ? "Total Submetido" : "Total Feedback"}</span>
                    <h3 class="h2 text-white fw-bold mb-0 mt-1">${stats.total}</h3>
                  </div>
                  <div class="feedback-kpi-icon bg-primary bg-opacity-25 text-primary">
                    <i class="bi bi-inbox-fill"></i>
                  </div>
                </div>
                <div class="text-white-50 fs-8 mt-2">
                  <span>${stats.pending + stats.inReview} ${isPt ? "aguardando atenção" : "pending review"}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="col-6 col-lg-3">
            <div class="card feedback-kpi-card h-100 border-start-danger">
              <div class="card-body p-3">
                <div class="d-flex justify-content-between align-items-start">
                  <div>
                    <span class="text-danger small text-uppercase fw-semibold">${isPt ? "Problemas / Bugs" : "Reported Issues"}</span>
                    <h3 class="h2 text-white fw-bold mb-0 mt-1">${stats.issues}</h3>
                  </div>
                  <div class="feedback-kpi-icon bg-danger bg-opacity-25 text-danger">
                    <i class="bi bi-exclamation-octagon-fill"></i>
                  </div>
                </div>
                <div class="text-white-50 fs-8 mt-2">
                  <span class="text-danger">${stats.issues > 0 ? isPt ? "Requerem intervenção técnica" : "Need technical fix" : isPt ? "Nenhum erro pendente" : "No issues"}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="col-6 col-lg-3">
            <div class="card feedback-kpi-card h-100 border-start-warning">
              <div class="card-body p-3">
                <div class="d-flex justify-content-between align-items-start">
                  <div>
                    <span class="text-warning small text-uppercase fw-semibold">${isPt ? "Sugestões de Melhoria" : "Suggestions"}</span>
                    <h3 class="h2 text-white fw-bold mb-0 mt-1">${stats.suggestions + stats.featureRequests}</h3>
                  </div>
                  <div class="feedback-kpi-icon bg-warning bg-opacity-25 text-warning">
                    <i class="bi bi-lightbulb-fill"></i>
                  </div>
                </div>
                <div class="text-white-50 fs-8 mt-2">
                  <span>${stats.featureRequests} ${isPt ? "novas funcionalidades pedidas" : "feature requests"}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="col-6 col-lg-3">
            <div class="card feedback-kpi-card h-100 border-start-success">
              <div class="card-body p-3">
                <div class="d-flex justify-content-between align-items-start">
                  <div>
                    <span class="text-success small text-uppercase fw-semibold">${isPt ? "Resolvidos & Implementados" : "Resolved"}</span>
                    <h3 class="h2 text-white fw-bold mb-0 mt-1">${stats.resolved}</h3>
                  </div>
                  <div class="feedback-kpi-icon bg-success bg-opacity-25 text-success">
                    <i class="bi bi-check-circle-fill"></i>
                  </div>
                </div>
                <div class="text-white-50 fs-8 mt-2">
                  <span class="text-success fw-bold">${stats.resolutionRate}%</span> ${isPt ? "taxa de resolução" : "resolution rate"}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Filter & Search Toolbar -->
        <div class="card feedback-filter-panel mb-4">
          <div class="card-body p-3">
            <div class="row g-2 align-items-center">
              <!-- Search box -->
              <div class="col-12 col-md-4 col-lg-3">
                <div class="input-group">
                  <span class="input-group-text bg-transparent border-secondary border-opacity-50 text-white-50">
                    <i class="bi bi-search"></i>
                  </span>
                  <input type="text" class="form-control bg-transparent border-secondary border-opacity-50 text-white" id="feedbackSearchInput" placeholder="${isPt ? "Pesquisar por título, autor, ticket..." : "Search title, author, ticket..."}" value="${escapeAttr(feedbackFilterState.search)}">
                  ${feedbackFilterState.search ? `<button class="btn btn-outline-secondary border-secondary border-opacity-50" type="button" id="btnClearFeedbackSearch"><i class="bi bi-x-lg"></i></button>` : ""}
                </div>
              </div>

              <!-- Filter Type -->
              <div class="col-6 col-md-2 col-lg-2">
                <select class="form-select bg-dark text-white border-secondary border-opacity-50" id="feedbackFilterType">
                  <option value="all">${isPt ? "Todos os Tipos" : "All Types"}</option>
                  <option value="issue" ${feedbackFilterState.type === "issue" ? "selected" : ""}>🚨 ${isPt ? "Problemas / Bugs" : "Issues / Bugs"}</option>
                  <option value="suggestion" ${feedbackFilterState.type === "suggestion" ? "selected" : ""}>💡 ${isPt ? "Sugestões de Melhoria" : "Suggestions"}</option>
                  <option value="feature_request" ${feedbackFilterState.type === "feature_request" ? "selected" : ""}>✨ ${isPt ? "Novas Funcionalidades" : "Feature Requests"}</option>
                  <option value="general" ${feedbackFilterState.type === "general" ? "selected" : ""}>💬 ${isPt ? "Geral / Outro" : "General"}</option>
                </select>
              </div>

              <!-- Filter Department -->
              <div class="col-6 col-md-3 col-lg-2">
                <select class="form-select bg-dark text-white border-secondary border-opacity-50" id="feedbackFilterDept">
                  <option value="all">${isPt ? "Todos os Deptos" : "All Depts"}</option>
                  ${availableDepartments.map((d) => `<option value="${escapeAttr(d)}" ${feedbackFilterState.department === d ? "selected" : ""}>${escapeHtml(d)}</option>`).join("")}
                </select>
              </div>

              <!-- Filter Role -->
              <div class="col-6 col-md-3 col-lg-2">
                <select class="form-select bg-dark text-white border-secondary border-opacity-50" id="feedbackFilterRole">
                  <option value="all">${isPt ? "Todas as Funções" : "All Roles"}</option>
                  ${availableRoles.map((r) => `<option value="${escapeAttr(r)}" ${feedbackFilterState.role === r ? "selected" : ""}>${escapeHtml(r)}</option>`).join("")}
                </select>
              </div>

              <!-- Filter Status -->
              <div class="col-6 col-md-2 col-lg-2">
                <select class="form-select bg-dark text-white border-secondary border-opacity-50" id="feedbackFilterStatus">
                  <option value="all">${isPt ? "Todos os Estados" : "All Statuses"}</option>
                  <option value="pending" ${feedbackFilterState.status === "pending" ? "selected" : ""}>⏳ ${isPt ? "Pendente" : "Pending"}</option>
                  <option value="in_review" ${feedbackFilterState.status === "in_review" ? "selected" : ""}>🔍 ${isPt ? "Em Análise" : "In Review"}</option>
                  <option value="in_progress" ${feedbackFilterState.status === "in_progress" ? "selected" : ""}>⚡ ${isPt ? "Em Progresso" : "In Progress"}</option>
                  <option value="resolved" ${feedbackFilterState.status === "resolved" ? "selected" : ""}>✅ ${isPt ? "Resolvido" : "Resolved"}</option>
                  <option value="closed" ${feedbackFilterState.status === "closed" ? "selected" : ""}>🔒 ${isPt ? "Fechado" : "Closed"}</option>
                </select>
              </div>

              <!-- Reset Button -->
              <div class="col-12 col-lg-1 text-end">
                <button class="btn btn-outline-glass btn-sm w-100" type="button" id="btnResetFeedbackFilters" title="${isPt ? "Limpar filtros" : "Reset filters"}">
                  <i class="bi bi-arrow-counterclockwise"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Feedback Data Table -->
        <div class="card feedback-table-card shadow-lg">
          <div class="card-header bg-transparent border-secondary border-opacity-25 py-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div class="d-flex align-items-center gap-2">
              <span class="badge text-bg-primary rounded-pill px-2 py-1">${items.length}</span>
              <h2 class="h6 text-white mb-0">${isPt ? "Registos de Feedback e Ocorrências" : "Feedback & Incident Registry"}</h2>
            </div>
            <div class="text-white-50 small">
              ${isPt ? "Mostrando relatórios com identificação de papel e departamento" : "Showing reports identified by role and department"}
            </div>
          </div>

          <div class="table-responsive">
            <table class="table table-dark table-hover align-middle mb-0 feedback-table">
              <thead>
                <tr>
                  <th class="ps-3" style="width: 14%; min-width: 110px;">${isPt ? "Ticket & Data" : "Ticket & Date"}</th>
                  <th style="width: 15%; min-width: 115px;">${isPt ? "Tipo & Prioridade" : "Type & Priority"}</th>
                  <th style="width: 29%; min-width: 180px;">${isPt ? "Título & Detalhes" : "Title & Details"}</th>
                  <th style="width: 19%; min-width: 140px;">${isPt ? "Autor & Depto" : "Reporter & Dept"}</th>
                  <th style="width: 11%; min-width: 85px;">${isPt ? "Estado" : "Status"}</th>
                  <th class="text-end pe-3" style="width: 12%; min-width: 95px;">${isPt ? "Acções" : "Actions"}</th>
                </tr>
              </thead>
              <tbody>
                ${items.length === 0 ? `
                  <tr>
                    <td colspan="6" class="text-center py-5">
                      <div class="text-white-50">
                        <i class="bi bi-chat-square-dots fs-1 d-block mb-3 text-secondary"></i>
                        <h5 class="text-white">${isPt ? "Nenhum feedback encontrado" : "No feedback found"}</h5>
                        <p class="small mb-3">${isPt ? "Tente ajustar os filtros de pesquisa ou clique no botão abaixo para submeter o primeiro reporte." : "Try adjusting filters or submit the first report below."}</p>
                        <button type="button" class="btn btn-sm btn-ce-gold" onclick="document.getElementById('btnOpenNewFeedbackModal')?.click()">
                          <i class="bi bi-plus-circle me-1"></i>${isPt ? "Submeter Feedback" : "Submit Feedback"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ` : items.map((item) => renderFeedbackRow(item, isPt)).join("")}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Render Modals -->
      ${renderNewFeedbackModal(isPt, userName, userRole, userDept, userChurch, availableDepartments)}
      ${renderDetailFeedbackModal(isPt)}
    `;

    attachFeedbackEventListeners(isPt);

    if (options && options.retainSearchFocus) {
      const searchInput = document.getElementById("feedbackSearchInput");
      if (searchInput) {
        searchInput.focus();
        const len = searchInput.value.length;
        searchInput.setSelectionRange(len, len);
      }
    }
  }

    function isFeedbackRead(item) {
    if (!item) return false;
    try {
      const readIds = new Set(JSON.parse(localStorage.getItem("ce-feedback-read-ids") || "[]"));
      if (readIds.has(String(item.id)) || readIds.has(String(item.ticket_number))) return true;
      if (item.is_read) return true;
    } catch (_) {}
    return false;
  }

  function markFeedbackAsRead(id, ticketNumber) {
    try {
      const readIds = new Set(JSON.parse(localStorage.getItem("ce-feedback-read-ids") || "[]"));
      if (id) readIds.add(String(id));
      if (ticketNumber) readIds.add(String(ticketNumber));
      localStorage.setItem("ce-feedback-read-ids", JSON.stringify([...readIds]));

      const item = window.CEFeedback?.getFeedbackById ? window.CEFeedback.getFeedbackById(id) : null;
      if (item) item.is_read = true;

      if (typeof markNotificationRead === "function" && window.state?.notifications) {
        const notif = window.state.notifications.find((n) =>
          (n.entity_type === "feedback" && (String(n.entity_id) === String(ticketNumber) || String(n.entity_id) === String(id))) ||
          (n.title && ticketNumber && n.title.includes(ticketNumber))
        );
        if (notif && !notif.is_read) {
          markNotificationRead(notif.id);
        }
      }

      const row = document.querySelector(`tr[data-feedback-id="${id}"]`);
      if (row) {
        row.classList.remove("feedback-row-unread");
        row.classList.add("feedback-row-read");
        const statusPill = row.querySelector(".feedback-read-badge");
        if (statusPill) {
          statusPill.className = "badge bg-secondary bg-opacity-25 text-white-50 feedback-read-badge";
          statusPill.textContent = "LIDO";
        }
        const titleEl = row.querySelector(".feedback-title-text");
        if (titleEl) {
          titleEl.style.color = "#94a3b8";
          titleEl.style.fontWeight = "500";
        }
      }
    } catch (_) {}
  }

  function renderFeedbackRow(item, isPt) {
    const isRead = isFeedbackRead(item);
    const typeMeta = (window.CEFeedback?.FEEDBACK_TYPES || []).find((t) => t.id === item.feedback_type) || {
      labelPt: "Sugestão", labelEn: "Suggestion", color: "warning", icon: "bi-lightbulb"
    };
    const priorityMeta = (window.CEFeedback?.FEEDBACK_PRIORITIES || []).find((p) => p.id === item.priority) || {
      labelPt: "Média", labelEn: "Medium", color: "info"
    };
    const statusMeta = (window.CEFeedback?.FEEDBACK_STATUSES || []).find((s) => s.id === item.status) || {
      labelPt: "Pendente", labelEn: "Pending", color: "warning"
    };

    const typeLabel = isPt ? typeMeta.labelPt : typeMeta.labelEn;
    const priorityLabel = isPt ? priorityMeta.labelPt : priorityMeta.labelEn;
    const statusLabel = isPt ? statusMeta.labelPt : statusMeta.labelEn;

    const readBadge = isRead
      ? `<span class="badge bg-secondary bg-opacity-25 text-white-50 feedback-read-badge" style="font-size: 0.62rem; letter-spacing: 0.04em;">LIDO</span>`
      : `<span class="badge bg-warning text-dark fw-bold feedback-read-badge" style="font-size: 0.62rem; letter-spacing: 0.05em;"><i class="bi bi-circle-fill text-danger me-1" style="font-size: 0.42rem;"></i>NOVO</span>`;

    return `
      <tr data-feedback-id="${escapeAttr(item.id)}" class="${isRead ? "feedback-row-read" : "feedback-row-unread"}" style="cursor: pointer;">
        <!-- Col 1: Ticket & Data -->
        <td class="ps-3" style="width: 13%; min-width: 100px;">
          <div class="d-flex align-items-center gap-1 mb-1">
            <span class="badge text-bg-dark border border-secondary border-opacity-50 font-monospace">${escapeHtml(item.ticket_number)}</span>
            ${readBadge}
          </div>
          <div class="text-white-50" style="font-size: 0.72rem;">
            ${formatDate(item.created_at)}
          </div>
        </td>

        <!-- Col 2: Tipo & Prioridade -->
        <td style="width: 15%; min-width: 115px;">
          <div class="text-truncate">
            <span class="badge bg-${typeMeta.color}-subtle text-${typeMeta.color} border border-${typeMeta.color} border-opacity-25 d-inline-flex align-items-center gap-1 text-truncate" style="font-size: 0.70rem; max-width: 100%;">
              <i class="bi ${typeMeta.icon}"></i>
              <span class="text-truncate">${escapeHtml(typeLabel)}</span>
            </span>
          </div>
          <div class="mt-1">
            <span class="badge bg-${priorityMeta.color}-subtle text-${priorityMeta.color}" style="font-size: 0.65rem;">
              ${escapeHtml(priorityLabel)}
            </span>
          </div>
        </td>

        <!-- Col 3: Título & Detalhes -->
        <td style="width: 29%; min-width: 180px; max-width: 0;">
          <div class="d-flex align-items-center gap-1 overflow-hidden">
            <span class="feedback-title-text text-truncate d-inline-block" style="color: ${isRead ? "#94a3b8" : "#ffffff"}; font-weight: ${isRead ? "500" : "700"}; font-size: 0.85rem;" title="${escapeAttr(item.title)}">${escapeHtml(item.title)}</span>
            ${item.attachments && item.attachments.length > 0 ? `<span class="badge text-bg-warning text-dark flex-shrink-0" style="font-size: 0.62rem;" title="${item.attachments.length} ${isPt ? "ficheiros/imagens anexados" : "attachments"}"><i class="bi bi-paperclip"></i> ${item.attachments.length}</span>` : ""}
          </div>
          <div class="text-white-50 small text-truncate mt-1" style="max-width: 100%;" title="${escapeAttr(item.description)}">${escapeHtml(item.description)}</div>
          ${item.category_module ? `<span class="badge bg-secondary bg-opacity-25 text-white-50 font-monospace mt-1" style="font-size: 0.62rem;">${escapeHtml(item.category_module)}</span>` : ""}
        </td>

        <!-- Col 4: Autor & Depto / Igreja -->
        <td style="width: 19%; min-width: 140px; max-width: 0;">
          <div class="fw-semibold text-white text-truncate" style="font-size: 0.80rem;" title="${escapeAttr(item.user_name || "Membro")} (${escapeAttr(item.user_role || "Staff")})">
            ${escapeHtml(item.user_name || "Membro")}
            <span class="badge text-bg-warning text-dark ms-1" style="font-size: 0.60rem;">${escapeHtml(item.user_role || "Staff")}</span>
          </div>
          <div class="text-info text-opacity-75 small text-truncate mt-1" style="font-size: 0.70rem; max-width: 100%;" title="${escapeAttr(item.user_department || "Geral")} - ${escapeAttr(item.church_name || "Maputo Central")}">
            <i class="bi bi-diagram-3 me-1"></i>${escapeHtml(item.user_department || "Geral")} · ${escapeHtml(item.church_name || "Maputo HQ")}
          </div>
        </td>

        <!-- Col 5: Estado -->
        <td style="width: 11%; min-width: 85px;">
          <span class="badge bg-${statusMeta.color}-subtle text-${statusMeta.color} border border-${statusMeta.color} border-opacity-50" style="font-size: 0.70rem;">
            ${escapeHtml(statusLabel)}
          </span>
        </td>

        <!-- Col 6: Acções -->
        <td class="text-end pe-3 text-nowrap" style="width: 12%; min-width: 95px;" onclick="event.stopPropagation();">
          <div class="d-inline-flex align-items-center gap-1 justify-content-end">
            <button type="button" class="btn btn-sm btn-outline-glass btn-view-feedback" data-id="${escapeAttr(item.id)}" title="${isPt ? "Ver Detalhes" : "View Details"}">
              <i class="bi bi-eye"></i>
            </button>
            ${canManageFeedback() ? `
              <button type="button" class="btn btn-sm btn-outline-gold btn-manage-feedback" data-id="${escapeAttr(item.id)}" title="${isPt ? "Gerir Estado & Resposta" : "Update Status"}">
                <i class="bi bi-pencil-square"></i>
              </button>
            ` : ""}
            ${canDeleteFeedback() ? `
              <button type="button" class="btn btn-sm btn-outline-danger btn-delete-feedback" data-id="${escapeAttr(item.id)}" title="${isPt ? "Eliminar" : "Delete"}">
                <i class="bi bi-trash"></i>
              </button>
            ` : ""}
          </div>
        </td>
      </tr>
    `;
  }

  function renderNewFeedbackModal(isPt, userName, userRole, userDept, userChurch, availableDepartments) {
    const defaultDepts = (window.CEFeedback?.DEPARTMENTS || []).concat(availableDepartments);
    const uniqueDepts = Array.from(new Set(defaultDepts)).filter(Boolean).sort();
    const initials = getUserInitials(userName);

    return `
      <div class="modal fade ops-modal-shell" id="newFeedbackModal" tabindex="-1" aria-labelledby="newFeedbackModalTitle" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable ops-modal-dialog">
          <form id="newFeedbackForm" class="modal-content ops-modal" style="border: 1px solid rgba(255, 193, 7, 0.25); border-radius: 1.25rem; box-shadow: 0 24px 60px rgba(0,0,0,0.7); backdrop-filter: blur(20px);">
            <div class="modal-header ops-modal-header border-bottom border-secondary border-opacity-25 pb-3">
              <div class="d-flex align-items-center gap-3">
                <div class="rounded-circle d-flex align-items-center justify-content-center text-gold fs-4 flex-shrink-0" style="width: 44px; height: 44px; background: rgba(255,193,7,0.12); border: 1px solid rgba(255,193,7,0.25);">
                  <i class="bi bi-lightbulb-fill"></i>
                </div>
                <div>
                  <div class="eyebrow text-gold mb-1" style="font-size: 0.72rem; letter-spacing: 0.08em;">${isPt ? "CANAL DE VOZ & MELHORIA CONTÍNUA" : "STAFF VOICE & IMPROVEMENT CHANNEL"}</div>
                  <h5 class="modal-title text-white fw-bold mb-0" id="newFeedbackModalTitle" style="font-size: 1.18rem; letter-spacing: -0.01em;">
                    ${isPt ? "Partilhar Sugestão ou Reportar Problema" : "Submit Suggestion or Report Issue"}
                  </h5>
                </div>
              </div>
              <button type="button" class="icon-btn ops-modal-close" data-bs-dismiss="modal" aria-label="Fechar">
                <i class="bi bi-x-lg"></i>
              </button>
            </div>

            <div class="modal-body ops-modal-body p-3 p-md-4">
              <!-- Author Mini Banner -->
              <div class="card bg-dark bg-opacity-70 border-secondary border-opacity-30 p-3 mb-3 rounded-3 shadow-sm">
                <div class="d-flex align-items-center gap-3">
                  <div class="rounded-circle d-flex align-items-center justify-content-center text-dark fw-bold fs-6 shadow-sm flex-shrink-0" style="width: 42px; height: 42px; background: linear-gradient(135deg, #ffc107, #f59e0b);">
                    ${escapeHtml(initials)}
                  </div>
                  <div class="flex-grow-1 overflow-hidden">
                    <div class="d-flex align-items-center gap-2 flex-wrap mb-1">
                      <span class="text-white-50 small">${isPt ? "A submeter como:" : "Submitting as:"}</span>
                      <strong class="text-white">${escapeHtml(userName)}</strong>
                      <span class="badge text-bg-warning text-dark fw-bold" style="font-size: 0.7rem;">${escapeHtml(userRole)}</span>
                    </div>
                    <div class="d-flex align-items-center gap-2 flex-wrap text-white-50" style="font-size: 0.74rem;">
                      <span class="badge bg-secondary-subtle text-light border border-secondary border-opacity-25">
                        <i class="bi bi-geo-alt me-1 text-info"></i>${escapeHtml(userChurch)}
                      </span>
                      <span class="badge bg-secondary-subtle text-light border border-secondary border-opacity-25">
                        <i class="bi bi-shield-check me-1 text-success"></i>${isPt ? "Identidade Operacional Confirmada" : "Verified Staff"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="row g-3">
                <!-- Row 1: Tipo & Prioridade -->
                <div class="col-12 col-md-6">
                  <label class="form-label text-white small fw-semibold" for="feedbackTypeInput">
                    ${isPt ? "Tipo de Feedback" : "Feedback Type"} <span class="text-danger">*</span>
                  </label>
                  <select class="form-select bg-dark text-white border-secondary border-opacity-50" id="feedbackTypeInput" required>
                    <option value="issue">🚨 ${isPt ? "Problema / Erro no Sistema" : "System Issue / Bug"}</option>
                    <option value="suggestion" selected>💡 ${isPt ? "Sugestão de Melhoria" : "Improvement Suggestion"}</option>
                    <option value="feature_request">✨ ${isPt ? "Nova Funcionalidade Desejada" : "Feature Request"}</option>
                    <option value="general">💬 ${isPt ? "Comentário Geral / Outro" : "General Comment"}</option>
                  </select>
                </div>

                <div class="col-12 col-md-6">
                  <label class="form-label text-white small fw-semibold" for="feedbackPriorityInput">
                    ${isPt ? "Prioridade Estimada" : "Priority"} <span class="text-danger">*</span>
                  </label>
                  <select class="form-select bg-dark text-white border-secondary border-opacity-50" id="feedbackPriorityInput" required>
                    <option value="low">🟢 ${isPt ? "Baixa (Melhoria cosmética ou secundária)" : "Low"}</option>
                    <option value="medium" selected>🔵 ${isPt ? "Média (Importante para o dia a dia)" : "Medium"}</option>
                    <option value="high">🟠 ${isPt ? "Alta (Dificulta o trabalho operacional)" : "High"}</option>
                    <option value="urgent">🔴 ${isPt ? "Crítica / Urgente (Bloqueia operações)" : "Urgent / Critical"}</option>
                  </select>
                </div>

                <!-- Row 2: Módulo & Departamento -->
                <div class="col-12 col-md-6">
                  <label class="form-label text-white small fw-semibold" for="feedbackModuleInput">
                    ${isPt ? "Área ou Módulo Afectado" : "Affected Area / Module"}
                  </label>
                  <select class="form-select bg-dark text-white border-secondary border-opacity-50" id="feedbackModuleInput">
                    <option value="dashboard">${isPt ? "📊 Dashboard Geral" : "General Dashboard"}</option>
                    <option value="cell">${isPt ? "🌱 Ministério de Células & Relatórios" : "Cell Ministry"}</option>
                    <option value="members">${isPt ? "👥 Gestão de Membros" : "Members"}</option>
                    <option value="firstTimers">${isPt ? "🤝 Primeiros Visitantes & Acompanhamento" : "First Timers"}</option>
                    <option value="finance">${isPt ? "💰 Finanças & Dízimos/Ofertas" : "Finance"}</option>
                    <option value="partnership">${isPt ? "🤝 Parcerias" : "Partnerships"}</option>
                    <option value="requisitions">${isPt ? "📦 Requisições" : "Requisitions"}</option>
                    <option value="venueInventory">${isPt ? "🏛️ Património & Inventário" : "Venue & Inventory"}</option>
                    <option value="media">${isPt ? "🎥 Mídia & Transmissão" : "Media"}</option>
                    <option value="staffHr">${isPt ? "📋 Recursos Humanos & Staff" : "Staff HR"}</option>
                    <option value="attendance">${isPt ? "⏱️ Ponto & Assiduidade" : "Attendance"}</option>
                    <option value="foundation">${isPt ? "🎓 Escola de Fundação" : "Foundation School"}</option>
                    <option value="sacraments">${isPt ? "🕊️ Sacramentos" : "Sacraments"}</option>
                    <option value="counseling">${isPt ? "💬 Aconselhamento Pastoral" : "Counseling"}</option>
                    <option value="programs">${isPt ? "📅 Programas & Eventos" : "Programs"}</option>
                    <option value="alec">🏆 ALEC</option>
                    <option value="fevo">🔥 F.E.V.O</option>
                    <option value="general" selected>${isPt ? "🌐 Geral / Toda a Plataforma" : "General Platform"}</option>
                  </select>
                </div>

                <div class="col-12 col-md-6">
                  <label class="form-label text-white small fw-semibold" for="feedbackDepartmentInput">
                    ${isPt ? "Departamento de Origem" : "Department"} <span class="text-danger">*</span>
                  </label>
                  <select class="form-select bg-dark text-white border-secondary border-opacity-50" id="feedbackDepartmentInput" required>
                    ${uniqueDepts.map((d) => `
                      <option value="${escapeAttr(d)}" ${d.toLowerCase() === userDept.toLowerCase() ? "selected" : ""}>
                        ${escapeHtml(d)}
                      </option>
                    `).join("")}
                  </select>
                </div>

                <!-- Row 3: Title -->
                <div class="col-12">
                  <label class="form-label text-white small fw-semibold" for="feedbackTitleInput">
                    ${isPt ? "Título ou Resumo do Feedback" : "Title / Summary"} <span class="text-danger">*</span>
                  </label>
                  <input type="text" class="form-control bg-dark text-white border-secondary border-opacity-50" id="feedbackTitleInput" placeholder="${isPt ? "Ex: Adicionar filtro rápido na tabela de membros..." : "Ex: Add quick filter on members table..."}" required minlength="5" maxlength="150">
                  <div class="form-text text-white-50" style="font-size: 0.72rem;">${isPt ? "Um título claro e objetivo facilita a triagem rápida pela liderança." : "A concise title enables faster review."}</div>
                </div>

                <!-- Row 4: Description -->
                <div class="col-12">
                  <label class="form-label text-white small fw-semibold" for="feedbackDescriptionInput">
                    ${isPt ? "Descrição Detalhada" : "Detailed Description"} <span class="text-danger">*</span>
                  </label>
                  <textarea class="form-control bg-dark text-white border-secondary border-opacity-50" id="feedbackDescriptionInput" rows="4" placeholder="${isPt ? "Explique o que ocorreu, que melhoria gostaria de ver, ou os passos que causaram o erro..." : "Explain what occurred, what improvement you would like to see, or the steps that caused the issue..."}" required minlength="10"></textarea>
                </div>



                <!-- Row 6: Attachments Section -->
                <div class="col-12">
                  <div class="d-flex align-items-center justify-content-between mb-1">
                    <label class="form-label text-white small fw-semibold mb-0">
                      <i class="bi bi-paperclip text-gold me-1"></i>
                      ${isPt ? "Anexar Imagens ou Ficheiros (Múltiplos)" : "Attach Images or Files (Multiple)"}
                    </label>
                    <span class="badge text-bg-secondary" id="feedbackAttachmentCount">0 ${isPt ? "anexos" : "attachments"}</span>
                  </div>
                  <div class="p-3 rounded-3 bg-dark border border-secondary border-opacity-40" style="background: rgba(0,0,0,0.25) !important;">
                    <div class="d-flex flex-wrap align-items-center gap-2 mb-2">
                      <input type="file" id="feedbackAttachmentsInput" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip" class="d-none">
                      <button type="button" class="btn btn-sm btn-outline-glass d-inline-flex align-items-center gap-2" id="btnAttachFeedbackFiles">
                        <i class="bi bi-cloud-arrow-up text-gold fs-6"></i>
                        <span>${isPt ? "Selecionar Imagens / Documentos" : "Select Images / Documents"}</span>
                      </button>
                      <small class="text-white-50">
                        ${isPt ? "PNG, JPG, PDF, Excel — máx. 5MB cada" : "PNG, JPG, PDF, Excel — max 5MB each"}
                      </small>
                    </div>
                    <div id="feedbackAttachmentList" class="d-flex flex-wrap gap-2 mt-2">
                      <span class="text-white-50 small fst-italic">${isPt ? "Nenhum ficheiro anexado ainda." : "No files attached yet."}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-footer ops-modal-footer border-top border-secondary border-opacity-25 py-3 px-3 px-md-4">
              <button type="button" class="btn btn-outline-glass" data-bs-dismiss="modal">${isPt ? "Cancelar" : "Cancel"}</button>
              <button type="submit" class="btn btn-ce-gold d-flex align-items-center gap-2 shadow-sm" id="btnSubmitFeedback">
                <i class="bi bi-send-fill" id="btnSubmitFeedbackIcon"></i>
                <span id="btnSubmitFeedbackText">${isPt ? "Submeter Feedback" : "Submit Feedback"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

    function renderDetailFeedbackModal(isPt) {
    return `
      <div class="modal fade ops-modal-shell" id="feedbackDetailModal" tabindex="-1" aria-labelledby="feedbackDetailModalTitle" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable ops-modal-dialog">
          <div class="modal-content ops-modal" style="border: 1px solid rgba(255, 193, 7, 0.25); border-radius: 1.25rem; box-shadow: 0 24px 60px rgba(0,0,0,0.7); backdrop-filter: blur(20px);">
            <div class="modal-header ops-modal-header border-bottom border-secondary border-opacity-25 pb-3">
              <div class="d-flex align-items-center gap-3">
                <div class="rounded-circle d-flex align-items-center justify-content-center text-gold fs-4 flex-shrink-0" style="width: 44px; height: 44px; background: rgba(255,193,7,0.12); border: 1px solid rgba(255,193,7,0.25);">
                  <i class="bi bi-chat-quote-fill"></i>
                </div>
                <div>
                  <div class="d-flex align-items-center gap-2 mb-1 flex-wrap">
                    <span class="badge text-bg-warning text-dark font-monospace fw-bold px-2 py-0" style="font-size: 0.72rem;" id="feedbackDetailModalTicket">FB-2026-0000</span>
                    <span class="text-white-50 small" id="feedbackDetailModalDate">•</span>
                  </div>
                  <h5 class="modal-title text-white fw-bold mb-0" id="feedbackDetailModalTitle" style="font-size: 1.15rem; letter-spacing: -0.01em;">Detalhes</h5>
                </div>
              </div>
              <div class="d-flex align-items-center gap-2">
                <div id="feedbackDetailModalHeaderBadge"></div>
                <button type="button" class="icon-btn ops-modal-close" data-bs-dismiss="modal" aria-label="Fechar">
                  <i class="bi bi-x-lg"></i>
                </button>
              </div>
            </div>

            <div class="modal-body ops-modal-body p-3 p-md-4" id="feedbackDetailModalBody">
              <!-- Dynamically populated -->
            </div>

            <div class="modal-footer ops-modal-footer border-top border-secondary border-opacity-25 py-3 px-3 px-md-4" id="feedbackDetailModalFooter">
              <button type="button" class="btn btn-outline-glass" data-bs-dismiss="modal">${isPt ? "Fechar" : "Close"}</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  let currentAttachedFiles = [];

  function renderAttachmentPreviews(isPt) {
    const listEl = document.getElementById("feedbackAttachmentList");
    const countBadge = document.getElementById("feedbackAttachmentCount");
    if (countBadge) {
      countBadge.textContent = `${currentAttachedFiles.length} ${isPt ? "anexos" : "attachments"}`;
      countBadge.className = currentAttachedFiles.length > 0 ? "badge text-bg-warning text-dark fw-bold" : "badge text-bg-secondary text-white-50";
    }
    if (!listEl) return;
    if (currentAttachedFiles.length === 0) {
      listEl.innerHTML = `<span class="text-white-50 small fst-italic">${isPt ? "Nenhum ficheiro anexado ainda." : "No files attached yet."}</span>`;
      return;
    }

    listEl.innerHTML = currentAttachedFiles.map((file, idx) => {
      const isImg = file.type?.startsWith("image/") || (file.data && String(file.data).startsWith("data:image/"));
      const sizeStr = file.size ? (file.size < 1024 * 1024 ? Math.round(file.size / 1024) + " KB" : (file.size / (1024 * 1024)).toFixed(1) + " MB") : "";
      return `
        <div class="d-inline-flex align-items-center gap-2 p-1 px-2 rounded bg-dark border border-secondary border-opacity-50" style="max-width: 240px;">
          ${isImg ? `<img src="${file.data}" alt="" style="width: 28px; height: 28px; object-fit: cover; border-radius: 4px;">` : `<i class="bi bi-file-earmark text-gold fs-5"></i>`}
          <div class="overflow-hidden" style="line-height: 1.2;">
            <div class="small text-truncate text-white fw-semibold" title="${escapeAttr(file.name)}">${escapeHtml(file.name)}</div>
            <span class="text-white-50" style="font-size: 0.65rem;">${sizeStr}</span>
          </div>
          <button type="button" class="btn btn-sm btn-link text-danger p-0 ms-1" data-remove-attachment="${idx}" title="${isPt ? "Remover" : "Remove"}">
            <i class="bi bi-x-circle-fill"></i>
          </button>
        </div>
      `;
    }).join("");

    listEl.querySelectorAll("[data-remove-attachment]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const removeIdx = Number(btn.dataset.removeAttachment);
        if (!isNaN(removeIdx) && removeIdx >= 0 && removeIdx < currentAttachedFiles.length) {
          currentAttachedFiles.splice(removeIdx, 1);
          renderAttachmentPreviews(isPt);
        }
      });
    });
  }

  function attachFeedbackEventListeners(isPt) {
    const resetAttachmentState = () => {
      currentAttachedFiles = [];
      renderAttachmentPreviews(isPt);
      const fileInput = document.getElementById("feedbackAttachmentsInput");
      if (fileInput) fileInput.value = "";
    };

    const submitBtn = document.getElementById("btnSubmitFeedback");
    const submitBtnIcon = document.getElementById("btnSubmitFeedbackIcon");
    const submitBtnText = document.getElementById("btnSubmitFeedbackText");

    const resetSubmitBtn = () => {
      if (submitBtn) {
        submitBtn.disabled = false;
        if (submitBtnIcon) submitBtnIcon.className = "bi bi-send-fill";
        if (submitBtnText) submitBtnText.textContent = isPt ? "Submeter Feedback" : "Submit Feedback";
      }
    };

    // Open new modal
    document.getElementById("btnOpenNewFeedbackModal")?.addEventListener("click", () => {
      resetAttachmentState();
      resetSubmitBtn();
      const form = document.getElementById("newFeedbackForm");
      if (form) form.reset();
      const modalEl = document.getElementById("newFeedbackModal");
      if (modalEl && window.bootstrap?.Modal) {
        window.bootstrap.Modal.getOrCreateInstance(modalEl).show();
      }
    });

    document.getElementById("btnQuickReportBug")?.addEventListener("click", () => {
      resetAttachmentState();
      resetSubmitBtn();
      const form = document.getElementById("newFeedbackForm");
      if (form) form.reset();
      const modalEl = document.getElementById("newFeedbackModal");
      if (modalEl && window.bootstrap?.Modal) {
        const typeSelect = document.getElementById("feedbackTypeInput");
        if (typeSelect) typeSelect.value = "issue";
        const prioSelect = document.getElementById("feedbackPriorityInput");
        if (prioSelect) prioSelect.value = "high";
        window.bootstrap.Modal.getOrCreateInstance(modalEl).show();
      }
    });

    // File attachments handling
    const attachBtn = document.getElementById("btnAttachFeedbackFiles");
    const fileInput = document.getElementById("feedbackAttachmentsInput");
    attachBtn?.addEventListener("click", () => fileInput?.click());

    fileInput?.addEventListener("change", (e) => {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;

      const maxBytes = 5 * 1024 * 1024; // 5 MB per file
      files.forEach((file) => {
        if (file.size > maxBytes) {
          showFeedbackToast(isPt ? `O ficheiro "${file.name}" excede o limite de 5MB.` : `File "${file.name}" exceeds 5MB limit.`, "error");
          return;
        }
        const reader = new FileReader();
        reader.onload = (loadEvent) => {
          currentAttachedFiles.push({
            name: file.name,
            type: file.type || "application/octet-stream",
            size: file.size,
            data: loadEvent.target.result
          });
          renderAttachmentPreviews(isPt);
        };
        reader.readAsDataURL(file);
      });
      fileInput.value = "";
    });

    // Form submit
    const handleFeedbackSubmit = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      if (submitBtn && submitBtn.disabled) return;

      const userDept = document.getElementById("feedbackDepartmentInput")?.value || "";
      const type = document.getElementById("feedbackTypeInput")?.value || "suggestion";
      const categoryModule = document.getElementById("feedbackModuleInput")?.value || "general";
      const priority = document.getElementById("feedbackPriorityInput")?.value || "medium";
      const title = (document.getElementById("feedbackTitleInput")?.value || "").trim();
      const description = (document.getElementById("feedbackDescriptionInput")?.value || "").trim();
      const solution = (document.getElementById("feedbackSolutionInput")?.value || "").trim();
      const phone = (document.getElementById("feedbackPhoneInput")?.value || "").trim();

      if (!title || !description) {
        showFeedbackToast(isPt ? "Preencha o título e a descrição." : "Fill title and description.", "error");
        return;
      }

      if (title.length < 5) {
        showFeedbackToast(isPt ? "O título deve ter pelo menos 5 caracteres." : "Title must have at least 5 characters.", "error");
        return;
      }

      if (description.length < 10) {
        showFeedbackToast(isPt ? "A descrição deve ter pelo menos 10 caracteres." : "Description must have at least 10 characters.", "error");
        return;
      }

      // Show busy state
      if (submitBtn) {
        submitBtn.disabled = true;
        if (submitBtnIcon) submitBtnIcon.className = "spinner-border spinner-border-sm";
        if (submitBtnText) submitBtnText.textContent = isPt ? "A Submeter..." : "Submitting...";
      }

      try {
        const record = window.CEFeedback.createFeedback({
          user_department: userDept,
          feedback_type: type,
          category_module: categoryModule,
          priority: priority,
          title: title,
          description: description,
          suggested_solution: solution,
          phone: phone,
          attachments: currentAttachedFiles
        });

        currentAttachedFiles = [];
        const formEl = document.getElementById("newFeedbackForm");
        if (formEl) formEl.reset();
        resetAttachmentState();

        const modalEl = document.getElementById("newFeedbackModal");
        showFeedbackToast(
          isPt
            ? `Feedback ${record?.ticket_number || ""} submetido com sucesso pelo departamento ${record?.user_department || userDept}!`
            : `Feedback ${record?.ticket_number || ""} submitted successfully from ${record?.user_department || userDept}!`
        );

        safeHideModal(modalEl, () => {
          renderFeedback();
        });
      } catch (submitErr) {
        console.error("[CE Feedback] Submit handler error:", submitErr);
        showFeedbackToast(
          isPt ? "Erro ao submeter feedback. Por favor tente novamente." : "Error submitting feedback. Please try again.",
          "error"
        );
        resetSubmitBtn();
      }
    };

    document.getElementById("newFeedbackForm")?.addEventListener("submit", handleFeedbackSubmit);

    // Search filter
    const searchInput = document.getElementById("feedbackSearchInput");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        feedbackFilterState.search = e.target.value;
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => {
          renderFeedback({ retainSearchFocus: true });
        }, 220);
      });
    }

    document.getElementById("btnClearFeedbackSearch")?.addEventListener("click", () => {
      feedbackFilterState.search = "";
      renderFeedback();
    });

    // Dropdown filters
    document.getElementById("feedbackFilterType")?.addEventListener("change", (e) => {
      feedbackFilterState.type = e.target.value;
      renderFeedback();
    });

    document.getElementById("feedbackFilterDept")?.addEventListener("change", (e) => {
      feedbackFilterState.department = e.target.value;
      renderFeedback();
    });

    document.getElementById("feedbackFilterRole")?.addEventListener("change", (e) => {
      feedbackFilterState.role = e.target.value;
      renderFeedback();
    });

    document.getElementById("feedbackFilterStatus")?.addEventListener("change", (e) => {
      feedbackFilterState.status = e.target.value;
      renderFeedback();
    });

    // Reset filters
    document.getElementById("btnResetFeedbackFilters")?.addEventListener("click", () => {
      feedbackFilterState = {
        search: "",
        type: "all",
        status: "all",
        priority: "all",
        department: "all",
        role: "all",
        church_id: "all",
        activeTab: "all"
      };
      renderFeedback();
    });

    // Export Excel
    document.getElementById("btnExportFeedbackExcel")?.addEventListener("click", () => {
      const items = window.CEFeedback.getFeedbackList(feedbackFilterState);
      exportFeedbackExcel(items, isPt);
    });

    // Export CSV
    document.getElementById("btnExportFeedbackCsv")?.addEventListener("click", () => {
      const items = window.CEFeedback.getFeedbackList(feedbackFilterState);
      exportFeedbackCsv(items, isPt);
    });

    // Export Print / PDF
    document.getElementById("btnExportFeedbackPrint")?.addEventListener("click", () => {
      const items = window.CEFeedback.getFeedbackList(feedbackFilterState);
      exportFeedbackPrint(items, isPt);
    });

    // Table item buttons
    // Row click opens detail
    document.querySelectorAll(".feedback-table tbody tr[data-feedback-id]").forEach((row) => {
      row.addEventListener("click", (e) => {
        if (e.target.closest("button") || e.target.closest("a") || e.target.closest("input")) return;
        const id = row.dataset.feedbackId;
        openFeedbackDetail(id, isPt, false);
      });
    });

    document.querySelectorAll(".btn-view-feedback").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        openFeedbackDetail(id, isPt, false);
      });
    });

    document.querySelectorAll(".btn-manage-feedback").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        openFeedbackDetail(id, isPt, true);
      });
    });

    document.querySelectorAll(".btn-delete-feedback").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const target = window.CEFeedback.getFeedbackById(id);
        const confirmMsg = isPt
          ? `Tem certeza de que deseja eliminar o feedback ${target?.ticket_number || id}?`
          : `Are you sure you want to delete feedback ${target?.ticket_number || id}?`;
        if (confirm(confirmMsg)) {
          window.CEFeedback.deleteFeedback(id);
          showFeedbackToast(isPt ? "Feedback eliminado." : "Feedback deleted.");
          renderFeedback();
        }
      });
    });
  }

  function openFeedbackDetail(id, isPt, isEditing) {
    const item = window.CEFeedback.getFeedbackById(id);
    if (!item) return;

    markFeedbackAsRead(id, item.ticket_number);

    const modalTicket = document.getElementById("feedbackDetailModalTicket");
    const modalDate = document.getElementById("feedbackDetailModalDate");
    const modalTitle = document.getElementById("feedbackDetailModalTitle");
    const modalHeaderBadge = document.getElementById("feedbackDetailModalHeaderBadge");
    const modalBody = document.getElementById("feedbackDetailModalBody");
    const modalFooter = document.getElementById("feedbackDetailModalFooter");

    if (modalTicket) modalTicket.textContent = item.ticket_number || "FB";
    if (modalDate) modalDate.innerHTML = `<i class="bi bi-clock-history me-1"></i>${formatDate(item.created_at)}`;
    if (modalTitle) modalTitle.textContent = item.title || (isPt ? "Sem Título" : "No Title");

    const typeMeta = (window.CEFeedback?.FEEDBACK_TYPES || []).find((t) => t.id === item.feedback_type) || {
      labelPt: "Sugestão", labelEn: "Suggestion", icon: "bi-lightbulb", color: "warning"
    };
    const priorityMeta = (window.CEFeedback?.FEEDBACK_PRIORITIES || []).find((p) => p.id === item.priority) || {
      labelPt: "Média", labelEn: "Medium", color: "info"
    };
    const statusMeta = (window.CEFeedback?.FEEDBACK_STATUSES || []).find((s) => s.id === item.status) || {
      labelPt: "Pendente", labelEn: "Pending", color: "warning"
    };
    const moduleMeta = window.CEFeedback?.resolveModuleMeta
      ? window.CEFeedback.resolveModuleMeta(item.category_module)
      : { labelPt: item.category_module || "Geral", icon: "bi-globe" };

    if (modalHeaderBadge) {
      modalHeaderBadge.innerHTML = `
        <span class="badge bg-${statusMeta.color}-subtle text-${statusMeta.color} border border-${statusMeta.color} border-opacity-50 px-2 py-1 fw-bold" style="font-size: 0.78rem;">
          ${isPt ? statusMeta.labelPt : statusMeta.labelEn}
        </span>
      `;
    }

    // Lifecycle Stepper progress
    let progressPercent = 12;
    let step2Active = false;
    let step3Active = false;
    let isResolved = false;
    let isClosed = false;

    if (item.status === "in_review") {
      progressPercent = 40;
      step2Active = true;
    } else if (item.status === "in_progress") {
      progressPercent = 70;
      step2Active = true;
      step3Active = true;
    } else if (item.status === "resolved") {
      progressPercent = 100;
      step2Active = true;
      step3Active = true;
      isResolved = true;
    } else if (item.status === "closed") {
      progressPercent = 100;
      step2Active = true;
      step3Active = true;
      isClosed = true;
    }

    const step2Text = step2Active ? (isPt ? "Em análise técnica" : "Under review") : (isPt ? "Aguardando triagem" : "Waiting triage");
    const step3Text = step3Active ? (isPt ? "Em resolução" : "In resolution") : (isPt ? "Fila técnica" : "Technical queue");

    const initials = getUserInitials(item.user_name);
    const cleanPhone = cleanPhoneNumber(item.phone);

    if (modalBody) {
      modalBody.innerHTML = `
        <!-- 1. Lifecycle Progress Stepper -->
        <div class="card bg-dark bg-opacity-60 border-secondary border-opacity-25 p-3 mb-3 rounded-3 shadow-sm">
          <div class="position-relative px-2 py-1">
            <div style="position: absolute; top: 18px; left: 35px; right: 35px; height: 3px; background: rgba(255,255,255,0.08); z-index: 1;"></div>
            <div style="position: absolute; top: 18px; left: 35px; width: ${progressPercent}%; max-width: calc(100% - 70px); height: 3px; background: linear-gradient(90deg, #ffc107, #20d7ff, #198754); z-index: 2; transition: width 0.4s ease;"></div>
            
            <div class="d-flex align-items-start justify-content-between position-relative" style="z-index: 3;">
              <!-- Step 1 -->
              <div class="d-flex flex-column align-items-center text-center" style="max-width: 90px;">
                <div class="rounded-circle d-flex align-items-center justify-content-center text-dark fw-bold shadow-sm" style="width: 36px; height: 36px; background: #ffc107; font-size: 0.95rem;">
                  <i class="bi bi-send-check-fill"></i>
                </div>
                <span class="small text-white fw-semibold mt-2" style="font-size: 0.78rem;">${isPt ? "Submetido" : "Submitted"}</span>
                <span class="text-white-50" style="font-size: 0.65rem;">${formatDate(item.created_at)}</span>
              </div>

              <!-- Step 2 -->
              <div class="d-flex flex-column align-items-center text-center" style="max-width: 95px;">
                <div class="rounded-circle d-flex align-items-center justify-content-center ${step2Active ? "bg-info text-dark" : "bg-dark text-white-50 border border-secondary"} fw-bold shadow-sm" style="width: 36px; height: 36px; font-size: 0.95rem;">
                  <i class="bi bi-search"></i>
                </div>
                <span class="small ${step2Active ? "text-info fw-semibold" : "text-white-50"} mt-2" style="font-size: 0.78rem;">${isPt ? "Em Análise" : "In Review"}</span>
                <span class="text-white-50" style="font-size: 0.65rem;">${step2Text}</span>
              </div>

              <!-- Step 3 -->
              <div class="d-flex flex-column align-items-center text-center" style="max-width: 95px;">
                <div class="rounded-circle d-flex align-items-center justify-content-center ${step3Active ? "bg-primary text-white" : "bg-dark text-white-50 border border-secondary"} fw-bold shadow-sm" style="width: 36px; height: 36px; font-size: 0.95rem;">
                  <i class="bi bi-tools"></i>
                </div>
                <span class="small ${step3Active ? "text-primary fw-semibold" : "text-white-50"} mt-2" style="font-size: 0.78rem;">${isPt ? "Em Resolução" : "In Progress"}</span>
                <span class="text-white-50" style="font-size: 0.65rem;">${step3Text}</span>
              </div>

              <!-- Step 4 -->
              <div class="d-flex flex-column align-items-center text-center" style="max-width: 95px;">
                <div class="rounded-circle d-flex align-items-center justify-content-center ${isResolved ? "bg-success text-white" : (isClosed ? "bg-secondary text-white" : "bg-dark text-white-50 border border-secondary")} fw-bold shadow-sm" style="width: 36px; height: 36px; font-size: 0.95rem;">
                  <i class="bi ${isClosed ? "bi-lock-fill" : (isResolved ? "bi-check2-circle" : "bi-check2")}"></i>
                </div>
                <span class="small ${isResolved ? "text-success fw-semibold" : (isClosed ? "text-secondary fw-semibold" : "text-white-50")} mt-2" style="font-size: 0.78rem;">${isClosed ? (isPt ? "Fechado" : "Closed") : (isPt ? "Resolvido" : "Resolved")}</span>
                <span class="text-white-50" style="font-size: 0.65rem;">${item.resolved_at ? formatDate(item.resolved_at) : (isResolved ? (isPt ? "Concluído" : "Completed") : "")}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. Author Profile Card -->
        <div class="card bg-dark bg-opacity-70 border-secondary border-opacity-30 p-3 mb-3 rounded-3 shadow-sm">
          <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
            <div class="d-flex align-items-center gap-3">
              <div class="rounded-circle d-flex align-items-center justify-content-center text-dark fw-bold fs-5 shadow-sm flex-shrink-0" style="width: 46px; height: 46px; background: linear-gradient(135deg, #ffc107, #f59e0b);">
                ${escapeHtml(initials)}
              </div>
              <div>
                <div class="d-flex align-items-center gap-2 flex-wrap mb-1">
                  <span class="fw-bold text-white fs-6" style="letter-spacing: -0.01em;">${escapeHtml(item.user_name)}</span>
                  <span class="badge text-bg-warning text-dark fw-bold" style="font-size: 0.72rem;">${escapeHtml(item.user_role)}</span>
                </div>
                <div class="d-flex align-items-center gap-2 flex-wrap text-white-50 small">
                  <span class="badge bg-secondary-subtle text-light border border-secondary border-opacity-25" style="font-size: 0.72rem;">
                    <i class="bi bi-diagram-3 me-1 text-gold"></i>${escapeHtml(item.user_department)}
                  </span>
                  <span class="badge bg-secondary-subtle text-light border border-secondary border-opacity-25" style="font-size: 0.72rem;">
                    <i class="bi bi-geo-alt me-1 text-info"></i>${escapeHtml(item.church_name)}
                  </span>
                  ${item.cell_name ? `
                    <span class="badge bg-secondary-subtle text-light border border-secondary border-opacity-25" style="font-size: 0.72rem;">
                      <i class="bi bi-house-door me-1 text-success"></i>${escapeHtml(item.cell_name)}
                    </span>
                  ` : ""}
                </div>
              </div>
            </div>

            <!-- Contacts -->
            <div class="d-flex align-items-center gap-2 flex-wrap">
              ${cleanPhone ? `
                <a href="https://wa.me/${cleanPhone}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline-success d-inline-flex align-items-center gap-1 rounded-pill px-3 py-1" style="font-size: 0.78rem;" title="Abrir conversa no WhatsApp">
                  <i class="bi bi-whatsapp"></i>
                  <span>${escapeHtml(item.phone)}</span>
                </a>
              ` : ""}
              ${item.user_email ? `
                <a href="mailto:${escapeAttr(item.user_email)}" class="btn btn-sm btn-outline-glass d-inline-flex align-items-center gap-1 rounded-pill px-3 py-1" style="font-size: 0.78rem;" title="Enviar email">
                  <i class="bi bi-envelope"></i>
                  <span>${escapeHtml(item.user_email)}</span>
                </a>
              ` : ""}
            </div>
          </div>
        </div>

        <!-- 3. Classification Strip -->
        <div class="d-flex gap-2 flex-wrap mb-3">
          <span class="badge bg-${typeMeta.color}-subtle text-${typeMeta.color} border border-${typeMeta.color} border-opacity-40 py-2 px-3 d-inline-flex align-items-center gap-1" style="font-size: 0.78rem;">
            <i class="bi ${typeMeta.icon || "bi-tag"}"></i>
            <span>${isPt ? typeMeta.labelPt : typeMeta.labelEn}</span>
          </span>

          <span class="badge bg-${priorityMeta.color}-subtle text-${priorityMeta.color} border border-${priorityMeta.color} border-opacity-40 py-2 px-3 d-inline-flex align-items-center gap-1" style="font-size: 0.78rem;">
            <i class="bi bi-flag-fill"></i>
            <span>${isPt ? "Prioridade" : "Priority"}: ${isPt ? priorityMeta.labelPt : priorityMeta.labelEn}</span>
          </span>

          <span class="badge bg-secondary-subtle text-white border border-secondary border-opacity-40 py-2 px-3 d-inline-flex align-items-center gap-1" style="font-size: 0.78rem;">
            <i class="bi ${moduleMeta.icon || "bi-app-indicator"} text-gold"></i>
            <span>${isPt ? "Módulo" : "Module"}: ${escapeHtml(isPt ? moduleMeta.labelPt : (moduleMeta.labelEn || moduleMeta.labelPt))}</span>
          </span>

          <span class="badge bg-${statusMeta.color}-subtle text-${statusMeta.color} border border-${statusMeta.color} border-opacity-40 py-2 px-3 d-inline-flex align-items-center gap-1" style="font-size: 0.78rem;">
            <i class="bi bi-info-circle"></i>
            <span>${isPt ? "Estado" : "Status"}: ${isPt ? statusMeta.labelPt : statusMeta.labelEn}</span>
          </span>
        </div>

        <!-- 4. Description Content Card -->
        <div class="card bg-dark bg-opacity-70 border-secondary border-opacity-30 p-3 mb-3 rounded-3 shadow-sm">
          <div class="d-flex align-items-center justify-content-between mb-2 pb-1 border-bottom border-secondary border-opacity-20">
            <div class="text-white-50 small fw-bold text-uppercase d-flex align-items-center gap-2">
              <i class="bi bi-card-text text-gold"></i>
              <span>${isPt ? "Descrição da Ocorrência / Sugestão" : "Detailed Description"}</span>
            </div>
            <span class="badge bg-dark text-white-50 border border-secondary border-opacity-25" style="font-size: 0.68rem;">${isPt ? "Texto do Autor" : "Reporter Text"}</span>
          </div>
          <div class="p-3 rounded-3 text-white" style="background: rgba(0,0,0,0.35); border: 1px solid rgba(255,255,255,0.06); font-size: 0.95rem; line-height: 1.65; white-space: pre-wrap;">
            ${escapeHtml(item.description)}
          </div>

          ${item.suggested_solution ? `
            <div class="mt-3 p-3 rounded-3" style="background: rgba(255, 193, 7, 0.05); border: 1px solid rgba(255, 193, 7, 0.25);">
              <div class="text-gold fw-semibold small mb-1 d-flex align-items-center gap-2">
                <i class="bi bi-lightbulb-fill text-warning"></i>
                <span>${isPt ? "Sugestão de Solução ou Passos para Reproduzir:" : "Suggested Solution / Steps:"}</span>
              </div>
              <div class="text-white-50" style="font-size: 0.9rem; line-height: 1.55; white-space: pre-wrap;">
                ${escapeHtml(item.suggested_solution)}
              </div>
            </div>
          ` : ""}
        </div>

        <!-- 5. Attachments Gallery (if any) -->
        ${item.attachments && item.attachments.length > 0 ? `
          <div class="card bg-dark bg-opacity-70 border-secondary border-opacity-30 p-3 mb-3 rounded-3 shadow-sm">
            <div class="text-white-50 small fw-bold text-uppercase d-flex align-items-center gap-2 mb-2 pb-1 border-bottom border-secondary border-opacity-20">
              <i class="bi bi-paperclip text-gold"></i>
              <span>${isPt ? "Ficheiros e Imagens Anexados" : "Attached Files & Images"} (${item.attachments.length})</span>
            </div>
            <div class="row g-2">
              ${item.attachments.map((att) => {
                const isImg = att.type?.startsWith("image/") || (att.data && String(att.data).startsWith("data:image/"));
                const fileSize = att.size ? (att.size < 1024 * 1024 ? Math.round(att.size / 1024) + " KB" : (att.size / (1024 * 1024)).toFixed(1) + " MB") : "";
                if (isImg) {
                  return `
                    <div class="col-6 col-md-4 col-lg-3">
                      <div class="card bg-dark border-secondary border-opacity-40 p-2 text-center h-100 shadow-sm rounded-3">
                        <a href="${att.data}" target="_blank" rel="noopener noreferrer" class="d-block overflow-hidden rounded mb-1" style="height: 110px; background: rgba(0,0,0,0.5);" title="${escapeAttr(att.name)}">
                          <img src="${att.data}" alt="${escapeAttr(att.name)}" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.2s;">
                        </a>
                        <div class="small text-truncate text-white fw-semibold" style="font-size: 0.78rem;" title="${escapeAttr(att.name)}">${escapeHtml(att.name)}</div>
                        <div class="d-flex justify-content-between align-items-center mt-1">
                          <span class="badge text-bg-secondary text-white-50" style="font-size: 0.65rem;">${fileSize}</span>
                          <a href="${att.data}" download="${escapeAttr(att.name)}" class="btn btn-sm btn-outline-glass py-0 px-2" style="font-size: 0.7rem;" title="${isPt ? "Descarregar" : "Download"}">
                            <i class="bi bi-download"></i>
                          </a>
                        </div>
                      </div>
                    </div>
                  `;
                } else {
                  return `
                    <div class="col-12 col-md-6">
                      <div class="card bg-dark border-secondary border-opacity-40 p-2 h-100 shadow-sm rounded-3">
                        <div class="d-flex align-items-center gap-2">
                          <div class="rounded p-2 bg-secondary bg-opacity-25 text-gold fs-4 flex-shrink-0">
                            <i class="bi bi-file-earmark-text"></i>
                          </div>
                          <div class="flex-grow-1 overflow-hidden">
                            <div class="small text-truncate text-white fw-semibold" title="${escapeAttr(att.name)}">${escapeHtml(att.name)}</div>
                            <span class="badge text-bg-secondary text-white-50" style="font-size: 0.68rem;">${fileSize}</span>
                          </div>
                          <a href="${att.data}" download="${escapeAttr(att.name)}" class="btn btn-sm btn-outline-glass d-inline-flex align-items-center gap-1 py-1 px-2" style="font-size: 0.75rem;" title="${isPt ? "Descarregar" : "Download"}">
                            <i class="bi bi-download"></i>
                            <span class="d-none d-sm-inline">${isPt ? "Baixar" : "Download"}</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  `;
                }
              }).join("")}
            </div>
          </div>
        ` : ""}

        <!-- 6. Management Panel (For Super Admin / Heads / Pastor) -->
        ${canManageFeedback() ? `
          <div class="card bg-dark bg-opacity-80 border-warning border-opacity-30 p-3 mb-3 rounded-3 shadow-sm" style="background: linear-gradient(165deg, rgba(20,28,45,0.92), rgba(12,18,32,0.98)); border-left: 4px solid #ffc107 !important;">
            <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 pb-2 mb-3 border-bottom border-secondary border-opacity-25">
              <div class="d-flex align-items-center gap-2">
                <div class="rounded-circle p-2 bg-warning bg-opacity-15 text-gold d-flex align-items-center justify-content-center" style="width: 34px; height: 34px;">
                  <i class="bi bi-shield-lock-fill"></i>
                </div>
                <div>
                  <h6 class="text-white fw-bold mb-0" style="font-size: 0.95rem;">${isPt ? "Painel de Resolução & Resposta da Liderança" : "Resolution & Admin Response"}</h6>
                  <small class="text-white-50" style="font-size: 0.72rem;">${isPt ? "Super Admin & Responsáveis de Departamento" : "Super Admin & Department Heads"}</small>
                </div>
              </div>

              <!-- Quick Status Transition Buttons -->
              <div class="d-flex align-items-center gap-1 flex-wrap">
                <button type="button" class="btn btn-sm btn-outline-info py-1 px-2 btn-quick-status" data-status="in_progress" style="font-size: 0.75rem;">
                  ⚡ ${isPt ? "Em Resolução" : "In Progress"}
                </button>
                <button type="button" class="btn btn-sm btn-outline-success py-1 px-2 btn-quick-status" data-status="resolved" style="font-size: 0.75rem;">
                  ✅ ${isPt ? "Marcar Resolvido" : "Mark Resolved"}
                </button>
                <button type="button" class="btn btn-sm btn-outline-secondary py-1 px-2 btn-quick-status" data-status="closed" style="font-size: 0.75rem;">
                  🔒 ${isPt ? "Fechar Ticket" : "Close Ticket"}
                </button>
              </div>
            </div>

            <div class="row g-3">
              <div class="col-12 col-md-6">
                <label class="form-label text-white small fw-semibold" for="modalUpdateStatus">
                  ${isPt ? "Actualizar Estado" : "Update Status"}
                </label>
                <select class="form-select bg-dark text-white border-secondary border-opacity-50" id="modalUpdateStatus">
                  <option value="pending" ${item.status === "pending" ? "selected" : ""}>⏳ ${isPt ? "Pendente" : "Pending"}</option>
                  <option value="in_review" ${item.status === "in_review" ? "selected" : ""}>🔍 ${isPt ? "Em Análise" : "In Review"}</option>
                  <option value="in_progress" ${item.status === "in_progress" ? "selected" : ""}>⚡ ${isPt ? "Em Desenvolvimento / Resolução" : "In Progress"}</option>
                  <option value="resolved" ${item.status === "resolved" ? "selected" : ""}>✅ ${isPt ? "Resolvido / Implementado" : "Resolved / Implemented"}</option>
                  <option value="closed" ${item.status === "closed" ? "selected" : ""}>🔒 ${isPt ? "Fechado / Rejeitado" : "Closed / Rejected"}</option>
                </select>
              </div>

              <div class="col-12 col-md-6">
                <label class="form-label text-white small fw-semibold" for="modalUpdatePriority">
                  ${isPt ? "Actualizar Prioridade" : "Update Priority"}
                </label>
                <select class="form-select bg-dark text-white border-secondary border-opacity-50" id="modalUpdatePriority">
                  <option value="low" ${item.priority === "low" ? "selected" : ""}>🟢 ${isPt ? "Baixa" : "Low"}</option>
                  <option value="medium" ${item.priority === "medium" ? "selected" : ""}>🔵 ${isPt ? "Média" : "Medium"}</option>
                  <option value="high" ${item.priority === "high" ? "selected" : ""}>🟠 ${isPt ? "Alta" : "High"}</option>
                  <option value="urgent" ${item.priority === "urgent" ? "selected" : ""}>🔴 ${isPt ? "Crítica / Urgente" : "Urgent"}</option>
                </select>
              </div>

              <div class="col-12">
                <label class="form-label text-white small fw-semibold" for="modalAdminNotes">
                  ${isPt ? "Resposta Oficial para o Autor / Notas da Liderança" : "Official Response / Leadership Notes"}
                </label>
                <textarea class="form-control bg-dark text-white border-secondary border-opacity-50" id="modalAdminNotes" rows="3" placeholder="${isPt ? "Escreva aqui a resposta oficial que o autor verá na plataforma, data prevista de implementação ou instruções..." : "Write official response to the reporter..."}">${escapeHtml(item.admin_notes || "")}</textarea>
              </div>
            </div>
          </div>
        ` : `
          <!-- 6b. Official Response View for Regular Users -->
          ${item.admin_notes ? `
            <div class="card bg-dark bg-opacity-70 border-success border-opacity-30 p-3 mb-3 rounded-3 shadow-sm" style="background: linear-gradient(165deg, rgba(14,35,25,0.85), rgba(10,22,16,0.95)); border-left: 4px solid #198754 !important;">
              <div class="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom border-success border-opacity-25">
                <div class="d-flex align-items-center gap-2">
                  <i class="bi bi-shield-check text-success fs-5"></i>
                  <h6 class="text-white fw-bold mb-0">${isPt ? "Resposta Oficial da Liderança" : "Official Leadership Response"}</h6>
                </div>
                ${item.resolved_by_name ? `
                  <span class="badge text-bg-success" style="font-size: 0.72rem;">
                    ${escapeHtml(item.resolved_by_name)} ${item.resolved_at ? `(${formatDate(item.resolved_at)})` : ""}
                  </span>
                ` : ""}
              </div>
              <div class="p-3 rounded-3 text-white" style="background: rgba(0,0,0,0.35); border: 1px solid rgba(25,135,84,0.3); font-size: 0.95rem; line-height: 1.6; white-space: pre-wrap;">
                ${escapeHtml(item.admin_notes)}
              </div>
            </div>
          ` : `
            <div class="card bg-dark bg-opacity-40 border-secondary border-opacity-20 p-3 mb-3 rounded-3 text-center">
              <span class="text-white-50 small fst-italic">
                <i class="bi bi-hourglass-split text-gold me-1"></i>
                ${isPt ? "Este feedback está na fila de triagem da liderança. Assim que houver um parecer oficial, a resposta aparecerá aqui." : "This feedback is under review. The official leadership response will appear here."}
              </span>
            </div>
          `}
        `}
      `;
    }

    // Attach quick status button listeners
    if (modalBody && canManageFeedback()) {
      modalBody.querySelectorAll(".btn-quick-status").forEach((btn) => {
        btn.addEventListener("click", () => {
          const targetStatus = btn.dataset.status;
          const statusSelect = document.getElementById("modalUpdateStatus");
          if (statusSelect && targetStatus) {
            statusSelect.value = targetStatus;
            btn.classList.add("active");
            setTimeout(() => btn.classList.remove("active"), 500);
          }
        });
      });
    }

    if (modalFooter) {
      modalFooter.innerHTML = `
        <div class="d-flex align-items-center justify-content-between w-100">
          <div>
            ${canDeleteFeedback() ? `
              <button type="button" class="btn btn-outline-danger btn-sm d-inline-flex align-items-center gap-1" id="btnDeleteFeedbackFromDetail" data-id="${item.id}">
                <i class="bi bi-trash3"></i>
                <span>${isPt ? "Eliminar" : "Delete"}</span>
              </button>
            ` : `<div></div>`}
          </div>
          <div class="d-flex align-items-center gap-2">
            <button type="button" class="btn btn-outline-glass" data-bs-dismiss="modal">${isPt ? "Fechar" : "Close"}</button>
            ${canManageFeedback() ? `
              <button type="button" class="btn btn-ce-gold d-inline-flex align-items-center gap-2 shadow-sm" id="btnSaveFeedbackUpdate">
                <i class="bi bi-check2-circle"></i>
                <span>${isPt ? "Guardar Resposta & Actualizar" : "Save Changes"}</span>
              </button>
            ` : ""}
          </div>
        </div>
      `;

      // Save update handler
      document.getElementById("btnSaveFeedbackUpdate")?.addEventListener("click", () => {
        const newStatus = document.getElementById("modalUpdateStatus")?.value || item.status;
        const newPrio = document.getElementById("modalUpdatePriority")?.value || item.priority;
        const notes = document.getElementById("modalAdminNotes")?.value || "";

        const reviewerUser = (typeof window !== "undefined") ? window.activeUser : null;
        const reviewerName = reviewerUser?.name || reviewerUser?.full_name || "Administração";

        const patch = {
          status: newStatus,
          priority: newPrio,
          admin_notes: notes
        };

        if (newStatus === "resolved" || newStatus === "closed") {
          patch.resolved_by_name = reviewerName;
          patch.resolved_at = new Date().toISOString();
        }

        window.CEFeedback.updateFeedback(item.id, patch);

        const modalEl = document.getElementById("feedbackDetailModal");
        showFeedbackToast(isPt ? "Feedback actualizado com sucesso!" : "Feedback updated successfully!");
        safeHideModal(modalEl, () => {
          renderFeedback();
        });
      });

      // Delete handler
      document.getElementById("btnDeleteFeedbackFromDetail")?.addEventListener("click", () => {
        const confirmMsg = isPt
          ? `Tem certeza de que deseja eliminar o feedback ${item.ticket_number}?`
          : `Are you sure you want to delete feedback ${item.ticket_number}?`;
        if (confirm(confirmMsg)) {
          window.CEFeedback.deleteFeedback(item.id);
          const modalEl = document.getElementById("feedbackDetailModal");
          showFeedbackToast(isPt ? "Feedback eliminado." : "Feedback deleted.");
          safeHideModal(modalEl, () => {
            renderFeedback();
          });
        }
      });
    }

    const modalEl = document.getElementById("feedbackDetailModal");
    if (modalEl && window.bootstrap?.Modal) {
      window.bootstrap.Modal.getOrCreateInstance(modalEl).show();
    }
  }

    // ==========================================
  // EXPORT FUNCTIONS: EXCEL, CSV, PRINT/PDF
  // ==========================================

  function getExportRows(items, isPt) {
    const headers = [
      isPt ? "Código / Ticket" : "Ticket Code",
      isPt ? "Data de Submissão" : "Submission Date",
      isPt ? "Tipo de Feedback" : "Feedback Type",
      isPt ? "Prioridade" : "Priority",
      isPt ? "Módulo / Área" : "Module / Area",
      isPt ? "Título" : "Title",
      isPt ? "Descrição" : "Description",
      isPt ? "Solução Sugerida" : "Suggested Solution",
      isPt ? "Autor" : "Reporter Name",
      isPt ? "Função Principal (Role)" : "Primary Role",
      isPt ? "Departamento Identificado" : "Department",
      isPt ? "Igreja" : "Church",
      isPt ? "Célula / Grupo" : "Cell / Group",
      isPt ? "Email" : "Email",
      isPt ? "Telefone" : "Phone",
      isPt ? "Estado" : "Status",
      isPt ? "Notas da Direção" : "Admin Notes",
      isPt ? "Resolvido Por" : "Resolved By",
      isPt ? "Data de Resolução" : "Resolution Date"
    ];

    const typeMap = {
      issue: isPt ? "Problema / Bug" : "Issue / Bug",
      suggestion: isPt ? "Sugestão de Melhoria" : "Suggestion",
      feature_request: isPt ? "Nova Funcionalidade" : "Feature Request",
      general: isPt ? "Geral / Outro" : "General"
    };

    const statusMap = {
      pending: isPt ? "Pendente" : "Pending",
      in_review: isPt ? "Em Análise" : "In Review",
      in_progress: isPt ? "Em Progresso" : "In Progress",
      resolved: isPt ? "Resolvido" : "Resolved",
      closed: isPt ? "Fechado" : "Closed"
    };

    const rows = items.map((item) => [
      item.ticket_number || "",
      formatDate(item.created_at),
      typeMap[item.feedback_type] || item.feedback_type || "",
      item.priority || "",
      item.category_module || "",
      item.title || "",
      item.description || "",
      item.suggested_solution || "",
      item.user_name || "",
      item.user_role || "",
      item.user_department || "",
      item.church_name || "",
      [item.cell_group_name, item.cell_name].filter(Boolean).join(" - "),
      item.user_email || "",
      item.phone || "",
      statusMap[item.status] || item.status || "",
      item.admin_notes || "",
      item.resolved_by_name || "",
      item.resolved_at ? formatDate(item.resolved_at) : ""
    ]);

    return { headers, rows };
  }

  function exportFeedbackExcel(items, isPt) {
    if (!items.length) {
      showFeedbackToast(isPt ? "Nenhum feedback para exportar." : "No feedback to export.", "error");
      return;
    }

    const { headers, rows } = getExportRows(items, isPt);
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `feedback-melhorias-ce-${dateStr}.xlsx`;

    // 1. SheetJS (.xlsx) if available
    if (typeof window !== "undefined" && window.XLSX && typeof window.XLSX.utils?.aoa_to_sheet === "function") {
      const aoa = [headers, ...rows];
      const ws = window.XLSX.utils.aoa_to_sheet(aoa);

      // Auto column widths
      ws["!cols"] = headers.map((h, i) => {
        let maxLen = h.length;
        rows.forEach((r) => {
          const val = String(r[i] || "");
          if (val.length > maxLen) maxLen = Math.min(val.length, 50);
        });
        return { wch: Math.max(maxLen + 3, 12) };
      });

      // Header autofilter & freeze
      const endColLetter = window.XLSX.utils.encode_col(headers.length - 1);
      ws["!autofilter"] = { ref: `A1:${endColLetter}${rows.length + 1}` };
      ws["!freeze"] = { ySplit: 1 };

      const wb = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(wb, ws, isPt ? "Feedbacks & Melhorias" : "Feedback");
      window.XLSX.writeFile(wb, filename);

      showFeedbackToast(isPt ? "Ficheiro Excel exportado com sucesso!" : "Excel file exported successfully!");
      return;
    }

    // 2. Fallback to CSV if XLSX library is not present
    exportFeedbackCsv(items, isPt);
  }

  function exportFeedbackCsv(items, isPt) {
    if (!items.length) {
      showFeedbackToast(isPt ? "Nenhum feedback para exportar." : "No feedback to export.", "error");
      return;
    }

    const { headers, rows } = getExportRows(items, isPt);
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `feedback-melhorias-ce-${dateStr}.csv`;

    const escapeCsv = (val) => {
      const str = String(val == null ? "" : val);
      if (str.includes(",") || str.includes(";") || str.includes("\n") || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvContent = "\uFEFF" + [
      headers.map(escapeCsv).join(";"),
      ...rows.map((r) => r.map(escapeCsv).join(";"))
    ].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showFeedbackToast(isPt ? "Ficheiro CSV exportado com sucesso!" : "CSV file exported successfully!");
  }

  function exportFeedbackPrint(items, isPt) {
    if (!items.length) {
      showFeedbackToast(isPt ? "Nenhum feedback para imprimir." : "No feedback to print.", "error");
      return;
    }

    const { headers, rows } = getExportRows(items, isPt);
    const adminUser = (typeof window !== "undefined" && window.activeUser?.name) || "Administração";
    const printDate = new Date().toLocaleDateString(isPt ? "pt-MZ" : "en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

    const issuesCount = items.filter((i) => i.feedback_type === "issue").length;
    const suggestionsCount = items.filter((i) => i.feedback_type === "suggestion" || i.feedback_type === "feature_request").length;
    const resolvedCount = items.filter((i) => i.status === "resolved").length;

    const html = `<!DOCTYPE html>
<html lang="${isPt ? "pt" : "en"}">
<head>
  <meta charset="UTF-8">
  <title>Christ Embassy Mozambique — Relatório de Feedback</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 0; padding: 20px; color: #0f172a; font-size: 11px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #002d62; padding-bottom: 12px; margin-bottom: 16px; }
    .brand h1 { margin: 0 0 4px 0; color: #002d62; font-size: 18px; text-transform: uppercase; font-weight: 800; }
    .brand p { margin: 0; color: #b45309; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .meta-box { text-align: right; color: #475569; font-size: 10px; }
    .meta-box strong { color: #0f172a; }
    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
    .summary-card { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px; }
    .summary-card .label { font-size: 9px; text-transform: uppercase; color: #64748b; font-weight: 700; display: block; margin-bottom: 2px; }
    .summary-card .val { font-size: 16px; font-weight: 800; color: #002d62; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 10px; }
    th { background: #002d62 !important; color: #ffffff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; text-align: left; padding: 6px 8px; font-size: 9.5px; font-weight: 700; text-transform: uppercase; border: 1px solid #002d62; }
    td { padding: 6px 8px; border: 1px solid #cbd5e1; color: #1e293b; font-size: 9.5px; }
    tr:nth-child(even) td { background: #f8fafc !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #cbd5e1; display: flex; justify-content: space-between; font-size: 9px; color: #64748b; }
    @media print {
      body { padding: 0; }
      th { background: #002d62 !important; color: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      tr:nth-child(even) td { background: #f8fafc !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <h1>Christ Embassy Mozambique</h1>
      <p>${isPt ? "Portal de Operações — Relatório Geral de Feedback & Sugestões" : "Operations Portal — General Feedback & Suggestions Report"}</p>
    </div>
    <div class="meta-box">
      <div>${isPt ? "Gerado por" : "Generated by"}: <strong>${escapeHtml(adminUser)}</strong></div>
      <div>${isPt ? "Data" : "Date"}: <strong>${printDate}</strong></div>
      <div>${isPt ? "Total Registos" : "Total Records"}: <strong>${items.length}</strong></div>
    </div>
  </div>

  <div class="summary-grid">
    <div class="summary-card">
      <span class="label">${isPt ? "Total Submetido" : "Total Submissions"}</span>
      <span class="val">${items.length}</span>
    </div>
    <div class="summary-card">
      <span class="label">${isPt ? "Problemas Reportados" : "Issues Reported"}</span>
      <span class="val">${issuesCount}</span>
    </div>
    <div class="summary-card">
      <span class="label">${isPt ? "Sugestões de Melhoria" : "Suggestions"}</span>
      <span class="val">${suggestionsCount}</span>
    </div>
    <div class="summary-card">
      <span class="label">${isPt ? "Resolvidos & Implementados" : "Resolved"}</span>
      <span class="val">${resolvedCount}</span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Ticket</th>
        <th>Data</th>
        <th>Tipo</th>
        <th>Título</th>
        <th>Autor & Função</th>
        <th>Departamento</th>
        <th>Igreja</th>
        <th>Estado</th>
      </tr>
    </thead>
    <tbody>
      ${items.map((i) => `
        <tr>
          <td><strong>${escapeHtml(i.ticket_number)}</strong></td>
          <td>${formatDate(i.created_at)}</td>
          <td>${escapeHtml(i.feedback_type)}</td>
          <td>${escapeHtml(i.title)}</td>
          <td><strong>${escapeHtml(i.user_name)}</strong> (${escapeHtml(i.user_role)})</td>
          <td>${escapeHtml(i.user_department)}</td>
          <td>${escapeHtml(i.church_name)}</td>
          <td>${escapeHtml(i.status)}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>

  <div class="footer">
    <span>Christ Embassy Mozambique Operations Portal © ${new Date().getFullYear()}</span>
    <span>${isPt ? "Página 1 de 1" : "Page 1 of 1"}</span>
  </div>
</body>
</html>`;

    const existing = document.getElementById("ceFeedbackPrintIframe");
    if (existing) existing.remove();

    const iframe = document.createElement("iframe");
    iframe.id = "ceFeedbackPrintIframe";
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.opacity = "0";
    iframe.style.zIndex = "-999";
    document.body.appendChild(iframe);

    try {
      const doc = iframe.contentWindow?.document || iframe.contentDocument;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        }, 350);
        return;
      }
    } catch (_) {}

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    if (win) {
      win.onload = () => {
        win.focus();
        win.print();
        URL.revokeObjectURL(url);
      };
    }
  }

  // Export module interface
  const CEFeedbackModule = {
    renderFeedback,
    exportFeedbackExcel,
    exportFeedbackCsv,
    exportFeedbackPrint
  };

  if (typeof window !== "undefined") {
    window.CEFeedbackModule = CEFeedbackModule;
    window.renderFeedback = renderFeedback;

    let syncRenderDebounce = null;
    function safeDebouncedFeedbackReRender() {
      if (window.activeRoute !== "feedback" || typeof window.renderFeedback !== "function") return;
      // CRITICAL: NEVER re-render if a modal is open or active!
      const isModalOpen = Boolean(
        document.querySelector("#newFeedbackModal.show") ||
        document.querySelector("#feedbackDetailModal.show") ||
        document.querySelector(".modal.show") ||
        document.body.classList.contains("modal-open")
      );
      if (isModalOpen) return;

      clearTimeout(syncRenderDebounce);
      syncRenderDebounce = setTimeout(() => {
        const stillModalOpen = Boolean(
          document.querySelector("#newFeedbackModal.show") ||
          document.querySelector("#feedbackDetailModal.show") ||
          document.querySelector(".modal.show") ||
          document.body.classList.contains("modal-open")
        );
        if (stillModalOpen) return;
        if (window.activeRoute === "feedback" && typeof window.renderFeedback === "function") {
          window.renderFeedback({ retainSearchFocus: true });
        }
      }, 400);
    }

    window.addEventListener("ce:languageChanged", function () {
      if (window.activeRoute === "feedback" && typeof window.renderFeedback === "function") {
        window.renderFeedback();
      }
    });

    window.addEventListener("ce:feedback-synced", safeDebouncedFeedbackReRender);
    window.addEventListener("ce:feedback-changed", safeDebouncedFeedbackReRender);
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = CEFeedbackModule;
  }
})();
