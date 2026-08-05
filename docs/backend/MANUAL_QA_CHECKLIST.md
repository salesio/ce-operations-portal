# Manual QA Checklist

## Without real Supabase

- [ ] Start with `VITE_DATA_SOURCE=local`.
- [ ] Open Settings and confirm current source, pilot-ready modules and `12/12` migrations.
- [ ] Confirm Supabase shows not configured when URL/anon are absent.
- [ ] Confirm Storage status, production-pending RLS/buckets, backup warning, deployment pending and documented Spring future plan.
- [ ] Open Reports, Notifications and Audit; verify existing local behavior and persistence after refresh.
- [ ] Switch to mock and confirm synthetic in-memory behavior.
- [ ] Switch to Supabase with missing env and confirm a friendly error without crash.
- [ ] Switch to API with missing base URL and confirm controlled placeholder behavior.
- [ ] Return to local and confirm local data remains intact.

## With real Supabase — staging only

- [ ] Complete backups and migration execution approval.
- [ ] Apply migrations individually and validate each result.
- [ ] Test every Auth role/church scope and denied path.
- [ ] Verify private buckets and short-lived signed URLs.
- [ ] Verify sensitive salary, counseling, proof, document and export access events.
- [ ] Run the complete automated test matrix and record evidence.

Do not perform the staging section without approved credentials and change authorization.
