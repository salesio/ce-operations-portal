import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kmurqbgpybrolrrumiue.supabase.co';
const SUPABASE_KEY = 'sb_publishable_SWyV8DiSlWMQFXt9Nh477A_SHeVUlli';

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

const CHURCH_HQ = 'a1111111-1111-4111-8111-111111111101'; // Maputo Central
const CHURCH_MATOLA = 'a1111111-1111-4111-8111-111111111102';
const CHURCH_BEIRA = 'a1111111-1111-4111-8111-111111111104';
const CHURCH_NAMPULA = 'a1111111-1111-4111-8111-111111111105';

async function main() {
  console.log('====================================================');
  console.log('SEEDING PRODUCTION-READY EXEMPLARY DATA INTO SUPABASE');
  console.log('====================================================');

  // 1. VENUE SPACES & INVENTORY
  console.log('\n--- 1. Seeding Venue Spaces & Inventory ---');

  const venueSpaces = [
    {
      id: 'b1000000-0000-4000-8000-000000000001',
      church_id: CHURCH_HQ,
      church_name: 'Christ Embassy Maputo Central',
      name: 'Nave Principal (Auditorium 1)',
      description: 'Auditório principal de adoração e cultos de domingo e quarta-feira.',
      space_type: 'Auditório Principal',
      capacity: 1200,
      responsible_name: 'Diácono Rui Machel',
      status: 'Available',
      notes: 'Equipado com som digital, projeção LED e ar condicionado central.'
    },
    {
      id: 'b1000000-0000-4000-8000-000000000002',
      church_id: CHURCH_HQ,
      church_name: 'Christ Embassy Maputo Central',
      name: 'Auditório B (Sala Multiuso)',
      description: 'Sala para reuniões de líderes, vigílias e seminários.',
      space_type: 'Sala Multiuso',
      capacity: 300,
      responsible_name: 'Irmão Carlos Cossa',
      status: 'Available',
      notes: 'Sistema de som compacto e projector laser.'
    },
    {
      id: 'b1000000-0000-4000-8000-000000000003',
      church_id: CHURCH_HQ,
      church_name: 'Christ Embassy Maputo Central',
      name: 'Sala LoveWorld Kids (Ministério Infantil)',
      description: 'Espaço dedicado ao ensino bíblico para crianças.',
      space_type: 'Sala Infantil',
      capacity: 150,
      responsible_name: 'Diaconisa Marta Sitoe',
      status: 'Available',
      notes: 'Smart TVs, mesas lúdicas e sistema áudio infantil.'
    },
    {
      id: 'b1000000-0000-4000-8000-000000000004',
      church_id: CHURCH_HQ,
      church_name: 'Christ Embassy Maputo Central',
      name: 'Estúdio de Transmissão LoveWorld SAT',
      description: 'Estúdio de produção multimídia, gravação e live broadcast.',
      space_type: 'Estúdio Mídia',
      capacity: 15,
      responsible_name: 'Irmão Samuel Machava',
      status: 'In Use',
      notes: 'Tratamento acústico, câmaras 4K e mesa de switcher.'
    },
    {
      id: 'b1000000-0000-4000-8000-000000000005',
      church_id: CHURCH_HQ,
      church_name: 'Christ Embassy Maputo Central',
      name: 'Gabinete Pastoral & Sala de Conselho',
      description: 'Gabinete do Pastor Titular e atendimentos pastorais.',
      space_type: 'Gabinete Pastoral',
      capacity: 20,
      responsible_name: 'Pastor Valdemiro Machava',
      status: 'Available',
      notes: 'Privado com sala de reuniões anexa.'
    },
    {
      id: 'b1000000-0000-4000-8000-000000000006',
      church_id: CHURCH_MATOLA,
      church_name: 'Christ Embassy Matola',
      name: 'Nave Principal Matola',
      description: 'Auditório principal de cultos na Matola.',
      space_type: 'Auditório Principal',
      capacity: 500,
      responsible_name: 'Pastor Branch Matola',
      status: 'Available',
      notes: 'Equipamento de som ativo e dois projectores.'
    }
  ];

  for (const row of venueSpaces) {
    const { error } = await sb.from('venue_spaces').upsert(row);
    if (error) console.error('  [!] Error upserting venue_space:', row.name, error.message);
    else console.log('  [+] Venue space:', row.name);
  }

  const inventoryItems = [
    {
      id: 'b2000000-0000-4000-8000-000000000001',
      item_code: 'EQP-AUD-001',
      name: 'Mesa Digital Yamaha TF5 32 Canais',
      description: 'Mesa de mistura digital profissional para a Nave Principal.',
      category: 'Áudio',
      subcategory: 'Mesa de Mistura',
      brand: 'Yamaha',
      model: 'TF5',
      serial_number: 'YTF5-99821-MZ',
      quantity: 1,
      unit: 'unit',
      church_id: CHURCH_HQ,
      church_name: 'Christ Embassy Maputo Central',
      department_name: 'Mídia & Áudio',
      space_id: 'b1000000-0000-4000-8000-000000000001',
      space_name: 'Nave Principal (Auditorium 1)',
      acquisition_source: 'Direct Purchase',
      acquisition_date: '2026-03-15',
      acquisition_cost: 285000,
      currency: 'MZN',
      status: 'Available',
      condition: 'Good',
      notes: 'Configurado com presets de culto de celebração.'
    },
    {
      id: 'b2000000-0000-4000-8000-000000000002',
      item_code: 'EQP-AUD-002',
      name: 'Microfones Sem Fio Shure BLX288/PG58 (Par Duplo)',
      description: 'Sistema sem fio duplo UHF para pastores e solistas.',
      category: 'Áudio',
      subcategory: 'Microfones',
      brand: 'Shure',
      model: 'BLX288/PG58',
      serial_number: 'SHU-BLX-4421',
      quantity: 2,
      unit: 'par',
      church_id: CHURCH_HQ,
      church_name: 'Christ Embassy Maputo Central',
      department_name: 'Mídia & Áudio',
      space_id: 'b1000000-0000-4000-8000-000000000001',
      space_name: 'Nave Principal (Auditorium 1)',
      acquisition_source: 'Direct Purchase',
      acquisition_date: '2026-04-10',
      acquisition_cost: 48000,
      currency: 'MZN',
      status: 'Available',
      condition: 'Good',
      notes: 'Baterias recarregáveis e mala de transporte.'
    },
    {
      id: 'b2000000-0000-4000-8000-000000000003',
      item_code: 'EQP-VID-001',
      name: 'Projector Laser Epson PowerLite 5000 Lumens',
      description: 'Projector laser Full HD de alta luminosidade para altar.',
      category: 'Vídeo / Projecção',
      subcategory: 'Projectores',
      brand: 'Epson',
      model: 'PowerLite L520U',
      serial_number: 'EPS-520U-8812',
      quantity: 2,
      unit: 'unit',
      church_id: CHURCH_HQ,
      church_name: 'Christ Embassy Maputo Central',
      department_name: 'Mídia & Áudio',
      space_id: 'b1000000-0000-4000-8000-000000000001',
      space_name: 'Nave Principal (Auditorium 1)',
      acquisition_source: 'Direct Purchase',
      acquisition_date: '2026-02-20',
      acquisition_cost: 115000,
      currency: 'MZN',
      status: 'Available',
      condition: 'Good',
      notes: 'Instalado em suporte de teto com cabo óptico HDMI.'
    },
    {
      id: 'b2000000-0000-4000-8000-000000000004',
      item_code: 'EQP-MUS-001',
      name: 'Teclado Sintetizador Roland Juno-DS88',
      description: 'Teclado de 88 teclas com peso de piano para banda de adoração.',
      category: 'Instrumentos Musicais',
      subcategory: 'Teclados',
      brand: 'Roland',
      model: 'Juno-DS88',
      serial_number: 'ROL-JDS-3301',
      quantity: 1,
      unit: 'unit',
      church_id: CHURCH_HQ,
      church_name: 'Christ Embassy Maputo Central',
      department_name: 'Música & Coral',
      space_id: 'b1000000-0000-4000-8000-000000000001',
      space_name: 'Nave Principal (Auditorium 1)',
      acquisition_source: 'Direct Purchase',
      acquisition_date: '2026-01-18',
      acquisition_cost: 92000,
      currency: 'MZN',
      status: 'Available',
      condition: 'Good',
      notes: 'Pedal sustain e suporte duplo inclusos.'
    },
    {
      id: 'b2000000-0000-4000-8000-000000000005',
      item_code: 'EQP-MUS-002',
      name: 'Bateria Eletrónica Roland V-Drums TD-17KVX',
      description: 'Bateria eletrónica de alta dinâmica com pads de malha.',
      category: 'Instrumentos Musicais',
      subcategory: 'Baterias',
      brand: 'Roland',
      model: 'TD-17KVX',
      serial_number: 'ROL-TD17-7721',
      quantity: 1,
      unit: 'unit',
      church_id: CHURCH_HQ,
      church_name: 'Christ Embassy Maputo Central',
      department_name: 'Música & Coral',
      space_id: 'b1000000-0000-4000-8000-000000000001',
      space_name: 'Nave Principal (Auditorium 1)',
      acquisition_source: 'Direct Purchase',
      acquisition_date: '2026-03-01',
      acquisition_cost: 145000,
      currency: 'MZN',
      status: 'Available',
      condition: 'Good',
      notes: 'Conectada via direct box estéreo na mesa principal.'
    },
    {
      id: 'b2000000-0000-4000-8000-000000000006',
      item_code: 'EQP-IT-001',
      name: 'Laptop Dell Inspiron 15 (ProPresenter & Projecção)',
      description: 'Computador dedicado à projecção de letras, bíblia e vídeos de culto.',
      category: 'Informática & TI',
      subcategory: 'Computadores',
      brand: 'Dell',
      model: 'Inspiron 15 3520 i7 16GB',
      serial_number: 'DELL-INSP-9011',
      quantity: 1,
      unit: 'unit',
      church_id: CHURCH_HQ,
      church_name: 'Christ Embassy Maputo Central',
      department_name: 'Mídia & Áudio',
      space_id: 'b1000000-0000-4000-8000-000000000001',
      space_name: 'Nave Principal (Auditorium 1)',
      assigned_to_name: 'Irmão Samuel Machava',
      acquisition_source: 'Direct Purchase',
      acquisition_date: '2026-05-12',
      acquisition_cost: 65000,
      currency: 'MZN',
      status: 'Assigned',
      condition: 'Good',
      notes: 'Licença oficial ProPresenter 7 instalada.'
    },
    {
      id: 'b2000000-0000-4000-8000-000000000007',
      item_code: 'EQP-PWR-001',
      name: 'Gerador Perkins Diesel 50kVA Trifásico',
      description: 'Gerador de emergência automático para suprimento elétrico ininterrupto.',
      category: 'Instalações & Energia',
      subcategory: 'Geradores',
      brand: 'Perkins',
      model: '50kVA Silent',
      serial_number: 'PRK-50KVA-1102',
      quantity: 1,
      unit: 'unit',
      church_id: CHURCH_HQ,
      church_name: 'Christ Embassy Maputo Central',
      department_name: 'Património & Instalações',
      space_id: 'b1000000-0000-4000-8000-000000000001',
      space_name: 'Pátio Técnico Exterior',
      acquisition_source: 'Direct Purchase',
      acquisition_date: '2025-11-20',
      acquisition_cost: 620000,
      currency: 'MZN',
      status: 'Available',
      condition: 'Good',
      notes: 'Quadro ATS automático e manutenção em dia.'
    }
  ];

  for (const row of inventoryItems) {
    const { error } = await sb.from('inventory_items').upsert(row);
    if (error) console.error('  [!] Error upserting inventory_item:', row.name, error.message);
    else console.log('  [+] Inventory item:', row.name);
  }

  const movements = [
    {
      id: 'b3000000-0000-4000-8000-000000000001',
      item_id: 'b2000000-0000-4000-8000-000000000002',
      item_code: 'EQP-AUD-002',
      item_name: 'Microfones Sem Fio Shure BLX288',
      movement_type: 'Loan',
      from_space_name: 'Nave Principal Maputo Central',
      to_space_name: 'Nave Matola (Cruzada Regional)',
      quantity: 1,
      responsible_name: 'Diácono Rui Machel',
      destination: 'Cruzada de Cura na Matola',
      requesting_department: 'Evangelismo & Cruzadas',
      start_date: '2026-08-28',
      expected_return_date: '2026-08-30',
      actual_return_date: '2026-08-30',
      status: 'Completed',
      notes: 'Equipamento devolvido em perfeito estado.'
    }
  ];

  for (const row of movements) {
    const { error } = await sb.from('inventory_movements').upsert(row);
    if (error) console.error('  [!] Error upserting movement:', row.item_name, error.message);
    else console.log('  [+] Movement:', row.item_name);
  }

  const maintenances = [
    {
      id: 'b4000000-0000-4000-8000-000000000001',
      item_id: 'b2000000-0000-4000-8000-000000000007',
      item_code: 'EQP-PWR-001',
      item_name: 'Gerador Perkins Diesel 50kVA',
      issue_title: 'Revisão Preventiva de 250 Horas',
      issue_description: 'Substituição de óleo, filtro de óleo, filtro de combustível e teste de carga.',
      priority: 'Medium',
      assigned_to_name: 'Eletrotécnica Maputo Lda',
      estimated_cost: 18500,
      actual_cost: 18500,
      currency: 'MZN',
      sent_date: '2026-08-15',
      completion_date: '2026-08-16',
      status: 'Completed',
      notes: 'Relatório técnico aprovado.'
    }
  ];

  for (const row of maintenances) {
    const { error } = await sb.from('inventory_maintenance_records').upsert(row);
    if (error) console.error('  [!] Error upserting maintenance:', row.item_name, error.message);
    else console.log('  [+] Maintenance:', row.item_name);
  }

  const checklists = [
    {
      id: 'b5000000-0000-4000-8000-000000000001',
      church_id: CHURCH_HQ,
      church_name: 'Christ Embassy Maputo Central',
      space_id: 'b1000000-0000-4000-8000-000000000001',
      space_name: 'Nave Principal (Auditorium 1)',
      service_date: '2026-08-30',
      service_type: 'Culto de Domingo - Celebração',
      inspector_name: 'Diácono Rui Machel',
      sound_checked: true,
      lights_checked: true,
      ac_checked: true,
      projector_checked: true,
      cleaning_done: true,
      status: 'Completed',
      notes: 'Todos os sistemas operacionais e prontos.'
    }
  ];

  for (const row of checklists) {
    const { error } = await sb.from('service_checklists').upsert(row);
    if (error) console.error('  [!] Error upserting checklist:', row.service_date, error.message);
    else console.log('  [+] Checklist:', row.service_date);
  }

  // 2. PRISON MINISTRY
  console.log('\n--- 2. Seeding Prison Ministry ---');

  const prisonLocations = [
    {
      id: 'c1000000-0000-4000-8000-000000000001',
      location_code: 'PRS-EPPM-01',
      name: 'Estabelecimento Penitenciário Provincial de Maputo (EPPM - Machava)',
      province: 'Maputo Província',
      city: 'Matola / Machava',
      district: 'Machava',
      location_type: 'Penitenciária Provincial',
      responsible_name: 'Pastor Nelson Silva',
      contact_person_name: 'Inspetor Chefe Armando Sitoe',
      contact_phone: '+258 84 332 1100',
      service_days: ['Quinta-feira', 'Sexta-feira'],
      service_notes: 'Culto semanal no pavilhão central com média de 200 internos.',
      status: 'Active',
      notes: 'Autorização ministerial renovada para 2026.'
    },
    {
      id: 'c1000000-0000-4000-8000-000000000002',
      location_code: 'PRS-NDLAV-02',
      name: 'Estabelecimento Penitenciário Especial Feminino de Ndlavela',
      province: 'Maputo Província',
      city: 'Matola / Ndlavela',
      district: 'Ndlavela',
      location_type: 'Penitenciária Feminina',
      responsible_name: 'Diaconisa Marta Cossa',
      contact_person_name: 'Superintendente Maria Muthemba',
      contact_phone: '+258 82 441 2290',
      service_days: ['Sexta-feira'],
      service_notes: 'Cultos de oração, aconselhamento e entrega de kits de higiene.',
      status: 'Active',
      notes: 'Forte participação feminina na Escola de Fundação.'
    },
    {
      id: 'c1000000-0000-4000-8000-000000000003',
      location_code: 'PRS-NAMP-03',
      name: 'Estabelecimento Penitenciário Provincial de Nampula',
      province: 'Nampula',
      city: 'Nampula',
      district: 'Nampula Cidade',
      location_type: 'Penitenciária Provincial',
      responsible_name: 'Pastor Lucas Nhavoto',
      contact_person_name: 'Chefe de Guarda Jacinto Mário',
      contact_phone: '+258 84 990 4455',
      service_days: ['Quinta-feira'],
      service_notes: 'Distribuição massiva de Rapsódia em Português e Emakhuwa.',
      status: 'Active',
      notes: 'Parceria com a liderança da Christ Embassy Nampula.'
    },
    {
      id: 'c1000000-0000-4000-8000-000000000004',
      location_code: 'PRS-BO-04',
      name: 'Estabelecimento Penitenciário Especial de Máxima Segurança (B.O.)',
      province: 'Maputo Província',
      city: 'Machava',
      district: 'Machava',
      location_type: 'Máxima Segurança',
      responsible_name: 'Pastor Nelson Silva',
      contact_person_name: 'Diretor Adjunto Paulo Guambe',
      contact_phone: '+258 84 551 7733',
      service_days: ['Quinta-feira'],
      service_notes: 'Atendimento pastoral individual e ministrações em pequenos grupos.',
      status: 'Active',
      notes: 'Protocolo de segurança reforçado.'
    }
  ];

  for (const row of prisonLocations) {
    const { error } = await sb.from('prison_locations').upsert(row);
    if (error) console.error('  [!] Error upserting prison_location:', row.name, error.message);
    else console.log('  [+] Prison location:', row.name);
  }

  const prisonServices = [
    {
      id: 'c2000000-0000-4000-8000-000000000001',
      prison_location_id: 'c1000000-0000-4000-8000-000000000001',
      service_date: '2026-08-27',
      service_type: 'Culto de Quinta-feira de Poder e Salvação',
      responsible_name: 'Pastor Nelson Silva',
      attendance_count: 185,
      new_converts_count: 42,
      testimonies_count: 8,
      prayer_requests_count: 35,
      status: 'Completed',
      summary: 'Grande mover do Espírito Santo com 42 decisões por Jesus Cristo e distribuição de Rapsódias.'
    },
    {
      id: 'c2000000-0000-4000-8000-000000000002',
      prison_location_id: 'c1000000-0000-4000-8000-000000000002',
      service_date: '2026-08-28',
      service_type: 'Culto Feminino de Edificação e Esperança',
      responsible_name: 'Diaconisa Marta Cossa',
      attendance_count: 94,
      new_converts_count: 28,
      testimonies_count: 12,
      prayer_requests_count: 40,
      status: 'Completed',
      summary: 'Culto abençoado com entrega de materiais de higiene e oração pelas famílias.'
    },
    {
      id: 'c2000000-0000-4000-8000-000000000003',
      prison_location_id: 'c1000000-0000-4000-8000-000000000003',
      service_date: '2026-08-20',
      service_type: 'Culto de Adoração e Ensino da Palavra',
      responsible_name: 'Pastor Lucas Nhavoto',
      attendance_count: 120,
      new_converts_count: 19,
      testimonies_count: 5,
      prayer_requests_count: 22,
      status: 'Completed',
      summary: 'Edificação bíblica com foco na nova criação em Cristo.'
    }
  ];

  for (const row of prisonServices) {
    const { error } = await sb.from('prison_services').upsert(row);
    if (error) console.error('  [!] Error upserting prison_service:', row.service_type, error.message);
    else console.log('  [+] Prison service:', row.service_type);
  }

  const prisonClasses = [
    {
      id: 'c3000000-0000-4000-8000-000000000001',
      prison_location_id: 'c1000000-0000-4000-8000-000000000001',
      class_code: 'FND-PRS-001',
      name: 'Turma Esperança Viva - EPPM Machava',
      teacher_name: 'Irmão António Langa',
      start_date: '2026-07-10',
      schedule_day: 'Quinta-feira',
      schedule_time: '10:00 - 11:30',
      status: 'Active',
      student_count: 15,
      graduated_count: 8
    }
  ];

  for (const row of prisonClasses) {
    const { error } = await sb.from('prison_foundation_classes').upsert(row);
    if (error) console.error('  [!] Error upserting prison_class:', row.name, error.message);
    else console.log('  [+] Prison class:', row.name);
  }

  const prisonStudents = [
    {
      id: 'c4000000-0000-4000-8000-000000000001',
      prison_class_id: 'c3000000-0000-4000-8000-000000000001',
      prison_location_id: 'c1000000-0000-4000-8000-000000000001',
      student_code: 'STD-PRS-001',
      display_name: 'Participante P-01 (Machava)',
      lessons_completed: 7,
      lesson_progress_percentage: 100,
      final_exam_score: 88,
      passed: true,
      graduated: true,
      status: 'Graduated',
      notes: 'Excelente compreensão dos fundamentos da nova criação.'
    },
    {
      id: 'c4000000-0000-4000-8000-000000000002',
      prison_class_id: 'c3000000-0000-4000-8000-000000000001',
      prison_location_id: 'c1000000-0000-4000-8000-000000000001',
      student_code: 'STD-PRS-002',
      display_name: 'Participante P-02 (Machava)',
      lessons_completed: 6,
      lesson_progress_percentage: 85,
      final_exam_score: 75,
      passed: true,
      graduated: false,
      status: 'Active',
      notes: 'Falta apenas a última aula sobre a Grande Comissão.'
    },
    {
      id: 'c4000000-0000-4000-8000-000000000003',
      prison_class_id: 'c3000000-0000-4000-8000-000000000001',
      prison_location_id: 'c1000000-0000-4000-8000-000000000001',
      student_code: 'STD-PRS-003',
      display_name: 'Participante P-03 (Machava)',
      lessons_completed: 7,
      lesson_progress_percentage: 100,
      final_exam_score: 95,
      passed: true,
      graduated: true,
      status: 'Graduated',
      notes: 'Atuando como líder de grupo de oração dentro da galeria.'
    }
  ];

  for (const row of prisonStudents) {
    const { error } = await sb.from('prison_foundation_students').upsert(row);
    if (error) console.error('  [!] Error upserting prison_student:', row.display_name, error.message);
    else console.log('  [+] Prison student:', row.display_name);
  }

  const prisonAgendas = [
    {
      id: 'c5000000-0000-4000-8000-000000000001',
      prison_location_id: 'c1000000-0000-4000-8000-000000000001',
      title: 'Culto Semanal e Doação de Bíblias - EPPM Machava',
      description: 'Ministração da Palavra, oração por enfermos e entrega de 200 Rapsódias de Realidades.',
      agenda_date: '2026-09-03',
      start_time: '09:30',
      end_time: '12:00',
      agenda_type: 'Culto Prisional',
      responsible_name: 'Pastor Nelson Silva',
      status: 'Planned'
    },
    {
      id: 'c5000000-0000-4000-8000-000000000002',
      prison_location_id: 'c1000000-0000-4000-8000-000000000002',
      title: 'Sessão de Aconselhamento e Escola de Fundação - Ndlavela',
      description: 'Acompanhamento espiritual e graduação de turma de fundação.',
      agenda_date: '2026-09-04',
      start_time: '10:00',
      end_time: '12:30',
      agenda_type: 'Escola de Fundação',
      responsible_name: 'Diaconisa Marta Cossa',
      status: 'Planned'
    }
  ];

  for (const row of prisonAgendas) {
    const { error } = await sb.from('prison_agenda_items').upsert(row);
    if (error) console.error('  [!] Error upserting prison_agenda:', row.title, error.message);
    else console.log('  [+] Prison agenda:', row.title);
  }

  const prisonReports = [
    {
      id: 'c6000000-0000-4000-8000-000000000001',
      prison_location_id: 'c1000000-0000-4000-8000-000000000001',
      report_title: 'Relatório Mensal de Impacto Prisional — Agosto 2026',
      report_type: 'Relatório Mensal Consolidado',
      report_date: '2026-08-31',
      attendance_count: 520,
      new_converts_count: 89,
      testimonies_count: 25,
      foundation_students_count: 15,
      materials_distributed_count: 500,
      summary: 'Durante o mês de Agosto foram realizados 4 cultos com impacto em mais de 500 reclusos, 89 novos convertidos e 8 graduados na Escola de Fundação.',
      testimonies_summary: 'Testemunhos de restauração familiar e paz interior.',
      status: 'Approved',
      submitted_by_name: 'Pastor Nelson Silva',
      approved_by_name: 'Pastor Valdemiro Machava'
    }
  ];

  for (const row of prisonReports) {
    const { error } = await sb.from('prison_reports').upsert(row);
    if (error) console.error('  [!] Error upserting prison_report:', row.report_title, error.message);
    else console.log('  [+] Prison report:', row.report_title);
  }

  // 3. MINISTRY MATERIALS
  console.log('\n--- 3. Seeding Ministry Materials ---');

  const catalog = [
    {
      id: 'd1000000-0000-4000-8000-000000000001',
      item_code: 'MAT-RHAP-ADULT',
      title: 'Rapsódia de Realidades (Edição Mensal Adultos - Português)',
      description: 'Devocional diário do Pastor Chris Oyakhilome com leitura bíblica para o ano.',
      material_type: 'Devocional',
      category: 'Devocionais',
      language: 'Portuguese',
      unit: 'livro',
      default_price: 50,
      currency: 'MZN',
      status: 'Active',
      is_free: false
    },
    {
      id: 'd1000000-0000-4000-8000-000000000002',
      item_code: 'MAT-RHAP-TEEVO',
      title: 'Rapsódia de Realidades TeeVo (Jovens & Adolescentes)',
      description: 'Devocional inspirador formatado para a juventude com desafios e tópicos atuais.',
      material_type: 'Devocional Juvenil',
      category: 'Juventude',
      language: 'Portuguese',
      unit: 'livro',
      default_price: 50,
      currency: 'MZN',
      status: 'Active',
      is_free: false
    },
    {
      id: 'd1000000-0000-4000-8000-000000000003',
      item_code: 'MAT-RHAP-KIDS',
      title: 'Rapsódia para Crianças (Early Readers / LoveWorld Kids)',
      description: 'Histórias bíblicas ilustradas, atividades e orações diárias para crianças.',
      material_type: 'Infantil',
      category: 'Crianças',
      language: 'Portuguese',
      unit: 'livro',
      default_price: 50,
      currency: 'MZN',
      status: 'Active',
      is_free: false
    },
    {
      id: 'd1000000-0000-4000-8000-000000000004',
      item_code: 'MAT-BOK-MENTE',
      title: 'Livro "A Mente Recriada" — Pastor Chris Oyakhilome',
      description: 'Best-seller sobre renovação da mente e transformação pessoal segundo a Palavra.',
      material_type: 'Livro',
      category: 'Crescimento Espiritual',
      language: 'Portuguese',
      unit: 'livro',
      default_price: 350,
      currency: 'MZN',
      status: 'Active',
      is_free: false
    },
    {
      id: 'd1000000-0000-4000-8000-000000000005',
      item_code: 'MAT-BOK-PODER',
      title: 'Livro "O Poder da Sua Mente" — Pastor Chris Oyakhilome',
      description: 'Ensino profundo sobre o potencial ilimitado da mente alinhada ao Espírito Santo.',
      material_type: 'Livro',
      category: 'Crescimento Espiritual',
      language: 'Portuguese',
      unit: 'livro',
      default_price: 350,
      currency: 'MZN',
      status: 'Active',
      is_free: false
    },
    {
      id: 'd1000000-0000-4000-8000-000000000006',
      item_code: 'MAT-BOK-MILAGRE',
      title: 'Livro "Como Receber um Milagre de Deus" — Pastor Chris',
      description: 'Princípios bíblicos práticos de fé para ativar milagres e curas divinas.',
      material_type: 'Livro',
      category: 'Fé e Cura',
      language: 'Portuguese',
      unit: 'livro',
      default_price: 250,
      currency: 'MZN',
      status: 'Active',
      is_free: false
    },
    {
      id: 'd1000000-0000-4000-8000-000000000007',
      item_code: 'MAT-BOK-7ESP',
      title: 'Livro "Os Sete Espíritos de Deus" — Pastor Chris',
      description: 'A revelação bíblica da plenitude do Espírito Santo na vida do crente.',
      material_type: 'Livro',
      category: 'Doutrina Bíblica',
      language: 'Portuguese',
      unit: 'livro',
      default_price: 400,
      currency: 'MZN',
      status: 'Active',
      is_free: false
    },
    {
      id: 'd1000000-0000-4000-8000-000000000008',
      item_code: 'MAT-BIB-STUDY',
      title: 'Bíblia de Estudo LoveWorld (Edição Capa de Luxo)',
      description: 'Bíblia com comentários pastorais, notas de estudo e concordância bíblica.',
      material_type: 'Bíblia',
      category: 'Bíblias',
      language: 'Portuguese',
      unit: 'exemplar',
      default_price: 1800,
      currency: 'MZN',
      status: 'Active',
      is_free: false
    },
    {
      id: 'd1000000-0000-4000-8000-000000000009',
      item_code: 'MAT-MAN-FOUND',
      title: 'Manual do Aluno da Escola de Fundação (Classes 1 a 7)',
      description: 'Manual curricular completo de discipulado para novos convertidos e membros.',
      material_type: 'Treinamento',
      category: 'Escola de Fundação',
      language: 'Portuguese',
      unit: 'manual',
      default_price: 150,
      currency: 'MZN',
      status: 'Active',
      is_free: false
    },
    {
      id: 'd1000000-0000-4000-8000-000000000010',
      item_code: 'MAT-FLY-EVANG',
      title: 'Folheto Evangelístico "Agora Que Você Nasceu de Novo"',
      description: 'Folheto introdutório para evangelismo e acompanhamento de primeiros contatos.',
      material_type: 'Folheto',
      category: 'Evangelismo',
      language: 'Portuguese',
      unit: 'unidade',
      default_price: 0,
      currency: 'MZN',
      status: 'Active',
      is_free: true
    }
  ];

  for (const row of catalog) {
    const { error } = await sb.from('ministry_materials_catalog').upsert(row);
    if (error) console.error('  [!] Error upserting catalog:', row.title, error.message);
    else console.log('  [+] Catalog item:', row.title);
  }

  const stocks = [
    {
      id: 'd2000000-0000-4000-8000-000000000001',
      catalog_item_id: 'd1000000-0000-4000-8000-000000000001',
      church_id: CHURCH_HQ,
      church_name: 'Christ Embassy Maputo Central',
      location_name: 'Depósito Central Maputo',
      quantity_available: 1500,
      quantity_reserved: 120,
      quantity_distributed: 450,
      quantity_sold: 230,
      reorder_level: 300,
      status: 'Available'
    },
    {
      id: 'd2000000-0000-4000-8000-000000000002',
      catalog_item_id: 'd1000000-0000-4000-8000-000000000004',
      church_id: CHURCH_HQ,
      church_name: 'Christ Embassy Maputo Central',
      location_name: 'Depósito Central Maputo',
      quantity_available: 85,
      quantity_reserved: 10,
      quantity_distributed: 15,
      quantity_sold: 45,
      reorder_level: 20,
      status: 'Available'
    },
    {
      id: 'd2000000-0000-4000-8000-000000000003',
      catalog_item_id: 'd1000000-0000-4000-8000-000000000008',
      church_id: CHURCH_HQ,
      church_name: 'Christ Embassy Maputo Central',
      location_name: 'Depósito Central Maputo',
      quantity_available: 45,
      quantity_reserved: 5,
      quantity_distributed: 10,
      quantity_sold: 18,
      reorder_level: 10,
      status: 'Available'
    },
    {
      id: 'd2000000-0000-4000-8000-000000000004',
      catalog_item_id: 'd1000000-0000-4000-8000-000000000009',
      church_id: CHURCH_HQ,
      church_name: 'Christ Embassy Maputo Central',
      location_name: 'Depósito Central Maputo',
      quantity_available: 250,
      quantity_reserved: 30,
      quantity_distributed: 100,
      quantity_sold: 60,
      reorder_level: 50,
      status: 'Available'
    },
    {
      id: 'd2000000-0000-4000-8000-000000000005',
      catalog_item_id: 'd1000000-0000-4000-8000-000000000010',
      church_id: CHURCH_HQ,
      church_name: 'Christ Embassy Maputo Central',
      location_name: 'Depósito Central Maputo',
      quantity_available: 3000,
      quantity_reserved: 500,
      quantity_distributed: 1200,
      quantity_sold: 0,
      reorder_level: 500,
      status: 'Available'
    }
  ];

  for (const row of stocks) {
    const { error } = await sb.from('ministry_materials_stock').upsert(row);
    if (error) console.error('  [!] Error upserting stock:', row.location_name, error.message);
    else console.log('  [+] Stock item for location:', row.location_name);
  }

  const sales = [
    {
      id: 'd3000000-0000-4000-8000-000000000001',
      sale_number: 'MSALE-202608-001',
      catalog_item_id: 'd1000000-0000-4000-8000-000000000001',
      catalog_item_title: 'Rapsódia de Realidades (Edição Mensal Adultos - Português)',
      church_id: CHURCH_HQ,
      church_name: 'Christ Embassy Maputo Central',
      buyer_type: 'Cell Leader',
      buyer_name: 'Diácono Samuel Muthemba (Célula Estrelas de Sião)',
      buyer_phone: '+258 84 111 2233',
      quantity: 15,
      unit_price: 50,
      total_amount: 750,
      currency: 'MZN',
      payment_method: 'M-Pesa',
      payment_reference: 'MPESA-889123',
      sale_date: '2026-08-28',
      status: 'Confirmed',
      notes: 'Lote de devocionais para a célula.'
    },
    {
      id: 'd3000000-0000-4000-8000-000000000002',
      sale_number: 'MSALE-202608-002',
      catalog_item_id: 'd1000000-0000-4000-8000-000000000004',
      catalog_item_title: 'Livro "A Mente Recriada" — Pastor Chris Oyakhilome',
      church_id: CHURCH_HQ,
      church_name: 'Christ Embassy Maputo Central',
      buyer_type: 'Member',
      buyer_name: 'Irmã Teresa Macuácua',
      buyer_phone: '+258 82 771 9900',
      quantity: 2,
      unit_price: 350,
      total_amount: 700,
      currency: 'MZN',
      payment_method: 'POS / Cartão',
      payment_reference: 'POS-09912',
      sale_date: '2026-08-30',
      status: 'Confirmed',
      notes: 'Adquiriu no balcão de literatura pós-culto.'
    },
    {
      id: 'd3000000-0000-4000-8000-000000000003',
      sale_number: 'MSALE-202609-003',
      catalog_item_id: 'd1000000-0000-4000-8000-000000000008',
      catalog_item_title: 'Bíblia de Estudo LoveWorld (Edição Capa de Luxo)',
      church_id: CHURCH_HQ,
      church_name: 'Christ Embassy Maputo Central',
      buyer_type: 'Leader',
      buyer_name: 'Irmão Alberto Chissano',
      buyer_phone: '+258 84 220 3344',
      quantity: 1,
      unit_price: 1800,
      total_amount: 1800,
      currency: 'MZN',
      payment_method: 'Emola / Transferência',
      payment_reference: 'EMOLA-55123',
      sale_date: '2026-09-01',
      status: 'Confirmed',
      notes: 'Bíblia de estudo para liderança.'
    }
  ];

  for (const row of sales) {
    const { error } = await sb.from('ministry_materials_sales').upsert(row);
    if (error) console.error('  [!] Error upserting sale:', row.sale_number, error.message);
    else console.log('  [+] Sale:', row.sale_number);
  }

  const distributions = [
    {
      id: 'd4000000-0000-4000-8000-000000000001',
      distribution_number: 'MDIST-202608-001',
      catalog_item_id: 'd1000000-0000-4000-8000-000000000001',
      catalog_item_title: 'Rapsódia de Realidades (Edição Mensal Adultos - Português)',
      church_id: CHURCH_HQ,
      church_name: 'Christ Embassy Maputo Central',
      target_type: 'Prison Ministry',
      target_name: 'EPPM Machava (Cadeia Central)',
      quantity: 250,
      distribution_date: '2026-08-25',
      distributed_by_name: 'Pastor Nelson Silva',
      source_module: 'prison_ministry',
      status: 'Completed',
      notes: 'Distribuição gratuita para reclusos.'
    },
    {
      id: 'd4000000-0000-4000-8000-000000000002',
      distribution_number: 'MDIST-202608-002',
      catalog_item_id: 'd1000000-0000-4000-8000-000000000010',
      catalog_item_title: 'Folheto Evangelístico "Agora Que Você Nasceu de Novo"',
      church_id: CHURCH_HQ,
      church_name: 'Christ Embassy Maputo Central',
      target_type: 'Evangelism / F.E.V.O',
      target_name: 'Cruzada Evangelística Matola',
      quantity: 500,
      distribution_date: '2026-08-22',
      distributed_by_name: 'Diácono Rui Machel',
      source_module: 'fevo',
      status: 'Completed',
      notes: 'Folhetos entregues a novos convertidos no evangelismo de rua.'
    }
  ];

  for (const row of distributions) {
    const { error } = await sb.from('ministry_materials_distributions').upsert(row);
    if (error) console.error('  [!] Error upserting distribution:', row.distribution_number, error.message);
    else console.log('  [+] Distribution:', row.distribution_number);
  }

  const funds = [
    {
      id: 'd5000000-0000-4000-8000-000000000001',
      fund_number: 'MFUND-2026-001',
      source_type: 'Campanha de Patrocínio',
      church_id: CHURCH_HQ,
      church_name: 'Christ Embassy Maputo Central',
      amount: 38500,
      currency: 'MZN',
      fund_date: '2026-08-15',
      status: 'Activa',
      notes: 'Patrocínio de 1.000 cópias da Rapsódia de Realidades para o Ministério nas Prisões de Moçambique.'
    },
    {
      id: 'd5000000-0000-4000-8000-000000000002',
      fund_number: 'MFUND-2026-002',
      source_type: 'Campanha de Patrocínio',
      church_id: CHURCH_HQ,
      church_name: 'Christ Embassy Maputo Central',
      amount: 72000,
      currency: 'MZN',
      fund_date: '2026-08-20',
      status: 'Activa',
      notes: 'Fundo para aquisição e doação de Bíblias de Estudo LoveWorld para novos líderes e centros comunitários.'
    }
  ];

  for (const row of funds) {
    const { error } = await sb.from('ministry_materials_funds').upsert(row);
    if (error) console.error('  [!] Error upserting fund:', row.fund_number, error.message);
    else console.log('  [+] Fund:', row.fund_number);
  }

  console.log('\n[SUCCESS] All authentic exemplary data seeded into Supabase!');
}

main().catch(err => {
  console.error('Fatal seed error:', err);
  process.exit(1);
});
