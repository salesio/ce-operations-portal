/**
 * Finance module — taxonomy, filters, reports, multi-dimensional analytics, A4 printable reports & SheetJS Excel export (frontend-first).
 */
const FINANCE_GENERAL_CATEGORIES = [
  "Dízimo", "Ofertas", "Acção de Graças", "Primícias", "Semente de Fé", "Ofertas Especiais", "Outros"
];

const FINANCE_PARTNERSHIP_ARMS = [
  "Escola de Cura",
  "Rapsódia de Realidades",
  "Loveworld SAT",
  "Construtores de Visão",
  "Missões de Cidades do Interior",
  "Alcançar Moçambique",
  "Projecto da Igreja",
  "Projecto de Construção de Igreja",
  "Rapsódias das Crianças",
  "Mandato de Célula",
  "Outros Braços"
];

const FINANCE_CONTRIBUTION_GROUPS = ["Geral", "Parceria", "Projecto", "Missões", "Outros"];

const FINANCE_CATEGORY_ALIASES = {
  "Dízimos": "Dízimo",
  "Dizimo": "Dízimo",
  "Dizimos": "Dízimo",
  "Oferta": "Ofertas",
  "Ofertas": "Ofertas",
  "Acção de Graças": "Acção de Graças",
  "Accao de Gracas": "Acção de Graças",
  "Ação de Graças": "Acção de Graças",
  "Primícias": "Primícias",
  "Primicias": "Primícias",
  "Semente de Fé": "Semente de Fé",
  "Semente de Fe": "Semente de Fé",
  "LoveWorld SAT": "Loveworld SAT",
  "LoveworldSAT": "Loveworld SAT",
  "Missões no Interior das Cidades": "Missões de Cidades do Interior",
  "Missoes no Interior das Cidades": "Missões de Cidades do Interior",
  "Projectos Locais": "Projecto da Igreja",
  "Projecto Local": "Projecto da Igreja",
  "Parcerias": "Ofertas Especiais",
  "Parceria": "Ofertas Especiais",
  "Outros": "Outros"
};

const FINANCE_REPORT_CATEGORY_BUCKETS = [
  { key: "tithe", labelKey: "financeReportTithe", match: ["Dízimo", "Dízimos", "Dizimo"] },
  { key: "offerings", labelKey: "financeReportOfferings", match: ["Ofertas", "Oferta", "Acção de Graças", "Ofertas Especiais"] },
  { key: "partnerships", labelKey: "financeReportPartnerships", groups: ["Parceria", "Projecto", "Missões"] },
  { key: "firstfruits", labelKey: "financeReportFirstfruits", match: ["Primícias", "Primicias"] },
  { key: "seed", labelKey: "financeReportSeed", match: ["Semente de Fé", "Semente de Fe"] },
  { key: "other", labelKey: "financeReportOther", match: ["Outros", "Outros Braços"], groups: ["Outros"] }
];

function normalizeFinanceCategory(raw) {
  const value = String(raw || "").trim();
  if (!value) return "Outros";
  return FINANCE_CATEGORY_ALIASES[value] || value;
}

function classifyFinanceCategory(rawCategory) {
  const category = normalizeFinanceCategory(rawCategory);
  if (FINANCE_GENERAL_CATEGORIES.includes(category)) {
    return { contribution_group: "Geral", contribution_category: category, partnership_arm: "" };
  }
  if (FINANCE_PARTNERSHIP_ARMS.includes(category)) {
    let group = "Parceria";
    if (category.includes("Projecto")) group = "Projecto";
    if (category.includes("Missões") || category === "Alcançar Moçambique") group = "Missões";
    return { contribution_group: group, contribution_category: category, partnership_arm: category };
  }
  if (/projecto/i.test(category)) {
    return { contribution_group: "Projecto", contribution_category: category, partnership_arm: category };
  }
  if (/miss/i.test(category) || /alcançar/i.test(category) || /alcancar/i.test(category)) {
    return { contribution_group: "Missões", contribution_category: category, partnership_arm: category };
  }
  return { contribution_group: "Outros", contribution_category: category, partnership_arm: "" };
}

function enrichFinanceRecord(record) {
  if (!record) return record;
  const category = normalizeFinanceCategory(record.contribution_category || record.categoria_da_contribuicao);
  const classified = classifyFinanceCategory(category);
  const nome = record.nome || "";
  const apelido = record.apelido || "";
  const amount = Number(record.amount ?? record.valor ?? 0);
  return {
    ...record,
    contribution_category: classified.contribution_category,
    categoria_da_contribuicao: classified.contribution_category,
    contribution_group: record.contribution_group || classified.contribution_group,
    partnership_arm: record.partnership_arm || classified.partnership_arm,
    contributor_name: record.contributor_name || `${nome} ${apelido}`.trim(),
    amount,
    valor: amount,
    payment_method: record.payment_method || record.metodo_de_pagamento || "",
    metodo_de_pagamento: record.metodo_de_pagamento || record.payment_method || "",
    cell_id: record.cell_id || "",
    cell_name: record.cell_name || record.celula || "",
    cell_group_name: record.cell_group_name || record.grupo_de_celula || "",
    date: record.date || record.data_da_transferencia || record.data || record.payment_date || ""
  };
}

function financeRecordDate(record) {
  return record.date || record.data_da_transferencia || record.data || record.payment_date || "";
}

function financeContributorKey(record) {
  if (record.contributor_id) return `contrib-${record.contributor_id}`;
  if (record.member_id) return `member-${record.member_id}`;
  if (record.partner_id) return `partner-${record.partner_id}`;
  const phone = String(record.telefone || record.whatsapp || "").replace(/\D/g, "");
  const name = String(record.contributor_name || `${record.nome || ""} ${record.apelido || ""}`).trim().toLowerCase();
  return phone ? `phone-${phone}` : `name-${name}`;
}

function getFinancePeriodRange(period, dateFrom = "", dateTo = "") {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const fmt = (d) => d.toISOString().slice(0, 10);

  if (period === "custom" && (dateFrom || dateTo)) {
    return { from: dateFrom || "1970-01-01", to: dateTo || "2099-12-31" };
  }
  if (period === "today") return { from: today, to: today };
  if (period === "yesterday") {
    const y = new Date(now);
    y.setDate(now.getDate() - 1);
    const yStr = fmt(y);
    return { from: yStr, to: yStr };
  }
  if (period === "week") {
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diff);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { from: fmt(monday), to: fmt(sunday) };
  }
  if (period === "last_week") {
    const day = now.getDay();
    const diff = (day === 0 ? 6 : day - 1) + 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diff);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { from: fmt(monday), to: fmt(sunday) };
  }
  if (period === "month") {
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return { from: fmt(firstDay), to: fmt(lastDay) };
  }
  if (period === "last_month") {
    const year = now.getFullYear();
    const month = now.getMonth() - 1;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return { from: fmt(firstDay), to: fmt(lastDay) };
  }
  if (period === "quarter") {
    const qMonth = Math.floor(now.getMonth() / 3) * 3;
    const firstDay = new Date(now.getFullYear(), qMonth, 1);
    const lastDay = new Date(now.getFullYear(), qMonth + 3, 0);
    return { from: fmt(firstDay), to: fmt(lastDay) };
  }
  if (period === "last_quarter") {
    const qMonth = Math.floor(now.getMonth() / 3) * 3 - 3;
    const firstDay = new Date(now.getFullYear(), qMonth, 1);
    const lastDay = new Date(now.getFullYear(), qMonth + 3, 0);
    return { from: fmt(firstDay), to: fmt(lastDay) };
  }
  if (period === "year") {
    return { from: `${now.getFullYear()}-01-01`, to: `${now.getFullYear()}-12-31` };
  }
  if (period === "last_year") {
    return { from: `${now.getFullYear() - 1}-01-01`, to: `${now.getFullYear() - 1}-12-31` };
  }
  if (period === "all") {
    return { from: "", to: "" };
  }
  return { from: "", to: "" };
}

function getPreviousPeriodRange(period, dateFrom, dateTo) {
  const current = getFinancePeriodRange(period, dateFrom, dateTo);
  if (!current.from || !current.to) return { from: "", to: "" };
  const from = new Date(current.from);
  const to = new Date(current.to);
  const days = Math.max(1, Math.round((to - from) / 86400000) + 1);
  const prevTo = new Date(from);
  prevTo.setDate(prevTo.getDate() - 1);
  const prevFrom = new Date(prevTo);
  prevFrom.setDate(prevFrom.getDate() - days + 1);
  return { from: prevFrom.toISOString().slice(0, 10), to: prevTo.toISOString().slice(0, 10) };
}

