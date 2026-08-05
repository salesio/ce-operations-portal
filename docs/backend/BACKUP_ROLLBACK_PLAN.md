# Backup and Rollback Plan

## Before migration or seed

- Confirm environment/project identity and maintenance ownership.
- Take provider-managed/PITR backup where available.
- Export schema and required data securely; encrypt and access-control copies.
- Record migration version, row counts, application version and time.
- Test restore procedures periodically; an untested backup is not readiness.

## Rollback decision

Stop further migrations and, if integrity/privacy is at risk, pause application writes. Preserve database/application logs. Prefer a reviewed forward-fix for additive changes when safe. Use point-in-time/full restore when corruption, destructive change or widespread invalid data cannot be safely repaired.

Rollback is manual and approved. Never run automated production `DROP TABLE` cleanup. Seeds should be reversed only with reviewed identifiers and reconciliation, or by restoring the pre-seed backup.

## Emergency checklist

1. Declare incident and assign incident lead.
2. Stop the change and protect evidence/logs.
3. Assess affected tables, users and confidentiality.
4. Choose forward-fix or restore; record approval.
5. Validate schema, row counts, RLS, Auth and critical workflows.
6. Re-enable traffic gradually and monitor.
7. Document timeline, root cause and preventive actions.

