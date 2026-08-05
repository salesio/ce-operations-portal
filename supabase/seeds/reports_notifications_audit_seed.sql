-- Synthetic Phase 12 demo data only.
INSERT INTO public.report_definitions (id,report_key,report_name,module_key,category,sensitivity_level,requires_permission,metadata) VALUES
('12000000-0000-4000-8000-000000000001','finance-overview','Finance Overview','finance','Finance','Financial','finance.view', '{"demo":true,"read_only":true}'),
('12000000-0000-4000-8000-000000000002','partnerships-summary','Partnerships Summary','partnerships','Finance','Financial','finance.view', '{"verified_only":true}'),
('12000000-0000-4000-8000-000000000003','first-timers-weekly','First Timers Weekly','firstTimers','Attendance','Normal',null,'{}'),
('12000000-0000-4000-8000-000000000004','foundation-progress','Foundation School Progress','foundationSchool','Operational','Normal',null,'{}'),
('12000000-0000-4000-8000-000000000005','requisitions-status','Requisitions Status','requisitions','Operational','Normal',null,'{}'),
('12000000-0000-4000-8000-000000000006','inventory-assets','Inventory Assets','venueInventory','Inventory','Restricted','inventory.view','{}'),
('12000000-0000-4000-8000-000000000007','staff-overview','Staff Overview','staffHr','Staff','Restricted','staff.view','{"salary_details":false}'),
('12000000-0000-4000-8000-000000000008','programs-calendar','Programs Calendar','programs','Programs','Normal',null,'{}'),
('12000000-0000-4000-8000-000000000009','media-schedule','Media Schedule','media','Programs','Normal',null,'{}'),
('12000000-0000-4000-8000-000000000010','counseling-summary','Counseling Summary','counseling','Pastoral','Pastoral Confidential','counseling.reports','{"aggregate_only":true}'),
('12000000-0000-4000-8000-000000000011','sacraments-summary','Sacraments Summary','sacraments','Pastoral','Restricted','sacraments.view','{"private_documents":true}'),
('12000000-0000-4000-8000-000000000012','fevo-weekly','FEVO Weekly','fevo','Operational','Normal',null,'{}'),
('12000000-0000-4000-8000-000000000013','prison-activity','Prison Ministry Activity','prisonMinistry','Pastoral','Restricted','prison.view','{"aggregate_only":true}'),
('12000000-0000-4000-8000-000000000014','materials-stock','Ministry Materials Stock','ministryMaterials','Inventory','Restricted','materials.view','{"internal_funds":true}')
ON CONFLICT (report_key) DO UPDATE SET report_name=EXCLUDED.report_name, metadata=EXCLUDED.metadata;

