import { getDataProvider } from "../dataProvider";
import { getDataSource } from "../config";
import type {
  EntityId,
  MaterialDistribution,
  MaterialFund,
  MaterialReport,
  MaterialRequest,
  MaterialSale,
  MaterialStock,
  MaterialStockMovement,
  MinistryMaterial,
} from "../types/entities";
import type { DataResult } from "../types/repository";
import { MINISTRY_MATERIALS_CATALOG_SEED } from "../seeds/ministryMaterialsCatalogSeed";
import { MINISTRY_MATERIALS_STOCK_SEED } from "../seeds/ministryMaterialsStockSeed";
import { MINISTRY_MATERIALS_SALES_SEED } from "../seeds/ministryMaterialsSalesSeed";
import { MINISTRY_MATERIALS_DISTRIBUTIONS_SEED } from "../seeds/ministryMaterialsDistributionsSeed";
import { MINISTRY_MATERIALS_REQUESTS_SEED } from "../seeds/ministryMaterialsRequestsSeed";
import { MINISTRY_MATERIALS_FUNDS_SEED } from "../seeds/ministryMaterialsFundsSeed";
import { MINISTRY_MATERIALS_REPORTS_SEED } from "../seeds/ministryMaterialsReportsSeed";

function fail<T>(error: string, code = "MATERIALS_ERROR"): DataResult<T> {
  return { ok: false, error, code };
}
function ok<T>(data: T): DataResult<T> {
  return { ok: true, data };
}
function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
function nowIso(): string {
  return new Date().toISOString();
}
function sk(s: string | null | undefined): string {
  return String(s || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}
function nextNum(prefix: string, nums: string[]): string {
  const year = new Date().getFullYear();
  const re = new RegExp(`^${prefix}-${year}-(\\d+)$`, "i");
  let max = 0;
  for (const n of nums) {
    const m = String(n || "").match(re);
    if (m) max = Math.max(max, Number(m[1]) || 0);
  }
  return `${prefix}-${year}-${String(max + 1).padStart(4, "0")}`;
}

async function softAudit(action: string, entityType: string, entityId: string, details = "") {
  try {
    const root = globalThis as unknown as {
      CEAccessControlData?: { createAuditLog?: (p: Record<string, unknown>) => Promise<unknown> };
      CEDataLayer?: {
        accessControl?: { createAuditLog?: (p: Record<string, unknown>) => Promise<unknown> };
      };
    };
    const api = root.CEAccessControlData || root.CEDataLayer?.accessControl;
    if (api?.createAuditLog) {
      await api.createAuditLog({
        action,
        entity_type: entityType,
        entity_id: entityId,
        module: "ministryMaterials",
        details,
        severity: /sale|fund|fulfill|approve|reject|adjust|export/i.test(action)
          ? "warning"
          : "info",
      });
    }
  } catch {
    /* soft */
  }
}

// ---------------------------------------------------------------------------
// Normalize (dual-map EN + PT UI)
// ---------------------------------------------------------------------------

export function normalizeMinistryMaterial(
  input: Partial<MinistryMaterial> & { id?: string },
): MinistryMaterial {
  const name = input.name || input.titulo_do_material || "";
  const status = input.status || input.estado || "Active";
  const price = Number(input.unit_price ?? input.preco ?? 0);
  const reorder = Number(input.reorder_level ?? input.stock_minimo ?? 0);
  return {
    ...input,
    id: input.id || `mat-${Date.now()}`,
    material_code: input.material_code || "",
    name,
    titulo_do_material: input.titulo_do_material || name,
    category: input.category || input.tipo || "Other",
    tipo: input.tipo || input.category || "",
    language: input.language || "Portuguese",
    unit_price: price,
    preco: Number(input.preco ?? price),
    currency: input.currency || "MTn",
    is_free_distribution_allowed: input.is_free_distribution_allowed !== false,
    is_sellable: input.is_sellable !== false,
    is_digital: !!input.is_digital,
    formato: input.formato || (input.is_digital ? "Digital" : "Físico"),
    reorder_level: reorder,
    stock_minimo: Number(input.stock_minimo ?? reorder),
    stock_actual: Number(input.stock_actual ?? 0),
    status,
    estado: input.estado || status,
    notes: input.notes || input.observacoes || "",
    observacoes: input.observacoes || input.notes || "",
    created_at: input.created_at || nowIso(),
    updated_at: input.updated_at || todayIso(),
  };
}

export function normalizeMaterialStock(
  input: Partial<MaterialStock> & { id?: string },
): MaterialStock {
  const name = input.material_name || input.titulo_do_material || "";
  const qty = Number(input.quantity_available ?? input.stock_final ?? 0);
  const reorder = Number(input.reorder_level ?? 0);
  let status = input.status || input.estado || "Available";
  if (qty <= 0) status = "Out of Stock";
  else if (reorder > 0 && qty <= reorder) status = "Low Stock";
  return {
    ...input,
    id: input.id || `mstock-${Date.now()}`,
    material_id: input.material_id || null,
    material_name: name,
    titulo_do_material: input.titulo_do_material || name,
    quantity_available: qty,
    quantity_reserved: Number(input.quantity_reserved ?? 0),
    quantity_distributed: Number(input.quantity_distributed ?? 0),
    quantity_sold: Number(input.quantity_sold ?? 0),
    reorder_level: reorder,
    semana_inicio: input.semana_inicio || null,
    semana_fim: input.semana_fim || null,
    stock_inicial: input.stock_inicial != null ? Number(input.stock_inicial) : null,
    entradas: input.entradas != null ? Number(input.entradas) : null,
    saidas: input.saidas != null ? Number(input.saidas) : null,
    stock_final: input.stock_final != null ? Number(input.stock_final) : qty,
    diferenca: input.diferenca != null ? Number(input.diferenca) : null,
    status,
    estado: input.estado || status,
    last_stock_update: input.last_stock_update || todayIso(),
    notes: input.notes || input.observacoes || "",
    observacoes: input.observacoes || input.notes || "",
    created_at: input.created_at || nowIso(),
    updated_at: input.updated_at || todayIso(),
  };
}

export function normalizeMaterialStockMovement(
  input: Partial<MaterialStockMovement> & { id?: string },
): MaterialStockMovement {
  return {
    ...input,
    id: input.id || `mmov-${Date.now()}`,
    material_id: input.material_id || null,
    material_name: input.material_name || "",
    movement_type: input.movement_type || "Adjustment",
    quantity: Number(input.quantity ?? 0),
    source_type: input.source_type || "Manual",
    movement_date: input.movement_date || todayIso(),
    notes: input.notes || "",
    created_at: input.created_at || nowIso(),
    updated_at: input.updated_at || todayIso(),
  };
}

export function normalizeMaterialSale(
  input: Partial<MaterialSale> & { id?: string },
): MaterialSale {
  const name = input.material_name || input.titulo_do_material || "";
  const qty = Number(input.quantity ?? input.quantidade ?? 0);
  const total = Number(input.total_amount ?? input.valor ?? 0);
  const status = input.status || input.estado || "Completed";
  return {
    ...input,
    id: input.id || `sale-${Date.now()}`,
    sale_number: input.sale_number || "",
    material_id: input.material_id || null,
    material_name: name,
    titulo_do_material: input.titulo_do_material || name,
    quantity: qty,
    quantidade: Number(input.quantidade ?? qty),
    unit_price: Number(input.unit_price ?? (qty ? total / qty : 0)),
    total_amount: total,
    valor: Number(input.valor ?? total),
    currency: input.currency || "MTn",
    buyer_type: input.buyer_type || "Other",
    buyer_name: input.buyer_name || input.comprador || "",
    comprador: input.comprador || input.buyer_name || "",
    church_id: input.church_id || input.igreja || null,
    igreja: input.igreja || input.church_id || "",
    payment_method: input.payment_method || input.metodo_de_pagamento || "",
    metodo_de_pagamento: input.metodo_de_pagamento || input.payment_method || "",
    payment_reference: input.payment_reference || input.pop_prova_de_pagamento || "",
    pop_prova_de_pagamento: input.pop_prova_de_pagamento || input.payment_reference || "",
    payment_status: input.payment_status || "Paid",
    finance_record_id: input.finance_record_id ?? null,
    sale_date: input.sale_date || input.data || todayIso(),
    data: input.data || input.sale_date || todayIso(),
    semana_do_relatorio: input.semana_do_relatorio || "",
    sold_by_name: input.sold_by_name || input.recebido_por || "",
    recebido_por: input.recebido_por || input.sold_by_name || "",
    status,
    estado: input.estado || status,
    notes: input.notes || input.observacoes || "",
    observacoes: input.observacoes || input.notes || "",
    created_at: input.created_at || nowIso(),
    updated_at: input.updated_at || todayIso(),
  };
}

export function normalizeMaterialDistribution(
  input: Partial<MaterialDistribution> & { id?: string },
): MaterialDistribution {
  const name = input.material_name || input.titulo_do_material || "";
  const qty = Number(input.quantity ?? input.quantidade ?? 0);
  const status = input.status || input.estado || "Pending";
  return {
    ...input,
    id: input.id || `dist-${Date.now()}`,
    distribution_number: input.distribution_number || "",
    material_id: input.material_id || null,
    material_name: name,
    titulo_do_material: input.titulo_do_material || name,
    quantity: qty,
    quantidade: Number(input.quantidade ?? qty),
    distribution_type: input.distribution_type || input.tipo_de_distribuicao || "Free",
    tipo_de_distribuicao: input.tipo_de_distribuicao || input.distribution_type || "",
    target_type: input.target_type || "Church",
    church_id: input.church_id || null,
    igreja_destinataria: input.igreja_destinataria || input.target_id || "",
    prison_id: input.prison_id || null,
    distribution_date: input.distribution_date || input.data || todayIso(),
    data: input.data || input.distribution_date || todayIso(),
    responsavel_pelo_envio: input.responsavel_pelo_envio || input.distributed_by_name || "",
    status,
    estado: input.estado || status,
    notes: input.notes || input.observacoes || "",
    observacoes: input.observacoes || input.notes || "",
    created_at: input.created_at || nowIso(),
    updated_at: input.updated_at || todayIso(),
  };
}

export function normalizeMaterialRequest(
  input: Partial<MaterialRequest> & { id?: string },
): MaterialRequest {
  return {
    ...input,
    id: input.id || `mreq-${Date.now()}`,
    request_number: input.request_number || "",
    source: input.source || "Manual",
    source_module: input.source_module || "",
    source_id: input.source_id || null,
    material_id: input.material_id || null,
    material_name: input.material_name || "",
    material_type: input.material_type || "",
    quantity_requested: Number(input.quantity_requested ?? 0),
    quantity_approved: Number(input.quantity_approved ?? 0),
    quantity_fulfilled: Number(input.quantity_fulfilled ?? 0),
    target_type: input.target_type || "Church",
    status: input.status || "Pending",
    notes: input.notes || "",
    created_at: input.created_at || nowIso(),
    updated_at: input.updated_at || todayIso(),
  };
}

export function normalizeMaterialFund(
  input: Partial<MaterialFund> & { id?: string },
): MaterialFund {
  const amount = Number(input.amount ?? input.valor_levantado ?? 0);
  const status = input.status || input.estado || "Recorded Internally";
  return {
    ...input,
    id: input.id || `fund-${Date.now()}`,
    fund_number: input.fund_number || "",
    source: input.source || "Other",
    amount,
    currency: input.currency || "MTn",
    status,
    estado: input.estado || status,
    finance_record_id: input.finance_record_id ?? null,
    campanha: input.campanha || "",
    valor_alvo: Number(input.valor_alvo ?? 0),
    valor_levantado: Number(input.valor_levantado ?? amount),
    notes: input.notes || input.observacoes || "",
    observacoes: input.observacoes || input.notes || "",
    created_at: input.created_at || nowIso(),
    updated_at: input.updated_at || todayIso(),
  };
}

export function normalizeMaterialReport(
  input: Partial<MaterialReport> & { id?: string },
): MaterialReport {
  return {
    ...input,
    id: input.id || `mrep-${Date.now()}`,
    name: input.name || "Relatório de Materiais",
    quantity: Number(input.quantity ?? 0),
    amount: Number(input.amount ?? 0),
    currency: input.currency || "MTn",
    status: input.status || input.estado || "Completed",
    estado: input.estado || input.status || "Concluído",
    created_at: input.created_at || nowIso(),
    updated_at: input.updated_at || todayIso(),
  };
}

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

export async function listMaterialsCatalog(): Promise<DataResult<MinistryMaterial[]>> {
  try {
    const r = await getDataProvider().ministryMaterialsCatalog.list();
    if (!r.ok) return r as DataResult<MinistryMaterial[]>;
    return ok((r.data || []).map((x) => normalizeMinistryMaterial(x as MinistryMaterial)));
  } catch (e) {
    return fail(e instanceof Error ? e.message : "listMaterialsCatalog failed");
  }
}

export async function getMaterialById(id: EntityId) {
  try {
    const r = await getDataProvider().ministryMaterialsCatalog.getById(id);
    if (!r.ok) return r as DataResult<MinistryMaterial | null>;
    return ok(r.data ? normalizeMinistryMaterial(r.data as MinistryMaterial) : null);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "getMaterialById failed");
  }
}

