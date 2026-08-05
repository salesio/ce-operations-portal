-- Backend Phase 12: Reports + Notifications + Audit Hardening pilot.
-- Additive/idempotent migration. Public clients use the anon key only.
-- Never persist passwords, tokens, API keys, service-role values, or confidential content.

CREATE TABLE IF NOT EXISTS public.report_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), report_key text UNIQUE NOT NULL,
  report_name text NOT NULL, description text, module_key text NOT NULL, category text,
  default_filters jsonb DEFAULT '{}'::jsonb, available_filters jsonb DEFAULT '[]'::jsonb,
  available_columns jsonb DEFAULT '[]'::jsonb, requires_permission text,
  sensitivity_level text DEFAULT 'Normal', supports_export boolean DEFAULT true,
  supports_snapshot boolean DEFAULT true, supports_scheduling boolean DEFAULT false,
  status text DEFAULT 'Active', metadata jsonb DEFAULT '{}'::jsonb,
  created_by uuid, updated_by uuid, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_report_definitions_module ON public.report_definitions(module_key);
CREATE INDEX IF NOT EXISTS idx_report_definitions_category ON public.report_definitions(category);
CREATE INDEX IF NOT EXISTS idx_report_definitions_status ON public.report_definitions(status);
CREATE INDEX IF NOT EXISTS idx_report_definitions_sensitivity ON public.report_definitions(sensitivity_level);

CREATE TABLE IF NOT EXISTS public.saved_report_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), report_definition_id uuid REFERENCES public.report_definitions(id),
  report_key text NOT NULL, view_name text NOT NULL, description text, owner_user_id uuid, owner_name text,
  church_id uuid REFERENCES public.churches(id), church_name text, scope text DEFAULT 'Private',
  filters jsonb DEFAULT '{}'::jsonb, columns jsonb DEFAULT '[]'::jsonb, sort_config jsonb DEFAULT '{}'::jsonb,
  is_default boolean DEFAULT false, is_favorite boolean DEFAULT false, status text DEFAULT 'Active',
  metadata jsonb DEFAULT '{}'::jsonb, created_by uuid, updated_by uuid,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_saved_report_views_report_key ON public.saved_report_views(report_key);
CREATE INDEX IF NOT EXISTS idx_saved_report_views_owner ON public.saved_report_views(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_saved_report_views_scope ON public.saved_report_views(scope);
CREATE INDEX IF NOT EXISTS idx_saved_report_views_status ON public.saved_report_views(status);

CREATE TABLE IF NOT EXISTS public.report_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), report_definition_id uuid REFERENCES public.report_definitions(id),
  report_key text NOT NULL, snapshot_title text, snapshot_date timestamptz DEFAULT now(), module_key text,
  church_id uuid REFERENCES public.churches(id), church_name text, filters jsonb DEFAULT '{}'::jsonb,
  summary_metrics jsonb DEFAULT '{}'::jsonb, chart_data jsonb DEFAULT '{}'::jsonb,
  table_preview jsonb DEFAULT '[]'::jsonb, row_count integer DEFAULT 0,
  sensitivity_level text DEFAULT 'Normal', created_by uuid, created_by_name text,
  status text DEFAULT 'Active', metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_report_snapshots_report_key ON public.report_snapshots(report_key);
CREATE INDEX IF NOT EXISTS idx_report_snapshots_module ON public.report_snapshots(module_key);
CREATE INDEX IF NOT EXISTS idx_report_snapshots_church_id ON public.report_snapshots(church_id);
CREATE INDEX IF NOT EXISTS idx_report_snapshots_date ON public.report_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_report_snapshots_sensitivity ON public.report_snapshots(sensitivity_level);

