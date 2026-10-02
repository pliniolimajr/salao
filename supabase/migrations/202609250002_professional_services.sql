begin;

drop function if exists public.get_booking_professionals();

create function public.get_booking_professionals()
returns table (id uuid, name text, role text, specialties text[], off_days smallint[], service_ids uuid[])
language sql stable security definer
set search_path = public
as $$
  select p.id, p.name, p.role, p.specialties, p.off_days,
    coalesce(array_agg(ps.service_id) filter (where ps.service_id is not null), '{}'::uuid[]) as service_ids
  from public.professionals p
  left join public.professional_services ps on ps.professional_id = p.id
  where p.active = true
  group by p.id, p.name, p.role, p.specialties, p.off_days
  order by p.name;
$$;

create or replace function public.validate_professional_service()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.is_blocked = false and new.service_id is not null and not exists (
    select 1 from public.professional_services ps
    where ps.professional_id = new.professional_id and ps.service_id = new.service_id
  ) then
    raise exception 'PROFESSIONAL_NOT_AVAILABLE_FOR_SERVICE';
  end if;
  return new;
end;
$$;

drop trigger if exists appointments_validate_professional_service on public.appointments;
create trigger appointments_validate_professional_service
before insert or update of professional_id, service_id on public.appointments
for each row execute function public.validate_professional_service();

revoke all on function public.get_booking_professionals() from public;
grant execute on function public.get_booking_professionals() to anon, authenticated;

commit;
