import fs from "node:fs";

const versionTag = `20260911-users-display-sync-v2`;
let html = fs.readFileSync("index.html", "utf8");
html = html.replace(/\?v=[a-zA-Z0-9_.-]+/g, `?v=${versionTag}`);
fs.writeFileSync("index.html", html, "utf8");
console.log(`Updated index.html cache-buster versions to ${versionTag}.`);
