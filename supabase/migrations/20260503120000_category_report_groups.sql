do $$
begin
  if not exists (select 1 from pg_type where typname = 'category_report_group') then
    create type public.category_report_group as enum ('primary', 'secondary', 'tersier');
  end if;
end $$;

alter table public.transaction_categories
  add column if not exists report_group public.category_report_group not null default 'secondary';
