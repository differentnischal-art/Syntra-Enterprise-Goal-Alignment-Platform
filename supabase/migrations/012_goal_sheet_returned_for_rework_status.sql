-- Allow the admin unlock lifecycle to use returned_for_rework/unlocked.
-- This is schema-only and does not delete, reset, or duplicate live data.

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
      'returned_for_rework',
      'rejected',
      'rework_required',
      'unlocked',
      'locked',
      'final_closed'
    )
  ) not valid;

drop policy if exists "Employees can update own draft or returned goal sheets" on public.goal_sheets;
create policy "Employees can update own draft or returned goal sheets"
  on public.goal_sheets
  for update
  to authenticated
  using (
    employee_id = auth.uid()
    and is_locked = false
    and status in ('draft', 'returned', 'returned_for_rework', 'rejected', 'rework_required', 'unlocked')
  )
  with check (
    employee_id = auth.uid()
    and is_locked = false
    and status in ('draft', 'submitted', 'pending_approval', 'returned', 'returned_for_rework', 'rejected', 'rework_required', 'unlocked')
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
        and gs.status in ('draft', 'returned', 'returned_for_rework', 'rejected', 'rework_required', 'unlocked')
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
        and gs.status in ('draft', 'returned', 'returned_for_rework', 'rejected', 'rework_required', 'unlocked')
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
        and gs.status in ('draft', 'returned', 'returned_for_rework', 'rejected', 'rework_required', 'unlocked')
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
        and gs.status in ('draft', 'returned', 'returned_for_rework', 'rejected', 'rework_required', 'unlocked')
    )
  );
