# Seed Strategy

All files under `supabase/seeds/` are synthetic/demo fixtures. They are intended for local, demo or staging use and must not be applied to production without a row-by-row review and explicit approval.

Real data requires a separate import pipeline with schema validation, deduplication, consent/privacy review, dry-run output, audit trail and reconciliation. Never place real confidential notes, payroll details, proofs, identity documents, prison/criminal data, credentials or service values in repository seeds.

## Order

1. `foundation_roles_settings.sql`
2. `churches_members_seed.sql`
3. `first_timers_followups_seed.sql`
4. `finance_public_giving_seed.sql`
5. `requisitions_inventory_seed.sql`
6. `staff_hr_seed.sql`
7. `foundation_school_seed.sql`
8. `programs_media_seed.sql`
9. `counseling_sacraments_seed.sql`
10. `fevo_prison_materials_seed.sql`
11. `reports_notifications_audit_seed.sql`

Apply only after the corresponding migration. Preserve FK order and use idempotent conflict handling where supplied. Run `npm run test:validate-seeds-safety` before commit and before staging use. The validator is a guardrail, not a privacy review.

