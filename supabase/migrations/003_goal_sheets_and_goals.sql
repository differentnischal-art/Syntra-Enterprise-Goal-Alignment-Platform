-- Fourth Supabase slice — goal sheets and goals for employee create/submit flow.

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- goal_sheets
-- ---------------------------------------------------------------------------

create table public.goal_sheets (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles (id) on delete cascade,
  manager_id uuid references public.profiles (id),
  cycle_id uuid not null references public.goal_cycles (id) on delete cascade,
  status text not null default 'draft' check (
    status in (
      'draft',
      'submitted',
      'pending_approval',
      'approved',
      'returned',
      'locked',
      'final_closed'
    )
  ),
  total_weightage numeric not null default 0,
  goals_count int not null default 0,
  submitted_at timestamptz,
  approved_at timestamptz,
  returned_at timestamptz,
  locked_at timestamptz,
  approved_by uuid references public.profiles (id),
  manager_comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_id, cycle_id)
);

create index goal_sheets_employee_id_idx on public.goal_sheets (employee_id);
create index goal_sheets_manager_id_idx on public.goal_sheets (manager_id);
create index goal_sheets_cycle_id_idx on public.goal_sheets (cycle_id);
create index goal_sheets_status_idx on public.goal_sheets (status);

create trigger goal_sheets_set_updated_at
  before update on public.goal_sheets
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- goals
-- ---------------------------------------------------------------------------

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  goal_sheet_id uuid not null references public.goal_sheets (id) on delete cascade,
  employee_id uuid not null references public.profiles (id) on delete cascade,
  thrust_area_id uuid references public.thrust_areas (id),
  title text not null,
  description text,
  uom_type text not null check (
    uom_type in (
      'numeric_higher_better',
      'numeric_lower_better',
      'percentage',
      'timeline',
      'zero_based'
    )
  ),
  target numeric not null,
  weightage numeric not null check (weightage >= 10 and weightage <= 100),
  status text not null default 'not_started' check (
    status in ('not_started', 'on_track', 'completed', 'overdue')
  ),
  approval_status text not null default 'draft' check (
    approval_status in ('draft', 'pending', 'approved', 'returned')
  ),
  is_shared boolean not null default false,
  is_locked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index goals_goal_sheet_id_idx on public.goals (goal_sheet_id);
create index goals_employee_id_idx on public.goals (employee_id);
create index goals_thrust_area_id_idx on public.goals (thrust_area_id);
create index goals_status_idx on public.goals (status);
create index goals_approval_status_idx on public.goals (approval_status);

create trigger goals_set_updated_at
  before update on public.goals
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.goal_sheets enable row level security;
alter table public.goals enable row level security;

-- goal_sheets: employee read own
create policy "Employees can select own goal sheets"
  on public.goal_sheets
  for select
  to authenticated
  using (employee_id = auth.uid());

-- goal_sheets: employee insert own
create policy "Employees can insert own goal sheets"
  on public.goal_sheets
  for insert
  to authenticated
  with check (employee_id = auth.uid());

-- goal_sheets: employee update own when draft or returned
create policy "Employees can update own draft or returned goal sheets"
  on public.goal_sheets
  for update
  to authenticated
  using (employee_id = auth.uid() and status in ('draft', 'returned'))
  with check (employee_id = auth.uid() and status in ('draft', 'returned', 'pending_approval', 'submitted'));

-- goal_sheets: manager read team sheets
create policy "Managers can select team goal sheets"
  on public.goal_sheets
  for select
  to authenticated
  using (manager_id = auth.uid());

-- goal_sheets: admin read all
create policy "Admins can select all goal sheets"
  on public.goal_sheets
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

-- goals: employee select own
create policy "Employees can select own goals"
  on public.goals
  for select
  to authenticated
  using (employee_id = auth.uid());

-- goals: employee insert own
create policy "Employees can insert own goals"
  on public.goals
  for insert
  to authenticated
  with check (employee_id = auth.uid());

-- goals: employee update when not locked
create policy "Employees can update own unlocked goals"
  on public.goals
  for update
  to authenticated
  using (employee_id = auth.uid() and is_locked = false)
  with check (employee_id = auth.uid() and is_locked = false);

-- goals: employee delete when not locked
create policy "Employees can delete own unlocked goals"
  on public.goals
  for delete
  to authenticated
  using (employee_id = auth.uid() and is_locked = false);

-- goals: manager select team goals
create policy "Managers can select team goals"
  on public.goals
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.goal_sheets gs
      where gs.id = goals.goal_sheet_id
        and gs.manager_id = auth.uid()
    )
  );

-- goals: admin select all
create policy "Admins can select all goals"
  on public.goals
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