function filterFinanceRecords(records, filters = {}) {
  if (!Array.isArray(records)) return [];
  const range = getFinancePeriodRange(filters.period, filters.dateFrom, filters.dateTo);

  return records.filter((record) => {
    const date = financeRecordDate(record);
    if (range.from && date && date < range.from) return false;
    if (range.to && date && date > range.to) return false;

    // Church filter
    if (filters.churchId) {
      const cId = String(record.church_id || "").toLowerCase();
      const cName = String(record.igreja || record.church_name || "").toLowerCase();
      const fChurch = String(filters.churchId).toLowerCase();
      if (cId !== fChurch && cName !== fChurch) return false;
    }

    // Category filter
    if (filters.category) {
      const catNorm = normalizeFinanceCategory(record.contribution_category || record.categoria_da_contribuicao);
      const fCatNorm = normalizeFinanceCategory(filters.category);
      const armNorm = String(record.partnership_arm || "").trim();
      if (catNorm !== fCatNorm && armNorm !== filters.category && String(record.contribution_category || "") !== filters.category) {
        return false;
      }
    }

    // Contribution group / type filter
    if (filters.contributionType) {
      const grp = String(record.contribution_group || "").toLowerCase();
      const fGrp = String(filters.contributionType).toLowerCase();
      if (grp !== fGrp && !grp.includes(fGrp)) return false;
    }

    // Partnership arm filter
    if (filters.partnershipArm) {
      const arm = String(record.partnership_arm || record.partnership_arm_name || record.contribution_category || "").toLowerCase();
      const fArm = String(filters.partnershipArm).toLowerCase();
      if (!arm.includes(fArm) && arm !== fArm) return false;
    }

    // Method filter
    if (filters.method) {
      const method = String(record.metodo_de_pagamento || record.payment_method || "").toLowerCase();
      const fMethod = String(filters.method).toLowerCase();
      if (!method.includes(fMethod) && method !== fMethod) return false;
    }

    // Status filter
    if (filters.status) {
      const status = String(record.estado || record.status || "").toLowerCase();
      const fStatus = String(filters.status).toLowerCase();
      if (!status.includes(fStatus) && status !== fStatus) return false;
    }

    // Source filter
    if (filters.source && typeof financeSourceKey === "function") {
      if (financeSourceKey(record) !== filters.source) return false;
    }

    // Min value filter
    if (filters.minValue !== "" && filters.minValue !== undefined && filters.minValue !== null) {
      const min = Number(filters.minValue);
      if (!Number.isNaN(min) && min > 0) {
        const val = Number(record.amount ?? record.valor ?? 0);
        if (val < min) return false;
      }
    }

    // Max value filter
    if (filters.maxValue !== "" && filters.maxValue !== undefined && filters.maxValue !== null) {
      const max = Number(filters.maxValue);
      if (!Number.isNaN(max) && max > 0) {
        const val = Number(record.amount ?? record.valor ?? 0);
        if (val > max) return false;
      }
    }

    // Cell Group filter
    if (filters.cellGroup) {
      const grp = String(record.cell_group_name || record.grupo_de_celula || record.cell_group_id || "").toLowerCase();
      const fGrp = String(filters.cellGroup).toLowerCase();
      if (!grp.includes(fGrp) && grp !== fGrp) return false;
    }

    // Cell filter
    if (filters.cell) {
      const cell = String(record.cell_name || record.celula || record.cell_id || "").toLowerCase();
      const fCell = String(filters.cell).toLowerCase();
      if (!cell.includes(fCell) && cell !== fCell) return false;
    }

    // Contributor / free text search
    if (filters.contributor) {
      const key = financeContributorKey(record);
      const q = String(filters.contributor).toLowerCase().trim();
      const name = String(record.contributor_name || `${record.nome || ""} ${record.apelido || ""}`).toLowerCase();
      const phone = String(record.telefone || record.whatsapp || "").toLowerCase();
      const ref = String(record.referencia_da_transaccao || record.payment_reference || "").toLowerCase();
      if (!name.includes(q) && !phone.includes(q) && !key.includes(q) && !ref.includes(q)) {
        return false;
      }
    }

    return true;
  });
}

function sumFinanceAmount(records) {
  if (!Array.isArray(records)) return 0;
  return records.reduce((sum, r) => sum + Number(r.amount ?? r.valor ?? 0), 0);
}

function computeFinanceReportStats(records) {
  const verified = records.filter((r) => {
    const s = String(r.estado || r.status || "");
    return s.includes("Verificado") || s.toLowerCase() === "verified";
  });
  const pending = records.filter((r) => {
    const s = String(r.estado || r.status || "");
    return s.includes("Pendente") || s.toLowerCase().includes("pending");
  });
  const rejected = records.filter((r) => {
    const s = String(r.estado || r.status || "");
    return s.includes("Rejeitado") || s.toLowerCase() === "rejected";
  });
  const contributors = new Set(records.map(financeContributorKey));
  const total = sumFinanceAmount(records);
  return {
    totalReceived: total,
    totalVerified: sumFinanceAmount(verified),
    totalPending: sumFinanceAmount(pending),
    totalRejected: sumFinanceAmount(rejected),
    contributionCount: records.length,
    uniqueContributors: contributors.size,
    averageContribution: records.length ? Math.round(total / records.length) : 0
  };
}

function computeFinanceComparison(currentRecords, previousRecords) {
  const currentStats = computeFinanceReportStats(currentRecords);
  const previousStats = computeFinanceReportStats(previousRecords);

  const calcGrowth = (curr, prev) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  };

  return {
    current: currentStats,
    previous: previousStats,
    growthReceived: calcGrowth(currentStats.totalReceived, previousStats.totalReceived),
    growthVerified: calcGrowth(currentStats.totalVerified, previousStats.totalVerified),
    growthPending: calcGrowth(currentStats.totalPending, previousStats.totalPending),
    growthContributors: calcGrowth(currentStats.uniqueContributors, previousStats.uniqueContributors),
    growthAverage: calcGrowth(currentStats.averageContribution, previousStats.averageContribution)
  };
}

function bucketFinanceCategory(record) {
  const group = record.contribution_group;
  const cat = record.contribution_category;
  for (const bucket of FINANCE_REPORT_CATEGORY_BUCKETS) {
    if (bucket.groups?.includes(group)) return bucket.key;
    if (bucket.match?.includes(cat)) return bucket.key;
  }
  return "other";
}

function groupFinanceByBucket(records, labelFn = (k) => k) {
  const grouped = {};
  FINANCE_REPORT_CATEGORY_BUCKETS.forEach((b) => { grouped[b.key] = 0; });
  records.forEach((record) => {
    const key = bucketFinanceCategory(record);
    grouped[key] = (grouped[key] || 0) + Number(record.amount ?? record.valor ?? 0);
  });
  return FINANCE_REPORT_CATEGORY_BUCKETS.map((b) => [labelFn(b.labelKey), grouped[b.key] || 0]);
}

function groupFinanceByPartnershipArm(records) {
  const grouped = {};
  FINANCE_PARTNERSHIP_ARMS.forEach((arm) => { grouped[arm] = 0; });
  records.forEach((record) => {
    const arm = record.partnership_arm || (FINANCE_PARTNERSHIP_ARMS.includes(record.contribution_category) ? record.contribution_category : "");
    if (!arm) return;
    grouped[arm] = (grouped[arm] || 0) + Number(record.amount ?? record.valor ?? 0);
  });
  return FINANCE_PARTNERSHIP_ARMS.map((arm) => [arm, grouped[arm] || 0]);
}

function computePartnershipArmDetails(records, previousRecords, labelGrowth = (g) => `${g >= 0 ? "+" : ""}${g}%`) {
  return FINANCE_PARTNERSHIP_ARMS.map((arm) => {
    const current = records.filter((r) => r.partnership_arm === arm || r.contribution_category === arm);
    const previous = (previousRecords || []).filter((r) => r.partnership_arm === arm || r.contribution_category === arm);
    const total = sumFinanceAmount(current);
    const prevTotal = sumFinanceAmount(previous);
    const partners = new Set(current.map(financeContributorKey));
    const growth = prevTotal > 0 ? Math.round(((total - prevTotal) / prevTotal) * 100) : (total > 0 ? 100 : 0);
    const activePartners = [...partners].map((key) => {
      const rec = current.find((r) => financeContributorKey(r) === key);
      return {
        key,
        name: rec?.contributor_name || "-",
        phone: rec?.telefone || "-",
        total: sumFinanceAmount(current.filter((r) => financeContributorKey(r) === key))
      };
    }).sort((a, b) => b.total - a.total);
    return {
      arm,
      total,
      partnerCount: partners.size,
      growth,
      growthLabel: labelGrowth(growth),
      activePartners,
      average: partners.size ? Math.round(total / partners.size) : 0
    };
  }).filter((row) => row.total > 0 || row.partnerCount > 0);
}

