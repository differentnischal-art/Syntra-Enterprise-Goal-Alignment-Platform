-- Admin portal hardening for production demo.
-- Non-destructive: additive policies/table and seed only when empty.

do $$
declare
  fy26_cycle_id uuid;
begin
  if not exists (select 1 from public.goal_cycles) then
    insert into public.goal_cycles (name, year, start_date, end_date, status)
    values ('FY26 Goal Cycle', 2026, '2025-04-01', '2026-03-31', 'active')
    returning id into fy26_cycle_id;

    insert into public.cycle_windows
      (cycle_id, period, quarter, window_opens, window_closes, action, is_open)
    values
      (fy26_cycle_id, 'Goal Creation', null, '2025-05-01', '2025-05-31', 'goal_creation', false),
      (fy26_cycle_id, 'Q1 Check-in', 'q1', '2025-07-01', '2025-07-15', 'checkin', false),
      (fy26_cycle_id, 'Q2 Check-in', 'q2', '2025-10-01', '2025-10-15', 'checkin', false),
      (fy26_cycle_id, 'Q3 Check-in', 'q3', '2026-01-01', '2026-01-15', 'checkin', false),
      (fy26_cycle_id, 'Q4 / Annual Review', 'q4', '2026-03-15', '2026-03-31', 'checkin', false);
  end if;
end
$$;

create table if not exists public.reminder_logs (
  id uuid primary key default gen_random_uuid(),
  escalation_type text not null,
  target_user_id uuid references public.profiles (id),
  created_by uuid references public.profiles (id),
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists reminder_logs_target_user_id_idx
  on public.reminder_logs (target_user_id);

create index if not exists reminder_logs_created_by_idx
  on public.reminder_logs (created_by);

alter table public.reminder_logs enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'reminder_logs'
      and policyname = 'Admins can manage reminder logs'
  ) then
    create policy "Admins can manage reminder logs"
      on public.reminder_logs
      for all
      to authenticated
      using (
        exists (
          select 1 from public.profiles p
          where p.id = auth.uid()
            and p.role = 'admin'
        )
      )
      with check (
        exists (
          select 1 from public.profiles p
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
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'cycle_windows'
      and policyname = 'Admins can manage cycle windows'
  ) then
    create policy "Admins can manage cycle windows"
      on public.cycle_windows
      for all
      to authenticated
      using (
        exists (
          select 1 from public.profiles p
          where p.id = auth.uid()
            and p.role = 'admin'
        )
      )
      with check (
        exists (
          select 1 from public.profiles p
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
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'goal_cycles'
      and policyname = 'Admins can manage goal cycles'
  ) then
    create policy "Admins can manage goal cycles"
      on public.goal_cycles
      for all
      to authenticated
      using (
        exists (
          select 1 from public.profiles p
          where p.id = auth.uid()
            and p.role = 'admin'
        )
      )
      with check (
        exists (
          select 1 from public.profiles p
          where p.id = auth.uid()
            and p.role = 'admin'
        )
      );
  end if;
end
$$;
