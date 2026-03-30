do $$
begin
  if not exists (select 1 from pg_type where typname = 'debt_direction') then
    create type public.debt_direction as enum ('debt', 'receivable');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'debt_status') then
    create type public.debt_status as enum ('open', 'settled');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'investment_status') then
    create type public.investment_status as enum ('active', 'closed');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'subscription_status') then
    create type public.subscription_status as enum ('active', 'paused', 'cancelled');
  end if;
end $$;

create table if not exists public.debts_receivables (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  direction public.debt_direction not null,
  name text not null,
  counterparty text not null,
  total_amount numeric(14, 2) not null check (total_amount > 0),
  paid_amount numeric(14, 2) not null default 0 check (paid_amount >= 0),
  due_date date,
  status public.debt_status not null default 'open',
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.investments (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  platform text,
  type text not null,
  amount numeric(14, 2) not null check (amount > 0),
  current_value numeric(14, 2) not null check (current_value >= 0),
  started_at date not null,
  status public.investment_status not null default 'active',
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  vendor text not null,
  amount numeric(14, 2) not null check (amount > 0),
  billing_day integer not null check (billing_day between 1 and 28),
  category_id uuid references public.transaction_categories(id) on delete set null,
  payment_method text,
  start_date date not null,
  status public.subscription_status not null default 'active',
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.subscription_cycles (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  month text not null check (month ~ '^\d{4}-\d{2}$'),
  amount numeric(14, 2) not null check (amount > 0),
  due_date date not null,
  status public.invoice_status not null default 'pending',
  linked_transaction_id uuid references public.transactions(id) on delete set null,
  paid_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (subscription_id, month)
);

drop trigger if exists set_debts_receivables_updated_at on public.debts_receivables;
create trigger set_debts_receivables_updated_at
before update on public.debts_receivables
for each row execute function public.set_updated_at();

drop trigger if exists set_investments_updated_at on public.investments;
create trigger set_investments_updated_at
before update on public.investments
for each row execute function public.set_updated_at();

drop trigger if exists set_subscriptions_updated_at on public.subscriptions;
create trigger set_subscriptions_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

drop trigger if exists set_subscription_cycles_updated_at on public.subscription_cycles;
create trigger set_subscription_cycles_updated_at
before update on public.subscription_cycles
for each row execute function public.set_updated_at();

create index if not exists idx_debts_receivables_household on public.debts_receivables(household_id, due_date);
create index if not exists idx_investments_household on public.investments(household_id, started_at desc);
create index if not exists idx_subscriptions_household on public.subscriptions(household_id, status);
create index if not exists idx_subscription_cycles_household_month on public.subscription_cycles(household_id, month);

alter table public.debts_receivables enable row level security;
alter table public.investments enable row level security;
alter table public.subscriptions enable row level security;
alter table public.subscription_cycles enable row level security;

drop policy if exists "members can manage debts receivables" on public.debts_receivables;
create policy "members can manage debts receivables"
on public.debts_receivables
for all
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

drop policy if exists "members can manage investments" on public.investments;
create policy "members can manage investments"
on public.investments
for all
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

drop policy if exists "members can manage subscriptions" on public.subscriptions;
create policy "members can manage subscriptions"
on public.subscriptions
for all
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

drop policy if exists "members can manage subscription cycles" on public.subscription_cycles;
create policy "members can manage subscription cycles"
on public.subscription_cycles
for all
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));