export async function createMaterial(payload: Partial<MinistryMaterial>) {
  try {
    const repo = getDataProvider().ministryMaterialsCatalog;
    const list = await listMaterialsCatalog();
    const codes = (list.ok ? list.data : []).map((m) => m.material_code || "");
    const row = normalizeMinistryMaterial({
      ...payload,
      material_code: payload.material_code || nextNum("MAT", codes),
    });
    const created = await repo.create!(row);
    if (!created.ok) return created as DataResult<MinistryMaterial>;
    await softAudit("create_material", "MinistryMaterial", created.data!.id, row.name || "");
    return ok(normalizeMinistryMaterial(created.data as MinistryMaterial));
  } catch (e) {
    return fail(e instanceof Error ? e.message : "createMaterial failed");
  }
}

export async function updateMaterial(id: EntityId, payload: Partial<MinistryMaterial>) {
  try {
    const existing = await getMaterialById(id);
    if (!existing.ok || !existing.data) return fail("Material não encontrado", "NOT_FOUND");
    const merged = normalizeMinistryMaterial({ ...existing.data, ...payload, id });
    const r = await getDataProvider().ministryMaterialsCatalog.update!(id, merged);
    if (!r.ok) return r as DataResult<MinistryMaterial>;
    await softAudit("update_material", "MinistryMaterial", id);
    return ok(normalizeMinistryMaterial(r.data as MinistryMaterial));
  } catch (e) {
    return fail(e instanceof Error ? e.message : "updateMaterial failed");
  }
}

export async function deleteMaterial(id: EntityId) {
  try {
    const r = await getDataProvider().ministryMaterialsCatalog.remove!(id);
    if (!r.ok) return r as DataResult<boolean>;
    await softAudit("delete_material", "MinistryMaterial", id);
    return ok(true);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "deleteMaterial failed");
  }
}

export async function searchMaterials(query: string) {
  const list = await listMaterialsCatalog();
  if (!list.ok) return list;
  const q = sk(query);
  if (!q) return list;
  return ok(
    list.data.filter(
      (m) =>
        sk(m.name).includes(q) ||
        sk(m.titulo_do_material).includes(q) ||
        sk(m.material_code).includes(q) ||
        sk(m.category).includes(q) ||
        sk(m.tipo).includes(q),
    ),
  );
}

