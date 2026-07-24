/**
 * Sacraments data bridge — dual-write / pure-JS localStorage fallback.
 * Keys: ce-data-layer:baptisms | marriages | baby-dedications |
 *       sacrament-certificates | sacrament-documents | sacrament-appointments
 * Certificate payment_status is internal only — never creates financeRecord.
 */
(function () {
  var KEYS = {
    baptisms: "ce-data-layer:baptisms",
    marriages: "ce-data-layer:marriages",
    babies: "ce-data-layer:baby-dedications",
    certificates: "ce-data-layer:sacrament-certificates",
    documents: "ce-data-layer:sacrament-documents",
    appointments: "ce-data-layer:sacrament-appointments",
  };
  var memory = {
    baptisms: null,
    marriages: null,
    babies: null,
    certificates: null,
    documents: null,
    appointments: null,
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
    var layer = window.CEDataLayer && window.CEDataLayer.sacraments;
    if (layer && typeof layer.createBaptism === "function") {
      return { api: layer, via: "CEDataLayer.sacraments" };
    }
    if (window.CESacraments && typeof window.CESacraments.createBaptism === "function") {
      return { api: window.CESacraments, via: "CESacraments" };
    }
    if (window.CESupabase && typeof window.CESupabase.createBaptism === "function") {
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
      console.warn("[CE Sacraments] persist failed", key, e);
    }
  }

  function seedFor(kind) {
    var S = window.CESupabase || {};
    if (kind === "baptisms") return S.BAPTISMS_SEED || [];
    if (kind === "marriages") return S.MARRIAGES_SEED || [];
    if (kind === "babies") return S.BABY_DEDICATIONS_SEED || [];
    if (kind === "certificates") return S.SACRAMENT_CERTIFICATES_SEED || [];
    if (kind === "documents") return S.SACRAMENT_DOCUMENTS_SEED || [];
    if (kind === "appointments") return S.SACRAMENT_APPOINTMENTS_SEED || [];
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
      delete row.transaction_type;
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
      var next = Object.assign({}, s.rows[i], payload, { id: id });
      delete next.transaction_type;
      s.rows[i] = next;
      if (s.persist) save(KEYS[kind], s.rows);
      return ok(s.rows[i]);
    }
    return {
      listBaptisms: function () {
        return list("baptisms");
      },
      createBaptism: function (p) {
        var row = Object.assign({ status: "Pending", estado: "Pending" }, p || {});
        row.full_name =
          row.full_name ||
          [row.nome, row.apelido].filter(Boolean).join(" ") ||
          row.nome ||
          "";
        row.nome = row.nome || (row.full_name || "").split(" ")[0] || "";
        row.telefone = row.telefone || row.phone || "";
        row.phone = row.phone || row.telefone || "";
        row.data_do_baptismo = row.data_do_baptismo || row.scheduled_date || "";
        row.scheduled_date = row.scheduled_date || row.data_do_baptismo || "";
        if (!row.baptism_number) {
          row.baptism_number =
            "BAP-" + new Date().getFullYear() + "-" + String(store("baptisms").rows.length + 1).padStart(4, "0");
        }
        return create("baptisms", "bap-", row);
      },
      updateBaptism: function (id, p) {
        return update("baptisms", id, p);
      },
      deleteBaptism: function (id) {
        var s = store("baptisms");
        s.rows = s.rows.filter(function (r) {
          return r.id !== id;
        });
        if (s.persist) save(KEYS.baptisms, s.rows);
        return ok(true);
      },
      listMarriages: function () {
        return list("marriages");
      },
      createMarriage: function (p) {
        var row = Object.assign({ status: "Pending", estado: "Pending" }, p || {});
        row.nome_do_noivo = row.nome_do_noivo || row.groom_name || "";
        row.groom_name = row.groom_name || row.nome_do_noivo || "";
        row.nome_da_noiva = row.nome_da_noiva || row.bride_name || "";
        row.bride_name = row.bride_name || row.nome_da_noiva || "";
        row.data_do_casamento = row.data_do_casamento || row.scheduled_date || "";
        if (!row.marriage_number) {
          row.marriage_number =
            "MAR-" + new Date().getFullYear() + "-" + String(store("marriages").rows.length + 1).padStart(4, "0");
        }
        return create("marriages", "mar-", row);
      },
      updateMarriage: function (id, p) {
        return update("marriages", id, p);
      },
      deleteMarriage: function (id) {
        var s = store("marriages");
        s.rows = s.rows.filter(function (r) {
          return r.id !== id;
        });
        if (s.persist) save(KEYS.marriages, s.rows);
        return ok(true);
      },
      listBabyDedications: function () {
        return list("babies");
      },
      createBabyDedication: function (p) {
        var row = Object.assign({ status: "Pending", estado: "Pending" }, p || {});
        row.nome_da_crianca = row.nome_da_crianca || row.child_full_name || "";
        row.child_full_name = row.child_full_name || row.nome_da_crianca || "";
        row.data_da_dedicacao = row.data_da_dedicacao || row.scheduled_date || "";
        if (!row.dedication_number) {
          row.dedication_number =
            "DED-" + new Date().getFullYear() + "-" + String(store("babies").rows.length + 1).padStart(4, "0");
        }
        return create("babies", "baby-", row);
      },
      updateBabyDedication: function (id, p) {
        return update("babies", id, p);
      },
      deleteBabyDedication: function (id) {
        var s = store("babies");
        s.rows = s.rows.filter(function (r) {
          return r.id !== id;
        });
        if (s.persist) save(KEYS.babies, s.rows);
        return ok(true);
      },
      listSacramentCertificates: function () {
        return list("certificates");
      },
      createSacramentCertificate: function (p) {
        var row = Object.assign({ status: "Pending", payment_status: "Not Required", currency: "MZN" }, p || {});
        delete row.transaction_type;
        return create("certificates", "scert-", row);
      },
      updateSacramentCertificate: function (id, p) {
        return update("certificates", id, p);
      },
      issueSacramentCertificate: function (id, p) {
        return update(
          "certificates",
          id,
          Object.assign(
            {
              status: "Issued",
              issued_date: (p && p.issued_date) || new Date().toISOString().slice(0, 10),
            },
            p || {},
          ),
        );
      },
      cancelSacramentCertificate: function (id, p) {
        return update("certificates", id, Object.assign({ status: "Cancelled" }, p || {}));
      },
      listSacramentDocuments: function () {
        return list("documents");
      },
      createSacramentDocument: function (p) {
        return create("documents", "sdoc-", Object.assign({ status: "Pending Review" }, p || {}));
      },
      updateSacramentDocument: function (id, p) {
        return update("documents", id, p);
      },
      verifySacramentDocument: function (id, p) {
        return update(
          "documents",
          id,
          Object.assign({ status: "Verified", verified_at: new Date().toISOString() }, p || {}),
        );
      },
      rejectSacramentDocument: function (id, p) {
        return update(
          "documents",
          id,
          Object.assign({ status: "Rejected", rejected_at: new Date().toISOString() }, p || {}),
        );
      },
      listSacramentAppointments: function () {
        return list("appointments");
      },
      createSacramentAppointment: function (p) {
        return create("appointments", "sapt-", Object.assign({ status: "Scheduled" }, p || {}));
      },
      updateSacramentAppointment: function (id, p) {
        return update("appointments", id, p);
      },
      completeSacramentAppointment: function (id, p) {
        return update(
          "appointments",
          id,
          Object.assign({ status: "Completed", completed_at: new Date().toISOString() }, p || {}),
        );
      },
      cancelSacramentAppointment: function (id, p) {
        return update("appointments", id, Object.assign({ status: "Cancelled" }, p || {}));
      },
      getSacramentsOverviewStats: function () {
        return ok({
          baptismsPending: store("baptisms").rows.filter(function (b) {
            return /pending/i.test(String(b.status || b.estado || ""));
          }).length,
          marriagesPending: store("marriages").rows.filter(function (m) {
            return /pending|progress|document/i.test(String(m.status || m.estado || ""));
          }).length,
          pendingCertificates: store("certificates").rows.filter(function (c) {
            return /pending/i.test(String(c.status || ""));
          }).length,
          pendingDocuments: store("documents").rows.filter(function (d) {
            return /pending/i.test(String(d.status || ""));
          }).length,
          issuedCertificates: store("certificates").rows.filter(function (c) {
            return /issued/i.test(String(c.status || ""));
          }).length,
        });
      },
      getPendingCertificates: function () {
        return ok(
          store("certificates").rows.filter(function (c) {
            return /pending|prepared/i.test(String(c.status || ""));
          }),
        );
      },
      getPendingDocumentReviews: function () {
        return ok(
          store("documents").rows.filter(function (d) {
            return /pending/i.test(String(d.status || ""));
          }),
        );
      },
      getUpcomingSacramentAppointments: function () {
        var today = new Date().toISOString().slice(0, 10);
        return ok(
          store("appointments").rows.filter(function (a) {
            return String(a.scheduled_date || "") >= today;
          }),
        );
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
      console.warn("[CE Sacraments] call failed", method, error);
      if (typeof fallback[method] === "function") return fallback[method].apply(fallback, args || []);
      return fail(error && error.message);
    }
  }

  var methods = [
    "listBaptisms",
    "createBaptism",
    "updateBaptism",
    "deleteBaptism",
    "listMarriages",
    "createMarriage",
    "updateMarriage",
    "deleteMarriage",
    "listBabyDedications",
    "createBabyDedication",
    "updateBabyDedication",
    "deleteBabyDedication",
    "listSacramentCertificates",
    "createSacramentCertificate",
    "updateSacramentCertificate",
    "issueSacramentCertificate",
    "cancelSacramentCertificate",
    "listSacramentDocuments",
    "createSacramentDocument",
    "updateSacramentDocument",
    "verifySacramentDocument",
    "rejectSacramentDocument",
    "listSacramentAppointments",
    "createSacramentAppointment",
    "updateSacramentAppointment",
    "completeSacramentAppointment",
    "cancelSacramentAppointment",
    "getSacramentsOverviewStats",
    "getPendingCertificates",
    "getPendingDocumentReviews",
    "getUpcomingSacramentAppointments",
    "getInfo",
  ];

  var dataApi = {
    dualWriteRecord: function (kind, mode, record) {
      if (!record) return Promise.resolve({ ok: true, skipped: true });
      var map = {
        baptism: { create: "createBaptism", update: "updateBaptism" },
        marriage: { create: "createMarriage", update: "updateMarriage" },
        baby: { create: "createBabyDedication", update: "updateBabyDedication" },
        sacramentCertificate: {
          create: "createSacramentCertificate",
          update: "updateSacramentCertificate",
        },
        sacramentDocument: { create: "createSacramentDocument", update: "updateSacramentDocument" },
        sacramentAppointment: {
          create: "createSacramentAppointment",
          update: "updateSacramentAppointment",
        },
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

  window.CESacraments = Object.assign({}, window.CESacraments || {}, dataApi);
  window.CEDataLayer = window.CEDataLayer || {};
  if (!window.CEDataLayer.sacraments) window.CEDataLayer.sacraments = dataApi;
  if (!window.CEDataLayer.baptisms) {
    window.CEDataLayer.baptisms = {
      listBaptisms: dataApi.listBaptisms,
      createBaptism: dataApi.createBaptism,
      updateBaptism: dataApi.updateBaptism,
    };
  }

  try {
    console.info("[CE Sacraments] bridge ready", dataApi.getInfo());
  } catch (_) {}
})();
