/**
 * Members module bridge — progressive data layer with strict Supabase mode.
 *
 * Resolution order:
 * 1. window.CEDataLayer.members
 * 2. window.CESupabase (IIFE bundle exports)
 * 3. Pure JS fallback (mock / ce-data-layer:members)
 */
(function () {
  var STORAGE_KEY = "ce-data-layer:members";
  var fallbackMemory = null;
  var BUILD_VERSION = "2026.08.19-members-runtime-fix";

  var lastState = {
    lastQuery: null,
    lastError: null,
    lastRowsReturned: 0,
    fallbackUsed: false,
  };

  function friendlyError(result, fallback) {
    if (result && result.ok === false) return result.error || fallback;
    return fallback;
  }

  function resolveDataSource() {
    try {
      var runtime =
        typeof window !== "undefined" && window.__CE_ENV__
          ? window.__CE_ENV__.VITE_DATA_SOURCE
          : "";
      var fromBundle =
        window.CESupabase && typeof window.CESupabase.getDataSource === "function"
          ? window.CESupabase.getDataSource()
          : window.CEDataLayer && typeof window.CEDataLayer.getDataSource === "function"
            ? window.CEDataLayer.getDataSource()
            : "";
      var value = String(runtime || fromBundle || "mock")
        .trim()
        .toLowerCase();
      if (value === "local" || value === "api" || value === "supabase" || value === "mock") {
        return value;
      }
    } catch (error) {
      console.warn("[CE Members] resolveDataSource failed", error);
    }
    return "mock";
  }

  function safeRuntimeInfo() {
    var env = (typeof window !== "undefined" && window.__CE_ENV__) || {};
    var runtime = {};
    try {
      if (window.CESupabase && typeof window.CESupabase.getInfo === "function") {
        runtime = window.CESupabase.getInfo() || {};
      } else if (window.CEDataLayer && typeof window.CEDataLayer.getInfo === "function") {
        runtime = window.CEDataLayer.getInfo() || {};
      }
    } catch (_) {}
    return {
      dataSource: resolveDataSource(),
      hasSupabaseUrl: Boolean(runtime.hasSupabaseUrl || env.VITE_SUPABASE_URL),
      hasSupabaseAnonKey: Boolean(runtime.hasSupabaseAnonKey || env.VITE_SUPABASE_ANON_KEY),
      supabaseEnabled: Boolean(runtime.supabaseEnabled || /^(1|true|yes|on)$/i.test(String(env.VITE_ENABLE_SUPABASE || ""))),
      dataLayerRepositoryLoaded: Boolean(window.CEDataLayer && window.CEDataLayer.members),
      supabaseProviderLoaded: Boolean(window.CESupabase && typeof window.CESupabase.createMember === "function"),
    };
  }

  function resolveRepoApi() {
    var layer = window.CEDataLayer && window.CEDataLayer.members;
    if (layer && typeof layer.createMember === "function") {
      return { api: layer, via: "CEDataLayer.members" };
    }

    var supabase = window.CESupabase;
    if (supabase && typeof supabase.createMember === "function") {
      return { api: supabase, via: "CESupabase" };
    }

    if (supabase && supabase.repositories && supabase.repositories.members) {
      return { api: supabase.repositories.members, via: "CESupabase.repositories.members" };
    }

    var data = window.CEData && window.CEData.members;
    if (data && typeof data.createMember === "function") {
      return { api: data, via: "CEData.members" };
    }

    return { api: null, via: "none" };
  }

  function loadLocalRows() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn("[CE Members] failed to read", STORAGE_KEY, error);
      return [];
    }
  }

  function saveLocalRows(rows) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    } catch (error) {
      console.warn("[CE Members] failed to write", STORAGE_KEY, error);
    }
  }

  function defaultSeed() {
    var seedFromBundle =
      window.CESupabase && Array.isArray(window.CESupabase.MEMBERS_SEED)
        ? window.CESupabase.MEMBERS_SEED
        : null;
    if (seedFromBundle && seedFromBundle.length) {
      return seedFromBundle.map(function (item) {
        return Object.assign({}, item);
      });
    }
    return [
      {
        id: "m-1",
        tratamento: "Pastor",
        nome: "Kene",
        apelido: "Ume",
        telefone: "+258 86 227 0000",
        email: "",
        church_id: "church-hq",
        church_name: "E.C. Maputo Central - Sede",
        celula: "Sede",
        departamento: "Leadership",
        estado: "Active",
        data_de_entrada: "2024-01-01",
        origem: "Manual",
        notas: "",
      },
      {
        id: "m-2",
        tratamento: "Irmã",
        nome: "Aminata",
        apelido: "Chivinda",
        telefone: "848287179",
        email: "",
        church_id: "church-hq",
        church_name: "E.C. Maputo Central - Sede",
        celula: "Mavalane",
        departamento: "Acompanhamento",
        estado: "In Progress",
        data_de_entrada: "2026-07-05",
        origem: "Primeira Vez",
        notas: "",
      },
    ];
  }

  function getFallbackStore() {
    var source = resolveDataSource();
    if (source === "local") {
      var rows = loadLocalRows();
      if (!rows.length) {
        rows = defaultSeed();
        if (rows.length) saveLocalRows(rows);
      }
      return { source: "local", rows: rows, persist: true };
    }
    if (!fallbackMemory) {
      fallbackMemory = defaultSeed();
    }
    return { source: source === "mock" ? "mock" : source, rows: fallbackMemory, persist: false };
  }

  function ok(data) {
    return { ok: true, data: data };
  }

  function fail(error, code) {
    return { ok: false, error: error || "Erro desconhecido.", code: code || "FALLBACK_ERROR" };
  }

  function filterRows(rows, predicate) {
    return rows.filter(predicate);
  }

  var pureFallback = {
    listMembers: async function () {
      var store = getFallbackStore();
      return ok(store.rows.slice());
    },
    listMembersPage: async function (query) {
      var listed = await pureFallback.listMembers();
      if (!listed.ok) return listed;
      var source = listed.data || [];
      var page = Math.max(1, Number(query && query.page) || 1);
      var pageSize = Math.min(100, Math.max(25, Number(query && query.pageSize) || 50));
      var totalCount = source.length;
      return ok({
        items: source.slice((page - 1) * pageSize, page * pageSize),
        page: page,
        pageSize: pageSize,
        totalCount: totalCount,
        totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
        hasNext: page * pageSize < totalCount,
        hasPrevious: page > 1,
      });
    },
    getMemberById: async function (id) {
      var store = getFallbackStore();
      var found = store.rows.find(function (row) {
        return row.id === id;
      });
      return ok(found || null);
    },
    createMember: async function (payload) {
      var store = getFallbackStore();
      if (store.source === "api" || store.source === "supabase") {
        return fail(
          "API/Supabase provider indisponível.",
          "NOT_IMPLEMENTED"
        );
      }
      var id = (payload && payload.id) || "m-" + Date.now();
      var member = Object.assign({}, payload, {
        id: id,
        updated_at: new Date().toISOString().slice(0, 10),
      });
      store.rows.push(member);
      if (store.persist) saveLocalRows(store.rows);
      console.info("[CE Members] pure fallback createMember", { id: member.id, source: store.source });
      return ok(member);
    },
    updateMember: async function (id, payload) {
      var store = getFallbackStore();
      if (store.source === "api" || store.source === "supabase") {
        return fail(
          "API/Supabase provider indisponível.",
          "NOT_IMPLEMENTED"
        );
      }
      var index = store.rows.findIndex(function (row) {
        return row.id === id;
      });
      if (index < 0) return fail("Membro não encontrado.", "NOT_FOUND");
      var next = Object.assign({}, store.rows[index], payload, {
        id: id,
        updated_at: new Date().toISOString().slice(0, 10),
      });
      store.rows[index] = next;
      if (store.persist) saveLocalRows(store.rows);
      console.info("[CE Members] pure fallback updateMember", { id: id, source: store.source });
      return ok(next);
    },
    deleteMember: async function (id) {
      var store = getFallbackStore();
      var before = store.rows.length;
      store.rows = store.rows.filter(function (row) {
        return row.id !== id;
      });
      if (store.rows.length === before) return fail("Membro não encontrado.", "NOT_FOUND");
      if (store.persist) saveLocalRows(store.rows);
      return ok(true);
    },
    searchMembers: async function (query) {
      var listed = await pureFallback.listMembers();
      if (!listed.ok) return listed;
      var q = String(query || "")
        .trim()
        .toLowerCase();
      if (!q) return listed;
      return ok(
        listed.data.filter(function (member) {
          return [member.nome, member.apelido, member.telefone, member.email, member.celula, member.departamento]
            .some(function (value) {
              return String(value || "")
                .toLowerCase()
                .includes(q);
            });
        })
      );
    },
    getMembersByChurch: async function (churchId) {
      var listed = await pureFallback.listMembers();
      if (!listed.ok) return listed;
      return ok(filterRows(listed.data, function (m) { return m.church_id === churchId; }));
    },
    getMembersByCell: async function (cellId) {
      var listed = await pureFallback.listMembers();
      if (!listed.ok) return listed;
      return ok(filterRows(listed.data, function (m) { return m.cell_id === cellId; }));
    },
    getMembersByCellGroup: async function (cellGroupId) {
      var listed = await pureFallback.listMembers();
      if (!listed.ok) return listed;
      return ok(filterRows(listed.data, function (m) { return m.cell_group_id === cellGroupId; }));
    },
    getMembersByDepartment: async function (departmentId) {
      var listed = await pureFallback.listMembers();
      if (!listed.ok) return listed;
      var key = String(departmentId || "").toLowerCase();
      return ok(
        filterRows(listed.data, function (m) {
          return (
            m.department_id === departmentId ||
            String(m.departamento || "").toLowerCase() === key
          );
        })
      );
    },
    getActiveMembers: async function () {
      var listed = await pureFallback.listMembers();
      if (!listed.ok) return listed;
      return ok(
        filterRows(listed.data, function (m) {
          var s = String(m.estado || "").toLowerCase();
          return s === "active" || s === "activo";
        })
      );
    },
    getInactiveMembers: async function () {
      var listed = await pureFallback.listMembers();
      if (!listed.ok) return listed;
      return ok(
        filterRows(listed.data, function (m) {
          var s = String(m.estado || "").toLowerCase();
          return s === "inactive" || s === "inactivo";
        })
      );
    },
    getInfo: function () {
      return {
        source: resolveDataSource(),
        provider: "pure-js-fallback",
        ready: true,
        description: "Bridge fallback (bundle API missing)",
      };
    },
  };

  function getApi() {
    var resolved = resolveRepoApi();
    if (resolved.api) {
      return { api: resolved.api, via: resolved.via, fallback: false };
    }
    var source = resolveDataSource();
    if (source === "supabase") {
      return { api: null, via: "none", fallback: true };
    }
    console.warn("[CE Members] repository unavailable; using pure JS fallback", Object.assign(
      safeRuntimeInfo(),
      { fallbackReason: "No Members repository API was installed by the runtime bundle." }
    ));
    return { api: pureFallback, via: "pure-js-fallback", fallback: true };
  }

  async function call(method, args) {
    var source = resolveDataSource();
    var resolved = getApi();

    if (method === "listMembersPage" || method === "listMembers") {
      lastState.lastQuery = (args && args[0]) || {};
    }

    if (source === "supabase") {
      if (resolved.fallback || !resolved.api) {
        lastState.lastError = "Repositório de membros Supabase não está inicializado.";
        lastState.fallbackUsed = false;
        return fail("Não foi possível carregar membros do Supabase. Verifique a ligação ao servidor.", "SUPABASE_UNAVAILABLE");
      }
      var supabaseFn = resolved.api[method];
      if (typeof supabaseFn !== "function") {
        lastState.lastError = "Método " + method + " não disponível no repositório Supabase.";
        lastState.fallbackUsed = false;
        return fail("Operação não suportada no repositório de membros Supabase.", "NOT_SUPPORTED");
      }
      try {
        var sbResult = await supabaseFn.apply(resolved.api, args || []);
        if (sbResult && sbResult.ok === false) {
          lastState.lastError = sbResult.error || "Erro retornado pelo Supabase.";
          lastState.fallbackUsed = false;
          return sbResult;
        }
        lastState.lastError = null;
        lastState.fallbackUsed = false;
        if (sbResult && sbResult.data) {
          if (Array.isArray(sbResult.data.items)) {
            lastState.lastRowsReturned = sbResult.data.items.length;
          } else if (Array.isArray(sbResult.data)) {
            lastState.lastRowsReturned = sbResult.data.length;
          } else {
            lastState.lastRowsReturned = 1;
          }
        }
        return sbResult;
      } catch (sbError) {
        lastState.lastError = sbError && sbError.message ? sbError.message : "Excepção na chamada Supabase.";
        lastState.fallbackUsed = false;
        return fail(lastState.lastError, "SUPABASE_EXCEPTION");
      }
    }

    // Mock / Local mode with fallback tolerance
    var fn = resolved.api && resolved.api[method];
    if (typeof fn !== "function") {
      fn = pureFallback[method];
    }
    if (typeof fn !== "function") {
      console.error("[CE Members] method missing", method, resolved);
      return fail("Repositório de membros indisponível.", "UNAVAILABLE");
    }
    try {
      var result = await fn.apply(resolved.api, args || []);
      if (result && result.ok === false && !resolved.fallback && pureFallback[method]) {
        console.warn("[CE Members] bundle " + method + " failed — retrying pure fallback", result);
        lastState.fallbackUsed = true;
        return await pureFallback[method].apply(pureFallback, args || []);
      }
      lastState.lastError = null;
      lastState.fallbackUsed = resolved.fallback;
      if (result && result.data) {
        if (Array.isArray(result.data.items)) {
          lastState.lastRowsReturned = result.data.items.length;
        } else if (Array.isArray(result.data)) {
          lastState.lastRowsReturned = result.data.length;
        }
      }
      return result;
    } catch (error) {
      console.warn("[CE Members] " + method + " threw via " + resolved.via, error);
      if (!resolved.fallback && pureFallback[method]) {
        try {
          lastState.fallbackUsed = true;
          return await pureFallback[method].apply(pureFallback, args || []);
        } catch (fallbackError) {
          console.error("[CE Members] pure fallback also failed", fallbackError);
          lastState.lastError = fallbackError && fallbackError.message;
          return fail(fallbackError && fallbackError.message, "FALLBACK_ERROR");
        }
      }
      lastState.lastError = error && error.message;
      return fail(error && error.message, "BRIDGE_ERROR");
    }
  }

  window.CEMembers = {
    listMembers: function () { return call("listMembers", []); },
    listMembersPage: function (query) { return call("listMembersPage", [query || {}]); },
    getMemberById: function (id) { return call("getMemberById", [id]); },
    createMember: function (payload) {
      console.info("[CE Members] createMember invoked", {
        name: payload && (payload.nome || payload.full_name),
        via: getApi().via,
      });
      return call("createMember", [payload]);
    },
    updateMember: function (id, payload) {
      console.info("[CE Members] updateMember invoked", { id: id, via: getApi().via });
      return call("updateMember", [id, payload]);
    },
    deleteMember: function (id) { return call("deleteMember", [id]); },
    searchMembers: function (query) { return call("searchMembers", [query]); },
    getMembersByChurch: function (churchId) { return call("getMembersByChurch", [churchId]); },
    getMembersByCell: function (cellId) { return call("getMembersByCell", [cellId]); },
    getMembersByCellGroup: function (cellGroupId) { return call("getMembersByCellGroup", [cellGroupId]); },
    getMembersByDepartment: function (departmentId) { return call("getMembersByDepartment", [departmentId]); },
    getActiveMembers: function () { return call("getActiveMembers", []); },
    getInactiveMembers: function () { return call("getInactiveMembers", []); },
    getInfo: function () {
      var source = resolveDataSource();
      var resolved = getApi();
      var adapterInfo = {};
      try {
        if (resolved.api && typeof resolved.api.getMembersDataSourceInfo === "function") {
          adapterInfo = resolved.api.getMembersDataSourceInfo() || {};
        } else if (resolved.api && typeof resolved.api.getInfo === "function") {
          adapterInfo = resolved.api.getInfo() || {};
        }
      } catch (_) {}
      var repoName = (resolved.via === "CESupabase" || resolved.via.indexOf("members") >= 0)
        ? "membersSupabaseAdapter"
        : (resolved.via || "pureFallback");
      return {
        dataSource: source,
        repository: repoName,
        fallbackUsed: adapterInfo.fallbackUsed !== undefined ? adapterInfo.fallbackUsed : lastState.fallbackUsed,
        lastQuery: adapterInfo.lastQuery !== undefined && adapterInfo.lastQuery !== null ? adapterInfo.lastQuery : lastState.lastQuery,
        lastError: adapterInfo.lastError !== undefined ? adapterInfo.lastError : lastState.lastError,
        lastRowsReturned: adapterInfo.lastRowsReturned !== undefined ? adapterInfo.lastRowsReturned : lastState.lastRowsReturned,
        version: BUILD_VERSION,
        via: resolved.via,
        ready: !!resolved.api,
        fallback: resolved.fallback,
        checkedAt: new Date().toISOString(),
      };
    },
    friendlyError: friendlyError,
    _debugResolve: function () {
      return getApi();
    },
  };

  console.info("[CE Members] bridge ready", window.CEMembers.getInfo());
})();
