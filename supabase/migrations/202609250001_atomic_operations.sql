-- Operações críticas atômicas do Studio Modesto.
-- Execute depois do schema inicial e do seed opcional.

begin;

create unique index if not exists transactions_appointment_income_unique
  on public.transactions(appointment_id)
  where appointment_id is not null and type = 'income';

create unique index if not exists loyalty_completed_appointment_unique
  on public.loyalty_ledger(appointment_id)
  where appointment_id is not null and reason = 'Atendimento concluído';

create or replace function public.complete_appointment(appointment_id_input uuid)
returns public.appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_appointment public.appointments;
  matched_customer_id uuid;
  points_inserted integer := 0;
begin
  if not public.is_staff() then raise exception 'NOT_AUTHORIZED'; end if;

  select * into selected_appointment
  from public.appointments
  where id = appointment_id_input
  for update;

  if not found then raise exception 'APPOINTMENT_NOT_FOUND'; end if;
  if selected_appointment.is_blocked then raise exception 'BLOCKED_APPOINTMENT'; end if;

  matched_customer_id := selected_appointment.customer_id;

  if matched_customer_id is null and public.normalize_br_phone(selected_appointment.customer_phone) <> '' then
    select id into matched_customer_id
    from public.customers
    where phone_normalized = public.normalize_br_phone(selected_appointment.customer_phone)
    limit 1;
  end if;

  if matched_customer_id is null then
    insert into public.customers (name, phone, email, birthday)
    values (
      selected_appointment.customer_name,
      coalesce(selected_appointment.customer_phone, ''),
      nullif(selected_appointment.customer_email, ''),
      selected_appointment.customer_birthday
    )
    returning id into matched_customer_id;
  end if;

  update public.appointments
  set status = 'completed', customer_id = matched_customer_id
  where id = appointment_id_input
  returning * into selected_appointment;

  insert into public.transactions (
    description, amount, type, category, payment_method, status, date, appointment_id
  ) values (
    'Serviço: ' || selected_appointment.customer_name,
    selected_appointment.price,
    'income',
    'Serviços',
    'Não informado',
    'pago',
    now(),
    selected_appointment.id
  )
  on conflict (appointment_id) where appointment_id is not null and type = 'income'
  do update set
    description = excluded.description,
    amount = excluded.amount,
    status = 'pago';

  insert into public.loyalty_ledger (
    customer_id, points, reason, appointment_id, created_by
  ) values (
    matched_customer_id, 10, 'Atendimento concluído', selected_appointment.id, auth.uid()
  )
  on conflict (appointment_id) where appointment_id is not null and reason = 'Atendimento concluído'
  do nothing;

  get diagnostics points_inserted = row_count;
  if points_inserted = 1 then
    update public.customers
    set loyalty_points = loyalty_points + 10
    where id = matched_customer_id;
  end if;

  update public.customers c
  set last_visit = selected_appointment.start_time,
      total_spent = coalesce((
        select sum(a.price)
        from public.appointments a
        where a.customer_id = c.id and a.status = 'completed'
      ), 0)
  where c.id = matched_customer_id;

  return selected_appointment;
end;
$$;

create or replace function public.adjust_inventory_stock(
  inventory_id_input uuid,
  quantity_input numeric,
  movement_type_input public.inventory_movement_type,
  reason_input text
)
returns public.inventory
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_item public.inventory;
  resulting_quantity numeric;
begin
  if not public.is_staff() then raise exception 'NOT_AUTHORIZED'; end if;
  if quantity_input <= 0 then raise exception 'INVALID_QUANTITY'; end if;
  if length(trim(reason_input)) < 2 then raise exception 'INVALID_REASON'; end if;

  select * into selected_item
  from public.inventory
  where id = inventory_id_input
  for update;

  if not found then raise exception 'INVENTORY_ITEM_NOT_FOUND'; end if;

  resulting_quantity := case
    when movement_type_input = 'in' then selected_item.quantity + quantity_input
    else selected_item.quantity - quantity_input
  end;

  if resulting_quantity < 0 then raise exception 'INSUFFICIENT_STOCK'; end if;

  update public.inventory
  set quantity = resulting_quantity
  where id = inventory_id_input
  returning * into selected_item;

  insert into public.inventory_movements (
    inventory_id, type, quantity, reason, created_by
  ) values (
    inventory_id_input, movement_type_input, quantity_input, trim(reason_input), auth.uid()
  );

  return selected_item;
end;
$$;

create or replace function public.pay_professional_commission(professional_id_input uuid)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  professional_name_value text;
  commission_rate_value numeric;
  commission_total numeric;
  appointment_ids_value uuid[];
begin
  if not public.is_admin() then raise exception 'NOT_AUTHORIZED'; end if;

  select name, commission_rate
  into professional_name_value, commission_rate_value
  from public.professionals
  where id = professional_id_input and active = true
  for update;

  if not found then raise exception 'PROFESSIONAL_NOT_FOUND'; end if;

  perform 1
  from public.appointments
  where professional_id = professional_id_input
    and status = 'completed'
    and commission_paid = false
  for update;

  select array_agg(id), coalesce(sum(price * commission_rate_value / 100), 0)
  into appointment_ids_value, commission_total
  from public.appointments
  where professional_id = professional_id_input
    and status = 'completed'
    and commission_paid = false;

  if commission_total <= 0 or appointment_ids_value is null then
    raise exception 'NO_PENDING_COMMISSION';
  end if;

  insert into public.transactions (
    description, amount, type, category, payment_method, status, date
  ) values (
    'Pagamento de Comissão - ' || professional_name_value,
    round(commission_total, 2),
    'expense',
    'Comissões',
    'PIX',
    'pago',
    now()
  );

  update public.appointments
  set commission_paid = true
  where id = any(appointment_ids_value);

  return round(commission_total, 2);
end;
$$;

revoke all on function public.complete_appointment(uuid) from public;
revoke all on function public.adjust_inventory_stock(uuid, numeric, public.inventory_movement_type, text) from public;
revoke all on function public.pay_professional_commission(uuid) from public;

grant execute on function public.complete_appointment(uuid) to authenticated;
grant execute on function public.adjust_inventory_stock(uuid, numeric, public.inventory_movement_type, text) to authenticated;
grant execute on function public.pay_professional_commission(uuid) to authenticated;

commit;
