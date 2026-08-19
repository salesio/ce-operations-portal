# Cell Access & Leadership Model

## 1. Cell Leadership Assignments (`public.cell_user_assignments`)

To allow multiple individual leaders (e.g. Primary Leader, Assistant Leader 1, Assistant Leader 2) to manage cells without sharing credentials, leadership assignments are modeled via `public.cell_user_assignments`.

### Table Schema Highlights:
- `id`: Unique UUID.
- `user_id`: Reference to `public.users.id`.
- `cell_id`: Reference to `public.cells.id`.
- `assignment_role`: `Leader`, `Assistant`, `Intern`, `Reviewer`.
- `status`: `Active`, `Ended`, `Suspended`.
- `starts_at` / `ends_at`: Temporal validity window.
- `notes`: Administrative observations.

---

## 2. Multi-Cell Scoping Resolution

When a user authenticates, their authorized cells are computed using:
1. Direct primary assignment: `users.cell_id`.
2. Group assignment: All cells belonging to `users.cell_group_id` or `users.assigned_cell_groups` (for Cell Group Leaders).
3. Active assignments in `cell_user_assignments` where `user_id = user.id AND status = 'Active' AND (ends_at IS NULL OR ends_at > NOW())`.

---

## 3. Explicit Module Denials for Cell Leaders

Cell leaders are strictly scoped to cell ministry operations. The following modules are explicitly denied to cell leaders and assistants in `js/access-control.js` and PostgreSQL RLS:

| Denied Module | Rationale |
|---------------|-----------|
| `finance` | Cell leaders cannot access general church income, bank accounts, or expense budgets. Cell offerings submitted via weekly reports remain `Pending Finance Review` and do NOT create direct ledger records. |
| `staffHr` | Staff profiles, salaries, contracts, and HR evaluations are restricted to HR and administrative roles. |
| `requisitions` | Church financial requisitions require department head approval. |
| `usersRoles` / `accessControl` | User provisioning and role assignment are restricted to Church and Super Admins. |
| `settings` / `auditLogs` | Global system configurations and audit logs are restricted to Admins. |
