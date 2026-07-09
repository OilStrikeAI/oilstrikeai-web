-- OilStrikeAI — automated lead-nurture sequence for free-audit leads
-- Same escalation-stage pattern as obligations.last_reminder_stage: a
-- stage only ever goes up, so nobody gets the same email twice. unsubscribed
-- lets a lead opt out with one click, required for any unsolicited outreach.

alter table companies add column if not exists last_nurture_stage int not null default 0;
alter table companies add column if not exists unsubscribed boolean not null default false;
