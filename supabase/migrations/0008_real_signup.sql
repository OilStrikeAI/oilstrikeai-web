-- OilStrikeAI — real account creation
-- Supabase Auth only creates the auth.users row on signup; this trigger
-- creates the matching companies + public.users rows automatically, using
-- the full_name/company_name passed in signUp()'s options.data. Runs as
-- security definer since it fires before the new user has a session of
-- their own to satisfy RLS with.

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_company_id uuid;
begin
  insert into companies (name, tier, is_trial)
  values (
    coalesce(nullif(new.raw_user_meta_data->>'company_name', ''), 'New Company'),
    'micro',
    false
  )
  returning id into new_company_id;

  insert into users (id, company_id, role, full_name, email)
  values (
    new.id,
    new_company_id,
    'director',
    nullif(new.raw_user_meta_data->>'full_name', ''),
    new.email
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
