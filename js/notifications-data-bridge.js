/**
 * Notifications data bridge — dual-write / pure-JS localStorage fallback.
 * Keys: ce-data-layer:notifications | notification-templates
 * Also exposes window.CENotifications.notify(eventType, payload)
 * and window.recordAuditLog(action, payload) fallback helper.
 */
(function () {
  var KEYS = {
    notifications: "ce-data-layer:notifications",
    templates: "ce-data-layer:notification-templates",
    preferences: "ce-data-layer:notification-preferences",
  };
  var memory = { notifications: null, templates: null, preferences: null };

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

    function getSupabase() {
    try {
      if (typeof window !== "undefined") {
        if (window.supabaseClient) return window.supabaseClient;
        if (typeof window.CESupabase?.getSupabaseClient === "function") {
          var c = window.CESupabase.getSupabaseClient();
          if (c) {
            window.supabaseClient = c;
            return c;
          }
        }
        if (window.CESupabase?.client) return window.CESupabase.client;
        if (window.supabase && typeof window.supabase.createClient === "function") {
          var env = window.__CE_ENV__ || {};
          var url = env.VITE_SUPABASE_URL || "https://api.embaixadadecristo.org";
          var key = env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzkxNDU0ODUzLCJleHAiOjIxMDY4MTQ4NTN9.xMLsM1EBKV-hJCWRsYjpXP91ESaq5Msns9FawCVMJh0";
          var cl = window.supabase.createClient(url, key);
          window.supabaseClient = cl;
          return cl;
        }
      }
    } catch (_) {}
    return null;
  }

  function resolveApi() {
    var layer = window.CEDataLayer && window.CEDataLayer.notifications;
    // `dataApi` is the local fallback exposed by this bridge. Resolving it as
    // an external API would make every method call back into `call()` forever.
    if (layer && layer !== dataApi && typeof layer.createNotification === "function") {
      return { api: layer, via: "CEDataLayer.notifications" };
    }
    if (window.CESupabase && typeof window.CESupabase.createNotification === "function") {
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
      console.warn("[CE Notifications] persist failed", key, e);
    }
  }

  function seedFor(kind) {
    var S = window.CESupabase || {};
    if (kind === "notifications") return S.NOTIFICATIONS_SEED || [];
    if (kind === "templates") return S.NOTIFICATION_TEMPLATES_SEED || [];
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
  function now() {
    return new Date().toISOString();
  }

  function fillTemplate(template, vars) {
    return String(template || "").replace(/\{\{(\w+)\}\}/g, function (_, key) {
      return String((vars && vars[key]) != null ? vars[key] : "");
    });
  }

  function pure() {
    function list(kind) {
      return ok(store(kind).rows.slice());
    }
    function create(kind, idPrefix, payload) {
      var s = store(kind);
      var row = Object.assign({}, payload, {
        id: (payload && payload.id) || idPrefix + Date.now(),
        created_at: (payload && payload.created_at) || now(),
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

    return {
      listNotifications: function () {
        return list("notifications");
      },
      createNotification: function (p) {
        var inferredScope = (p && p.scope) || (
          (p && p.recipient_user_id) ? "user" :
          (p && p.recipient_role) ? "role" :
          (p && p.recipient_department_id) ? "department" :
          (p && p.recipient_church_id) ? "church" : "national"
        );
        return create(
          "notifications",
          "not-",
          Object.assign(
            {
              type: "info",
              priority: "normal",
              is_read: false,
              is_archived: false,
            },
            p || {},
            { scope: inferredScope },
          ),
        );
      },
      updateNotification: function (id, p) {
        return update("notifications", id, p);
      },
      deleteNotification: function (id) {
        var s = store("notifications");
        s.rows = s.rows.filter(function (r) {
          return r.id !== id;
        });
        if (s.persist) save(KEYS.notifications, s.rows);
        return ok(true);
      },
      getNotificationsByUser: function (userId, userObj) {
        var targetUser = userObj || (typeof window !== "undefined" && window.activeUser && (!userId || window.activeUser.id === userId) ? window.activeUser : null);
        return ok(
          store("notifications").rows.filter(function (n) {
            // Never return notifications explicitly addressed to another user
            if (n.recipient_user_id && userId && String(n.recipient_user_id) !== String(userId)) {
              return false;
            }
            if (typeof window !== "undefined" && typeof window.notificationMatchesUser === "function" && targetUser) {
              return window.notificationMatchesUser(n, targetUser);
            }
            if (n.recipient_user_id && userId && String(n.recipient_user_id) === String(userId)) {
              return true;
            }
            if (n.scope === "user") {
              return false;
            }
            return (
              n.scope === "national" ||
              n.scope === "all"
            );
          }),
        );
      },
      getUnreadNotifications: function (userId) {
        return ok(
          pure()
            .getNotificationsByUser(userId)
            .data.filter(function (n) {
              return !n.is_read && !n.is_archived;
            }),
        );
      },
      getUnreadCountForUser: function (userId) {
        return ok(pure().getUnreadNotifications(userId).data.length);
      },
      getCriticalNotifications: function (userId) {
        return ok(
          pure()
            .getNotificationsByUser(userId)
            .data.filter(function (n) {
              return !n.is_read && /urgent|critical|high/i.test(String(n.priority || ""));
            }),
        );
      },
      getTodayNotifications: function (userId) {
        var today = new Date().toISOString().slice(0, 10);
        return ok(
          pure()
            .getNotificationsByUser(userId)
            .data.filter(function (n) {
              return String(n.created_at || "").startsWith(today);
            }),
        );
      },
      markNotificationAsRead: function (id) {
        return update("notifications", id, { is_read: true, read_at: now() });
      },
      markNotificationAsUnread: function (id) {
        return update("notifications", id, { is_read: false, read_at: "" });
      },
      markAllNotificationsAsRead: function (userId) {
        var unread = pure().getUnreadNotifications(userId).data;
        unread.forEach(function (n) {
          pure().markNotificationAsRead(n.id);
        });
        return ok(unread.length);
      },
      archiveNotification: function (id) {
        return update("notifications", id, { is_archived: true, archived_at: now() });
      },
      listNotificationTemplates: function () {
        return list("templates");
      },
      createNotificationTemplate: function (p) {
        return create("templates", "ntpl-", Object.assign({ is_active: true }, p || {}));
      },
      updateNotificationTemplate: function (id, p) {
        return update("templates", id, p);
      },
      notify: function (eventType, payload) {
        payload = payload || {};
        var tpl = store("templates").rows.find(function (t) {
          return t.event_type === eventType && t.is_active !== false;
        });
        var vars = payload.vars || payload;
        var title = tpl
          ? fillTemplate(tpl.title_template_pt || eventType, vars)
          : payload.title || eventType;
        var message = tpl
          ? fillTemplate(tpl.message_template_pt || "", vars)
          : payload.message || "";
        var inferredScope = payload.scope || (
          payload.recipient_user_id ? "user" :
          (payload.recipient_role || payload.role) ? "role" :
          payload.recipient_department_id ? "department" :
          payload.recipient_church_id ? "church" :
          (tpl && tpl.recipient_strategy) || "role"
        );
        return pure().createNotification({
          title: title,
          message: message,
          type: payload.type || (tpl && tpl.default_type) || "info",
          module: payload.module || (tpl && tpl.module) || "system",
          priority: payload.priority || (tpl && tpl.default_priority) || "normal",
          scope: inferredScope,
          recipient_user_id: payload.recipient_user_id || "",
          recipient_role: payload.recipient_role || payload.role || "",
          recipient_department_id: payload.recipient_department_id || "",
          recipient_church_id: payload.recipient_church_id || "",
          action_url: payload.action_url || "",
          action_label: payload.action_label || "Ver",
          entity_type: payload.entity_type || "",
          entity_id: payload.entity_id || "",
          metadata: payload.metadata || vars,
        });
      },
      getNotificationOverviewStats: function () {
        var rows = store("notifications").rows;
        return ok({
          total: rows.length,
          unread: rows.filter(function (n) {
            return !n.is_read;
          }).length,
          urgent: rows.filter(function (n) {
            return /urgent|critical/i.test(String(n.priority || n.type || ""));
          }).length,
          actionRequired: rows.filter(function (n) {
            return /action_required|approval_required/i.test(String(n.type || ""));
          }).length,
        });
      },
      ensureNotificationsSeeded: function () {
        store("notifications");
        store("templates");
        store("preferences");
        return ok(true);
      },
      listNotificationPreferences: function () {
        return list("preferences");
      },
      getNotificationPreferencesByUser: function (userId) {
        var rows = store("preferences").rows.filter(function (p) {
          return String(p.user_id) === String(userId);
        });
        return ok(rows);
      },
      upsertNotificationPreference: function (p) {
        p = p || {};
        var s = store("preferences");
        var idx = s.rows.findIndex(function (r) {
          return String(r.user_id) === String(p.user_id) && (p.module_key ? r.module_key === p.module_key : true);
        });
        if (idx >= 0) {
          s.rows[idx] = Object.assign({}, s.rows[idx], p, { updated_at: now() });
          if (s.persist) save(KEYS.preferences, s.rows);
          return ok(s.rows[idx]);
        }
        return create("preferences", "pref-", Object.assign({ in_app_enabled: true, push_enabled: false, frequency: "Immediate" }, p));
      },
      updateNotificationPreference: function (id, p) {
        return update("preferences", id, p);
      },
      getNotificationsDataSourceInfo: function () {
        return {
          source: resolveDataSource(),
          provider: resolveDataSource() === "local" ? "local-bridge" : "mock-bridge",
          ready: true,
          domain: "notifications",
        };
      },
      getInfo: function () {
        return pure().getNotificationsDataSourceInfo();
      },
    };
  }

  function wrapPromise(value) {
    return Promise.resolve(value);
  }

  function call(method, args) {
    var resolved = resolveApi();
    var apiFn = null;
    if (resolved.api) {
      apiFn = resolved.api[method];
      if (!apiFn && method === "markNotificationAsRead") apiFn = resolved.api.markNotificationRead;
      if (!apiFn && method === "markNotificationRead") apiFn = resolved.api.markNotificationAsRead;
    }
    if (typeof apiFn === "function") {
      try {
        var result = apiFn.apply(resolved.api, args || []);
        if (result && typeof result.then === "function") return result;
        return wrapPromise(result);
      } catch (e) {
        console.warn("[CE Notifications] API failed, fallback", method, e);
      }
    }

    var fallback = pure();
    var fallbackFn = fallback[method];
    if (!fallbackFn && method === "markNotificationRead") fallbackFn = fallback.markNotificationAsRead;

    // Remote Supabase integration for listNotifications
    if (method === "listNotifications") {
      var sb = getSupabase();
      if (sb && typeof sb.from === "function") {
        return sb.from("notifications").select("*").order("created_at", { ascending: false }).limit(60)
          .then(function (res) {
            if (res && !res.error && Array.isArray(res.data) && res.data.length) {
              var s = store("notifications");
              var remoteIds = new Set(res.data.map(function (r) { return String(r.id); }));
              var localOnly = (s.rows || []).filter(function (r) { return !remoteIds.has(String(r.id)); });
              s.rows = res.data.concat(localOnly);
              if (s.persist) save(KEYS.notifications, s.rows);
              return ok(s.rows);
            }
            return fallbackFn ? wrapPromise(fallbackFn.apply(fallback, args || [])) : ok([]);
          })
          .catch(function (e) {
            console.warn("[CE Notifications] remote list failed, using fallback", e);
            return fallbackFn ? wrapPromise(fallbackFn.apply(fallback, args || [])) : ok([]);
          });
      }
    }

    // Remote Supabase update for markNotificationAsRead
    if ((method === "markNotificationAsRead" || method === "markNotificationRead") && args && args[0]) {
      var notifId = args[0];
      var sbMark = getSupabase();
      if (sbMark && typeof sbMark.from === "function" && String(notifId).includes("-")) {
        try {
          sbMark.from("notifications").update({ is_read: true, read_at: new Date().toISOString() }).eq("id", notifId).then(function () {}).catch(function () {});
        } catch (_) {}
      }
    }

    // Remote Supabase insert for createNotification
    if (method === "createNotification" && args && args[0]) {
      var sbInsert = getSupabase();
      if (sbInsert && typeof sbInsert.from === "function") {
        try {
          var payload = args[0];
          var inferredScope = payload.scope || (
            payload.recipient_user_id ? "user" :
            payload.recipient_role ? "role" :
            payload.recipient_department_id ? "department" :
            payload.recipient_church_id ? "church" : "national"
          );
          var dbRow = {
            title: payload.title || "Notificação",
            message: payload.message || payload.body || "",
            type: payload.priority === "urgent" || payload.type === "urgent" ? "urgent" : (payload.type || "info"),
            module: payload.module || "system",
            entity_type: payload.entity_type || "",
            entity_id: String(payload.entity_id || ""),
            priority: payload.priority || "normal",
            recipient_user_id: payload.recipient_user_id || null,
            recipient_role: payload.recipient_role || null,
            recipient_department_id: payload.recipient_department_id || null,
            recipient_church_id: payload.recipient_church_id || null,
            scope: inferredScope,
            action_url: payload.action_url || "",
            action_label: payload.action_label || "",
            is_read: false,
            metadata: payload.metadata || {}
          };
          sbInsert.from("notifications").insert([dbRow]).then(function () {}).catch(function () {});
        } catch (_) {}
      }
    }

    if (typeof fallbackFn === "function") {
      try {
        return wrapPromise(fallbackFn.apply(fallback, args || []));
      } catch (e2) {
        return wrapPromise(fail(e2 && e2.message ? e2.message : "fallback error"));
      }
    }
    return wrapPromise(fail("Method not available: " + method, "NOT_IMPLEMENTED"));
  }

  var methods = [
    "listNotifications",
    "createNotification",
    "updateNotification",
    "deleteNotification",
    "getNotificationsByUser",
    "getUnreadNotifications",
    "getUnreadCountForUser",
    "getCriticalNotifications",
    "getTodayNotifications",
    "markNotificationAsRead",
    "markNotificationRead",
    "markNotificationAsUnread",
    "markAllNotificationsAsRead",
    "archiveNotification",
    "listNotificationTemplates",
    "createNotificationTemplate",
    "updateNotificationTemplate",
    "listNotificationPreferences",
    "getNotificationPreferencesByUser",
    "upsertNotificationPreference",
    "updateNotificationPreference",
    "notify",
    "getNotificationOverviewStats",
    "ensureNotificationsSeeded",
    "getNotificationsDataSourceInfo",
    "getInfo",
  ];

  var dataApi = {};
  methods.forEach(function (m) {
    dataApi[m] = function () {
      return call(m, Array.prototype.slice.call(arguments));
    };
  });

  // Native Browser Notification Helpers
  function getBrowserPermission() {
    if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
    return Notification.permission; // "default", "granted", "denied"
  }

  function requestBrowserPermission() {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return Promise.resolve({ ok: false, permission: "unsupported", message: "Browser does not support notifications" });
    }
    return Notification.requestPermission().then(function (perm) {
      try {
        localStorage.setItem("ce-notification-permission", perm);
        localStorage.setItem("ce-notifications-prompted", perm === "granted" ? "granted" : "denied");
      } catch (_) {}
      return { ok: perm === "granted", permission: perm };
    });
  }

  function sendBrowserNotification(title, options) {
    if (typeof window === "undefined" || !("Notification" in window)) return false;
    if (Notification.permission !== "granted") return false;
    var notifOptions = Object.assign({
      icon: "assets/logo-ce.png",
      badge: "assets/logo-ce.png",
      vibrate: [200, 100, 200]
    }, options || {});

    // On mobile devices, registration.showNotification is required for PWA push
    try {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.ready.then(function (reg) {
          if (reg && typeof reg.showNotification === "function") {
            reg.showNotification(title || "Embaixada de Cristo", notifOptions);
          } else {
            new Notification(title || "Embaixada de Cristo", notifOptions);
          }
        }).catch(function () {
          try { new Notification(title || "Embaixada de Cristo", notifOptions); } catch (_) {}
        });
        return true;
      }
    } catch (_) {}

    try {
      return new Notification(title || "Embaixada de Cristo", notifOptions);
    } catch (e) {
      console.warn("[CE Notifications] browser notification error", e);
      return false;
    }
  }

  dataApi.getBrowserPermission = getBrowserPermission;
  dataApi.requestBrowserPermission = requestBrowserPermission;
  dataApi.sendBrowserNotification = sendBrowserNotification;

  window.CENotifications = Object.assign({}, window.CENotifications || {}, dataApi);
  window.CEDataLayer = window.CEDataLayer || {};
  if (!window.CEDataLayer.notifications) window.CEDataLayer.notifications = dataApi;

  // Global helpers (safe fallbacks)
  if (!window.createSystemNotification) {
    window.createSystemNotification = function (eventType, payload) {
      return dataApi.notify(eventType, payload || {});
    };
  }
  if (!window.recordAuditLog) {
    window.recordAuditLog = function (action, payload) {
      try {
        var ac = window.CEAccessControlData || window.CEAccessControl || window.CEDataLayer?.accessControl;
        if (ac && typeof ac.createAuditLog === "function") {
          void ac.createAuditLog(
            Object.assign(
              {
                action: action,
                module: (payload && payload.module) || "system",
                severity: (payload && payload.severity) || "info",
                created_at: new Date().toISOString(),
              },
              payload || {},
            ),
          );
        }
      } catch (_) {}
    };
  }

  try {
    console.info("[CE Notifications] bridge ready", dataApi.getInfo());
  } catch (_) {}
})();
