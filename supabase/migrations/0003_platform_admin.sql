-- OilStrikeAI — platform admin support
-- A platform admin is a person (you) who can see across every company, not
-- just one. This is deliberately separate from the "director" role, which is
-- the highest role *within* a single company and still fully boxed in by
-- Row Level Security like everyone else.

alter table users add column if not exists is_platform_admin boolean not null default false;

create or replace function is_platform_admin()
returns boolean
language sql
security definer
stable
as $$
  select coalesce(
    (select is_platform_admin from users where id = auth.uid()),
    false
  );
$$;

-- Additive policies: Postgres combines multiple permissive policies on the
-- same table/command with OR, so these don't replace the company-scoped
-- policies already in place — they just add "...or you're a platform admin"
-- on top, without touching anything that already works.
create policy "platform admin sees all companies" on companies
  for select using (is_platform_admin());

create policy "platform admin sees all users" on users
  for select using (is_platform_admin());

create policy "platform admin sees all documents" on documents
  for select using (is_platform_admin());

create policy "platform admin sees all contracts" on contracts
  for select using (is_platform_admin());

create policy "platform admin sees all discrepancies" on discrepancies
  for select using (is_platform_admin());

create policy "platform admin sees all obligations" on obligations
  for select using (is_platform_admin());

create policy "platform admin sees all notifications" on notifications
  for select using (is_platform_admin());

create policy "platform admin sees all activity" on activity_log
  for select using (is_platform_admin());
