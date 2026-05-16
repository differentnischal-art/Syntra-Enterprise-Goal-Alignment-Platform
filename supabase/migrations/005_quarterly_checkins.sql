-- Seventh Supabase slice - employee quarterly check-ins and manager comments.

-- ---------------------------------------------------------------------------
-- quarterly_checkins
-- ---------------------------------------------------------------------------

create table public.quarterly_checkins (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals (id) on delete cascade,
  goal_sheet_id uuid not null references public.goal_sheets (id) on delete cascade,
  employee_id uuid not null references public.profiles (id) on delete cascade,
  quarter text not null check (quarter in ('q1', 'q2', 'q3', 'q4')),
  planned_target numeric not null,
  actual_achievement numeric,
  computed_score numeric,
  status text not null default 'not_started' check (
    status in ('not_started', 'on_track', 'completed', 'overdue')
  ),
  employee_note text,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (goal_id, quarter)
);

create index quarterly_checkins_goal_id_idx
  on public.quarterly_checkins (goal_id);

create index quarterly_checkins_goal_sheet_id_idx
  on public.quarterly_checkins (goal_sheet_id);

create index quarterly_checkins_employee_id_idx
  on public.quarterly_checkins (employee_id);

create index quarterly_checkins_quarter_idx
  on public.quarterly_checkins (quarter);

create trigger quarterly_checkins_set_updated_at
  before update on public.quarterly_checkins
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- manager_checkin_comments
-- ---------------------------------------------------------------------------

create table public.manager_checkin_comments (
  id uuid primary key default gen_random_uuid(),
  checkin_id uuid not null references public.quarterly_checkins (id) on delete cascade,
  manager_id uuid not null references public.profiles (id),
  comment_type text check (
    comment_type in ('coaching', 'appreciation', 'needs_improvement', 'escalation')
    or comment_type is null
  ),
  comment text not null,
  created_at timestamptz not null default now()
);

create index manager_checkin_comments_checkin_id_idx
  on public.manager_checkin_comments (checkin_id);

create index manager_checkin_comments_manager_id_idx
  on public.manager_checkin_comments (manager_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.quarterly_checkins enable row level security;
alter table public.manager_checkin_comments enable row level security;

-- quarterly_checkins: employee read own
create policy "Employees can select own quarterly checkins"
  on public.quarterly_checkins
  for select
  to authenticated
  using (employee_id = auth.uid());

-- quarterly_checkins: employee insert own
create policy "Employees can insert own quarterly checkins"
  on public.quarterly_checkins
  for insert
  to authenticated
  with check (employee_id = auth.uid());

-- quarterly_checkins: employee update own
create policy "Employees can update own quarterly checkins"
  on public.quarterly_checkins
  for update
  to authenticated
  using (employee_id = auth.uid())
  with check (employee_id = auth.uid());

-- quarterly_checkins: manager read team check-ins
create policy "Managers can select team quarterly checkins"
  on public.quarterly_checkins
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.goal_sheets gs
      where gs.id = quarterly_checkins.goal_sheet_id
        and gs.manager_id = auth.uid()
    )
  );

-- quarterly_checkins: admin read all
create policy "Admins can select all quarterly checkins"
  on public.quarterly_checkins
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  );

-- manager_checkin_comments: manager insert for team check-ins
create policy "Managers can insert comments for team checkins"
  on public.manager_checkin_comments
  for insert
  to authenticated
  with check (
    manager_id = auth.uid()
    and exists (
      select 1
      from public.quarterly_checkins qc
      join public.goal_sheets gs on gs.id = qc.goal_sheet_id
      where qc.id = manager_checkin_comments.checkin_id
        and gs.manager_id = auth.uid()
    )
  );

-- manager_checkin_comments: manager read team comments
create policy "Managers can select comments for team checkins"
  on public.manager_checkin_comments
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.quarterly_checkins qc
      join public.goal_sheets gs on gs.id = qc.goal_sheet_id
      where qc.id = manager_checkin_comments.checkin_id
        and gs.manager_id = auth.uid()
    )
  );

-- manager_checkin_comments: employee read own check-in comments
create policy "Employees can select comments on own checkins"
  on public.manager_checkin_comments
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.quarterly_checkins qc
      where qc.id = manager_checkin_comments.checkin_id
        and qc.employee_id = auth.uid()
    )
  );

-- manager_checkin_comments: admin read all
create policy "Admins can select all manager checkin comments"
  on public.manager_checkin_comments
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  );
