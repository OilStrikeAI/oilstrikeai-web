-- OilStrikeAI — honest value display on the free audit + dashboard
-- The free audit was only totaling discrepancies that already had a dollar
-- amount, which understates real value and gives no way to show worth for
-- legal/operational/fraud_risk findings that don't carry a dollar figure.
-- Rather than inventing numbers, every discrepancy now carries a "stakes"
-- sentence (what's genuinely protected/at risk) and an optional
-- "recurrence_basis" ONLY when the source document itself states a
-- recurring cadence — lets the report honestly annotate "per cycle" instead
-- of implying a one-time number is the whole story.

alter table discrepancies add column if not exists stakes text;
alter table discrepancies add column if not exists recurrence_basis text
  not null default 'none' check (recurrence_basis in ('none', 'monthly', 'quarterly', 'annual'));
