-- Shared goals live repair.
-- Safe to run on an existing Supabase project: no drops, truncates, or data rewrites.

create extension if not exists "pgcrypto";

create table if not exists public.shared_goals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  thrust_area_id uuid references public.thrust_areas (id) on delete set null,
  thrust_area text,
  uom_type text default 'numeric_higher_better',
  direction text default 'higher_is_better',
  target numeric default 0,
  target_text text,
  target_date date,
  synced_actual_achievement numeric,
  primary_owner_id uuid references public.profiles (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  cycle_id uuid references public.goal_cycles (id) on delete set null,
  status text default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shared_goal_assignments (
  id uuid primary key default gen_random_uuid(),
  shared_goal_id uuid not null references public.shared_goals (id) on delete cascade,
  employee_id uuid not null references public.profiles (id) on delete cascade,
  goal_id uuid references public.goals (id) on delete set null,
  weightage numeric default 10,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shared_goal_id, employee_id)
);

alter table public.shared_goals
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists thrust_area_id uuid,
  add column if not exists thrust_area text,
  add column if not exists uom_type text default 'numeric_higher_better',
  add column if not exists direction text default 'higher_is_better',
  add column if not exists target numeric default 0,
  add column if not exists target_text text,
  add column if not exists target_date date,
  add column if not exists synced_actual_achievement numeric,
  add column if not exists primary_owner_id uuid,
  add column if not exists created_by uuid,
  add column if not exists cycle_id uuid,
  add column if not exists status text default 'active',
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table public.shared_goal_assignments
  add column if not exists shared_goal_id uuid,
  add column if not exists employee_id uuid,
  add column if not exists goal_id uuid,
  add column if not exists weightage numeric default 10,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table public.shared_goals
  alter column uom_type set default 'numeric_higher_better',
  alter column direction set default 'higher_is_better',
  alter column target set default 0,
  alter column status set default 'active',
  alter column created_at set default now(),
  alter column updated_at set default now();

alter table public.shared_goal_assignments
  alter column weightage set default 10,
  alter column created_at set default now(),
  alter column updated_at set default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'shared_goals_thrust_area_id_fkey'
      and conrelid = 'public.shared_goals'::regclass
  ) then
    alter table public.shared_goals
      add constraint shared_goals_thrust_area_id_fkey
      foreign key (thrust_area_id) references public.thrust_areas (id)
      on delete set null not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'shared_goals_primary_owner_id_fkey'
      and conrelid = 'public.shared_goals'::regclass
  ) then
    alter table public.shared_goals
      add constraint shared_goals_primary_owner_id_fkey
      foreign key (primary_owner_id) references public.profiles (id)
      on delete set null not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'shared_goals_created_by_fkey'
      and conrelid = 'public.shared_goals'::regclass
  ) then
    alter table public.shared_goals
      add constraint shared_goals_created_by_fkey
      foreign key (created_by) references public.profiles (id)
      on delete set null not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'shared_goals_cycle_id_fkey'
      and conrelid = 'public.shared_goals'::regclass
  ) then
    alter table public.shared_goals
      add constraint shared_goals_cycle_id_fkey
      foreign key (cycle_id) references public.goal_cycles (id)
      on delete set null not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'shared_goal_assignments_shared_goal_id_fkey'
      and conrelid = 'public.shared_goal_assignments'::regclass
  ) then
    alter table public.shared_goal_assignments
      add constraint shared_goal_assignments_shared_goal_id_fkey
      foreign key (shared_goal_id) references public.shared_goals (id)
      on delete cascade not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'shared_goal_assignments_employee_id_fkey'
      and conrelid = 'public.shared_goal_assignments'::regclass
  ) then
    alter table public.shared_goal_assignments
      add constraint shared_goal_assignments_employee_id_fkey
      foreign key (employee_id) references public.profiles (id)
      on delete cascade not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'shared_goal_assignments_goal_id_fkey'
      and conrelid = 'public.shared_goal_assignments'::regclass
  ) then
    alter table public.shared_goal_assignments
      add constraint shared_goal_assignments_goal_id_fkey
      foreign key (goal_id) references public.goals (id)
      on delete set null not valid;
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'shared_goal_assignments_shared_goal_id_employee_id_key'
      and conrelid = 'public.shared_goal_assignments'::regclass
  ) then
    begin
      alter table public.shared_goal_assignments
        add constraint shared_goal_assignments_shared_goal_id_employee_id_key
        unique (shared_goal_id, employee_id);
    exception
      when unique_violation then
        raise notice 'Skipped shared_goal_assignments unique constraint because duplicate rows already exist.';
    end;
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'shared_goals_uom_type_check'
      and conrelid = 'public.shared_goals'::regclass
  ) then
    alter table public.shared_goals
      add constraint shared_goals_uom_type_check
      check (
        uom_type is null
        or uom_type in (
          'numeric_higher_better',
          'numeric_lower_better',
          'percentage',
          'percentage_higher_better',
          'percentage_lower_better',
          'timeline',
          'zero_based'
        )
      ) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'shared_goals_status_check'
      and conrelid = 'public.shared_goals'::regclass
  ) then
    alter table public.shared_goals
      add constraint shared_goals_status_check
      check (status is null or status in ('active', 'locked', 'archived'))
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'shared_goal_assignments_weightage_check'
      and conrelid = 'public.shared_goal_assignments'::regclass
  ) then
    alter table public.shared_goal_assignments
      add constraint shared_goal_assignments_weightage_check
      check (weightage is null or (weightage >= 0 and weightage <= 100))
      not valid;
  end if;
