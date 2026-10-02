-- Studio Modesto: dados fictícios para apresentação.
-- Seguro para reaplicar: os registros usam UUIDs fixos e ON CONFLICT.
-- Execute depois de 202609240001_initial_schema.sql.

begin;
set local timezone = 'America/Bahia';

insert into public.services (id, name, price, duration_minutes, category, active) values
  ('10000000-0000-4000-8000-000000000001', 'Corte feminino', 70.00, 60, 'Cabelo', true),
  ('10000000-0000-4000-8000-000000000002', 'Escova', 55.00, 60, 'Cabelo', true),
  ('10000000-0000-4000-8000-000000000003', 'Hidratação profunda', 65.00, 60, 'Tratamentos', true),
  ('10000000-0000-4000-8000-000000000004', 'Coloração', 150.00, 120, 'Cabelo', true),
  ('10000000-0000-4000-8000-000000000005', 'Manicure', 35.00, 60, 'Mãos e pés', true),
  ('10000000-0000-4000-8000-000000000006', 'Pé e mão', 65.00, 90, 'Mãos e pés', true),
  ('10000000-0000-4000-8000-000000000007', 'Spa dos pés', 48.00, 60, 'Mãos e pés', true),
  ('10000000-0000-4000-8000-000000000008', 'Limpeza de pele', 110.00, 90, 'Estética', true)
on conflict (id) do update set
  name = excluded.name, price = excluded.price, duration_minutes = excluded.duration_minutes,
  category = excluded.category, active = excluded.active;

insert into public.professionals (
  id, name, role, active, commission_rate, goals_monthly_revenue,
  goals_appointments, specialties, off_days
) values
  ('20000000-0000-4000-8000-000000000001', 'Carla Santos', 'Cabeleireira', true, 40, 8000, 80, array['Corte', 'Escova', 'Coloração', 'Tratamentos'], array[0,1]::smallint[]),
  ('20000000-0000-4000-8000-000000000002', 'Jéssica Lima', 'Manicure', true, 35, 6000, 100, array['Manicure', 'Pedicure', 'Spa dos pés'], array[0,2]::smallint[]),
  ('20000000-0000-4000-8000-000000000003', 'Carolina Rocha', 'Esteticista', true, 35, 6000, 55, array['Limpeza de pele', 'Hidratação facial'], array[0,3]::smallint[])
on conflict (id) do update set
  name = excluded.name, role = excluded.role, active = excluded.active,
  commission_rate = excluded.commission_rate,
  goals_monthly_revenue = excluded.goals_monthly_revenue,
  goals_appointments = excluded.goals_appointments,
  specialties = excluded.specialties, off_days = excluded.off_days;

insert into public.professional_services (professional_id, service_id) values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001'),
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002'),
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000003'),
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000004'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000005'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000006'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000007'),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000008')
on conflict do nothing;

insert into public.customers (
  id, name, phone, email, birthday, notes, loyalty_points, is_vip,
  total_spent, last_visit, technical_file_allergies, technical_file_formulas, marketing_consent
) values
  ('30000000-0000-4000-8000-000000000001', 'Mariana Souza', '(71) 99921-4408', 'mariana.demo@example.com', '1991-04-15', 'Prefere horários pela manhã.', 82, true, 1840, now() - interval '6 days', 'Couro cabeludo sensível.', 'Coloração 6.7 + oxidante 20 volumes.', true),
  ('30000000-0000-4000-8000-000000000002', 'Cláudia Santos', '(71) 98842-1030', 'claudia.demo@example.com', '1987-09-22', 'Gosta de tons neutros.', 35, false, 620, now() - interval '14 days', null, null, true),
  ('30000000-0000-4000-8000-000000000003', 'Rafaela Lima', '(71) 99710-6654', 'rafaela.demo@example.com', '1993-02-11', 'Cliente recorrente de tratamentos.', 110, true, 2210, now() - interval '3 days', 'Evitar produtos com fragrância intensa.', null, true),
  ('30000000-0000-4000-8000-000000000004', 'Aline Oliveira', '(71) 99118-3072', 'aline.demo@example.com', '1994-11-08', null, 20, false, 280, now() - interval '42 days', null, null, false),
  ('30000000-0000-4000-8000-000000000005', 'Daniela Costa', '(71) 98456-7721', 'daniela.demo@example.com', '1989-07-30', 'Prefere contato pelo WhatsApp.', 64, false, 970, now() - interval '21 days', null, null, true)
