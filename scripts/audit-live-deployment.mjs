import crypto from "node:crypto";
import fs from "node:fs";

async function audit() {
  console.log("=== AUDITING LIVE DEPLOYMENT ON GITHUB PAGES ===");
  const liveUrl = "https://salesio.github.io/ce-operations-portal/";
  
  // 1. Fetch live index.html
  console.log("\n1. Fetching live index.html with cache: no-store...");
  const indexRes = await fetch(liveUrl + "index.html?t=" + Date.now(), { cache: "no-store" });
  console.log("   - index.html HTTP Status:", indexRes.status);
  const indexHtml = await indexRes.text();
  
  // Extract script tags
  const bundleScriptMatch = indexHtml.match(/src=["'](js\/supabase-bundle\.js[^"']*)["']/i);
  const bridgeScriptMatch = indexHtml.match(/src=["'](js\/members-data-bridge\.js[^"']*)["']/i);
  console.log("   - Live supabase-bundle script tag:", bundleScriptMatch ? bundleScriptMatch[1] : "NOT FOUND");
  console.log("   - Live members-data-bridge script tag:", bridgeScriptMatch ? bridgeScriptMatch[1] : "NOT FOUND");

  // 2. Fetch live supabase-bundle.js
  const liveBundleUrl = liveUrl + (bundleScriptMatch ? bundleScriptMatch[1] : "js/supabase-bundle.js");
  console.log("\n2. Fetching live bundle:", liveBundleUrl);
  const bundleRes = await fetch(liveBundleUrl + (liveBundleUrl.includes("?") ? "&" : "?") + "t=" + Date.now(), { cache: "no-store" });
  console.log("   - Bundle HTTP Status:", bundleRes.status);
  const liveBundleCode = await bundleRes.text();
  
  const liveBundleHash = crypto.createHash("sha256").update(liveBundleCode).digest("hex");
  console.log("   - Live Bundle SHA-256:", liveBundleHash);
  console.log("   - Live Bundle Length:", liveBundleCode.length);
  console.log("   - Live Bundle contains AUTH_NO_SESSION:", liveBundleCode.includes("AUTH_NO_SESSION"));
  console.log("   - Live Bundle contains 2026.08.21-jwt-propagation-fix:", liveBundleCode.includes("2026.08.21-jwt-propagation-fix"));
  console.log("   - Live Bundle contains 2026.08.19-members-runtime-fix:", liveBundleCode.includes("2026.08.19-members-runtime-fix"));

  // 3. Compare with local bundle
  const localBundleCode = fs.readFileSync("js/supabase-bundle.js", "utf8");
  const localBundleHash = crypto.createHash("sha256").update(localBundleCode).digest("hex");
  console.log("\n3. Local Bundle Comparison:");
  console.log("   - Local Bundle SHA-256:", localBundleHash);
  console.log("   - Local Bundle Length:", localBundleCode.length);
  console.log("   - Hashes Match:", localBundleHash === liveBundleHash);

  // 4. Fetch live members-data-bridge.js
  const liveBridgeUrl = liveUrl + (bridgeScriptMatch ? bridgeScriptMatch[1] : "js/members-data-bridge.js");
  console.log("\n4. Fetching live members-data-bridge:", liveBridgeUrl);
  const bridgeRes = await fetch(liveBridgeUrl + (liveBridgeUrl.includes("?") ? "&" : "?") + "t=" + Date.now(), { cache: "no-store" });
  const liveBridgeCode = await bridgeRes.text();
  const liveBridgeHash = crypto.createHash("sha256").update(liveBridgeCode).digest("hex");
  console.log("   - Live Bridge SHA-256:", liveBridgeHash);
  console.log("   - Live Bridge contains 2026.08.21-jwt-propagation-fix:", liveBridgeCode.includes("2026.08.21-jwt-propagation-fix"));
  console.log("   - Live Bridge contains 2026.08.19-members-runtime-fix:", liveBridgeCode.includes("2026.08.19-members-runtime-fix"));
}

audit().catch(console.error);
