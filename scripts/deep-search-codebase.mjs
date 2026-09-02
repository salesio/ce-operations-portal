import fs from "node:fs";
import path from "node:path";

function searchDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === "node_modules" || file === ".git" || file === "dist") continue;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      searchDir(fullPath);
    } else if (/\.(js|ts|html|json|mjs|css)$/.test(file)) {
      const content = fs.readFileSync(fullPath, "utf8");
      if (/cell\s*01/i.test(content) || /estrelas.*cell/i.test(content) || /cell.*01/i.test(content)) {
        console.log(`Match in ${fullPath}`);
        const lines = content.split("\n");
        lines.forEach((l, i) => {
          if (/cell\s*01/i.test(l) || /estrelas.*cell/i.test(l) || /cell.*01/i.test(l)) {
            console.log(`  Line ${i + 1}: ${l.slice(0, 120)}`);
          }
        });
      }
    }
  }
}

searchDir(process.cwd());
