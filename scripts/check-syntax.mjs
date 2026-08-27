import fs from "fs";
import { rollup } from "rollup";

async function check() {
  try {
    await rollup({
      input: "js/dashboard.js",
      plugins: []
    });
    console.log("SUCCESS: js/dashboard.js has ZERO syntax errors and is 100% valid JavaScript!");
  } catch (e) {
    console.error("SYNTAX ERROR in js/dashboard.js:");
    console.error(e.message);
    if (e.loc) {
      console.error(`Line: ${e.loc.line}, Column: ${e.loc.column}`);
    }
    if (e.frame) {
      console.error(e.frame);
    }
    process.exit(1);
  }
}

check();
