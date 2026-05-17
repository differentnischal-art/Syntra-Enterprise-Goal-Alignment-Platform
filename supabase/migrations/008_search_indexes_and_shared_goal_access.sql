-- Search indexes and assigned shared-goal read access.
-- Non-destructive: no table drops, truncates, or row rewrites.

create extension if not exists pg_trgm;

create index if not exists goals_title_trgm_idx
  on public.goals using gin (title gin_trgm_ops);

create index if not exists goals_description_trgm_idx
  on public.goals using gin (description gin_trgm_ops);

create index if not exists thrust_areas_name_trgm_idx
  on public.thrust_areas using gin (name gin_trgm_ops);

create index if not exists profiles_full_name_trgm_idx
  on public.profiles using gin (full_name gin_trgm_ops);

create index if not exists profiles_email_trgm_idx
  on public.profiles using gin (email gin_trgm_ops);

create index if not exists goal_sheets_employee_id_idx
  on public.goal_sheets (employee_id);

create index if not exists shared_goals_title_trgm_idx
  on public.shared_goals using gin (title gin_trgm_ops);

create index if not exists shared_goals_description_trgm_idx
  on public.shared_goals using gin (description gin_trgm_ops);

create index if not exists shared_goal_assignments_employee_id_idx
  on public.shared_goal_assignments (employee_id);

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'shared_goals'
      and policyname = 'Employees can select assigned shared goals'
  ) then
    create policy "Employees can select assigned shared goals"
      on public.shared_goals
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.shared_goal_assignments sga
          where sga.shared_goal_id = shared_goals.id
            and sga.employee_id = auth.uid()
        )
      );
  end if;
end
$$;
