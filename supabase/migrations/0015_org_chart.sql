-- OilStrikeAI — team org chart
-- Adds a job title + optional phone to a team member's profile (cosmetic,
-- separate from `role` which drives permissions), and a pending_invites
-- table so the org chart can show a "pending" node for someone who's been
-- invited but hasn't finished creating their account yet — until now there
-- was no server-side record of an invite between send-time and accept-time.

alter table users add column if not exists position text;
alter table users add column if not exists phone text;

create table pending_invites (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies (id) on delete cascade,
  invited_by uuid not null references users (id) on delete cascade,
  full_name text not null,
  position text,
  email text not null,
  phone text,
  role text not null default 'employee' check (role in ('manager', 'employee')),
  created_at timestamptz not null default now()
);

create index idx_pending_invites_company on pending_invites (company_id);

alter table pending_invites enable row level security;

create policy "company scoped select" on pending_invites
  for select using (company_id = auth_company_id());

create policy "director/manager insert" on pending_invites
  for insert with check (
    company_id = auth_company_id()
    and exists (
      select 1 from users
      where id = auth.uid() and role in ('director', 'manager')
    )
  );
