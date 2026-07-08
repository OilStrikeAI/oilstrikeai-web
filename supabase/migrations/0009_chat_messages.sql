-- OilStrikeAI — AI chat bot (Ask-Anything Chat)
-- One continuous thread per person, not per company — a director and an
-- employee at the same company get their own private conversation with the
-- assistant, even though it answers from the same underlying company data.

create table chat_messages (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies (id) on delete cascade,
  user_id uuid not null references users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index idx_chat_messages_user on chat_messages (user_id, created_at);

alter table chat_messages enable row level security;

-- Scoped to both company AND the specific user — a manager should not read
-- an employee's private chat history with the assistant by default.
create policy "select own chat messages" on chat_messages
  for select using (company_id = auth_company_id() and user_id = auth.uid());

create policy "insert own chat messages" on chat_messages
  for insert with check (company_id = auth_company_id() and user_id = auth.uid());