export async function getMaterialsByCategory(category: string) {
  const list = await listMaterialsCatalog();
  if (!list.ok) return list;
  const c = sk(category);
  return ok(list.data.filter((m) => sk(m.category) === c || sk(m.tipo) === c));
}

export async function getMaterialsByStatus(status: string) {
  const list = await listMaterialsCatalog();
  if (!list.ok) return list;
  const s = sk(status);
  return ok(list.data.filter((m) => sk(m.status) === s || sk(m.estado) === s));
}

export async function getActiveMaterials() {
  const list = await listMaterialsCatalog();
  if (!list.ok) return list;
  return ok(
    list.data.filter((m) => /activ|activo|dispon/i.test(String(m.status || m.estado || ""))),
  );
}

export async function getLowStockMaterials() {
  const list = await listMaterialsCatalog();
  if (!list.ok) return list;
  return ok(
    list.data.filter((m) => {
      const stock = Number(m.stock_actual ?? 0);
      const min = Number(m.stock_minimo ?? m.reorder_level ?? 0);
      return min > 0 && stock > 0 && stock <= min;
    }),
  );
}

export async function getOutOfStockMaterials() {
  const list = await listMaterialsCatalog();
  if (!list.ok) return list;
  return ok(
    list.data.filter(
      (m) =>
        Number(m.stock_actual ?? 0) <= 0 ||
        /out of stock|sem stock/i.test(String(m.status || m.estado || "")),
    ),
  );
}

// ---------------------------------------------------------------------------
// Stock
// ---------------------------------------------------------------------------

export async function listMaterialStock(): Promise<DataResult<MaterialStock[]>> {
  try {
    const r = await getDataProvider().ministryMaterialsStock.list();
    if (!r.ok) return r as DataResult<MaterialStock[]>;
    return ok((r.data || []).map((x) => normalizeMaterialStock(x as MaterialStock)));
  } catch (e) {
    return fail(e instanceof Error ? e.message : "listMaterialStock failed");
  }
}

export async function getMaterialStockById(id: EntityId) {
  try {
    const r = await getDataProvider().ministryMaterialsStock.getById(id);
    if (!r.ok) return r as DataResult<MaterialStock | null>;
    return ok(r.data ? normalizeMaterialStock(r.data as MaterialStock) : null);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "getMaterialStockById failed");
  }
}

export async function createMaterialStock(payload: Partial<MaterialStock>) {
  try {
    const row = normalizeMaterialStock(payload);
    const created = await getDataProvider().ministryMaterialsStock.create!(row);
    if (!created.ok) return created as DataResult<MaterialStock>;
    await softAudit("create_stock", "MaterialStock", created.data!.id, row.material_name || "");
    return ok(normalizeMaterialStock(created.data as MaterialStock));
  } catch (e) {
    return fail(e instanceof Error ? e.message : "createMaterialStock failed");
  }
}

export async function updateMaterialStock(id: EntityId, payload: Partial<MaterialStock>) {
  try {
    const existing = await getMaterialStockById(id);
    if (!existing.ok || !existing.data) return fail("Stock não encontrado", "NOT_FOUND");
    const merged = normalizeMaterialStock({ ...existing.data, ...payload, id });
    const r = await getDataProvider().ministryMaterialsStock.update!(id, merged);
    if (!r.ok) return r as DataResult<MaterialStock>;
    await softAudit("update_stock", "MaterialStock", id);
    return ok(normalizeMaterialStock(r.data as MaterialStock));
  } catch (e) {
    return fail(e instanceof Error ? e.message : "updateMaterialStock failed");
  }
}

async function recordMovement(payload: Partial<MaterialStockMovement>) {
  try {
    const row = normalizeMaterialStockMovement(payload);
    await getDataProvider().ministryMaterialsStockMovements.create!(row);
    return ok(row);
  } catch {
    return ok(null as unknown as MaterialStockMovement);
  }
}

async function bumpCatalogStock(materialId: string | null | undefined, delta: number) {
  if (!materialId) return;
  const mat = await getMaterialById(materialId);
  if (!mat.ok || !mat.data) return;
  const next = Math.max(0, Number(mat.data.stock_actual ?? 0) + delta);
  await updateMaterial(materialId, { stock_actual: next });
}

export async function adjustMaterialStock(
  id: EntityId,
  payload: {
    quantity_delta?: number;
    quantity_available?: number;
    notes?: string;
    performed_by_name?: string;
    movement_type?: string;
  } = {},
) {
  try {
    const existing = await getMaterialStockById(id);
    if (!existing.ok || !existing.data) return fail("Stock não encontrado", "NOT_FOUND");
    const prev = Number(existing.data.quantity_available ?? 0);
    const next =
      payload.quantity_available != null
        ? Number(payload.quantity_available)
        : prev + Number(payload.quantity_delta ?? 0);
    const delta = next - prev;
    const updated = await updateMaterialStock(id, {
      quantity_available: next,
      stock_final: next,
      last_stock_update: todayIso(),
      notes: payload.notes || existing.data.notes,
    });
    if (!updated.ok) return updated;
    await recordMovement({
      material_id: existing.data.material_id,
      material_name: existing.data.material_name,
      movement_type: payload.movement_type || "Adjustment",
      quantity: Math.abs(delta),
      source_type: "Stock Adjustment",
      source_id: id,
      performed_by_name: payload.performed_by_name || "",
      notes: payload.notes || "",
    });
    await bumpCatalogStock(existing.data.material_id, delta);
    await softAudit("adjust_stock", "MaterialStock", id, `delta=${delta}`);
    return updated;
  } catch (e) {
    return fail(e instanceof Error ? e.message : "adjustMaterialStock failed");
  }
}

export async function getStockByMaterial(materialId: EntityId) {
  const list = await listMaterialStock();
  if (!list.ok) return list;
  return ok(list.data.filter((s) => s.material_id === materialId));
}

export async function getStockByChurch(churchId: EntityId) {
  const list = await listMaterialStock();
  if (!list.ok) return list;
  return ok(list.data.filter((s) => s.church_id === churchId));
}

export async function getStockMovementsByMaterial(materialId: EntityId) {
  try {
    const r = await getDataProvider().ministryMaterialsStockMovements.list();
    if (!r.ok) return r as DataResult<MaterialStockMovement[]>;
    return ok(
      (r.data || [])
        .map((x) => normalizeMaterialStockMovement(x as MaterialStockMovement))
        .filter((m) => m.material_id === materialId),
    );
  } catch (e) {
    return fail(e instanceof Error ? e.message : "getStockMovementsByMaterial failed");
  }
}

export async function getLowStockItems() {
  const list = await listMaterialStock();
  if (!list.ok) return list;
  return ok(
    list.data.filter((s) => {
      const qty = Number(s.quantity_available ?? 0);
      const min = Number(s.reorder_level ?? 0);
      return /low/i.test(String(s.status || "")) || (min > 0 && qty > 0 && qty <= min);
    }),
  );
}

export async function getOutOfStockItems() {
  const list = await listMaterialStock();
  if (!list.ok) return list;
  return ok(
    list.data.filter(
      (s) =>
        Number(s.quantity_available ?? 0) <= 0 ||
        /out of stock/i.test(String(s.status || "")),
    ),
  );
}

// ---------------------------------------------------------------------------
// Sales — NEVER creates financeRecord
// ---------------------------------------------------------------------------

export async function listMaterialSales(): Promise<DataResult<MaterialSale[]>> {
  try {
    const r = await getDataProvider().ministryMaterialsSales.list();
    if (!r.ok) return r as DataResult<MaterialSale[]>;
    return ok((r.data || []).map((x) => normalizeMaterialSale(x as MaterialSale)));
  } catch (e) {
    return fail(e instanceof Error ? e.message : "listMaterialSales failed");
  }
}

export async function getMaterialSaleById(id: EntityId) {
  try {
    const r = await getDataProvider().ministryMaterialsSales.getById(id);
    if (!r.ok) return r as DataResult<MaterialSale | null>;
    return ok(r.data ? normalizeMaterialSale(r.data as MaterialSale) : null);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "getMaterialSaleById failed");
  }
}

