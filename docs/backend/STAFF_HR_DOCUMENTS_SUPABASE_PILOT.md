# Staff & RH + Documents Supabase/API Pilot

Backend Phase 7 adds an optional remote data path for the Staff & Human Resources module.

Mock/local data remains the default. Supabase is active only when `VITE_DATA_SOURCE=supabase`, `VITE_ENABLE_SUPABASE=true`, and the Supabase URL/anon key are configured.

## Tables

- `staff_departments`
- `staff_roles`
- `staff_members`
- `staff_salaries`
- `staff_performance_reviews`
- `staff_documents`
- `staff_attendance`

## Sensitive Rules

- Staff salaries are HR metadata only.
- Salary records must not create `finance_records`, expenses, or disbursements.
- Staff documents are sensitive metadata by default.
- `staff-documents` is reserved for a future private storage bucket.
- Staff document metadata can link to the shared `documents` table through `document_id`.
- Public buckets are not allowed for staff documents.

## User / Role Link

Staff records can link to dashboard access through `user_id`, `auth_user_id`, `access_role_id`, `access_role_name`, and `can_access_dashboard`.

## Files

| Area | Path |
|------|------|
| Migration | `supabase/migrations/0007_staff_hr_documents_pilot.sql` |
| Seed | `supabase/seeds/staff_hr_seed.sql` |
| Supabase adapter | `src/data/adapters/supabase/staffHrSupabaseAdapter.ts` |
| API adapter | `src/data/adapters/api/staffHrApiAdapter.ts` |
| Smoke | `scripts/smoke-staff-hr-supabase.mjs` |

## Tests

```bash
npm run build
npm run test:staff-hr-supabase
npm run test:staff-hr-data
npm run test:access-control-data
npm run test:venue-inventory-data
npm run test:data-layer-all
npm run db:schema:check
```
