import fs from "node:fs";

let html = fs.readFileSync("index.html", "utf8");
html = html.replace(/\?v=[a-zA-Z0-9_.-]+/g, "?v=20260909-first-timer-cell-assign-v1");
fs.writeFileSync("index.html", html, "utf8");
console.log("Updated index.html cache-buster versions.");
