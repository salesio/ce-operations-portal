-- Synthetic Phase 11 seed only. No real people, inmate identities, criminal data, or Finance records.

INSERT INTO public.fevo_weekly_configs (id,week_start_date,week_end_date,config_title,team_a_activity_type,team_b_activity_type,team_c_activity_type,team_d_activity_type,status,activated_by_name,activated_at,metadata) VALUES
('31000000-0000-4000-8000-000000000001',current_date-date_part('dow',current_date)::int,current_date-date_part('dow',current_date)::int+6,'Demo F.E.V.O Week','Follow-Up','Evangelização','Visitação','Oração','Active','Demo F.E.V.O Lead',now(),'{"synthetic":true}')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.fevo_activities (id,weekly_config_id,team_key,team_name,activity_type,activity_date,expected_report_date,status,metadata) VALUES
('31100000-0000-4000-8000-000000000001','31000000-0000-4000-8000-000000000001','A','Team A','Follow-Up',current_date,current_date+5,'Report Submitted','{"synthetic":true}'),
('31100000-0000-4000-8000-000000000002','31000000-0000-4000-8000-000000000001','B','Team B','Evangelização',current_date,current_date+5,'Validated','{"synthetic":true}'),
('31100000-0000-4000-8000-000000000003','31000000-0000-4000-8000-000000000001','C','Team C','Visitação',current_date,current_date+5,'Needs Correction','{"synthetic":true}'),
('31100000-0000-4000-8000-000000000004','31000000-0000-4000-8000-000000000001','D','Team D','Oração',current_date-7,current_date-2,'Missing Report','{"synthetic":true}')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.fevo_reports (id,activity_id,weekly_config_id,team_key,team_name,activity_type,report_date,submitted_by_name,status,validated_by_name,validated_at,rejection_reason,summary,total_people_contacted,total_first_timers,total_new_converts,total_prayer_requests,total_testimonies,metadata) VALUES
('31200000-0000-4000-8000-000000000001','31100000-0000-4000-8000-000000000001','31000000-0000-4000-8000-000000000001','A','Team A','Follow-Up',current_date,'Demo Team Lead','Submitted',null,null,null,'Synthetic submitted report.',12,0,0,3,1,'{"synthetic":true,"follow_up_created":false}'),
('31200000-0000-4000-8000-000000000002','31100000-0000-4000-8000-000000000002','31000000-0000-4000-8000-000000000001','B','Team B','Evangelização',current_date,'Demo Team Lead','Validated','Demo F.E.V.O Lead',now(),null,'Synthetic validated report.',40,5,4,8,2,'{"synthetic":true,"first_timer_created":false}'),
('31200000-0000-4000-8000-000000000003','31100000-0000-4000-8000-000000000003','31000000-0000-4000-8000-000000000001','C','Team C','Visitação',current_date,'Demo Team Lead','Needs Correction',null,null,'Please confirm aggregate totals.','Synthetic correction scenario.',18,0,0,6,1,'{"synthetic":true,"follow_up_created":false}')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.fevo_evangelism_records (id,report_id,location,evangelism_date,team_name,people_reached,souls_won,first_timers_invited,first_timers_attended,created_first_timer_ids,testimonies,metadata) VALUES
('31300000-0000-4000-8000-000000000001','31200000-0000-4000-8000-000000000002','Demo public area',current_date,'Team B',40,4,5,2,'[]','Synthetic aggregate testimony.','{"synthetic":true,"automatic_first_timer_creation":false}') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.fevo_visitation_records (id,report_id,visitation_date,location,families_visited,people_visited,new_converts_visited,members_visited,prayer_requests_count,testimonies_count,follow_up_required,follow_up_ids,metadata) VALUES
('31400000-0000-4000-8000-000000000001','31200000-0000-4000-8000-000000000003',current_date,'Demo neighbourhood',4,18,2,8,6,1,true,'[]','{"synthetic":true,"automatic_follow_up_creation":false}') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.fevo_prayer_records (id,report_id,prayer_date,location,total_attendance,prayer_requests_count,testimonies_count,new_converts_prayed_for,main_prayer_points,metadata) VALUES
('31500000-0000-4000-8000-000000000001','31200000-0000-4000-8000-000000000001',current_date,'Demo prayer venue',22,8,2,3,'Synthetic prayer themes only.','{"synthetic":true}') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.fevo_missing_reports (id,activity_id,weekly_config_id,team_key,team_name,activity_type,expected_report_date,status,resolved,metadata) VALUES
('31600000-0000-4000-8000-000000000001','31100000-0000-4000-8000-000000000004','31000000-0000-4000-8000-000000000001','D','Team D','Oração',current_date-2,'Missing',false,'{"synthetic":true,"notification_sent":false}') ON CONFLICT (id) DO NOTHING;

