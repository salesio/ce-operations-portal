/**
 * Venue & Inventory data bridge — dual-write / pure-JS localStorage fallback.
 * Keys:
 *   ce-data-layer:inventory-items
 *   ce-data-layer:inventory-movements
 *   ce-data-layer:inventory-maintenance
 *   ce-data-layer:venue-spaces
 *   ce-data-layer:service-checklists
 *
 * Does NOT create finance income/expense records.
 */
(function () {
  var KEYS = {
    items: "ce-data-layer:inventory-items",
    movements: "ce-data-layer:inventory-movements",
    maintenance: "ce-data-layer:inventory-maintenance",
    spaces: "ce-data-layer:venue-spaces",
    checklists: "ce-data-layer:service-checklists",
  };
  var memory = {
    items: null,
    movements: null,
    maintenance: null,
    spaces: null,
    checklists: null,
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
      var value = String(runtime || fromBundle || "mock")
        .trim()
        .toLowerCase();
      if (value === "local" || value === "api" || value === "supabase" || value === "mock") return value;
    } catch (_) {}
    return "mock";
  }

  function resolveApi() {
    var layer = window.CEDataLayer && window.CEDataLayer.venueInventory;
    if (layer && typeof layer.createInventoryItem === "function") {
      return { api: layer, via: "CEDataLayer.venueInventory" };
    }
    if (window.CEVenueInventory && typeof window.CEVenueInventory.createInventoryItem === "function") {
      return { api: window.CEVenueInventory, via: "CEVenueInventory" };
    }
    if (window.CESupabase && typeof window.CESupabase.createInventoryItem === "function") {
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
      console.warn("[CE VenueInventory] persist failed", key, e);
    }
  }

  function seedItems() {
    return (window.CESupabase && window.CESupabase.INVENTORY_ITEMS_SEED) || [];
  }
  function seedMovements() {
    return (window.CESupabase && window.CESupabase.INVENTORY_MOVEMENTS_SEED) || [];
  }
  function seedMaintenance() {
    return (window.CESupabase && window.CESupabase.INVENTORY_MAINTENANCE_SEED) || [];
  }
  function seedSpaces() {
    return (window.CESupabase && window.CESupabase.VENUE_SPACES_SEED) || [];
  }
  function seedChecklists() {
    return (window.CESupabase && window.CESupabase.SERVICE_CHECKLISTS_SEED) || [];
  }

  function seedsFor(kind) {
    if (kind === "items") return seedItems();
    if (kind === "movements") return seedMovements();
    if (kind === "maintenance") return seedMaintenance();
    if (kind === "spaces") return seedSpaces();
    if (kind === "checklists") return seedChecklists();
    return [];
  }

  function store(kind) {
    var source = resolveDataSource();
    var key = KEYS[kind];
    if (source === "local") {
      var rows = load(key);
      if (!rows.length) {
        rows = seedsFor(kind).map(function (s) {
          return Object.assign({}, s);
        });
        if (rows.length) save(key, rows);
      }
      return { rows: rows, persist: true, source: "local" };
    }
    if (!memory[kind]) {
      memory[kind] = seedsFor(kind).map(function (s) {
        return Object.assign({}, s);
      });
    }
    return { rows: memory[kind], persist: false, source: source };
  }

  function ok(data) {
    return { ok: true, data: data };
  }
  function fail(error, code) {
    return { ok: false, error: error || "Erro", code: code || "FALLBACK_ERROR" };
  }

  function pure() {
    function list(kind) {
      return ok(store(kind).rows.slice());
    }
    function create(kind, idPrefix, payload) {
      var s = store(kind);
      var row = Object.assign({}, payload, {
        id: (payload && payload.id) || idPrefix + Date.now(),
        updated_at: new Date().toISOString().slice(0, 10),
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
      s.rows[i] = Object.assign({}, s.rows[i], payload, { id: id });
      if (s.persist) save(KEYS[kind], s.rows);
      return ok(s.rows[i]);
    }
    function remove(kind, id) {
      var s = store(kind);
      s.rows = s.rows.filter(function (r) {
        return r.id !== id;
      });
      if (s.persist) save(KEYS[kind], s.rows);
      return ok(true);
    }
    function filterStatus(kind, matcher) {
      return ok(
        store(kind).rows.filter(function (r) {
          return matcher(String(r.status || r.estado || "").toLowerCase());
        }),
      );
    }
    return {
      listInventoryItems: function () {
        return list("items");
      },
      createInventoryItem: function (payload) {
        return create("items", "inv-", payload);
      },
      updateInventoryItem: function (id, payload) {
        return update("items", id, payload);
      },
      deleteInventoryItem: function (id) {
        return remove("items", id);
      },
      getAvailableInventoryItems: function () {
        return filterStatus("items", function (s) {
          return s.includes("available") || s === "bom" || s.includes("dispon");
        });
      },
      getAssignedInventoryItems: function () {
        return ok(
          store("items").rows.filter(function (r) {
            return (
              r.assigned_to_user_id ||
              /assign|atrib/i.test(String(r.status || r.estado || ""))
            );
          }),
        );
      },
      getDamagedInventoryItems: function () {
        return filterStatus("items", function (s) {
          return s.includes("damag") || s === "mau" || s.includes("danif");
        });
      },
      getUnderMaintenanceItems: function () {
        return filterStatus("items", function (s) {
          return s.includes("maintenance") || s.includes("repar") || s.includes("manut");
        });
      },
      getPendingRegistrationItems: function () {
        return filterStatus("items", function (s) {
          return s.includes("pending") || s.includes("pendente") || s.includes("awaiting");
        });
      },
      listInventoryMovements: function () {
        return list("movements");
      },
      createInventoryMovement: function (payload) {
        return create("movements", "move-", payload);
      },
      updateInventoryMovement: function (id, payload) {
        return update("movements", id, payload);
      },
      listMaintenanceRecords: function () {
        return list("maintenance");
      },
      createMaintenanceRecord: function (payload) {
        return create("maintenance", "maint-", payload);
      },
      updateMaintenanceRecord: function (id, payload) {
        return update("maintenance", id, payload);
      },
      closeMaintenanceRecord: function (id, payload) {
        return update(
          "maintenance",
          id,
          Object.assign({}, payload || {}, {
            status: "Completed",
            estado: "Reparado",
            data_de_retorno: new Date().toISOString().slice(0, 10),
          }),
        );
      },
      listVenueSpaces: function () {
        return list("spaces");
      },
      createVenueSpace: function (payload) {
        return create("spaces", "venue-", payload);
      },
      updateVenueSpace: function (id, payload) {
        return update("spaces", id, payload);
      },
      listServiceChecklists: function () {
        return list("checklists");
      },
      createServiceChecklist: function (payload) {
        return create("checklists", "check-", payload);
      },
      updateServiceChecklist: function (id, payload) {
        return update("checklists", id, payload);
      },
      completeServiceChecklist: function (id, payload) {
        return update(
          "checklists",
          id,
          Object.assign({}, payload || {}, { status: "Completed", estado: "Pronto" }),
        );
      },
      registerItemFromRequisition: function (requisition, actor) {
        var amount =
          Number(
            (requisition &&
              (requisition.released_amount ||
                requisition.amount_released ||
                requisition.approved_amount ||
                requisition.estimated_amount)) ||
              0,
          ) || 0;
        var item = {
          id: "inv-req-" + ((requisition && requisition.id) || Date.now()),
          name: (requisition && requisition.title) || "Item de requisição",
          nome_do_item: (requisition && requisition.title) || "Item de requisição",
          description: (requisition && requisition.description) || "",
          category: "Media",
          categoria: (requisition && requisition.requisition_type) || "Outros",
          quantity: 1,
          quantidade: 1,
          church_id: (requisition && requisition.church_id) || null,
          department_name: (requisition && requisition.department_name) || "",
          departamento_responsavel: (requisition && requisition.department_name) || "",
          acquisition_source: "Requisition",
          acquisition_date: new Date().toISOString().slice(0, 10),
          data_de_entrada: new Date().toISOString().slice(0, 10),
          acquisition_cost: amount,
          valor_unitario: amount,
          valor_total: amount,
          currency: "MZN",
          requisition_id: (requisition && requisition.id) || null,
          request_number: (requisition && requisition.request_number) || "",
          finance_disbursement_id: (requisition && requisition.finance_disbursement_id) || null,
          status: "Available",
          condition: "New",
          estado: "Bom",
          draft_from_requisition: false,
          created_by: (actor && actor.name) || "",
          created_by_name: (actor && actor.name) || "",
        };
        return create("items", "inv-", item);
      },
      getInfo: function () {
        return { source: resolveDataSource(), provider: "pure-js-fallback", ready: true };
      },
    };
  }

  async function call(method, args) {
    var resolved = resolveApi();
    var api = resolved.api || pure();
    var fn = api[method];
    var fallback = pure();
    if (typeof fn !== "function") fn = fallback[method];
    if (typeof fn !== "function") return fail("Método em falta: " + method);
    try {
      return await Promise.resolve(fn.apply(api, args || []));
    } catch (error) {
      console.warn("[CE VenueInventory] call failed", method, error);
      if (typeof fallback[method] === "function") return fallback[method].apply(fallback, args || []);
      return fail(error && error.message);
    }
  }

  var dataApi = {
    listInventoryItems: function () {
      return call("listInventoryItems", []);
    },
    createInventoryItem: function (payload) {
      return call("createInventoryItem", [payload]);
    },
    updateInventoryItem: function (id, payload) {
      return call("updateInventoryItem", [id, payload]);
    },
    deleteInventoryItem: function (id) {
      return call("deleteInventoryItem", [id]);
    },
    listInventoryMovements: function () {
      return call("listInventoryMovements", []);
    },
    createInventoryMovement: function (payload) {
      return call("createInventoryMovement", [payload]);
    },
    updateInventoryMovement: function (id, payload) {
      return call("updateInventoryMovement", [id, payload]);
    },
    listMaintenanceRecords: function () {
      return call("listMaintenanceRecords", []);
    },
    createMaintenanceRecord: function (payload) {
      return call("createMaintenanceRecord", [payload]);
    },
    updateMaintenanceRecord: function (id, payload) {
      return call("updateMaintenanceRecord", [id, payload]);
    },
    closeMaintenanceRecord: function (id, payload) {
      return call("closeMaintenanceRecord", [id, payload]);
    },
    listVenueSpaces: function () {
      return call("listVenueSpaces", []);
    },
    createVenueSpace: function (payload) {
      return call("createVenueSpace", [payload]);
    },
    updateVenueSpace: function (id, payload) {
      return call("updateVenueSpace", [id, payload]);
    },
    listServiceChecklists: function () {
      return call("listServiceChecklists", []);
    },
    createServiceChecklist: function (payload) {
      return call("createServiceChecklist", [payload]);
    },
    updateServiceChecklist: function (id, payload) {
      return call("updateServiceChecklist", [id, payload]);
    },
    completeServiceChecklist: function (id, payload) {
      return call("completeServiceChecklist", [id, payload]);
    },
    getAvailableInventoryItems: function () {
      return call("getAvailableInventoryItems", []);
    },
    getAssignedInventoryItems: function () {
      return call("getAssignedInventoryItems", []);
    },
    getDamagedInventoryItems: function () {
      return call("getDamagedInventoryItems", []);
    },
    getUnderMaintenanceItems: function () {
      return call("getUnderMaintenanceItems", []);
    },
    getPendingRegistrationItems: function () {
      return call("getPendingRegistrationItems", []);
    },
    registerItemFromRequisition: function (requisition, actor) {
      return call("registerItemFromRequisition", [requisition, actor]);
    },
    getInfo: function () {
      var resolved = resolveApi();
      if (resolved.api && typeof resolved.api.getInfo === "function") return resolved.api.getInfo();
      return pure().getInfo();
    },
    dualWriteRecord: function (kind, mode, record) {
      if (!record) return Promise.resolve({ ok: true, skipped: true });
      var map = {
        inventoryItem: {
          create: "createInventoryItem",
          update: "updateInventoryItem",
        },
        venueAcquisition: {
          create: "createInventoryItem",
          update: "updateInventoryItem",
        },
        venueStaffEquipment: {
          create: "createInventoryItem",
          update: "updateInventoryItem",
        },
        venueMaintenance: {
          create: "createMaintenanceRecord",
          update: "updateMaintenanceRecord",
        },
        venueMovement: {
          create: "createInventoryMovement",
          update: "updateInventoryMovement",
        },
        venueSpace: {
          create: "createVenueSpace",
          update: "updateVenueSpace",
        },
        venueChecklist: {
          create: "createServiceChecklist",
          update: "updateServiceChecklist",
        },
      };
      var entry = map[kind];
      if (!entry) return Promise.resolve({ ok: true, skipped: true });
      if (mode === "create") return call(entry.create, [record]);
      if (mode === "update") return call(entry.update, [record.id, record]);
      return Promise.resolve({ ok: true, skipped: true });
    },
  };

  // Expose CEVenueInventory (prefer data layer when present; bridge wraps dual-write)
  var existing = window.CEVenueInventory || {};
  window.CEVenueInventory = Object.assign({}, existing, dataApi);

  window.CEDataLayer = window.CEDataLayer || {};
  if (!window.CEDataLayer.venueInventory) {
    window.CEDataLayer.venueInventory = dataApi;
  }
  if (!window.CEDataLayer.inventoryItems) {
    window.CEDataLayer.inventoryItems = {
      listInventoryItems: dataApi.listInventoryItems,
      createInventoryItem: dataApi.createInventoryItem,
      updateInventoryItem: dataApi.updateInventoryItem,
      deleteInventoryItem: dataApi.deleteInventoryItem,
    };
  }
  if (!window.CEDataLayer.inventoryMovements) {
    window.CEDataLayer.inventoryMovements = {
      listInventoryMovements: dataApi.listInventoryMovements,
      createInventoryMovement: dataApi.createInventoryMovement,
      updateInventoryMovement: dataApi.updateInventoryMovement,
    };
  }
  if (!window.CEDataLayer.inventoryMaintenance) {
    window.CEDataLayer.inventoryMaintenance = {
      listMaintenanceRecords: dataApi.listMaintenanceRecords,
      createMaintenanceRecord: dataApi.createMaintenanceRecord,
      updateMaintenanceRecord: dataApi.updateMaintenanceRecord,
      closeMaintenanceRecord: dataApi.closeMaintenanceRecord,
    };
  }
  if (!window.CEDataLayer.venueSpaces) {
    window.CEDataLayer.venueSpaces = {
      listVenueSpaces: dataApi.listVenueSpaces,
      createVenueSpace: dataApi.createVenueSpace,
      updateVenueSpace: dataApi.updateVenueSpace,
    };
  }
  if (!window.CEDataLayer.serviceChecklists) {
    window.CEDataLayer.serviceChecklists = {
      listServiceChecklists: dataApi.listServiceChecklists,
      createServiceChecklist: dataApi.createServiceChecklist,
      updateServiceChecklist: dataApi.updateServiceChecklist,
      completeServiceChecklist: dataApi.completeServiceChecklist,
    };
  }

  try {
    console.info("[CE VenueInventory] bridge ready", dataApi.getInfo());
  } catch (_) {}
})();