async function createInternalFundFromSale(sale: MaterialSale) {
  try {
    const funds = await listMaterialFunds();
    const nums = (funds.ok ? funds.data : []).map((f) => f.fund_number || "");
    await getDataProvider().ministryMaterialsFunds.create!(
      normalizeMaterialFund({
        fund_number: nextNum("MFUND", nums),
        source: "Sale",
        related_sale_id: sale.id,
        material_id: sale.material_id,
        material_name: sale.material_name,
        amount: sale.total_amount || sale.valor || 0,
        currency: sale.currency || "MTn",
        payment_method: sale.payment_method || sale.metodo_de_pagamento || "",
        payment_reference: sale.payment_reference || sale.pop_prova_de_pagamento || "",
        status: "Recorded Internally",
        estado: "Registado Internamente",
        finance_record_id: null,
        received_by_name: sale.sold_by_name || sale.recebido_por || "",
        received_at: sale.sale_date || sale.data || todayIso(),
        church_id: sale.church_id,
        notes: `Fundo interno da venda ${sale.sale_number || sale.id}. Sem financeRecord automático.`,
      }),
    );
  } catch {
    /* soft — funds are internal only */
  }
}

export async function createMaterialSale(payload: Partial<MaterialSale>) {
  try {
    const list = await listMaterialSales();
    const nums = (list.ok ? list.data : []).map((s) => s.sale_number || "");
    const row = normalizeMaterialSale({
      ...payload,
      sale_number: payload.sale_number || nextNum("MSALE", nums),
      finance_record_id: null,
      status: payload.status || payload.estado || "Completed",
    });
    // resolve material by title if needed
    if (!row.material_id && row.titulo_do_material) {
      const cat = await listMaterialsCatalog();
      if (cat.ok) {
        const found = cat.data.find(
          (m) =>
            sk(m.titulo_do_material) === sk(row.titulo_do_material) ||
            sk(m.name) === sk(row.titulo_do_material),
        );
        if (found) {
          row.material_id = found.id;
          row.material_name = found.name || found.titulo_do_material || row.material_name;
          if (!row.unit_price && found.unit_price) {
            row.unit_price = Number(found.unit_price);
            if (!row.total_amount && row.quantity) {
              row.total_amount = row.unit_price * row.quantity;
              row.valor = row.total_amount;
            }
          }
        }
      }
    }
    const created = await getDataProvider().ministryMaterialsSales.create!(row);
    if (!created.ok) return created as DataResult<MaterialSale>;
    const sale = normalizeMaterialSale(created.data as MaterialSale);

    // reduce stock (catalog + stock records) — never finance
    const qty = Number(sale.quantity || sale.quantidade || 0);
    if (qty > 0 && sale.material_id) {
      await bumpCatalogStock(sale.material_id, -qty);
      const stocks = await getStockByMaterial(sale.material_id);
      if (stocks.ok && stocks.data.length) {
        const primary = stocks.data[0];
        await adjustMaterialStock(primary.id, {
          quantity_delta: -qty,
          movement_type: "Sale",
          notes: `Venda ${sale.sale_number}`,
          performed_by_name: sale.sold_by_name || "",
        });
      }
      await recordMovement({
        material_id: sale.material_id,
        material_name: sale.material_name,
        movement_type: "Sale",
        quantity: qty,
        source_type: "Sale",
        source_id: sale.id,
        performed_by_name: sale.sold_by_name || "",
      });
    }

    if (
      /complete|confirm|paid|conclu|confirmado/i.test(String(sale.status || sale.estado || "")) &&
      Number(sale.total_amount || sale.valor || 0) > 0
    ) {
      await createInternalFundFromSale(sale);
    }

    await softAudit(
      "create_sale",
      "MaterialSale",
      sale.id,
      `${sale.material_name} x${qty} = ${sale.total_amount} (no financeRecord)`,
    );
    return ok(sale);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "createMaterialSale failed");
  }
}

export async function updateMaterialSale(id: EntityId, payload: Partial<MaterialSale>) {
  try {
    const existing = await getMaterialSaleById(id);
    if (!existing.ok || !existing.data) return fail("Venda não encontrada", "NOT_FOUND");
    const merged = normalizeMaterialSale({
      ...existing.data,
      ...payload,
      id,
      finance_record_id: existing.data.finance_record_id ?? null,
    });
    const r = await getDataProvider().ministryMaterialsSales.update!(id, merged);
    if (!r.ok) return r as DataResult<MaterialSale>;
    await softAudit("update_sale", "MaterialSale", id);
    return ok(normalizeMaterialSale(r.data as MaterialSale));
  } catch (e) {
    return fail(e instanceof Error ? e.message : "updateMaterialSale failed");
  }
}

export async function cancelMaterialSale(id: EntityId, payload: { notes?: string } = {}) {
  return updateMaterialSale(id, {
    status: "Cancelled",
    estado: "Cancelado",
    payment_status: "Cancelled",
    notes: payload.notes,
  });
}

export async function getSalesByMaterial(materialId: EntityId) {
  const list = await listMaterialSales();
  if (!list.ok) return list;
  return ok(list.data.filter((s) => s.material_id === materialId));
}

export async function getSalesByChurch(churchId: EntityId) {
  const list = await listMaterialSales();
  if (!list.ok) return list;
  return ok(list.data.filter((s) => s.church_id === churchId || s.igreja === churchId));
}

export async function getSalesByDateRange(startDate: string, endDate: string) {
  const list = await listMaterialSales();
  if (!list.ok) return list;
  return ok(
    list.data.filter((s) => {
      const d = String(s.sale_date || s.data || "");
      return d >= startDate && d <= endDate;
    }),
  );
}

export async function getSalesByStatus(status: string) {
  const list = await listMaterialSales();
  if (!list.ok) return list;
  const s = sk(status);
  return ok(list.data.filter((x) => sk(x.status) === s || sk(x.estado) === s));
}

export async function getWeeklySalesReport(filters: { startDate?: string; endDate?: string } = {}) {
  const list =
    filters.startDate && filters.endDate
      ? await getSalesByDateRange(filters.startDate, filters.endDate)
      : await listMaterialSales();
  if (!list.ok) return list;
  const qty = list.data.reduce((sum, s) => sum + Number(s.quantity || s.quantidade || 0), 0);
  const amount = list.data.reduce((sum, s) => sum + Number(s.total_amount || s.valor || 0), 0);
  return ok({ sales: list.data, quantity: qty, amount, currency: "MTn" });
}

export async function getMonthlySalesReport(filters: { month?: string } = {}) {
  const list = await listMaterialSales();
  if (!list.ok) return list;
  const month = filters.month || todayIso().slice(0, 7);
  const sales = list.data.filter((s) => String(s.sale_date || s.data || "").startsWith(month));
  const qty = sales.reduce((sum, s) => sum + Number(s.quantity || s.quantidade || 0), 0);
  const amount = sales.reduce((sum, s) => sum + Number(s.total_amount || s.valor || 0), 0);
  return ok({ month, sales, quantity: qty, amount, currency: "MTn" });
}

// ---------------------------------------------------------------------------
// Distributions
// ---------------------------------------------------------------------------

export async function listMaterialDistributions(): Promise<DataResult<MaterialDistribution[]>> {
  try {
    const r = await getDataProvider().ministryMaterialsDistributions.list();
    if (!r.ok) return r as DataResult<MaterialDistribution[]>;
    return ok((r.data || []).map((x) => normalizeMaterialDistribution(x as MaterialDistribution)));
  } catch (e) {
    return fail(e instanceof Error ? e.message : "listMaterialDistributions failed");
  }
}

