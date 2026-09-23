/**
 * Media data bridge — dual-write / pure-JS localStorage fallback.
 * Keys: ce-data-layer:media-team | media-roles | media-services | media-schedules |
 *       media-channels | media-performance | media-awards
 * Never stores real stream keys.
 */
(function () {
  var KEYS = {
    team: "ce-data-layer:media-team",
    roles: "ce-data-layer:media-roles",
    services: "ce-data-layer:media-services",
    schedules: "ce-data-layer:media-schedules",
    channels: "ce-data-layer:media-channels",
    performance: "ce-data-layer:media-performance",
    awards: "ce-data-layer:media-awards",
  };
  var memory = {
    team: null,
    roles: null,
    services: null,
    schedules: null,
    channels: null,
    performance: null,
    awards: null,
  };

  var underlyingSupabaseApi = null;
  var rawExisting = window.CEMedia || (window.CEDataLayer && window.CEDataLayer.media);
  if (rawExisting && typeof rawExisting.dualWriteRecord !== "function") {
    underlyingSupabaseApi = rawExisting;
  }

  function resolveDataSource() {
    try {
      var runtime = window.__CE_ENV__ && window.__CE_ENV__.VITE_DATA_SOURCE;
      var fromBundle =
        window.CESupabase && typeof window.CESupabase.getDataSource === "function"
          ? window.CESupabase.getDataSource()
          : window.CEDataLayer && typeof window.CEDataLayer.getDataSource === "function"
            ? window.CEDataLayer.getDataSource()
            : "";
      var value = String(runtime || fromBundle || "supabase").trim().toLowerCase();
      if (value === "local" || value === "api" || value === "supabase" || value === "mock") return value;
    } catch (_) {}
    return "supabase";
  }

  function resolveApi() {
    if (underlyingSupabaseApi && typeof underlyingSupabaseApi.createMediaTeamMember === "function") {
      return { api: underlyingSupabaseApi, via: "underlyingSupabaseApi" };
    }
    if (window.CESupabase && typeof window.CESupabase.createMediaTeamMember === "function") {
      return { api: window.CESupabase, via: "CESupabase" };
    }
    var layer = window.CEDataLayer && window.CEDataLayer.media;
    if (layer && typeof layer.createMediaTeamMember === "function" && typeof layer.dualWriteRecord !== "function") {
      return { api: layer, via: "CEDataLayer.media" };
    }
    if (window.CEMedia && typeof window.CEMedia.createMediaTeamMember === "function" && typeof window.CEMedia.dualWriteRecord !== "function") {
      return { api: window.CEMedia, via: "CEMedia" };
    }
    return { api: null, via: "none" };
  }

  function load(key) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(function (r) {
        return Boolean(r && r.id);
      });
    } catch (_) {
      return [];
    }
  }

  function save(key, rows) {
    try {
      localStorage.setItem(key, JSON.stringify(rows));
    } catch (e) {
      console.warn("[CE Media] persist failed", key, e);
    }
  }

  function seedFor(kind) {
    var S = window.CESupabase || {};
    if (kind === "team") return S.MEDIA_TEAM_SEED || [];
    if (kind === "roles") return S.MEDIA_ROLES_SEED || [];
    if (kind === "services") return S.MEDIA_SERVICES_SEED || [];
    if (kind === "schedules") return S.MEDIA_SCHEDULES_SEED || [];
    if (kind === "channels") return S.MEDIA_CHANNELS_SEED || [];
    if (kind === "performance") return S.MEDIA_PERFORMANCE_SEED || [];
    if (kind === "awards") return S.MEDIA_AWARDS_SEED || [];
    return [];
  }

  function store(kind) {
    var key = KEYS[kind];
    var raw = null;
    try {
      raw = localStorage.getItem(key);
    } catch (e) {}
    var rows;
    if (raw === null) {
      rows = seedFor(kind).map(function (s) {
        return Object.assign({}, s);
      });
      save(key, rows);
    } else {
      try {
        rows = JSON.parse(raw);
        if (!Array.isArray(rows)) rows = [];
      } catch (e) {
        rows = [];
      }
    }
    return { rows: rows, persist: true };
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
      delete row.stream_key;
      delete row.streamKey;
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
      delete next.stream_key;
      delete next.streamKey;
      s.rows[i] = next;
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
      listMediaTeam: function () {
        return list("team");
      },
      createMediaTeamMember: function (p) {
        return create("team", "mt-", p);
      },
      updateMediaTeamMember: function (id, p) {
        return update("team", id, p);
      },
      deleteMediaTeamMember: function (id) {
        return remove("team", id);
      },
      listMediaRoles: function () {
        return list("roles");
      },
      createMediaRole: function (p) {
        return create("roles", "mr-", p);
      },
      updateMediaRole: function (id, p) {
        return update("roles", id, p);
      },
      deleteMediaRole: function (id) {
        return remove("roles", id);
      },
      listMediaServices: function () {
        return list("services");
      },
      createMediaService: function (p) {
        return create("services", "ms-", p);
      },
      updateMediaService: function (id, p) {
        return update("services", id, p);
      },
      deleteMediaService: function (id) {
        return remove("services", id);
      },
      listMediaSchedules: function () {
        return list("schedules");
      },
      createMediaSchedule: function (p) {
        return create("schedules", "sch-", p);
      },
      updateMediaSchedule: function (id, p) {
        return update("schedules", id, p);
      },
      deleteMediaSchedule: function (id) {
        return remove("schedules", id);
      },
      confirmScheduleAssignment: function (id, payload) {
        return update("schedules", id, { status: "Confirmed" });
      },
      markCheckIn: function (id, payload) {
        return update("schedules", id, {
          status: "Confirmed",
          check_in_time: (payload && payload.check_in_time) || new Date().toISOString().slice(11, 16),
        });
      },
      markCheckOut: function (id, payload) {
        return update("schedules", id, {
          status: "Completed",
          check_out_time: (payload && payload.check_out_time) || new Date().toISOString().slice(11, 16),
        });
      },
      markAbsent: function (id, payload) {
        return update("schedules", id, { status: "No Show" });
      },
      getTodaySchedules: function () {
        var today = new Date().toISOString().slice(0, 10);
        return ok(
          store("schedules").rows.filter(function (r) {
            return String(r.service_date || r.date || "").slice(0, 10) === today;
          }),
        );
      },
      getUpcomingSchedules: function () {
        var today = new Date().toISOString().slice(0, 10);
        return ok(
          store("schedules").rows.filter(function (r) {
            return String(r.service_date || r.date || "") >= today;
          }),
        );
      },
      listMediaChannels: function () {
        return list("channels");
      },
      createMediaChannel: function (p) {
        return create("channels", "mc-", p);
      },
      updateMediaChannel: function (id, p) {
        return update("channels", id, p);
      },
      deleteMediaChannel: function (id) {
        return remove("channels", id);
      },
      listMediaPerformanceReviews: function () {
        return list("performance");
      },
      createMediaPerformanceReview: function (p) {
        var scores = [
          Number(p && p.punctuality_score) || 0,
          Number(p && p.technical_quality_score) || 0,
          Number(p && p.teamwork_score) || 0,
          Number(p && p.responsibility_score) || 0,
          Number(p && p.problem_solving_score) || 0,
          Number(p && p.spiritual_attitude_score) || 0,
        ].filter(function (n) {
          return n > 0;
        });
        var overall =
          scores.length > 0
            ? Math.round((scores.reduce(function (a, b) {
                return a + b;
              }, 0) /
                scores.length) *
                10) / 10
            : 0;
        return create(
          "performance",
          "mev-",
          Object.assign({}, p, { overall_score: overall, score: overall }),
        );
      },
      updateMediaPerformanceReview: function (id, p) {
        return update("performance", id, p);
      },
      deleteMediaPerformanceReview: function (id) {
        return remove("performance", id);
      },
      getPendingMediaPerformanceReviews: function () {
        return ok(
          store("performance").rows.filter(function (r) {
            return /pending|draft|pendente/i.test(String(r.status || "")) || !r.evaluated_at;
          }),
        );
      },
      listMediaAwards: function () {
        return list("awards");
      },
      createMediaAward: function (p) {
        return create("awards", "maw-", p);
      },
      updateMediaAward: function (id, p) {
        return update("awards", id, p);
      },
      deleteMediaAward: function (id) {
        return remove("awards", id);
      },
      calculateAwardCandidates: function (year) {
        return ok([]);
      },
      getMediaOverviewStats: function () {
        return ok({
          totalTeam: store("team").rows.length,
          activeTeam: store("team").rows.filter(function (t) {
            return /activo|active/i.test(String(t.status || ""));
          }).length,
          todaySchedules: pure().getTodaySchedules().data.length,
          pendingEvaluations: pure().getPendingMediaPerformanceReviews().data.length,
          activeChannels: store("channels").rows.length,
          awards: store("awards").rows.length,
        });
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
      console.warn("[CE Media] call failed", method, error);
      if (typeof fallback[method] === "function") return fallback[method].apply(fallback, args || []);
      return fail(error && error.message);
    }
  }

  var methods = [
    "listMediaTeam",
    "createMediaTeamMember",
    "updateMediaTeamMember",
    "deleteMediaTeamMember",
    "listMediaRoles",
    "createMediaRole",
    "updateMediaRole",
    "deleteMediaRole",
    "listMediaServices",
    "createMediaService",
    "updateMediaService",
    "deleteMediaService",
    "listMediaSchedules",
    "createMediaSchedule",
    "updateMediaSchedule",
    "deleteMediaSchedule",
    "confirmScheduleAssignment",
    "markCheckIn",
    "markCheckOut",
    "markAbsent",
    "getTodaySchedules",
    "getUpcomingSchedules",
    "listMediaChannels",
    "createMediaChannel",
    "updateMediaChannel",
    "deleteMediaChannel",
    "listMediaPerformanceReviews",
    "createMediaPerformanceReview",
    "updateMediaPerformanceReview",
    "deleteMediaPerformanceReview",
    "getPendingMediaPerformanceReviews",
    "listMediaAwards",
    "createMediaAward",
    "updateMediaAward",
    "deleteMediaAward",
    "calculateAwardCandidates",
    "getMediaOverviewStats",
    "getInfo",
  ];

  var pureStore = {
    teamMembers: [],
    roles: [],
    services: [],
    schedules: [],
    channels: [],
    performanceReviews: [],
    awards: [],
  };

  var dataApi = {
    pure: function () {
      return {
        load: function () { return pureStore; },
        getMediaRoles: function () { return pureStore.roles; },
        saveMediaRole: function (r) {
          var idx = pureStore.roles.findIndex(function (item) { return item.id === r.id; });
          if (idx >= 0) pureStore.roles[idx] = r; else pureStore.roles.push(r);
        },
        deleteMediaRole: function (id) {
          pureStore.roles = pureStore.roles.filter(function (item) { return item.id !== id; });
        },
      };
    },
    dualWriteRecord: function (kind, mode, record) {
      if (!record) return Promise.resolve({ ok: true, skipped: true });
      var map = {
        mediaTechnician: { create: "createMediaTeamMember", update: "updateMediaTeamMember", delete: "deleteMediaTeamMember" },
        mediaRole: { create: "createMediaRole", update: "updateMediaRole", delete: "deleteMediaRole" },
        mediaService: { create: "createMediaService", update: "updateMediaService", delete: "deleteMediaService" },
        mediaSchedule: { create: "createMediaSchedule", update: "updateMediaSchedule", delete: "deleteMediaSchedule" },
        streamingChannel: { create: "createMediaChannel", update: "updateMediaChannel", delete: "deleteMediaChannel" },
        mediaEvaluation: {
          create: "createMediaPerformanceReview",
          update: "updateMediaPerformanceReview",
          delete: "deleteMediaPerformanceReview",
        },
        mediaAward: { create: "createMediaAward", update: "updateMediaAward", delete: "deleteMediaAward" },
      };
      var entry = map[kind];
      if (!entry) return Promise.resolve({ ok: true, skipped: true });
      if (mode === "create") return call(entry.create, [record]);
      if (mode === "update") return call(entry.update, [record.id, record]);
      if (mode === "delete") return call(entry.delete, [record.id]);
      return Promise.resolve({ ok: true, skipped: true });
    },
  };
  methods.forEach(function (m) {
    dataApi[m] = function () {
      return call(m, Array.prototype.slice.call(arguments));
    };
  });

  var aliases = [
    { get: "getMediaTeamMembers", save: "saveMediaTeamMember", list: "listMediaTeam", create: "createMediaTeamMember", update: "updateMediaTeamMember" },
    { get: "getMediaRoles", save: "saveMediaRole", list: "listMediaRoles", create: "createMediaRole", update: "updateMediaRole" },
    { get: "getMediaServices", save: "saveMediaService", list: "listMediaServices", create: "createMediaService", update: "updateMediaService" },
    { get: "getMediaSchedules", save: "saveMediaSchedule", list: "listMediaSchedules", create: "createMediaSchedule", update: "updateMediaSchedule" },
    { get: "getMediaChannels", save: "saveMediaChannel", list: "listMediaChannels", create: "createMediaChannel", update: "updateMediaChannel" },
    { get: "getMediaPerformanceReviews", save: "saveMediaPerformanceReview", list: "listMediaPerformanceReviews", create: "createMediaPerformanceReview", update: "updateMediaPerformanceReview" },
    { get: "getMediaAwards", save: "saveMediaAward", list: "listMediaAwards", create: "createMediaAward", update: "updateMediaAward" },
  ];
  aliases.forEach(function (a) {
    dataApi[a.get] = function () { return call(a.list, Array.prototype.slice.call(arguments)); };
    dataApi[a.save] = function (rec) {
      if (rec && rec.id) return call(a.update, [rec.id, rec]);
      return call(a.create, [rec]);
    };
  });

  dataApi.deleteTechnician = function (id) { return call("deleteMediaTeamMember", [id]); };
  dataApi.deleteRole = function (id) { return call("deleteMediaRole", [id]); };
  dataApi.deleteService = function (id) { return call("deleteMediaService", [id]); };
  dataApi.deleteSchedule = function (id) { return call("deleteMediaSchedule", [id]); };
  dataApi.deleteStreamingChannel = function (id) { return call("deleteMediaChannel", [id]); };
  dataApi.deleteEvaluation = function (id) { return call("deleteMediaPerformanceReview", [id]); };
  dataApi.deleteAward = function (id) { return call("deleteMediaAward", [id]); };

  window.CEMedia = Object.assign({}, window.CEMedia || {}, dataApi);
  window.CEDataLayer = window.CEDataLayer || {};
  if (!window.CEDataLayer.media) window.CEDataLayer.media = dataApi;
  if (!window.CEDataLayer.mediaTeam) {
    window.CEDataLayer.mediaTeam = {
      listMediaTeam: dataApi.listMediaTeam,
      createMediaTeamMember: dataApi.createMediaTeamMember,
      updateMediaTeamMember: dataApi.updateMediaTeamMember,
      deleteMediaTeamMember: dataApi.deleteMediaTeamMember,
      deleteTechnician: dataApi.deleteTechnician,
    };
  }

  try {
    console.info("[CE Media] bridge ready", dataApi.getInfo());
  } catch (_) {}
})();
