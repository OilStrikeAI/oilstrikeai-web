-- OilStrikeAI — real, honest processing-time tracking
-- Lets the report page state exactly how long the AI took on this specific
-- document (a real, measured number), instead of a generic marketing claim.

alter table documents add column if not exists analysis_duration_seconds numeric;