CREATE TABLE IF NOT EXISTS public.report_export_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), report_key text NOT NULL, report_name text,
  requested_by uuid, requested_by_name text, church_id uuid REFERENCES public.churches(id), church_name text,
  export_format text DEFAULT 'CSV', filters jsonb DEFAULT '{}'::jsonb, columns jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'Queued', file_document_id uuid, file_name text, file_url text, storage_path text,
  row_count integer DEFAULT 0, started_at timestamptz, completed_at timestamptz, failed_at timestamptz,
  error_message text, sensitivity_level text DEFAULT 'Normal', metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_report_export_jobs_report_key ON public.report_export_jobs(report_key);
CREATE INDEX IF NOT EXISTS idx_report_export_jobs_requested_by ON public.report_export_jobs(requested_by);
CREATE INDEX IF NOT EXISTS idx_report_export_jobs_status ON public.report_export_jobs(status);
CREATE INDEX IF NOT EXISTS idx_report_export_jobs_created_at ON public.report_export_jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_report_export_jobs_sensitivity ON public.report_export_jobs(sensitivity_level);

-- Create when absent, then expand legacy installations without breaking repositories.
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), recipient_user_id uuid, recipient_role_id uuid,
  recipient_department_id uuid, recipient_church_id uuid, church_id uuid REFERENCES public.churches(id),
  church_name text, title text NOT NULL, message text, type text DEFAULT 'info', notification_type text,
  category text, module text, module_key text, entity_type text, entity_id uuid, priority text DEFAULT 'Normal',
  status text DEFAULT 'Unread', scope text DEFAULT 'national', is_read boolean DEFAULT false,
  read_at timestamptz, dismissed_at timestamptz, action_url text, action_label text,
  created_by uuid, created_by_name text, expires_at timestamptz, metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS recipient_role_id uuid;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS church_id uuid REFERENCES public.churches(id);
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS church_name text;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS notification_type text;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS module_key text;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS status text DEFAULT 'Unread';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS dismissed_at timestamptz;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS action_label text;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS created_by_name text;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS expires_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_role ON public.notifications(recipient_role_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON public.notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_module ON public.notifications(module_key);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON public.notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

CREATE TABLE IF NOT EXISTS public.notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), template_key text UNIQUE NOT NULL, template_name text NOT NULL,
  module_key text, category text, title_template text NOT NULL, message_template text,
  default_priority text DEFAULT 'Normal', default_type text DEFAULT 'Info', default_action_label text,
  is_active boolean DEFAULT true, metadata jsonb DEFAULT '{}'::jsonb, created_by uuid, updated_by uuid,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notification_templates_key ON public.notification_templates(template_key);
CREATE INDEX IF NOT EXISTS idx_notification_templates_module ON public.notification_templates(module_key);
CREATE INDEX IF NOT EXISTS idx_notification_templates_active ON public.notification_templates(is_active);

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, module_key text, category text,
  in_app_enabled boolean DEFAULT true, email_enabled boolean DEFAULT false, sms_enabled boolean DEFAULT false,
  whatsapp_enabled boolean DEFAULT false, push_enabled boolean DEFAULT false, quiet_hours_start text,
  quiet_hours_end text, frequency text DEFAULT 'Immediate', metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON public.notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_module ON public.notification_preferences(module_key);

-- Audit entity_id remains text for compatibility with historical non-UUID local identifiers.
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), event_type text, event_action text, module_key text,
  entity_type text, entity_id text, actor_user_id uuid, actor_name text, actor_role text,
  church_id uuid REFERENCES public.churches(id), church_name text, target_user_id uuid, target_name text,
  severity text DEFAULT 'Info', success boolean DEFAULT true, ip_address text, user_agent text,
  before_data jsonb DEFAULT '{}'::jsonb, after_data jsonb DEFAULT '{}'::jsonb, changes jsonb DEFAULT '{}'::jsonb,
  message text, metadata jsonb DEFAULT '{}'::jsonb, user_id uuid, user_name text, user_role text,
  module text, action text, entity_label text, old_value jsonb, new_value jsonb, description text,
  created_at timestamptz DEFAULT now()
);
-- Harden the legacy audit table while retaining its original aliases.
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS event_type text;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS event_action text;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS module_key text;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS actor_user_id uuid;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS actor_name text;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS actor_role text;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS church_id uuid REFERENCES public.churches(id);
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS church_name text;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS target_user_id uuid;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS target_name text;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS success boolean DEFAULT true;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS ip_address text;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS user_agent text;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS before_data jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS after_data jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS changes jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS message text;
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON public.audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON public.audit_logs(severity);

