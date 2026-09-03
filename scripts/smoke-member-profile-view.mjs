import fs from "node:fs";

const dashboard = fs.readFileSync("js/dashboard.js", "utf8");
const html = fs.readFileSync("index.html", "utf8");

for (const token of [
  "buildMemberProfileViewModel",
  "memberProfileHtml",
  "openMemberProfileView",
  "MEMBER_MARITAL_STATUS_OPTIONS",
  "normalizeMemberMaritalStatus",
  "memberSelectOptionLabel",
  "MEMBER_PROFILE_TEXT",
  "memberProfileText",
  "personalDetails",
  "churchLife",
  "spiritualProgress",
  "winningSouls",
  "dataQuality",
  "data-member-profile-edit",
  "Fechar",
  "Editar",
]) {
  if (!dashboard.includes(token)) throw new Error(`Member profile view is missing: ${token}`);
}

const rawProfileStart = dashboard.indexOf("function openMemberProfileView");
const rawProfileEnd = dashboard.indexOf("function openView", rawProfileStart);
const rawProfile = dashboard.slice(rawProfileStart, rawProfileEnd);
if (rawProfile.includes("Object.entries(member)")) throw new Error("Profile must not auto-render raw Member properties.");
if (!dashboard.includes('if (type === "member") return openMemberProfileView(id);')) throw new Error("Member view must use the explicit profile view model.");
if (!dashboard.includes("member.provider_sync_status")) throw new Error("Existing member persistence fallback was unexpectedly removed.");
if (!dashboard.includes('["marital_status", "maritalStatus", "select", MEMBER_MARITAL_STATUS_OPTIONS]')) throw new Error("Member marital status must render as a controlled select.");
if (!dashboard.includes('inputType === "section"')) throw new Error("Member form sections must not render as empty inputs.");
if (!html.includes("member-i18n-v1")) throw new Error("Dashboard cachebuster was not updated.");
console.log("Member profile view smoke check passed.");
