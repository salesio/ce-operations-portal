import fs from 'node:fs';

console.log('Running smoke test for Member Merge, Candidate Visibility, and Universal Autocomplete...');

const js = fs.readFileSync('js/dashboard.js', 'utf8');

const requiredTokens = [
  'canReviewMemberCandidates',
  'syncMemberRegistrationCandidatesFromRepository',
  'candidateAdminActions',
  'Fundir Membro',
  'openMergeMemberModal',
  'submitMergeMembers',
  'mountPersonAutocomplete',
  'searchPersonsAcrossSystem',
  'applyPersonToForm',
  'data-members-main-tab',
  'data-member-merge',
  'mountRelationalControls'
];

for (const token of requiredTokens) {
  if (!js.includes(token)) {
    throw new Error('Missing required token in dashboard.js: ' + token);
  }
  console.log('  PASS: token ' + token);
}

console.log('All smoke checks for Member Merge, Candidate Visibility, and Universal Autocomplete passed successfully!');
