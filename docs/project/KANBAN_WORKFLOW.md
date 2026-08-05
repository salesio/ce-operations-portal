# Kanban Workflow

The project uses Kanban with incremental, testable milestones.

## Board

`Backlog → Ready → In Progress → Review → Testing → Done`, with `Blocked` visible beside the active flow.

Suggested WIP limits: In Progress 2, Review 2, Testing 2 per active team. Expedite only production/security incidents and record the reason.

## Definition of Ready

- Outcome, scope and non-goals are explicit.
- Dependencies, data sensitivity and owner are identified.
- Acceptance tests and rollback expectations are written.
- Required environment/access is available without sharing credentials.

## Definition of Done

- Implementation/docs match acceptance criteria.
- Security/privacy and migration impact reviewed.
- Required smoke/regression/build commands pass.
- Manual QA completed where relevant.
- Documentation, module map and changelog/milestone status updated.
- Commit and milestone tag created only after validation.

Use cards for each module/phase, bugs, security hardening, migrations, documentation and operational readiness. Blocked cards must state the blocker, owner and next review date. Milestone cards link their commit, tag, test evidence and remaining production risks.