on conflict (id) do update set
  name = excluded.name, phone = excluded.phone, email = excluded.email,
  birthday = excluded.birthday, notes = excluded.notes,
  loyalty_points = excluded.loyalty_points, is_vip = excluded.is_vip,
  total_spent = excluded.total_spent, last_visit = excluded.last_visit,
  technical_file_allergies = excluded.technical_file_allergies,
  technical_file_formulas = excluded.technical_file_formulas,
  marketing_consent = excluded.marketing_consent;

insert into public.inventory (
  id, name, category, quantity, min_quantity, cost_price, expiration_date
) values
  ('40000000-0000-4000-8000-000000000001', 'Máscara de hidratação', 'Uso Interno', 2, 5, 48.00, current_date + 24),
  ('40000000-0000-4000-8000-000000000002', 'Shampoo profissional', 'Uso Interno', 8, 3, 62.00, current_date + 180),
  ('40000000-0000-4000-8000-000000000003', 'Óleo finalizador', 'Revenda', 5, 2, 39.00, current_date + 120),
  ('40000000-0000-4000-8000-000000000004', 'Esmalte nude clássico', 'Uso Interno', 1, 4, 9.90, current_date + 260),
  ('40000000-0000-4000-8000-000000000005', 'Leave-in proteção térmica', 'Revenda', 6, 3, 44.50, current_date + 28),
  ('40000000-0000-4000-8000-000000000006', 'Algodão profissional', 'Uso Interno', 12, 5, 14.90, null)
on conflict (id) do update set
  name = excluded.name, category = excluded.category, quantity = excluded.quantity,
  min_quantity = excluded.min_quantity, cost_price = excluded.cost_price,
  expiration_date = excluded.expiration_date;

insert into public.inventory_movements (id, inventory_id, type, quantity, reason, created_at) values
  ('41000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', 'in', 6, 'Estoque inicial de demonstração', now() - interval '15 days'),
  ('41000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000001', 'out', 4, 'Uso no atendimento', now() - interval '3 days'),
  ('41000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000003', 'in', 5, 'Compra de fornecedor', now() - interval '8 days')
on conflict (id) do update set
  inventory_id = excluded.inventory_id, type = excluded.type,
  quantity = excluded.quantity, reason = excluded.reason, created_at = excluded.created_at;

-- Histórico concluído.
insert into public.appointments (
  id, customer_id, professional_id, service_id, customer_name, customer_phone,
  customer_email, service_name, price, start_time, end_time, status,
  is_blocked, commission_paid
) values
  ('50000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000004', 'Mariana Souza', '(71) 99921-4408', 'mariana.demo@example.com', 'Coloração', 150, (current_date - 18 + time '10:00') at time zone 'America/Bahia', (current_date - 18 + time '12:00') at time zone 'America/Bahia', 'completed', false, false),
  ('50000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000006', 'Cláudia Santos', '(71) 98842-1030', 'claudia.demo@example.com', 'Pé e mão', 65, (current_date - 14 + time '14:00') at time zone 'America/Bahia', (current_date - 14 + time '15:30') at time zone 'America/Bahia', 'completed', false, false),
  ('50000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000008', 'Rafaela Lima', '(71) 99710-6654', 'rafaela.demo@example.com', 'Limpeza de pele', 110, (current_date - 3 + time '15:00') at time zone 'America/Bahia', (current_date - 3 + time '16:30') at time zone 'America/Bahia', 'completed', false, false)
on conflict (id) do update set status = excluded.status, price = excluded.price;

