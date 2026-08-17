import fs from "fs";

console.log("Checking ALEC Member Autocomplete implementation...");

const jsContent = fs.readFileSync("js/dashboard.js", "utf-8");
const cssContent = fs.readFileSync("css/dashboard.css", "utf-8");

// 1. Verify mountAlecMemberAutocompleteControls function
if (!jsContent.includes("mountAlecMemberAutocompleteControls")) {
  throw new Error("FAIL: js/dashboard.js missing mountAlecMemberAutocompleteControls definition");
}
console.log("PASS: mountAlecMemberAutocompleteControls function defined in js/dashboard.js");

// 2. Verify call inside openForm
if (!jsContent.includes("mountAlecMemberAutocompleteControls(byId(\"entryForm\"))")) {
  throw new Error("FAIL: openForm does not invoke mountAlecMemberAutocompleteControls");
}
console.log("PASS: openForm invokes mountAlecMemberAutocompleteControls on form render");

// 3. Verify CSS styling for suggestions
if (!cssContent.includes(".alec-member-suggestions") || !cssContent.includes(".alec-member-suggestion-item")) {
  throw new Error("FAIL: css/dashboard.css missing ALEC autocomplete styles");
}
console.log("PASS: ALEC autocomplete suggestion CSS styles present");

console.log("\n✅ ALL ALEC Member Autocomplete tests passed successfully!");
