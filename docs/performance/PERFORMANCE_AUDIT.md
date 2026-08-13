# Performance Audit

## Scope

Members directory, dashboard hydration, Supabase query patterns and Cell Ministry-related member access.

## Findings

- The old Supabase `listMembers()` loop downloaded every `members` row in 1,000-row batches.
- Login and the scheduled refresh invoked broad hydration across many modules, including Members, even when the Members screen was not open.
- The Members workspace then filtered the in-memory result client-side.
- The generic list helper uses `select(*)`; this is acceptable for detail flows but not for a large directory.

## Resulting risk

At 1,761 members and above, the browser did unnecessary transfer, local filtering and rerendering. The risk increases with concurrent module hydration and can make the dashboard feel stalled.

## Guardrails

- This phase does not delete records, create cells/groups, or change RLS.
- Index migration `0016` is review-only until manually applied to the intended Supabase environment.
