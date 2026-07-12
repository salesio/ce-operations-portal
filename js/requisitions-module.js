/**
 * Requisições & Aprovações — workflow helpers (frontend-first).
 */
(function () {
  "use strict";

  const STATUSES = {
    DRAFT: "Rascunho",
    SUBMITTED: "Submetido",
    UNDER_REVIEW: "Em Revisão",
    SENT_TO_PASTOR: "Enviado ao Pastor Principal",
    APPROVED: "Aprovado",
    REJECTED: "Rejeitado",
    RESOURCES_RELEASED: "Recursos Liberados",
    PURCHASED: "Comprado",
    REGISTERED: "Registado no Inventário",
    CLOSED: "Fechado"
  };

  const TYPES = [
    "Nova Aquisição", "Reparação", "Material de Ministério", "Transporte",
    "Evento/Programa", "Equipamento", "Pagamento de Serviço", "Apoio Operacional", "Outro"
  ];

  const URGENCY = ["Baixa", "Normal", "Alta", "Urgente"];

  const TAB_STATUS_MAP = {
    received: [STATUSES.SUBMITTED],
    review: [STATUSES.UNDER_REVIEW],
    pastoral: [STATUSES.SENT_TO_PASTOR],
    approved: [STATUSES.APPROVED, STATUSES.RESOURCES_RELEASED, STATUSES.PURCHASED, STATUSES.REGISTERED],
    rejected: [STATUSES.REJECTED],
    released: [STATUSES.RESOURCES_RELEASED, STATUSES.PURCHASED, STATUSES.REGISTERED],
    history: [STATUSES.CLOSED]
  };

  const INVENTORY_TYPES = new Set(["Nova Aquisição", "Equipamento"]);

  function accessApi() {
    return window.CEAccessControl || null;
  }

  function resolveAccess(user) {
    const lib = accessApi();
    return lib?.resolveModuleAccess?.(user, "requisitions") || { can_view: false };
  }

  function scopeFilter(list, user, access) {
    if (!Array.isArray(list)) return [];
    const scope = access.scope || "own";
    if (scope === "all") return list;
    if (scope === "church") return list.filter((r) => r.church_id === user.church_id);
    if (scope === "department") {
      const dept = user.assigned_department || user.department_name || "";
      return list.filter((r) => r.department_name === dept || r.church_id === user.church_id);
    }
    return list.filter((r) => r.requested_by_user_id === user.id);
  }

  function filterByTab(list, tab) {
    if (!tab || tab === "overview" || tab === "new") return list;
    const statuses = TAB_STATUS_MAP[tab];
    if (!statuses) return list;
    return list.filter((r) => statuses.includes(r.status));
  }

  function currentMonthApproved(list) {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return list.filter((r) => r.status === STATUSES.APPROVED && (r.approved_at || "").startsWith(ym));
  }

  function computeStats(list) {
    const pending = list.filter((r) => [STATUSES.SUBMITTED, STATUSES.DRAFT].includes(r.status)).length;
    const review = list.filter((r) => r.status === STATUSES.UNDER_REVIEW).length;
    const pastoral = list.filter((r) => r.status === STATUSES.SENT_TO_PASTOR).length;
    const approvedMonth = currentMonthApproved(list).length;
    const rejected = list.filter((r) => r.status === STATUSES.REJECTED).length;
    const released = list.filter((r) => r.status === STATUSES.RESOURCES_RELEASED).length;
    const approvedTotal = list
      .filter((r) => [STATUSES.APPROVED, STATUSES.RESOURCES_RELEASED, STATUSES.PURCHASED, STATUSES.REGISTERED, STATUSES.CLOSED].includes(r.status))
      .reduce((sum, r) => sum + Number(r.estimated_amount || r.amount_released || 0), 0);
    const pendingValue = list
      .filter((r) => [STATUSES.SUBMITTED, STATUSES.UNDER_REVIEW, STATUSES.SENT_TO_PASTOR].includes(r.status))
      .reduce((sum, r) => sum + Number(r.estimated_amount || 0), 0);
    return { pending, review, pastoral, approvedMonth, rejected, released, approvedTotal, pendingValue };
  }

  function canAct(user, action, record) {
    const access = resolveAccess(user);
    const role = user?.role || "";
    switch (action) {
      case "submit":
        return access.can_create && record.status === STATUSES.DRAFT && record.requested_by_user_id === user.id;
      case "edit":
        return access.can_edit && [STATUSES.DRAFT, STATUSES.SUBMITTED, STATUSES.UNDER_REVIEW].includes(record.status);
      case "review":
        return (access.can_review || role === "Requisition Officer" || access.can_edit) && record.status === STATUSES.SUBMITTED;
      case "forwardPastor":
        return (access.can_forward || role === "Requisition Officer") && record.status === STATUSES.UNDER_REVIEW;
      case "approve":
        return access.can_approve && role === "Main Pastor" && record.status === STATUSES.SENT_TO_PASTOR;
      case "reject":
        return (access.can_approve && role === "Main Pastor" && record.status === STATUSES.SENT_TO_PASTOR)
          || (access.can_review && record.status === STATUSES.UNDER_REVIEW);
      case "releaseResources":
        return (access.can_verify || role === "Finance Head") && record.status === STATUSES.APPROVED;
      case "markPurchased":
        return (access.can_edit || role === "Finance Head" || role === "Requisition Officer") && record.status === STATUSES.RESOURCES_RELEASED;
      case "registerInventory":
        return (access.can_register_inventory || role === "Venue Manager") && record.status === STATUSES.PURCHASED && INVENTORY_TYPES.has(record.requisition_type);
      case "close":
        return access.can_edit && [STATUSES.REGISTERED, STATUSES.PURCHASED, STATUSES.REJECTED].includes(record.status);
      default:
        return access.can_view;
    }
  }

  function availableActions(user, record) {
    const actions = ["view"];
    if (canAct(user, "edit", record)) actions.push("edit");
    if (canAct(user, "submit", record)) actions.push("submit");
    if (canAct(user, "review", record)) actions.push("review");
    if (canAct(user, "forwardPastor", record)) actions.push("forwardPastor");
    if (canAct(user, "approve", record)) actions.push("approve");
    if (canAct(user, "reject", record)) actions.push("reject");
    if (canAct(user, "releaseResources", record)) actions.push("releaseResources");
    if (canAct(user, "markPurchased", record)) actions.push("markPurchased");
    if (canAct(user, "registerInventory", record)) actions.push("registerInventory");
    if (canAct(user, "close", record)) actions.push("close");
    return actions;
  }

  function applyWorkflowAction(state, user, recordId, action, payload = {}) {
    const record = (state.requisitions || []).find((r) => r.id === recordId);
    if (!record || !canAct(user, action, record)) return { ok: false };

    const now = new Date().toISOString();
    const today = now.slice(0, 10);

    switch (action) {
      case "submit":
        record.status = STATUSES.SUBMITTED;
        break;
      case "review":
        record.status = STATUSES.UNDER_REVIEW;
        record.reviewed_by = user.name;
        record.reviewed_at = now;
        record.review_notes = payload.review_notes || record.review_notes || "";
        break;
      case "forwardPastor":
        record.status = STATUSES.SENT_TO_PASTOR;
        record.sent_to_main_pastor_at = now;
        record.review_notes = payload.review_notes || record.review_notes || "";
        break;
      case "approve":
        record.status = STATUSES.APPROVED;
        record.approved_by = user.name;
        record.approved_at = today;
        record.approval_notes = payload.approval_notes || "";
        break;
      case "reject":
        record.status = STATUSES.REJECTED;
        record.rejected_by = user.name;
        record.rejected_at = now;
        record.rejection_reason = payload.rejection_reason || payload.review_notes || "Rejeitado";
        break;
      case "releaseResources": {
        record.status = STATUSES.RESOURCES_RELEASED;
        record.resources_released_by = user.name;
        record.resources_released_at = now;
        record.amount_released = Number(payload.amount_released || record.estimated_amount || 0);
        const finId = `fin-req-${record.id}`;
        state.finance = Array.isArray(state.finance) ? state.finance : [];
        if (!state.finance.some((f) => f.id === finId)) {
          state.finance.push({
            id: finId,
            source: "requisition",
            source_type: "requisition",
            requisition_id: record.id,
            nome: record.department_name || "Requisição",
            apelido: record.request_number || "",
            telefone: "",
            church_id: record.church_id,
            igreja: record.church_name,
            categoria_da_contribuicao: "Apoio Operacional",
            metodo_de_pagamento: "Banco",
            valor: record.amount_released,
            data: today,
            estado: "Recursos Liberados",
            recebido_por: user.name,
            verificado_por: user.name,
            verified_at: now,
            observacoes: `Liberação de recursos — ${record.title}`,
            created_at: now,
            created_by: user.name,
            updated_by: user.name,
            updated_at: today
          });
        }
        record.finance_record_id = finId;
        break;
      }
      case "markPurchased":
        record.status = STATUSES.PURCHASED;
        break;
      case "registerInventory": {
        record.status = STATUSES.REGISTERED;
        state.venueInventory = state.venueInventory || {};
        state.venueInventory.inventory = Array.isArray(state.venueInventory.inventory) ? state.venueInventory.inventory : [];
        const invId = `inv-req-${record.id}`;
        if (!state.venueInventory.inventory.some((i) => i.id === invId)) {
          state.venueInventory.inventory.push({
            id: invId,
            church_id: record.church_id,
            created_by: user.name,
            updated_by: user.name,
            created_at: today,
            updated_at: today,
            status: "Bom",
            nome_do_item: record.title,
            categoria: record.requisition_type === "Equipamento" ? "Informática" : "Outros",
            quantidade: 1,
            estado: "Bom",
            localizacao: "A definir",
            departamento_responsavel: record.department_name,
            igreja: record.church_id,
            data_de_entrada: today,
            valor_unitario: record.amount_released || record.estimated_amount || 0,
            valor_total: record.amount_released || record.estimated_amount || 0,
            serial_number: "",
            observacoes: `Rascunho via requisição ${record.request_number}`,
            requisition_id: record.id,
            draft_from_requisition: true
          });
        }
        record.inventory_item_id = invId;
        break;
      }
      case "close":
        record.status = STATUSES.CLOSED;
        break;
      default:
        return { ok: false };
    }

    record.updated_at = now;
    return { ok: true, record };
  }

  function nextRequestNumber(list) {
    const year = new Date().getFullYear();
    const prefix = `REQ-${year}-`;
    const nums = (list || [])
      .map((r) => r.request_number)
      .filter((n) => n && n.startsWith(prefix))
      .map((n) => Number(n.replace(prefix, "")) || 0);
    const next = (nums.length ? Math.max(...nums) : 0) + 1;
    return `${prefix}${String(next).padStart(4, "0")}`;
  }

  window.CERequisitions = {
    STATUSES,
    TYPES,
    URGENCY,
    TAB_STATUS_MAP,
    resolveAccess,
    scopeFilter,
    filterByTab,
    computeStats,
    canAct,
    availableActions,
    applyWorkflowAction,
    nextRequestNumber
  };
})();