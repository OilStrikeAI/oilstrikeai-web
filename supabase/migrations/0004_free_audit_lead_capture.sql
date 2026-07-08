-- OilStrikeAI — free audit lead capture support (Day 2+)
-- A free Discovery Audit doesn't need its own "leads" table — the schema
-- already models one row per company, so a trial audit is just a company
-- that hasn't paid yet. These columns let us tell the two apart and follow
-- up with the person who requested the audit.

alter table companies add column if not exists is_trial boolean not null default false;
alter table companies add column if not exists contact_name text;
alter table companies add column if not exists contact_email text;
alter table companies add column if not exists contact_whatsapp text;

create index if not exists idx_companies_is_trial on companies (is_trial);

-- Trial companies have no logged-in user yet, so the free-audit API route and
-- the daily reminder cron job both authenticate with the Supabase service
-- role key (bypasses RLS entirely — server-side only, never sent to the
-- browser) instead of a per-user session.
