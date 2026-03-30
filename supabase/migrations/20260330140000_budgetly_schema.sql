create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('owner', 'partner');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'transaction_type') then
    create type public.transaction_type as enum ('income', 'expense');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'goal_status') then
    create type public.goal_status as enum ('active', 'completed', 'cancelled');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'recurrence_type') then
    create type public.recurrence_type as enum ('monthly', 'yearly', 'one-time');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'invoice_status') then
    create type public.invoice_status as enum ('pending', 'paid', 'overdue');
  end if;
end $$;

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  currency text not null default 'IDR',
  timezone text not null default 'Asia/Jakarta',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  username text not null unique,
  role public.app_role not null,
  password_hash text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (household_id, user_id)
);

create table if not exists public.transaction_categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  type public.transaction_type not null,
  color text not null default '#0f766e',
  icon text,
  is_system boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  unique (household_id, type, name)
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete restrict,
  type public.transaction_type not null,
  amount numeric(14, 2) not null check (amount > 0),
  category_id uuid references public.transaction_categories(id) on delete set null,
  description text,
  date date not null,
  payment_method text,
  attachment_url text,
  is_recurring boolean not null default false,
  recurrence_rule public.recurrence_type,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  target_amount numeric(14, 2) not null check (target_amount > 0),
  current_amount numeric(14, 2) not null default 0 check (current_amount >= 0),
  start_date date not null,
  target_date date,
  status public.goal_status not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  category_id uuid not null references public.transaction_categories(id) on delete cascade,
  month text not null check (month ~ '^\d{4}-\d{2}$'),
  amount numeric(14, 2) not null check (amount > 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (household_id, category_id, month)
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  amount numeric(14, 2) not null check (amount > 0),
  due_date date not null,
  recurrence public.recurrence_type not null default 'monthly',
  status public.invoice_status not null default 'pending',
  auto_generate boolean not null default true,
  last_paid_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.invoice_payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  transaction_id uuid references public.transactions(id) on delete set null,
  paid_at timestamptz not null default timezone('utc', now()),
  amount numeric(14, 2) not null check (amount > 0),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.monthly_reports (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  month text not null check (month ~ '^\d{4}-\d{2}$'),
  summary_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  unique (household_id, month)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_transactions_updated_at on public.transactions;
create trigger set_transactions_updated_at
before update on public.transactions
for each row execute function public.set_updated_at();

drop trigger if exists set_goals_updated_at on public.goals;
create trigger set_goals_updated_at
before update on public.goals
for each row execute function public.set_updated_at();

drop trigger if exists set_budgets_updated_at on public.budgets;
create trigger set_budgets_updated_at
before update on public.budgets
for each row execute function public.set_updated_at();

drop trigger if exists set_invoices_updated_at on public.invoices;
create trigger set_invoices_updated_at
before update on public.invoices
for each row execute function public.set_updated_at();

create or replace function public.is_household_member(target_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members hm
    where hm.household_id = target_household_id
      and hm.user_id = auth.uid()
  );
$$;

create or replace function public.authenticate_budgetly_user(login_identifier text, plain_password text)
returns table (
  id uuid,
  email text,
  username text,
  role public.app_role
)
language sql
security definer
set search_path = public, extensions
as $$
  select u.id, u.email, u.username, u.role
  from public.users u
  where (lower(u.email) = lower(login_identifier) or lower(u.username) = lower(login_identifier))
    and u.password_hash = crypt(plain_password, u.password_hash)
  limit 1;
$$;

create or replace function public.is_owner(target_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members hm
    where hm.household_id = target_household_id
      and hm.user_id = auth.uid()
      and hm.role = 'owner'
  );
$$;

create or replace view public.budget_usage as
select
  b.id as budget_id,
  b.household_id,
  b.month,
  b.category_id,
  b.amount as budget_amount,
  coalesce(sum(case when t.type = 'expense' then t.amount else 0 end), 0)::numeric(14, 2) as spent_amount,
  greatest(b.amount - coalesce(sum(case when t.type = 'expense' then t.amount else 0 end), 0), 0)::numeric(14, 2) as remaining_amount,
  case
    when b.amount = 0 then 0
    else round((coalesce(sum(case when t.type = 'expense' then t.amount else 0 end), 0) / b.amount) * 100, 2)
  end::numeric(8, 2) as usage_percentage
from public.budgets b
left join public.transactions t
  on t.household_id = b.household_id
  and t.category_id = b.category_id
  and to_char(t.date, 'YYYY-MM') = b.month
group by b.id;

create index if not exists idx_household_members_user_id on public.household_members(user_id);
create index if not exists idx_transactions_household_date on public.transactions(household_id, date desc);
create index if not exists idx_transactions_household_category on public.transactions(household_id, category_id);
create index if not exists idx_goals_household on public.goals(household_id);
create index if not exists idx_budgets_household_month on public.budgets(household_id, month);
create index if not exists idx_invoices_household_due on public.invoices(household_id, due_date);

alter table public.households enable row level security;
alter table public.users enable row level security;
alter table public.household_members enable row level security;
alter table public.transaction_categories enable row level security;
alter table public.transactions enable row level security;
alter table public.goals enable row level security;
alter table public.budgets enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_payments enable row level security;
alter table public.monthly_reports enable row level security;

drop policy if exists "members can read household user profiles" on public.users;
create policy "members can read household user profiles"
on public.users for select
using (
  id = auth.uid()
  or exists (
    select 1
    from public.household_members current_member
    join public.household_members target_member
      on current_member.household_id = target_member.household_id
    where current_member.user_id = auth.uid()
      and target_member.user_id = public.users.id
  )
);

drop policy if exists "members can read household memberships" on public.household_members;
create policy "members can read household memberships"
on public.household_members for select
using (user_id = auth.uid() or public.is_household_member(household_id));

drop policy if exists "members can manage categories" on public.transaction_categories;
create policy "members can manage categories"
on public.transaction_categories
for all
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

drop policy if exists "members can manage transactions" on public.transactions;
create policy "members can manage transactions"
on public.transactions
for all
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

drop policy if exists "members can manage goals" on public.goals;
create policy "members can manage goals"
on public.goals
for all
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

drop policy if exists "members can manage budgets" on public.budgets;
create policy "members can manage budgets"
on public.budgets
for all
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

drop policy if exists "members can manage invoices" on public.invoices;
create policy "members can manage invoices"
on public.invoices
for all
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

drop policy if exists "members can manage invoice payments" on public.invoice_payments;
create policy "members can manage invoice payments"
on public.invoice_payments
for all
using (
  exists (
    select 1
    from public.invoices i
    where i.id = invoice_id
      and public.is_household_member(i.household_id)
  )
)
with check (
  exists (
    select 1
    from public.invoices i
    where i.id = invoice_id
      and public.is_household_member(i.household_id)
  )
);

drop policy if exists "members can manage monthly reports" on public.monthly_reports;
create policy "members can manage monthly reports"
on public.monthly_reports
for all
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

grant select on public.budget_usage to authenticated;

insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', true)
on conflict (id) do nothing;

drop policy if exists "members can view receipt objects" on storage.objects;
create policy "members can view receipt objects"
on storage.objects
for select
using (
  bucket_id = 'receipts'
  and public.is_household_member((storage.foldername(name))[1]::uuid)
);

drop policy if exists "members can upload receipt objects" on storage.objects;
create policy "members can upload receipt objects"
on storage.objects
for insert
with check (
  bucket_id = 'receipts'
  and owner = auth.uid()
  and public.is_household_member((storage.foldername(name))[1]::uuid)
);

drop policy if exists "members can update receipt objects" on storage.objects;
create policy "members can update receipt objects"
on storage.objects
for update
using (
  bucket_id = 'receipts'
  and public.is_household_member((storage.foldername(name))[1]::uuid)
)
with check (
  bucket_id = 'receipts'
  and public.is_household_member((storage.foldername(name))[1]::uuid)
);

drop policy if exists "members can delete receipt objects" on storage.objects;
create policy "members can delete receipt objects"
on storage.objects
for delete
using (
  bucket_id = 'receipts'
  and public.is_household_member((storage.foldername(name))[1]::uuid)
);
