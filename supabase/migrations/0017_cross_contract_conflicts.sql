-- OilStrikeAI — real cross-contract conflict detection
-- Closes a real gap: Tier 2 pricing has always promised "Multi-JV
-- cross-contract conflict detection", but the only UI that ever existed for
-- it (ConflictMap.tsx) was mock data and was removed rather than left fake.
-- This adds the real thing: every analyzed document now also extracts a
-- small set of structured, comparable contract terms (contract_terms), and
-- when a company has 2+ contracts, a real comparison (in application code,
-- not invented by the model) flags genuine differences between them as a
-- new "conflict" discrepancy — citing both contracts and both pages, never
-- a fabricated comparison.

create table contract_terms (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies (id) on delete cascade,
  contract_id uuid not null references contracts (id) on delete cascade,
  term_type text not null check (term_type in (
    'overhead_rate_percent',
    'non_consent_notice_days',
    'payment_terms_days',
    'arbitration_seat'
  )),
  value_text text not null,
  value_number numeric,
  page_reference text,
  created_at timestamptz not null default now()
);

create index idx_contract_terms_company_type on contract_terms (company_id, term_type);

alter table contract_terms enable row level security;

create policy "company scoped select" on contract_terms
  for select using (company_id = auth_company_id());
create policy "company scoped insert" on contract_terms
  for insert with check (company_id = auth_company_id());

-- A conflict finding cites a SECOND contract in addition to the usual
-- contract_id, and needs a new category value distinct from the four the
-- AI's own per-document analysis can set (financial/legal/operational/
-- fraud_risk) — conflicts are never produced by the single-document model
-- call, only by this application-code comparison, so keeping the category
-- separate makes that provenance clear.
alter table discrepancies add column if not exists related_contract_id uuid references contracts (id) on delete set null;

alter table discrepancies drop constraint if exists discrepancies_category_check;
alter table discrepancies add constraint discrepancies_category_check
  check (category in ('financial', 'legal', 'operational', 'fraud_risk', 'conflict'));
