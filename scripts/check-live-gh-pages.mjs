import https from "node:https";

https.get("https://salesio.github.io/ce-operations-portal/index.html", (res) => {
  let data = "";
  res.on("data", (chunk) => data += chunk);
  res.on("end", () => {
    const match = data.match(/js\/dashboard\.js\?v=([^\"]+)/);
    console.log("Live index.html dashboard query param:", match ? match[0] : "not found");
    const bundleMatch = data.match(/js\/supabase-bundle\.js\?v=([^\"]+)/);
    console.log("Live index.html bundle query param:", bundleMatch ? bundleMatch[0] : "not found");
  });
});
