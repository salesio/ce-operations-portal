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
    evaluations: "ce-data-layer:cell-evaluations",
    actionPlans: "ce-data-layer:cell-action-plans",
  };
  var memory = { groups: null, cells: null, leaders: null, reports: null, evaluations: null, actionPlans: null };

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
    var adapter = (window.CESupabase && window.CESupabase.cellMinistrySupabaseAdapter) || window.cellMinistrySupabaseAdapter;
    if (adapter && typeof adapter.listCellGroups === "function") {
      return { api: adapter, via: "CESupabase.cellMinistrySupabaseAdapter" };
    }
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
    return (window.REAL_CELL_GROUPS) || (window.CESupabase && window.CESupabase.CELL_GROUPS_SEED) || [];
  }
  function seedCells() {
    return (window.REAL_CELLS_REGISTRY) || (window.CESupabase && window.CESupabase.CELLS_SEED) || [];
  }
  function seedLeaders() {
    return (window.CESupabase && window.CESupabase.CELL_LEADERS_SEED) || [];
  }
  function seedReports() {
    return (window.CESupabase && window.CESupabase.CELL_REPORTS_SEED) || [];
  }
  function seedEvaluations() {
    return (window.CESupabase && window.CESupabase.CELL_EVALUATIONS_SEED) || [
      { id: "e1111111-1111-4111-8111-111111111101", church_id: "a1111111-1111-4111-8111-111111111101", report_id: "CR-2026-09-01", cell_id: "2b3a5652-b8be-4c76-8b64-b84200c8bcd4", cell_name: "Diplomatas Victory", avaliador: "Pastora Flavia", data_da_avaliacao: "2026-09-10", classificacao: "Excelente", pontos_fortes: "Excelente pontualidade e retenção de primeiros visitantes.", pontos_a_melhorar: "Aumentar número de encontros de oração.", acao_recomendada: "Preparar proposta para divisão da célula no próximo trimestre.", precisa_followup: false, estado: "Aprovado" },
      { id: "e1111111-1111-4111-8111-111111111102", church_id: "a1111111-1111-4111-8111-111111111101", report_id: "CR-2026-09-02", cell_id: "17de71f5-1926-4b34-8cc6-4c690c3c0262", cell_name: "Pioneiros Change", avaliador: "Pastora Flavia", data_da_avaliacao: "2026-09-12", classificacao: "Precisa de Atenção", pontos_fortes: "Líder dedicado e membro fiel no ALEC.", pontos_a_melhorar: "Baixa frequência nos últimos 2 cultos celulares.", acao_recomendada: "Agendar reunião com a supervisora e reforçar visitas pastorais.", precisa_followup: true, estado: "Em Análise" }
    ];
  }
  function seedActionPlans() {
    return (window.CESupabase && window.CESupabase.CELL_ACTION_PLANS_SEED) || [
      { id: "f1111111-1111-4111-8111-111111111101", church_id: "a1111111-1111-4111-8111-111111111101", cell_id: "17de71f5-1926-4b34-8cc6-4c690c3c0262", cell_name: "Pioneiros Change", leader_name: "Aminata Chivinda", action: "Acompanhamento semanal com supervisora e reforço de evangelismo.", owner: "Pastora Flavia", due_date: "2026-09-25", status: "Em Curso", notes: "Prioridade para conclusão do curso ALEC e visitas domiciliares." },
      { id: "f1111111-1111-4111-8111-111111111102", church_id: "a1111111-1111-4111-8111-111111111101", cell_id: "2b3a5652-b8be-4c76-8b64-b84200c8bcd4", cell_name: "Diplomatas Victory", leader_name: "Mateus Nhantumbo", action: "Preparar divisão da célula e identificar líder auxiliar.", owner: "Pastora Flavia", due_date: "2026-10-05", status: "Planeado", notes: "Célula atingiu mais de 16 membros regulares." }
    ];
  }

  function getSeeds(kind) {
    if (kind === "groups") return seedGroups();
    if (kind === "cells") return seedCells();
    if (kind === "leaders") return seedLeaders();
    if (kind === "reports") return seedReports();
    if (kind === "evaluations") return seedEvaluations();
    if (kind === "actionPlans") return seedActionPlans();
    return [];
  }

  function store(kind) {
    var key = KEYS[kind];
    var rows = load(key);
    var seeds = getSeeds(kind);
    if (!rows || !rows.length) {
      rows = seeds.map(function (s) {
        return Object.assign({}, s);
      });
      if (rows.length) save(key, rows);
    } else if (kind === "groups" || kind === "cells" || kind === "evaluations" || kind === "actionPlans") {
      var updated = false;
      seeds.forEach(function (seed) {
        var exists = rows.some(function (r) {
          return String(r.id) === String(seed.id) ||
            (r.name && seed.name && r.name === seed.name) ||
            (r.cell_name && seed.cell_name && r.cell_name === seed.cell_name && r.report_id && seed.report_id && r.report_id === seed.report_id);
        });
        if (!exists) {
          rows.push(Object.assign({}, seed));
          updated = true;
        }
      });
      if (updated) save(key, rows);
    }
    return { rows: rows, persist: true, source: resolveDataSource() };
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
      save(KEYS[kind], s.rows);
      return ok(row);
    }
    function update(kind, id, payload) {
      var s = store(kind);
      var i = s.rows.findIndex(function (r) {
        return String(r.id) === String(id);
      });
      if (i < 0) {
        var newRow = Object.assign({}, payload, { id: id, updated_at: new Date().toISOString().slice(0, 10) });
        s.rows.push(newRow);
        save(KEYS[kind], s.rows);
        return ok(newRow);
      }
      s.rows[i] = Object.assign({}, s.rows[i], payload, { id: id, updated_at: new Date().toISOString().slice(0, 10) });
      save(KEYS[kind], s.rows);
      return ok(s.rows[i]);
    }
    function remove(kind, id) {
      var s = store(kind);
      s.rows = s.rows.filter(function (r) {
        return String(r.id) !== String(id);
      });
      save(KEYS[kind], s.rows);
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
      listCellEvaluations: function () {
        return list("evaluations");
      },
      createCellEvaluation: function (payload) {
        return create("evaluations", "eval-", payload);
      },
      updateCellEvaluation: function (id, payload) {
        return update("evaluations", id, payload);
      },
      deleteCellEvaluation: function (id) {
        return remove("evaluations", id);
      },
      listCellActionPlans: function () {
        return list("actionPlans");
      },
      createCellActionPlan: function (payload) {
        return create("actionPlans", "ap-", payload);
      },
      updateCellActionPlan: function (id, payload) {
        return update("actionPlans", id, payload);
      },
      deleteCellActionPlan: function (id) {
        return remove("actionPlans", id);
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
      var res = await fn.apply(resolved.api, args || []);
      if (res && res.ok !== false && (method.indexOf("create") === 0 || method.indexOf("update") === 0 || method.indexOf("delete") === 0)) {
        try {
          if (fallback[method] && fn !== fallback[method]) {
            await fallback[method].apply(fallback, args || []);
          }
        } catch (_) {}
      }
      return res;
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
    listCellEvaluations: function () {
      return call("listCellEvaluations", []);
    },
    createCellEvaluation: function (payload) {
      return call("createCellEvaluation", [payload]);
    },
    updateCellEvaluation: function (id, payload) {
      return call("updateCellEvaluation", [id, payload]);
    },
    deleteCellEvaluation: function (id) {
      return call("deleteCellEvaluation", [id]);
    },
    listCellActionPlans: function () {
      return call("listCellActionPlans", []);
    },
    createCellActionPlan: function (payload) {
      return call("createCellActionPlan", [payload]);
    },
    updateCellActionPlan: function (id, payload) {
      return call("updateCellActionPlan", [id, payload]);
    },
    deleteCellActionPlan: function (id) {
      return call("deleteCellActionPlan", [id]);
    },
    listCellUserAssignments: function (filter) {
      return call("listCellUserAssignments", [filter]);
    },
    createCellUserAssignment: function (payload) {
      return call("createCellUserAssignment", [payload]);
    },
    updateCellUserAssignment: function (id, payload) {
      return call("updateCellUserAssignment", [id, payload]);
    },
    endCellUserAssignment: function (id, notes) {
      return call("endCellUserAssignment", [id, notes]);
    },
    listCellTransferRequests: function (filter) {
      return call("listCellTransferRequests", [filter]);
    },
    createCellTransferRequest: function (payload) {
      return call("createCellTransferRequest", [payload]);
    },
    approveCellTransferRequest: function (id, reviewerId, reviewerName) {
      return call("approveCellTransferRequest", [id, reviewerId, reviewerName]);
    },
    rejectCellTransferRequest: function (id, reviewerId, rejectionReason, reviewerName) {
      return call("rejectCellTransferRequest", [id, reviewerId, rejectionReason, reviewerName]);
    },
    logCellMemberRemoval: function (payload) {
      return call("logCellMemberRemoval", [payload]);
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
