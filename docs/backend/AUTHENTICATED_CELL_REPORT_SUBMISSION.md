# Authenticated Cell Report Submission

> Líderes e Assistentes autenticados entram em `#cellPortal`. O botão de relatório mantém igreja/grupo/célula bloqueados conforme `getCellLeaderContext()` e `canAccessCell()`. Consulte [CELL_LEADER_PORTAL.md](./CELL_LEADER_PORTAL.md).

## Security baseline

Cell report submission requires an authenticated dashboard session by default. `VITE_ENABLE_PUBLIC_CELL_REPORT=false` is the safe default. The legacy anonymous form can only be enabled explicitly in `mock` or `local` data mode and a non-production app environment; it displays a demo warning and must never receive real data.

The login-screen button now opens the Cell Leader Portal login flow. After login, only `Cell Leader`, `Cell Assistant`, `Cell Ministry Reviewer`, `Cell Ministry Head`, and `Super Admin` may enter the relevant portal scope. Only a leader, assistant, or Super Admin with `cell_reports.create_own` may submit.

## Permissions

- `cell_reports.view_own`
- `cell_reports.create_own`
- `cell_reports.edit_own_until_validated`
- `cell_reports.view_church`
- `cell_reports.review`
- `cell_reports.validate`
- `cell_reports.reject`
- `cell_reports.export`

Leaders and assistants are restricted to assigned cells. Reviewers and ministry heads receive church/department scope; Super Admin receives all cells. `getAuthorizedCellsForUser(userId)` is exposed by the dashboard for the route/form guard.

## Assignment contract

`cell_leaders` supports `user_id`, `staff_id`, `role_type` (`Leader` or `Assistant`), `cell_id`, `cell_group_id`, `church_id`, and `status`. Cells support `primary_leader_user_id`, `primary_leader_name`, `assistant_leader_user_ids`, and `assistant_leader_names`. Existing legacy names remain supported.

Demo accounts (password hint `demo`; no real password is stored):

- `cell.leader@ce-mozambique.org`
- `cell.assistant@ce-mozambique.org`
- `cell.reviewer@ce-mozambique.org`

## Submission and review

The form only lists authorized cells. A single assignment locks church, group, and cell. The submit handler revalidates the selected cell and blocks a forged or altered value before persistence.

Authenticated records include `submitted_by_user_id`, `submitted_by_name`, `submitted_by_role`, `submitted_by_cell_role`, `authorized_cell_id`, `auth_required=true`, and `submission_source=cell_leader_portal`. Initial status remains `Submitted` or `Pending Review`.

Review, validation, correction, and rejection require explicit permissions. Rejection/correction require a reason; review history and actor metadata are retained. In-app notifications are used when available. Audit events record login, submission, denial, unauthorized attempts, validation, correction, and rejection without passwords, tokens, or secret content.

Offerings remain `Pending Finance Review` and never create a `financeRecord` automatically.

## Verification

```bash
npm run build
npm run test:authenticated-cell-report
npm run test:public-cell-report
npm run test:access-control-data
npm run test:settings-notifications-data
npm run test:data-layer-all
```

For manual QA, click “Submeter Relatório de Célula”, verify that login is required, test leader and assistant assignment locks, attempt a forged cell selection, then validate/reject as the reviewer. Confirm no finance record is created.
