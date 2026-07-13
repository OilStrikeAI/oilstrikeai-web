-- OilStrikeAI — real account creation
-- Supabase Auth only creates the auth.users row on signup; this trigger
-- creates the matching companies + public.users rows automatically, using
-- the full_name/company_name passed in signUp()'s options.data. Runs as
-- security definer since it fires before the new user has a session of
-- their own to satisfy RLS with.
--
-- Also handles TEAM INVITES: when a director/manager invites a teammate
-- (via supabase.auth.admin.inviteUserByEmail with invited_company_id /
-- invited_role in the metadata), the new person joins that EXISTING
-- company instead of getting a brand new one.
--
-- Also handles UPGRADING A FREE-AUDIT TRIAL: when someone creates a real
-- account from their audit results page (existing_company_id in metadata),
-- they're linked to that SAME trial company as its first director and it
-- flips to is_trial = false, instead of starting a disconnected new company —
-- their free audit results carry over into the real account.

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_company_id uuid;
  invited_company uuid := nullif(new.raw_user_meta_data->>'invited_company_id', '')::uuid;
  invited_role text := coalesce(new.raw_user_meta_data->>'invited_role', 'employee');
  upgrade_company uuid := nullif(new.raw_user_meta_data->>'existing_company_id', '')::uuid;
begin
  if invited_company is not null then
    insert into users (id, company_id, role, full_name, email, position, phone)
    values (
      new.id,
      invited_company,
      invited_role,
      nullif(new.raw_user_meta_data->>'full_name', ''),
      new.email,
      nullif(new.raw_user_meta_data->>'position', ''),
      nullif(new.raw_user_meta_data->>'phone', '')
    );
    delete from pending_invites where company_id = invited_company and email = new.email;
    return new;
  end if;

  if upgrade_company is not null then
    update companies set is_trial = false where id = upgrade_company and is_trial = true;

    insert into users (id, company_id, role, full_name, email)
    values (
      new.id,
      upgrade_company,
      'director',
      nullif(new.raw_user_meta_data->>'full_name', ''),
      new.email
    );
    return new;
  end if;

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