export async function getMaterialDistributionById(id: EntityId) {
  try {
    const r = await getDataProvider().ministryMaterialsDistributions.getById(id);
    if (!r.ok) return r as DataResult<MaterialDistribution | null>;
    return ok(r.data ? normalizeMaterialDistribution(r.data as MaterialDistribution) : null);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "getMaterialDistributionById failed");
  }
}

export async function createMaterialDistribution(payload: Partial<MaterialDistribution>) {
  try {
    const list = await listMaterialDistributions();
    const nums = (list.ok ? list.data : []).map((d) => d.distribution_number || "");
    const row = normalizeMaterialDistribution({
      ...payload,
      distribution_number: payload.distribution_number || nextNum("MDIST", nums),
    });
    if (!row.material_id && row.titulo_do_material) {
      const cat = await listMaterialsCatalog();
      if (cat.ok) {
        const found = cat.data.find(
          (m) =>
            sk(m.titulo_do_material) === sk(row.titulo_do_material) ||
            sk(m.name) === sk(row.titulo_do_material),
        );
        if (found) {
          row.material_id = found.id;
          row.material_name = found.name || found.titulo_do_material || "";
        }
      }
    }
    const created = await getDataProvider().ministryMaterialsDistributions.create!(row);
    if (!created.ok) return created as DataResult<MaterialDistribution>;
    await softAudit(
      "create_distribution",
      "MaterialDistribution",
      created.data!.id,
      row.material_name || "",
    );
    return ok(normalizeMaterialDistribution(created.data as MaterialDistribution));
  } catch (e) {
    return fail(e instanceof Error ? e.message : "createMaterialDistribution failed");
  }
}

export async function updateMaterialDistribution(
  id: EntityId,
  payload: Partial<MaterialDistribution>,
) {
  try {
    const existing = await getMaterialDistributionById(id);
    if (!existing.ok || !existing.data) return fail("Distribuição não encontrada", "NOT_FOUND");
    const merged = normalizeMaterialDistribution({ ...existing.data, ...payload, id });
    const r = await getDataProvider().ministryMaterialsDistributions.update!(id, merged);
    if (!r.ok) return r as DataResult<MaterialDistribution>;
    return ok(normalizeMaterialDistribution(r.data as MaterialDistribution));
  } catch (e) {
    return fail(e instanceof Error ? e.message : "updateMaterialDistribution failed");
  }
}

export async function completeMaterialDistribution(
  id: EntityId,
  payload: { distributed_by_name?: string; notes?: string } = {},
) {
  try {
    const existing = await getMaterialDistributionById(id);
    if (!existing.ok || !existing.data) return fail("Distribuição não encontrada", "NOT_FOUND");
    const qty = Number(existing.data.quantity || existing.data.quantidade || 0);
    const updated = await updateMaterialDistribution(id, {
      status: "Distributed",
      estado: "Distribuído",
      distributed_by_name: payload.distributed_by_name || existing.data.responsavel_pelo_envio,
      distributed_at: nowIso(),
      notes: payload.notes || existing.data.notes,
    });
    if (!updated.ok) return updated;
    if (qty > 0 && existing.data.material_id) {
      await bumpCatalogStock(existing.data.material_id, -qty);
      const stocks = await getStockByMaterial(existing.data.material_id);
      if (stocks.ok && stocks.data.length) {
        await adjustMaterialStock(stocks.data[0].id, {
          quantity_delta: -qty,
          movement_type: /free|gratuita/i.test(
            String(existing.data.distribution_type || existing.data.tipo_de_distribuicao || ""),
          )
            ? "Free Distribution"
            : "Distribution",
          notes: `Distribuição ${existing.data.distribution_number}`,
          performed_by_name: payload.distributed_by_name || "",
        });
      }
    }
    await softAudit("complete_distribution", "MaterialDistribution", id);
    return updated;
  } catch (e) {
    return fail(e instanceof Error ? e.message : "completeMaterialDistribution failed");
  }
}

export async function cancelMaterialDistribution(id: EntityId, payload: { notes?: string } = {}) {
  return updateMaterialDistribution(id, {
    status: "Cancelled",
    estado: "Cancelado",
    notes: payload.notes,
  });
}

export async function getDistributionsByMaterial(materialId: EntityId) {
  const list = await listMaterialDistributions();
  if (!list.ok) return list;
  return ok(list.data.filter((d) => d.material_id === materialId));
}

export async function getDistributionsByChurch(churchId: EntityId) {
  const list = await listMaterialDistributions();
  if (!list.ok) return list;
  return ok(
    list.data.filter(
      (d) => d.church_id === churchId || d.igreja_destinataria === churchId || d.target_id === churchId,
    ),
  );
}

export async function getDistributionsByTarget(targetType: string, targetId: EntityId) {
  const list = await listMaterialDistributions();
  if (!list.ok) return list;
  const t = sk(targetType);
  return ok(
    list.data.filter((d) => sk(d.target_type) === t && String(d.target_id || d.prison_id || "") === targetId),
  );
}

export async function getDistributionsByDateRange(startDate: string, endDate: string) {
  const list = await listMaterialDistributions();
  if (!list.ok) return list;
  return ok(
    list.data.filter((d) => {
      const dt = String(d.distribution_date || d.data || "");
      return dt >= startDate && dt <= endDate;
    }),
  );
}

export async function getPendingDistributions() {
  const list = await listMaterialDistributions();
  if (!list.ok) return list;
  return ok(
    list.data.filter((d) =>
      /pend|approv|solicit|aprov/i.test(String(d.status || d.estado || "")),
    ),
  );
}

export async function getCompletedDistributions() {
  const list = await listMaterialDistributions();
  if (!list.ok) return list;
  return ok(
    list.data.filter((d) =>
      /distribut|complete|distribu/i.test(String(d.status || d.estado || "")),
    ),
  );
}

// ---------------------------------------------------------------------------
// Requests (+ Prison Ministry source_id)
// ---------------------------------------------------------------------------

export async function listMaterialRequests(): Promise<DataResult<MaterialRequest[]>> {
  try {
    const r = await getDataProvider().ministryMaterialsRequests.list();
    if (!r.ok) return r as DataResult<MaterialRequest[]>;
    return ok((r.data || []).map((x) => normalizeMaterialRequest(x as MaterialRequest)));
  } catch (e) {
    return fail(e instanceof Error ? e.message : "listMaterialRequests failed");
  }
}

export async function getMaterialRequestById(id: EntityId) {
  try {
    const r = await getDataProvider().ministryMaterialsRequests.getById(id);
    if (!r.ok) return r as DataResult<MaterialRequest | null>;
    return ok(r.data ? normalizeMaterialRequest(r.data as MaterialRequest) : null);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "getMaterialRequestById failed");
  }
}

export async function createMaterialRequest(payload: Partial<MaterialRequest>) {
  try {
    const list = await listMaterialRequests();
    const nums = (list.ok ? list.data : []).map((x) => x.request_number || "");
    const row = normalizeMaterialRequest({
      ...payload,
      request_number: payload.request_number || nextNum("MREQ", nums),
    });
    const created = await getDataProvider().ministryMaterialsRequests.create!(row);
    if (!created.ok) return created as DataResult<MaterialRequest>;
    await softAudit(
      "create_request",
      "MaterialRequest",
      created.data!.id,
      `${row.source} ${row.material_name}`,
    );
    return ok(normalizeMaterialRequest(created.data as MaterialRequest));
  } catch (e) {
    return fail(e instanceof Error ? e.message : "createMaterialRequest failed");
  }
}

export async function updateMaterialRequest(id: EntityId, payload: Partial<MaterialRequest>) {
  try {
    const existing = await getMaterialRequestById(id);
    if (!existing.ok || !existing.data) return fail("Pedido não encontrado", "NOT_FOUND");
    const merged = normalizeMaterialRequest({ ...existing.data, ...payload, id });
    const r = await getDataProvider().ministryMaterialsRequests.update!(id, merged);
    if (!r.ok) return r as DataResult<MaterialRequest>;
    return ok(normalizeMaterialRequest(r.data as MaterialRequest));
  } catch (e) {
    return fail(e instanceof Error ? e.message : "updateMaterialRequest failed");
  }
}

