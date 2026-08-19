# QA & Verification Test Plan: Auth, Roles & Cell Reconciliation

## 1. Automated Test Suites Overview

The test suites in `scripts/` automate verification of the entire authentication and access control pipeline:

1. `scripts/test-auth-real.mjs`:
   - Validates Supabase Auth client initialization.
   - Verifies rejection of invalid credentials without silent fallback when `VITE_ENABLE_REAL_AUTH=true`.
   - Tests user status lockout (`Suspended`, `Inactive`, `Locked`).
2. `scripts/test-users-roles.mjs`:
   - Validates standard role definitions and hierarchy levels.
   - Validates user scoping (`Global`, `Church`, `CellGroup`, `Cell`).
   - Verifies explicit module denials for cell leaders (`finance`, `staffHr`, `requisitions`).
3. `scripts/test-cell-access.mjs`:
   - Validates multi-cell scoping for primary leaders, assistant leaders, and cell group leaders.
   - Verifies active temporal assignments in `cell_user_assignments`.
4. `scripts/test-cell-member-reconciliation.mjs`:
   - Validates single-click member confirmation (`reconciliation_status: 'Confirmed'`).
   - Validates bulk confirmation up to 50 members.
   - Validates non-destructive disassociation with reason logging.
   - Validates permitted field editing and rejection of restricted field edits.
5. `scripts/test-cell-transfer.mjs`:
   - Validates cell transfer request creation, submission, approval, and rejection lifecycles.
6. `scripts/test-rls-cell-leader.mjs`:
   - Validates SQL helper functions and PostgreSQL RLS policy coverage.

---

## 2. Manual QA Verification Checklist

- [ ] **Login with Cell Leader Account**:
  - Sign in with cell leader credentials.
  - Verify landing directly on `#cellPortal`.
  - Verify restricted sidebar (finance, HR, and requisitions are absent).
- [ ] **Reconciliation KPIs & Filters**:
  - Open "Membros & Reconciliação".
  - Verify KPI counts (Total, Confirmados, Por Rever, Correcções, Transferências, Não Pertencem).
  - Filter by reconciliation status and verify accurate list rendering.
- [ ] **Confirm Single Member**:
  - Click the green check button on a pending member.
  - Verify instant badge update to `Confirmado` with timestamp and user ID.
- [ ] **Bulk Confirm Members**:
  - Click "Confirmar Todos (N)".
  - Confirm confirmation prompt.
  - Verify all pending members update to `Confirmado`.
- [ ] **Edit Member Contact Info**:
  - Click the pencil icon on a member.
  - Update phone number, neighborhood, and KingsChat username.
  - Verify changes persist and member updates to `Confirmado`.
- [ ] **Disassociate Member (Not In Cell)**:
  - Click the red person-x button.
  - Select reason (e.g. `Mudou de igreja`) and add notes.
  - Verify member `cell_id` is set to null, status changes to `Não Pertence`, and log is recorded.
- [ ] **Request Member Transfer**:
  - Click the transfer icon.
  - Select destination cell and reason.
  - Verify transfer request is created in `cell_transfer_requests` with status `Submitted`.
- [ ] **Missing Member Registration**:
  - Click "Registar Candidato a Membro".
  - Fill out candidate form and verify submission to candidate approval queue.
