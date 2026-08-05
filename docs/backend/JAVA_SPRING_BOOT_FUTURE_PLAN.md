# Java Spring Boot Future Plan

Spring Boot is a future backend/API option, not a replacement for the React/TypeScript frontend and not a Phase 13 implementation task. PostgreSQL remains the database. The current priority is stabilizing the Supabase pilots, RLS, storage, backups and production operations.

## Incremental adoption

Avoid a one-shot rewrite. A Spring API can gradually replace direct Supabase access for sensitive workflows while existing read paths and mock/local development remain stable. Early candidates are Auth/API gateway enforcement, Finance verification, Requisition approvals, private document signed URLs, audit/sensitive access, report exports and background jobs.

Suggested structure:

- Controller: HTTP contract and validation boundary
- Service: business transactions and authorization orchestration
- Repository/Entity: PostgreSQL persistence
- DTO/Mapper: stable external shapes without leaking entities
- Security: Auth claims, roles, church scope and rate limits
- Audit: sanitized immutable events and sensitive-access references
- Exception Handling: consistent safe errors and correlation IDs

## Roadmap

1. Spring Phase 1 — foundation, observability, configuration and health
2. Spring Phase 2 — Auth/users/roles gateway
3. Spring Phase 3 — Churches/members read/write APIs
4. Spring Phase 4 — Finance and Requisition transactions
5. Spring Phase 5 — sensitive documents, signed URLs and audit
6. Spring Phase 6 — reports exports, queues and background jobs
7. Spring Phase 7 — remaining modules based on measured need

Use Kanban, small vertical slices, compatibility adapters, contract tests and milestone tags. Each migration needs rollback, security review and parallel validation before frontend routing changes.

