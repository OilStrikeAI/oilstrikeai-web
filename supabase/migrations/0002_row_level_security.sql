-- OilStrikeAI — Row Level Security (Day 1)
-- This is the layer that actually enforces multi-tenancy: even if application
-- code has a bug, Postgres itself refuses to return or accept rows outside a
-- user's own company. This must exist before a single real customer touches
-- the product — it was flagged as a blocking gap in the earlier audit.

-- Helper: look up the calling user's company_id once, reused by every policy
-- below instead of repeating the subquery in each one.
create or replace function auth_company_id()
returns uuid
language sql
security definer
stable
as $$
  select company_id from users where id = auth.uid();
$$;

alter table companies enable row level security;
alter table users enable row level security;
alter table documents enable row level security;
alter table contracts enable row level security;
alter table discrepancies enable row level security;
alter table obligations enable row level security;
alter table notifications enable row level security;
alter table activity_log enable row level security;

-- A user can see their own company's row, nothing else.
create policy "select own company" on companies
  for select using (id = auth_company_id());

-- A user can see other users within their own company (for team management),
-- but not anyone else's.
create policy "select users in own company" on users
  for select using (company_id = auth_company_id());

-- Every other table follows the same pattern: select/insert/update/delete
-- all scoped to the caller's own company_id.
create policy "company scoped select" on documents
  for select using (company_id = auth_company_id());
create policy "company scoped insert" on documents
  for insert with check (company_id = auth_company_id());
create policy "company scoped update" on documents
  for update using (company_id = auth_company_id());

create policy "company scoped select" on contracts
  for select using (company_id = auth_company_id());
create policy "company scoped insert" on contracts
  for insert with check (company_id = auth_company_id());
create policy "company scoped update" on contracts
  for update using (company_id = auth_company_id());

create policy "company scoped select" on discrepancies
  for select using (company_id = auth_company_id());
create policy "company scoped insert" on discrepancies
  for insert with check (company_id = auth_company_id());
create policy "company scoped update" on discrepancies
  for update using (company_id = auth_company_id());

create policy "company scoped select" on obligations
  for select using (company_id = auth_company_id());
create policy "company scoped insert" on obligations
  for insert with check (company_id = auth_company_id());
create policy "company scoped update" on obligations
  for update using (company_id = auth_company_id());

create policy "company scoped select" on notifications
  for select using (company_id = auth_company_id());
create policy "company scoped update" on notifications
  for update using (company_id = auth_company_id());

create policy "company scoped select" on activity_log
  for select using (company_id = auth_company_id());
create policy "company scoped insert" on activity_log
  for insert with check (company_id = auth_company_id());
