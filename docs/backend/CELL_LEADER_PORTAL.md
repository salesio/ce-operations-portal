# Cell Leader Portal — Independent Cell Dashboard

## Objectivo

O Cell Leader Portal é o painel independente para Líderes e Assistentes de Célula. A rota hash `#cellPortal` (com aliases `#cell-portal` e `#cell-leader`) substitui o dashboard administrativo para estes perfis e mantém o modo `mock/local` funcional sem exigir Supabase real.

## Quem pode aceder

- **Cell Leader** e **Cell Assistant**: apenas células ligadas por `user_id`, `staff_id`, `assigned_cells`, líder principal ou assistente.
- **Cell Ministry Reviewer** e **Cell Ministry Head**: células dentro do escopo de igreja/departamento.
- **Super Admin**: todas as células.

Uma conta sem atribuição recebe “Nenhuma célula está atribuída ao seu utilizador. Contacte o Departamento de Células.” Tentativas fora do escopo são bloqueadas por `canAccessCell()` e auditadas.

## Contexto e permissões

`getCellLeaderContext(userId)` devolve utilizador, role, igreja, grupo, célula, papel, IDs autorizados e permissões. O portal usa:

- `cell_portal.view`
- `cell_portal.view_members`
- `cell_portal.view_member_profile`
- `cell_portal.submit_report`
- `cell_portal.view_finance_summary`
- `cell_portal.view_partnership_summary`
- `cell_portal.view_soul_winning`
- `cell_portal.view_programs`
- `cell_portal.view_charts`
- `cell_portal.export_summary`

## Conteúdo e helpers

O portal reúne visão geral, membros, perfil espiritual, relatório semanal, actividades, crescimento, Foundation School, sacramentos, ganhar almas, programas, histórico, gráficos e alertas. Há filtros por período, estado, Fundação, parceria, dízimo e convites.

Helpers read-only: `getCellDashboardStats`, `getCellMembersProfile`, `getCellMemberSpiritualProgress`, `getCellMemberFinanceSummary`, `getCellSoulWinningStats`, `getCellFoundationProgress`, `getCellSacramentsSummary`, `getCellProgramsUpcoming`, `getCellReportTrends` e `getCellAlerts`.

## Dados bloqueados

Não são expostos notas de Counseling, salários, documentos, comprovativos, URLs de ficheiros, dados bancários ou valores financeiros individuais. O CSV contém apenas estado, Fundação, baptismo, parceria, dízimo e convites.

## Regras financeiras

- Só entradas `Verified/Validado/Aprovado`, excluindo `Expense/Despesa`, alimentam indicadores agregados.
- Pending e Rejected não entram.
- O líder não edita Finance e o portal nunca cria `financeRecord`.
- Oferta de relatório permanece `Pending Finance Review`.

## Relatório, gráficos e mobile

“Submeter Relatório Semanal” reutiliza o fluxo autenticado; igreja, grupo e célula ficam bloqueados e `cell_id` é revalidado. Os gráficos CSS cobrem presença, visitantes, almas, Fundação, sacramentos e relatórios. Em telemóvel os cards empilham, as tabelas viram cartões e o botão de submissão fica visível.

## Limitações

- Actividades vêm dos relatórios e F.E.V.O; o portal não cria Program global.
- Agregações dependem das ligações `member_id`, telefone, nome e `cell_id` existentes.
- Supabase/RLS real continua dependente do dry run de staging.

## Validação

```bash
npm run build
npm run test:authenticated-cell-report
npm run test:cell-leader-portal
npm run test:data-layer-all
```