export async function approveMaterialRequest(
  id: EntityId,
  payload: { quantity_approved?: number; approved_by_name?: string; notes?: string } = {},
) {
  const existing = await getMaterialRequestById(id);
  if (!existing.ok || !existing.data) return fail("Pedido não encontrado", "NOT_FOUND");
  const qty =
    payload.quantity_approved != null
      ? Number(payload.quantity_approved)
      : Number(existing.data.quantity_requested || 0);
  const r = await updateMaterialRequest(id, {
    status: "Approved",
    quantity_approved: qty,
    approved_by_name: payload.approved_by_name || "",
    approved_at: nowIso(),
    notes: payload.notes || existing.data.notes,
  });
  if (r.ok) await softAudit("approve_request", "MaterialRequest", id);
  return r;
}

export async function rejectMaterialRequest(
  id: EntityId,
  payload: { rejection_reason?: string; notes?: string } = {},
) {
  if (!payload.rejection_reason) return fail("rejection_reason é obrigatório", "VALIDATION");
  const r = await updateMaterialRequest(id, {
    status: "Rejected",
    rejection_reason: payload.rejection_reason,
    notes: payload.notes,
  });
  if (r.ok) await softAudit("reject_request", "MaterialRequest", id, payload.rejection_reason);
  return r;
}

export async function fulfillMaterialRequest(
  id: EntityId,
  payload: { quantity_fulfilled?: number; fulfilled_by_name?: string; notes?: string } = {},
) {
  try {
    const existing = await getMaterialRequestById(id);
    if (!existing.ok || !existing.data) return fail("Pedido não encontrado", "NOT_FOUND");
    const qty =
      payload.quantity_fulfilled != null
        ? Number(payload.quantity_fulfilled)
        : Number(existing.data.quantity_approved || existing.data.quantity_requested || 0);
    const r = await updateMaterialRequest(id, {
      status: "Fulfilled",
      quantity_fulfilled: qty,
      fulfilled_by_name: payload.fulfilled_by_name || "",
      fulfilled_at: nowIso(),
      notes: payload.notes || existing.data.notes,
    });
    if (!r.ok) return r;
    if (qty > 0 && existing.data.material_id) {
      await bumpCatalogStock(existing.data.material_id, -qty);
      await createMaterialDistribution({
        material_id: existing.data.material_id,
        material_name: existing.data.material_name,
        titulo_do_material: existing.data.material_name,
        quantity: qty,
        quantidade: qty,
        distribution_type:
          /prison/i.test(String(existing.data.source || "")) || existing.data.prison_id
            ? "Prison Ministry"
            : "Church Supply",
        target_type: existing.data.target_type || "Church",
        target_id: existing.data.target_id || existing.data.prison_id,
        target_name: existing.data.target_name || existing.data.prison_name,
        prison_id: existing.data.prison_id,
        prison_name: existing.data.prison_name,
        church_id: existing.data.church_id,
        status: "Distributed",
        estado: "Distribuído",
        distributed_at: nowIso(),
        notes: `Cumprimento pedido ${existing.data.request_number} (source_id=${existing.data.source_id || ""})`,
      });
    }
    // soft-link back to prison materials request if source_id
    if (existing.data.source_id && /prison/i.test(String(existing.data.source || existing.data.source_module || ""))) {
      try {
        const root = globalThis as unknown as {
          CEPrisonMinistry?: {
            updatePrisonMaterialsRequest?: (
              id: string,
              p: Record<string, unknown>,
            ) => Promise<unknown>;
            markPrisonMaterialsRequestFulfilled?: (
              id: string,
              p: Record<string, unknown>,
            ) => Promise<unknown>;
          };
        };
        const pm = root.CEPrisonMinistry;
        if (pm?.markPrisonMaterialsRequestFulfilled) {
          await pm.markPrisonMaterialsRequestFulfilled(String(existing.data.source_id), {
            quantity_fulfilled: qty,
            ministry_materials_request_id: id,
          });
        } else if (pm?.updatePrisonMaterialsRequest) {
          await pm.updatePrisonMaterialsRequest(String(existing.data.source_id), {
            quantity_fulfilled: qty,
            status: "Fulfilled",
            ministry_materials_request_id: id,
          });
        }
      } catch {
        /* soft */
      }
    }
    await softAudit("fulfill_request", "MaterialRequest", id, `qty=${qty}`);
    return r;
  } catch (e) {
    return fail(e instanceof Error ? e.message : "fulfillMaterialRequest failed");
  }
}

export async function partiallyFulfillMaterialRequest(
  id: EntityId,
  payload: { quantity_fulfilled: number; fulfilled_by_name?: string; notes?: string },
) {
  if (payload.quantity_fulfilled == null || payload.quantity_fulfilled < 0) {
    return fail("quantity_fulfilled é obrigatório", "VALIDATION");
  }
  try {
    const existing = await getMaterialRequestById(id);
    if (!existing.ok || !existing.data) return fail("Pedido não encontrado", "NOT_FOUND");
    const prev = Number(existing.data.quantity_fulfilled || 0);
    const qty = prev + Number(payload.quantity_fulfilled);
    const requested = Number(existing.data.quantity_requested || 0);
    const status = qty >= requested ? "Fulfilled" : "Partially Fulfilled";
    const r = await updateMaterialRequest(id, {
      status,
      quantity_fulfilled: qty,
      fulfilled_by_name: payload.fulfilled_by_name || "",
      fulfilled_at: nowIso(),
      notes: payload.notes || existing.data.notes,
    });
    if (r.ok && existing.data.material_id) {
      await bumpCatalogStock(existing.data.material_id, -Number(payload.quantity_fulfilled));
    }
    if (r.ok) await softAudit("partial_fulfill_request", "MaterialRequest", id, `qty=${qty}`);
    return r;
  } catch (e) {
    return fail(e instanceof Error ? e.message : "partiallyFulfillMaterialRequest failed");
  }
}

export async function getRequestsBySource(source: string) {
  const list = await listMaterialRequests();
  if (!list.ok) return list;
  const s = sk(source);
  return ok(list.data.filter((r) => sk(r.source).includes(s) || sk(r.source_module).includes(s)));
}

export async function getRequestsByTarget(targetType: string, targetId: EntityId) {
  const list = await listMaterialRequests();
  if (!list.ok) return list;
  const t = sk(targetType);
  return ok(
    list.data.filter(
      (r) => sk(r.target_type) === t && String(r.target_id || r.prison_id || "") === targetId,
    ),
  );
}

export async function getRequestsByChurch(churchId: EntityId) {
  const list = await listMaterialRequests();
  if (!list.ok) return list;
  return ok(list.data.filter((r) => r.church_id === churchId));
}

export async function getRequestsByStatus(status: string) {
  const list = await listMaterialRequests();
  if (!list.ok) return list;
  const s = sk(status);
  return ok(list.data.filter((r) => sk(r.status) === s));
}

export async function getPendingMaterialRequests() {
  const list = await listMaterialRequests();
  if (!list.ok) return list;
  return ok(list.data.filter((r) => /pend|approv/i.test(String(r.status || ""))));
}

export async function getPrisonMaterialRequests() {
  const list = await listMaterialRequests();
  if (!list.ok) return list;
  return ok(
    list.data.filter(
      (r) =>
        /prison/i.test(String(r.source || r.source_module || "")) ||
        !!r.prison_id ||
        sk(r.target_type) === "prison",
    ),
  );
}