CREATE TABLE IF NOT EXISTS public.sensitive_access_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), access_type text NOT NULL, module_key text NOT NULL,
  entity_type text, entity_id uuid, actor_user_id uuid, actor_name text, actor_role text,
  church_id uuid REFERENCES public.churches(id), church_name text, sensitivity_level text,
  reason text, allowed boolean DEFAULT false, denied_reason text, field_names jsonb DEFAULT '[]'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb, created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sensitive_access_module ON public.sensitive_access_events(module_key);
CREATE INDEX IF NOT EXISTS idx_sensitive_access_actor ON public.sensitive_access_events(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_sensitive_access_entity ON public.sensitive_access_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_sensitive_access_allowed ON public.sensitive_access_events(allowed);
CREATE INDEX IF NOT EXISTS idx_sensitive_access_created_at ON public.sensitive_access_events(created_at);

CREATE TABLE IF NOT EXISTS public.system_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), event_key text, event_type text, module_key text,
  title text, message text, severity text DEFAULT 'Info', status text DEFAULT 'Open', source text,
  source_id uuid, metadata jsonb DEFAULT '{}'::jsonb, created_at timestamptz DEFAULT now(),
  resolved_at timestamptz, resolved_by uuid, resolved_by_name text
);
CREATE INDEX IF NOT EXISTS idx_system_events_event_key ON public.system_events(event_key);
CREATE INDEX IF NOT EXISTS idx_system_events_module ON public.system_events(module_key);
CREATE INDEX IF NOT EXISTS idx_system_events_status ON public.system_events(status);
CREATE INDEX IF NOT EXISTS idx_system_events_severity ON public.system_events(severity);
CREATE INDEX IF NOT EXISTS idx_system_events_created_at ON public.system_events(created_at);

CREATE TABLE IF NOT EXISTS public.data_source_health_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), data_source text NOT NULL, module_key text,
  status text DEFAULT 'Unknown', checked_at timestamptz DEFAULT now(), latency_ms integer,
  message text, details jsonb DEFAULT '{}'::jsonb, metadata jsonb DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_data_source_health_source ON public.data_source_health_checks(data_source);
CREATE INDEX IF NOT EXISTS idx_data_source_health_module ON public.data_source_health_checks(module_key);
CREATE INDEX IF NOT EXISTS idx_data_source_health_status ON public.data_source_health_checks(status);
CREATE INDEX IF NOT EXISTS idx_data_source_health_checked_at ON public.data_source_health_checks(checked_at);

-- Reuse the foundation trigger function for mutable Phase 12 tables.
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['report_definitions','saved_report_views','report_snapshots','report_export_jobs','notifications','notification_templates','notification_preferences']
  LOOP EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_updated_at ON public.%I', t, t);
       EXECUTE format('CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', t, t);
  END LOOP;
END $$;

COMMENT ON TABLE public.report_snapshots IS 'Sanitized report aggregates only; no full confidential notes, salary details, or proof files.';
COMMENT ON TABLE public.report_export_jobs IS 'Export job metadata; sensitive files must remain in private storage.';
COMMENT ON TABLE public.notification_preferences IS 'Only in-app delivery is functional in Phase 12.';
COMMENT ON TABLE public.audit_logs IS 'Sanitized audit references; never store secrets or complete confidential content.';
COMMENT ON TABLE public.sensitive_access_events IS 'Sensitive access references and field names only; never sensitive content.';
COMMENT ON TABLE public.data_source_health_checks IS 'Sanitized readiness flags/messages only; never environment values.';
