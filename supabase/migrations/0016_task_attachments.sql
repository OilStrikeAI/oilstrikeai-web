-- Lets an employee attach a real work file (a revised document, a
-- spreadsheet, whatever) to a task progress update, not just a text note.
-- Access to the bucket is always mediated by server API routes using the
-- service-role admin client (same pattern as every other privileged write
-- in this app), so no storage.objects RLS policies are needed here — the
-- bucket stays private and nothing reads/writes it directly from the browser.

alter table task_updates add column if not exists attachment_path text;
alter table task_updates add column if not exists attachment_name text;

insert into storage.buckets (id, name, public)
values ('task-attachments', 'task-attachments', false)
on conflict (id) do nothing;
