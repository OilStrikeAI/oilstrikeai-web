-- OilStrikeAI — team delegation
-- A manager or director can hand a real finding or deadline to a specific
-- employee as a "task", and the employee logs daily progress against it —
-- no penalty for an unfinished task, this is a visibility tool, not a
-- performance-grading one. Seat limits are enforced at invite-time using
-- max_team_seats, ready to be driven by the real billing tier once that
-- exists — for now it defaults to a small number matching the cheapest tier.

alter table companies add column if not exists max_team_seats int not null default 3;

create table tasks (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies (id) on delete cascade,
  discrepancy_id uuid references discrepancies (id) on delete set null,
  obligation_id uuid references obligations (id) on delete set null,
  title text not null,
  description text,
  assigned_to uuid not null references users (id) on delete cascade,
  assigned_by uuid not null references users (id) on delete cascade,
  status text not null default 'open' check (status in ('open', 'in_progress', 'done')),
  due_date date,
  created_at timestamptz not null default now()
);

create index idx_tasks_company on tasks (company_id);
create index idx_tasks_assigned_to on tasks (assigned_to);

create table task_updates (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid not null references tasks (id) on delete cascade,
  company_id uuid not null references companies (id) on delete cascade,
  user_id uuid not null references users (id) on delete cascade,
  note text not null,
  created_at timestamptz not null default now()
);

create index idx_task_updates_task on task_updates (task_id, created_at);

alter table tasks enable row level security;
alter table task_updates enable row level security;

-- Every task is company-scoped for select (so a manager/director sees the
-- whole team's work), but only director/manager roles can create one —
-- an employee can't assign work to themselves or anyone else.
create policy "company scoped select" on tasks
  for select using (company_id = auth_company_id());

create policy "director/manager insert" on tasks
  for insert with check (
    company_id = auth_company_id()
    and exists (
      select 1 from users
      where id = auth.uid() and role in ('director', 'manager')
    )
  );

create policy "director/manager update" on tasks
  for update using (
    company_id = auth_company_id()
    and exists (
      select 1 from users
      where id = auth.uid() and role in ('director', 'manager')
    )
  );

-- Task updates are readable by the whole company (so a manager/director can
-- see an employee's progress notes) but only the task's own assignee can add one.
create policy "company scoped select" on task_updates
  for select using (company_id = auth_company_id());

create policy "assignee insert" on task_updates
  for insert with check (
    company_id = auth_company_id()
    and exists (select 1 from tasks where id = task_id and assigned_to = auth.uid())
  );
