-- Ninth Supabase slice - production hardening for UoM semantics and shared goals.

-- ---------------------------------------------------------------------------
-- Goal target semantics
-- ---------------------------------------------------------------------------

alter table public.goals
  add column if not exists target_date date;

alter table public.goals
  drop constraint if exists goals_uom_type_check;

alter table public.goals
  add constraint goals_uom_type_check
  check (
    uom_type in (
      'numeric_higher_better',
      'numeric_lower_better',
      'percentage',
      'percentage_higher_better',
      'percentage_lower_better',
      'timeline',
      'zero_based'
    )
  );

alter table public.goals
  drop constraint if exists goals_target_semantics_check;

alter table public.goals
  add constraint goals_target_semantics_check
  check (
    case
      when uom_type = 'timeline'
        then target_date is not null
      when uom_type = 'zero_based'
        then target = 0
      when uom_type in ('percentage', 'percentage_higher_better', 'percentage_lower_better')
        then target >= 0 and target <= 100
      else target >= 0
    end
  );

alter table public.quarterly_checkins
  add column if not exists planned_target_date date,
  add column if not exists actual_completion_date date;

-- ---------------------------------------------------------------------------
-- Shared goals
-- ---------------------------------------------------------------------------

create table if not exists public.shared_goals (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references public.goal_cycles (id) on delete cascade,
  created_by uuid not null references public.profiles (id),
  primary_owner_id uuid not null references public.profiles (id),
  thrust_area_id uuid references public.thrust_areas (id),
  title text not null,
  description text,
  uom_type text not null check (
    uom_type in (
      'numeric_higher_better',
      'numeric_lower_better',
      'percentage',
      'percentage_higher_better',
      'percentage_lower_better',
      'timeline',
      'zero_based'
    )
  ),
  target numeric not null default 0,
  target_date date,
  synced_actual_achievement numeric,
  status text not null default 'active' check (status in ('active', 'locked', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shared_goals_target_semantics_check check (
    case
      when uom_type = 'timeline'
        then target_date is not null
      when uom_type = 'zero_based'
        then target = 0
      when uom_type in ('percentage', 'percentage_higher_better', 'percentage_lower_better')
        then target >= 0 and target <= 100
      else target >= 0
    end
  )
);

create table if not exists public.shared_goal_assignments (
  id uuid primary key default gen_random_uuid(),
  shared_goal_id uuid not null references public.shared_goals (id) on delete cascade,
  employee_id uuid not null references public.profiles (id) on delete cascade,
  goal_id uuid references public.goals (id) on delete set null,
  weightage numeric check (weightage is null or (weightage >= 10 and weightage <= 100)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shared_goal_id, employee_id)
);

create index if not exists shared_goals_cycle_id_idx
  on public.shared_goals (cycle_id);

create index if not exists shared_goals_primary_owner_id_idx
  on public.shared_goals (primary_owner_id);

create index if not exists shared_goal_assignments_shared_goal_id_idx
  on public.shared_goal_assignments (shared_goal_id);

create index if not exists shared_goal_assignments_employee_id_idx
  on public.shared_goal_assignments (employee_id);

drop trigger if exists shared_goals_set_updated_at on public.shared_goals;
create trigger shared_goals_set_updated_at
  before update on public.shared_goals
  for each row
  execute function public.set_updated_at();

drop trigger if exists shared_goal_assignments_set_updated_at on public.shared_goal_assignments;
create trigger shared_goal_assignments_set_updated_at
  before update on public.shared_goal_assignments
  for each row
  execute function public.set_updated_at();

alter table public.shared_goals enable row level security;
alter table public.shared_goal_assignments enable row level security;

-- ---------------------------------------------------------------------------
-- Goal-sheet editing hardening
-- ---------------------------------------------------------------------------

drop policy if exists "Employees can update own unlocked goals" on public.goals;
create policy "Employees can update own unlocked goals"
  on public.goals
  for update
  to authenticated
  using (
    employee_id = auth.uid()
    and is_locked = false
    and exists (
      select 1
      from public.goal_sheets gs
      where gs.id = goals.goal_sheet_id
        and gs.employee_id = auth.uid()
        and gs.status in ('draft', 'returned')
    )
  )
  with check (
    employee_id = auth.uid()
    and is_locked = false
    and exists (
      select 1
      from public.goal_sheets gs
      where gs.id = goals.goal_sheet_id
        and gs.employee_id = auth.uid()
        and gs.status in ('draft', 'returned')
    )
  );

drop policy if exists "Employees can delete own unlocked goals" on public.goals;
create policy "Employees can delete own unlocked goals"
  on public.goals
  for delete
  to authenticated
  using (
    employee_id = auth.uid()
    and is_locked = false
    and exists (
      select 1
      from public.goal_sheets gs
      where gs.id = goals.goal_sheet_id
        and gs.employee_id = auth.uid()
        and gs.status in ('draft', 'returned')
    )
  );

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'goal_sheets'
      and policyname = 'Admins can manage all goal sheets'
  ) then
    create policy "Admins can manage all goal sheets"
      on public.goal_sheets
      for all
      to authenticated
      using (
        exists (
          select 1
          from public.profiles p
          where p.id = auth.uid()
            and p.role = 'admin'
        )
      )
      with check (
        exists (
          select 1
          from public.profiles p
          where p.id = auth.uid()
            and p.role = 'admin'
        )
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'goals'
      and policyname = 'Admins can manage all goals'
  ) then
    create policy "Admins can manage all goals"
      on public.goals
      for all
      to authenticated
      using (
        exists (
          select 1
          from public.profiles p
          where p.id = auth.uid()
            and p.role = 'admin'
        )
      )
      with check (
        exists (
          select 1
          from public.profiles p
          where p.id = auth.uid()
            and p.role = 'admin'
        )
      );
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Shared-goal RLS
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'shared_goals'
      and policyname = 'Admins and managers can select shared goals'
  ) then
    create policy "Admins and managers can select shared goals"
      on public.shared_goals
      for select
      to authenticated
      using (
        created_by = auth.uid()
        or primary_owner_id = auth.uid()
        or exists (
          select 1
          from public.profiles p
          where p.id = auth.uid()
            and p.role = 'admin'
        )
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'shared_goals'
      and policyname = 'Admins and managers can create shared goals'
  ) then
    create policy "Admins and managers can create shared goals"
      on public.shared_goals
      for insert
      to authenticated
      with check (
        created_by = auth.uid()
        and (
          exists (
            select 1
            from public.profiles p
            where p.id = auth.uid()
              and p.role in ('manager', 'admin')
          )
        )
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'shared_goal_assignments'
      and policyname = 'Employees can select own shared goal assignments'
  ) then
    create policy "Employees can select own shared goal assignments"
      on public.shared_goal_assignments
      for select
      to authenticated
      using (employee_id = auth.uid());
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'shared_goal_assignments'
      and policyname = 'Admins and managers can manage shared goal assignments'
  ) then
    create policy "Admins and managers can manage shared goal assignments"
      on public.shared_goal_assignments
      for all
      to authenticated
      using (
        exists (
          select 1
          from public.shared_goals sg
          join public.profiles p on p.id = auth.uid()
          where sg.id = shared_goal_assignments.shared_goal_id
            and (
              p.role = 'admin'
              or sg.created_by = auth.uid()
              or sg.primary_owner_id = auth.uid()
            )
        )
      )
      with check (
        exists (
          select 1
          from public.shared_goals sg
          join public.profiles p on p.id = auth.uid()
          where sg.id = shared_goal_assignments.shared_goal_id
            and (
              p.role = 'admin'
              or sg.created_by = auth.uid()
              or sg.primary_owner_id = auth.uid()
            )
        )
      );
  end if;
end
$$;
