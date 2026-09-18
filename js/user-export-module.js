/**
 * Unified User Export Module — Christ Embassy Mozambique Operations
 * Supports multi-dimensional filtering (Church, Cell Group, Cell, Role, Auth Link, Status),
 * dynamic cascading dropdowns, real-time live preview, customizable columns,
 * and multi-format exports (Excel .xlsx, PDF/Print, CSV, Clipboard).
 */
(function () {
  "use strict";

  const ROLE_TAXONOMY = [
    { key: "Super Admin", label: "Super Admin", labelPt: "Super Admin" },
    { key: "Main Pastor", label: "Main Pastor", labelPt: "Pastor Principal" },
    { key: "National Admin", label: "National Admin", labelPt: "Administrador Nacional" },
    { key: "Church Pastor", label: "Church Pastor", labelPt: "Pastor da Igreja" },
    { key: "Church Admin", label: "Church Admin", labelPt: "Administrador da Igreja" },
    { key: "Pastoral Care Rector", label: "Pastoral Care Rector", labelPt: "Reitor de Cuidados Pastorais" },
    { key: "ALEC Manager", label: "ALEC Manager", labelPt: "Gestor ALEC" },
    { key: "ALEC Coordinator", label: "ALEC Coordinator", labelPt: "Coordenador ALEC" },
    { key: "Cell Ministry Head", label: "Cell Ministry Head", labelPt: "Responsável de Células" },
    { key: "Cell Group Leader", label: "Cell Group Leader", labelPt: "Líder de Grupo de Células" },
    { key: "Cell Leader", label: "Cell Leader", labelPt: "Líder de Célula" },
    { key: "Cell Assistant", label: "Cell Assistant", labelPt: "Assistente de Célula" },
    { key: "Venue Manager", label: "Venue Manager", labelPt: "Gestor de Património" },
    { key: "Finance Head", label: "Finance Head", labelPt: "Responsável de Finanças" },
    { key: "Finance Officer", label: "Finance Officer", labelPt: "Oficial de Finanças" },
    { key: "Counselor", label: "Counselor", labelPt: "Conselheiro Pastoral" },
    { key: "FEVO Coordinator", label: "F.E.V.O Coordinator", labelPt: "Coordenador F.E.V.O" },
    { key: "Follow-Up Coordinator", label: "Follow-Up Coordinator", labelPt: "Coordenador Follow-Up" },
    { key: "Foundation Rector", label: "Foundation Rector", labelPt: "Reitor Escola de Fundação" },
    { key: "Foundation Teacher", label: "Foundation Teacher", labelPt: "Professor Escola de Fundação" }
  ];

  const EXPORT_COLUMNS = [
    { id: "name", label: "Nome Completo", labelEn: "Full Name", default: true },
    { id: "email", label: "Email", labelEn: "Email", default: true },
    { id: "role", label: "Função / Role", labelEn: "Role", default: true },
    { id: "auth_status", label: "Estado Auth", labelEn: "Auth Link", default: true },
    { id: "status", label: "Estado da Conta", labelEn: "Account Status", default: true },
    { id: "church", label: "Igreja", labelEn: "Church", default: true },
    { id: "cell_group", label: "Grupo de Célula", labelEn: "Cell Group", default: true },
    { id: "cell_name", label: "Célula", labelEn: "Cell", default: true },
    { id: "phone", label: "Contacto / Tel", labelEn: "Phone", default: false },
    { id: "department_permissions", label: "Permissões de Depto", labelEn: "Dept Permissions", default: false },
    { id: "created_at", label: "Data de Registo", labelEn: "Registered Date", default: false },
    { id: "updated_at", label: "Última Actualização", labelEn: "Last Updated", default: false }
  ];

  let injectedState = null;

  let currentFilterState = {
    church_id: "",
    cell_group_id: "",
    cell_id: "",
    role: "",
    status: "",
    auth_link: "",
    search: ""
  };

  let selectedColumnIds = new Set(EXPORT_COLUMNS.filter((c) => c.default).map((c) => c.id));

  function getLang() {
    if (typeof window !== "undefined") {
      if (typeof window.getLang === "function") return window.getLang();
      if (typeof window.lang === "string") return window.lang;
    }
    if (typeof lang !== "undefined" && lang) return lang;
    try {
      return localStorage.getItem("ce-dashboard-lang") || "pt";
    } catch (_) {
      return "pt";
    }
  }

  function getState() {
    if (injectedState && typeof injectedState === "object") return injectedState;
    if (typeof window !== "undefined") {
      if (window.state && typeof window.state === "object") return window.state;
      if (typeof window.getState === "function") {
        const s = window.getState();
        if (s && typeof s === "object") return s;
      }
      try {
        const key = window.STORAGE_KEY || "ce-ops-dashboard-v3";
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === "object") return parsed;
        }
      } catch (_) {}
    }
    return {};
  }

  function getChurches() {
    const s = getState();
    const list = [
      ...(Array.isArray(s.churches) ? s.churches : []),
      ...(typeof window !== "undefined" && Array.isArray(window.REAL_CHURCHES) ? window.REAL_CHURCHES : [])
    ];
    const seen = new Set();
    const result = [];
    list.forEach((c) => {
      if (!c) return;
      const id = String(c.id || c.church_id || "");
      const name = String(c.church_name || c.public_name || c.name || id).trim();
      if (!id && !name) return;
      const key = (id || name).toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        result.push({
          id: id || name,
          church_name: name,
          public_name: name,
          name: name
        });
      }
    });
    return result;
  }

  function getCellGroups() {
    const s = getState();
    const list = [
      ...(typeof window !== "undefined" && typeof window.getAllRegisteredCellGroups === "function" ? window.getAllRegisteredCellGroups() : []),
      ...(Array.isArray(s.cellGroups) ? s.cellGroups : []),
      ...(s.cellMinistry?.groups && Array.isArray(s.cellMinistry.groups) ? s.cellMinistry.groups : []),
      ...(typeof window !== "undefined" && Array.isArray(window.REAL_CELL_GROUPS) ? window.REAL_CELL_GROUPS : [])
    ];
    const seen = new Set();
    const result = [];
    list.forEach((g) => {
      if (!g) return;
      const id = String(g.id || g.group_id || g.name || g.group_name || "");
      const name = String(g.group_name || g.name || id).trim();
      const churchId = String(g.church_id || g.igreja || "").trim();
      if (!id && !name) return;
      const key = (id || name).toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        result.push({
          id: id || name,
          group_name: name,
          name: name,
          church_id: churchId
        });
      }
    });
    return result;
  }

  function getCells() {
    const s = getState();
    const list = [
      ...(typeof window !== "undefined" && typeof window.getAllRegisteredCells === "function" ? window.getAllRegisteredCells() : []),
      ...(Array.isArray(s.cellRegistry) ? s.cellRegistry : []),
      ...(Array.isArray(s.cells) ? s.cells : []),
      ...(typeof window !== "undefined" && Array.isArray(window.REAL_CELLS_REGISTRY) ? window.REAL_CELLS_REGISTRY : [])
    ];
    const seen = new Set();
    const result = [];
    list.forEach((c) => {
      if (!c) return;
      const id = String(c.id || c.cell_id || c.name || c.cell_name || "");
      const name = String(c.cell_name || c.nome_da_celula || c.name || id).trim();
      const churchId = String(c.church_id || c.igreja || "").trim();
      const groupId = String(c.group_id || c.cell_group_id || "").trim();
      const groupName = String(c.group_name || c.cell_group_name || "").trim();
      if (!id && !name) return;
      const key = (id || name).toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        result.push({
          id: id || name,
          cell_name: name,
          name: name,
          church_id: churchId,
          group_id: groupId,
          group_name: groupName
        });
      }
    });
    return result;
  }

  function normalizeRoleString(str) {
    return String(str || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[\s_-]+/g, " ")
      .trim();
  }

  function getCanonicalRoleKeys(roleStr) {
    const norm = normalizeRoleString(roleStr);
    if (!norm) return [];
    const keys = new Set([norm]);
    const found = ROLE_TAXONOMY.find(
      (r) =>
        normalizeRoleString(r.key) === norm ||
        normalizeRoleString(r.label) === norm ||
        normalizeRoleString(r.labelPt) === norm
    );
    if (found) {
      keys.add(normalizeRoleString(found.key));
      keys.add(normalizeRoleString(found.label));
      keys.add(normalizeRoleString(found.labelPt));
    }
    return Array.from(keys);
  }

  function matchRole(userRole, filterRole) {
    if (!filterRole) return true;
    const filterNorm = normalizeRoleString(filterRole);
    const userNorm = normalizeRoleString(userRole);
    if (!userNorm) return false;
    if (userNorm === filterNorm || userNorm.includes(filterNorm) || filterNorm.includes(userNorm)) return true;

    const filterCanonical = getCanonicalRoleKeys(filterRole);
    const userCanonical = getCanonicalRoleKeys(userRole);
    return filterCanonical.some((k) => userCanonical.includes(k));
  }

  function resolveRoleLabel(role) {
    if (!role) return "—";
    const roleNorm = normalizeRoleString(role);
    const found = ROLE_TAXONOMY.find(
      (r) =>
        normalizeRoleString(r.key) === roleNorm ||
        normalizeRoleString(r.label) === roleNorm ||
        normalizeRoleString(r.labelPt) === roleNorm
    );
    if (found) return getLang() === "pt" ? found.labelPt : found.label;
    return role;
  }

  function getResolvedUsers() {
    const s = getState();
    const rawUsers = (s.users || []).filter((u) => {
      if (!u || !u.id) return false;
      if (typeof window !== "undefined" && typeof window.isUserDeleted === "function" && window.isUserDeleted(u)) return false;
      if (typeof isUserDeleted === "function" && isUserDeleted(u)) return false;
      return true;
    });

    const seenEmails = new Set();
    const seenIds = new Set();
    const cleanUsers = [];

    rawUsers.forEach((u) => {
      const emailNorm = u.email ? String(u.email).trim().toLowerCase() : "";
      const id = String(u.id);
      if (!seenIds.has(id) && (!emailNorm || !seenEmails.has(emailNorm))) {
        seenIds.add(id);
        if (emailNorm) seenEmails.add(emailNorm);
        cleanUsers.push(u);
      }
    });

    return cleanUsers;
  }

  function filterUsersList(users, filters = {}) {
    const fChurch = String(filters.church_id || "").trim();
    const fGroup = String(filters.cell_group_id || "").trim();
    const fCell = String(filters.cell_id || "").trim();
    const fRole = String(filters.role || "").trim();
    const fStatus = String(filters.status || "").trim().toLowerCase();
    const fAuth = String(filters.auth_link || "").trim().toLowerCase();
    const fSearch = String(filters.search || "").trim().toLowerCase();

    const allGroups = getCellGroups();
    const allCells = getCells();
    const allChurches = getChurches();

    const targetChurch = fChurch ? allChurches.find((c) => String(c.id) === fChurch || c.church_name === fChurch || c.name === fChurch) : null;
    const targetGroup = fGroup ? allGroups.find((g) => String(g.id) === fGroup || g.group_name === fGroup || g.name === fGroup) : null;
    const targetGroupName = targetGroup ? (targetGroup.group_name || targetGroup.name) : fGroup;
    const targetCell = fCell ? allCells.find((c) => String(c.id) === fCell || c.cell_name === fCell || c.name === fCell) : null;
    const targetCellName = targetCell ? (targetCell.cell_name || targetCell.name) : fCell;

    return (users || []).filter((u) => {
      // 1. Church filter
      if (fChurch) {
        const uChurch = String(u.church_id || u.igreja || "").trim();
        const uChurchName = String(u.church_name || (typeof window !== "undefined" && typeof window.churchName === "function" ? window.churchName(uChurch) : (typeof churchName === "function" ? churchName(uChurch) : ""))).trim();
        const matchesId = uChurch === fChurch || (targetChurch && (uChurch === targetChurch.id || uChurch === targetChurch.church_name));
        const matchesName = targetChurch && (uChurchName.toLowerCase() === targetChurch.church_name.toLowerCase() || uChurchName.toLowerCase() === targetChurch.id.toLowerCase());
        const hasAllAccess = Boolean(u.can_view_all_churches);

        if (!matchesId && !matchesName && !hasAllAccess) return false;
      }

      // 2. Cell Group filter
      if (fGroup) {
        const uGroupId = String(u.cell_group_id || "").trim();
        const uGroupName = String(u.cell_group_name || "").trim();
        const assignedGroups = Array.isArray(u.assigned_cell_groups) ? u.assigned_cell_groups : [];

        const matchesGroup =
          uGroupId === fGroup ||
          (targetGroup && uGroupId === targetGroup.id) ||
          uGroupName.toLowerCase() === targetGroupName.toLowerCase() ||
          assignedGroups.some((g) => String(g) === fGroup || String(g).toLowerCase() === targetGroupName.toLowerCase());

        let cellBelongsToGroup = false;
        if (!matchesGroup && (u.cell_id || u.cell_name)) {
          const userCell = allCells.find((c) => String(c.id) === String(u.cell_id) || c.cell_name === u.cell_name || c.name === u.cell_name);
          if (userCell && (String(userCell.group_id) === fGroup || (targetGroup && String(userCell.group_id) === targetGroup.id) || String(userCell.group_name || "").toLowerCase() === targetGroupName.toLowerCase())) {
            cellBelongsToGroup = true;
          }
        }

        if (!matchesGroup && !cellBelongsToGroup) return false;
      }

      // 3. Cell filter
      if (fCell) {
        const uCellId = String(u.cell_id || "").trim();
        const uCellName = String(u.cell_name || u.celula || "").trim();
        const assignedCells = Array.isArray(u.assigned_cells) ? u.assigned_cells : [];

        const matchesCell =
          uCellId === fCell ||
          (targetCell && uCellId === targetCell.id) ||
          uCellName.toLowerCase() === targetCellName.toLowerCase() ||
          assignedCells.some((c) => String(c) === fCell || String(c).toLowerCase() === targetCellName.toLowerCase());

        if (!matchesCell) return false;
      }

      // 4. Role filter
      if (fRole) {
        const rawRole = String(u.role || u.role_name || "");
        if (!matchRole(rawRole, fRole)) return false;
      }

      // 5. Account Status filter
      if (fStatus) {
        const rawStatus = String(u.status || "active").toLowerCase();
        if (fStatus === "active" && (/lock|bloque|suspend|inactiv|inativ/i.test(rawStatus) || u.isActive === false)) return false;
        if (fStatus === "inactive" && !/lock|bloque|suspend|inactiv|inativ/i.test(rawStatus) && u.isActive !== false) return false;
        if (fStatus === "locked" && !/lock|bloque/i.test(rawStatus)) return false;
      }

      // 6. Auth Link filter
      if (fAuth) {
        const isLinked = Boolean(u.auth_user_id);
        if (fAuth === "linked" && !isLinked) return false;
        if (fAuth === "pending" && isLinked) return false;
      }

      // 7. Search query
      if (fSearch) {
        const targetStr = [
          u.name,
          u.full_name,
          u.email,
          u.phone,
          u.contacto,
          u.kingschat_username,
          u.role,
          u.cell_name,
          u.cell_group_name
        ].filter(Boolean).join(" ").toLowerCase();
        if (!targetStr.includes(fSearch)) return false;
      }

      return true;
    });
  }

  function resolveChurchDisplayName(churchId) {
    if (!churchId) return "—";
    if (typeof window !== "undefined" && typeof window.churchName === "function") {
      return window.churchName(churchId);
    }
    if (typeof churchName === "function") {
      return churchName(churchId);
    }
    const c = getChurches().find((item) => String(item.id) === String(churchId));
    return c ? (c.church_name || c.public_name || c.name) : churchId;
  }

  function mapUserToExportRow(u) {
    const isPt = getLang() === "pt";
    const allCells = getCells();
    const allGroups = getCellGroups();

    const linkedCell = allCells.find(
      (c) => String(c.id) === String(u.cell_id) || c.cell_name === u.cell_id || c.name === u.cell_id
    );
    const linkedGroup = allGroups.find(
      (g) => String(g.id) === String(u.cell_group_id) || g.group_name === u.cell_group_id || g.name === u.cell_group_id
    );

    const cName = resolveChurchDisplayName(u.church_id);
    const cellNameStr = u.cell_name || (linkedCell ? (linkedCell.cell_name || linkedCell.nome_da_celula || linkedCell.name) : (u.assigned_cells?.length ? `${u.assigned_cells.length} célula(s)` : "—"));
    const cellGroupNameStr = u.cell_group_name || (linkedGroup ? (linkedGroup.group_name || linkedGroup.name) : "—");
    const authLabel = u.auth_user_id ? (isPt ? "Ligado (Linked)" : "Linked") : (isPt ? "Pendente (Pending Setup)" : "Pending Setup");
    const statusLabel = u.status || "Active";
    const depts = Array.isArray(u.department_permissions) ? (u.department_permissions.includes("*") ? (isPt ? "Todos (*)" : "All (*)") : u.department_permissions.join(", ")) : "—";
    const phone = u.phone || u.contacto || u.primary_phone || "—";
    const createdAt = u.created_at ? String(u.created_at).slice(0, 10) : "—";
    const updatedAt = u.updated_at ? String(u.updated_at).slice(0, 10) : "—";

    return {
      name: u.name || u.full_name || "—",
      email: u.email || "—",
      role: resolveRoleLabel(u.role || u.role_name),
      auth_status: authLabel,
      status: statusLabel,
      church: cName,
      cell_group: cellGroupNameStr,
      cell_name: cellNameStr,
      phone: phone,
      department_permissions: depts,
      created_at: createdAt,
      updated_at: updatedAt
    };
  }

  function getActiveExportColumns() {
    const isPt = getLang() === "pt";
    return EXPORT_COLUMNS.filter((c) => selectedColumnIds.has(c.id)).map((c) => ({
      id: c.id,
      label: isPt ? c.label : c.labelEn
    }));
  }

  function getExportRows(users) {
    const activeCols = getActiveExportColumns();
    const mapped = (users || []).map(mapUserToExportRow);
    return {
      headers: activeCols.map((c) => c.label),
      rows: mapped.map((m) => activeCols.map((c) => m[c.id] ?? "—"))
    };
  }

  function exportToCsv(filteredUsers, filename) {
    const { headers, rows } = getExportRows(filteredUsers);
    const escapeCell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csvContent = "\uFEFF" + [
      headers.map(escapeCell).join(";"),
      ...rows.map((r) => r.map(escapeCell).join(";"))
    ].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || `utilizadores-ce-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function exportToExcel(filteredUsers, filename) {
    const isPt = getLang() === "pt";
    const activeCols = getActiveExportColumns();
    const mapped = (filteredUsers || []).map(mapUserToExportRow);
    const tableData = mapped.map((m) => {
      const rowObj = {};
      activeCols.forEach((col) => {
        rowObj[col.label] = m[col.id] ?? "—";
      });
      return rowObj;
    });

    const fileBase = filename || `utilizadores-ce-${new Date().toISOString().slice(0, 10)}.xlsx`;

    // 1. SheetJS real .xlsx file
    if (typeof window !== "undefined" && window.XLSX && typeof window.XLSX.utils?.json_to_sheet === "function") {
      const ws = window.XLSX.utils.json_to_sheet(tableData);
      const colWidths = activeCols.map((col) => {
        const maxLen = Math.max(
          col.label.length,
          ...tableData.map((r) => String(r[col.label] || "").length)
        );
        return { wch: Math.min(Math.max(maxLen + 3, 12), 40) };
      });
      ws["!cols"] = colWidths;

      const wb = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(wb, ws, isPt ? "Utilizadores" : "Users");
      window.XLSX.writeFile(wb, fileBase);
      return;
    }

    // 2. Fallback XML / HTML table format
    const headerHtml = activeCols.map((c) => `<th>${c.label}</th>`).join("");
    const bodyHtml = mapped.map((m) => `<tr>${activeCols.map((c) => `<td>${m[c.id] ?? ""}</td>`).join("")}</tr>`).join("");
    const html = `<html><head><meta charset="utf-8"></head><body><table border="1"><caption>Christ Embassy Mozambique — ${isPt ? "Relatório de Utilizadores" : "Users Report"}</caption><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table></body></html>`;
    const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileBase.replace(/\.xlsx$/i, ".xls");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function exportToPdf(filteredUsers, filters) {
    const isPt = getLang() === "pt";
    const { headers, rows } = getExportRows(filteredUsers);
    const churchLabel = filters.church_id ? resolveChurchDisplayName(filters.church_id) : (isPt ? "Todas as Igrejas" : "All Churches");
    const roleLabel = filters.role ? resolveRoleLabel(filters.role) : (isPt ? "Todas as Funções" : "All Roles");
    const activeCount = filteredUsers.filter((u) => !/lock|bloque|suspend|inactiv|inativ/i.test(String(u.status || "Active")) && u.isActive !== false).length;
    const linkedCount = filteredUsers.filter((u) => Boolean(u.auth_user_id)).length;
    const pendingCount = filteredUsers.filter((u) => !u.auth_user_id).length;
    const printDate = new Date().toLocaleString(isPt ? "pt-MZ" : "en-US");
    const adminName = (typeof window !== "undefined" && window.activeUser?.name) || "Admin";

    const win = window.open("", "_blank", "noopener,noreferrer,width=1024,height=768");
    if (!win) {
      alert(isPt ? "Permita pop-ups no navegador para gerar o relatório PDF/Impressão." : "Please allow pop-ups to generate PDF/Print report.");
      return;
    }

    const html = `<!DOCTYPE html>
<html lang="${isPt ? "pt" : "en"}">
<head>
  <meta charset="utf-8">
  <title>${isPt ? "Relatório de Utilizadores & Acessos" : "Users & Access Report"} — Christ Embassy</title>
  <style>
    @page { size: A4 landscape; margin: 12mm 10mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #1e293b; background: #fff; margin: 0; padding: 1.5rem; font-size: 11px; line-height: 1.4; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #002d62; padding-bottom: 1rem; margin-bottom: 1.2rem; }
    .brand h1 { margin: 0 0 2px 0; color: #002d62; font-size: 18px; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px; }
    .brand p { margin: 0; color: #d4af37; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .meta-box { text-align: right; color: #64748b; font-size: 10px; }
    .meta-box strong { color: #0f172a; }
    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 1.2rem; }
    .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; }
    .summary-card .label { font-size: 9px; text-transform: uppercase; color: #64748b; font-weight: 700; display: block; margin-bottom: 2px; }
    .summary-card .val { font-size: 15px; font-weight: 800; color: #002d62; }
    .filter-tags { margin-bottom: 1rem; padding: 6px 10px; background: #f1f5f9; border-radius: 4px; font-size: 10px; color: #475569; }
    .filter-tags strong { color: #0f172a; }
    table { width: 100%; border-collapse: collapse; margin-top: 0.5rem; }
    th { background: #002d62; color: #ffffff; text-align: left; padding: 7px 8px; font-size: 10px; font-weight: 700; text-transform: uppercase; border: 1px solid #002d62; }
    td { padding: 6px 8px; border: 1px solid #e2e8f0; font-size: 10.5px; color: #334155; }
    tr:nth-child(even) td { background: #f8fafc; }
    .footer { margin-top: 1.5rem; padding-top: 0.8rem; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 9px; color: #94a3b8; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
      th { background: #002d62 !important; color: #fff !important; -webkit-print-color-adjust: exact; }
      tr:nth-child(even) td { background: #f8fafc !important; -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <h1>Christ Embassy Mozambique</h1>
      <p>${isPt ? "Portal de Operações — Relatório Geral de Utilizadores & Funções" : "Operations Portal — Users & Roles Master Report"}</p>
    </div>
    <div class="meta-box">
      <div>${isPt ? "Gerado por" : "Generated by"}: <strong>${adminName}</strong></div>
      <div>${isPt ? "Data" : "Date"}: <strong>${printDate}</strong></div>
      <div>${isPt ? "Total Registos" : "Total Records"}: <strong>${filteredUsers.length}</strong></div>
    </div>
  </div>

  <div class="summary-grid">
    <div class="summary-card">
      <span class="label">${isPt ? "Total Utilizadores" : "Total Users"}</span>
      <span class="val">${filteredUsers.length}</span>
    </div>
    <div class="summary-card">
      <span class="label">${isPt ? "Contas Activas" : "Active Accounts"}</span>
      <span class="val">${activeCount}</span>
    </div>
    <div class="summary-card">
      <span class="label">${isPt ? "Auth Ligado" : "Auth Linked"}</span>
      <span class="val">${linkedCount}</span>
    </div>
    <div class="summary-card">
      <span class="label">${isPt ? "Pendente Auth" : "Pending Setup"}</span>
      <span class="val">${pendingCount}</span>
    </div>
  </div>

  <div class="filter-tags">
    <strong>${isPt ? "Critérios de Filtro" : "Applied Filters"}:</strong>
    ${isPt ? "Igreja" : "Church"}: <strong>${churchLabel}</strong> |
    ${isPt ? "Função" : "Role"}: <strong>${roleLabel}</strong>
    ${filters.cell_group_id ? ` | ${isPt ? "Grupo" : "Group"}: <strong>${filters.cell_group_id}</strong>` : ""}
    ${filters.cell_id ? ` | ${isPt ? "Célula" : "Cell"}: <strong>${filters.cell_id}</strong>` : ""}
    ${filters.status ? ` | ${isPt ? "Estado" : "Status"}: <strong>${filters.status}</strong>` : ""}
    ${filters.auth_link ? ` | Auth: <strong>${filters.auth_link}</strong>` : ""}
    ${filters.search ? ` | ${isPt ? "Pesquisa" : "Search"}: "<em>${filters.search}</em>"` : ""}
  </div>

  <table>
    <thead>
      <tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>
    </thead>
    <tbody>
      ${rows.length ? rows.map((r) => `<tr>${r.map((c) => `<td>${c ?? "—"}</td>`).join("")}</tr>`).join("") : `<tr><td colspan="${headers.length}" style="text-align:center;padding:2rem;">${isPt ? "Nenhum utilizador encontrado com os filtros aplicados." : "No users found matching filters."}</td></tr>`}
    </tbody>
  </table>

  <div class="footer">
    <span>Christ Embassy Mozambique Operations Portal © ${new Date().getFullYear()}</span>
    <span>${isPt ? "Página 1 de 1" : "Page 1 of 1"}</span>
  </div>
</body>
</html>`;

    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
    }, 450);
  }

  function copyTableToClipboard(filteredUsers) {
    const isPt = getLang() === "pt";
    const { headers, rows } = getExportRows(filteredUsers);
    const tsvContent = [
      headers.join("\t"),
      ...rows.map((r) => r.join("\t"))
    ].join("\n");

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(tsvContent).then(() => {
        if (typeof showToast === "function") {
          showToast(isPt ? "Dados copiados para a área de transferência!" : "User data copied to clipboard!");
        } else if (typeof window.showToast === "function") {
          window.showToast(isPt ? "Dados copiados para a área de transferência!" : "User data copied to clipboard!");
        } else {
          alert(isPt ? "Dados copiados para a área de transferência!" : "User data copied to clipboard!");
        }
      }).catch((err) => {
        console.warn("[CE Export] clipboard copy failed", err);
      });
    }
  }

  function buildUserExportModalHtml() {
    const isPt = getLang() === "pt";
    const churches = getChurches();
    const cellGroups = getCellGroups();
    const cells = getCells();

    return `
    <div class="modal fade user-export-modal" id="userExportModal" tabindex="-1" aria-labelledby="userExportModalTitle" aria-hidden="true">
      <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content glass-panel border border-secondary border-opacity-25 shadow-2xl">
          <div class="modal-header border-bottom border-secondary border-opacity-25 py-3 px-4">
            <div class="d-flex align-items-center gap-3">
              <div class="rounded-circle p-2 bg-primary bg-opacity-25 text-primary">
                <i class="bi bi-file-earmark-arrow-down fs-4"></i>
              </div>
              <div>
                <span class="eyebrow text-gold mb-0">${isPt ? "SUITE DE EXPORTAÇÃO" : "EXPORT SUITE"}</span>
                <h3 class="modal-title h5 text-white mb-0" id="userExportModalTitle">${isPt ? "Exportar Utilizadores & Acessos" : "Export Users & Roles"}</h3>
              </div>
            </div>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>

          <div class="modal-body p-4">
            <!-- Filter Grid -->
            <div class="card bg-dark bg-opacity-50 border border-secondary border-opacity-25 p-3 mb-4 rounded-3">
              <div class="d-flex align-items-center justify-content-between mb-3">
                <h4 class="h6 text-white mb-0 d-flex align-items-center gap-2">
                  <i class="bi bi-funnel text-gold"></i>
                  ${isPt ? "Critérios de Filtro & Agrupamento" : "Filter & Grouping Criteria"}
                </h4>
                <button type="button" class="btn btn-sm btn-outline-secondary py-0 px-2" id="btnResetUserExportFilters">
                  <i class="bi bi-arrow-counterclockwise me-1"></i>${isPt ? "Limpar Filtros" : "Reset Filters"}
                </button>
              </div>

              <div class="row g-3">
                <!-- 1. Church -->
                <div class="col-12 col-md-6 col-lg-4">
                  <label class="form-label small text-white-50">${isPt ? "Igreja" : "Church"}</label>
                  <select class="form-select form-select-sm" id="ueFilterChurch">
                    <option value="">${isPt ? "Todas as Igrejas" : "All Churches"}</option>
                    ${churches.map((c) => `<option value="${c.id}">${c.church_name || c.public_name || c.name}</option>`).join("")}
                  </select>
                </div>

                <!-- 2. Cell Group -->
                <div class="col-12 col-md-6 col-lg-4">
                  <label class="form-label small text-white-50">${isPt ? "Grupo de Célula" : "Cell Group"}</label>
                  <select class="form-select form-select-sm" id="ueFilterCellGroup">
                    <option value="">${isPt ? "Todos os Grupos de Célula" : "All Cell Groups"}</option>
                    ${cellGroups.map((g) => `<option value="${g.id || g.name}">${g.group_name || g.name}</option>`).join("")}
                  </select>
                </div>

                <!-- 3. Individual Cell -->
                <div class="col-12 col-md-6 col-lg-4">
                  <label class="form-label small text-white-50">${isPt ? "Célula Individual" : "Individual Cell"}</label>
                  <select class="form-select form-select-sm" id="ueFilterCell">
                    <option value="">${isPt ? "Todas as Células" : "All Individual Cells"}</option>
                    ${cells.map((c) => `<option value="${c.id || c.name}">${c.cell_name || c.nome_da_celula || c.name}</option>`).join("")}
                  </select>
                </div>

                <!-- 4. Role -->
                <div class="col-12 col-md-6 col-lg-4">
                  <label class="form-label small text-white-50">${isPt ? "Função / Role" : "Role"}</label>
                  <select class="form-select form-select-sm" id="ueFilterRole">
                    <option value="">${isPt ? "Todas as Funções" : "All Roles"}</option>
                    ${ROLE_TAXONOMY.map((r) => `<option value="${r.key}">${isPt ? r.labelPt : r.label}</option>`).join("")}
                  </select>
                </div>

                <!-- 5. Status -->
                <div class="col-12 col-md-6 col-lg-4">
                  <label class="form-label small text-white-50">${isPt ? "Estado da Conta" : "Account Status"}</label>
                  <select class="form-select form-select-sm" id="ueFilterStatus">
                    <option value="">${isPt ? "Todos os Estados" : "All Statuses"}</option>
                    <option value="active">${isPt ? "Activos" : "Active"}</option>
                    <option value="inactive">${isPt ? "Inactivos / Suspensos" : "Inactive / Suspended"}</option>
                  </select>
                </div>

                <!-- 6. Auth Link -->
                <div class="col-12 col-md-6 col-lg-4">
                  <label class="form-label small text-white-50">${isPt ? "Estado Auth Link" : "Auth Link Status"}</label>
                  <select class="form-select form-select-sm" id="ueFilterAuth">
                    <option value="">${isPt ? "Todos (Linked & Pendente)" : "All (Linked & Pending)"}</option>
                    <option value="linked">${isPt ? "Ligado (Linked)" : "Linked"}</option>
                    <option value="pending">${isPt ? "Pendente Setup (Pending)" : "Pending Setup"}</option>
                  </select>
                </div>

                <!-- 7. Search -->
                <div class="col-12">
                  <div class="input-group input-group-sm">
                    <span class="input-group-text bg-dark border-secondary border-opacity-25 text-white-50"><i class="bi bi-search"></i></span>
                    <input type="text" class="form-control" id="ueFilterSearch" placeholder="${isPt ? "Pesquisar por nome, email, telefone ou função..." : "Search by name, email, phone or role..."}">
                  </div>
                </div>
              </div>
            </div>

            <!-- Column Selection Pills -->
            <div class="card bg-dark bg-opacity-50 border border-secondary border-opacity-25 p-3 mb-4 rounded-3">
              <div class="d-flex align-items-center justify-content-between mb-2">
                <h4 class="h6 text-white mb-0 d-flex align-items-center gap-2">
                  <i class="bi bi-layout-three-columns text-gold"></i>
                  ${isPt ? "Colunas a Incluir no Ficheiro" : "Columns to Include in File"}
                </h4>
                <div class="d-flex gap-2">
                  <button type="button" class="btn btn-sm btn-link text-decoration-none text-gold p-0 small" id="btnSelectAllCols">${isPt ? "Seleccionar Todos" : "Select All"}</button>
                  <span class="text-white-50">|</span>
                  <button type="button" class="btn btn-sm btn-link text-decoration-none text-white-50 p-0 small" id="btnResetCols">${isPt ? "Padrão" : "Default"}</button>
                </div>
              </div>

              <div class="d-flex flex-wrap gap-2 pt-1" id="ueColumnSelectorGroup">
                ${EXPORT_COLUMNS.map((col) => `
                  <label class="btn btn-sm ${selectedColumnIds.has(col.id) ? "btn-primary" : "btn-outline-secondary"} text-nowrap rounded-pill py-1 px-3 d-flex align-items-center gap-2" style="cursor:pointer;">
                    <input type="checkbox" class="d-none ue-col-checkbox" data-col-id="${col.id}" ${selectedColumnIds.has(col.id) ? "checked" : ""}>
                    <i class="bi ${selectedColumnIds.has(col.id) ? "bi-check-circle-fill" : "bi-circle"}"></i>
                    ${isPt ? col.label : col.labelEn}
                  </label>
                `).join("")}
              </div>
            </div>

            <!-- Live Summary & Preview -->
            <div class="d-flex align-items-center justify-content-between mb-2">
              <div class="d-flex align-items-center gap-2">
                <span class="badge bg-ce-blue fs-6 px-3 py-2 rounded-pill" id="ueFilteredCountBadge">0 ${isPt ? "utilizadores" : "users"}</span>
                <span class="small text-white-50">${isPt ? "Prontos para exportação" : "Ready for export"}</span>
              </div>
              <button type="button" class="btn btn-sm btn-outline-info" id="btnCopyClipboardExport">
                <i class="bi bi-clipboard me-1"></i>${isPt ? "Copiar Tabela" : "Copy Table"}
              </button>
            </div>

            <!-- Live Table Preview -->
            <div class="table-responsive bg-dark bg-opacity-75 border border-secondary border-opacity-25 rounded-3" style="max-height: 240px;">
              <table class="table table-dark table-striped table-hover table-sm mb-0 align-middle small" id="uePreviewTable">
                <thead class="sticky-top bg-dark">
                  <tr id="uePreviewThead"></tr>
                </thead>
                <tbody id="uePreviewTbody"></tbody>
              </table>
            </div>
          </div>

          <!-- Modal Footer with Format Buttons -->
          <div class="modal-footer border-top border-secondary border-opacity-25 p-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
            <button type="button" class="btn btn-outline-light" data-bs-dismiss="modal">
              ${isPt ? "Fechar" : "Close"}
            </button>
            <div class="d-flex flex-wrap gap-2">
              <button type="button" class="btn btn-outline-cyan" id="btnExportCsv">
                <i class="bi bi-filetype-csv me-1"></i>${isPt ? "Exportar CSV" : "Export CSV"}
              </button>
              <button type="button" class="btn btn-outline-danger" id="btnExportPdf">
                <i class="bi bi-file-earmark-pdf me-1"></i>${isPt ? "PDF / Imprimir" : "PDF / Print"}
              </button>
              <button type="button" class="btn btn-ce-gold fw-bold px-4" id="btnExportExcel">
                <i class="bi bi-file-earmark-excel me-1"></i>${isPt ? "Exportar Excel (.xlsx)" : "Export Excel (.xlsx)"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>`;
  }

  function updatePreviewAndCounts() {
    const isPt = getLang() === "pt";
    const allUsers = getResolvedUsers();
    const filtered = filterUsersList(allUsers, currentFilterState);

    // Update count badge
    const badgeEl = document.getElementById("ueFilteredCountBadge");
    if (badgeEl) {
      badgeEl.textContent = `${filtered.length} ${filtered.length === 1 ? (isPt ? "utilizador" : "user") : (isPt ? "utilizadores" : "users")}`;
    }

    // Update preview table
    const theadEl = document.getElementById("uePreviewThead");
    const tbodyEl = document.getElementById("uePreviewTbody");
    if (!theadEl || !tbodyEl) return;

    const { headers, rows } = getExportRows(filtered);
    theadEl.innerHTML = headers.map((h) => `<th class="text-nowrap">${h}</th>`).join("");

    if (!rows.length) {
      tbodyEl.innerHTML = `<tr><td colspan="${headers.length || 1}" class="text-center py-4 text-white-50">${isPt ? "Nenhum utilizador corresponde aos filtros seleccionados." : "No users match selected filters."}</td></tr>`;
      return;
    }

    const previewRows = rows.slice(0, 15);
    tbodyEl.innerHTML = previewRows.map((r) => `<tr>${r.map((c) => `<td class="text-nowrap">${c ?? "—"}</td>`).join("")}</tr>`).join("");
  }

  function repopulateDropdowns() {
    const isPt = getLang() === "pt";
    const churchSelect = document.getElementById("ueFilterChurch");
    const groupSelect = document.getElementById("ueFilterCellGroup");
    const cellSelect = document.getElementById("ueFilterCell");

    const selectedChurchId = churchSelect?.value || currentFilterState.church_id || "";
    const selectedGroupId = groupSelect?.value || currentFilterState.cell_group_id || "";
    const selectedCellId = cellSelect?.value || currentFilterState.cell_id || "";

    const allChurches = getChurches();
    const allGroups = getCellGroups();
    const allCells = getCells();

    // 1. Churches
    if (churchSelect) {
      const cur = churchSelect.value;
      churchSelect.innerHTML = `<option value="">${isPt ? "Todas as Igrejas" : "All Churches"}</option>` +
        allChurches.map((c) => `<option value="${c.id}" ${c.id === cur ? "selected" : ""}>${c.church_name || c.public_name || c.name}</option>`).join("");
    }

    // 2. Cell Groups (filter by selected church if any)
    if (groupSelect) {
      const filteredGroups = selectedChurchId
        ? allGroups.filter((g) => !g.church_id || String(g.church_id) === selectedChurchId)
        : allGroups;
      groupSelect.innerHTML = `<option value="">${isPt ? "Todos os Grupos de Célula" : "All Cell Groups"}</option>` +
        filteredGroups.map((g) => `<option value="${g.id || g.name}" ${g.id === selectedGroupId || g.name === selectedGroupId ? "selected" : ""}>${g.group_name || g.name}</option>`).join("");
    }

    // 3. Cells (filter by selected group and church if any)
    if (cellSelect) {
      let filteredCells = allCells;
      if (selectedChurchId) {
        filteredCells = filteredCells.filter((c) => !c.church_id || String(c.church_id) === selectedChurchId);
      }
      if (selectedGroupId) {
        filteredCells = filteredCells.filter((c) => String(c.group_id) === selectedGroupId || c.group_name === selectedGroupId || String(c.cell_group_id) === selectedGroupId);
      }
      cellSelect.innerHTML = `<option value="">${isPt ? "Todas as Células" : "All Individual Cells"}</option>` +
        filteredCells.map((c) => `<option value="${c.id || c.name}" ${c.id === selectedCellId || c.name === selectedCellId ? "selected" : ""}>${c.cell_name || c.nome_da_celula || c.name}</option>`).join("");
    }
  }

  function mountExportModalEvents() {
    const modalEl = document.getElementById("userExportModal");
    if (!modalEl) return;

    const churchSelect = document.getElementById("ueFilterChurch");
    const groupSelect = document.getElementById("ueFilterCellGroup");
    const cellSelect = document.getElementById("ueFilterCell");
    const roleSelect = document.getElementById("ueFilterRole");
    const statusSelect = document.getElementById("ueFilterStatus");
    const authSelect = document.getElementById("ueFilterAuth");
    const searchInput = document.getElementById("ueFilterSearch");

    function onFilterChange() {
      currentFilterState.church_id = churchSelect?.value || "";
      currentFilterState.cell_group_id = groupSelect?.value || "";
      currentFilterState.cell_id = cellSelect?.value || "";
      currentFilterState.role = roleSelect?.value || "";
      currentFilterState.status = statusSelect?.value || "";
      currentFilterState.auth_link = authSelect?.value || "";
      currentFilterState.search = searchInput?.value || "";
      updatePreviewAndCounts();
    }

    // Cascading Church selection
    churchSelect?.addEventListener("change", () => {
      currentFilterState.church_id = churchSelect.value;
      repopulateDropdowns();
      onFilterChange();
    });

    // Cascading Cell Group selection
    groupSelect?.addEventListener("change", () => {
      currentFilterState.cell_group_id = groupSelect.value;
      repopulateDropdowns();
      onFilterChange();
    });

    cellSelect?.addEventListener("change", onFilterChange);
    roleSelect?.addEventListener("change", onFilterChange);
    statusSelect?.addEventListener("change", onFilterChange);
    authSelect?.addEventListener("change", onFilterChange);
    searchInput?.addEventListener("input", onFilterChange);
    searchInput?.addEventListener("keyup", onFilterChange);

    // Reset filters button
    document.getElementById("btnResetUserExportFilters")?.addEventListener("click", () => {
      currentFilterState = {
        church_id: "",
        cell_group_id: "",
        cell_id: "",
        role: "",
        status: "",
        auth_link: "",
        search: ""
      };
      if (churchSelect) churchSelect.value = "";
      if (groupSelect) groupSelect.value = "";
      if (cellSelect) cellSelect.value = "";
      if (roleSelect) roleSelect.value = "";
      if (statusSelect) statusSelect.value = "";
      if (authSelect) authSelect.value = "";
      if (searchInput) searchInput.value = "";
      repopulateDropdowns();
      updatePreviewAndCounts();
    });

    // Column selector pill events
    const groupWrapper = document.getElementById("ueColumnSelectorGroup");
    groupWrapper?.addEventListener("change", (e) => {
      const target = e.target;
      if (target && target.classList.contains("ue-col-checkbox")) {
        const colId = target.dataset.colId;
        const parentBtn = target.closest("label");
        if (target.checked) {
          selectedColumnIds.add(colId);
          parentBtn?.classList.replace("btn-outline-secondary", "btn-primary");
          const icon = parentBtn?.querySelector("i");
          if (icon) icon.className = "bi bi-check-circle-fill";
        } else {
          selectedColumnIds.delete(colId);
          parentBtn?.classList.replace("btn-primary", "btn-outline-secondary");
          const icon = parentBtn?.querySelector("i");
          if (icon) icon.className = "bi bi-circle";
        }
        updatePreviewAndCounts();
      }
    });

    // Select All columns
    document.getElementById("btnSelectAllCols")?.addEventListener("click", () => {
      selectedColumnIds = new Set(EXPORT_COLUMNS.map((c) => c.id));
      groupWrapper?.querySelectorAll(".ue-col-checkbox").forEach((cb) => {
        cb.checked = true;
        const parentBtn = cb.closest("label");
        parentBtn?.classList.replace("btn-outline-secondary", "btn-primary");
        const icon = parentBtn?.querySelector("i");
        if (icon) icon.className = "bi bi-check-circle-fill";
      });
      updatePreviewAndCounts();
    });

    // Reset default columns
    document.getElementById("btnResetCols")?.addEventListener("click", () => {
      selectedColumnIds = new Set(EXPORT_COLUMNS.filter((c) => c.default).map((c) => c.id));
      groupWrapper?.querySelectorAll(".ue-col-checkbox").forEach((cb) => {
        const isDefault = selectedColumnIds.has(cb.dataset.colId);
        cb.checked = isDefault;
        const parentBtn = cb.closest("label");
        if (isDefault) {
          parentBtn?.classList.replace("btn-outline-secondary", "btn-primary");
          const icon = parentBtn?.querySelector("i");
          if (icon) icon.className = "bi bi-check-circle-fill";
        } else {
          parentBtn?.classList.replace("btn-primary", "btn-outline-secondary");
          const icon = parentBtn?.querySelector("i");
          if (icon) icon.className = "bi bi-circle";
        }
      });
      updatePreviewAndCounts();
    });

    // Export button actions
    document.getElementById("btnExportExcel")?.addEventListener("click", () => {
      const allUsers = getResolvedUsers();
      const filtered = filterUsersList(allUsers, currentFilterState);
      exportToExcel(filtered);
    });

    document.getElementById("btnExportCsv")?.addEventListener("click", () => {
      const allUsers = getResolvedUsers();
      const filtered = filterUsersList(allUsers, currentFilterState);
      exportToCsv(filtered);
    });

    document.getElementById("btnExportPdf")?.addEventListener("click", () => {
      const allUsers = getResolvedUsers();
      const filtered = filterUsersList(allUsers, currentFilterState);
      exportToPdf(filtered, currentFilterState);
    });

    document.getElementById("btnCopyClipboardExport")?.addEventListener("click", () => {
      const allUsers = getResolvedUsers();
      const filtered = filterUsersList(allUsers, currentFilterState);
      copyTableToClipboard(filtered);
    });
  }

  function openUserExportModal(initialOptions = {}) {
    if (initialOptions && initialOptions.state) {
      injectedState = initialOptions.state;
    }

    currentFilterState = {
      church_id: initialOptions.church_id || "",
      cell_group_id: initialOptions.cell_group_id || "",
      cell_id: initialOptions.cell_id || "",
      role: initialOptions.role || "",
      status: initialOptions.status || "",
      auth_link: initialOptions.auth_link || "",
      search: initialOptions.search || ""
    };

    let modalEl = document.getElementById("userExportModal");
    if (modalEl) {
      modalEl.remove();
    }

    const modalHtml = buildUserExportModalHtml();
    document.body.insertAdjacentHTML("beforeend", modalHtml);

    repopulateDropdowns();

    // Set initial values if provided
    const churchSelect = document.getElementById("ueFilterChurch");
    const groupSelect = document.getElementById("ueFilterCellGroup");
    const cellSelect = document.getElementById("ueFilterCell");
    const roleSelect = document.getElementById("ueFilterRole");
    const statusSelect = document.getElementById("ueFilterStatus");
    const authSelect = document.getElementById("ueFilterAuth");
    const searchInput = document.getElementById("ueFilterSearch");

    if (churchSelect && currentFilterState.church_id) churchSelect.value = currentFilterState.church_id;
    if (groupSelect && currentFilterState.cell_group_id) groupSelect.value = currentFilterState.cell_group_id;
    if (cellSelect && currentFilterState.cell_id) cellSelect.value = currentFilterState.cell_id;
    if (roleSelect && currentFilterState.role) roleSelect.value = currentFilterState.role;
    if (statusSelect && currentFilterState.status) statusSelect.value = currentFilterState.status;
    if (authSelect && currentFilterState.auth_link) authSelect.value = currentFilterState.auth_link;
    if (searchInput && currentFilterState.search) searchInput.value = currentFilterState.search;

    mountExportModalEvents();
    updatePreviewAndCounts();

    modalEl = document.getElementById("userExportModal");
    if (modalEl && typeof bootstrap !== "undefined" && bootstrap.Modal) {
      const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);
      bsModal.show();
    }
  }

  window.CEUserExport = {
    openUserExportModal,
    filterUsersList,
    exportToExcel,
    exportToPdf,
    exportToCsv,
    copyTableToClipboard,
    getChurches,
    getCellGroups,
    getCells,
    getResolvedUsers,
    ROLE_TAXONOMY,
    EXPORT_COLUMNS
  };
})();
