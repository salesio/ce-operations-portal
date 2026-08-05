# Storage Buckets Readiness Plan

All sensitive buckets are private. Bucket creation and production policies are manual setup steps; Phase 13 does not execute them.

| Bucket | Visibility | Content / modules | Access | Suggested retention / risks |
|---|---|---|---|---|
| `finance-proofs` | Private | Payment/public-giving proofs | Authorized upload; Finance reviewers via signed URL | Finance retention policy; proof leakage |
| `staff-documents` | Private | Contracts, IDs, HR files | HR upload/view; narrowly authorized leadership | Employment/legal schedule; identity theft |
| `sacrament-documents` | Private | Certificates and supporting documents | Pastoral/admin roles, signed URL | Ministry/legal schedule; personal data |
| `counseling-documents` | Private/future | Confidential case attachments | Assigned counselor and special permission only | Minimal retention; severe pastoral privacy risk |
| `report-exports` | Private | Generated report files | Requester if still authorized; short-lived signed URL | Short expiry; stale sensitive exports |
| `general-documents` | Private by default | Classified general attachments | Permission follows module/entity | Misclassification risk; never default sensitive files to public |

Configure allowed MIME types, size limits, deterministic non-PII paths, malware scanning, retention/expiry, deletion approval and download audit. Public assets must use a separate bucket and contain only reviewed non-sensitive media.

