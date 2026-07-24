/**
 * Ministry Materials data bridge — dual-write / pure-JS localStorage fallback.
 * Keys: ce-data-layer:ministry-materials-catalog | stock | sales | distributions |
 *       requests | funds | reports | stock-movements
 *
 * NEVER creates financeRecord. Internal funds only. Prison requests via source_id.
 */
(function () {
  var KEYS = {
    catalog: "ce-data-layer:ministry-materials-catalog",
    stock: "ce-data-layer:ministry-materials-stock",
    sales: "ce-data-layer:ministry-materials-sales",
    distributions: "ce-data-layer:ministry-materials-distributions",
    requests: "ce-data-layer:ministry-materials-requests",
    funds: "ce-data-layer:ministry-materials-funds",
    reports: "ce-data-layer:ministry-materials-reports",
  };
  var memory = {
    catalog: null,
    stock: null,
    sales: null,
    distributions: null,
    requests: null,
    funds: null,
    reports: null,
  };

  function resolveDataSource() {
    try {
      var runtime = window.__CE_ENV__ && window.__CE_ENV__.VITE_DATA_SOURCE;
      var fromBundle =
        window.CESupabase && typeof window.CESupabase.getDataSource === "function"
          ? window.CESupabase.getDataSource()
          : window.CEDataLayer && typeof window.CEDataLayer.getDataSource === "function"
            ? window.CEDataLayer.getDataSource()
            : "";
      var value = String(runtime || fromBundle || "mock").trim().toLowerCase();
      if (value === "local" || value === "api" || value === "supabase" || value === "mock") return value;
    } catch (_) {}
    return "mock";
  }

  function resolveApi() {
    var layer = window.CEDataLayer && window.CEDataLayer.ministryMaterials;
    if (layer && typeof layer.createMaterial === "function") {
      return { api: layer, via: "CEDataLayer.ministryMaterials" };
    }
    if (window.CEMinistryMaterials && typeof window.CEMinistryMaterials.createMaterial === "function") {
      return { api: window.CEMinistryMaterials, via: "CEMinistryMaterials" };
    }
    if (window.CESupabase && typeof window.CESupabase.createMaterial === "function") {
      return { api: window.CESupabase, via: "CESupabase" };
    }
    return { api: null, via: "none" };
  }

  function load(key) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function save(key, rows) {
    try {
      localStorage.setItem(key, JSON.stringify(rows));
    } catch (e) {
      console.warn("[CE Materials] persist failed", key, e);
    }
  }

  function seedFor(kind) {
    var S = window.CESupabase || {};
    if (kind === "catalog") return S.MINISTRY_MATERIALS_CATALOG_SEED || [];
    if (kind === "stock") return S.MINISTRY_MATERIALS_STOCK_SEED || [];
    if (kind === "sales") return S.MINISTRY_MATERIALS_SALES_SEED || [];
    if (kind === "distributions") return S.MINISTRY_MATERIALS_DISTRIBUTIONS_SEED || [];
    if (kind === "requests") return S.MINISTRY_MATERIALS_REQUESTS_SEED || [];
    if (kind === "funds") return S.MINISTRY_MATERIALS_FUNDS_SEED || [];
    if (kind === "reports") return S.MINISTRY_MATERIALS_REPORTS_SEED || [];
    return [];
  }

  function store(kind) {
    var source = resolveDataSource();
    var key = KEYS[kind];
    if (source === "local") {
      var rows = load(key);
      if (!rows.length) {
        rows = seedFor(kind).map(function (s) {
          return Object.assign({}, s);
        });
        if (rows.length) save(key, rows);
      }
      return { rows: rows, persist: true };
    }
    if (!memory[kind]) {
      memory[kind] = seedFor(kind).map(function (s) {
        return Object.assign({}, s);
      });
    }
    return { rows: memory[kind], persist: false };
  }

  function ok(data) {
    return { ok: true, data: data };
  }
  function fail(error, code) {
    return { ok: false, error: error || "Erro", code: code || "FALLBACK_ERROR" };
  }
  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function pure() {
    function list(kind) {
      return ok(store(kind).rows.slice());
    }
    function create(kind, idPrefix, payload) {
      var s = store(kind);
      var row = Object.assign({}, payload, {
        id: (payload && payload.id) || idPrefix + Date.now(),
        updated_at: today(),
        created_at: (payload && payload.created_at) || today(),
      });
      s.rows.unshift(row);
      if (s.persist) save(KEYS[kind], s.rows);
      return ok(row);
    }
    function update(kind, id, payload) {
      var s = store(kind);
      var i = s.rows.findIndex(function (r) {
        return r.id === id;
      });
      if (i < 0) return fail("Não encontrado", "NOT_FOUND");
      s.rows[i] = Object.assign({}, s.rows[i], payload, { id: id, updated_at: today() });
      if (s.persist) save(KEYS[kind], s.rows);
      return ok(s.rows[i]);
    }

    function bumpCatalogStock(materialId, delta) {
      if (!materialId) return;
      var s = store("catalog");
      var i = s.rows.findIndex(function (r) {
        return r.id === materialId;
      });
      if (i < 0) return;
      var next = Math.max(0, Number(s.rows[i].stock_actual || 0) + delta);
      s.rows[i] = Object.assign({}, s.rows[i], { stock_actual: next, updated_at: today() });
      if (s.persist) save(KEYS.catalog, s.rows);
    }

    return {
      listMaterialsCatalog: function () {
        return list("catalog");
      },
      createMaterial: function (p) {
        var row = Object.assign({}, p || {});
        row.name = row.name || row.titulo_do_material || "";
        row.titulo_do_material = row.titulo_do_material || row.name || "";
        row.preco = row.preco != null ? row.preco : row.unit_price || 0;
        row.unit_price = row.unit_price != null ? row.unit_price : row.preco || 0;
        row.stock_actual = Number(row.stock_actual || 0);
        row.stock_minimo = Number(row.stock_minimo || row.reorder_level || 0);
        row.status = row.status || row.estado || "Active";
        row.estado = row.estado || row.status || "Disponível";
        return create("catalog", "mat-", row);
      },
      updateMaterial: function (id, p) {
        return update("catalog", id, p);
      },
      getActiveMaterials: function () {
        return ok(
          store("catalog").rows.filter(function (r) {
            return /activ|activo|dispon/i.test(String(r.status || r.estado || ""));
          }),
        );
      },
      getLowStockMaterials: function () {
        return ok(
          store("catalog").rows.filter(function (r) {
            var stock = Number(r.stock_actual || 0);
            var min = Number(r.stock_minimo || r.reorder_level || 0);
            return min > 0 && stock > 0 && stock <= min;
          }),
        );
      },
      getOutOfStockMaterials: function () {
        return ok(
          store("catalog").rows.filter(function (r) {
            return Number(r.stock_actual || 0) <= 0;
          }),
        );
      },
      listMaterialStock: function () {
        return list("stock");
      },
      createMaterialStock: function (p) {
        return create("stock", "mstock-", Object.assign({ status: "Available" }, p || {}));
      },
      updateMaterialStock: function (id, p) {
        return update("stock", id, p);
      },
      adjustMaterialStock: function (id, p) {
        var s = store("stock");
        var i = s.rows.findIndex(function (r) {
          return r.id === id;
        });
        if (i < 0) return fail("Stock não encontrado", "NOT_FOUND");
        var prev = Number(s.rows[i].quantity_available || s.rows[i].stock_final || 0);
        var next =
          p && p.quantity_available != null
            ? Number(p.quantity_available)
            : prev + Number((p && p.quantity_delta) || 0);
        var updated = update("stock", id, {
          quantity_available: next,
          stock_final: next,
          last_stock_update: today(),
        });
        if (updated.ok && s.rows[i].material_id) {
          bumpCatalogStock(s.rows[i].material_id, next - prev);
        }
        return updated;
      },
      listMaterialSales: function () {
        return list("sales");
      },
      createMaterialSale: function (p) {
        var row = Object.assign({ finance_record_id: null, status: "Completed", estado: "Confirmado" }, p || {});
        row.titulo_do_material = row.titulo_do_material || row.material_name || "";
        row.material_name = row.material_name || row.titulo_do_material || "";
        row.quantidade = Number(row.quantidade != null ? row.quantidade : row.quantity || 0);
        row.quantity = Number(row.quantity != null ? row.quantity : row.quantidade || 0);
        row.valor = Number(row.valor != null ? row.valor : row.total_amount || 0);
        row.total_amount = Number(row.total_amount != null ? row.total_amount : row.valor || 0);
        row.data = row.data || row.sale_date || today();
        row.sale_date = row.sale_date || row.data || today();
        var created = create("sales", "sale-", row);
        if (created.ok) {
          var qty = Number(created.data.quantity || created.data.quantidade || 0);
          if (qty && created.data.material_id) bumpCatalogStock(created.data.material_id, -qty);
          if (Number(created.data.total_amount || created.data.valor || 0) > 0) {
            create("funds", "fund-", {
              source: "Sale",
              related_sale_id: created.data.id,
              material_id: created.data.material_id,
              material_name: created.data.material_name,
              amount: created.data.total_amount || created.data.valor,
              valor_levantado: created.data.total_amount || created.data.valor,
              currency: "MTn",
              status: "Recorded Internally",
              estado: "Registado Internamente",
              finance_record_id: null,
              notes: "Fundo interno — sem financeRecord automático",
            });
          }
        }
        return created;
      },
      updateMaterialSale: function (id, p) {
        var patch = Object.assign({}, p || {});
        if (patch.finance_record_id === undefined) {
          /* keep existing — never auto-set */
        }
        return update("sales", id, patch);
      },
      cancelMaterialSale: function (id, p) {
        return update(
          "sales",
          id,
          Object.assign({ status: "Cancelled", estado: "Cancelado", payment_status: "Cancelled" }, p || {}),
        );
      },
      listMaterialDistributions: function () {
        return list("distributions");
      },
      createMaterialDistribution: function (p) {
        var row = Object.assign({ status: "Pending", estado: "Solicitado" }, p || {});
        row.titulo_do_material = row.titulo_do_material || row.material_name || "";
        row.quantidade = Number(row.quantidade != null ? row.quantidade : row.quantity || 0);
        row.quantity = Number(row.quantity != null ? row.quantity : row.quantidade || 0);
        row.data = row.data || row.distribution_date || today();
        return create("distributions", "dist-", row);
      },
      updateMaterialDistribution: function (id, p) {
        return update("distributions", id, p);
      },
      completeMaterialDistribution: function (id, p) {
        var existing = store("distributions").rows.find(function (r) {
          return r.id === id;
        });
        var updated = update(
          "distributions",
          id,
          Object.assign(
            {
              status: "Distributed",
              estado: "Distribuído",
              distributed_at: new Date().toISOString(),
            },
            p || {},
          ),
        );
        if (updated.ok && existing) {
          var qty = Number(existing.quantity || existing.quantidade || 0);
          if (qty && existing.material_id) bumpCatalogStock(existing.material_id, -qty);
        }
        return updated;
      },
      listMaterialRequests: function () {
        return list("requests");
      },
      createMaterialRequest: function (p) {
        return create(
          "requests",
          "mreq-",
          Object.assign({ status: "Pending", source: "Manual" }, p || {}),
        );
      },
      updateMaterialRequest: function (id, p) {
        return update("requests", id, p);
      },
      approveMaterialRequest: function (id, p) {
        return update(
          "requests",
          id,
          Object.assign(
            {
              status: "Approved",
              approved_at: new Date().toISOString(),
              quantity_approved:
                (p && p.quantity_approved) != null
                  ? p.quantity_approved
                  : (store("requests").rows.find(function (r) {
                      return r.id === id;
                    }) || {}).quantity_requested || 0,
            },
            p || {},
          ),
        );
      },
      rejectMaterialRequest: function (id, p) {
        if (!p || !p.rejection_reason) return fail("rejection_reason é obrigatório", "VALIDATION");
        return update("requests", id, Object.assign({ status: "Rejected" }, p));
      },
      fulfillMaterialRequest: function (id, p) {
        var existing = store("requests").rows.find(function (r) {
          return r.id === id;
        });
        var qty =
          p && p.quantity_fulfilled != null
            ? Number(p.quantity_fulfilled)
            : existing
              ? Number(existing.quantity_approved || existing.quantity_requested || 0)
              : 0;
        var updated = update(
          "requests",
          id,
          Object.assign(
            {
              status: "Fulfilled",
              quantity_fulfilled: qty,
              fulfilled_at: new Date().toISOString(),
            },
            p || {},
          ),
        );
        if (updated.ok && existing && existing.material_id && qty) {
          bumpCatalogStock(existing.material_id, -qty);
        }
        return updated;
      },
      partiallyFulfillMaterialRequest: function (id, p) {
        if (!p || p.quantity_fulfilled == null) return fail("quantity_fulfilled é obrigatório", "VALIDATION");
        var existing = store("requests").rows.find(function (r) {
          return r.id === id;
        });
        var prev = existing ? Number(existing.quantity_fulfilled || 0) : 0;
        var qty = prev + Number(p.quantity_fulfilled);
        var requested = existing ? Number(existing.quantity_requested || 0) : 0;
        var status = qty >= requested ? "Fulfilled" : "Partially Fulfilled";
        if (existing && existing.material_id) bumpCatalogStock(existing.material_id, -Number(p.quantity_fulfilled));
        return update(
          "requests",
          id,
          Object.assign({ status: status, quantity_fulfilled: qty, fulfilled_at: new Date().toISOString() }, p),
        );
      },
      getPendingMaterialRequests: function () {
        return ok(
          store("requests").rows.filter(function (r) {
            return /pend|approv/i.test(String(r.status || ""));
          }),
        );
      },
      getPrisonMaterialRequests: function () {
        return ok(
          store("requests").rows.filter(function (r) {
            return /prison/i.test(String(r.source || r.source_module || "")) || !!r.prison_id;
          }),
        );
      },
      syncPrisonMaterialRequests: function () {
        return ok({ synced: 0, skipped: true });
      },
      listMaterialFunds: function () {
        return list("funds");
      },
      createMaterialFund: function (p) {
        var row = Object.assign(
          {
            finance_record_id: null,
            status: "Recorded Internally",
            estado: "Registado Internamente",
          },
          p || {},
        );
        row.amount = Number(row.amount != null ? row.amount : row.valor_levantado || 0);
        row.valor_levantado = Number(row.valor_levantado != null ? row.valor_levantado : row.amount || 0);
        return create("funds", "fund-", row);
      },
      updateMaterialFund: function (id, p) {
        return update("funds", id, p || {});
      },
      listMaterialReports: function () {
        return list("reports");
      },
      createMaterialReport: function (p) {
        return create("reports", "mrep-", p || {});
      },
      getMinistryMaterialsOverviewStats: function () {
        var cat = store("catalog").rows;
        var sales = store("sales").rows;
        var funds = store("funds").rows;
        var reqs = store("requests").rows;
        return ok({
          totalMaterials: cat.length,
          activeMaterials: pure().getActiveMaterials().data.length,
          lowStock: pure().getLowStockMaterials().data.length,
          outOfStock: pure().getOutOfStockMaterials().data.length,
          salesCount: sales.length,
          salesAmount: sales.reduce(function (sum, s) {
            return sum + Number(s.total_amount || s.valor || 0);
          }, 0),
          pendingRequests: pure().getPendingMaterialRequests().data.length,
          prisonRequests: pure().getPrisonMaterialRequests().data.length,
          internalFundsAmount: funds.reduce(function (sum, f) {
            return sum + Number(f.amount || f.valor_levantado || 0);
          }, 0),
          fundsWithFinanceLink: funds.filter(function (f) {
            return !!f.finance_record_id;
          }).length,
          note: "Funds/sales are internal — finance_record_id not auto-created",
        });
      },
      getMaterialsFundsReport: function () {
        return ok({
          funds: store("funds").rows.slice(),
          financeRecordsCreated: 0,
          note: "Internal funds only — no automatic financeRecord",
        });
      },
      ensureMinistryMaterialsSeeded: function () {
        Object.keys(KEYS).forEach(function (kind) {
          store(kind);
        });
        return ok(true);
      },
      getMinistryMaterialsDataSourceInfo: function () {
        return {
          source: resolveDataSource(),
          provider: resolveDataSource() === "local" ? "local-bridge" : "mock-bridge",
          ready: true,
          description: "Ministry Materials pure-JS bridge fallback",
          domain: "ministryMaterials",
        };
      },
      getInfo: function () {
        return pure().getMinistryMaterialsDataSourceInfo();
      },
    };
  }

  function wrapPromise(value) {
    return Promise.resolve(value);
  }

  function call(method, args) {
    var resolved = resolveApi();
    if (resolved.api && typeof resolved.api[method] === "function") {
      try {
        var result = resolved.api[method].apply(resolved.api, args || []);
        if (result && typeof result.then === "function") return result;
        return wrapPromise(result);
      } catch (e) {
        console.warn("[CE Materials] API call failed, using fallback", method, e);
      }
    }
    var fallback = pure();
    if (typeof fallback[method] === "function") {
      try {
        return wrapPromise(fallback[method].apply(fallback, args || []));
      } catch (e2) {
        return wrapPromise(fail(e2 && e2.message ? e2.message : "fallback error"));
      }
    }
    return wrapPromise(fail("Method not available: " + method, "NOT_IMPLEMENTED"));
  }

  var methods = [
    "listMaterialsCatalog",
    "createMaterial",
    "updateMaterial",
    "getActiveMaterials",
    "getLowStockMaterials",
    "getOutOfStockMaterials",
    "listMaterialStock",
    "createMaterialStock",
    "updateMaterialStock",
    "adjustMaterialStock",
    "listMaterialSales",
    "createMaterialSale",
    "updateMaterialSale",
    "cancelMaterialSale",
    "listMaterialDistributions",
    "createMaterialDistribution",
    "updateMaterialDistribution",
    "completeMaterialDistribution",
    "listMaterialRequests",
    "createMaterialRequest",
    "updateMaterialRequest",
    "approveMaterialRequest",
    "rejectMaterialRequest",
    "fulfillMaterialRequest",
    "partiallyFulfillMaterialRequest",
    "getPendingMaterialRequests",
    "getPrisonMaterialRequests",
    "syncPrisonMaterialRequests",
    "listMaterialFunds",
    "createMaterialFund",
    "updateMaterialFund",
    "listMaterialReports",
    "createMaterialReport",
    "getMinistryMaterialsOverviewStats",
    "getMaterialsFundsReport",
    "ensureMinistryMaterialsSeeded",
    "getMinistryMaterialsDataSourceInfo",
    "getInfo",
  ];

  var dataApi = {
    dualWriteRecord: function (kind, mode, record) {
      if (!record) return Promise.resolve({ ok: true, skipped: true });
      var map = {
        materialCatalogue: { create: "createMaterial", update: "updateMaterial" },
        materialSale: { create: "createMaterialSale", update: "updateMaterialSale" },
        materialDistribution: {
          create: "createMaterialDistribution",
          update: "updateMaterialDistribution",
        },
        materialStock: { create: "createMaterialStock", update: "updateMaterialStock" },
        materialFund: { create: "createMaterialFund", update: "updateMaterialFund" },
        materialReport: { create: "createMaterialReport", update: "createMaterialReport" },
      };
      var entry = map[kind];
      if (!entry) return Promise.resolve({ ok: true, skipped: true });
      if (mode === "create") return call(entry.create, [record]);
      if (mode === "update") return call(entry.update, [record.id, record]);
      return Promise.resolve({ ok: true, skipped: true });
    },
  };
  methods.forEach(function (m) {
    dataApi[m] = function () {
      return call(m, Array.prototype.slice.call(arguments));
    };
  });

  window.CEMinistryMaterials = Object.assign({}, window.CEMinistryMaterials || {}, dataApi);
  window.CEDataLayer = window.CEDataLayer || {};
  if (!window.CEDataLayer.ministryMaterials) window.CEDataLayer.ministryMaterials = dataApi;

  try {
    console.info("[CE Materials] bridge ready", dataApi.getInfo());
  } catch (_) {}
})();
