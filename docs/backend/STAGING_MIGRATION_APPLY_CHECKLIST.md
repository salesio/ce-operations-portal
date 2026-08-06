# Staging Migration Apply Checklist

## Before

- [ ] Confirm the selected Supabase project is correct.
- [ ] Confirm it is staging, not production.
- [ ] Back up the database if it already contains data.
- [ ] Confirm `database/schema.sql` is ready and reviewed.
- [ ] Confirm migrations `0002`–`0012` are present and ordered.
- [ ] Keep synthetic seeds separate from schema/migrations.
- [ ] Run `npm run test:migrations-readiness` and `npm run db:schema:check`.

## Apply and validate

Apply only after human confirmation. Stop on the first error.

| Order | SQL file | Validation after apply |
|---:|---|---|
| Base | `database/schema.sql` | Base tables, constraints and schema metadata |
| 0002 | `0002_auth_users_roles_pilot.sql` | Auth/users/roles objects |
| 0003 | `0003_churches_members_pilot.sql` | Churches and members |
| 0004 | `0004_first_timers_followups_pilot.sql` | First timers and follow-ups |
| 0005 | `0005_finance_public_giving_storage_pilot.sql` | Finance and public giving |
| 0006 | `0006_requisitions_inventory_pilot.sql` | Requisitions and inventory |
| 0007 | `0007_staff_hr_documents_pilot.sql` | Staff, HR and documents |
| 0008 | `0008_foundation_school_pilot.sql` | Foundation School |
| 0009 | `0009_programs_media_pilot.sql` | Programs and media |
| 0010 | `0010_counseling_sacraments_pilot.sql` | Counseling and sacraments |
| 0011 | `0011_fevo_prison_materials_pilot.sql` | F.E.V.O, prison ministry and materials |
| 0012 | `0012_reports_notifications_audit_hardening.sql` | Reports, notifications and audit |

`0001` is the historical foundation marker and is represented for a fresh installation by `database/schema.sql` and the project documentation.

## After

- [ ] Run SQL sanity checks without destructive statements.
- [ ] Verify all principal tables.
- [ ] Verify foreign keys and indexes.
- [ ] Verify `updated_at` triggers.
- [ ] Verify RLS is in the intended dev-safe/planned state.
- [ ] Verify no real sensitive data was introduced.
- [ ] Record applied files and outcomes in the staging report.
