# Row-Level Security (RLS) Access Matrix

## 1. Helper Functions (Migration `0020_auth_rls_policies.sql`)

- `public.current_app_user_id()`: Returns `public.users.id` matching `auth.uid() = auth_user_id`.
- `public.current_user_role()`: Returns the role slug (e.g. `super_admin`, `cell_leader`) of the current authenticated user.
- `public.current_user_church_id()`: Returns the assigned `church_id` of the current user.
- `public.authorized_cell_ids()`: Returns a `UUID[]` array of all cell IDs the current user is authorized to manage (direct cell, group cells, and active assignments).
- `public.authorized_cell_group_ids()`: Returns a `UUID[]` array of all cell group IDs the user is authorized to manage.

---

## 2. PostgreSQL RLS Policies Matrix

| Table | Operation | Super Admin / Main Pastor | Church Admin | Cell Group Leader | Cell Leader / Assistant |
|-------|-----------|---------------------------|--------------|-------------------|-------------------------|
| `public.members` | `SELECT` | All | Own Church | Own Cell Group | Own Assigned Cell(s) |
| `public.members` | `UPDATE` | All | Own Church | Own Cell Group | Allowed fields within Assigned Cell(s) |
| `public.members` | `INSERT` | All | Own Church | Denied (Use Candidates) | Denied (Use Candidates) |
| `public.members` | `DELETE` | All | Own Church (Archive) | Denied | Denied (Use Disassociation) |
| `public.cell_user_assignments` | `SELECT` | All | Own Church | Own Group | Assigned Cell(s) |
| `public.cell_user_assignments` | `INSERT/UPDATE`| All | Own Church | Denied | Denied |
| `public.cell_transfer_requests` | `SELECT` | All | Own Church | Own Group | Source or Target Cell |
| `public.cell_transfer_requests` | `INSERT` | All | Own Church | Own Group | Source Cell (Leader/Assistant) |
| `public.cell_transfer_requests` | `UPDATE` | All | Own Church | Own Group (Approve/Reject) | Denied |
| `public.member_registration_candidates` | `SELECT` | All | Own Church | Own Group | Own Cell(s) |
| `public.member_registration_candidates` | `INSERT/UPDATE`| All | Own Church | Own Group | Own Cell(s) |
| `public.cell_member_removal_logs` | `SELECT` | All | Own Church | Own Group | Own Cell(s) |
| `public.cell_member_removal_logs` | `INSERT` | All | Own Church | Own Group | Own Cell(s) |