/** Import / sync pending prison materials requests into MM requests (idempotent by source_id). */
export async function syncPrisonMaterialRequests() {
  try {
    const root = globalThis as unknown as {
      CEPrisonMinistry?: {
        listPrisonMaterialsRequests?: () => Promise<DataResult<Record<string, unknown>[]>>;
        getPendingPrisonMaterialsRequests?: () => Promise<DataResult<Record<string, unknown>[]>>;
      };
    };
    const pm = root.CEPrisonMinistry;
    const fn = pm?.listPrisonMaterialsRequests || pm?.getPendingPrisonMaterialsRequests;
    if (!fn) return ok({ synced: 0, skipped: true as const });
    const remote = await fn();
    if (!remote?.ok || !Array.isArray(remote.data)) return ok({ synced: 0 });
    const existing = await listMaterialRequests();
    const bySource = new Set(
      (existing.ok ? existing.data : [])
        .filter((r) => r.source_id)
        .map((r) => String(r.source_id)),
    );
    let synced = 0;
    for (const row of remote.data) {
      const sid = String(row.id || "");
      if (!sid || bySource.has(sid)) continue;
      await createMaterialRequest({
        source: "Prison Ministry",
        source_module: "prisonMinistry",
        source_id: sid,
        material_name: String(row.material_name || ""),
        material_type: String(row.material_type || ""),
        quantity_requested: Number(row.quantity_requested || 0),
        quantity_fulfilled: Number(row.quantity_fulfilled || 0),
        target_type: "Prison",
        target_id: (row.prison_id as string) || null,
        prison_id: (row.prison_id as string) || null,
        prison_name: String(row.prison_name || ""),
        needed_by_date: (row.needed_by_date as string) || null,
        status: String(row.status || "Pending"),
        requested_by_name: String(row.requested_by_name || ""),
        notes: `Sync de ${sid}`,
      });
      synced += 1;
    }
    return ok({ synced });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "syncPrisonMaterialRequests failed");
  }
}

// ---------------------------------------------------------------------------
// Funds — internal only, never financeRecord
// ---------------------------------------------------------------------------

export async function listMaterialFunds(): Promise<DataResult<MaterialFund[]>> {
  try {
    const r = await getDataProvider().ministryMaterialsFunds.list();
    if (!r.ok) return r as DataResult<MaterialFund[]>;
    return ok((r.data || []).map((x) => normalizeMaterialFund(x as MaterialFund)));
  } catch (e) {
    return fail(e instanceof Error ? e.message : "listMaterialFunds failed");
  }
}

export async function getMaterialFundById(id: EntityId) {
  try {
    const r = await getDataProvider().ministryMaterialsFunds.getById(id);
    if (!r.ok) return r as DataResult<MaterialFund | null>;
    return ok(r.data ? normalizeMaterialFund(r.data as MaterialFund) : null);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "getMaterialFundById failed");
  }
}

export async function createMaterialFund(payload: Partial<MaterialFund>) {
  try {
    const list = await listMaterialFunds();
    const nums = (list.ok ? list.data : []).map((f) => f.fund_number || "");
    const row = normalizeMaterialFund({
      ...payload,
      fund_number: payload.fund_number || nextNum("MFUND", nums),
      finance_record_id: null,
      status: payload.status || payload.estado || "Recorded Internally",
    });
    const created = await getDataProvider().ministryMaterialsFunds.create!(row);
    if (!created.ok) return created as DataResult<MaterialFund>;
    await softAudit(
      "create_fund",
      "MaterialFund",
      created.data!.id,
      "internal only — no financeRecord",
    );
    return ok(normalizeMaterialFund(created.data as MaterialFund));
  } catch (e) {
    return fail(e instanceof Error ? e.message : "createMaterialFund failed");
  }
}

export async function updateMaterialFund(id: EntityId, payload: Partial<MaterialFund>) {
  try {
    const existing = await getMaterialFundById(id);
    if (!existing.ok || !existing.data) return fail("Fundo não encontrado", "NOT_FOUND");
    const merged = normalizeMaterialFund({
      ...existing.data,
      ...payload,
      id,
      finance_record_id: existing.data.finance_record_id ?? null,
    });
    const r = await getDataProvider().ministryMaterialsFunds.update!(id, merged);
    if (!r.ok) return r as DataResult<MaterialFund>;
    await softAudit("update_fund", "MaterialFund", id);
    return ok(normalizeMaterialFund(r.data as MaterialFund));
  } catch (e) {
    return fail(e instanceof Error ? e.message : "updateMaterialFund failed");
  }
}

export async function getFundsBySource(source: string) {
  const list = await listMaterialFunds();
  if (!list.ok) return list;
  const s = sk(source);
  return ok(list.data.filter((f) => sk(f.source) === s));
}

export async function getFundsByDateRange(startDate: string, endDate: string) {
  const list = await listMaterialFunds();
  if (!list.ok) return list;
  return ok(
    list.data.filter((f) => {
      const d = String(f.received_at || f.created_at || "").slice(0, 10);
      return d >= startDate && d <= endDate;
    }),
  );
}

export async function getFundsByStatus(status: string) {
  const list = await listMaterialFunds();
  if (!list.ok) return list;
  const s = sk(status);
  return ok(list.data.filter((f) => sk(f.status) === s || sk(f.estado) === s));
}

// ---------------------------------------------------------------------------
// Reports / analytics
// ---------------------------------------------------------------------------

export async function listMaterialReports(): Promise<DataResult<MaterialReport[]>> {
  try {
    const r = await getDataProvider().ministryMaterialsReports.list();
    if (!r.ok) return r as DataResult<MaterialReport[]>;
    return ok((r.data || []).map((x) => normalizeMaterialReport(x as MaterialReport)));
  } catch (e) {
    return fail(e instanceof Error ? e.message : "listMaterialReports failed");
  }
}

export async function createMaterialReport(payload: Partial<MaterialReport>) {
  try {
    const row = normalizeMaterialReport(payload);
    const created = await getDataProvider().ministryMaterialsReports.create!(row);
    if (!created.ok) return created as DataResult<MaterialReport>;
    return ok(normalizeMaterialReport(created.data as MaterialReport));
  } catch (e) {
    return fail(e instanceof Error ? e.message : "createMaterialReport failed");
  }
}

export async function getMinistryMaterialsOverviewStats(_filters: Record<string, unknown> = {}) {
  const [cat, stock, sales, dist, reqs, funds] = await Promise.all([
    listMaterialsCatalog(),
    listMaterialStock(),
    listMaterialSales(),
    listMaterialDistributions(),
    listMaterialRequests(),
    listMaterialFunds(),
  ]);
  const materials = cat.ok ? cat.data : [];
  const salesRows = sales.ok ? sales.data : [];
  const fundsRows = funds.ok ? funds.data : [];
  const reqRows = reqs.ok ? reqs.data : [];
  const distRows = dist.ok ? dist.data : [];
  return ok({
    totalMaterials: materials.length,
    activeMaterials: materials.filter((m) =>
      /activ|activo|dispon/i.test(String(m.status || m.estado || "")),
    ).length,
    lowStock: materials.filter((m) => {
      const s = Number(m.stock_actual ?? 0);
      const min = Number(m.stock_minimo ?? m.reorder_level ?? 0);
      return min > 0 && s > 0 && s <= min;
    }).length,
    outOfStock: materials.filter((m) => Number(m.stock_actual ?? 0) <= 0).length,
    totalStockUnits: materials.reduce((sum, m) => sum + Number(m.stock_actual ?? 0), 0),
    salesCount: salesRows.length,
    salesQuantity: salesRows.reduce((sum, s) => sum + Number(s.quantity || s.quantidade || 0), 0),
    salesAmount: salesRows.reduce((sum, s) => sum + Number(s.total_amount || s.valor || 0), 0),
    pendingDistributions: distRows.filter((d) =>
      /pend|solicit|approv/i.test(String(d.status || d.estado || "")),
    ).length,
    pendingRequests: reqRows.filter((r) => /pend|approv/i.test(String(r.status || ""))).length,
    prisonRequests: reqRows.filter(
      (r) => /prison/i.test(String(r.source || "")) || !!r.prison_id,
    ).length,
    internalFundsAmount: fundsRows.reduce(
      (sum, f) => sum + Number(f.amount ?? f.valor_levantado ?? 0),
      0,
    ),
    fundsWithFinanceLink: fundsRows.filter((f) => !!f.finance_record_id).length,
    currency: "MTn",
    note: "Funds/sales are internal — finance_record_id not auto-created",
  });
}

