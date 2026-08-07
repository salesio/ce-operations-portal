# Backend Access Control Plan

## Cell Leader Portal

O portal usa permissões `cell_portal.*`: Leader/Assistant têm `scope=own`, Reviewer usa igreja, Head usa o escopo configurado e Super Admin vê todas as células. A interface comum contém apenas Minha Célula, relatórios, submissão e notificações. `canAccessCell(userId, cellId)` protege perfis, estatísticas, exportação e troca de célula.

This backend-focused companion to the root `ACCESS_CONTROL_PLAN.md` records the authenticated Cell Report policy.

- Anonymous submission is disabled by default with `VITE_ENABLE_PUBLIC_CELL_REPORT=false`.
- Cell Leaders and Cell Assistants receive own-cell read/create/edit-until-validated scope.
- Cell Ministry Reviewers and Heads receive review/validate/reject/export rights within church or department scope.
- Super Admin receives full scope.
- `getAuthorizedCellsForUser(userId)` resolves assignments from user `assigned_cells`, `cell_leaders` user/staff links, and cell primary/assistant user IDs.
- The selected cell is checked again immediately before persistence; UI filtering is not treated as the security boundary.
- A real Supabase rollout must enforce the same rules in RLS/RPC/API policies. Frontend controls alone are insufficient for production authorization.
- Audit records exclude passwords, tokens, keys, and report-sensitive content.

See `AUTHENTICATED_CELL_REPORT_SUBMISSION.md` for the full flow and test procedure.
