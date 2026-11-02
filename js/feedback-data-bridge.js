/**
 * User Feedback Data Bridge — Christ Embassy Mozambique Operations
 * Universal feedback repository accessible by every user role.
 * Captures user role, identifying department, and church context.
 * Dual-write: LocalStorage with realistic seeds + Supabase user_feedback table.
 */
(function () {
  "use strict";

  const STORAGE_KEY = "ce-data-layer:user-feedback";

  const DEPARTMENTS = [
    "Ministério de Células",
    "Finanças",
    "Mídia & Comunicação",
    "Património & Instalações",
    "Recursos Humanos",
    "Logística & Requisições",
    "Aconselhamento Pastoral",
    "Escola de Fundação",
    "Evangelismo & F.E.V.O",
    "Parcerias",
    "ALEC",
    "Gabinete Pastoral",
    "Administração Geral",
    "Geral / Outro"
  ];

  const FEEDBACK_TYPES = [
    { id: "issue", labelPt: "Problema / Erro no Sistema", labelEn: "System Issue / Bug", icon: "bi-exclamation-octagon", color: "danger" },
    { id: "suggestion", labelPt: "Sugestão de Melhoria", labelEn: "Improvement Suggestion", icon: "bi-lightbulb", color: "warning" },
    { id: "feature_request", labelPt: "Nova Funcionalidade", labelEn: "Feature Request", icon: "bi-stars", color: "info" },
    { id: "general", labelPt: "Feedback Geral / Outro", labelEn: "General Feedback", icon: "bi-chat-square-text", color: "secondary" }
  ];

  const FEEDBACK_PRIORITIES = [
    { id: "low", labelPt: "Baixa", labelEn: "Low", color: "secondary" },
    { id: "medium", labelPt: "Média", labelEn: "Medium", color: "info" },
    { id: "high", labelPt: "Alta", labelEn: "High", color: "warning" },
    { id: "urgent", labelPt: "Crítica / Urgente", labelEn: "Urgent", color: "danger" }
  ];

  const FEEDBACK_STATUSES = [
    { id: "pending", labelPt: "Pendente", labelEn: "Pending", color: "warning" },
    { id: "in_review", labelPt: "Em Análise", labelEn: "In Review", color: "info" },
    { id: "in_progress", labelPt: "Em Desenvolvimento", labelEn: "In Progress", color: "primary" },
    { id: "resolved", labelPt: "Resolvido / Implementado", labelEn: "Resolved / Implemented", color: "success" },
    { id: "closed", labelPt: "Fechado / Rejeitado", labelEn: "Closed / Rejected", color: "secondary" }
  ];

  const FEEDBACK_MODULES = [
    { id: "dashboard", labelPt: "Dashboard Geral", labelEn: "General Dashboard", icon: "bi-speedometer2" },
    { id: "cell", labelPt: "Ministério de Células & Relatórios", labelEn: "Cell Ministry", icon: "bi-diagram-3" },
    { id: "members", labelPt: "Gestão de Membros", labelEn: "Members", icon: "bi-people" },
    { id: "firstTimers", labelPt: "Primeiros Visitantes & Acompanhamento", labelEn: "First Timers", icon: "bi-person-heart" },
    { id: "finance", labelPt: "Finanças & Dízimos/Ofertas", labelEn: "Finance", icon: "bi-cash-coin" },
    { id: "partnership", labelPt: "Parcerias", labelEn: "Partnerships", icon: "bi-handshake" },
    { id: "requisitions", labelPt: "Requisições", labelEn: "Requisitions", icon: "bi-cart-check" },
    { id: "venueInventory", labelPt: "Património & Inventário", labelEn: "Venue & Inventory", icon: "bi-box-seam" },
    { id: "media", labelPt: "Mídia & Transmissão", labelEn: "Media", icon: "bi-camera-video" },
    { id: "staffHr", labelPt: "Recursos Humanos & Staff", labelEn: "Staff HR", icon: "bi-person-badge" },
    { id: "attendance", labelPt: "Ponto & Assiduidade", labelEn: "Attendance", icon: "bi-fingerprint" },
    { id: "foundation", labelPt: "Escola de Fundação", labelEn: "Foundation School", icon: "bi-mortarboard" },
    { id: "sacraments", labelPt: "Sacramentos", labelEn: "Sacraments", icon: "bi-heart-fill" },
    { id: "counseling", labelPt: "Aconselhamento Pastoral", labelEn: "Pastoral Counseling", icon: "bi-chat-heart" },
    { id: "programs", labelPt: "Programas & Eventos", labelEn: "Programs & Events", icon: "bi-calendar-event" },
    { id: "alec", labelPt: "ALEC", labelEn: "ALEC", icon: "bi-award" },
    { id: "fevo", labelPt: "Evangelismo & F.E.V.O", labelEn: "FEVO", icon: "bi-fire" },
    { id: "general", labelPt: "Geral / Toda a Plataforma", labelEn: "General Platform", icon: "bi-globe" }
  ];

  function resolveModuleMeta(moduleId) {
    const found = FEEDBACK_MODULES.find((m) => m.id === moduleId);
    if (found) return found;
    return {
      id: moduleId || "general",
      labelPt: moduleId === "general" ? "Geral / Toda a Plataforma" : (moduleId || "Geral"),
      labelEn: moduleId === "general" ? "General Platform" : (moduleId || "General"),
      icon: "bi-app-indicator"
    };
  }

  const SEED_FEEDBACK = [
    {
      id: "fb-seed-001",
      ticket_number: "FB-2026-0001",
      feedback_type: "suggestion",
      title: "Adicionar lembrete automático por SMS para reuniões de célula",
      description: "Seria de grande auxílio ter uma opção rápida de envio de lembrete com a pauta e o horário do encontro da célula directamente a partir da lista de membros da célula.",
      priority: "medium",
      category_module: "cell",
      status: "in_review",
      user_id: "u-cell-1",
      user_name: "Brother Lucas Macamo",
      user_email: "lucas.macamo@embaixadadecristo.org",
      user_role: "Cell Leader",
      user_department: "Ministério de Células",
      church_id: "a1111111-1111-4111-8111-111111111102",
      church_name: "Matola",
      cell_group_name: "Grupo Vitória",
      cell_name: "Célula Graça Abundante",
      phone: "+258 84 123 4567",
      suggested_solution: "Um botão 'Enviar Lembrete WhatsApp/SMS' no topo da ficha de reunião de célula.",
      admin_notes: "Excelente iniciativa. Em análise com a coordenação nacional para integração da gateway de mensagens.",
      resolved_by_name: "",
      resolved_at: null,
      created_at: "2026-09-15T09:30:00.000Z",
      updated_at: "2026-09-16T14:10:00.000Z"
    },
    {
      id: "fb-seed-002",
      ticket_number: "FB-2026-0002",
      feedback_type: "issue",
      title: "Falha intermitente ao carregar escala de serviço aos sábados",
      description: "Ao tentar submeter a escala dos operadores de câmera para o primeiro culto no sábado à tarde, o formulário por vezes exibe erro de ligação e requer recarregar a página.",
      priority: "high",
      category_module: "media",
      status: "in_progress",
      user_id: "u-media-2",
      user_name: "Sister Sara Mondlane",
      user_email: "sara.mondlane@embaixadadecristo.org",
      user_role: "Media Team Member",
      user_department: "Mídia & Comunicação",
      church_id: "a1111111-1111-4111-8111-111111111101",
      church_name: "Maputo HQ",
      cell_group_name: "",
      cell_name: "",
      phone: "+258 82 987 6543",
      suggested_solution: "Salvar um rascunho local automático para não perder os dados em caso de perda temporária de rede.",
      admin_notes: "Equipa de desenvolvimento já identificou timeout no endpoint de validação. Correção em teste.",
      resolved_by_name: "",
      resolved_at: null,
      created_at: "2026-09-20T16:45:00.000Z",
      updated_at: "2026-09-22T10:00:00.000Z"
    },
    {
      id: "fb-seed-003",
      ticket_number: "FB-2026-0003",
      feedback_type: "feature_request",
      title: "Exportação em lote de comprovativos de dízimo e parceria",
      description: "Gostaríamos de poder selecionar múltiplos lançamentos verificados de parceria e gerar um arquivo compactado ou PDF unificado com os recibos oficiais para envio aos parceiros.",
      priority: "medium",
      category_module: "finance",
      status: "resolved",
      user_id: "u-fin-1",
      user_name: "Brother Carlos Cossa",
      user_email: "carlos.cossa@embaixadadecristo.org",
      user_role: "Finance Officer",
      user_department: "Finanças",
      church_id: "a1111111-1111-4111-8111-111111111101",
      church_name: "Maputo HQ",
      cell_group_name: "",
      cell_name: "",
      phone: "+258 84 555 1212",
      suggested_solution: "Adicionar acção em lote 'Exportar Recibos PDF' na tabela de dízimos e parcerias.",
      admin_notes: "Módulo de exportação de recibos consolidado implementado com sucesso na versão de setembro.",
      resolved_by_name: "Admin Principal",
      resolved_at: "2026-09-28T11:20:00.000Z",
      created_at: "2026-09-10T11:15:00.000Z",
      updated_at: "2026-09-28T11:20:00.000Z"
    },
    {
      id: "fb-seed-004",
      ticket_number: "FB-2026-0004",
      feedback_type: "suggestion",
      title: "Filtro rápido por data de primeiro contacto no ecrã de consolidação",
      description: "Facilitaria muito o trabalho dos consolidadores se pudéssemos ordenar ou filtrar os novos convertidos pelos últimos 7, 14 ou 30 dias desde a primeira visita.",
      priority: "low",
      category_module: "followUp",
      status: "pending",
      user_id: "u-fu-1",
      user_name: "Sister Esperança Tembe",
      user_email: "esperanca.tembe@embaixadadecristo.org",
      user_role: "Follow-Up Coordinator",
      user_department: "Cuidados Pastorais",
      church_id: "a1111111-1111-4111-8111-111111111106",
      church_name: "Choupal",
      cell_group_name: "",
      cell_name: "",
      phone: "+258 86 333 4444",
      suggested_solution: "Pills de período rápido (Esta Semana, Últimos 14 Dias, Este Mês) no topo do painel de Acompanhamento.",
      admin_notes: "",
      resolved_by_name: "",
      resolved_at: null,
      created_at: "2026-10-02T08:00:00.000Z",
      updated_at: "2026-10-02T08:00:00.000Z"
    },
    {
      id: "fb-seed-005",
      ticket_number: "FB-2026-0005",
      feedback_type: "issue",
      title: "Alerta de manutenção preventiva não estava disparando",
      description: "Verificamos que equipamentos com periodicidade de manutenção bimestral não acionavam o aviso com antecedência de 48 horas.",
      priority: "high",
      category_module: "venueInventory",
      status: "resolved",
      user_id: "u-ven-1",
      user_name: "Marcelo Panguene",
      user_email: "marcelo.panguene@embaixadadecristo.org",
      user_role: "Venue Manager",
      user_department: "Património & Instalações",
      church_id: "a1111111-1111-4111-8111-111111111101",
      church_name: "Maputo HQ",
      cell_group_name: "",
      cell_name: "",
      phone: "+258 84 999 8888",
      suggested_solution: "Verificar o cálculo de datas no cron job de notificações do inventário.",
      admin_notes: "Corrigida a lógica de cálculo de fuso horário UTC para horário de Moçambique (CAT).",
      resolved_by_name: "Super Admin",
      resolved_at: "2026-10-05T15:00:00.000Z",
      created_at: "2026-10-03T10:30:00.000Z",
      updated_at: "2026-10-05T15:00:00.000Z"
    },
    {
      id: "fb-seed-006",
      ticket_number: "FB-2026-0006",
      feedback_type: "suggestion",
      title: "Campo de upload para certificado de formação no perfil do colaborador",
      description: "Seria muito positivo podermos carregar cópias de certificados de treinamentos e seminários de liderança dentro da aba de Documentos do Staff.",
      priority: "medium",
      category_module: "staffHr",
      status: "in_review",
      user_id: "u-hr-1",
      user_name: "Sister Joana Chissano",
      user_email: "joana.chissano@embaixadadecristo.org",
      user_role: "HR Manager",
      user_department: "Recursos Humanos",
      church_id: "a1111111-1111-4111-8111-111111111101",
      church_name: "Maputo HQ",
      cell_group_name: "",
      cell_name: "",
      phone: "+258 82 111 2233",
      suggested_solution: "Criar uma categoria 'Certificados & Formações' no repositório de documentos de RH.",
      admin_notes: "Apoiado. Será integrado na actualização do módulo de documentos.",
      resolved_by_name: "",
      resolved_at: null,
      created_at: "2026-10-08T13:20:00.000Z",
      updated_at: "2026-10-09T09:15:00.000Z"
    }
  ];

  function loadLocal() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_FEEDBACK));
        return [...SEED_FEEDBACK];
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_FEEDBACK));
      return [...SEED_FEEDBACK];
    } catch (_) {
      return [...SEED_FEEDBACK];
    }
  }

  function saveLocal(items) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn("[CE Feedback] Failed to save local items", e);
    }
  }

  function getSupabaseClient() {
    try {
      if (typeof window !== "undefined") {
        if (window.supabaseClient) return window.supabaseClient;
        if (typeof window.CESupabase?.getSupabaseClient === "function") {
          const c = window.CESupabase.getSupabaseClient();
          if (c) {
            window.supabaseClient = c;
            return c;
          }
        }
        if (window.CESupabase?.client) return window.CESupabase.client;
        if (window.supabase && typeof window.supabase.createClient === "function") {
          const env = window.__CE_ENV__ || {};
          const url = env.VITE_SUPABASE_URL || "https://api.embaixadadecristo.org";
          const key = env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzkxNDU0ODUzLCJleHAiOjIxMDY4MTQ4NTN9.xMLsM1EBKV-hJCWRsYjpXP91ESaq5Msns9FawCVMJh0";
          window.supabaseClient = window.supabase.createClient(url, key);
          return window.supabaseClient;
        }
      }
    } catch (_) {}
    return null;
  }

  let lastFeedbackSyncTime = 0;
  async function syncFeedbackFromSupabase(force = false) {
    const now = Date.now();
    if (!force && (now - lastFeedbackSyncTime < 30000)) {
      return loadLocal();
    }
    lastFeedbackSyncTime = now;
    const sb = getSupabaseClient();
    if (!sb || typeof sb.from !== "function") return loadLocal();
    try {
      const { data, error } = await sb.from("user_feedback").select("*").order("created_at", { ascending: false });
      if (!error && Array.isArray(data)) {
        const local = loadLocal();
        const prevKey = local.map((i) => (i.ticket_number || i.id) + ":" + (i.status || "") + ":" + (i.updated_at || "")).join("|");
        const map = new Map();
        data.forEach((r) => map.set(r.ticket_number || r.id, r));
        local.forEach((r) => {
          const k = r.ticket_number || r.id;
          if (!map.has(k)) map.set(k, r);
        });
        const merged = Array.from(map.values()).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        saveLocal(merged);
        const newKey = merged.map((i) => (i.ticket_number || i.id) + ":" + (i.status || "") + ":" + (i.updated_at || "")).join("|");

        if (prevKey !== newKey && typeof window !== "undefined" && typeof window.dispatchEvent === "function" && typeof CustomEvent !== "undefined") {
          window.dispatchEvent(new CustomEvent("ce:feedback-synced", { detail: { items: merged } }));
        }
        return merged;
      }
    } catch (e) {
      console.warn("[CE Feedback] syncFeedbackFromSupabase error", e);
    }
    return loadLocal();
  }

  /**
   * Intelligently resolves the active user's department identifying their operational unit.
   */
  function resolveUserDepartment(user) {
    if (!user) return "Geral / Operações";

    // 1. Explicit department name or assigned department
    if (user.department_name && typeof user.department_name === "string" && user.department_name.trim()) {
      return user.department_name.trim();
    }
    if (user.assigned_department && typeof user.assigned_department === "string" && user.assigned_department.trim()) {
      return user.assigned_department.trim();
    }

    // 2. Lookup in state.departments by user.department_id
    if (user.department_id && typeof window !== "undefined" && window.state?.departments) {
      const dept = window.state.departments.find((d) => d.id === user.department_id);
      if (dept?.name) return dept.name;
    }

    // 3. Lookup in staff_members if active
    if (typeof window !== "undefined" && window.state?.staff_members && user.email) {
      const staff = window.state.staff_members.find((s) => s.email && s.email.toLowerCase() === user.email.toLowerCase());
      if (staff?.department_name) return staff.department_name;
      if (staff?.department) return staff.department;
    }

    // 4. Role-based inference
    const role = String(user.role || user.role_name || "").toLowerCase().trim();
    const grants = user.department_permissions || [];

    if (role.includes("finance") || grants.includes("finance")) return "Finanças";
    if (role.includes("cell") || grants.includes("cell") || grants.includes("cellMinistry")) return "Ministério de Células";
    if (role.includes("media") || grants.includes("media")) return "Mídia & Comunicação";
    if (role.includes("venue") || role.includes("património") || grants.includes("venueInventory")) return "Património & Instalações";
    if (role.includes("hr") || role.includes("rh") || role.includes("attendance") || grants.includes("staffHr")) return "Recursos Humanos";
    if (role.includes("requisition") || grants.includes("requisitions")) return "Logística & Requisições";
    if (role.includes("counsel") || grants.includes("counseling")) return "Aconselhamento Pastoral";
    if (role.includes("foundation") || grants.includes("foundation")) return "Escola de Fundação";
    if (role.includes("fevo") || grants.includes("fevo")) return "Evangelismo & F.E.V.O";
    if (role.includes("partner") || grants.includes("partnership")) return "Parcerias";
    if (role.includes("alec") || grants.includes("alec")) return "ALEC";
    if (role.includes("pastor") || role.includes("pr.")) return "Gabinete Pastoral";
    if (role.includes("admin") || role.includes("super")) return "Administração Geral";

    return "Geral / Operações";
  }

  /**
   * Resolves the church name for display.
   */
  function resolveChurchName(churchId) {
    if (!churchId) return "Todas as Igrejas";
    if (typeof window !== "undefined") {
      const churches = window.state?.churches || [];
      const found = churches.find((c) => c.id === churchId || c.uuid === churchId);
      if (found?.name) return found.name;
    }
    return churchId;
  }

  /**
   * Evaluates if a given feedback item is accessible/visible to the active user.
   * Rules:
   * 1. Super Admin, National Admin, grants.includes("*"), or can_view_all_churches: Full visibility.
   * 2. Church Pastor / Church Admin: Can see feedbacks for their church, OR feedbacks they submitted.
   * 3. Department Head / Coordinator: Can see feedbacks matching their department, church, OR submitted by them.
   * 4. Regular staff, cell leader, volunteer, member: STRICT PRIVACY — can ONLY see feedback that they submitted.
   */
  function isFeedbackAccessibleToUser(item, user) {
    if (!user) return true;
    const role = String(user.role || user.role_name || "").toLowerCase().trim();
    const grants = user.department_permissions || [];

    // Full global oversight
    if (grants.includes("*") || role.includes("super admin") || role.includes("super_admin") || role.includes("national admin")) {
      return true;
    }

    const userId = String(user.id || "").trim();
    const userEmail = String(user.email || "").toLowerCase().trim();
    const itemUserId = String(item.user_id || "").trim();
    const itemUserEmail = String(item.user_email || "").toLowerCase().trim();

    const userName = String(user.name || user.full_name || "").toLowerCase().trim();
    const itemUserName = String(item.user_name || "").toLowerCase().trim();
    const isAuthor = (userId && itemUserId && userId === itemUserId) ||
                     (userEmail && itemUserEmail && userEmail === itemUserEmail) ||
                     (userName && itemUserName && userName === itemUserName);
    if (isAuthor) return true;

    // Church Pastor / Church Admin
    if (role.includes("pastor") || role.includes("church admin") || role.includes("church_admin")) {
      const userChurch = String(user.church_id || user.church || "").trim();
      const itemChurch = String(item.church_id || "").trim();
      if (userChurch && itemChurch && userChurch === itemChurch) return true;
      if (user.can_view_all_churches) return true;
      return false;
    }

    // Department Head / Coordinator
    if (role.includes("head") || role.includes("coordinator") || role.includes("diretor") || role.includes("director")) {
      const userDept = resolveUserDepartment(user);
      if (item.user_department && userDept && item.user_department.toLowerCase() === userDept.toLowerCase()) return true;
      const userChurch = String(user.church_id || user.church || "").trim();
      const itemChurch = String(item.church_id || "").trim();
      if (userChurch && itemChurch && userChurch === itemChurch) return true;
      return false;
    }

    // Regular users: strictly only their own submitted feedback
    return false;
  }

  function getFeedbackList(filters = {}, user = (typeof window !== "undefined" ? window.activeUser : null)) {
    let items = loadLocal();

    // Apply User Privacy & Scoping
    if (user) {
      items = items.filter((item) => isFeedbackAccessibleToUser(item, user));
    }

    // Apply filtering
    if (filters.search) {
      const q = String(filters.search).toLowerCase().trim();
      items = items.filter((item) =>
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.ticket_number && item.ticket_number.toLowerCase().includes(q)) ||
        (item.user_name && item.user_name.toLowerCase().includes(q)) ||
        (item.user_role && item.user_role.toLowerCase().includes(q)) ||
        (item.user_department && item.user_department.toLowerCase().includes(q)) ||
        (item.church_name && item.church_name.toLowerCase().includes(q))
      );
    }

    if (filters.type && filters.type !== "all") {
      items = items.filter((item) => item.feedback_type === filters.type);
    }

    if (filters.status && filters.status !== "all") {
      items = items.filter((item) => item.status === filters.status);
    }

    if (filters.priority && filters.priority !== "all") {
      items = items.filter((item) => item.priority === filters.priority);
    }

    if (filters.department && filters.department !== "all") {
      items = items.filter((item) => item.user_department === filters.department);
    }

    if (filters.role && filters.role !== "all") {
      items = items.filter((item) => item.user_role === filters.role);
    }

    if (filters.church_id && filters.church_id !== "all") {
      items = items.filter((item) => item.church_id === filters.church_id);
    }

    return items;
  }

  function getFeedbackById(id) {
    const items = loadLocal();
    return items.find((i) => i.id === id || i.ticket_number === id) || null;
  }

  function generateTicketNumber(existingItems) {
    const year = new Date().getFullYear();
    const count = existingItems.length + 1;
    return `FB-${year}-${String(count).padStart(4, "0")}`;
  }

  function createFeedback(payload, user = (typeof window !== "undefined" ? window.activeUser : null)) {
    const items = loadLocal();
    const now = new Date().toISOString();
    const ticketNumber = generateTicketNumber(items);

    const userDept = payload.user_department || resolveUserDepartment(user);
    const churchId = payload.church_id || user?.church_id || user?.church || "";
    const churchName = payload.church_name || resolveChurchName(churchId);
    const attachments = Array.isArray(payload.attachments) ? payload.attachments : [];

    const record = {
      id: (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function")
        ? crypto.randomUUID()
        : ("fb-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7)),
      ticket_number: ticketNumber,
      feedback_type: payload.feedback_type || "suggestion",
      title: (payload.title || "").trim(),
      description: (payload.description || "").trim(),
      priority: payload.priority || "medium",
      category_module: payload.category_module || "general",
      status: "pending",
      user_id: user?.id || null,
      user_name: user?.name || user?.full_name || "Membro da Equipa",
      user_email: user?.email || "",
      user_role: user?.role || user?.role_name || "Staff Member",
      user_department: userDept,
      church_id: churchId,
      church_name: churchName,
      cell_group_name: user?.cell_group_name || user?.cell_group || "",
      cell_name: user?.cell_name || user?.cell || "",
      phone: payload.phone || user?.phone || "",
      suggested_solution: (payload.suggested_solution || "").trim(),
      attachments: attachments,
      admin_notes: "",
      resolved_by_name: "",
      resolved_at: null,
      created_at: now,
      updated_at: now
    };

    items.unshift(record);
    saveLocal(items);

    // Asynchronous Supabase write
    const sb = getSupabaseClient();
    if (sb && typeof sb.from === "function") {
      try {
        const insertFeedback = sb.from("user_feedback").insert([record]);
        if (insertFeedback && typeof insertFeedback.then === "function") {
          insertFeedback.then(
            ({ error }) => {
              if (error) console.warn("[CE Feedback] Supabase insert warning:", error);
            },
            (err) => console.warn("[CE Feedback] Supabase insert rejected:", err)
          );
        }
      } catch (err) {
        console.warn("[CE Feedback] Supabase insert exception:", err);
      }
    }

    // Dual-write notification directly to Supabase public.notifications
    if (sb && typeof sb.from === "function") {
      try {
        const notifPayload = {
          title: `Novo Feedback: ${record.title}`,
          message: `[${record.user_department || "Geral"}] ${record.user_name} (${record.user_role}) submeteu o ticket ${record.ticket_number}: "${record.title}".`,
          type: record.priority === "urgent" ? "urgent" : "info",
          module: "feedback",
          entity_type: "feedback",
          entity_id: record.ticket_number || record.id,
          priority: record.priority || "normal",
          scope: "national",
          recipient_role: "Super Admin",
          action_url: "feedback",
          action_label: "Ver Feedback",
          is_read: false,
          metadata: {
            ticket_number: record.ticket_number,
            feedback_type: record.feedback_type,
            user_name: record.user_name,
            user_role: record.user_role,
            user_department: record.user_department,
            church_name: record.church_name,
            cell_name: record.cell_name,
            phone: record.phone
          }
        };
        const insertNotif = sb.from("notifications").insert([notifPayload]);
        if (insertNotif && typeof insertNotif.then === "function") {
          insertNotif.then(
            ({ error }) => {
              if (error) console.warn("[CE Feedback] Supabase notification insert warning:", error);
            },
            (err) => console.warn("[CE Feedback] Supabase notification insert rejected:", err)
          );
        }
      } catch (err) {
        console.warn("[CE Feedback] Supabase notification exception:", err);
      }
    }

    // Trigger Notification for Super Admin (in-app center + WhatsApp dispatch)
    try {
      if (typeof window !== "undefined" && typeof window.createNotification === "function") {
        window.createNotification({
          title: `Novo Feedback: ${record.title}`,
          message: `[${record.user_department || "Geral"}] ${record.user_name} (${record.user_role}) submeteu o ticket ${record.ticket_number}: "${record.title}".`,
          type: record.priority === "urgent" ? "urgent" : "info",
          module: "feedback",
          entity_type: "feedback",
          entity_id: record.ticket_number || record.id,
          priority: record.priority || "normal",
          scope: "national",
          recipient_role: "Super Admin",
          action_url: "feedback",
          action_label: "Ver Feedback",
          metadata: {
            ticket_number: record.ticket_number,
            feedback_type: record.feedback_type,
            user_name: record.user_name,
            user_role: record.user_role,
            user_department: record.user_department,
            church_name: record.church_name,
            cell_name: record.cell_name,
            phone: record.phone
          }
        });
      }
    } catch (notifErr) {
      console.warn("[CE Feedback] Failed to dispatch Super Admin notification", notifErr);
    }

    // Trigger local reactive listeners
    if (typeof window !== "undefined" && typeof window.dispatchEvent === "function" && typeof CustomEvent !== "undefined") {
      window.dispatchEvent(new CustomEvent("ce:feedback-changed", { detail: { action: "create", record } }));
    }

    return record;
  }

  function updateFeedback(id, patch, reviewer = (typeof window !== "undefined" ? window.activeUser : null)) {
    const items = loadLocal();
    const idx = items.findIndex((i) => i.id === id || i.ticket_number === id);
    if (idx === -1) return null;

    const existing = items[idx];
    const now = new Date().toISOString();

    const updated = {
      ...existing,
      ...patch,
      updated_at: now
    };

    if (patch.status === "resolved" && !existing.resolved_at) {
      updated.resolved_at = now;
      if (!updated.resolved_by_name) {
        updated.resolved_by_name = reviewer?.name || "Administração";
      }
    }

    items[idx] = updated;
    saveLocal(items);

    // Asynchronous Supabase update
    const sb = getSupabaseClient();
    if (sb && typeof sb.from === "function") {
      try {
        const updateQuery = sb.from("user_feedback")
          .update(updated)
          .eq("ticket_number", existing.ticket_number);
        if (updateQuery && typeof updateQuery.then === "function") {
          updateQuery.then(
            ({ error }) => {
              if (error) console.warn("[CE Feedback] Supabase update warning:", error);
            },
            (err) => console.warn("[CE Feedback] Supabase update rejected:", err)
          );
        }
      } catch (err) {
        console.warn("[CE Feedback] Supabase update exception:", err);
      }
    }

    if (typeof window !== "undefined" && typeof window.dispatchEvent === "function" && typeof CustomEvent !== "undefined") {
      window.dispatchEvent(new CustomEvent("ce:feedback-changed", { detail: { action: "update", record: updated } }));
    }

    return updated;
  }

  function deleteFeedback(id) {
    let items = loadLocal();
    const target = items.find((i) => i.id === id || i.ticket_number === id);
    if (!target) return false;

    items = items.filter((i) => i.id !== id && i.ticket_number !== id);
    saveLocal(items);

    const sb = getSupabaseClient();
    if (sb && typeof sb.from === "function") {
      try {
        const deleteQuery = sb.from("user_feedback")
          .delete()
          .eq("ticket_number", target.ticket_number);
        if (deleteQuery && typeof deleteQuery.then === "function") {
          deleteQuery.then(
            ({ error }) => {
              if (error) console.warn("[CE Feedback] Supabase delete warning:", error);
            },
            (err) => console.warn("[CE Feedback] Supabase delete rejected:", err)
          );
        }
      } catch (err) {
        console.warn("[CE Feedback] Supabase delete exception:", err);
      }
    }

    if (typeof window !== "undefined" && typeof window.dispatchEvent === "function" && typeof CustomEvent !== "undefined") {
      window.dispatchEvent(new CustomEvent("ce:feedback-changed", { detail: { action: "delete", id } }));
    }

    return true;
  }

  function getFeedbackStats(churchId = null, user = (typeof window !== "undefined" ? window.activeUser : null)) {
    const items = getFeedbackList({ church_id: churchId }, user);

    const total = items.length;
    const pending = items.filter((i) => i.status === "pending").length;
    const inReview = items.filter((i) => i.status === "in_review").length;
    const inProgress = items.filter((i) => i.status === "in_progress").length;
    const resolved = items.filter((i) => i.status === "resolved").length;
    const closed = items.filter((i) => i.status === "closed").length;

    const issues = items.filter((i) => i.feedback_type === "issue").length;
    const suggestions = items.filter((i) => i.feedback_type === "suggestion").length;
    const featureRequests = items.filter((i) => i.feedback_type === "feature_request").length;
    const general = items.filter((i) => i.feedback_type === "general").length;

    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    return {
      total,
      pending,
      inReview,
      inProgress,
      resolved,
      closed,
      issues,
      suggestions,
      featureRequests,
      general,
      resolutionRate
    };
  }

  // Export module globally
  const CEFeedback = {
    DEPARTMENTS,
    FEEDBACK_TYPES,
    FEEDBACK_PRIORITIES,
    FEEDBACK_STATUSES,
    FEEDBACK_MODULES,
    resolveModuleMeta,
    resolveUserDepartment,
    resolveChurchName,
    getFeedbackList,
    getFeedbackById,
    createFeedback,
    updateFeedback,
    deleteFeedback,
    getFeedbackStats,
    syncFeedbackFromSupabase
  };

  if (typeof window !== "undefined") {
    window.CEFeedback = CEFeedback;
    window.CEDataLayer = window.CEDataLayer || {};
    window.CEDataLayer.feedback = CEFeedback;
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = CEFeedback;
  }
})();
