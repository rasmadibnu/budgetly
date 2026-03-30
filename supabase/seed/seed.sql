do $$
declare
  household_uuid uuid := gen_random_uuid();
  husband_id uuid := gen_random_uuid();
  wife_id uuid := gen_random_uuid();
  groceries_category uuid := gen_random_uuid();
  salary_category uuid := gen_random_uuid();
  utilities_category uuid := gen_random_uuid();
  baby_category uuid := gen_random_uuid();
  subscription_category uuid := gen_random_uuid();
begin
  insert into public.households (id, name, currency, timezone)
  values (household_uuid, 'Budgetly Household', 'IDR', 'Asia/Jakarta')
  on conflict do nothing;

  insert into public.users (id, email, username, role, password_hash)
  values
    (husband_id, 'husband@budgetly.local', 'husband', 'owner', crypt('Budgetly123!', gen_salt('bf'))),
    (wife_id, 'wife@budgetly.local', 'wife', 'partner', crypt('Budgetly123!', gen_salt('bf')))
  on conflict (email) do update set
    username = excluded.username,
    role = excluded.role,
    password_hash = excluded.password_hash;

  insert into public.household_members (household_id, user_id, role)
  values
    (household_uuid, husband_id, 'owner'),
    (household_uuid, wife_id, 'partner')
  on conflict (household_id, user_id) do nothing;

  insert into public.transaction_categories (id, household_id, name, type, color, is_system)
  values
    (salary_category, household_uuid, 'Salary', 'income', '#0f766e', true),
    (groceries_category, household_uuid, 'Groceries', 'expense', '#f59e0b', true),
    (utilities_category, household_uuid, 'Utilities', 'expense', '#ef4444', true),
    (baby_category, household_uuid, 'Baby Needs', 'expense', '#8b5cf6', true),
    (subscription_category, household_uuid, 'Subscriptions', 'expense', '#3b82f6', true)
  on conflict (household_id, type, name) do nothing;

  insert into public.transactions (household_id, user_id, type, amount, category_id, description, date, payment_method)
  values
    (household_uuid, husband_id, 'income', 18000000, salary_category, 'Primary salary', current_date - interval '20 days', 'Bank Transfer'),
    (household_uuid, wife_id, 'income', 8500000, salary_category, 'Freelance design work', current_date - interval '12 days', 'Bank Transfer'),
    (household_uuid, wife_id, 'expense', 1450000, groceries_category, 'Weekly groceries', current_date - interval '7 days', 'QRIS'),
    (household_uuid, husband_id, 'expense', 550000, utilities_category, 'Electricity bill', current_date - interval '4 days', 'Bank Transfer'),
    (household_uuid, wife_id, 'expense', 980000, baby_category, 'Diapers and vitamins', current_date - interval '2 days', 'Debit Card');

  insert into public.goals (household_id, name, target_amount, current_amount, start_date, target_date, status)
  values
    (household_uuid, 'Emergency Fund', 50000000, 18000000, current_date - interval '90 days', current_date + interval '365 days', 'active'),
    (household_uuid, 'Vacation', 15000000, 4500000, current_date - interval '40 days', current_date + interval '180 days', 'active'),
    (household_uuid, 'New Laptop', 22000000, 12000000, current_date - interval '120 days', current_date + interval '120 days', 'active');

  insert into public.budgets (household_id, category_id, month, amount)
  values
    (household_uuid, groceries_category, to_char(current_date, 'YYYY-MM'), 4000000),
    (household_uuid, utilities_category, to_char(current_date, 'YYYY-MM'), 1200000),
    (household_uuid, baby_category, to_char(current_date, 'YYYY-MM'), 2500000)
  on conflict (household_id, category_id, month) do nothing;

  insert into public.invoices (household_id, name, amount, due_date, recurrence, status, auto_generate)
  values
    (household_uuid, 'Electricity', 550000, current_date + interval '5 days', 'monthly', 'pending', true),
    (household_uuid, 'Internet', 450000, current_date + interval '8 days', 'monthly', 'pending', true),
    (household_uuid, 'Netflix', 186000, current_date + interval '2 days', 'monthly', 'pending', true),
    (household_uuid, 'Apartment Rent', 3500000, current_date - interval '1 day', 'monthly', 'overdue', true);

  insert into public.debts_receivables (household_id, direction, name, counterparty, total_amount, paid_amount, due_date, status, notes)
  values
    (household_uuid, 'debt', 'Family Car Loan', 'BCA Finance', 48000000, 12000000, current_date + interval '240 days', 'open', 'Monthly installments'),
    (household_uuid, 'receivable', 'Freelance Website Project', 'PT Maju Digital', 8500000, 3500000, current_date + interval '21 days', 'open', 'Second payment pending');

  insert into public.investments (household_id, name, platform, type, amount, current_value, started_at, status, notes)
  values
    (household_uuid, 'IDX Blue Chip Basket', 'Ajaib', 'Stocks', 15000000, 16750000, current_date - interval '420 days', 'active', 'Long-term capital growth'),
    (household_uuid, 'Emergency Deposit', 'Jenius', 'Time Deposit', 10000000, 10350000, current_date - interval '180 days', 'active', 'Low risk reserve');

  insert into public.subscriptions (household_id, name, vendor, amount, billing_day, category_id, payment_method, start_date, status, notes)
  values
    (household_uuid, 'Netflix Family', 'Netflix', 186000, 2, subscription_category, 'Credit Card', date_trunc('month', current_date)::date, 'active', 'Family entertainment'),
    (household_uuid, 'Google One 200GB', 'Google', 43900, 12, subscription_category, 'Debit Card', date_trunc('month', current_date)::date, 'active', 'Shared cloud storage');
end $$;
