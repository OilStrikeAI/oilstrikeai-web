-- OilStrikeAI — initial schema (Day 1)
-- Every table (except companies itself) carries company_id so Row Level
-- Security can enforce multi-tenant isolation: a user only ever sees rows
-- belonging to their own company. Enforced in the database, not just in
-- application code, since that's the layer that actually can't be bypassed
-- by a bug in the frontend.

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- Companies (tenants)
-- ---------------------------------------------------------------------------
create table companies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  tier text not null default 'micro' check (tier in ('micro', 'mid', 'large')),
  jv_count_range text,
  jib_volume_range text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Users — one row per person, linked to Supabase Auth's own user table.
-- Role drives what a person sees in the dashboard (Director/Manager/Employee).
-- ---------------------------------------------------------------------------
create table users (
  id uuid primary key references auth.users (id) on delete cascade,
  company_id uuid not null references companies (id) on delete cascade,
  role text not null default 'employee' check (role in ('director', 'manager', 'employee')),
  full_name text,
  email text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Documents — every uploaded file (contract or JIB), before/after AI processing
-- ---------------------------------------------------------------------------
create table documents (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies (id) on delete cascade,
  uploaded_by uuid references users (id),
  file_name text not null,
  storage_path text not null,
  document_type text check (document_type in ('JOA', 'PSC', 'TSA', 'CPA', 'SPA', 'JIB', 'other')),
  status text not null default 'processing' check (status in ('processing', 'analyzed', 'failed')),
  page_count int,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Contracts — the extracted "identity" of a document once the AI has read it
-- ---------------------------------------------------------------------------
create table contracts (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies (id) on delete cascade,
  document_id uuid not null references documents (id) on delete cascade,
  contract_number text,
  parties jsonb,
  effective_date date,
  expiry_date date,
  extracted_at timestamptz
);

-- ---------------------------------------------------------------------------
-- Discrepancies — every finding the AI surfaces, tiered and cited.
-- 'category' lets Red/Yellow/White findings be distinguished from the
-- separate fraud-risk-indicator category we added after the MJH SPA test.
-- ---------------------------------------------------------------------------
create table discrepancies (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies (id) on delete cascade,
  contract_id uuid references contracts (id) on delete cascade,
  category text not null default 'financial' check (
    category in ('financial', 'legal', 'operational', 'fraud_risk')
  ),
  tier text not null check (tier in ('red', 'yellow', 'white')),
  title text not null,
  explanation text,
  amount numeric,
  page_reference text,
  note text,
  suggested_next_step text,
  status text not null default 'open' check (status in ('open', 'resolved', 'disputed')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Obligations — deadlines and recurring duties extracted from a contract
-- ---------------------------------------------------------------------------
create table obligations (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies (id) on delete cascade,
  contract_id uuid references contracts (id) on delete cascade,
  title text not null,
  due_date date,
  recurrence text default 'none' check (recurrence in ('none', 'monthly', 'quarterly', 'annual')),
  severity text not null default 'medium' check (severity in ('high', 'medium', 'low')),
  assigned_team text check (assigned_team in ('Finance', 'Legal', 'HSE', 'Operations')),
  status text not null default 'open' check (status in ('open', 'resolved')),
  last_reminder_stage int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Notifications — the event feed behind the Notification Bell
-- ---------------------------------------------------------------------------
create table notifications (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies (id) on delete cascade,
  user_id uuid references users (id) on delete cascade,
  type text not null check (type in ('discrepancy', 'obligation', 'approval', 'system')),
  title text not null,
  detail text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Activity log — the audit trail behind every action taken
-- ---------------------------------------------------------------------------
create table activity_log (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies (id) on delete cascade,
  actor text not null, -- a user's full_name, or 'OilStrikeAI' for system-generated events
  action text not null,
  target text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes for the lookups the dashboard actually does
-- ---------------------------------------------------------------------------
create index idx_users_company on users (company_id);
create index idx_documents_company on documents (company_id);
create index idx_contracts_company on contracts (company_id);
create index idx_discrepancies_company on discrepancies (company_id);
create index idx_obligations_company on obligations (company_id);
create index idx_notifications_company_user on notifications (company_id, user_id);
create index idx_activity_log_company on activity_log (company_id);
