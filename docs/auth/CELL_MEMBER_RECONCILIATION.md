# Cell Member Reconciliation Specification

## 1. Overview & Business Requirements

When historical member datasets are imported from legacy spreadsheets, members are initially mapped to cells based on historical rows.

Cell Leaders and Assistant Cell Leaders are empowered to audit and reconcile their cell lists directly through the **Portal do Líder de Célula**, ensuring accurate records while preserving historical data integrity.

---

## 2. Reconciliation Statuses & Lifecycle

| Status | Code | Meaning | Action Needed |
|--------|------|---------|---------------|
| **Confirmado** | `Confirmed` | Leader verified that this person actively belongs to the cell. | None (Reconciled). |
| **Por Rever** | `Pending` | Default status for unreviewed historical records. | Leader reviews and confirms or marks transfer/removal. |
| **Precisa Correcção** | `NeedsCorrection` | Missing critical contact or profile information. | Leader edits permitted fields to update phone, email, neighborhood. |
| **Não Pertence à Célula** | `NotInCell` | Member does not attend or belong to this cell. | Member is disassociated from cell (`cell_id` set to null) and logged in `cell_member_removal_logs`. Historical record is **never deleted**. |
| **Pedido Transferência** | `TransferRequested` | Member moved to another area or cell. | Transfer request logged in `cell_transfer_requests` for coordination approval. |
| **Transferido** | `Transferred` | Transfer approved and completed by cell ministry leadership. | Member reassigned to new cell. |
| **Duplicado Suspeito** | `DuplicateSuspected` | Potential duplicate entry detected in imported dataset. | Merged or flagged for admin review. |

---

## 3. Allowed vs Restricted Field Edits

To safeguard confidential member data, Cell Leaders are restricted to editing only operational and contact fields:

### ✅ Allowed Fields for Cell Leader:
- `full_name`
- `primary_phone`
- `secondary_phone`
- `email`
- `neighborhood` / `bairro`
- `occupation` / `profissao`
- `marital_status`
- `kingschat_username`
- `reconciliation_notes`

### ❌ Restricted Fields (Blocked for Cell Leader):
- `church_id` (Church reassignment requires Church Admin)
- `tithe_status` / `finance_records`
- `pastoral_notes` / `counseling_records`
- `staff_roles` / `permissions`

---

## 4. Missing Members & Candidates Flow

If a cell leader identifies an active cell member who is not present in the system:
1. Leader clicks **"Registar Candidato a Membro"**.
2. Creates a candidate membership record in `public.member_registration_candidates`.
3. The candidate undergoes the standard Cell Ministry validation and Church Admin approval workflow before becoming an official `public.members` record.
