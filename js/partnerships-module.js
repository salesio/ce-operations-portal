/**
 * Partnerships / Parcerias — analytics layer over verified financeRecords.
 * Does NOT duplicate finance data. Income only, Verified only.
 * Full CRUD for Partnership Arms with custom logo management & Supabase sync.
 */
(function (global) {
  const PARTNERSHIP_ARMS_SEED = [
    { id: "arm-healing", name: "Escola de Cura", description: "Escola de Cura e ministério de cura.", icon: "bi-heart-pulse", logo_url: "", monthly_goal: 15000, status: "Active", is_active: true },
    { id: "arm-rhapsody", name: "Rapsódia de Realidades", description: "Distribuição e parcerias de Rapsódia.", icon: "bi-book", logo_url: "", monthly_goal: 20000, status: "Active", is_active: true },
    { id: "arm-lw-sat", name: "Loveworld SAT", description: "Parceria Loveworld SAT (não é departamento).", icon: "bi-broadcast", logo_url: "", monthly_goal: 12000, status: "Active", is_active: true },
    { id: "arm-vision", name: "Construtores de Visão", description: "Apoio a projectos de visão e expansão.", icon: "bi-building", logo_url: "", monthly_goal: 25000, status: "Active", is_active: true },
    { id: "arm-interior", name: "Missões de Cidades do Interior", description: "Missões e alcance no interior.", icon: "bi-geo-alt", logo_url: "", monthly_goal: 10000, status: "Active", is_active: true },
    { id: "arm-reach-mz", name: "Alcançar Moçambique", description: "Campanhas nacionais de alcance.", icon: "bi-flag", logo_url: "", monthly_goal: 18000, status: "Active", is_active: true },
    { id: "arm-church-project", name: "Projecto da Igreja", description: "Projectos locais da igreja.", icon: "bi-house-heart", logo_url: "", monthly_goal: 15000, status: "Active", is_active: true },
    { id: "arm-construction", name: "Projecto de Construção de Igreja", description: "Construção e infra-estrutura.", icon: "bi-bricks", logo_url: "", monthly_goal: 30000, status: "Active", is_active: true },
    { id: "arm-kids-rhapsody", name: "Rapsódias das Crianças", description: "Rapsódia infantil e ministério kids.", icon: "bi-emoji-smile", logo_url: "", monthly_goal: 8000, status: "Active", is_active: true },
    { id: "arm-cell-mandate", name: "Mandato de Célula", description: "Mandato e crescimento celular.", icon: "bi-diagram-3", logo_url: "", monthly_goal: 10000, status: "Active", is_active: true },
    { id: "arm-other", name: "Outros Braços", description: "Outras parcerias e projectos.", icon: "bi-stars", logo_url: "", monthly_goal: 5000, status: "Active", is_active: true }
  ];

  const PARTNERSHIP_ICONS = [
    { icon: "bi-stars", label: "Estrelas / Geral" },
    { icon: "bi-heart-pulse", label: "Cura / Saúde" },
    { icon: "bi-book", label: "Livro / Rapsódia" },
    { icon: "bi-broadcast", label: "Transmissão / TV" },
    { icon: "bi-building", label: "Edifício / Estrutura" },
    { icon: "bi-geo-alt", label: "Missões / Localização" },
    { icon: "bi-flag", label: "Bandeira / Nacional" },
    { icon: "bi-house-heart", label: "Igreja Local" },
    { icon: "bi-bricks", label: "Construção" },
    { icon: "bi-emoji-smile", label: "Crianças / Kids" },
    { icon: "bi-diagram-3", label: "Células" },
    { icon: "bi-cash-coin", label: "Finanças / Doação" },
    { icon: "bi-globe", label: "Global / Internacional" },
    { icon: "bi-people", label: "Comunidade" },
    { icon: "bi-trophy", label: "Conquistas" },
    { icon: "bi-award", label: "Reconhecimento" },
    { icon: "bi-lightbulb", label: "Inovação / Visão" },
    { icon: "bi-hand-thumbs-up", label: "Apoio / Serviço" }
  ];

  const partnershipPageState = {
    tab: "overview",
    armId: "",
    churchId: "",
    partnerQuery: "",
    period: "month",
    statusFilter: "",
    methodFilter: "",
    minAmount: "",
    maxAmount: ""
  };

  function t(key, fallback) {
    return typeof L === "function" ? (L(key) !== key ? L(key) : fallback || key) : (fallback || key);
  }

  function isPt() {
    return typeof lang !== "undefined" ? lang === "pt" : true;
  }

  function getSupabaseClient() {
    return (
      (typeof window !== "undefined" &&
        (window.CESupabase?.getRawClient?.() ||
          window.CESupabase?.getSupabaseFoundationClient?.() ||
          window.CESupabase?.getSupabaseClient?.() ||
          window.supabase)) ||
      null
    );
  }

  function getArms() {
    const stored =
      typeof state !== "undefined" && Array.isArray(state.partnershipArms) && state.partnershipArms.length
        ? state.partnershipArms
        : PARTNERSHIP_ARMS_SEED;
    return stored.map((arm) => ({
      logo_url: "",
      monthly_goal: 10000,
      status: "Active",
      is_active: true,
      icon: "bi-stars",
      created_at: "2026-01-01",
      updated_at: "2026-07-01",
      ...arm
    }));
  }

  function persistArmsState(arms) {
    if (typeof state !== "undefined") {
      state.partnershipArms = arms;
      try {
        const storageKey = typeof STORAGE_KEY !== "undefined" ? STORAGE_KEY : "ce_mozambique_state";
        localStorage.setItem(storageKey, JSON.stringify(state));
      } catch (err) {
        console.warn("[Partnerships] Could not persist to localStorage:", err);
      }
    }
  }

  async function hydratePartnershipArms() {
    const client = getSupabaseClient();
    if (!client) return;
    try {
      const { data, error } = await client
        .from("partnership_arms")
        .select("*")
        .order("created_at", { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) {
        persistArmsState(data);
        if (typeof activeRoute !== "undefined" && activeRoute === "partnership") {
          renderPartnerships();
        }
      } else if (!error && Array.isArray(data) && data.length === 0) {
        // Table exists but is empty -> seed initial arms
        const toSeed = PARTNERSHIP_ARMS_SEED.map((arm) => ({
          ...arm,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        await client.from("partnership_arms").upsert(toSeed);
        persistArmsState(toSeed);
      }
    } catch (err) {
      console.warn("[Partnerships] Hydration from Supabase skipped:", err);
    }
  }

  async function savePartnershipArmToSupabase(arm) {
    const client = getSupabaseClient();
    if (!client) return { success: true, offline: true };
    try {
      const payload = {
        id: arm.id,
        name: arm.name,
        description: arm.description || "",
        icon: arm.icon || "bi-stars",
        logo_url: arm.logo_url || null,
        monthly_goal: Number(arm.monthly_goal || 0),
        status: arm.status || "Active",
        is_active: arm.is_active !== false,
        updated_at: new Date().toISOString()
      };
      const { error } = await client.from("partnership_arms").upsert([payload]);
      if (error) {
        console.error("[Partnerships] Supabase upsert error:", error);
        return { success: false, error };
      }
      return { success: true };
    } catch (err) {
      console.error("[Partnerships] Supabase save error:", err);
      return { success: false, error: err };
    }
  }

  async function deletePartnershipArmFromSupabase(armId) {
    const client = getSupabaseClient();
    if (!client) return { success: true, offline: true };
    try {
      const { error } = await client.from("partnership_arms").delete().eq("id", armId);
      if (error) {
        console.error("[Partnerships] Supabase delete error:", error);
        return { success: false, error };
      }
      return { success: true };
    } catch (err) {
      console.error("[Partnerships] Supabase delete error:", err);
      return { success: false, error: err };
    }
  }

  function isVerifiedIncomeRecord(record) {
    if (!record) return false;
    const tx = String(record.transaction_type || "income").toLowerCase();
    if (tx === "expense") return false;
    const st = String(record.status || record.estado || "").toLowerCase();
    if (st.includes("pending") || st.includes("pendente")) return false;
    if (st.includes("reject") || st.includes("rejeit")) return false;
    if (st.includes("cancel")) return false;
    return st.includes("verif") || st.includes("inclu");
  }

  function isPartnershipRecord(record) {
    if (!isVerifiedIncomeRecord(record)) return false;
    const group = String(record.contribution_group || "").toLowerCase();
    if (group.includes("parcer") || group.includes("partner")) return true;
    if (record.partnership_arm_id || record.partnership_arm_name || record.partnership_arm) return true;
    const cat = String(record.contribution_category || record.categoria_da_contribuicao || record.category || "");
    return getArms().some((arm) => arm.name === cat || arm.id === record.partnership_arm_id);
  }

  function resolveArmId(record) {
    if (record.partnership_arm_id) return record.partnership_arm_id;
    const name =
      record.partnership_arm_name ||
      record.partnership_arm ||
      record.contribution_category ||
      record.categoria_da_contribuicao ||
      "";
    const found = getArms().find((a) => a.name === name || a.id === name);
    return found ? found.id : "arm-other";
  }

  function resolveArmName(record) {
    const arm = getArms().find((a) => a.id === resolveArmId(record));
    return arm?.name || record.partnership_arm_name || record.partnership_arm || record.contribution_category || "Outros Braços";
  }

  function recordDate(record) {
    return String(record.payment_date || record.data || record.created_at || "").slice(0, 10);
  }

  function amountOf(record) {
    return Number(record.amount ?? record.valor ?? 0);
  }

  function periodRange(periodKey) {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    if (periodKey === "year") {
      return { start: `${y}-01-01`, end: `${y}-12-31`, prevStart: `${y - 1}-01-01`, prevEnd: `${y - 1}-12-31` };
    }
    if (periodKey === "quarter") {
      const q = Math.floor(m / 3);
      const startM = String(q * 3 + 1).padStart(2, "0");
      const endM = String(q * 3 + 3).padStart(2, "0");
      const pq = q === 0 ? 3 : q - 1;
      const py = q === 0 ? y - 1 : y;
      return {
        start: `${y}-${startM}-01`,
        end: `${y}-${endM}-31`,
        prevStart: `${py}-${String(pq * 3 + 1).padStart(2, "0")}-01`,
        prevEnd: `${py}-${String(pq * 3 + 3).padStart(2, "0")}-31`
      };
    }
    // month default
    const mm = String(m + 1).padStart(2, "0");
    const prev = new Date(y, m - 1, 1);
    const pmm = String(prev.getMonth() + 1).padStart(2, "0");
    return {
      start: `${y}-${mm}-01`,
      end: `${y}-${mm}-31`,
      prevStart: `${prev.getFullYear()}-${pmm}-01`,
      prevEnd: `${prev.getFullYear()}-${pmm}-31`
    };
  }

  function inRange(dateStr, start, end) {
    const d = String(dateStr || "").slice(0, 10);
    if (!d) return false;
    if (start && d < start) return false;
    if (end && d > end) return false;
    return true;
  }

  function getPartnershipFinanceList() {
    const list =
      typeof getScopedFinanceList === "function"
        ? getScopedFinanceList()
        : ((typeof state !== "undefined" ? state.finance : []) || []).map((r) =>
            typeof migrateFinanceRecord === "function" ? migrateFinanceRecord(r) : r
          );
    return list.filter(isPartnershipRecord);
  }

  function getPendingPartnershipCount() {
    const list =
      typeof getScopedFinanceList === "function"
        ? getScopedFinanceList()
        : (typeof state !== "undefined" ? state.finance : []) || [];
    return list.filter((r) => {
      const st = String(r.status || r.estado || "").toLowerCase();
      const pending = st.includes("pending") || st.includes("pendente");
      if (!pending) return false;
      const group = String(r.contribution_group || "").toLowerCase();
      const cat = String(r.contribution_category || r.categoria_da_contribuicao || "");
      return group.includes("parcer") || r.partnership_arm_id || getArms().some((a) => a.name === cat);
    }).length;
  }

  function contributorKey(record) {
    if (typeof financeContributorKey === "function") return financeContributorKey(record);
    return [
      record.contributor_id || "",
      record.telefone || record.contributor_phone || "",
      (record.contributor_name || [record.nome, record.apelido].filter(Boolean).join(" ")).toLowerCase()
    ].join("|");
  }

  function getPartnershipArmPromotionStatus(arm, periodData) {
    const goal = Number(arm.monthly_goal || 0);
    const donorCount = Number(periodData.donor_count || 0);
    const total = Number(periodData.total_amount || 0);
    const growth = Number(periodData.growth_percent || 0);
    const daysSince = Number(periodData.days_since_last_donation || 999);
    const needs =
      donorCount < 3 ||
      (goal > 0 && total < goal * 0.4) ||
      growth < -20 ||
      daysSince > 30 ||
      total === 0;
    let label = isPt() ? "Estável" : "Stable";
    if (total === 0 || daysSince > 45) label = isPt() ? "Baixa Actividade" : "Low Activity";
    else if (needs) label = isPt() ? "Precisa de Promoção" : "Needs Promotion";
    else if (growth > 15 || (goal > 0 && total >= goal)) label = isPt() ? "Forte" : "Strong";
    return { needs_promotion: needs, status_label: label };
  }

  function daysSince(dateStr) {
    if (!dateStr) return 999;
    const t = Date.parse(dateStr);
    if (!t) return 999;
    return Math.floor((Date.now() - t) / 86400000);
  }

  function computeArmAnalytics(periodKey = partnershipPageState.period) {
    const range = periodRange(periodKey);
    const all = getPartnershipFinanceList();
    const current = all.filter((r) => inRange(recordDate(r), range.start, range.end));
    const previous = all.filter((r) => inRange(recordDate(r), range.prevStart, range.prevEnd));

    return getArms().map((arm) => {
      const armRecords = current.filter((r) => resolveArmId(r) === arm.id);
      const prevRecords = previous.filter((r) => resolveArmId(r) === arm.id);
      const totalAmount = armRecords.reduce((s, r) => s + amountOf(r), 0);
      const prevAmount = prevRecords.reduce((s, r) => s + amountOf(r), 0);
      const donors = new Set(armRecords.map(contributorKey));
      const amounts = armRecords.map(amountOf);
      const maxDonation = amounts.length ? Math.max(...amounts) : 0;
      const avgDonation = armRecords.length ? totalAmount / armRecords.length : 0;

      const allArmRecords = all.filter((r) => resolveArmId(r) === arm.id).sort((a, b) => (recordDate(b) > recordDate(a) ? 1 : -1));
      const lastDate = allArmRecords[0] ? recordDate(allArmRecords[0]) : "";

      const growth = prevAmount > 0 ? ((totalAmount - prevAmount) / prevAmount) * 100 : totalAmount > 0 ? 100 : 0;
      const goal = Number(arm.monthly_goal || 0);
      const progress = goal > 0 ? Math.min(100, Math.round((totalAmount / goal) * 100)) : 0;

      const promo = getPartnershipArmPromotionStatus(arm, {
        total_amount: totalAmount,
        donor_count: donors.size,
        growth_percent: growth,
        days_since_last_donation: daysSince(lastDate)
      });

      return {
        ...arm,
        total_amount: totalAmount,
        previous_amount: prevAmount,
        growth_percent: Math.round(growth),
        donor_count: donors.size,
        average_donation: Math.round(avgDonation),
        max_donation: maxDonation,
        last_donation_date: lastDate,
        days_since_last_donation: daysSince(lastDate),
        goal_progress: progress,
        records: armRecords,
        ...promo
      };
    });
  }

  function computePartners() {
    const list = getPartnershipFinanceList();
    const map = new Map();

    list.forEach((r) => {
      const key = contributorKey(r);
      const armName = resolveArmName(r);
      const amt = amountOf(r);
      const d = recordDate(r);
      if (!map.has(key)) {
        map.set(key, {
          contributor_name: r.contributor_name || [r.nome, r.apelido].filter(Boolean).join(" ") || (isPt() ? "Anónimo" : "Anonymous"),
          church_id: r.church_id || "",
          church_name: r.church_name || "",
          cell_group_name: r.cell_group_name || r.grupo_de_celula || "",
          cell_name: r.cell_name || r.celula || "",
          total_amount: 0,
          donation_count: 0,
          last_donation_date: "",
          arms_supported: new Set(),
          records: []
        });
      }
      const entry = map.get(key);
      entry.total_amount += amt;
      entry.donation_count += 1;
      entry.arms_supported.add(armName);
      entry.records.push(r);
      if (!entry.last_donation_date || d > entry.last_donation_date) {
        entry.last_donation_date = d;
      }
    });

    return Array.from(map.values())
      .map((p) => {
        const days = daysSince(p.last_donation_date);
        let status = isPt() ? "Activo" : "Active";
        if (p.donation_count <= 1 && days <= 45) status = isPt() ? "Novo" : "New";
        else if (days > 60) status = isPt() ? "Inactivo" : "Inactive";
        else if (days > 30 || p.donation_count < 2) status = isPt() ? "Precisa de Acompanhamento" : "Needs Follow-Up";
        return {
          ...p,
          arms_supported: Array.from(p.arms_supported),
          status
        };
      })
      .sort((a, b) => b.total_amount - a.total_amount);
  }

  function partnershipAccess() {
    const user = typeof activeUser !== "undefined" ? activeUser : null;
    const role = user?.role || "";
    const grants = user?.department_permissions || [];
    const isSuper = role === "Super Admin" || grants.includes("*");
    const hasDeptGrant = grants.includes("partnership") || grants.includes("partnerships") || grants.includes("finance");
    const canView = typeof canEnterRoute === "function" ? canEnterRoute("partnership") : true;
    const canEdit = isSuper || hasDeptGrant || ["National Admin", "Partnership Coordinator", "Finance Head"].includes(role);
    const canExport = isSuper || hasDeptGrant || ["Main Pastor", "National Admin", "Finance Head", "Finance Officer", "Church Pastor"].includes(role);
    return { canView, canEdit, canExport, role };
  }

  function tabDefs() {
    return [
      ["overview", isPt() ? "Visão Geral" : "Overview"],
      ["arms", isPt() ? "Braços de Parceria" : "Partnership Arms"],
      ["partners", isPt() ? "Parceiros" : "Partners"],
      ["contributions", isPt() ? "Contribuições" : "Contributions"],
      ["highlights", isPt() ? "Destaques" : "Highlights"],
      ["analytics", isPt() ? "Análise" : "Analytics"],
      ["reports", isPt() ? "Relatórios" : "Reports"],
      ["exports", isPt() ? "Exportações" : "Exports"]
    ];
  }

  function tabsHtml() {
    return `<div class="view-toggle light-surface mb-3 partnership-tabs" role="tablist">${tabDefs()
      .map(
        ([key, label]) =>
          `<button type="button" class="view-toggle-btn ${partnershipPageState.tab === key ? "active" : ""}" data-partnership-tab="${key}">${label}</button>`
      )
      .join("")}</div>`;
  }

  function moneyFmt(n) {
    return typeof money === "function" ? money(n) : `${Number(n || 0).toLocaleString("pt-MZ")} MZN`;
  }

  function badgeHtml(label, tone = "") {
    if (typeof badge === "function") return badge(label);
    return `<span class="badge ${tone}">${label}</span>`;
  }

  function armLogoHtml(arm) {
    if (arm.logo_url) {
      return `<img src="${arm.logo_url}" alt="${arm.name}" class="partnership-arm-logo" style="width: 3.5rem; height: 3.5rem; border-radius: 1rem; object-fit: cover; border: 1px solid rgba(215, 174, 75, 0.3);">`;
    }
    const initials = String(arm.name || "?")
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0] || "")
      .join("")
      .toUpperCase();
    return `<div class="partnership-arm-placeholder" title="${isPt() ? "Ícone padrão" : "Default icon"}"><i class="bi ${arm.icon || "bi-stars"}"></i><span>${initials}</span></div>`;
  }

  function summaryCardsHtml(arms, partners) {
    const total = arms.reduce((s, a) => s + a.total_amount, 0);
    const donors = partners.length;
    const byDonors = [...arms].sort((a, b) => b.donor_count - a.donor_count)[0];
    const byValue = [...arms].sort((a, b) => b.total_amount - a.total_amount)[0];
    const byLow = [...arms].filter((a) => a.is_active !== false).sort((a, b) => a.total_amount - b.total_amount)[0];
    const needsPromo = arms.filter((a) => a.needs_promotion).length;
    const newPartners = partners.filter((p) => /Novo|New/i.test(p.status)).length;
    const pending = getPendingPartnershipCount();
    const cards = [
      { icon: "bi-cash-coin", label: isPt() ? "Total Recebido em Parcerias" : "Total Partnership Income", value: moneyFmt(total), tab: "contributions" },
      { icon: "bi-people", label: isPt() ? "Total de Dadores" : "Total Donors", value: donors, tab: "partners" },
      { icon: "bi-person-hearts", label: isPt() ? "Braço com Mais Dadores" : "Arm with Most Donors", value: byDonors?.name || "-", tab: "arms", armId: byDonors?.id },
      { icon: "bi-trophy", label: isPt() ? "Braço com Maior Valor" : "Highest Value Arm", value: byValue?.name || "-", tab: "arms", armId: byValue?.id },
      { icon: "bi-graph-down", label: isPt() ? "Braço com Menor Valor" : "Lowest Value Arm", value: byLow?.name || "-", tab: "arms", armId: byLow?.id },
      { icon: "bi-megaphone", label: isPt() ? "Braços que Precisam de Promoção" : "Arms Needing Promotion", value: needsPromo, tab: "highlights" },
      { icon: "bi-person-plus", label: isPt() ? "Novos Parceiros Este Mês" : "New Partners This Month", value: newPartners, tab: "partners" },
      { icon: "bi-hourglass-split", label: isPt() ? "Contribuições Pendentes de Verificação" : "Pending Verification", value: pending, route: "finance" }
    ];

    return `<div class="row g-3 summary-cards-row mb-4">${cards
      .map(
        (c) => `
        <div class="col-6 col-md-4 col-xl-3">
          <article class="metric-card summary-card light-surface summary-card--clickable h-100" data-partnership-jump="${c.tab || ""}" data-partnership-arm="${c.armId || ""}" data-partnership-route="${c.route || ""}" role="button" tabindex="0" aria-label="${c.label}">
            <div class="metric-icon summary-card-icon"><i class="bi ${c.icon}"></i></div>
            <div class="summary-card-body">
              <span class="summary-card-label metric-label chart-label label">${c.label}</span>
              <strong class="summary-card-value metric-value">${c.value}</strong>
              <small class="summary-card-hint meta-text subtitle">${isPt() ? "Clique para ver detalhes" : "Click to view"}</small>
            </div>
          </article>
        </div>`
      )
      .join("")}</div>`;
  }

  function armCardsHtml(arms) {
    const access = partnershipAccess();
    return `<div class="row g-3 partnership-arm-grid">${arms
      .map((arm) => {
        const promoBadge = arm.needs_promotion
          ? `<span class="badge badge-promo">${isPt() ? "Precisa de Promoção" : "Needs Promotion"}</span>`
          : badgeHtml(arm.status_label || (arm.status === "Inactive" ? "Inactive" : "Active"));

        const editButtons = access.canEdit
          ? `<button type="button" class="btn btn-sm btn-outline-primary" data-partnership-arm-edit="${arm.id}" title="${isPt() ? "Editar Braço e Logotipo" : "Edit Arm & Logo"}"><i class="bi bi-pencil me-1"></i>${isPt() ? "Editar" : "Edit"}</button>
             <button type="button" class="btn btn-sm btn-outline-danger" data-partnership-arm-delete="${arm.id}" title="${isPt() ? "Eliminar Braço" : "Delete Arm"}"><i class="bi bi-trash"></i></button>`
          : "";

        return `
      <div class="col-12 col-md-6 col-xl-4">
        <article class="panel glass-panel partnership-arm-card h-100 d-flex flex-column justify-content-between" data-arm-id="${arm.id}">
          <div>
            <div class="partnership-arm-card-head">
              ${armLogoHtml(arm)}
              <div class="flex-grow-1">
                <span class="eyebrow">${isPt() ? "Braço de Parceria" : "Partnership Arm"}</span>
                <h3 class="mb-1 h5 fw-bold text-wrap">${arm.name}</h3>
                ${promoBadge}
              </div>
            </div>
            <p class="text-secondary small mb-2">${arm.description || (isPt() ? "Sem descrição adicional." : "No description.")}</p>
            <div class="partnership-arm-stats">
              <div><span>${isPt() ? "Total" : "Total"}</span><strong>${moneyFmt(arm.total_amount)}</strong></div>
              <div><span>${isPt() ? "Dadores" : "Donors"}</span><strong>${arm.donor_count}</strong></div>
              <div><span>${isPt() ? "Média" : "Average"}</span><strong>${moneyFmt(arm.average_donation)}</strong></div>
              <div><span>${isPt() ? "Maior" : "Largest"}</span><strong>${moneyFmt(arm.max_donation)}</strong></div>
              <div><span>${isPt() ? "Última" : "Last"}</span><strong>${arm.last_donation_date || "-"}</strong></div>
              <div><span>${isPt() ? "Crescimento" : "Growth"}</span><strong>${arm.growth_percent > 0 ? "+" : ""}${arm.growth_percent}%</strong></div>
            </div>
            <div class="d-flex justify-content-between align-items-center small text-secondary mb-1">
              <span>${isPt() ? "Meta Mensal:" : "Monthly Target:"} <strong>${moneyFmt(arm.monthly_goal)}</strong></span>
              <span class="fw-bold ${arm.goal_progress >= 100 ? "text-success" : "text-ce-gold"}">${arm.goal_progress}%</span>
            </div>
            <div class="progress partnership-goal-bar mb-3" role="progressbar" aria-valuenow="${arm.goal_progress}">
              <div class="progress-bar ${arm.goal_progress >= 100 ? "bg-success" : "bg-warning"}" style="width:${Math.min(100, arm.goal_progress)}%"></div>
            </div>
          </div>
          <div class="d-flex flex-wrap gap-2 pt-2 border-top border-secondary border-opacity-10">
            <button type="button" class="btn btn-sm btn-ce-gold" data-partnership-arm-detail="${arm.id}"><i class="bi bi-eye me-1"></i>${isPt() ? "Detalhes" : "Details"}</button>
            <button type="button" class="btn btn-sm btn-outline-cyan" data-partnership-arm-partners="${arm.id}"><i class="bi bi-people me-1"></i>${isPt() ? "Parceiros" : "Partners"}</button>
            <button type="button" class="btn btn-sm btn-outline-cyan" data-partnership-arm-report="${arm.id}"><i class="bi bi-bar-chart me-1"></i>${isPt() ? "Relatório" : "Report"}</button>
            ${editButtons}
          </div>
        </article>
      </div>`;
      })
      .join("")}</div>`;
  }

  function renderArmsTab(arms) {
    const access = partnershipAccess();
    const createBtn = access.canEdit
      ? `<button type="button" class="btn btn-ce-gold btn-sm d-flex align-items-center gap-1" data-partnership-arm-create><i class="bi bi-plus-lg"></i><span>${isPt() ? "Novo Braço de Parceria" : "New Partnership Arm"}</span></button>`
      : "";

    return `
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <h3 class="h5 mb-0">${isPt() ? "Braços de Parceria Cadastrados" : "Registered Partnership Arms"}</h3>
          <span class="small text-secondary">${arms.length} ${isPt() ? "braços configurados" : "configured arms"}</span>
        </div>
        ${createBtn}
      </div>
      ${armCardsHtml(arms)}`;
  }

  function partnersTableHtml(partners) {
    const rows = partners.map((p) => [
      p.contributor_name,
      typeof churchName === "function" ? churchName(p.church_id) : p.church_name || p.church_id || "-",
      p.cell_name || "-",
      p.arms_supported.join(", ") || "-",
      moneyFmt(p.total_amount),
      p.donation_count,
      p.last_donation_date || "-",
      badgeHtml(p.status)
    ]);
    if (typeof dataTable === "function") {
      return dataTable(
        [
          isPt() ? "Nome" : "Name",
          isPt() ? "Igreja" : "Church",
          isPt() ? "Célula" : "Cell",
          isPt() ? "Braços apoiados" : "Arms supported",
          isPt() ? "Total contribuído" : "Total given",
          isPt() ? "Nº contribuições" : "Gifts",
          isPt() ? "Última contribuição" : "Last gift",
          isPt() ? "Estado" : "Status"
        ],
        rows
      );
    }
    return `<p>${partners.length} partners</p>`;
  }

  function contributionsTableHtml(records) {
    const filtered = records.filter((r) => {
      if (partnershipPageState.armId && resolveArmId(r) !== partnershipPageState.armId) return false;
      if (partnershipPageState.churchId && r.church_id !== partnershipPageState.churchId) return false;
      if (partnershipPageState.methodFilter) {
        const m = r.payment_method || r.metodo_de_pagamento || "";
        if (m !== partnershipPageState.methodFilter) return false;
      }
      const amt = amountOf(r);
      if (partnershipPageState.minAmount !== "" && amt < Number(partnershipPageState.minAmount)) return false;
      if (partnershipPageState.maxAmount !== "" && amt > Number(partnershipPageState.maxAmount)) return false;
      if (partnershipPageState.partnerQuery) {
        const q = partnershipPageState.partnerQuery.toLowerCase();
        const name = (r.contributor_name || [r.nome, r.apelido].join(" ")).toLowerCase();
        if (!name.includes(q)) return false;
      }
      return true;
    });
    const rows = filtered.slice(0, 200).map((r) => [
      recordDate(r) || "-",
      r.contributor_name || [r.nome, r.apelido].filter(Boolean).join(" ") || "-",
      typeof churchName === "function" ? churchName(r.church_id) : r.church_name || "-",
      r.cell_group_name || r.grupo_de_celula || "-",
      r.cell_name || r.celula || "-",
      resolveArmName(r),
      moneyFmt(amountOf(r)),
      r.payment_method || r.metodo_de_pagamento || "-",
      badgeHtml(r.estado || r.status || "Verified"),
      r.source || r.source_type || "-",
      r.proof_file_name || r.imagem_envelope_ou_pop ? (isPt() ? "Sim" : "Yes") : "-",
      typeof actionButtons === "function"
        ? actionButtons([["view", "finance", r.id, isPt() ? "Ver" : "View"]])
        : ""
    ]);
    return typeof dataTable === "function"
      ? dataTable(
          [
            isPt() ? "Data" : "Date",
            isPt() ? "Parceiro" : "Partner",
            isPt() ? "Igreja" : "Church",
            isPt() ? "Grupo de Célula" : "Cell Group",
            isPt() ? "Célula" : "Cell",
            isPt() ? "Braço" : "Arm",
            isPt() ? "Valor" : "Amount",
            isPt() ? "Método" : "Method",
            isPt() ? "Estado" : "Status",
            isPt() ? "Origem" : "Source",
            isPt() ? "Comprovativo" : "Proof",
            isPt() ? "Acções" : "Actions"
          ],
          rows
        )
      : `<p>${filtered.length}</p>`;
  }

  function highlightsHtml(arms, partners) {
    const mostDonors = [...arms].sort((a, b) => b.donor_count - a.donor_count)[0];
    const mostValue = [...arms].sort((a, b) => b.total_amount - a.total_amount)[0];
    const mostGrowth = [...arms].sort((a, b) => b.growth_percent - a.growth_percent)[0];
    const least = [...arms].sort((a, b) => a.total_amount - b.total_amount)[0];
    const noRecent = arms.filter((a) => a.days_since_last_donation > 30 || !a.last_donation_date);
    const topPartner = partners[0];
    const promote = arms.filter((a) => a.needs_promotion);
    const items = [
      [isPt() ? "Braço com mais dadores" : "Most donors", mostDonors?.name || "-", `${mostDonors?.donor_count || 0}`],
      [isPt() ? "Maior valor recebido" : "Highest value", mostValue?.name || "-", moneyFmt(mostValue?.total_amount || 0)],
      [isPt() ? "Maior crescimento" : "Highest growth", mostGrowth?.name || "-", `${mostGrowth?.growth_percent || 0}%`],
      [isPt() ? "Menor contribuição" : "Lowest contribution", least?.name || "-", moneyFmt(least?.total_amount || 0)],
      [isPt() ? "Sem contribuição recente" : "No recent gifts", String(noRecent.length), noRecent.map((a) => a.name).slice(0, 3).join(", ") || "-"],
      [isPt() ? "Parceiro em destaque" : "Featured partner", topPartner?.contributor_name || "-", moneyFmt(topPartner?.total_amount || 0)],
      [isPt() ? "Braços a promover esta semana" : "Promote this week", String(promote.length), promote.map((a) => a.name).slice(0, 4).join(", ") || "-"]
    ];
    return `<div class="row g-3">${items
      .map(
        ([title, value, sub]) => `
      <div class="col-12 col-md-6 col-xl-4">
        <article class="panel glass-panel h-100">
          <span class="eyebrow">${title}</span>
          <h3 class="mt-2">${value}</h3>
          <p class="text-secondary mb-0 small">${sub}</p>
        </article>
      </div>`
      )
      .join("")}</div>`;
  }

  function analyticsHtml(arms, partners) {
    const byValue = arms.map((a) => [a.name, a.total_amount]);
    const byDonors = arms.map((a) => [a.name, a.donor_count]);
    const topPartners = partners.slice(0, 10).map((p) => [p.contributor_name, p.total_amount]);
    const promote = arms.filter((a) => a.needs_promotion).map((a) => [a.name, a.total_amount]);
    const chart = typeof chartCard === "function" ? chartCard : null;
    if (!chart) {
      return partnersTableHtml(partners.slice(0, 10));
    }
    return `
      <div class="row g-4">
        <div class="col-xl-6">${chart(isPt() ? "Valor por Braço de Parceria" : "Value by Partnership Arm", byValue)}</div>
        <div class="col-xl-6">${chart(isPt() ? "Dadores por Braço" : "Donors by Arm", byDonors)}</div>
        <div class="col-xl-6">${chart(isPt() ? "Top Parceiros" : "Top Partners", topPartners)}</div>
        <div class="col-xl-6">${chart(isPt() ? "Braços que Precisam de Promoção" : "Arms Needing Promotion", promote.length ? promote : [[isPt() ? "Nenhum" : "None", 0]])}</div>
      </div>`;
  }

  function reportsHtml(arms, partners) {
    const access = partnershipAccess();
    const reports = [
      isPt() ? "Relatório geral de Parcerias" : "General Partnerships Report",
      isPt() ? "Relatório por braço" : "Report by arm",
      isPt() ? "Top parceiros" : "Top partners",
      isPt() ? "Braços que precisam de promoção" : "Arms needing promotion",
      isPt() ? "Contribuições por período" : "Contributions by period",
      isPt() ? "Parceiros por igreja" : "Partners by church",
      isPt() ? "Parcerias por célula" : "Partnerships by cell"
    ];
    return `<div class="row g-3">${reports
      .map(
        (title) => `
      <div class="col-md-6">
        <article class="panel glass-panel d-flex justify-content-between align-items-center gap-3">
          <div>
            <h3 class="h5 mb-1">${title}</h3>
            <p class="text-secondary small mb-0">${isPt() ? "Baseado em financeRecords verificados." : "Based on verified financeRecords."}</p>
          </div>
          ${access.canExport ? `<button type="button" class="btn btn-sm btn-ce-gold" data-partnership-export="report">${isPt() ? "Exportar" : "Export"}</button>` : ""}
        </article>
      </div>`
      )
      .join("")}</div>
      <div class="mt-4 panel glass-panel">
        <h3 class="h5">${isPt() ? "Resumo do período" : "Period summary"}</h3>
        <p class="mb-0">${isPt() ? "Total" : "Total"}: <strong>${moneyFmt(arms.reduce((s, a) => s + a.total_amount, 0))}</strong> ·
        ${isPt() ? "Parceiros" : "Partners"}: <strong>${partners.length}</strong> ·
        ${isPt() ? "Braços activos com doações" : "Arms with gifts"}: <strong>${arms.filter((a) => a.total_amount > 0).length}</strong></p>
      </div>`;
  }

  function exportsHtml() {
    const access = partnershipAccess();
    if (!access.canExport) {
      return `<div class="alert alert-info">${isPt() ? "Sem permissão de exportação." : "No export permission."}</div>`;
    }
    const formats = [
      ["csv", "CSV"],
      ["excel", isPt() ? "Excel" : "Excel"],
      ["pdf", "PDF"],
      ["print", isPt() ? "Imprimir" : "Print"]
    ];
    return `<div class="d-flex flex-wrap gap-2">${formats
      .map(
        ([key, label]) =>
          `<button type="button" class="btn btn-ce-gold" data-partnership-export="${key}"><i class="bi bi-download me-1"></i>${label}</button>`
      )
      .join("")}</div>
      <p class="text-secondary small mt-3 mb-0">${isPt() ? "Exporta contribuições de parceria verificadas do período actual." : "Exports verified partnership contributions for the current period."}</p>`;
  }

  function openArmDetail(armId) {
    const arms = computeArmAnalytics();
    const arm = arms.find((a) => a.id === armId);
    if (!arm) return;
    const partners = computePartners().filter((p) => p.arms_supported.includes(arm.name));
    const modalTitle = typeof byId === "function" ? byId("modalTitle") : null;
    const modalFields = typeof byId === "function" ? byId("modalFields") : null;
    const modalEyebrow = typeof byId === "function" ? byId("modalEyebrow") : null;
    if (!modalFields) return;
    if (modalEyebrow) modalEyebrow.textContent = isPt() ? "Braço de Parceria" : "Partnership Arm";
    if (modalTitle) modalTitle.textContent = arm.name;
    modalFields.innerHTML = `
      <div class="col-12">
        <div class="d-flex gap-3 align-items-center mb-3">
          ${armLogoHtml(arm)}
          <div>
            <p class="mb-1 text-secondary">${arm.description || ""}</p>
            ${arm.needs_promotion ? `<span class="badge badge-promo">${isPt() ? "Precisa de Promoção" : "Needs Promotion"}</span>` : badgeHtml(arm.status_label)}
          </div>
        </div>
        <div class="public-confirm-grid mb-3">
          <div><span>${isPt() ? "Total recebido" : "Total received"}</span><strong>${moneyFmt(arm.total_amount)}</strong></div>
          <div><span>${isPt() ? "Dadores" : "Donors"}</span><strong>${arm.donor_count}</strong></div>
          <div><span>${isPt() ? "Média" : "Average"}</span><strong>${moneyFmt(arm.average_donation)}</strong></div>
          <div><span>${isPt() ? "Maior doação" : "Largest gift"}</span><strong>${moneyFmt(arm.max_donation)}</strong></div>
          <div><span>${isPt() ? "Última doação" : "Last gift"}</span><strong>${arm.last_donation_date || "-"}</strong></div>
          <div><span>${isPt() ? "Meta mensal" : "Monthly goal"}</span><strong>${moneyFmt(arm.monthly_goal)} (${arm.goal_progress}%)</strong></div>
        </div>
        <h4 class="h6">${isPt() ? "Parceiros deste braço" : "Partners for this arm"}</h4>
        ${partnersTableHtml(partners.slice(0, 20))}
        <h4 class="h6 mt-3">${isPt() ? "Contribuições recentes" : "Recent contributions"}</h4>
        ${contributionsTableHtml(arm.records.slice(0, 30))}
      </div>`;
    if (typeof bootstrap !== "undefined" && byId("entryModal")) {
      bootstrap.Modal.getOrCreateInstance(byId("entryModal")).show();
    }
  }

  function getOrCreateArmModal() {
    let modalEl = document.getElementById("partnershipArmEditModal");
    if (!modalEl) {
      modalEl = document.createElement("div");
      modalEl.id = "partnershipArmEditModal";
      modalEl.className = "modal fade ops-modal-shell";
      modalEl.tabIndex = -1;
      modalEl.setAttribute("aria-hidden", "true");
      modalEl.innerHTML = `
        <div class="modal-dialog modal-lg modal-dialog-centered ops-modal-dialog">
          <form id="partnershipArmForm" class="modal-content ops-modal">
            <div class="modal-header ops-modal-header">
              <div>
                <span id="armModalEyebrow" class="eyebrow">${isPt() ? "Gestão de Parcerias" : "Partnership Management"}</span>
                <h5 id="armModalTitle" class="modal-title">${isPt() ? "Editar Braço de Parceria" : "Edit Partnership Arm"}</h5>
              </div>
              <button type="button" class="icon-btn ops-modal-close" data-bs-dismiss="modal" aria-label="Fechar">
                <i class="bi bi-x-lg" aria-hidden="true"></i>
              </button>
            </div>
            <div id="armModalFields" class="modal-body ops-modal-body row g-3">
              <!-- Dynamically populated -->
            </div>
            <div class="modal-footer ops-modal-footer d-flex justify-content-between">
              <button type="button" class="btn btn-outline-glass btn-touch" data-bs-dismiss="modal">${isPt() ? "Cancelar" : "Cancel"}</button>
              <button type="submit" class="btn btn-ce-gold btn-touch"><i class="bi bi-check-lg me-1"></i>${isPt() ? "Guardar Braço" : "Save Arm"}</button>
            </div>
          </form>
        </div>`;
      document.body.appendChild(modalEl);

      // Bind form submission once
      const form = modalEl.querySelector("#partnershipArmForm");
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const armId = form.dataset.armId || "";
        const name = form.querySelector("#armFormName")?.value.trim() || "";
        if (!name) {
          if (typeof showToast === "function") showToast(isPt() ? "Insira o nome do braço." : "Enter the arm name.", "error");
          return;
        }
        const description = form.querySelector("#armFormDesc")?.value.trim() || "";
        const monthly_goal = Number(form.querySelector("#armFormGoal")?.value || 10000);
        const icon = form.querySelector("#armFormIcon")?.value || "bi-stars";
        const status = form.querySelector("#armFormStatus")?.value || "Active";
        const logo_url = form.querySelector("#armFormLogoUrl")?.value.trim() || "";

        const currentArms = getArms();
        let targetArm = null;

        if (armId) {
          const index = currentArms.findIndex((a) => a.id === armId);
          if (index >= 0) {
            targetArm = {
              ...currentArms[index],
              name,
              description,
              monthly_goal,
              icon,
              status,
              is_active: status === "Active",
              logo_url,
              updated_at: new Date().toISOString()
            };
            currentArms[index] = targetArm;
          }
        }

        if (!targetArm) {
          const newId = `arm-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || Date.now()}`;
          targetArm = {
            id: newId,
            name,
            description,
            monthly_goal,
            icon,
            status,
            is_active: status === "Active",
            logo_url,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          currentArms.push(targetArm);
        }

        persistArmsState(currentArms);
        renderPartnerships();

        if (typeof bootstrap !== "undefined") {
          const bsModal = bootstrap.Modal.getInstance(modalEl);
          bsModal?.hide();
        }

        if (typeof showToast === "function") {
          showToast(isPt() ? "Braço de parceria guardado com sucesso!" : "Partnership arm saved successfully!", "success");
        }

        // Asynchronously sync to Supabase
        await savePartnershipArmToSupabase(targetArm);
      });
    }
    return modalEl;
  }

  function openPartnershipArmModal(armId = "") {
    const modalEl = getOrCreateArmModal();
    const currentArms = getArms();
    const arm = armId ? currentArms.find((a) => a.id === armId) : null;
    const form = modalEl.querySelector("#partnershipArmForm");
    form.dataset.armId = arm ? arm.id : "";

    const titleEl = modalEl.querySelector("#armModalTitle");
    const eyebrowEl = modalEl.querySelector("#armModalEyebrow");
    if (titleEl) titleEl.textContent = arm ? (isPt() ? `Editar: ${arm.name}` : `Edit: ${arm.name}`) : (isPt() ? "Novo Braço de Parceria" : "New Partnership Arm");
    if (eyebrowEl) eyebrowEl.textContent = arm ? (isPt() ? "Modificar Braço" : "Modify Arm") : (isPt() ? "Criar Braço" : "Create Arm");

    const iconOpts = PARTNERSHIP_ICONS.map(
      (opt) => `<option value="${opt.icon}" ${(arm?.icon || "bi-stars") === opt.icon ? "selected" : ""}>${opt.label} (${opt.icon})</option>`
    ).join("");

    const fieldsEl = modalEl.querySelector("#armModalFields");
    fieldsEl.innerHTML = `
      <div class="col-12 col-md-8">
        <label class="form-label required fw-bold">${isPt() ? "Nome do Braço de Parceria" : "Partnership Arm Name"}</label>
        <input type="text" id="armFormName" class="form-control" required value="${arm?.name || ""}" placeholder="${isPt() ? "Ex: Escola de Cura, Rapsódia de Realidades..." : "E.g. Healing School, Rhapsody..."}">
      </div>
      <div class="col-12 col-md-4">
        <label class="form-label fw-bold">${isPt() ? "Estado" : "Status"}</label>
        <select id="armFormStatus" class="form-select">
          <option value="Active" ${arm?.status !== "Inactive" ? "selected" : ""}>${isPt() ? "Activo" : "Active"}</option>
          <option value="Inactive" ${arm?.status === "Inactive" ? "selected" : ""}>${isPt() ? "Inactivo" : "Inactive"}</option>
        </select>
      </div>
      <div class="col-12">
        <label class="form-label fw-bold">${isPt() ? "Descrição e Objectivos" : "Description & Objectives"}</label>
        <textarea id="armFormDesc" class="form-control" rows="2" placeholder="${isPt() ? "Breve resumo do propósito deste braço de parceria..." : "Brief summary of this partnership arm..."}">${arm?.description || ""}</textarea>
      </div>
      <div class="col-12 col-md-6">
        <label class="form-label fw-bold">${isPt() ? "Meta Mensal (MZN)" : "Monthly Target (MZN)"}</label>
        <input type="number" id="armFormGoal" class="form-control" min="0" step="500" value="${arm?.monthly_goal ?? 10000}">
      </div>
      <div class="col-12 col-md-6">
        <label class="form-label fw-bold">${isPt() ? "Ícone de Fallback" : "Fallback Icon"}</label>
        <select id="armFormIcon" class="form-select">
          ${iconOpts}
        </select>
      </div>

      <!-- Logo Customization Box -->
      <div class="col-12">
        <div class="p-3 rounded border" style="background: rgba(15, 23, 42, 0.4); border-color: rgba(148, 163, 184, 0.2) !important;">
          <label class="form-label fw-bold d-flex justify-content-between align-items-center mb-2">
            <span><i class="bi bi-image me-1 text-warning"></i> ${isPt() ? "Logotipo do Braço de Parceria" : "Partnership Arm Logo"}</span>
            <span class="badge bg-secondary">${isPt() ? "Opcional" : "Optional"}</span>
          </label>
          
          <div class="d-flex flex-column flex-sm-row gap-3 align-items-center">
            <!-- Preview Box -->
            <div id="armFormLogoPreviewBox" class="d-flex flex-column align-items-center justify-content-center border rounded p-1 text-center" style="width: 5.5rem; height: 5.5rem; background: rgba(255, 255, 255, 0.05); flex-shrink: 0; overflow: hidden;">
              ${arm?.logo_url 
                ? `<img src="${arm.logo_url}" id="armFormLogoImg" style="width: 100%; height: 100%; object-fit: cover; border-radius: 0.5rem;">` 
                : `<i class="bi ${arm?.icon || "bi-stars"} fs-1 text-cyan" id="armFormLogoIcon"></i>`}
            </div>

            <div class="flex-grow-1 w-100">
              <div class="mb-2">
                <label class="small text-secondary mb-1">${isPt() ? "Carregar ficheiro de imagem (PNG, JPG, SVG, WebP)" : "Upload image file"}</label>
                <input type="file" id="armFormLogoFile" class="form-control form-control-sm" accept="image/*">
              </div>
              <div>
                <label class="small text-secondary mb-1">${isPt() ? "Ou introduzir URL da Imagem" : "Or enter Image URL"}</label>
                <div class="input-group input-group-sm">
                  <input type="url" id="armFormLogoUrl" class="form-control" placeholder="https://..." value="${arm?.logo_url || ""}">
                  <button type="button" class="btn btn-outline-danger" id="armFormClearLogoBtn" title="${isPt() ? "Remover Logotipo" : "Remove Logo"}"><i class="bi bi-trash"></i></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>`;

    // Bind image file reader & URL changer
    const fileInput = fieldsEl.querySelector("#armFormLogoFile");
    const urlInput = fieldsEl.querySelector("#armFormLogoUrl");
    const clearBtn = fieldsEl.querySelector("#armFormClearLogoBtn");
    const previewBox = fieldsEl.querySelector("#armFormLogoPreviewBox");
    const iconSelect = fieldsEl.querySelector("#armFormIcon");

    const updatePreview = () => {
      const url = urlInput.value.trim();
      const selectedIcon = iconSelect.value || "bi-stars";
      if (url) {
        previewBox.innerHTML = `<img src="${url}" id="armFormLogoImg" style="width: 100%; height: 100%; object-fit: cover; border-radius: 0.5rem;" onerror="this.onerror=null; this.parentElement.innerHTML='<i class=\\'bi ${selectedIcon} fs-1 text-danger\\'></i>';">`;
      } else {
        previewBox.innerHTML = `<i class="bi ${selectedIcon} fs-1 text-cyan" id="armFormLogoIcon"></i>`;
      }
    };

    if (fileInput) {
      fileInput.addEventListener("change", (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
          const result = evt.target?.result;
          if (result && typeof result === "string") {
            urlInput.value = result;
            updatePreview();
          }
        };
        reader.readAsDataURL(file);
      });
    }

    if (urlInput) {
      urlInput.addEventListener("input", updatePreview);
    }

    if (iconSelect) {
      iconSelect.addEventListener("change", updatePreview);
    }

    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        urlInput.value = "";
        if (fileInput) fileInput.value = "";
        updatePreview();
      });
    }

    if (typeof bootstrap !== "undefined") {
      bootstrap.Modal.getOrCreateInstance(modalEl).show();
    }
  }

  async function deletePartnershipArm(armId) {
    const currentArms = getArms();
    const arm = currentArms.find((a) => a.id === armId);
    if (!arm) return;

    const confirmMsg = isPt()
      ? `Tem a certeza que deseja eliminar o braço "${arm.name}"?\n(Os registos financeiros históricos em Finanças permanecerão intactos).`
      : `Are you sure you want to delete the arm "${arm.name}"?\n(Financial records in Finance will remain intact).`;

    if (!confirm(confirmMsg)) return;

    const updated = currentArms.filter((a) => a.id !== armId);
    persistArmsState(updated);
    renderPartnerships();

    if (typeof showToast === "function") {
      showToast(isPt() ? `Braço "${arm.name}" eliminado com sucesso.` : `Arm "${arm.name}" deleted.`, "success");
    }

    // Dual write deletion to Supabase
    await deletePartnershipArmFromSupabase(armId);
  }

  function exportData(format) {
    const range = periodRange(partnershipPageState.period);
    const list = getPartnershipFinanceList().filter((r) => inRange(recordDate(r), range.start, range.end));
    if (format === "print") {
      window.print();
      return;
    }
    const headers = ["date", "partner", "church", "arm", "amount", "method", "status", "source"];
    const lines = [headers.join(",")].concat(
      list.map((r) =>
        [
          recordDate(r),
          JSON.stringify(r.contributor_name || ""),
          JSON.stringify(r.church_name || r.igreja || ""),
          JSON.stringify(resolveArmName(r)),
          amountOf(r),
          JSON.stringify(r.payment_method || r.metodo_de_pagamento || ""),
          JSON.stringify(r.status || r.estado || ""),
          JSON.stringify(r.source || "")
        ].join(",")
      )
    );
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `parcerias-${range.start}-${format === "excel" ? "xlsx" : "csv"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function renderPartnerships(tab) {
    if (tab) partnershipPageState.tab = tab;
    if (typeof canEnterRoute === "function" && !canEnterRoute("partnership")) {
      if (typeof renderAccessDenied === "function") return renderAccessDenied();
    }
    const arms = computeArmAnalytics();
    const partners = computePartners();
    const range = periodRange(partnershipPageState.period);
    const contributions = getPartnershipFinanceList().filter((r) =>
      inRange(recordDate(r), range.start, range.end)
    );

    let body = "";
    switch (partnershipPageState.tab) {
      case "arms":
        body = renderArmsTab(arms);
        break;
      case "partners":
        body = partnersTableHtml(partners);
        break;
      case "contributions":
        body = `
          <div class="filter-toolbar light-surface mb-3 d-flex flex-wrap gap-2">
            <select class="form-select" style="max-width:12rem" data-partnership-filter="armId">
              <option value="">${isPt() ? "Todos os braços" : "All arms"}</option>
              ${getArms().map((a) => `<option value="${a.id}" ${partnershipPageState.armId === a.id ? "selected" : ""}>${a.name}</option>`).join("")}
            </select>
            <input class="form-control" style="max-width:12rem" placeholder="${isPt() ? "Parceiro…" : "Partner…"}" data-partnership-filter="partnerQuery" value="${partnershipPageState.partnerQuery || ""}">
            <input class="form-control" style="max-width:8rem" type="number" min="0" placeholder="${isPt() ? "Mín." : "Min"}" data-partnership-filter="minAmount" value="${partnershipPageState.minAmount || ""}">
            <input class="form-control" style="max-width:8rem" type="number" min="0" placeholder="${isPt() ? "Máx." : "Max"}" data-partnership-filter="maxAmount" value="${partnershipPageState.maxAmount || ""}">
          </div>
          ${contributionsTableHtml(contributions)}`;
        break;
      case "highlights":
        body = highlightsHtml(arms, partners);
        break;
      case "analytics":
        body = analyticsHtml(arms, partners);
        break;
      case "reports":
        body = reportsHtml(arms, partners);
        break;
      case "exports":
        body = exportsHtml();
        break;
      default:
        body = `${summaryCardsHtml(arms, partners)}${armCardsHtml(arms.slice(0, 6))}
          <div class="mt-4"><h3 class="h5">${isPt() ? "Top parceiros" : "Top partners"}</h3>${partnersTableHtml(partners.slice(0, 8))}</div>`;
    }

    const header =
      typeof sectionHeader === "function"
        ? sectionHeader(
            isPt() ? "Parcerias" : "Partnerships",
            isPt()
              ? "Visão analítica sobre contribuições de parceria verificadas em Finanças. Loveworld SAT é um braço de parceria."
              : "Analytics over verified partnership contributions from Finance. Loveworld SAT is a partnership arm.",
            null,
            "bi-stars"
          )
        : `<h1>${isPt() ? "Parcerias" : "Partnerships"}</h1>`;

    const periodSelect = `
      <div class="d-flex flex-wrap gap-2 mb-3 align-items-center">
        <label class="small fw-bold mb-0">${isPt() ? "Período" : "Period"}</label>
        <select class="form-select form-select-sm" style="max-width:10rem" data-partnership-filter="period">
          <option value="month" ${partnershipPageState.period === "month" ? "selected" : ""}>${isPt() ? "Este mês" : "This month"}</option>
          <option value="quarter" ${partnershipPageState.period === "quarter" ? "selected" : ""}>${isPt() ? "Trimestre" : "Quarter"}</option>
          <option value="year" ${partnershipPageState.period === "year" ? "selected" : ""}>${isPt() ? "Ano" : "Year"}</option>
        </select>
        <span class="small text-secondary">${isPt() ? "Fonte: financeRecords verificados (income)" : "Source: verified financeRecords (income)"}</span>
      </div>`;

    if (typeof setPageContent === "function") {
      setPageContent(`${header}${tabsHtml()}${periodSelect}<div class="partnership-body">${body}</div>`);
    }
  }

  if (typeof document !== "undefined" && document.addEventListener) {
    document.addEventListener("click", (event) => {
      const tabBtn = event.target.closest("[data-partnership-tab]");
      if (tabBtn) {
        partnershipPageState.tab = tabBtn.getAttribute("data-partnership-tab") || "overview";
        renderPartnerships();
        return;
      }
      const jump = event.target.closest("[data-partnership-jump]");
      if (jump) {
        const route = jump.getAttribute("data-partnership-route");
        if (route && typeof setRoute === "function") {
          setRoute(route);
          return;
        }
        const tab = jump.getAttribute("data-partnership-jump");
        const armId = jump.getAttribute("data-partnership-arm");
        if (armId) partnershipPageState.armId = armId;
        if (tab) partnershipPageState.tab = tab;
        renderPartnerships();
        return;
      }
      const detail = event.target.closest("[data-partnership-arm-detail]");
      if (detail) {
        openArmDetail(detail.getAttribute("data-partnership-arm-detail"));
        return;
      }
      const armCreate = event.target.closest("[data-partnership-arm-create]");
      if (armCreate) {
        openPartnershipArmModal("");
        return;
      }
      const armEdit = event.target.closest("[data-partnership-arm-edit]");
      if (armEdit) {
        openPartnershipArmModal(armEdit.getAttribute("data-partnership-arm-edit"));
        return;
      }
      const armDelete = event.target.closest("[data-partnership-arm-delete]");
      if (armDelete) {
        deletePartnershipArm(armDelete.getAttribute("data-partnership-arm-delete"));
        return;
      }
      const armPartners = event.target.closest("[data-partnership-arm-partners]");
      if (armPartners) {
        partnershipPageState.armId = armPartners.getAttribute("data-partnership-arm-partners") || "";
        partnershipPageState.tab = "partners";
        renderPartnerships();
        return;
      }
      const armReport = event.target.closest("[data-partnership-arm-report]");
      if (armReport) {
        partnershipPageState.armId = armReport.getAttribute("data-partnership-arm-report") || "";
        partnershipPageState.tab = "reports";
        renderPartnerships();
        return;
      }
      const exp = event.target.closest("[data-partnership-export]");
      if (exp) {
        exportData(exp.getAttribute("data-partnership-export") || "csv");
      }
    });

    document.addEventListener("change", (event) => {
      const filter = event.target.closest("[data-partnership-filter]");
      if (!filter) return;
      const key = filter.getAttribute("data-partnership-filter");
      partnershipPageState[key] = filter.value;
      renderPartnerships();
    });
  }

  // Hydrate from Supabase on init
  if (typeof window !== "undefined") {
    setTimeout(hydratePartnershipArms, 1000);
  }

  global.PARTNERSHIP_ARMS_SEED = PARTNERSHIP_ARMS_SEED;
  global.partnershipPageState = partnershipPageState;
  global.renderPartnerships = renderPartnerships;
  global.getPartnershipArmPromotionStatus = getPartnershipArmPromotionStatus;
  global.getVerifiedPartnershipRecords = getPartnershipFinanceList;
  global.computePartnershipArmAnalytics = computeArmAnalytics;
  global.computePartnershipPartners = computePartners;
  global.isPartnershipFinanceRecord = isPartnershipRecord;
  global.openPartnershipArmModal = openPartnershipArmModal;
  global.deletePartnershipArm = deletePartnershipArm;
  global.hydratePartnershipArms = hydratePartnershipArms;
  global.CEPartnerships = {
    getArms,
    getPartnershipFinanceList,
    computeArmAnalytics,
    computePartners,
    getPartnershipArmPromotionStatus,
    openArmModal: openPartnershipArmModal,
    deleteArm: deletePartnershipArm,
    hydrate: hydratePartnershipArms,
    render: renderPartnerships
  };
})(typeof window !== "undefined" ? window : globalThis);