end
$$;

create index if not exists idx_shared_goals_primary_owner
  on public.shared_goals (primary_owner_id);

create index if not exists idx_shared_goals_created_by
  on public.shared_goals (created_by);

create index if not exists idx_shared_goals_cycle
  on public.shared_goals (cycle_id);

create index if not exists idx_shared_goal_assignments_employee
  on public.shared_goal_assignments (employee_id);

create index if not exists idx_shared_goal_assignments_shared_goal
  on public.shared_goal_assignments (shared_goal_id);

create index if not exists idx_shared_goal_assignments_goal
  on public.shared_goal_assignments (goal_id);

do $$
begin
  if to_regprocedure('public.set_updated_at()') is not null then
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
  end if;
end
$$;

create or replace function public.prevent_shared_goal_assignment_employee_unsafe_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() = old.employee_id
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'employee'
    )
  then
    if new.id is distinct from old.id
      or new.shared_goal_id is distinct from old.shared_goal_id
      or new.employee_id is distinct from old.employee_id
      or new.goal_id is distinct from old.goal_id
      or new.created_at is distinct from old.created_at
    then
      raise exception 'Employees may only update shared goal assignment weightage';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_shared_goal_assignment_employee_update
  on public.shared_goal_assignments;

create trigger protect_shared_goal_assignment_employee_update
  before update on public.shared_goal_assignments
  for each row
  execute function public.prevent_shared_goal_assignment_employee_unsafe_update();

create or replace function public.is_shared_goal_assignee(goal_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.shared_goal_assignments sga
    where sga.shared_goal_id = goal_id
      and sga.employee_id = auth.uid()
  );
$$;

alter table public.shared_goals enable row level security;
alter table public.shared_goal_assignments enable row level security;

drop policy if exists "Admins and HR can manage shared goals" on public.shared_goals;
create policy "Admins and HR can manage shared goals"
  on public.shared_goals
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'hr')
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'hr')
    )
  );

drop policy if exists "Managers can select owned shared goals" on public.shared_goals;
create policy "Managers can select owned shared goals"
  on public.shared_goals
  for select
  to authenticated
  using (
    (created_by = auth.uid() or primary_owner_id = auth.uid())
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'manager'
    )
  );

drop policy if exists "Employees can select assigned shared goals" on public.shared_goals;
create policy "Employees can select assigned shared goals"
  on public.shared_goals
  for select
  to authenticated
  using (public.is_shared_goal_assignee(id));

drop policy if exists "Admins and HR can manage shared goal assignments" on public.shared_goal_assignments;
create policy "Admins and HR can manage shared goal assignments"
  on public.shared_goal_assignments
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'hr')
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'hr')
    )
  );

drop policy if exists "Managers can select owned shared goal assignments" on public.shared_goal_assignments;
create policy "Managers can select owned shared goal assignments"
  on public.shared_goal_assignments
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.shared_goals sg
      join public.profiles p on p.id = auth.uid()
      where sg.id = shared_goal_assignments.shared_goal_id
        and p.role = 'manager'
        and (sg.created_by = auth.uid() or sg.primary_owner_id = auth.uid())
    )
  );

drop policy if exists "Employees can select assigned shared goal assignments" on public.shared_goal_assignments;
create policy "Employees can select assigned shared goal assignments"
  on public.shared_goal_assignments
  for select
  to authenticated
  using (
    employee_id = auth.uid()
    or public.is_shared_goal_assignee(shared_goal_id)
  );

drop policy if exists "Employees can update own shared goal assignment weightage" on public.shared_goal_assignments;
create policy "Employees can update own shared goal assignment weightage"
  on public.shared_goal_assignments
  for update
  to authenticated
  using (employee_id = auth.uid())
  with check (employee_id = auth.uid());