export async function getMaterialsStockReport(_filters = {}) {
  const [stock, low, out] = await Promise.all([
    listMaterialStock(),
    getLowStockItems(),
    getOutOfStockItems(),
  ]);
  return ok({
    stock: stock.ok ? stock.data : [],
    lowStock: low.ok ? low.data : [],
    outOfStock: out.ok ? out.data : [],
  });
}

export async function getMaterialsSalesReport(filters: { startDate?: string; endDate?: string } = {}) {
  return getWeeklySalesReport(filters);
}

export async function getMaterialsDistributionReport(_filters = {}) {
  const list = await listMaterialDistributions();
  if (!list.ok) return list;
  return ok({ distributions: list.data });
}

export async function getMaterialsRequestsReport(_filters = {}) {
  const list = await listMaterialRequests();
  if (!list.ok) return list;
  return ok({
    requests: list.data,
    prison: list.data.filter((r) => /prison/i.test(String(r.source || "")) || !!r.prison_id),
  });
}

export async function getMaterialsFundsReport(_filters = {}) {
  const list = await listMaterialFunds();
  if (!list.ok) return list;
  return ok({
    funds: list.data,
    totalInternal: list.data.reduce(
      (sum, f) => sum + Number(f.amount ?? f.valor_levantado ?? 0),
      0,
    ),
    financeRecordsCreated: 0,
    note: "Internal funds only — no automatic financeRecord",
  });
}

export async function getWeeklyMaterialsReport(filters: { startDate?: string; endDate?: string } = {}) {
  const sales = await getWeeklySalesReport(filters);
  const overview = await getMinistryMaterialsOverviewStats();
  return ok({
    sales: sales.ok ? sales.data : null,
    overview: overview.ok ? overview.data : null,
  });
}

export async function getMonthlyMaterialsReport(filters: { month?: string } = {}) {
  const sales = await getMonthlySalesReport(filters);
  const funds = await listMaterialFunds();
  return ok({
    sales: sales.ok ? sales.data : null,
    funds: funds.ok ? funds.data : [],
  });
}

// ---------------------------------------------------------------------------
// Seed + info
// ---------------------------------------------------------------------------

export async function ensureMinistryMaterialsSeeded(): Promise<DataResult<boolean>> {
  try {
    const p = getDataProvider();
    async function seed<T extends { id: string }>(
      listFn: () => Promise<DataResult<T[]>>,
      createFn: (row: T) => Promise<DataResult<T>>,
      rows: T[],
    ) {
      const existing = await listFn();
      if (existing.ok && existing.data.length) return;
      for (const row of rows) {
        await createFn(row);
      }
    }
    await seed(
      listMaterialsCatalog,
      (r) => p.ministryMaterialsCatalog.create!(normalizeMinistryMaterial(r)),
      MINISTRY_MATERIALS_CATALOG_SEED as MinistryMaterial[],
    );
    await seed(
      listMaterialStock,
      (r) => p.ministryMaterialsStock.create!(normalizeMaterialStock(r)),
      MINISTRY_MATERIALS_STOCK_SEED as MaterialStock[],
    );
    await seed(
      listMaterialSales,
      (r) => p.ministryMaterialsSales.create!(normalizeMaterialSale(r)),
      MINISTRY_MATERIALS_SALES_SEED as MaterialSale[],
    );
    await seed(
      listMaterialDistributions,
      (r) => p.ministryMaterialsDistributions.create!(normalizeMaterialDistribution(r)),
      MINISTRY_MATERIALS_DISTRIBUTIONS_SEED as MaterialDistribution[],
    );
    await seed(
      listMaterialRequests,
      (r) => p.ministryMaterialsRequests.create!(normalizeMaterialRequest(r)),
      MINISTRY_MATERIALS_REQUESTS_SEED as MaterialRequest[],
    );
    await seed(
      listMaterialFunds,
      (r) => p.ministryMaterialsFunds.create!(normalizeMaterialFund(r)),
      MINISTRY_MATERIALS_FUNDS_SEED as MaterialFund[],
    );
    await seed(
      listMaterialReports,
      (r) => p.ministryMaterialsReports.create!(normalizeMaterialReport(r)),
      MINISTRY_MATERIALS_REPORTS_SEED as MaterialReport[],
    );
    return ok(true);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "ensureMinistryMaterialsSeeded failed");
  }
}

export function getMinistryMaterialsDataSourceInfo() {
  const source = getDataSource();
  const provider = getDataProvider();
  return {
    source,
    provider: provider.name,
    ready: provider.isReady(),
    description: provider.description,
    domain: "ministryMaterials",
  };
}

export {
  MINISTRY_MATERIALS_CATALOG_SEED,
  MINISTRY_MATERIALS_STOCK_SEED,
  MINISTRY_MATERIALS_SALES_SEED,
  MINISTRY_MATERIALS_DISTRIBUTIONS_SEED,
  MINISTRY_MATERIALS_REQUESTS_SEED,
  MINISTRY_MATERIALS_FUNDS_SEED,
  MINISTRY_MATERIALS_REPORTS_SEED,
};

export const ministryMaterialsRepository = {
  listMaterialsCatalog,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  searchMaterials,
  getMaterialsByCategory,
  getMaterialsByStatus,
  getActiveMaterials,
  getLowStockMaterials,
  getOutOfStockMaterials,
  listMaterialStock,
  getMaterialStockById,
  createMaterialStock,
  updateMaterialStock,
  adjustMaterialStock,
  getStockByMaterial,
  getStockByChurch,
  getStockMovementsByMaterial,
  getLowStockItems,
  getOutOfStockItems,
  listMaterialSales,
  getMaterialSaleById,
  createMaterialSale,
  updateMaterialSale,
  cancelMaterialSale,
  getSalesByMaterial,
  getSalesByChurch,
  getSalesByDateRange,
  getSalesByStatus,
  getWeeklySalesReport,
  getMonthlySalesReport,
  listMaterialDistributions,
  getMaterialDistributionById,
  createMaterialDistribution,
  updateMaterialDistribution,
  completeMaterialDistribution,
  cancelMaterialDistribution,
  getDistributionsByMaterial,
  getDistributionsByChurch,
  getDistributionsByTarget,
  getDistributionsByDateRange,
  getPendingDistributions,
  getCompletedDistributions,
  listMaterialRequests,
  getMaterialRequestById,
  createMaterialRequest,
  updateMaterialRequest,
  approveMaterialRequest,
  rejectMaterialRequest,
  fulfillMaterialRequest,
  partiallyFulfillMaterialRequest,
  getRequestsBySource,
  getRequestsByTarget,
  getRequestsByChurch,
  getRequestsByStatus,
  getPendingMaterialRequests,
  getPrisonMaterialRequests,
  syncPrisonMaterialRequests,
  listMaterialFunds,
  getMaterialFundById,
  createMaterialFund,
  updateMaterialFund,
  getFundsBySource,
  getFundsByDateRange,
  getFundsByStatus,
  listMaterialReports,
  createMaterialReport,
  getMinistryMaterialsOverviewStats,
  getMaterialsStockReport,
  getMaterialsSalesReport,
  getMaterialsDistributionReport,
  getMaterialsRequestsReport,
  getMaterialsFundsReport,
  getWeeklyMaterialsReport,
  getMonthlyMaterialsReport,
  ensureMinistryMaterialsSeeded,
  getMinistryMaterialsDataSourceInfo,
  getInfo: getMinistryMaterialsDataSourceInfo,
};
