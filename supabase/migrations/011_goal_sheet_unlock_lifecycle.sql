-- Goal sheet unlock / exception lifecycle.
-- Safe for live projects: no deletes, truncates, or destructive data resets.

alter table public.goal_sheets
  add column if not exists is_locked boolean not null default false,
  add column if not exists unlocked_at timestamptz,
  add column if not exists unlocked_by uuid references public.profiles (id) on delete set null,
  add column if not exists unlock_reason text;

alter table public.goal_sheets
  add column if not exists locked_at timestamptz;

alter table public.goal_sheets
  alter column is_locked set default false;

update public.goal_sheets
set is_locked = true,
    locked_at = coalesce(locked_at, approved_at, updated_at, now())
where status in ('approved', 'locked')
  and is_locked is distinct from true;

update public.goal_sheets
set is_locked = false
where status in ('draft', 'submitted', 'pending_approval', 'returned', 'rejected', 'rework_required')
  and is_locked is distinct from false;

alter table public.goal_sheets
  drop constraint if exists goal_sheets_status_check;

alter table public.goal_sheets
  add constraint goal_sheets_status_check
  check (
    status in (
      'draft',
      'submitted',
      'pending_approval',
      'approved',
      'returned',
      'rejected',
      'rework_required',
      'locked',
      'final_closed'
    )
  ) not valid;

create index if not exists goal_sheets_is_locked_idx
  on public.goal_sheets (is_locked);

create index if not exists goal_sheets_unlocked_at_idx
  on public.goal_sheets (unlocked_at);

drop policy if exists "Employees can update own draft or returned goal sheets" on public.goal_sheets;
create policy "Employees can update own draft or returned goal sheets"
  on public.goal_sheets
  for update
  to authenticated
  using (
    employee_id = auth.uid()
    and is_locked = false
    and status in ('draft', 'returned', 'rejected', 'rework_required')
  )
  with check (
    employee_id = auth.uid()
    and is_locked = false
    and status in ('draft', 'submitted', 'pending_approval', 'returned', 'rejected', 'rework_required')
  );

drop policy if exists "Admins can update goal sheet unlock lifecycle" on public.goal_sheets;
create policy "Admins can update goal sheet unlock lifecycle"
  on public.goal_sheets
  for update
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

drop policy if exists "Employees can insert own goals" on public.goals;
create policy "Employees can insert own goals"
  on public.goals
  for insert
  to authenticated
  with check (
    employee_id = auth.uid()
    and is_locked = false
    and exists (
      select 1
      from public.goal_sheets gs
      where gs.id = goals.goal_sheet_id
        and gs.employee_id = auth.uid()
        and gs.is_locked = false
        and gs.status in ('draft', 'returned', 'rejected', 'rework_required')
    )
  );

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
        and gs.is_locked = false
        and gs.status in ('draft', 'returned', 'rejected', 'rework_required')
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
        and gs.is_locked = false
        and gs.status in ('draft', 'returned', 'rejected', 'rework_required')
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
    and is_shared = false
    and exists (
      select 1
      from public.goal_sheets gs
      where gs.id = goals.goal_sheet_id
        and gs.employee_id = auth.uid()
        and gs.is_locked = false
        and gs.status in ('draft', 'returned', 'rejected', 'rework_required')
    )
  );

drop policy if exists "Admins can update goal lock lifecycle" on public.goals;
create policy "Admins can update goal lock lifecycle"
  on public.goals
  for update
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
