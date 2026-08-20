import https from "node:https";

function fetchUrl(targetUrl) {
  return new Promise((resolve, reject) => {
    https.get(targetUrl, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve({ statusCode: res.statusCode, headers: res.headers, body: data }));
      res.on("error", reject);
    });
  });
}

async function verifyLive() {
  console.log("\n=== Verifying Published Portal at https://salesio.github.io/ce-operations-portal/ ===");

  const page = await fetchUrl("https://salesio.github.io/ce-operations-portal/?t=" + Date.now());
  const config = await fetchUrl("https://salesio.github.io/ce-operations-portal/js/supabase-config.js?t=" + Date.now());

  console.log("1. HTML Verification:");
  const hasToggleBtn = page.body.includes('id="togglePasswordBtn"');
  const hasLoginSpinner = page.body.includes('id="loginSpinner"');
  const hasDemoQuickButtons = page.body.includes("Utilizadores Demo Rápido");
  const hasPrefilledEmail = page.body.includes('value="admin@ce-mozambique.org"');
  const hasPrefilledPassword = page.body.includes('value="demo"');
  const hasDemoModeBadge = page.body.includes('data-i18n="login.demoMode"');

  console.log("   - togglePasswordBtn present:", hasToggleBtn);
  console.log("   - loginSpinner present:", hasLoginSpinner);
  console.log("   - Demo Quick Buttons present:", hasDemoQuickButtons);
  console.log("   - Prefilled Email present:", hasPrefilledEmail);
  console.log("   - Prefilled Password present:", hasPrefilledPassword);
  console.log("   - Demo Mode Badge present:", hasDemoModeBadge);

  console.log("\n2. Runtime Config Verification:");
  const isSupabaseDataSource = config.body.includes('VITE_DATA_SOURCE: "supabase"');
  const isSupabaseEnabled = config.body.includes('VITE_ENABLE_SUPABASE: "true"');
  const isRealAuthEnabled = config.body.includes('VITE_ENABLE_REAL_AUTH: "true"');
  const hasSupabaseUrl = config.body.includes("https://kmurqbgpybrolrrumiue.supabase.co");
  const hasAnonKey = config.body.includes("sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli");

  console.log("   - VITE_DATA_SOURCE: supabase ->", isSupabaseDataSource);
  console.log("   - VITE_ENABLE_SUPABASE: true ->", isSupabaseEnabled);
  console.log("   - VITE_ENABLE_REAL_AUTH: true ->", isRealAuthEnabled);
  console.log("   - Supabase URL configured ->", hasSupabaseUrl);
  console.log("   - Supabase Anon Key configured ->", hasAnonKey);

  const allPassed =
    hasToggleBtn &&
    hasLoginSpinner &&
    !hasDemoQuickButtons &&
    !hasPrefilledEmail &&
    !hasPrefilledPassword &&
    !hasDemoModeBadge &&
    isSupabaseDataSource &&
    isSupabaseEnabled &&
    isRealAuthEnabled &&
    hasSupabaseUrl &&
    hasAnonKey;

  if (allPassed) {
    console.log("\n>>> ALL PUBLISHED RUNTIME VERIFICATIONS PASSED! <<<");
    process.exit(0);
  } else {
    console.error("\n>>> VERIFICATION FAILED! <<<");
    process.exit(1);
  }
}

verifyLive();
