alter table public.users
  drop constraint if exists users_id_fkey;

alter table public.users
  alter column id set default gen_random_uuid();

alter table public.users
  add column if not exists username text,
  add column if not exists password_hash text;

update public.users
set username = coalesce(username, split_part(email, '@', 1))
where username is null;

update public.users
set password_hash = coalesce(password_hash, crypt('Budgetly123!', gen_salt('bf')))
where password_hash is null;

alter table public.users
  alter column username set not null,
  alter column password_hash set not null;

create unique index if not exists users_username_key on public.users (username);

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
