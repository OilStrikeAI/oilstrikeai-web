-- OilStrikeAI — notifications insert policy
-- Day 1's RLS migration gave `notifications` a select + update policy but no
-- insert policy, so nothing could ever create one. The daily queue ingestion
-- route needs to insert a "new document analyzed" notification scoped to the
-- uploading user's own company, same pattern as every other table.

create policy "company scoped insert" on notifications
  for insert with check (company_id = auth_company_id());
