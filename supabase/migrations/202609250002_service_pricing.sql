-- Tipos de preço exibidos no catálogo público.
begin;

alter table public.services
  add column if not exists price_type text not null default 'fixed'
  check (price_type in ('fixed', 'from', 'assessment'));

update public.services
set price_type = 'from'
where lower(name) similar to '%(coloração|coloracao|mechas|luzes|progressiva|alisamento)%';

commit;
