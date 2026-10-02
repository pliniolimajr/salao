-- Studio Modesto: schema reconstruído para um projeto Supabase novo.
-- Execute uma única vez no SQL Editor. Revisão: 24/09/2026.

begin;

create extension if not exists pgcrypto;
create extension if not exists btree_gist;

create type public.app_role as enum ('ADMIN', 'PROFESSIONAL');
create type public.appointment_status as enum ('scheduled', 'confirmed', 'waiting', 'in_service', 'completed', 'cancelled', 'no_show', 'blocked');
create type public.transaction_type as enum ('income', 'expense');
create type public.transaction_status as enum ('pago', 'pendente', 'atrasado');
create type public.inventory_movement_type as enum ('in', 'out');

create or replace function public.normalize_br_phone(phone_input text)
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  normalized text := regexp_replace(coalesce(phone_input, ''), '\D', '', 'g');
begin
  if normalized like '55%' and length(normalized) in (12, 13) then
    normalized := substring(normalized from 3);
  end if;
  if normalized like '0%' and length(normalized) in (11, 12) then
    normalized := substring(normalized from 2);
  end if;
  return normalized;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null default '',
  role public.app_role not null default 'PROFESSIONAL',
  active boolean not null default false,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, coalesce(new.email, ''), coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.professionals (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles(id) on delete set null,
  name text not null,
  role text not null,
  active boolean not null default true,
  commission_rate numeric(5,2) not null default 0 check (commission_rate between 0 and 100),
  goals_monthly_revenue numeric(12,2) not null default 0 check (goals_monthly_revenue >= 0),
  goals_appointments integer not null default 0 check (goals_appointments >= 0),
  specialties text[] not null default '{}',
  off_days smallint[] not null default '{0}' check (off_days <@ array[0,1,2,3,4,5,6]::smallint[]),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(10,2) not null check (price >= 0),
  duration_minutes integer not null check (duration_minutes between 15 and 720),
  category text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.professional_services (
  professional_id uuid not null references public.professionals(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  primary key (professional_id, service_id)
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  phone_normalized text generated always as (public.normalize_br_phone(phone)) stored,
  email text,
  birthday date,
  notes text,
  loyalty_points integer not null default 0 check (loyalty_points >= 0),
  is_vip boolean not null default false,
  total_spent numeric(12,2) not null default 0 check (total_spent >= 0),
  last_visit timestamptz,
  technical_file_allergies text,
  technical_file_formulas text,
  marketing_consent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index customers_phone_normalized_unique
  on public.customers(phone_normalized)
  where phone_normalized <> '';

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete set null,
  professional_id uuid not null references public.professionals(id) on delete restrict,
  service_id uuid references public.services(id) on delete set null,
  customer_name text not null,
  customer_phone text,
  customer_email text,
  customer_birthday date,
  service_name text,
  price numeric(10,2) not null default 0 check (price >= 0),
  start_time timestamptz not null,
  end_time timestamptz not null,
  status public.appointment_status not null default 'scheduled',
  is_blocked boolean not null default false,
  block_reason text,
  commission_paid boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointment_time_order check (end_time > start_time),
  constraint blocked_appointment_consistency check (
    (is_blocked and status = 'blocked') or (not is_blocked and status <> 'blocked')
  )
);

alter table public.appointments add constraint appointments_no_overlap
  exclude using gist (
    professional_id with =,
    tstzrange(start_time, end_time, '[)') with &&
  ) where (status not in ('cancelled', 'no_show'));

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  description text not null,
  amount numeric(12,2) not null check (amount >= 0),
  type public.transaction_type not null,
  category text not null,
  payment_method text,
  status public.transaction_status not null default 'pago',
  date timestamptz not null default now(),
  appointment_id uuid references public.appointments(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.inventory (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  quantity numeric(12,2) not null default 0 check (quantity >= 0),
  min_quantity numeric(12,2) not null default 0 check (min_quantity >= 0),
  cost_price numeric(12,2) not null default 0 check (cost_price >= 0),
  expiration_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  inventory_id uuid not null references public.inventory(id) on delete cascade,
  type public.inventory_movement_type not null,
  quantity numeric(12,2) not null check (quantity > 0),
  reason text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.loyalty_ledger (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  points integer not null check (points <> 0),
  reason text not null,
  appointment_id uuid references public.appointments(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index appointments_start_time_idx on public.appointments(start_time);
create index appointments_professional_start_idx on public.appointments(professional_id, start_time);
create index appointments_customer_idx on public.appointments(customer_id);
create index appointments_status_start_idx on public.appointments(status, start_time);
create index transactions_date_idx on public.transactions(date);
create index transactions_status_date_idx on public.transactions(status, date);
create index inventory_expiration_idx on public.inventory(expiration_date) where expiration_date is not null;
create index inventory_movements_item_idx on public.inventory_movements(inventory_id, created_at desc);
create index loyalty_ledger_customer_idx on public.loyalty_ledger(customer_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger professionals_updated_at before update on public.professionals for each row execute function public.set_updated_at();
create trigger services_updated_at before update on public.services for each row execute function public.set_updated_at();
create trigger customers_updated_at before update on public.customers for each row execute function public.set_updated_at();
create trigger appointments_updated_at before update on public.appointments for each row execute function public.set_updated_at();
create trigger inventory_updated_at before update on public.inventory for each row execute function public.set_updated_at();

create or replace function public.is_staff()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and active = true
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and active = true and role = 'ADMIN'
  );
$$;

create or replace function public.get_booking_professionals()
returns table (id uuid, name text, role text, specialties text[], off_days smallint[])
language sql stable security definer
set search_path = public
as $$
  select p.id, p.name, p.role, p.specialties, p.off_days
  from public.professionals p
  where p.active = true
  order by p.name;
$$;

create or replace function public.get_public_loyalty(phone_input text)
returns table (id uuid, name text, loyalty_points integer, is_vip boolean, last_visit timestamptz)
language sql stable security definer
set search_path = public
as $$
  select c.id, c.name, c.loyalty_points, c.is_vip, c.last_visit
  from public.customers c
  where c.phone_normalized = public.normalize_br_phone(phone_input)
  limit 1;
$$;

create or replace function public.get_public_booked_intervals(professional_id_input uuid, date_input date)
returns table (start_time timestamptz, end_time timestamptz)
language sql stable security definer
set search_path = public
as $$
  select a.start_time, a.end_time
  from public.appointments a
  where a.professional_id = professional_id_input
    and a.status not in ('cancelled', 'no_show')
    and a.start_time >= (date_input::timestamp at time zone 'America/Bahia')
    and a.start_time < ((date_input + 1)::timestamp at time zone 'America/Bahia')
  order by a.start_time;
$$;

create or replace function public.book_appointment(
  customer_name_input text,
  customer_phone_input text,
  customer_email_input text,
  customer_birthday_input date,
  professional_id_input uuid,
  service_id_input uuid,
  start_time_input timestamptz
)
returns public.appointments
language plpgsql security definer
set search_path = public
as $$
declare
  selected_service public.services;
  selected_professional public.professionals;
  appointment_end timestamptz;
  created_appointment public.appointments;
  local_start timestamp;
  matched_customer_id uuid;
begin
  if length(trim(customer_name_input)) < 2 or length(regexp_replace(customer_phone_input, '\D', '', 'g')) < 10 then
    raise exception 'INVALID_CUSTOMER_DATA';
  end if;

  select * into selected_service from public.services
  where id = service_id_input and active = true;
  if not found then raise exception 'SERVICE_NOT_AVAILABLE'; end if;

  select * into selected_professional from public.professionals
  where id = professional_id_input and active = true;
  if not found then raise exception 'PROFESSIONAL_NOT_AVAILABLE'; end if;

  local_start := start_time_input at time zone 'America/Bahia';
  appointment_end := start_time_input + make_interval(mins => selected_service.duration_minutes);

  if start_time_input <= now()
     or extract(isodow from local_start) not between 1 and 6
     or extract(hour from local_start) < 9
     or (appointment_end at time zone 'America/Bahia')::time > time '18:00' then
    raise exception 'OUTSIDE_BUSINESS_HOURS';
  end if;

  if extract(dow from local_start)::smallint = any(selected_professional.off_days) then
    raise exception 'PROFESSIONAL_DAY_OFF';
  end if;

  select c.id into matched_customer_id
  from public.customers c
  where c.phone_normalized = public.normalize_br_phone(customer_phone_input)
  limit 1;

  if matched_customer_id is null then
    insert into public.customers (name, phone, email, birthday)
    values (
      trim(customer_name_input),
      customer_phone_input,
      nullif(trim(customer_email_input), ''),
      customer_birthday_input
    )
    returning id into matched_customer_id;
  else
    update public.customers
    set name = trim(customer_name_input),
        email = coalesce(nullif(trim(customer_email_input), ''), email),
        birthday = coalesce(customer_birthday_input, birthday)
    where id = matched_customer_id;
  end if;

  insert into public.appointments (
    customer_id, professional_id, service_id, customer_name, customer_phone, customer_email,
    customer_birthday, service_name, price, start_time, end_time, status, is_blocked
  ) values (
    matched_customer_id, professional_id_input, service_id_input, trim(customer_name_input), customer_phone_input,
    nullif(trim(customer_email_input), ''), customer_birthday_input, selected_service.name,
    selected_service.price, start_time_input, appointment_end, 'scheduled', false
  ) returning * into created_appointment;

  return created_appointment;
exception
  when exclusion_violation then
    raise exception 'TIME_SLOT_UNAVAILABLE';
end;
$$;

create or replace function public.increment_loyalty_points(cust_id uuid, points integer)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if not public.is_staff() then raise exception 'NOT_AUTHORIZED'; end if;
  insert into public.loyalty_ledger (customer_id, points, reason, created_by)
  values (cust_id, points, 'Ajuste administrativo', auth.uid());
  update public.customers set loyalty_points = loyalty_points + points where id = cust_id;
end;
$$;

alter table public.profiles enable row level security;
alter table public.professionals enable row level security;
alter table public.services enable row level security;
alter table public.professional_services enable row level security;
alter table public.customers enable row level security;
alter table public.appointments enable row level security;
alter table public.transactions enable row level security;
alter table public.inventory enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.loyalty_ledger enable row level security;

create policy profiles_self_read on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
create policy admin_profiles_write on public.profiles for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy staff_professionals_read on public.professionals for select to authenticated using (public.is_staff());
create policy admin_professionals_write on public.professionals for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy public_active_services_read on public.services for select to anon, authenticated using (active = true or public.is_staff());
create policy admin_services_write on public.services for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy staff_professional_services_read on public.professional_services for select to authenticated using (public.is_staff());
create policy admin_professional_services_write on public.professional_services for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy staff_customers on public.customers for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy staff_appointments on public.appointments for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy staff_transactions on public.transactions for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy staff_inventory on public.inventory for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy staff_inventory_movements on public.inventory_movements for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy staff_loyalty_ledger on public.loyalty_ledger for all to authenticated using (public.is_staff()) with check (public.is_staff());

revoke all on function public.get_booking_professionals() from public;
revoke all on function public.get_public_loyalty(text) from public;
revoke all on function public.get_public_booked_intervals(uuid, date) from public;
revoke all on function public.book_appointment(text, text, text, date, uuid, uuid, timestamptz) from public;
revoke all on function public.increment_loyalty_points(uuid, integer) from public;
revoke all on function public.normalize_br_phone(text) from public;
grant execute on function public.get_booking_professionals() to anon, authenticated;
grant execute on function public.get_public_loyalty(text) to anon, authenticated;
grant execute on function public.get_public_booked_intervals(uuid, date) to anon, authenticated;
grant execute on function public.book_appointment(text, text, text, date, uuid, uuid, timestamptz) to anon, authenticated;
grant execute on function public.increment_loyalty_points(uuid, integer) to authenticated;
grant execute on function public.normalize_br_phone(text) to anon, authenticated;

alter publication supabase_realtime add table public.appointments;

-- O primeiro administrador deve ser promovido manualmente após entrar com Google:
-- update public.profiles set role = 'ADMIN', active = true where email = 'email-da-proprietaria@exemplo.com';

commit;
