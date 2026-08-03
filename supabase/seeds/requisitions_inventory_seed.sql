-- ============================================================================
-- Optional seed: Backend Phase 6 - Requisitions + Venue/Inventory pilot
-- Requires churches_members_seed.sql and finance_public_giving_seed.sql first.
-- ============================================================================

INSERT INTO public.requisitions (
  id, request_number, title, description, justification, request_type, urgency,
  church_id, church_name, department_id, department_name, requested_by_name,
  estimated_amount, approved_amount, currency, needed_by, status,
  approved_by_name, approved_at, approval_notes, finance_status,
  finance_disbursement_id, inventory_required, inventory_status, supplier_name,
  metadata
) VALUES
  (
    '6a000006-0006-4006-8006-000000000601',
    'REQ-2026-0006',
    'Camera para transmissoes',
    'Pedido piloto para equipamento de media.',
    'Substituir equipamento antigo para cultos online.',
    'Equipamento',
    'Normal',
    'a1111111-1111-4111-8111-111111111101',
    'E.C. Maputo Central - Sede',
    'media',
    'Media',
    'Media Lead Demo',
    45000,
    42000,
    'MZN',
    CURRENT_DATE + 14,
    'Awaiting Finance Release',
    'Pastor Demo',
    now() - interval '1 day',
    'Aprovado para libertacao financeira.',
    'Awaiting Release',
    'h8888888-8888-4888-8888-888888888802',
    true,
    'Awaiting Inventory Registration',
    'Fornecedor Demo',
    '{"notes":"Piloto Phase 6; expense only after Finance releases disbursement."}'::jsonb
  ),
  (
    '6a000006-0006-4006-8006-000000000602',
    'REQ-2026-0007',
    'Material de limpeza',
    'Consumiveis para culto e salas.',
    'Apoiar equipas de servico.',
    'Consumivel',
    'Baixa',
    'a1111111-1111-4111-8111-111111111102',
    'E.C. Matola',
    'venue-inventory',
    'Espacos & Inventario',
    'Admin Demo',
    3800,
    0,
    'MZN',
    CURRENT_DATE + 7,
    'Under Review',
    NULL,
    NULL,
    NULL,
    'Not Required',
    NULL,
    false,
    'Not Required',
    NULL,
    '{"notes":"Sem efeito financeiro automatico."}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.requisition_timeline_events (
  id, requisition_id, event_type, title, description, old_status, new_status,
  performed_by_name, event_date
) VALUES
  (
    '6b000006-0006-4006-8006-000000000601',
    '6a000006-0006-4006-8006-000000000601',
    'approved',
    'Pedido aprovado',
    'Aprovado e aguardando libertacao financeira.',
    'Awaiting Main Pastor Approval',
    'Awaiting Finance Release',
    'Pastor Demo',
    now() - interval '1 day'
  ),
  (
    '6b000006-0006-4006-8006-000000000602',
    '6a000006-0006-4006-8006-000000000602',
    'review',
    'Em revisao',
    'Pedido em revisao operacional.',
    'Submitted',
    'Under Review',
    'Admin Demo',
    now() - interval '2 hours'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.venue_spaces (
  id, church_id, church_name, name, description, space_type, capacity,
  responsible_name, status, notes
) VALUES
  (
    '6c000006-0006-4006-8006-000000000601',
    'a1111111-1111-4111-8111-111111111101',
    'E.C. Maputo Central - Sede',
    'Auditorio Principal',
    'Espaco principal de cultos.',
    'Sanctuary',
    450,
    'Venue Demo',
    'Available',
    'Seed Phase 6'
  ),
  (
    '6c000006-0006-4006-8006-000000000602',
    'a1111111-1111-4111-8111-111111111101',
    'E.C. Maputo Central - Sede',
    'Sala de Fundacao',
    'Sala para aulas e reunioes.',
    'Classroom',
    40,
    'Foundation Demo',
    'Available',
    'Seed Phase 6'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.inventory_items (
  id, item_code, name, description, category, quantity, church_id, church_name,
  department_id, department_name, space_id, space_name, acquisition_source,
  acquisition_date, acquisition_cost, currency, requisition_id, request_number,
  finance_disbursement_id, supplier_name, status, condition
) VALUES
  (
    '6d000006-0006-4006-8006-000000000601',
    'INV-2026-0006',
    'Camera Sony Demo',
    'Item registado a partir de requisicao piloto.',
    'Media',
    1,
    'a1111111-1111-4111-8111-111111111101',
    'E.C. Maputo Central - Sede',
    'media',
    'Media',
    '6c000006-0006-4006-8006-000000000601',
    'Auditorio Principal',
    'Requisition',
    CURRENT_DATE,
    42000,
    'MZN',
    '6a000006-0006-4006-8006-000000000601',
    'REQ-2026-0006',
    'h8888888-8888-4888-8888-888888888802',
    'Fornecedor Demo',
    'Pending Registration',
    'New'
  ),
  (
    '6d000006-0006-4006-8006-000000000602',
    'INV-2026-0007',
    'Microfone Sem Fio Demo',
    'Equipamento em uso.',
    'Sound',
    2,
    'a1111111-1111-4111-8111-111111111101',
    'E.C. Maputo Central - Sede',
    'media',
    'Media',
    '6c000006-0006-4006-8006-000000000601',
    'Auditorio Principal',
    'Manual Entry',
    CURRENT_DATE - 30,
    7500,
    'MZN',
    NULL,
    NULL,
    NULL,
    NULL,
    'Available',
    'Good'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.inventory_movements (
  id, item_id, item_code, item_name, movement_type, from_space_name,
  to_space_id, to_space_name, quantity, reason, performed_by_name, status
) VALUES
  (
    '6e000006-0006-4006-8006-000000000601',
    '6d000006-0006-4006-8006-000000000602',
    'INV-2026-0007',
    'Microfone Sem Fio Demo',
    'Assignment',
    'Armazem',
    '6c000006-0006-4006-8006-000000000601',
    'Auditorio Principal',
    1,
    'Culto de domingo',
    'Inventory Demo',
    'Completed'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.inventory_maintenance_records (
  id, item_id, item_code, item_name, issue_title, issue_description,
  reported_by_name, assigned_to_name, estimated_cost, currency, status, priority
) VALUES
  (
    '6f000006-0006-4006-8006-000000000601',
    '6d000006-0006-4006-8006-000000000602',
    'INV-2026-0007',
    'Microfone Sem Fio Demo',
    'Ruido intermitente',
    'Verificar bateria e receptor.',
    'Media Demo',
    'Tecnico Local',
    500,
    'MZN',
    'Reported',
    'Normal'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.service_checklists (
  id, church_id, church_name, service_name, service_date, service_time,
  checklist_type, responsible_name, sound_ready, microphones_ready, cameras_ready,
  streaming_ready, projector_ready, lights_ready, ac_ready, chairs_ready,
  pulpit_ready, cleaning_ready, instruments_ready, power_backup_ready,
  issues_found, status
) VALUES
  (
    '70000006-0006-4006-8006-000000000601',
    'a1111111-1111-4111-8111-111111111101',
    'E.C. Maputo Central - Sede',
    'Domingo 1o Culto',
    CURRENT_DATE + 3,
    '07:45',
    'Service',
    'Venue Demo',
    true, true, true, true, true, true, true, true, true, true, true, true,
    NULL,
    'Completed'
  ),
  (
    '70000006-0006-4006-8006-000000000602',
    'a1111111-1111-4111-8111-111111111101',
    'E.C. Maputo Central - Sede',
    'Quarta-feira Culto',
    CURRENT_DATE + 6,
    '18:00',
    'Service',
    'Venue Demo',
    true, true, false, true, true, true, true, true, true, true, false, true,
    'Camera 2 e instrumentos precisam confirmacao.',
    'Requires Attention'
  )
ON CONFLICT (id) DO NOTHING;
