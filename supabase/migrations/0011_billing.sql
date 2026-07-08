-- OilStrikeAI — billing (Stripe)
-- Tracks each company's Stripe customer/subscription so a real subscription
-- can actually be billed, upgraded, or canceled. subscription_status mirrors
-- Stripe's own subscription status values, kept in sync via webhook.

alter table companies add column if not exists stripe_customer_id text;
alter table companies add column if not exists stripe_subscription_id text;
alter table companies add column if not exists subscription_status text not null default 'inactive'
  check (subscription_status in ('inactive', 'trialing', 'active', 'past_due', 'canceled'));

create index if not exists idx_companies_stripe_customer on companies (stripe_customer_id);
