create or replace function public.change_budgetly_password(
  target_user_id uuid,
  current_password text,
  new_password text
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  updated_count integer;
begin
  update public.users u
  set password_hash = crypt(new_password, gen_salt('bf'))
  where u.id = target_user_id
    and u.password_hash = crypt(current_password, u.password_hash);

  get diagnostics updated_count = row_count;
  return updated_count > 0;
end;
$$;
