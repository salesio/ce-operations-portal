# Migration Execution Plan

Back up schema and data before every production migration. Apply in staging first, record start/end time and operator, and verify expected objects. Rollback is manual and data-preserving; no automated `DROP TABLE` rollback is provided.

| Logical order | File | Purpose / main objects | Dependencies | Seed timing | Main risk / manual rollback |
|---|---|---|---|---|---|
| 0001 | Apply `database/schema.sql`, then marker `20260724_backend_phase1_foundation.sql` | Foundation, core users/settings/documents and schema marker | Extensions and empty project | Before all seeds | Core contract; restore backup or forward-fix |
| 0002 | `0002_auth_users_roles_pilot.sql` | Auth users, roles, permissions | 0001 | Role seed after | Auth linkage; disable feature flag and forward-fix |
| 0003 | `0003_churches_members_pilot.sql` | Churches and members | 0001–0002 | Churches seed after | Scope/FK; restore affected rows |
| 0004 | `0004_first_timers_followups_pilot.sql` | First Timers, Follow-Up, timeline | 0003 | Seed after | Identity linking; restore/forward-fix |
| 0005 | `0005_finance_public_giving_storage_pilot.sql` | Finance, public giving, disbursements, document metadata | 0003 | Finance seed after | Financial integrity/storage privacy; disable pilot and restore |
| 0006 | `0006_requisitions_inventory_pilot.sql` | Requisitions, inventory, venue/checklists | 0003, 0005 links | Seed after | Cross-module links; restore affected set |
| 0007 | `0007_staff_hr_documents_pilot.sql` | Staff/RH, salary and document metadata | 0002–0003 | Staff seed after | Salary/document exposure; disable access and restore |
| 0008 | `0008_foundation_school_pilot.sql` | Foundation School lifecycle | 0003–0004 | Seed after | Progress constraints; forward-fix or restore |
| 0009 | `0009_programs_media_pilot.sql` | Programs and Media | 0003, optional 0006 | Seed after | Scheduling/resource links; restore |
| 0010 | `0010_counseling_sacraments_pilot.sql` | Counseling and Sacraments | 0002–0004, documents | Seed after | Pastoral confidentiality; immediately restrict and restore |
| 0011 | `0011_fevo_prison_materials_pilot.sql` | F.E.V.O., safe Prison aggregates, Materials | 0003 and prior module links | Seed after | Sensitive/stock constraints; disable pilot and restore |
| 0012 | `0012_reports_notifications_audit_hardening.sql` | Read-only reports, in-app notifications, audit/system | 0002–0011 | Seed last | Cross-module visibility; disable Supabase routing and restore |

## Execution protocol

1. Freeze writes or announce maintenance if required.
2. Confirm current backup and tested restore destination. For a new project, apply the canonical `database/schema.sql` before the Phase 1 marker; the historical marker is not the full schema.
3. Review SQL diff and dependencies; never apply multiple unreviewed files as one opaque batch.
4. Apply one file, capture output, validate tables/indexes, and run smoke tests.
5. Continue only after acceptance. Seeds are always a separate approval.
6. On failure, stop writes, preserve logs, assess forward-fix versus point-in-time restore, and document the decision.