INSERT INTO public.prison_locations (id,location_code,name,province,city,location_type,responsible_name,contact_person_name,contact_phone,status,metadata) VALUES
('32000000-0000-4000-8000-000000000001','PR-DEMO-001','Demo Operational Centre North','Maputo','Maputo','Prison','Demo Ministry Lead','Demo Institutional Contact','+258 840 100 001','Active','{"synthetic":true,"operational_only":true}'),
('32000000-0000-4000-8000-000000000002','PR-DEMO-002','Demo Operational Centre Central','Sofala','Beira','Prison','Demo Ministry Lead','Demo Institutional Contact','+258 840 100 002','Active','{"synthetic":true,"operational_only":true}'),
('32000000-0000-4000-8000-000000000003','PR-DEMO-003','Demo Operational Centre South','Gaza','Xai-Xai','Prison','Demo Ministry Lead','Demo Institutional Contact','+258 840 100 003','Active','{"synthetic":true,"operational_only":true}')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.prison_services (id,prison_location_id,service_date,service_type,responsible_name,attendance_count,new_converts_count,testimonies_count,prayer_requests_count,materials_distributed,status,summary,metadata) VALUES
('32100000-0000-4000-8000-000000000001','32000000-0000-4000-8000-000000000001',current_date-7,'Culto','Demo Ministry Lead',80,6,3,12,'[{"item":"Demo Rhapsody","quantity":80}]','Completed','Synthetic aggregate service report.','{"synthetic":true,"member_created":false,"first_timer_created":false}'),
('32100000-0000-4000-8000-000000000002','32000000-0000-4000-8000-000000000002',current_date+7,'Fundação','Demo Teacher',0,0,0,0,'[]','Planned','Synthetic upcoming service.','{"synthetic":true}')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.prison_foundation_classes (id,prison_location_id,class_code,name,teacher_name,start_date,schedule_day,schedule_time,status,student_count,graduated_count,metadata) VALUES
('32200000-0000-4000-8000-000000000001','32000000-0000-4000-8000-000000000001','PFC-DEMO-001','Demo Prison Foundation Class','Demo Teacher',current_date-30,'Thursday','10:00','Active',2,0,'{"synthetic":true,"separate_from_foundation_school":true}') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.prison_foundation_students (id,prison_class_id,prison_location_id,student_code,display_name,lessons_completed,lesson_progress_percentage,final_exam_score,passed,graduated,status,metadata) VALUES
('32300000-0000-4000-8000-000000000001','32200000-0000-4000-8000-000000000001','32000000-0000-4000-8000-000000000001','PFS-DEMO-001','Pastoral Code PFS-001',4,57.14,0,false,false,'Active','{"synthetic":true,"no_criminal_data":true}'),
('32300000-0000-4000-8000-000000000002','32200000-0000-4000-8000-000000000001','32000000-0000-4000-8000-000000000001','PFS-DEMO-002','Pastoral Code PFS-002',7,100,72,true,true,'Graduated','{"synthetic":true,"no_criminal_data":true,"member_created":false}')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.prison_agenda_items (id,prison_location_id,title,description,agenda_date,start_time,end_time,agenda_type,responsible_name,status,metadata) VALUES
('32400000-0000-4000-8000-000000000001','32000000-0000-4000-8000-000000000002','Demo Foundation Class','Synthetic operational agenda.',current_date+7,'10:00','11:00','Foundation Class','Demo Teacher','Planned','{"synthetic":true}'),
('32400000-0000-4000-8000-000000000002','32000000-0000-4000-8000-000000000001','Demo Materials Delivery','Synthetic delivery agenda.',current_date-7,'09:00','09:30','Materials Delivery','Demo Ministry Lead','Completed','{"synthetic":true}')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.prison_reports (id,prison_location_id,service_id,report_title,report_type,report_date,attendance_count,new_converts_count,testimonies_count,foundation_students_count,materials_distributed_count,summary,status,submitted_by_name,submitted_at,approved_by_name,approved_at,metadata) VALUES
('32500000-0000-4000-8000-000000000001','32000000-0000-4000-8000-000000000001','32100000-0000-4000-8000-000000000001','Demo Weekly Prison Ministry Report','Weekly',current_date-7,80,6,3,2,80,'Synthetic aggregates only.','Approved','Demo Ministry Lead',now()-interval '6 days','Demo Approver',now()-interval '5 days','{"synthetic":true,"no_personal_or_criminal_data":true,"finance_record_created":false}') ON CONFLICT (id) DO NOTHING;