function groupFinanceByChurch(records, churchNameFn) {
  const grouped = {};
  records.forEach((record) => {
    const key = record.church_id || "unknown";
    if (!grouped[key]) {
      grouped[key] = {
        church_id: key,
        church_name: churchNameFn ? churchNameFn(key) : (record.church_name || record.igreja || key),
        total: 0,
        verified: 0,
        pending: 0,
        rejected: 0,
        count: 0,
        contributors: new Set(),
        categories: {}
      };
    }
    const amount = Number(record.amount ?? record.valor ?? 0);
    grouped[key].total += amount;
    const tone = financeStatusTone(record);
    if (tone === "verified") grouped[key].verified += amount;
    else if (tone === "pending") grouped[key].pending += amount;
    else if (tone === "rejected") grouped[key].rejected += amount;
    grouped[key].count += 1;
    grouped[key].contributors.add(financeContributorKey(record));
    const cat = record.contribution_category || "Outros";
    grouped[key].categories[cat] = (grouped[key].categories[cat] || 0) + amount;
  });
  return Object.values(grouped)
    .map((row) => ({
      ...row,
      contributorCount: row.contributors.size,
      topCategories: Object.entries(row.categories).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name, value]) => ({ name, value }))
    }))
    .sort((a, b) => b.total - a.total);
}

function groupFinanceByCell(records) {
  const grouped = {};
  records.forEach((record) => {
    const cellName = record.cell_name || record.celula || (record.cell_id ? `Célula ${record.cell_id.slice(0, 6)}` : "Sem Célula Atribuída");
    const groupName = record.cell_group_name || record.grupo_de_celula || "Geral";
    const key = `${groupName}::${cellName}`;
    if (!grouped[key]) {
      grouped[key] = {
        key,
        cell_name: cellName,
        cell_group_name: groupName,
        church_id: record.church_id || "",
        church_name: record.church_name || record.igreja || "",
        total: 0,
        verified: 0,
        pending: 0,
        count: 0,
        contributors: new Set()
      };
    }
    const amount = Number(record.amount ?? record.valor ?? 0);
    grouped[key].total += amount;
    const tone = financeStatusTone(record);
    if (tone === "verified") grouped[key].verified += amount;
    else if (tone === "pending") grouped[key].pending += amount;
    grouped[key].count += 1;
    grouped[key].contributors.add(financeContributorKey(record));
  });
  return Object.values(grouped)
    .map((row) => ({
      ...row,
      contributorCount: row.contributors.size
    }))
    .sort((a, b) => b.total - a.total);
}

function groupFinanceByMethod(records) {
  const map = new Map();
  records.forEach((record) => {
    const m = record.metodo_de_pagamento || record.payment_method || "Outro";
    const val = Number(record.amount ?? record.valor ?? 0);
    map.set(m, (map.get(m) || 0) + val);
  });
  return [...map.entries()].map(([method, total]) => [method, total]).sort((a, b) => b[1] - a[1]);
}

function groupFinanceMonthly(records) {
  const grouped = {};
  records.forEach((record) => {
    const date = financeRecordDate(record);
    if (!date) return;
    const month = date.slice(0, 7);
    grouped[month] = (grouped[month] || 0) + Number(record.amount ?? record.valor ?? 0);
  });
  return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
}

function computeContributorProfiles(records) {
  const map = new Map();
  records.forEach((record) => {
    const key = financeContributorKey(record);
    if (!map.has(key)) {
      map.set(key, {
        key,
        name: record.contributor_name || "-",
        phone: record.telefone || "-",
        church_id: record.church_id,
        celula: record.celula || "-",
        grupo_de_celula: record.grupo_de_celula || "-",
        total: 0,
        count: 0,
        categories: new Set(),
        arms: new Set()
      });
    }
    const profile = map.get(key);
    profile.total += Number(record.amount ?? record.valor ?? 0);
    profile.count += 1;
    profile.categories.add(record.contribution_category);
    if (record.partnership_arm) profile.arms.add(record.partnership_arm);
  });
  return [...map.values()].sort((a, b) => b.total - a.total);
}

function computeContributorFrequency(records, periodMonths = 3) {
  if (!records.length) return "none";
  const dates = records.map((r) => financeRecordDate(r)).filter(Boolean).sort();
  const uniqueMonths = new Set(dates.map((d) => d.slice(0, 7)));
  if (records.length === 1) return "occasional";
  if (uniqueMonths.size >= Math.min(periodMonths, 2) && records.length >= 2) return "consistent";
  if (records.length >= 2) return "regular";
  return "occasional";
}

function computeContributorDetail(records, contributorKey) {
  const contributorRecords = records
    .filter((r) => financeContributorKey(r) === contributorKey)
    .sort((a, b) => financeRecordDate(b).localeCompare(financeRecordDate(a)));
  if (!contributorRecords.length) return null;
  const first = contributorRecords[contributorRecords.length - 1];
  const last = contributorRecords[0];
  const categories = [...new Set(contributorRecords.map((r) => r.contribution_category))];
  const arms = [...new Set(contributorRecords.map((r) => r.partnership_arm).filter(Boolean))];
  const verified = contributorRecords.filter((r) => financeStatusTone(r) === "verified");
  const pending = contributorRecords.filter((r) => financeStatusTone(r) === "pending");
  const rejected = contributorRecords.filter((r) => financeStatusTone(r) === "rejected");
  let dominantStatus = "verified";
  if (pending.length >= verified.length && pending.length > 0) dominantStatus = "pending";
  if (rejected.length > verified.length && rejected.length > pending.length) dominantStatus = "rejected";
  return {
    key: contributorKey,
    name: last.contributor_name || "-",
    phone: last.telefone || "-",
    church_id: last.church_id,
    celula: last.celula || "-",
    grupo_de_celula: last.grupo_de_celula || "-",
    total: sumFinanceAmount(contributorRecords),
    count: contributorRecords.length,
    categories,
    arms,
    lastContributionDate: financeRecordDate(last),
    lastContributionAmount: Number(last.amount ?? last.valor ?? 0),
    firstContributionDate: financeRecordDate(first),
    frequency: computeContributorFrequency(contributorRecords),
    dominantStatus,
    history: contributorRecords.map((r) => ({
      id: r.id,
      date: financeRecordDate(r),
      category: r.contribution_category,
      arm: r.partnership_arm || "-",
      method: r.metodo_de_pagamento || "-",
      amount: Number(r.amount ?? r.valor ?? 0),
      status: r.estado,
      statusTone: financeStatusTone(r),
      proof: r.imagem_envelope_ou_pop || r.imagem_do_envelope || ""
    }))
  };
}

function computePartnerProfiles(records, allRecords = records, options = {}) {
  const minValue = Number(options.minValue || 0);
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const periodKeys = new Set(records.map(financeContributorKey));
  const allMap = new Map();

  (allRecords || []).forEach((record) => {
    const key = financeContributorKey(record);
    if (!allMap.has(key)) {
      allMap.set(key, {
        key,
        name: record.contributor_name || "-",
        phone: record.telefone || "-",
        church_id: record.church_id,
        arm: record.partnership_arm || record.contribution_category || "-",
        total: 0,
        periodTotal: 0,
        count: 0,
        periodCount: 0,
        lastDate: "",
        records: [],
        allRecords: []
      });
    }
    const profile = allMap.get(key);
    const amount = Number(record.amount ?? record.valor ?? 0);
    const date = financeRecordDate(record);
    profile.allRecords.push(record);
    profile.total += amount;
    if (!profile.lastDate || date > profile.lastDate) profile.lastDate = date;
    if (record.partnership_arm) profile.arm = record.partnership_arm;
    if (periodKeys.has(key)) {
      profile.periodTotal += amount;
      profile.periodCount += 1;
      profile.records.push(record);
    }
  });

  return [...allMap.values()]
    .map((profile) => {
      const frequency = computeContributorFrequency(profile.allRecords);
      const hasPending = profile.records.some((r) => financeStatusTone(r) === "pending")
        || profile.allRecords.some((r) => financeStatusTone(r) === "pending");
      const firstEver = profile.allRecords.map(financeRecordDate).filter(Boolean).sort()[0] || "";
      const isNew = firstEver.startsWith(monthKey) && profile.allRecords.length <= 2;
      const isInactive = profile.periodCount === 0 && profile.allRecords.length > 0;
      let segment = "top";
      if (hasPending) segment = "followup";
      else if (isInactive) segment = "inactive";
      else if (isNew) segment = "new";
      else if (frequency === "consistent") segment = "consistent";
      return {
        key: profile.key,
        name: profile.name,
        phone: profile.phone,
        church_id: profile.church_id,
        arm: profile.arm,
        total: profile.periodCount ? profile.periodTotal : profile.total,
        count: profile.periodCount || profile.allRecords.length,
        lastDate: profile.lastDate,
        records: profile.periodCount ? profile.records : profile.allRecords.slice(0, 3),
        frequency,
        segment,
        hasPending,
        dominantStatus: hasPending ? "pending" : profile.records.every((r) => financeStatusTone(r) === "verified") ? "verified" : "mixed"
      };
    })
    .filter((p) => p.total >= minValue)
    .sort((a, b) => b.total - a.total);
}

