import fs from "node:fs";

let code = fs.readFileSync("js/dashboard.js", "utf8");

code = code.replace(
  /if \(\(row\.foundation_school_interest \|\| row\.quer_escola_de_fundacao\) && !isEnrolledFS\) \{\s*actions\.push\(\["enrollFoundation", "firstTimer", id, "Matricular na ESF"\]\);\s*\}/,
  `if (!isEnrolledFS) {
    actions.push(["enrollFoundation", "firstTimer", id, "Enroll FS / Matricular na ESF"]);
  }`
);

fs.writeFileSync("js/dashboard.js", code, "utf8");
console.log("Updated firstTimerActions in dashboard.js!");
