-- ============================================================================
-- Migration 0019 — Member Reconciliation, Cell Transfers & Removal Tracking
-- ============================================================================
-- Enables cell leaders to reconcile historical cell members, record confirmation,
-- submit transfer requests, and log member removal reasons without deleting rows.
-- ============================================================================

-- Reconcilation columns on public.members
ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS reconciliation_status text NOT NULL DEFAULT 'Pending',
  ADD COLUMN IF NOT EXISTS confirmed_by uuid REFERENCES public.users (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reconciliation_notes text;

CREATE INDEX IF NOT EXISTS idx_members_reconciliation_status ON public.members (reconciliation_status);
CREATE INDEX IF NOT EXISTS idx_members_confirmed_by ON public.members (confirmed_by);

-- Transfer requests table
CREATE TABLE IF NOT EXISTS public.cell_transfer_requests (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id             uuid NOT NULL REFERENCES public.members (id) ON DELETE CASCADE,
  member_name           text,
  from_cell_id          text NOT NULL,
  from_cell_name        text,
  from_cell_group_id    text,
  from_cell_group_name  text,
  to_cell_id            text,
  to_cell_name          text,
  to_cell_group_id      text,
  to_cell_group_name    text,
  church_id             uuid REFERENCES public.churches (id) ON DELETE SET NULL,
  requested_by          uuid REFERENCES public.users (id) ON DELETE SET NULL,
  requested_by_name     text,
  reason                text NOT NULL,
  notes                 text,
  status                text NOT NULL DEFAULT 'Submitted',
  reviewed_by           uuid REFERENCES public.users (id) ON DELETE SET NULL,
  reviewed_by_name      text,
  reviewed_at           timestamptz,
  rejection_reason      text,
  metadata              jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cell_transfer_status_check CHECK (
    status IN ('Draft', 'Submitted', 'Approved', 'Rejected', 'Cancelled')
  )
);

CREATE INDEX IF NOT EXISTS idx_cell_transfers_member_id ON public.cell_transfer_requests (member_id);
CREATE INDEX IF NOT EXISTS idx_cell_transfers_from_cell ON public.cell_transfer_requests (from_cell_id);
CREATE INDEX IF NOT EXISTS idx_cell_transfers_to_cell ON public.cell_transfer_requests (to_cell_id);
CREATE INDEX IF NOT EXISTS idx_cell_transfers_status ON public.cell_transfer_requests (status);
CREATE INDEX IF NOT EXISTS idx_cell_transfers_church ON public.cell_transfer_requests (church_id);

DROP TRIGGER IF EXISTS trg_cell_transfer_requests_updated_at ON public.cell_transfer_requests;
CREATE TRIGGER trg_cell_transfer_requests_updated_at
  BEFORE UPDATE ON public.cell_transfer_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Removal tracking audit log
CREATE TABLE IF NOT EXISTS public.cell_member_removal_logs (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id             uuid NOT NULL REFERENCES public.members (id) ON DELETE CASCADE,
  cell_id               text NOT NULL,
  cell_group_id         text,
  church_id             uuid REFERENCES public.churches (id) ON DELETE SET NULL,
  removed_by            uuid REFERENCES public.users (id) ON DELETE SET NULL,
  removed_by_name       text,
  reason                text NOT NULL,
  notes                 text,
  removed_at            timestamptz NOT NULL DEFAULT now(),
  metadata              jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT cell_member_removal_reason_check CHECK (
    reason IN (
      'Transferido',
      'Mudou de igreja',
      'Inactivo',
      'Pertence a outra célula',
      'Registo incorrecto',
      'Falecido',
      'Outro'
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_removal_logs_member_id ON public.cell_member_removal_logs (member_id);
CREATE INDEX IF NOT EXISTS idx_removal_logs_cell_id ON public.cell_member_removal_logs (cell_id);
CREATE INDEX IF NOT EXISTS idx_removal_logs_reason ON public.cell_member_removal_logs (reason);

INSERT INTO public.schema_meta (key, value)
VALUES ('backend_phase', '19_member_reconciliation_and_transfers')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
