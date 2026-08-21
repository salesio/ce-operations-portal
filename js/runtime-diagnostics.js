/**
 * CE Operations Portal — Runtime Diagnostics Helper
 *
 * Provides safe, client-side inspection of runtime flags and data layer state
 * without exposing sensitive tokens, service keys, or backend secrets.
 */
(function () {
  const BUILD_VERSION = "2026.08.21-profile-write-guard";
  const BUILD_TIMESTAMP = "2026-08-21T12:00:00.000Z";

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
    const url = readEnv("VITE_SUPABASE_URL") || "https://kmurqbgpybrolrrumiue.supabase.co";
    const anonKey = readEnv("VITE_SUPABASE_ANON_KEY") || "sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli";
    const dataSource = readEnv("VITE_DATA_SOURCE") || "supabase";
    const supabaseEnabled = flagTrue("VITE_ENABLE_SUPABASE") || dataSource === "supabase";
    const rawRealAuth = readEnv("VITE_ENABLE_REAL_AUTH");
    const realAuthEnabled = rawRealAuth !== "" ? flagTrue("VITE_ENABLE_REAL_AUTH") : supabaseEnabled;
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

    const authInfo = typeof window !== "undefined" && window.CEAuth?.getAuthInfo ? window.CEAuth.getAuthInfo() : null;
    const activeU = typeof window !== "undefined" ? (window.activeUser || null) : null;
    const membersDiag = typeof window !== "undefined" && window.CEMembers?.getInfo ? window.CEMembers.getInfo() : null;

    const authUserId = authInfo?.authUserId || activeU?.auth_user_id || null;
    const internalUserId = activeU?.id || authInfo?.appUserId || null;
    const internalRole = activeU?.role || activeU?.role_name || authInfo?.role || null;
    const internalStatus = activeU?.status || (internalUserId ? "Active" : null);

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
      authSessionPresent: Boolean(authInfo?.authenticated || activeU || authUserId),
      authUserId: authUserId,
      internalUserPresent: Boolean(internalUserId),
      internalUserStatus: internalStatus,
      role: internalRole,
      fallbackUsed: Boolean(membersDiag?.fallbackUsed),
      membersRowsReturned: Number(membersDiag?.lastRowsReturned || 0),
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
