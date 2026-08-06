# Staging Storage Bucket Checklist

All staging buckets below must be private:

- [ ] `finance-proofs`
- [ ] `staff-documents`
- [ ] `sacrament-documents`
- [ ] `counseling-documents`
- [ ] `report-exports`
- [ ] `general-documents`

For every bucket:

- [ ] Confirm `public = false`.
- [ ] Confirm future downloads use short-lived signed URLs.
- [ ] Confirm anonymous public listing/access is unavailable.
- [ ] Define and test allowed MIME types and size limits.
- [ ] Review dev/staging policies by role and module.
- [ ] Confirm the frontend uses no service-role credential.

With `VITE_ENABLE_STORAGE=false`, the app must continue through metadata/mock behavior. With it enabled, use demo files only and test upload, authorized retrieval, expiry and unauthorized denial. Do not enable all buckets in one step.
