do $$
begin
  if not exists (select 1 from pg_type where typname = 'category_report_group') then
    create type public.category_report_group as enum ('primary', 'secondary', 'tersier');
  end if;
end $$;

alter table public.transaction_categories
  add column if not exists report_group public.category_report_group not null default 'secondary';

update public.transaction_categories
set report_group = case
  when lower(name) in (
    'primary salary',
    'salary',
    'baby needs',
    'debt payment',
    'education',
    'emergency',
    'groceries',
    'investasi',
    'transport',
    'utilities'
  ) then 'primary'::public.category_report_group
  when lower(name) in (
    'bonus',
    'freelance',
    'home supplies',
    'laundry',
    'meals',
    'parking',
    'personal care'
  ) then 'secondary'::public.category_report_group
  when lower(name) in (
    'coffee',
    'fashion',
    'gifts',
    'personal shopping',
    'snacks',
    'subscriptions',
    'treating others'
  ) then 'tersier'::public.category_report_group
  else 'secondary'::public.category_report_group
end;