function filterPartnerProfiles(profiles, filters = {}) {
  let list = profiles;
  if (filters.partnershipArm) {
    list = list.filter((p) => p.arm === filters.partnershipArm || p.records.some((r) => r.partnership_arm === filters.partnershipArm));
  }
  if (filters.frequency) list = list.filter((p) => p.frequency === filters.frequency);
  if (filters.status) {
    list = list.filter((p) => p.records.some((r) => String(r.estado) === filters.status));
  }
  if (filters.segment && filters.segment !== "all") {
    if (filters.segment === "top") list = list.slice(0, 10);
    else list = list.filter((p) => p.segment === filters.segment);
  }
  return list;
}

const FINANCE_CHART_COLORS = {
  gold: "#d7ad45",
  cyan: "#22d3ee",
  green: "#34d399",
  amber: "#fbbf24",
  red: "#f87171",
  blue: "#60a5fa"
};

const FINANCE_CHART_SURFACE = "chart-card glass-panel finance-chart-card light-surface h-100";

function financeStatusTone(record) {
  const estado = String(record?.estado || record?.status || "");
  if (estado.includes("Verificado") || estado.toLowerCase() === "verified") return "verified";
  if (estado.includes("Pendente") || estado.toLowerCase().includes("pending")) return "pending";
  if (estado.includes("Rejeitado") || estado.toLowerCase() === "rejected") return "rejected";
  return "neutral";
}

function financeDonutChart(title, rows, emptyLabel) {
  const total = rows.reduce((sum, [, v]) => sum + Number(v || 0), 0);
  if (!total) {
    return `<article class="${FINANCE_CHART_SURFACE}"><div class="panel-head"><h3 class="panel-title chart-title card-title"><i class="bi bi-pie-chart me-2 text-info"></i>${title}</h3></div><p class="finance-chart-empty">${emptyLabel}</p></article>`;
  }
  const colors = ["#22d3ee", "#d7ad45", "#60a5fa", "#34d399", "#f472b6", "#a78bfa", "#fb923c", "#94a3b8"];
  let cursor = 0;
  const segments = rows.filter(([, v]) => Number(v) > 0).map(([label, value], index) => {
    const pct = (Number(value) / total) * 100;
    const color = colors[index % colors.length];
    const start = cursor;
    cursor += pct;
    return { label, value, pct, color, start, end: cursor };
  });
  const gradient = segments.map((s) => `${s.color} ${s.start}% ${s.end}%`).join(", ");
  const legend = segments.map((s) => `
    <div class="finance-donut-legend-item">
      <span class="finance-donut-swatch" style="background:${s.color}"></span>
      <span class="finance-donut-legend-label chart-label">${s.label}</span>
      <strong>${Math.round(s.pct)}%</strong>
      <span class="finance-donut-legend-value">${Number(s.value).toLocaleString()} MTn</span>
    </div>`).join("");
  return `
    <article class="${FINANCE_CHART_SURFACE}">
      <div class="panel-head"><h3 class="panel-title chart-title card-title"><i class="bi bi-pie-chart me-2 text-info"></i>${title}</h3></div>
      <div class="finance-donut-wrap">
        <div class="finance-donut" style="background:conic-gradient(${gradient})">
          <div class="finance-donut-hole"><strong>${total.toLocaleString()}</strong><span>MTn</span></div>
        </div>
        <div class="finance-donut-legend">${legend}</div>
      </div>
    </article>`;
}

function financeBarChart(title, rows, emptyLabel) {
  const max = Math.max(...rows.map((r) => Number(r[1] || 0)), 1);
  const bars = rows.length && rows.some(([, v]) => Number(v) > 0)
    ? rows.map(([label, value]) => `
      <div class="chart-row finance-chart-row">
        <span class="finance-chart-label chart-label" title="${label}">${label}</span>
        <div class="chart-track"><div class="chart-fill finance-chart-fill" style="width:${Math.max(4, Math.round((Number(value) / max) * 100))}%"></div></div>
        <strong class="finance-chart-value chart-value bar-value amount-value">${Number(value).toLocaleString()} MTn</strong>
      </div>`).join("")
    : `<p class="finance-chart-empty">${emptyLabel}</p>`;
  return `<article class="${FINANCE_CHART_SURFACE}"><div class="panel-head"><h3 class="panel-title chart-title card-title"><i class="bi bi-bar-chart me-2 text-info"></i>${title}</h3></div><div class="chart-bars">${bars}</div></article>`;
}

function financeSemanticBarChart(title, rows, tone = "cyan", emptyLabel) {
  const colorMap = {
    gold: FINANCE_CHART_COLORS.gold,
    cyan: FINANCE_CHART_COLORS.cyan,
    green: FINANCE_CHART_COLORS.green,
    amber: FINANCE_CHART_COLORS.amber,
    red: FINANCE_CHART_COLORS.red
  };
  const color = colorMap[tone] || FINANCE_CHART_COLORS.cyan;
  const max = Math.max(...rows.map((r) => Number(r[1] || 0)), 1);
  const bars = rows.length && rows.some(([, v]) => Number(v) > 0)
    ? rows.map(([label, value]) => `
      <div class="chart-row finance-chart-row">
        <span class="finance-chart-label chart-label" title="${label}">${label}</span>
        <div class="chart-track"><div class="chart-fill finance-chart-fill" style="width:${Math.max(4, Math.round((Number(value) / max) * 100))}%;background:linear-gradient(90deg, ${color}88, ${color})"></div></div>
        <strong class="finance-chart-value chart-value bar-value amount-value">${Number(value).toLocaleString()} MTn</strong>
      </div>`).join("")
    : `<p class="finance-chart-empty">${emptyLabel}</p>`;
  return `<article class="${FINANCE_CHART_SURFACE}"><div class="panel-head"><h3 class="panel-title chart-title card-title"><i class="bi bi-bar-chart me-2" style="color:${color}"></i>${title}</h3></div><div class="chart-bars">${bars}</div></article>`;
}

function financeLineChart(title, rows, emptyLabel, color = FINANCE_CHART_COLORS.gold) {
  if (!rows.length || !rows.some(([, v]) => Number(v) > 0)) {
    return `<article class="${FINANCE_CHART_SURFACE}"><div class="panel-head"><h3 class="panel-title chart-title card-title"><i class="bi bi-graph-up me-2 text-warning"></i>${title}</h3></div><p class="finance-chart-empty">${emptyLabel}</p></article>`;
  }
  const max = Math.max(...rows.map(([, v]) => Number(v)), 1);
  const width = 100;
  const height = 48;
  const step = rows.length > 1 ? width / (rows.length - 1) : 0;
  const points = rows.map(([, value], index) => {
    const x = rows.length > 1 ? index * step : width / 2;
    const y = height - (Number(value) / max) * (height - 6) - 3;
    return `${x},${y}`;
  }).join(" ");
  const areaPoints = `0,${height} ${points} ${width},${height}`;
  const labels = rows.map(([label, value], index) => {
    return `<div class="finance-line-label" style="--i:${index};--n:${rows.length}"><span>${label.slice(5)}</span><strong>${Number(value).toLocaleString()}</strong></div>`;
  }).join("");
  return `
    <article class="${FINANCE_CHART_SURFACE}">
      <div class="panel-head"><h3 class="panel-title chart-title card-title"><i class="bi bi-graph-up me-2" style="color:${color}"></i>${title}</h3></div>
      <div class="finance-line-chart">
        <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" class="finance-line-svg" aria-hidden="true">
          <polygon class="finance-line-area" points="${areaPoints}" fill="${color}" fill-opacity="0.12"></polygon>
          <polyline class="finance-line-stroke" points="${points}" fill="none" stroke="${color}" stroke-width="2.2" vector-effect="non-scaling-stroke"></polyline>
        </svg>
        <div class="finance-line-labels">${labels}</div>
      </div>
    </article>`;
}

function financeHBarChart(title, rows, emptyLabel, color = FINANCE_CHART_COLORS.cyan) {
  const max = Math.max(...rows.map((r) => Number(r[1] || 0)), 1);
  const bars = rows.length && rows.some(([, v]) => Number(v) > 0)
    ? rows.slice(0, 10).map(([label, value]) => `
      <div class="finance-hbar-row">
        <span class="finance-hbar-label chart-label" title="${label}">${label}</span>
        <div class="finance-hbar-track"><div class="finance-hbar-fill" style="width:${Math.max(4, Math.round((Number(value) / max) * 100))}%;background:linear-gradient(90deg, ${color}99, ${color})"></div></div>
        <strong class="finance-hbar-value chart-value bar-value amount-value">${Number(value).toLocaleString()} MTn</strong>
      </div>`).join("")
    : `<p class="finance-chart-empty">${emptyLabel}</p>`;
  return `<article class="${FINANCE_CHART_SURFACE}"><div class="panel-head"><h3 class="panel-title chart-title card-title"><i class="bi bi-bar-chart-steps me-2" style="color:${color}"></i>${title}</h3></div><div class="finance-hbar-chart">${bars}</div></article>`;
}

