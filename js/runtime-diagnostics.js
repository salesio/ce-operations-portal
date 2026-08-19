/**
 * CE Operations Portal — Runtime Diagnostics Helper
 *
 * Provides safe, client-side inspection of runtime flags and data layer state
 * without exposing sensitive tokens, service keys, or backend secrets.
 */
(function () {
  const BUILD_VERSION = "2026.08.19-members-runtime-fix";
  const BUILD_TIMESTAMP = "2026-08-19T08:30:00.000Z";

  function readEnv(name) {
    try {
      if (typeof window !== "undefined" && window.__CE_ENV__ && window.__CE_ENV__[name] !== undefined) {
        return String(window.__CE_ENV__[name] || "").trim();
      }
    } catch (_) {}
    return "";
  }

  function flagTrue(name) {
    return /^(1|true|yes|on)$/i.test(readEnv(name));
  }

  function getRuntimeInfo() {
    const url = readEnv("VITE_SUPABASE_URL");
    const anonKey = readEnv("VITE_SUPABASE_ANON_KEY");
    const dataSource = readEnv("VITE_DATA_SOURCE") || "mock";
    const supabaseEnabled = flagTrue("VITE_ENABLE_SUPABASE");
    const realAuthEnabled = flagTrue("VITE_ENABLE_REAL_AUTH");
    const isUrlValid = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url);
    const isKeyValid = anonKey.length > 20 && !/placeholder|your-|example/i.test(anonKey);
    const supabaseConfigured = supabaseEnabled && isUrlValid && isKeyValid;

    let urlHost = null;
    try {
      if (typeof URL !== "undefined" && url && isUrlValid) {
        urlHost = new URL(url).hostname;
      } else if (url) {
        urlHost = url.replace(/^https?:\/\//i, "").split("/")[0];
      }
    } catch (_) {
      if (url) urlHost = url.replace(/^https?:\/\//i, "").split("/")[0];
    }

    return {
      environment: readEnv("VITE_APP_ENV") || (typeof location !== "undefined" && location.hostname.includes("github.io") ? "production" : "development"),
      dataSource: dataSource.toLowerCase(),
      supabaseEnabled,
      realAuthEnabled,
      supabaseConfigured,
      urlHost,
      buildVersion: BUILD_VERSION,
      buildTimestamp: BUILD_TIMESTAMP,
      authStatus: realAuthEnabled ? (supabaseConfigured ? "real_auth_ready" : "real_auth_missing_config") : "demo_mode",
    };
  }

  window.CERuntime = {
    getInfo: getRuntimeInfo,
    getVersion: function () {
      return BUILD_VERSION;
    },
  };

  console.info("[CE Runtime] Diagnostics initialized:", window.CERuntime.getInfo());
})();
