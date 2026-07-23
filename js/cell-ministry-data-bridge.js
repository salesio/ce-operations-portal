/**
 * Cell Ministry bridge — same pattern as Foundation / Follow-Up pilots.
 * Dual-write path for cell groups, cells, leaders, reports.
 */
(function () {
  var KEYS = {
    groups: "ce-data-layer:cell-groups",
    cells: "ce-data-layer:cells",
    leaders: "ce-data-layer:cell-leaders",
    reports: "ce-data-layer:cell-reports",
  };
  var memory = { groups: null, cells: null, leaders: null, reports: null };

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
    var layer = window.CEDataLayer && window.CEDataLayer.cellMinistry;
    if (layer && typeof layer.createCellGroup === "function") {
      return { api: layer, via: "CEDataLayer.cellMinistry" };
    }
    if (window.CESupabase && typeof window.CESupabase.createCellGroup === "function") {
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
      console.warn("[CE CellMinistry] persist failed", key, e);
    }
  }

  function seedGroups() {
    return (window.CESupabase && window.CESupabase.CELL_GROUPS_SEED) || [];
  }
  function seedCells() {
    return (window.CESupabase && window.CESupabase.CELLS_SEED) || [];
  }
  function seedLeaders() {
    return (window.CESupabase && window.CESupabase.CELL_LEADERS_SEED) || [];
  }
  function seedReports() {
    return (window.CESupabase && window.CESupabase.CELL_REPORTS_SEED) || [];
  }

  function store(kind) {
    var source = resolveDataSource();
    var key = KEYS[kind];
    if (source === "local") {
      var rows = load(key);
      if (!rows.length) {
        var seeds =
          kind === "groups"
            ? seedGroups()
            : kind === "cells"
              ? seedCells()
              : kind === "leaders"
                ? seedLeaders()
                : seedReports();
        rows = seeds.map(function (s) {
          return Object.assign({}, s);
        });
        if (rows.length) save(key, rows);
      }
      return { rows: rows, persist: true, source: "local" };
    }
    if (!memory[kind]) {
      var seeds2 =
        kind === "groups"
          ? seedGroups()
          : kind === "cells"
            ? seedCells()
            : kind === "leaders"
              ? seedLeaders()
              : seedReports();
      memory[kind] = seeds2.map(function (s) {
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
      s.rows.push(row);
      if (s.persist) save(KEYS[kind], s.rows);
      return ok(row);
    }
    function update(kind, id, payload) {
      var s = store(kind);
      var i = s.rows.findIndex(function (r) {
        return r.id === id;
      });
      if (i < 0) return fail("Registo não encontrado.", "NOT_FOUND");
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
    return {
      listCellGroups: function () {
        return list("groups");
      },
      createCellGroup: function (payload) {
        return create("groups", "cg-", payload);
      },
      updateCellGroup: function (id, payload) {
        return update("groups", id, payload);
      },
      deleteCellGroup: function (id) {
        return remove("groups", id);
      },
      listCells: function () {
        return list("cells");
      },
      createCell: function (payload) {
        return create("cells", "cr-", payload);
      },
      updateCell: function (id, payload) {
        return update("cells", id, payload);
      },
      deleteCell: function (id) {
        return remove("cells", id);
      },
      getCellsByGroup: function (groupId) {
        var rows = store("cells").rows.filter(function (c) {
          return c.cell_group_id === groupId || c.group_id === groupId;
        });
        return ok(rows.slice());
      },
      listCellLeaders: function () {
        return list("leaders");
      },
      createCellLeader: function (payload) {
        return create("leaders", "cl-", payload);
      },
      updateCellLeader: function (id, payload) {
        return update("leaders", id, payload);
      },
      listCellReports: function () {
        return list("reports");
      },
      createCellReport: function (payload) {
        return create("reports", "cell-report-", payload);
      },
      updateCellReport: function (id, payload) {
        return update("reports", id, payload);
      },
      getCellReportsByWeek: function (week) {
        var rows = store("reports").rows.filter(function (r) {
          return !week || r.report_week === week || String(r.report_week || "").indexOf(week) >= 0;
        });
        return ok(rows.slice());
      },
      getCellsWithoutReport: function (week) {
        var reported = {};
        store("reports").rows.forEach(function (r) {
          if (!week || r.report_week === week) reported[r.cell_id] = true;
        });
        var rows = store("cells").rows.filter(function (c) {
          return !reported[c.id];
        });
        return ok(rows.slice());
      },
      getInfo: function () {
        return {
          source: resolveDataSource(),
          provider: "pure-js-fallback",
          ready: true,
        };
      },
    };
  }

  function getApi() {
    var resolved = resolveApi();
    if (resolved.api) return { api: resolved.api, via: resolved.via, fallback: false };
    console.warn("[CE CellMinistry] API missing — pure JS fallback", {
      CEDataLayer: !!window.CEDataLayer,
      dataSource: resolveDataSource(),
    });
    return { api: pure(), via: "pure-js-fallback", fallback: true };
  }

  async function call(method, args, aliases) {
    var resolved = getApi();
    var fn = resolved.api[method];
    if (typeof fn !== "function" && aliases) {
      for (var a = 0; a < aliases.length; a += 1) {
        if (typeof resolved.api[aliases[a]] === "function") {
          fn = resolved.api[aliases[a]];
          break;
        }
      }
    }
    var fallback = pure();
    if (typeof fn !== "function") fn = fallback[method];
    if (typeof fn !== "function") {
      console.error("[CE CellMinistry] method missing", method);
      return fail("Repositório de Células & Liderança indisponível.", "UNAVAILABLE");
    }
    try {
      return await fn.apply(resolved.api, args || []);
    } catch (error) {
      console.warn("[CE CellMinistry] " + method + " threw", error);
      if (!resolved.fallback && fallback[method]) {
        try {
          return await fallback[method].apply(fallback, args || []);
        } catch (e2) {
          return fail(e2 && e2.message, "FALLBACK_ERROR");
        }
      }
      return fail(error && error.message, "BRIDGE_ERROR");
    }
  }

  window.CECellMinistry = {
    listCellGroups: function () {
      return call("listCellGroups", []);
    },
    createCellGroup: function (payload) {
      console.info("[CE CellMinistry] createCellGroup", { via: getApi().via });
      return call("createCellGroup", [payload]);
    },
    updateCellGroup: function (id, payload) {
      return call("updateCellGroup", [id, payload]);
    },
    listCells: function () {
      return call("listCells", []);
    },
    createCell: function (payload) {
      return call("createCell", [payload]);
    },
    updateCell: function (id, payload) {
      return call("updateCell", [id, payload]);
    },
    listCellLeaders: function () {
      return call("listCellLeaders", []);
    },
    createCellLeader: function (payload) {
      return call("createCellLeader", [payload]);
    },
    updateCellLeader: function (id, payload) {
      return call("updateCellLeader", [id, payload]);
    },
    listCellReports: function () {
      return call("listCellReports", []);
    },
    createCellReport: function (payload) {
      return call("createCellReport", [payload]);
    },
    updateCellReport: function (id, payload) {
      return call("updateCellReport", [id, payload]);
    },
    getCellsByGroup: function (groupId) {
      return call("getCellsByGroup", [groupId]);
    },
    getCellReportsByWeek: function (week) {
      return call("getCellReportsByWeek", [week]);
    },
    getCellsWithoutReport: function (week) {
      return call("getCellsWithoutReport", [week]);
    },
    getInfo: function () {
      return call("getInfo", []);
    },
  };

  console.info("[CE CellMinistry] bridge ready", {
    source: resolveDataSource(),
    via: getApi().via,
  });
})();
