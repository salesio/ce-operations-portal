# User & Role Model Specification

## 1. Role Hierarchy & Scopes

The portal categorizes roles into four primary tiers with distinct operational scopes:

| Role Name | Slug / Key | Hierarchy Level | Default Scope | Description |
|-----------|------------|-----------------|---------------|-------------|
| **Super Admin** | `super_admin` | 100 | `Global` | Unrestricted national access across all churches, departments, and financial data. |
| **Main Pastor** | `main_pastor` | 95 | `Global` | Full visibility over ministerial progress, spiritual metrics, and leadership. |
| **National Admin** | `national_admin` | 90 | `Global` | Administrative oversight across all regional branches and operations. |
| **Church Admin** | `church_admin` | 80 | `Church` | Manages local church operations, users, departments, and member registries. |
| **Church Pastor** | `church_pastor` | 75 | `Church` | Pastoral leadership and oversight for an individual church branch. |
| **Department Head** | `department_head` | 60 | `Church` | Manages a specific departmental function (e.g. Media, Foundation, Counseling). |
| **Cell Ministry Head** | `cell_ministry_head` | 55 | `Church` | Departmental head of Cell Ministry across the local church. |
| **Cell Group Leader** | `cell_group_leader` | 40 | `CellGroup` | Leads and monitors a cluster of cells within a cell group. |
| **Cell Leader** | `cell_leader` | 30 | `Cell` | Leads an individual cell, submits weekly reports, reconciles members. |
| **Assistant Cell Leader** | `assistant_cell_leader` | 25 | `Cell` | Assists the cell leader in cell operations, report submission, and reconciliation. |
| **Staff Member** | `staff_member` | 20 | `Church` | Operational staff member with task-specific departmental permissions. |
| **Viewer** | `viewer` | 10 | `Self` | Read-only access to assigned personal modules. |

---

## 2. Granular Permissions Model

Permissions are defined in `public.permissions` linking `role_id -> public.roles.id`.

### Actions Supported:
- `view`: Can inspect list and details of module records.
- `create`: Can create new operational records.
- `edit`: Can update existing records within authorized scope.
- `delete`: Can delete or archive records within authorized scope.
- `approve`: Can review and grant departmental approval (e.g. Finance, Candidates).

---

## 3. Account Lifecycle & Statuses

- **`Active`**: Normal operating status.
- **`Pending Auth Setup`**: Record created by administrator in `public.users`; awaiting user Auth sign-up or invitation acceptance.
- **`Suspended`**: Temporarily locked out of portal access due to administrative hold.
- **`Inactive`**: Account deactivated (e.g. former staff member).
- **`Locked`**: Locked out after multiple failed security events or administrative lockout.
