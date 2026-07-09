-- OilStrikeAI — lightweight production error visibility for the founder
-- No third-party error-monitoring service (Sentry, etc.) needed for this
-- stage — a simple table the founder admin page can read is enough to know
-- when something breaks, without adding another external account/vendor.
-- Only ever written by the service-role client (see lib/errorLog.ts), so no
-- insert policy is needed — same reasoning as the activity_log fix.

create table error_log (
  id uuid primary key default uuid_generate_v4(),
  route text not null,
  message text not null,
  stack text,
  company_id uuid references companies (id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_error_log_created on error_log (created_at desc);

alter table error_log enable row level security;

create policy "platform admin reads error log" on error_log
  for select using (is_platform_admin());
