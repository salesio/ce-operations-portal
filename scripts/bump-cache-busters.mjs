import fs from "node:fs";

const versionTag = `20260909-clean-generic-role-labels-v1`;
let html = fs.readFileSync("index.html", "utf8");
html = html.replace(/\?v=[a-zA-Z0-9_.-]+/g, `?v=${versionTag}`);
fs.writeFileSync("index.html", html, "utf8");
console.log(`Updated index.html cache-buster versions to ${versionTag}.`);