function financeChurchBarChart(title, churchRows, emptyLabel) {
  const rows = churchRows.map((c) => [c.church_name, c.total]);
  return financeBarChart(title, rows, emptyLabel);
}

/**
 * Multi-Sheet Excel Export using SheetJS (xlsx.full.min.js)
 */
function exportFinanceExcel(records, filename = "relatorio-financeiro.xlsx", meta = {}) {
  if (!records || !records.length) {
    alert("Não há dados para exportar com os filtros actuais.");
    return;
  }

  const stamp = new Date().toISOString().slice(0, 10);
  const safeFilename = filename.endsWith(".xlsx") ? filename : `${filename}-${stamp}.xlsx`;

  if (typeof window !== "undefined" && window.XLSX) {
    const XLSX = window.XLSX;
    const wb = XLSX.utils.book_new();

    // 1. Resumo Executivo Sheet
    const stats = computeFinanceReportStats(records);
    const summaryData = [
      ["EMBAIXADA DE CRISTO MOÇAMBIQUE — RELATÓRIO FINANCEIRO"],
      ["Data de Emissão:", new Date().toLocaleString()],
      ["Total de Registos:", records.length],
      [""],
      ["INDICADORES PRINCIPAIS", "VALOR (MZN)"],
      ["Total Arrecadado", stats.totalReceived],
      ["Total Verificado", stats.totalVerified],
      ["Total Pendente", stats.totalPending],
      ["Total Rejeitado", stats.totalRejected],
      ["Total de Ofertas/Entradas", stats.contributionCount],
      ["Contribuintes Únicos", stats.uniqueContributors],
      ["Média por Contribuição", stats.averageContribution],
      [""],
      ["DISTRIBUIÇÃO POR CATEGORIA", "VALOR (MZN)"],
      ...groupFinanceByBucket(records).map(([cat, val]) => [cat, val]),
      [""],
      ["DISTRIBUIÇÃO POR MÉTODO DE PAGAMENTO", "VALOR (MZN)"],
      ...groupFinanceByMethod(records).map(([m, val]) => [m, val])
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Resumo Executivo");

    // 2. Transações Detalhadas Sheet
    const txHeader = [
      "Data", "Contribuinte", "Telefone", "Categoria", "Braço de Parceria",
      "Grupo/Tipo", "Valor (MTn)", "Método", "Referência", "Estado",
      "Igreja", "Grupo de Célula", "Célula", "Origem"
    ];
    const txRows = records.map((r) => [
      financeRecordDate(r),
      r.contributor_name || r.nome || "-",
      r.telefone || r.whatsapp || "-",
      r.contribution_category || "-",
      r.partnership_arm || "-",
      r.contribution_group || "-",
      Number(r.amount ?? r.valor ?? 0),
      r.metodo_de_pagamento || r.payment_method || "-",
      r.payment_reference || r.referencia_da_transaccao || "-",
      r.estado || r.status || "-",
      r.igreja || r.church_name || r.church_id || "-",
      r.cell_group_name || r.grupo_de_celula || "-",
      r.cell_name || r.celula || "-",
      r.source || r.source_type || "-"
    ]);
    const wsTx = XLSX.utils.aoa_to_sheet([txHeader, ...txRows]);
    XLSX.utils.book_append_sheet(wb, wsTx, "Transações");

    // 3. Braços de Parceria Sheet
    const armDetails = computePartnershipArmDetails(records, []);
    const armHeader = ["Braço de Parceria", "Total Arrecadado (MTn)", "Nº de Parceiros", "Média por Parceiro"];
    const armRows = armDetails.map((a) => [
      a.arm,
      a.total,
      a.partnerCount,
      a.average
    ]);
    const wsArms = XLSX.utils.aoa_to_sheet([armHeader, ...armRows]);
    XLSX.utils.book_append_sheet(wb, wsArms, "Braços de Parceria");

    // 4. Igrejas e Células Sheet
    const cellRows = groupFinanceByCell(records);
    const cellHeader = ["Igreja", "Grupo de Célula", "Célula", "Total (MTn)", "Verificado (MTn)", "Nº Ofertas", "Nº Ofertantes"];
    const cellData = cellRows.map((c) => [
      c.church_name || "-",
      c.cell_group_name || "-",
      c.cell_name || "-",
      c.total,
      c.verified,
      c.count,
      c.contributorCount
    ]);
    const wsCells = XLSX.utils.aoa_to_sheet([cellHeader, ...cellData]);
    XLSX.utils.book_append_sheet(wb, wsCells, "Igrejas e Células");

    XLSX.writeFile(wb, safeFilename);
    return;
  }

  // Fallback to XML Spreadsheet
  const headers = ["Data", "Contribuinte", "Telefone", "Categoria", "Braço de Parceria", "Valor (MTn)", "Método", "Estado", "Igreja", "Célula"];
  const escape = (val) => String(val ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const rows = records.map((r) => [
    financeRecordDate(r),
    r.contributor_name || "-",
    r.telefone || "-",
    r.contribution_category || "-",
    r.partnership_arm || "-",
    Number(r.amount ?? r.valor ?? 0),
    r.metodo_de_pagamento || "-",
    r.estado || "-",
    r.igreja || r.church_name || "-",
    r.cell_name || r.celula || "-"
  ].map((val) => `<Cell><Data ss:Type="String">${escape(val)}</Data></Cell>`).join(""));

  const xml = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="Relatorio Financeiro"><Table>
<Row>${headers.map((h) => `<Cell><Data ss:Type="String">${escape(h)}</Data></Cell>`).join("")}</Row>
${rows.map((row) => `<Row>${row}</Row>`).join("")}
</Table></Worksheet></Workbook>`;

  const blob = new Blob([xml], { type: "application/vnd.ms-excel" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = safeFilename.replace(/\.xlsx$/, ".xls");
  link.click();
  URL.revokeObjectURL(link.href);
}

function exportFinanceCsv(records, filename = "relatorio-financeiro.csv") {
  if (!records || !records.length) {
    alert("Não há dados para exportar com os filtros actuais.");
    return;
  }
  const headers = [
    "Data", "Contribuinte", "Telefone", "Categoria", "Braco de Parceria",
    "Grupo/Tipo", "Valor (MTn)", "Metodo", "Referencia", "Estado",
    "Igreja", "Grupo de Celula", "Celula", "Origem"
  ];
  const rows = records.map((r) => [
    financeRecordDate(r),
    r.contributor_name || r.nome || "-",
    r.telefone || r.whatsapp || "-",
    r.contribution_category || "-",
    r.partnership_arm || "-",
    r.contribution_group || "-",
    Number(r.amount ?? r.valor ?? 0),
    r.metodo_de_pagamento || r.payment_method || "-",
    r.payment_reference || r.referencia_da_transaccao || "-",
    r.estado || r.status || "-",
    r.igreja || r.church_name || r.church_id || "-",
    r.cell_group_name || r.grupo_de_celula || "-",
    r.cell_name || r.celula || "-",
    r.source || r.source_type || "-"
  ].map((val) => `"${String(val ?? "").replace(/"/g, '""')}"`).join(","));

  const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

/**
 * Publication-Ready A4 Printable / PDF Report Generator
 */
function buildFinanceA4PrintHtml(records, stats, comparison, churchRows, cellRows, categoryRows, armDetails, methodRows, meta = {}) {
  const money = (v) => `${Number(v || 0).toLocaleString()} MTn`;
  const filterList = [];
  if (meta.filters?.period) filterList.push(`Período: <strong>${meta.filters.period}</strong>`);
  if (meta.filters?.dateFrom && meta.filters?.dateTo) filterList.push(`Datas: <strong>${meta.filters.dateFrom}</strong> a <strong>${meta.filters.dateTo}</strong>`);
  if (meta.filters?.churchId) filterList.push(`Igreja: <strong>${meta.churchName || meta.filters.churchId}</strong>`);
  if (meta.filters?.category) filterList.push(`Categoria: <strong>${meta.filters.category}</strong>`);
  if (meta.filters?.partnershipArm) filterList.push(`Braço: <strong>${meta.filters.partnershipArm}</strong>`);
  if (meta.filters?.method) filterList.push(`Método: <strong>${meta.filters.method}</strong>`);
  if (meta.filters?.status) filterList.push(`Estado: <strong>${meta.filters.status}</strong>`);
  if (meta.filters?.contributor) filterList.push(`Contribuinte: <strong>"${meta.filters.contributor}"</strong>`);

  const growthTag = (g) => {
    if (g === undefined || g === null || Number.isNaN(g)) return "";
    const isUp = g >= 0;
    return `<span style="font-size:0.75rem;padding:2px 6px;border-radius:4px;font-weight:bold;background:${isUp ? "#e6f4ea" : "#fce8e6"};color:${isUp ? "#137333" : "#c5221f"}">${isUp ? "▲ +" : "▼ "}${g}%</span>`;
  };

  return `
    <div class="a4-report-container">
      <header class="a4-header">
        <div class="a4-brand">
          <div class="a4-logo-crest">EMBAIXADA DE CRISTO MOÇAMBIQUE</div>
          <div class="a4-subbrand">DEPARTAMENTO DE FINANÇAS & ADMINISTRAÇÃO · OPERAÇÕES NACIONAIS</div>
        </div>
        <div class="a4-title-block">
          <h2>RELATÓRIO FINANCEIRO & ANALÍTICO</h2>
          <div class="a4-meta-date">Emitido em: ${new Date().toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
        </div>
      </header>

      <div class="a4-filter-banner">
        <strong>Parâmetros do Relatório:</strong> ${filterList.length ? filterList.join(" · ") : "Todos os registos consolidados"}
      </div>

      <section class="a4-section">
        <h3 class="a4-section-title">1. Resumo Executivo & Indicadores-Chave</h3>
        <div class="a4-kpi-grid">
          <div class="a4-kpi-card">
            <span class="a4-kpi-label">Total Arrecadado</span>
            <strong class="a4-kpi-value text-primary">${money(stats.totalReceived)}</strong>
            <div class="a4-kpi-sub">${growthTag(comparison?.growthReceived)} vs período anterior</div>
          </div>
          <div class="a4-kpi-card" style="border-left: 3px solid #10b981;">
            <span class="a4-kpi-label">Total Verificado</span>
            <strong class="a4-kpi-value" style="color:#0f766e;">${money(stats.totalVerified)}</strong>
            <div class="a4-kpi-sub">${growthTag(comparison?.growthVerified)} de conformidade</div>
          </div>
          <div class="a4-kpi-card" style="border-left: 3px solid #f59e0b;">
            <span class="a4-kpi-label">Total Pendente</span>
            <strong class="a4-kpi-value" style="color:#b45309;">${money(stats.totalPending)}</strong>
            <div class="a4-kpi-sub">Aguardando validação</div>
          </div>
          <div class="a4-kpi-card">
            <span class="a4-kpi-label">Total de Ofertas</span>
            <strong class="a4-kpi-value">${stats.contributionCount}</strong>
            <div class="a4-kpi-sub">Entradas registadas</div>
          </div>
          <div class="a4-kpi-card">
            <span class="a4-kpi-label">Ofertantes Únicos</span>
            <strong class="a4-kpi-value">${stats.uniqueContributors}</strong>
            <div class="a4-kpi-sub">${growthTag(comparison?.growthContributors)} alcance</div>
          </div>
          <div class="a4-kpi-card">
            <span class="a4-kpi-label">Média por Entrada</span>
            <strong class="a4-kpi-value">${money(stats.averageContribution)}</strong>
            <div class="a4-kpi-sub">Por comprovativo</div>
          </div>
        </div>
      </section>

      <section class="a4-section">
        <div class="a4-grid-2col">
          <div>
            <h3 class="a4-section-title">2. Distribuição por Categoria</h3>
            <table class="a4-table">
              <thead><tr><th>Categoria</th><th style="text-align:right;">Valor (MTn)</th><th style="text-align:right;">% Total</th></tr></thead>
              <tbody>
                ${(categoryRows || []).map(([cat, val]) => `
                  <tr>
                    <td><strong>${cat}</strong></td>
                    <td style="text-align:right;">${money(val)}</td>
                    <td style="text-align:right;">${stats.totalReceived > 0 ? Math.round((Number(val) / stats.totalReceived) * 100) : 0}%</td>
                  </tr>`).join("")}
              </tbody>
            </table>
          </div>
          <div>
            <h3 class="a4-section-title">3. Canais de Pagamento</h3>
            <table class="a4-table">
              <thead><tr><th>Método</th><th style="text-align:right;">Valor (MTn)</th><th style="text-align:right;">% Total</th></tr></thead>
              <tbody>
                ${(methodRows || []).map(([method, val]) => `
                  <tr>
                    <td><strong>${method}</strong></td>
                    <td style="text-align:right;">${money(val)}</td>
                    <td style="text-align:right;">${stats.totalReceived > 0 ? Math.round((Number(val) / stats.totalReceived) * 100) : 0}%</td>
                  </tr>`).join("")}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      ${armDetails?.length ? `
      <section class="a4-section">
        <h3 class="a4-section-title">4. Desempenho por Braço de Parceria</h3>
        <table class="a4-table">
          <thead>
            <tr>
              <th>Braço de Parceria</th>
              <th style="text-align:right;">Total (MTn)</th>
              <th style="text-align:center;">Parceiros</th>
              <th style="text-align:right;">Média/Parceiro</th>
              <th style="text-align:center;">Crescimento</th>
            </tr>
          </thead>
          <tbody>
            ${armDetails.map((a) => `
              <tr>
                <td><strong>${a.arm}</strong></td>
                <td style="text-align:right;">${money(a.total)}</td>
                <td style="text-align:center;">${a.partnerCount}</td>
                <td style="text-align:right;">${money(a.average)}</td>
                <td style="text-align:center;">${growthTag(a.growth)}</td>
              </tr>`).join("")}
          </tbody>
        </table>
      </section>` : ""}

      ${churchRows?.length ? `
      <section class="a4-section">
        <h3 class="a4-section-title">5. Desempenho por Igreja / Congregação</h3>
        <table class="a4-table">
          <thead>
            <tr>
              <th>Igreja</th>
              <th style="text-align:right;">Total (MTn)</th>
              <th style="text-align:right;">Verificado</th>
              <th style="text-align:right;">Pendente</th>
              <th style="text-align:center;">Ofertantes</th>
            </tr>
          </thead>
          <tbody>
            ${churchRows.slice(0, 15).map((c) => `
              <tr>
                <td><strong>${c.church_name}</strong></td>
                <td style="text-align:right;">${money(c.total)}</td>
                <td style="text-align:right;color:#0f766e;">${money(c.verified)}</td>
                <td style="text-align:right;color:#b45309;">${money(c.pending)}</td>
                <td style="text-align:center;">${c.contributorCount}</td>
              </tr>`).join("")}
          </tbody>
        </table>
      </section>` : ""}

      ${cellRows?.length ? `
      <section class="a4-section">
        <h3 class="a4-section-title">6. Desempenho por Célula & Grupo</h3>
        <table class="a4-table">
          <thead>
            <tr>
              <th>Grupo de Célula</th>
              <th>Célula</th>
              <th style="text-align:right;">Total (MTn)</th>
              <th style="text-align:right;">Verificado</th>
              <th style="text-align:center;">Ofertantes</th>
            </tr>
          </thead>
          <tbody>
            ${cellRows.slice(0, 15).map((c) => `
              <tr>
                <td>${c.cell_group_name || "-"}</td>
                <td><strong>${c.cell_name || "-"}</strong></td>
                <td style="text-align:right;">${money(c.total)}</td>
                <td style="text-align:right;">${money(c.verified)}</td>
                <td style="text-align:center;">${c.contributorCount}</td>
              </tr>`).join("")}
          </tbody>
        </table>
      </section>` : ""}

      <section class="a4-section">
        <h3 class="a4-section-title">7. Registos Detalhados (${records.length} transações)</h3>
        <table class="a4-table a4-table-dense">
          <thead>
            <tr>
              <th>Data</th>
              <th>Contribuinte</th>
              <th>Categoria / Braço</th>
              <th>Método</th>
              <th style="text-align:right;">Valor (MTn)</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            ${records.slice(0, 100).map((r) => `
              <tr>
                <td>${financeRecordDate(r)}</td>
                <td>${r.contributor_name || r.nome || "-"}</td>
                <td>${r.contribution_category || "-"} ${r.partnership_arm ? `<small>(${r.partnership_arm})</small>` : ""}</td>
                <td>${r.metodo_de_pagamento || "-"}</td>
                <td style="text-align:right;"><strong>${money(r.amount ?? r.valor)}</strong></td>
                <td><span class="a4-badge a4-badge-${financeStatusTone(r)}">${r.estado || r.status || "-"}</span></td>
              </tr>`).join("")}
          </tbody>
        </table>
        ${records.length > 100 ? `<p style="font-size:0.75rem;color:#666;margin-top:4px;">* Mostrando os primeiros 100 registos de ${records.length}. Exporte para Excel (.xlsx) para ver a listagem na íntegra.</p>` : ""}
      </section>

      <footer class="a4-footer">
        <div class="a4-signatures">
          <div class="a4-sig-col">
            <div class="a4-sig-line"></div>
            <span>Preparado por: <strong>${meta.userName || "Departamento Financeiro"}</strong> (${meta.userRole || "Finance"})</span>
          </div>
          <div class="a4-sig-col">
            <div class="a4-sig-line"></div>
            <span>Aprovado por: <strong>Liderança Pastoral / Direcção Financeira</strong></span>
          </div>
        </div>
        <div class="a4-footer-bottom">
          <span>Embaixada de Cristo Moçambique · Sistema Integrado de Gestão Financeira</span>
          <span>Página 1 de 1 (ou conforme impressão)</span>
        </div>
      </footer>
    </div>
  `;
}

function exportFinancePrint(html, title = "Relatório Financeiro A4") {
  const win = window.open("", "_blank", "noopener,noreferrer,width=1080,height=850");
  if (!win) {
    alert("Por favor, permita pop-ups neste navegador para imprimir o relatório.");
    return;
  }
  win.document.write(`<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 10mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #ffffff;
      color: #1e293b;
      font-size: 11pt;
      line-height: 1.35;
      padding: 20px;
    }
    .a4-report-container {
      max-width: 820px;
      margin: 0 auto;
    }
    .a4-header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 14px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .a4-logo-crest {
      font-size: 13pt;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: 0.5px;
    }
    .a4-subbrand {
      font-size: 8pt;
      font-weight: 600;
      color: #64748b;
      margin-top: 2px;
    }
    .a4-title-block h2 {
      font-size: 14pt;
      color: #b45309;
      text-align: right;
      font-weight: 800;
    }
    .a4-meta-date {
      font-size: 8.5pt;
      color: #64748b;
      text-align: right;
    }
    .a4-filter-banner {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #b45309;
      padding: 8px 12px;
      font-size: 8.5pt;
      color: #334155;
      margin-bottom: 16px;
      border-radius: 4px;
    }
    .a4-section {
      margin-bottom: 18px;
      page-break-inside: avoid;
    }
    .a4-section-title {
      font-size: 10.5pt;
      font-weight: 700;
      color: #0f172a;
      border-bottom: 1.5px solid #cbd5e1;
      padding-bottom: 4px;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .a4-kpi-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 8px;
    }
    .a4-kpi-card {
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      border-radius: 6px;
      padding: 8px 12px;
    }
    .a4-kpi-label {
      font-size: 7.5pt;
      text-transform: uppercase;
      color: #64748b;
      font-weight: 700;
      display: block;
    }
    .a4-kpi-value {
      font-size: 13pt;
      font-weight: 800;
      color: #0f172a;
      display: block;
      margin: 2px 0;
    }
    .a4-kpi-sub {
      font-size: 7.5pt;
      color: #64748b;
    }
    .a4-grid-2col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }
    .a4-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5pt;
      margin-bottom: 4px;
    }
    .a4-table th, .a4-table td {
      border: 1px solid #e2e8f0;
      padding: 5px 8px;
      text-align: left;
    }
    .a4-table th {
      background: #0f172a;
      color: #ffffff;
      font-weight: 700;
      font-size: 8pt;
      text-transform: uppercase;
    }
    .a4-table tr:nth-child(even) {
      background: #f8fafc;
    }
    .a4-table-dense th, .a4-table-dense td {
      padding: 3.5px 6px;
      font-size: 8pt;
    }
    .a4-badge {
      font-size: 7pt;
      font-weight: 700;
      padding: 2px 5px;
      border-radius: 3px;
      display: inline-block;
    }
    .a4-badge-verified { background: #dcfce7; color: #15803d; }
    .a4-badge-pending { background: #fef3c7; color: #b45309; }
    .a4-badge-rejected { background: #fee2e2; color: #b91c1c; }
    .a4-footer {
      margin-top: 24px;
      border-top: 1px solid #cbd5e1;
      padding-top: 16px;
      page-break-inside: avoid;
    }
    .a4-signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-bottom: 16px;
    }
    .a4-sig-line {
      border-bottom: 1px solid #475569;
      height: 36px;
      margin-bottom: 6px;
    }
    .a4-sig-col span {
      font-size: 8pt;
      color: #475569;
      display: block;
    }
    .a4-footer-bottom {
      display: flex;
      justify-content: space-between;
      font-size: 7.5pt;
      color: #94a3b8;
      border-top: 1px dashed #e2e8f0;
      padding-top: 6px;
    }
    @media print {
      body { padding: 0; background: #fff; }
      .a4-report-container { max-width: 100%; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  ${html}
</body>
</html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 350);
}

function exportFinancePdf(html, title) {
  exportFinancePrint(html, title);
}

function financeReportFilterBar(filters, churches, labels) {
  const periodOptions = [
    ["month", labels.periodMonth || "Este Mês"],
    ["last_month", "Mês Anterior"],
    ["week", labels.periodWeek || "Esta Semana"],
    ["last_week", "Semana Anterior"],
    ["quarter", labels.periodQuarter || "Este Trimestre"],
    ["last_quarter", "Trimestre Anterior"],
    ["year", labels.periodYear || "Este Ano"],
    ["last_year", "Ano Anterior"],
    ["today", labels.periodToday || "Hoje"],
    ["yesterday", "Ontem"],
    ["custom", labels.periodCustom || "Personalizado (Datas)"],
    ["all", "Todo o Período"]
  ];
  const allCategories = [...FINANCE_GENERAL_CATEGORIES, ...FINANCE_PARTNERSHIP_ARMS];
  const frequencyOptions = [
    ["", labels.allFrequencies || "Todas Frequências"],
    ["consistent", labels.frequencyConsistent || "Consistente (Mensal)"],
    ["regular", labels.frequencyRegular || "Regular"],
    ["occasional", labels.frequencyOccasional || "Ocasional"]
  ];

  return `
    <div class="finance-report-filters filter-toolbar filter-bar light-surface mb-3 p-3 glass-panel">
      <div class="row g-2 align-items-center">
        <!-- Period -->
        <div class="col-sm-6 col-md-3 col-xl-2">
          <label class="small text-secondary fw-semibold d-block mb-1"><i class="bi bi-calendar3 me-1"></i>${labels.period || "Período"}</label>
          <select class="form-select form-select-sm" data-finance-report-filter="period" aria-label="${labels.period}">
            ${periodOptions.map(([v, l]) => `<option value="${v}" ${filters.period === v ? "selected" : ""}>${l}</option>`).join("")}
          </select>
        </div>

        <!-- Custom Date Range -->
        <div class="col-sm-6 col-md-3 col-xl-2 ${filters.period === "custom" ? "" : "d-none"}" data-finance-custom-date-container>
          <label class="small text-secondary fw-semibold d-block mb-1">${labels.from || "De"}</label>
          <input class="form-control form-control-sm" type="date" data-finance-report-filter="dateFrom" value="${filters.dateFrom || ""}" aria-label="${labels.from}">
        </div>
        <div class="col-sm-6 col-md-3 col-xl-2 ${filters.period === "custom" ? "" : "d-none"}" data-finance-custom-date-container>
          <label class="small text-secondary fw-semibold d-block mb-1">${labels.to || "Até"}</label>
          <input class="form-control form-control-sm" type="date" data-finance-report-filter="dateTo" value="${filters.dateTo || ""}" aria-label="${labels.to}">
        </div>

        <!-- Church -->
        <div class="col-sm-6 col-md-3 col-xl-2">
          <label class="small text-secondary fw-semibold d-block mb-1"><i class="bi bi-building me-1"></i>${labels.church || "Igreja"}</label>
          <select class="form-select form-select-sm" data-finance-report-filter="churchId" aria-label="${labels.church}">
            <option value="">${labels.allChurches || "Todas as Igrejas"}</option>
            ${churches.map((c) => `<option value="${c.id}" ${filters.churchId === c.id ? "selected" : ""}>${c.church_name}</option>`).join("")}
          </select>
        </div>

        <!-- Category -->
        <div class="col-sm-6 col-md-3 col-xl-2">
          <label class="small text-secondary fw-semibold d-block mb-1"><i class="bi bi-tags me-1"></i>${labels.category || "Categoria"}</label>
          <select class="form-select form-select-sm" data-finance-report-filter="category" aria-label="${labels.category}">
            <option value="">${labels.allCategories || "Todas Categorias"}</option>
            ${allCategories.map((c) => `<option value="${c}" ${filters.category === c ? "selected" : ""}>${c}</option>`).join("")}
          </select>
        </div>

        <!-- Contribution Type -->
        <div class="col-sm-6 col-md-3 col-xl-2">
          <label class="small text-secondary fw-semibold d-block mb-1"><i class="bi bi-collection me-1"></i>${labels.contributionType || "Tipo"}</label>
          <select class="form-select form-select-sm" data-finance-report-filter="contributionType" aria-label="${labels.contributionType}">
            <option value="">${labels.allTypes || "Todos os Tipos"}</option>
            ${FINANCE_CONTRIBUTION_GROUPS.map((g) => `<option value="${g}" ${filters.contributionType === g ? "selected" : ""}>${g}</option>`).join("")}
          </select>
        </div>

        <!-- Partnership Arm -->
        <div class="col-sm-6 col-md-3 col-xl-2">
          <label class="small text-secondary fw-semibold d-block mb-1"><i class="bi bi-heart me-1"></i>${labels.partnershipArm || "Braço"}</label>
          <select class="form-select form-select-sm" data-finance-report-filter="partnershipArm" aria-label="${labels.partnershipArm}">
            <option value="">${labels.allArms || "Todos Braços de Parceria"}</option>
            ${FINANCE_PARTNERSHIP_ARMS.map((a) => `<option value="${a}" ${filters.partnershipArm === a ? "selected" : ""}>${a}</option>`).join("")}
          </select>
        </div>

        <!-- Payment Method -->
        <div class="col-sm-6 col-md-3 col-xl-2">
          <label class="small text-secondary fw-semibold d-block mb-1"><i class="bi bi-wallet2 me-1"></i>${labels.method || "Método"}</label>
          <select class="form-select form-select-sm" data-finance-report-filter="method" aria-label="${labels.method}">
            <option value="">${labels.allMethods || "Todos Métodos"}</option>
            ${(window.paymentMethods || ["M-Pesa", "E-Mola", "Banco", "Dinheiro", "POS", "Outro"]).map((m) => `<option value="${m}" ${filters.method === m ? "selected" : ""}>${m}</option>`).join("")}
          </select>
        </div>

        <!-- Status -->
        <div class="col-sm-6 col-md-3 col-xl-2">
          <label class="small text-secondary fw-semibold d-block mb-1"><i class="bi bi-shield-check me-1"></i>${labels.status || "Estado"}</label>
          <select class="form-select form-select-sm" data-finance-report-filter="status" aria-label="${labels.status}">
            <option value="">${labels.allStatuses || "Todos Estados"}</option>
            ${(window.financeStatuses || ["Verificado", "Pendente de Verificação", "Rejeitado", "Incluído no Relatório"]).map((s) => `<option value="${s}" ${filters.status === s ? "selected" : ""}>${s}</option>`).join("")}
          </select>
        </div>

        <!-- Min Value -->
        <div class="col-sm-6 col-md-3 col-xl-2">
          <label class="small text-secondary fw-semibold d-block mb-1"><i class="bi bi-cash me-1"></i>${labels.minValue || "Valor Mínimo"}</label>
          <input class="form-control form-control-sm" type="number" min="0" step="100" data-finance-report-filter="minValue" value="${filters.minValue || ""}" placeholder="Ex: 500" aria-label="${labels.minValue}">
        </div>

        <!-- Contributor Search -->
        <div class="col-sm-6 col-md-3 col-xl-2">
          <label class="small text-secondary fw-semibold d-block mb-1"><i class="bi bi-person me-1"></i>${labels.contributor || "Contribuinte / Ref"}</label>
          <input class="form-control form-control-sm" type="search" data-finance-report-filter="contributor" value="${filters.contributor || ""}" placeholder="${labels.contributorPlaceholder || "Nome, telefone ou ref..."}" aria-label="${labels.contributor}">
        </div>

        <!-- Cell Group -->
        <div class="col-sm-6 col-md-3 col-xl-2">
          <label class="small text-secondary fw-semibold d-block mb-1"><i class="bi bi-diagram-3 me-1"></i>${labels.cellGroup || "Grupo de Célula"}</label>
          <select class="form-select form-select-sm" data-finance-report-filter="cellGroup" aria-label="${labels.cellGroup}">
            <option value="">${labels.cellGroup || "Todos Grupos de Célula"}</option>
            ${(window.CECellOptions?.groups?.() || []).map((group) => `<option value="${group.group_name}" ${filters.cellGroup === group.group_name ? "selected" : ""}>${group.group_name}</option>`).join("")}
          </select>
        </div>

        <!-- Cell -->
        <div class="col-sm-6 col-md-3 col-xl-2">
          <label class="small text-secondary fw-semibold d-block mb-1"><i class="bi bi-people me-1"></i>${labels.cell || "Célula"}</label>
          <select class="form-select form-select-sm" data-finance-report-filter="cell" aria-label="${labels.cell}">
            <option value="">${labels.cell || "Todas as Células"}</option>
            ${(window.CECellOptions?.cells?.() || []).map((cell) => `<option value="${cell.cell_name}" ${filters.cell === cell.cell_name ? "selected" : ""}>${cell.cell_name}</option>`).join("")}
          </select>
        </div>

        <!-- Frequency -->
        <div class="col-sm-6 col-md-3 col-xl-2">
          <label class="small text-secondary fw-semibold d-block mb-1"><i class="bi bi-repeat me-1"></i>${labels.frequency || "Frequência"}</label>
          <select class="form-select form-select-sm" data-finance-report-filter="frequency" aria-label="${labels.frequency}">
            ${frequencyOptions.map(([v, l]) => `<option value="${v}" ${filters.frequency === v ? "selected" : ""}>${l}</option>`).join("")}
          </select>
        </div>

        <!-- Action Buttons -->
        <div class="col-12 d-flex flex-wrap gap-2 justify-content-end mt-2 pt-2 border-top border-secondary-subtle">
          <button type="button" class="btn btn-sm btn-outline-secondary btn-touch" data-finance-report-reset title="Limpar todos os filtros">
            <i class="bi bi-arrow-counterclockwise me-1"></i>Limpar Filtros
          </button>
          <button type="button" class="btn btn-sm btn-ce-gold btn-touch" data-finance-report-apply>
            <i class="bi bi-search me-1"></i>${labels.search || "Actualizar / Pesquisar"}
          </button>
        </div>
      </div>
    </div>`;
}

// Global Exports
window.FINANCE_GENERAL_CATEGORIES = FINANCE_GENERAL_CATEGORIES;
window.FINANCE_PARTNERSHIP_ARMS = FINANCE_PARTNERSHIP_ARMS;
window.FINANCE_CONTRIBUTION_GROUPS = FINANCE_CONTRIBUTION_GROUPS;
window.FINANCE_CATEGORY_ALIASES = FINANCE_CATEGORY_ALIASES;
window.FINANCE_REPORT_CATEGORY_BUCKETS = FINANCE_REPORT_CATEGORY_BUCKETS;
window.normalizeFinanceCategory = normalizeFinanceCategory;
window.enrichFinanceRecord = enrichFinanceRecord;
window.classifyFinanceCategory = classifyFinanceCategory;
window.filterFinanceRecords = filterFinanceRecords;
window.getFinancePeriodRange = getFinancePeriodRange;
window.getPreviousPeriodRange = getPreviousPeriodRange;
window.computeFinanceReportStats = computeFinanceReportStats;
window.computeFinanceComparison = computeFinanceComparison;
window.groupFinanceByBucket = groupFinanceByBucket;
window.groupFinanceByPartnershipArm = groupFinanceByPartnershipArm;
window.computePartnershipArmDetails = computePartnershipArmDetails;
window.computeContributorProfiles = computeContributorProfiles;
window.financeDonutChart = financeDonutChart;
window.financeBarChart = financeBarChart;
window.financeReportFilterBar = financeReportFilterBar;
window.exportFinanceCsv = exportFinanceCsv;
window.exportFinanceExcel = exportFinanceExcel;
window.exportFinancePrint = exportFinancePrint;
window.exportFinancePdf = exportFinancePdf;
window.buildFinanceA4PrintHtml = buildFinanceA4PrintHtml;
window.financeContributorKey = financeContributorKey;
window.sumFinanceAmount = sumFinanceAmount;
window.FINANCE_CHART_COLORS = FINANCE_CHART_COLORS;
window.financeStatusTone = financeStatusTone;
window.computeContributorFrequency = computeContributorFrequency;
window.computeContributorDetail = computeContributorDetail;
window.groupFinanceMonthly = groupFinanceMonthly;
window.groupFinanceByChurch = groupFinanceByChurch;
window.groupFinanceByCell = groupFinanceByCell;
window.groupFinanceByMethod = groupFinanceByMethod;
window.computePartnerProfiles = computePartnerProfiles;
window.filterPartnerProfiles = filterPartnerProfiles;
window.financeLineChart = financeLineChart;
window.financeHBarChart = financeHBarChart;
window.financeChurchBarChart = financeChurchBarChart;
window.financeSemanticBarChart = financeSemanticBarChart;