INSERT INTO public.saved_report_views (id,report_definition_id,report_key,view_name,owner_name,scope,filters,is_default,metadata) VALUES
('12100000-0000-4000-8000-000000000001','12000000-0000-4000-8000-000000000001','finance-overview','Finance Current Month','Demo Finance User','Private','{"period":"current_month"}',true,'{"demo":true}'),
('12100000-0000-4000-8000-000000000002','12000000-0000-4000-8000-000000000008','programs-calendar','National Programs','Demo Admin','Global','{"status":"Active"}',false,'{"demo":true}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.report_snapshots (id,report_definition_id,report_key,snapshot_title,module_key,summary_metrics,row_count,sensitivity_level,metadata) VALUES
('12200000-0000-4000-8000-000000000001','12000000-0000-4000-8000-000000000010','counseling-summary','Counseling aggregate demo','counseling','{"open":4,"closed":7}',0,'Pastoral Confidential','{"demo":true,"aggregate_only":true,"sanitized":true}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.report_export_jobs (id,report_key,report_name,requested_by_name,export_format,status,file_name,row_count,sensitivity_level,metadata) VALUES
('12300000-0000-4000-8000-000000000001','programs-calendar','Programs Calendar','Demo Admin','CSV','Completed','programs-calendar-demo.csv',12,'Normal','{"demo":true,"metadata_job_only":true,"private_storage_required":true}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.notifications (id,title,message,notification_type,category,module_key,priority,status,metadata) VALUES
('12400000-0000-4000-8000-000000000001','Finance verification pending','A synthetic giving submission is awaiting verification.','Approval','Finance','finance','High','Unread','{"demo":true,"in_app_only":true,"idempotency_key":"demo-finance-1"}'),
('12400000-0000-4000-8000-000000000002','Requisition approval','A synthetic requisition requires review.','Approval','Operations','requisitions','Normal','Unread','{"demo":true,"in_app_only":true,"idempotency_key":"demo-req-1"}'),
('12400000-0000-4000-8000-000000000003','Counseling assignment','A synthetic counseling request was assigned.','Sensitive','Pastoral','counseling','High','Unread','{"demo":true,"in_app_only":true,"content_included":false}'),
('12400000-0000-4000-8000-000000000004','FEVO report missing','Team C report is pending.','Reminder','Operational','fevo','High','Unread','{"demo":true,"in_app_only":true,"idempotency_key":"demo-fevo-1"}'),
('12400000-0000-4000-8000-000000000005','Report ready','The synthetic export metadata job completed.','Success','Reports','reports','Normal','Read','{"demo":true,"in_app_only":true}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.notification_templates (id,template_key,template_name,module_key,title_template,message_template,default_priority,default_type,metadata) VALUES
('12500000-0000-4000-8000-000000000001','approval-request','Approval request','system','Approval required','{{item}} requires approval.','High','Approval','{"in_app_only":true}'),
('12500000-0000-4000-8000-000000000002','verification-pending','Verification pending','finance','Verification pending','{{item}} is awaiting verification.','High','Reminder','{"in_app_only":true}'),
('12500000-0000-4000-8000-000000000003','report-ready','Report ready','reports','Report ready','{{report_name}} is ready.','Normal','Success','{"in_app_only":true}'),
('12500000-0000-4000-8000-000000000004','sensitive-access-denied','Sensitive access denied','audit','Access denied','Access to {{entity_type}} was denied.','Urgent','Sensitive','{"in_app_only":true,"content_included":false}'),
('12500000-0000-4000-8000-000000000005','missing-report','Missing report','reports','Report missing','{{report_name}} is still pending.','High','Reminder','{"in_app_only":true}')
ON CONFLICT (template_key) DO UPDATE SET template_name=EXCLUDED.template_name;

INSERT INTO public.audit_logs (id,event_type,event_action,module_key,actor_name,severity,success,message,metadata) VALUES
('12600000-0000-4000-8000-000000000001','Report Export','requested','reports','Demo Admin','Info',true,'Synthetic export metadata requested.','{"demo":true,"sanitized":true}'),
('12600000-0000-4000-8000-000000000002','Access Denied','view','counseling','Demo Viewer','Security',false,'Synthetic confidential access denied.','{"demo":true,"reference_only":true}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.sensitive_access_events (id,access_type,module_key,entity_type,actor_name,sensitivity_level,reason,allowed,denied_reason,field_names,metadata) VALUES
('12700000-0000-4000-8000-000000000001','View Salary','staffHr','StaffSalary','Demo HR','Confidential','Authorized review',true,null,'["salary_summary"]','{"demo":true,"reference_only":true}'),
('12700000-0000-4000-8000-000000000002','View Confidential Counseling','counseling','CounselingCase','Demo Viewer','Pastoral Confidential','Synthetic access test',false,'Additional permission required','["confidential_notes"]','{"demo":true,"reference_only":true,"content_included":false}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.system_events (id,event_key,event_type,module_key,title,message,severity,status,metadata) VALUES
('12800000-0000-4000-8000-000000000001','phase12-readiness-demo','Readiness','settings','Phase 12 readiness demo','Synthetic readiness event.','Info','Open','{"demo":true}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.data_source_health_checks (id,data_source,module_key,status,latency_ms,message,details,metadata) VALUES
('12900000-0000-4000-8000-000000000001','mock','all','Healthy',0,'Synthetic mock check.','{"configured":true}','{"demo":true}'),
('12900000-0000-4000-8000-000000000002','local','all','Healthy',1,'Synthetic local check.','{"configured":true}','{"demo":true}'),
('12900000-0000-4000-8000-000000000003','supabase','reports','Misconfigured',null,'Synthetic configuration check.','{"configured":false,"values_exposed":false}','{"demo":true}')
ON CONFLICT (id) DO NOTHING;
