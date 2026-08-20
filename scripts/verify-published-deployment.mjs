import https from "node:https";

const url = "https://salesio.github.io/ce-operations-portal/?t=" + Date.now();

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

async function checkDeployment() {
  console.log("Checking published deployment at:", url);
  const res = await fetchUrl(url);
  console.log("HTTP status:", res.statusCode);

  const hasTogglePassword = res.body.includes("togglePasswordBtn");
  const hasLoginSpinner = res.body.includes("loginSpinner");
  const hasDemoButtons = res.body.includes("Utilizadores Demo Rápido");
  const hasPrefilledAdmin = res.body.includes('value="admin@ce-mozambique.org"');

  console.log("Deployment inspection:");
  console.log("  - has togglePasswordBtn:", hasTogglePassword);
  console.log("  - has loginSpinner:", hasLoginSpinner);
  console.log("  - has demo quick buttons:", hasDemoButtons);
  console.log("  - has prefilled credentials:", hasPrefilledAdmin);

  if (hasTogglePassword && hasLoginSpinner && !hasDemoButtons && !hasPrefilledAdmin) {
    console.log("\n>>> NEW DEPLOYMENT IS LIVE! <<<");
    process.exit(0);
  } else {
    console.log("\n... Deployment in progress (older version still cached or building) ...");
    process.exit(1);
  }
}

checkDeployment();