-- Agenda futura: distribuída entre profissionais e sem sobreposição.
insert into public.appointments (
  id, customer_id, professional_id, service_id, customer_name, customer_phone,
  customer_email, service_name, price, start_time, end_time, status, is_blocked, commission_paid
) values
  ('50000000-0000-4000-8000-000000000011', '30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Mariana Souza', '(71) 99921-4408', 'mariana.demo@example.com', 'Corte feminino', 70, (current_date + 1 + time '10:00') at time zone 'America/Bahia', (current_date + 1 + time '11:00') at time zone 'America/Bahia', 'confirmed', false, false),
  ('50000000-0000-4000-8000-000000000012', '30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000005', 'Cláudia Santos', '(71) 98842-1030', 'claudia.demo@example.com', 'Manicure', 35, (current_date + 1 + time '13:30') at time zone 'America/Bahia', (current_date + 1 + time '14:30') at time zone 'America/Bahia', 'scheduled', false, false),
  ('50000000-0000-4000-8000-000000000013', '30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000008', 'Rafaela Lima', '(71) 99710-6654', 'rafaela.demo@example.com', 'Limpeza de pele', 110, (current_date + 2 + time '15:00') at time zone 'America/Bahia', (current_date + 2 + time '16:30') at time zone 'America/Bahia', 'confirmed', false, false),
  ('50000000-0000-4000-8000-000000000014', '30000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000003', 'Daniela Costa', '(71) 98456-7721', 'daniela.demo@example.com', 'Hidratação profunda', 65, (current_date + 3 + time '16:00') at time zone 'America/Bahia', (current_date + 3 + time '17:00') at time zone 'America/Bahia', 'scheduled', false, false)
on conflict (id) do update set
  start_time = excluded.start_time, end_time = excluded.end_time,
  status = excluded.status, price = excluded.price;

insert into public.transactions (
  id, description, amount, type, category, payment_method, status, date, appointment_id
) values
  ('60000000-0000-4000-8000-000000000001', 'Serviço: Mariana Souza', 150, 'income', 'Serviços', 'PIX', 'pago', now() - interval '18 days', '50000000-0000-4000-8000-000000000001'),
  ('60000000-0000-4000-8000-000000000002', 'Serviço: Cláudia Santos', 65, 'income', 'Serviços', 'Cartão de Crédito', 'pago', now() - interval '14 days', '50000000-0000-4000-8000-000000000002'),
  ('60000000-0000-4000-8000-000000000003', 'Serviço: Rafaela Lima', 110, 'income', 'Serviços', 'PIX', 'pago', now() - interval '3 days', '50000000-0000-4000-8000-000000000003'),
  ('60000000-0000-4000-8000-000000000004', 'Reposição de produtos', 248.50, 'expense', 'Fornecedores / Estoque', 'PIX', 'pago', now() - interval '8 days', null),
  ('60000000-0000-4000-8000-000000000005', 'Conta de energia', 189.90, 'expense', 'Custos Fixos', 'Débito', 'pendente', now() - interval '2 days', null),
  ('60000000-0000-4000-8000-000000000006', 'Pacote mensal de cliente', 320, 'income', 'Serviços', 'PIX', 'pendente', now() - interval '1 day', null)
on conflict (id) do update set
  description = excluded.description, amount = excluded.amount, type = excluded.type,
  category = excluded.category, payment_method = excluded.payment_method,
  status = excluded.status, date = excluded.date, appointment_id = excluded.appointment_id;

insert into public.loyalty_ledger (id, customer_id, points, reason, appointment_id, created_at) values
  ('70000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 10, 'Atendimento concluído', '50000000-0000-4000-8000-000000000001', now() - interval '18 days'),
  ('70000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000002', 10, 'Atendimento concluído', '50000000-0000-4000-8000-000000000002', now() - interval '14 days'),
  ('70000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000003', 10, 'Atendimento concluído', '50000000-0000-4000-8000-000000000003', now() - interval '3 days')
on conflict (id) do update set
  customer_id = excluded.customer_id, points = excluded.points,
  reason = excluded.reason, appointment_id = excluded.appointment_id,
  created_at = excluded.created_at;

commit;

-- Para remover apenas a demonstração no futuro, apague os registros pelos
-- prefixos UUID 10/20/30/40/41/50/60/70, respeitando a ordem das FKs.
