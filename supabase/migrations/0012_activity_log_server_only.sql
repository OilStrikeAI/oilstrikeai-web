-- OilStrikeAI — close a known gap: activity_log should be server-only
-- Day 1's RLS gave every authenticated user insert access to their
-- company's activity_log, which means anyone with a valid session could
-- write a fake entry directly via the REST API (e.g. impersonating
-- "OilStrikeAI" as the actor), bypassing the app entirely. All real
-- activity_log writes already happen from trusted server code, so this
-- policy is simply removed — the service-role client (which bypasses RLS
-- regardless of policies) is what writes to this table now.

drop policy if exists "company scoped insert" on activity_log;