INSERT INTO public.ministry_materials_catalog (id,item_code,title,description,material_type,category,language,unit,default_price,currency,status,is_free,metadata) VALUES
('33000000-0000-4000-8000-000000000001','MAT-DEMO-RHAP','Demo Rhapsody','Synthetic catalogue item.','Rhapsody','Devotional','Portuguese','unit',50,'MZN','Active',false,'{"synthetic":true}'),
('33000000-0000-4000-8000-000000000002','MAT-DEMO-FMAN','Demo Foundation Manual','Synthetic catalogue item.','Foundation Material','Training','Portuguese','unit',100,'MZN','Active',false,'{"synthetic":true}'),
('33000000-0000-4000-8000-000000000003','MAT-DEMO-FLY','Demo Evangelism Flyer','Synthetic catalogue item.','Flyer','Evangelism','Portuguese','unit',0,'MZN','Active',true,'{"synthetic":true}'),
('33000000-0000-4000-8000-000000000004','MAT-DEMO-CHILD','Demo Children Material','Synthetic catalogue item.','Children Material','Children','Portuguese','unit',25,'MZN','Active',false,'{"synthetic":true}')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ministry_materials_stock (id,catalog_item_id,location_name,quantity_available,quantity_reserved,quantity_distributed,quantity_sold,reorder_level,status,metadata) VALUES
('33100000-0000-4000-8000-000000000001','33000000-0000-4000-8000-000000000001','Demo Main Store',500,50,200,40,100,'Available','{"synthetic":true,"separate_from_venue_inventory":true}'),
('33100000-0000-4000-8000-000000000002','33000000-0000-4000-8000-000000000002','Demo Main Store',80,10,20,15,25,'Available','{"synthetic":true,"separate_from_venue_inventory":true}')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ministry_materials_funds (id,fund_number,source_type,source_id,amount,currency,fund_date,status,finance_record_id,metadata) VALUES
('33600000-0000-4000-8000-000000000001','MFUND-DEMO-001','Material Sale',null,500,'MZN',current_date,'Recorded Internally',null,'{"synthetic":true,"internal_only":true,"finance_record_created":false}') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ministry_materials_sales (id,sale_number,catalog_item_id,catalog_item_title,buyer_type,buyer_name,quantity,unit_price,total_amount,currency,payment_method,sale_date,status,finance_record_id,fund_id,metadata) VALUES
('33200000-0000-4000-8000-000000000001','MSALE-DEMO-001','33000000-0000-4000-8000-000000000001','Demo Rhapsody','Other','Demo Internal Buyer',10,50,500,'MZN','Cash',current_date,'Confirmed',null,'33600000-0000-4000-8000-000000000001','{"synthetic":true,"internal_only":true,"finance_record_created":false}') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ministry_materials_distributions (id,distribution_number,catalog_item_id,catalog_item_title,target_type,target_name,quantity,distribution_date,source_module,source_id,status,metadata) VALUES
('33300000-0000-4000-8000-000000000001','MDIST-DEMO-001','33000000-0000-4000-8000-000000000001','Demo Rhapsody','Prison Ministry','Demo Operational Centre North',80,current_date-7,'prison_ministry','32100000-0000-4000-8000-000000000001','Completed','{"synthetic":true,"explicit_stock_adjustment":true,"finance_record_created":false}'),
('33300000-0000-4000-8000-000000000002','MDIST-DEMO-002','33000000-0000-4000-8000-000000000003','Demo Evangelism Flyer','Evangelism','Demo Team B',100,current_date,'fevo','31200000-0000-4000-8000-000000000002','Completed','{"synthetic":true,"explicit_stock_adjustment":true}')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ministry_materials_requests (id,request_number,requested_by_name,source_module,source_id,catalog_item_id,catalog_item_title,quantity_requested,quantity_approved,quantity_fulfilled,status,approved_by_name,approved_at,fulfilled_by_name,fulfilled_at,metadata) VALUES
('33400000-0000-4000-8000-000000000001','MREQ-DEMO-001','Demo Prison Ministry Lead','prison_ministry','32000000-0000-4000-8000-000000000002','33000000-0000-4000-8000-000000000001','Demo Rhapsody',100,0,0,'Pending',null,null,null,null,'{"synthetic":true,"requisition_created":false}'),
('33400000-0000-4000-8000-000000000002','MREQ-DEMO-002','Demo Foundation Lead','foundation_school',null,'33000000-0000-4000-8000-000000000002','Demo Foundation Manual',30,30,0,'Approved','Demo Materials Lead',now(),null,null,'{"synthetic":true,"requisition_created":false}'),
('33400000-0000-4000-8000-000000000003','MREQ-DEMO-003','Demo F.E.V.O Lead','fevo','31200000-0000-4000-8000-000000000002','33000000-0000-4000-8000-000000000003','Demo Evangelism Flyer',100,100,100,'Fulfilled','Demo Materials Lead',now()-interval '2 days','Demo Store Lead',now()-interval '1 day','{"synthetic":true,"explicit_stock_adjustment":true,"requisition_created":false}')
ON CONFLICT (id) DO NOTHING;
INSERT INTO public.ministry_materials_reports (id,report_title,report_type,report_date,stock_summary,sales_summary,distribution_summary,requests_summary,funds_summary,status,submitted_by_name,submitted_at,approved_by_name,approved_at,metadata) VALUES
('33700000-0000-4000-8000-000000000001','Demo Materials Draft','Weekly',current_date,'{"items":4}','{"internal_amount":500}','{"quantity":180}','{"pending":1}','{"internal_amount":500}','Draft',null,null,null,null,'{"synthetic":true,"finance_totals_modified":false}'),
('33700000-0000-4000-8000-000000000002','Demo Materials Submitted','Monthly',current_date,'{"items":4}','{"internal_amount":500}','{"quantity":180}','{"pending":1}','{"internal_amount":500}','Submitted','Demo Materials Lead',now(),null,null,'{"synthetic":true,"finance_totals_modified":false}'),
('33700000-0000-4000-8000-000000000003','Demo Materials Approved','Monthly',current_date-30,'{"items":4}','{"internal_amount":400}','{"quantity":150}','{"pending":0}','{"internal_amount":400}','Approved','Demo Materials Lead',now()-interval '29 days','Demo Approver',now()-interval '28 days','{"synthetic":true,"finance_totals_modified":false}')
ON CONFLICT (id) DO NOTHING;
