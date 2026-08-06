# Staging Rollback and Fallback Checklist

## Frontend fallback

- [ ] Set `VITE_DATA_SOURCE=local`.
- [ ] Set `VITE_ENABLE_SUPABASE=false`.
- [ ] Rebuild the app.
- [ ] Confirm Settings reports local mode and core modules still operate.
- [ ] Confirm mock mode separately when required.

## Supabase rollback

- [ ] If staging contains no important data, prefer recreating the staging project after review.
- [ ] If data matters, restore the verified backup.
- [ ] Never run an automatic `DROP` or destructive rollback without review.
- [ ] Document the problematic migration and observed error.
- [ ] Prefer a reviewed forward hotfix migration when appropriate.

## Emergency

- [ ] Remove the Supabase frontend env from the build environment.
- [ ] Restore the previous known-good build.
- [ ] Use the previous Git tag (currently `backend-phase-13-production-readiness-v1`) if needed.
- [ ] Verify the relevant GitHub release/tag and its commit.
- [ ] Record whether rollback occurred and retest local fallback.
