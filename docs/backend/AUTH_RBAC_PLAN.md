# Auth & RBAC Plan

## Phase 1 status

- **Demo login** remains active (`dashboard.js` / access-control seeds)
- **No** full Supabase Auth for all modules
- Schema prepares `users.auth_user_id`, `roles`, `permissions`, `audit_logs`

## Target flow (future)

```
Supabase Auth user (auth.users)
    → public.users.auth_user_id
    → role_id → public.roles
    → public.permissions (module + can_*)
    → app canUser() / checkPermission()
    → RLS policies (using JWT + helper functions)
    → audit_logs on sensitive actions
```

## Roles (seed baseline)

| name | display | scope idea |
|------|---------|------------|
| super_admin | Super Admin | all |
| main_pastor | Main Pastor | national / all |
| finance_head | Finance Head | finance-sensitive |
| hr_manager | HR Manager | staff/salaries |
| staff_member | Staff Member | own |

## Permission model

Columns on `permissions`:

- `can_view`, `can_create`, `can_edit`, `can_delete`
- `can_approve`, `can_verify`, `can_release_resources`
- `can_export`, `can_manage_settings`
- `scope`, `conditions` (jsonb), `is_sensitive`

Frontend already has pilot RBAC via `accessControlRepository` + `CEAccessControl` (mock/local).

## Future Auth phase tasks

- [ ] Migrate demo users → Supabase Auth invites
- [ ] Password reset / email invite
- [ ] Locked / suspended user status
- [ ] Session handling (`persistSession` when `VITE_ENABLE_REAL_AUTH=true`)
- [ ] Role updates write audit logs
- [ ] Map JWT claims → `current_app_user()` SQL helper

## Explicit non-goals (this phase)

- Do not force login through Supabase
- Do not break offline/demo GitHub Pages
- Do not put service role in the client
