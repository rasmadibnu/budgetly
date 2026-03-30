alter table public.invoices
  add column if not exists client_name text,
  add column if not exists issued_date date default current_date,
  add column if not exists notes text;
