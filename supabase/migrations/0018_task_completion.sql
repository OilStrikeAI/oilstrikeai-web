-- OilStrikeAI — AI-assessed task completion
-- After an employee logs a progress note (and optional attachment) against a
-- task, the AI reads that note and estimates how far along the task is —
-- purely from what the employee actually described doing, never guessed from
-- the task title alone. This is a visibility aid for the manager/director,
-- not a performance grade, and is always labeled as an estimate in the UI.

alter table tasks add column if not exists completion_percent int check (completion_percent between 0 and 100);
alter table tasks add column if not exists completion_rationale text;
