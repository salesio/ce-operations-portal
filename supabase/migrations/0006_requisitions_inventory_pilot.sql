-- Backend Phase 6 - Requisitions + Venue/Inventory Supabase pilot
-- Safe migration: creates tables/indexes only; no destructive operations.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.requisitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number text UNIQUE,
  title text NOT NULL,
  description text,
  justification text,
  request_type text,
  urgency text,
  church_id uuid REFERENCES public.churches(id),
  church_name text,
  department_id text,
  department_name text,
  requested_by uuid,
  requested_by_name text,
  estimated_amount numeric DEFAULT 0,
  approved_amount numeric DEFAULT 0,
  currency text DEFAULT 'MZN',
  needed_by date,
  status text DEFAULT 'Draft',
  reviewed_by uuid,
  reviewed_by_name text,
  reviewed_at timestamptz,
  review_notes text,
  forwarded_to_main_pastor_by uuid,
  forwarded_to_main_pastor_by_name text,
  forwarded_at timestamptz,
  approved_by uuid,
  approved_by_name text,
  approved_at timestamptz,
  approval_notes text,
  rejected_by uuid,
  rejected_by_name text,
  rejected_at timestamptz,
  rejection_reason text,
  returned_by uuid,
  returned_by_name text,
  returned_at timestamptz,
  return_reason text,
  finance_status text DEFAULT 'Not Required',
  finance_disbursement_id uuid REFERENCES public.finance_disbursements(id),
  inventory_required boolean DEFAULT false,
  inventory_status text DEFAULT 'Not Required',
  inventory_item_ids jsonb DEFAULT '[]'::jsonb,
  supplier_name text,
  quotation_document_id uuid,
  attachment_document_ids jsonb DEFAULT '[]'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.requisition_timeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requisition_id uuid REFERENCES public.requisitions(id) ON DELETE CASCADE,
  event_type text,
  title text,
  description text,
  old_status text,
  new_status text,
  performed_by uuid,
  performed_by_name text,
  event_date timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.venue_spaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES public.churches(id),
  church_name text,
  name text NOT NULL,
  description text,
  space_type text,
  capacity integer,
  responsible_user_id uuid,
  responsible_name text,
  status text DEFAULT 'Available',
  notes text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_code text UNIQUE,
  name text NOT NULL,
  description text,
  category text,
  subcategory text,
  brand text,
  model text,
  serial_number text,
  quantity numeric DEFAULT 1,
  unit text DEFAULT 'unit',
  church_id uuid REFERENCES public.churches(id),
  church_name text,
  department_id text,
  department_name text,
  space_id uuid,
  space_name text,
  assigned_to_user_id uuid,
  assigned_to_name text,
  assigned_to_role text,
  acquisition_source text DEFAULT 'Manual Entry',
  acquisition_date date,
  acquisition_cost numeric DEFAULT 0,
  currency text DEFAULT 'MZN',
  requisition_id uuid REFERENCES public.requisitions(id),
  request_number text,
  finance_disbursement_id uuid REFERENCES public.finance_disbursements(id),
  supplier_name text,
  warranty_start date,
  warranty_end date,
  status text DEFAULT 'Available',
  condition text DEFAULT 'Good',
  location_notes text,
  usage_notes text,
  photo_document_id uuid,
  attachment_document_ids jsonb DEFAULT '[]'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  item_code text,
  item_name text,
  movement_type text,
  from_church_id uuid,
  from_church_name text,
  from_space_id uuid,
  from_space_name text,
  from_user_id uuid,
  from_user_name text,
  to_church_id uuid,
  to_church_name text,
  to_space_id uuid,
  to_space_name text,
  to_user_id uuid,
  to_user_name text,
  quantity numeric DEFAULT 1,
  reason text,
  notes text,
  movement_date timestamptz DEFAULT now(),
  performed_by uuid,
  performed_by_name text,
  approved_by uuid,
  approved_by_name text,
  approved_at timestamptz,
  status text DEFAULT 'Completed',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inventory_maintenance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  item_code text,
  item_name text,
  issue_title text,
  issue_description text,
  reported_by uuid,
  reported_by_name text,
  reported_at timestamptz DEFAULT now(),
  assigned_to_user_id uuid,
  assigned_to_name text,
  repair_vendor text,
  estimated_cost numeric DEFAULT 0,
  actual_cost numeric DEFAULT 0,
  currency text DEFAULT 'MZN',
  status text DEFAULT 'Reported',
  priority text DEFAULT 'Normal',
  started_at timestamptz,
  completed_at timestamptz,
  resolution_notes text,
  attachment_document_ids jsonb DEFAULT '[]'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.service_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES public.churches(id),
  church_name text,
  service_name text,
  service_date date,
  service_time text,
  checklist_type text,
  responsible_user_id uuid,
  responsible_name text,
  sound_ready boolean DEFAULT false,
  microphones_ready boolean DEFAULT false,
  cameras_ready boolean DEFAULT false,
  streaming_ready boolean DEFAULT false,
  projector_ready boolean DEFAULT false,
  lights_ready boolean DEFAULT false,
  ac_ready boolean DEFAULT false,
  chairs_ready boolean DEFAULT false,
  pulpit_ready boolean DEFAULT false,
  cleaning_ready boolean DEFAULT false,
  instruments_ready boolean DEFAULT false,
  power_backup_ready boolean DEFAULT false,
  issues_found text,
  actions_taken text,
  status text DEFAULT 'Open',
  completed_by uuid,
  completed_by_name text,
  completed_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_requisitions_status ON public.requisitions(status);
CREATE INDEX IF NOT EXISTS idx_requisitions_church_id ON public.requisitions(church_id);
CREATE INDEX IF NOT EXISTS idx_requisitions_department_id ON public.requisitions(department_id);
CREATE INDEX IF NOT EXISTS idx_requisitions_requested_by ON public.requisitions(requested_by);
CREATE INDEX IF NOT EXISTS idx_requisitions_finance_status ON public.requisitions(finance_status);
CREATE INDEX IF NOT EXISTS idx_requisitions_inventory_status ON public.requisitions(inventory_status);
CREATE INDEX IF NOT EXISTS idx_requisitions_request_number ON public.requisitions(request_number);
CREATE INDEX IF NOT EXISTS idx_requisition_timeline_requisition_id ON public.requisition_timeline_events(requisition_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_church_id ON public.inventory_items(church_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON public.inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_items_status ON public.inventory_items(status);
CREATE INDEX IF NOT EXISTS idx_inventory_items_condition ON public.inventory_items(condition);
CREATE INDEX IF NOT EXISTS idx_inventory_items_assigned_to ON public.inventory_items(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_requisition_id ON public.inventory_items(requisition_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_item_id ON public.inventory_movements(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_maintenance_item_id ON public.inventory_maintenance_records(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_maintenance_status ON public.inventory_maintenance_records(status);
CREATE INDEX IF NOT EXISTS idx_venue_spaces_church_id ON public.venue_spaces(church_id);
CREATE INDEX IF NOT EXISTS idx_service_checklists_church_id ON public.service_checklists(church_id);
CREATE INDEX IF NOT EXISTS idx_service_checklists_date ON public.service_checklists(service_date);
CREATE INDEX IF NOT EXISTS idx_service_checklists_status ON public.service_checklists(status);
