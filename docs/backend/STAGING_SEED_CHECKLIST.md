# Staging Seed Checklist

Seeds are synthetic and are intended only for staging/demo. Do not apply them to production without an explicit review, and never add real sensitive data. Run `npm run test:validate-seeds-safety` first.

Recommended order:

- [ ] `churches_members_seed.sql`
- [ ] `first_timers_followups_seed.sql`
- [ ] `finance_public_giving_seed.sql`
- [ ] `requisitions_inventory_seed.sql`
- [ ] `staff_hr_seed.sql`
- [ ] `foundation_school_seed.sql`
- [ ] `programs_media_seed.sql`
- [ ] `counseling_sacraments_seed.sql`
- [ ] `fevo_prison_materials_seed.sql`
- [ ] `reports_notifications_audit_seed.sql`

For each seed, confirm the target project is staging, review the data, apply manually, validate expected row counts and record the result. Never seed production merely to make smoke tests pass.
