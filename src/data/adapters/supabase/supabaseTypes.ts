/**
 * Base types for Supabase adapter foundation (Phase 1).
 * Full generated DB types can replace these later (supabase gen types).
 */

export type SupabaseTableName =
  | "churches"
  | "users"
  | "roles"
  | "permissions"
  | "staff_members"
  | "staff_departments"
  | "staff_roles"
  | "staff_salaries"
  | "staff_performance_reviews"
  | "staff_documents"
  | "staff_attendance"
  | "members"
  | "first_timers"
  | "follow_ups"
  | "follow_up_timeline_events"
  | "finance_records"
  | "public_giving_submissions"
  | "finance_disbursements"
  | "requisitions"
  | "requisition_timeline_events"
  | "inventory_items"
  | "inventory_movements"
  | "inventory_maintenance_records"
  | "venue_spaces"
  | "service_checklists"
  | "foundation_school_enrollments"
  | "foundation_school_classes"
  | "foundation_school_students"
  | "foundation_school_teachers"
  | "foundation_school_lessons"
  | "foundation_school_lesson_progress"
  | "foundation_school_attendance"
  | "foundation_school_online_tests"
  | "foundation_school_test_results"
  | "foundation_school_soul_winning"
  | "foundation_school_final_exams"
  | "foundation_school_graduations"
  | "programs"
  | "program_sessions"
  | "program_teams"
  | "program_participants"
  | "program_registrations"
  | "program_resources"
  | "program_budgets"
  | "program_checklists"
  | "program_reports"
  | "media_roles"
  | "media_team_members"
  | "media_services"
  | "media_schedules"
  | "media_channels"
  | "media_performance_records"
  | "media_awards"
  | "documents"
  | "notifications"
  | "audit_logs"
  | "system_settings";

export type SupabaseRow = Record<string, unknown> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
  metadata?: Record<string, unknown>;
};

export type SupabaseResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string };

export type SupabaseProviderStatus =
  | "disabled"
  | "missing_env"
  | "ready"
  | "error";

export interface SupabaseConnectionInfo {
  status: SupabaseProviderStatus;
  enabled: boolean;
  hasUrl: boolean;
  hasAnonKey: boolean;
  urlHost?: string;
  /** Never expose key material */
  usingServiceRole: false;
  message: string;
}
