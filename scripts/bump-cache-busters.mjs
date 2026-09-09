import fs from "node:fs";

let html = fs.readFileSync("index.html", "utf8");
html = html.replace(/\?v=[a-zA-Z0-9_-]+/g, "?v=20260909-foundation-live-v3");
fs.writeFileSync("index.html", html, "utf8");
console.log("Updated index.html cache-buster versions.");
