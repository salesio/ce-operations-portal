# Sacraments Module Plan — CE Mozambique Dashboard

## Status

**Pilot live** on progressive data layer (mock/local).  
UI remains in `js/dashboard.js` (`renderSacraments`, `state.sacraments`).  
Collections: baptisms, marriages, baby dedications, certificates, documents, appointments.

## Principles

1. **Sacraments uses data layer** (`VITE_DATA_SOURCE=mock|local|api|supabase`).
2. **Baptisms, Marriages, Baby Dedications** are separate collections under one module.
3. **Certificate `payment_status` is internal only** — never creates `financeRecord` in this phase.
4. **Sensitive documents** respect RBAC; aggregated reports omit `file_url`.
5. Soft **audit log** on create/complete, document verify/reject, certificate issue/cancel.
6. Links prepared to **Members**, **First Timers**, **Counseling** (`counseling_case_id`), **Venue**.
7. No direct browser → PostgreSQL.

## Data layer keys

```
ce-data-layer:baptisms
ce-data-layer:marriages
ce-data-layer:baby-dedications
ce-data-layer:sacrament-certificates
ce-data-layer:sacrament-documents
ce-data-layer:sacrament-appointments
```

## Workflow

```
Pedido → revisão / documentos → agendamento → pastor → realização → certificado → histórico
```

## Certificate / Finance

| Field | Behaviour this phase |
|-------|----------------------|
| `certificate_paid` / `payment_status` | Status only |
| `amount_paid` | Optional metadata |
| financeRecord | **Not created** |

Future: optional verified expense/income via Finance Head.

## Counseling link (marriages)

- `counseling_case_id` + `counseling_completed`
- No auto-create case unless a safe method exists later

## Globals

```js
window.CESacraments = { listBaptisms, createMarriage, issueSacramentCertificate, … getInfo }
window.CEDataLayer.sacraments / baptisms / marriages / babyDedications /
  sacramentCertificates / sacramentDocuments / sacramentAppointments
```

Cache buster: `?v=20260723-sacraments-data-v1`

## How to test

```bash
npm run build
npm run test:sacraments-data
npm run test:counseling-data
npm run test:access-control-data
npm run test:staff-hr-data
```
