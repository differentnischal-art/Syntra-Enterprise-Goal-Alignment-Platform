-- Live admin cycle-window management.

alter table public.cycle_windows
  add column if not exists window_key text,
  add column if not exists title text,
  add column if not exists status text not null default 'closed',
  add column if not exists opened_at timestamptz,
  add column if not exists closed_at timestamptz,
  add column if not exists opened_by uuid references public.profiles (id),
  add column if not exists closed_by uuid references public.profiles (id),
  add column if not exists updated_at timestamptz not null default now();

update public.cycle_windows
set
  window_key = coalesce(
    window_key,
    case
      when action = 'goal_creation' then 'goal_setting'
      when quarter = 'q1' then 'q1_checkin'
      when quarter = 'q2' then 'q2_checkin'
      when quarter = 'q3' then 'q3_checkin'
      when quarter = 'q4' then 'q4_annual'
      else lower(regexp_replace(period, '[^a-zA-Z0-9]+', '_', 'g'))
    end
  ),
  title = coalesce(title, period),
  status = case
    when status = 'open' or is_open = true then 'open'
    when status = 'completed' then 'completed'
    else 'closed'
  end;

alter table public.cycle_windows
  alter column window_key set not null,
  alter column title set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'cycle_windows_status_check'
      and conrelid = 'public.cycle_windows'::regclass
  ) then
    alter table public.cycle_windows
      add constraint cycle_windows_status_check
      check (status in ('open', 'closed', 'completed'));
  end if;
end
$$;

create unique index if not exists cycle_windows_cycle_id_window_key_key
  on public.cycle_windows (cycle_id, window_key);

create or replace function public.create_default_fy26_cycle_windows(p_cycle_id uuid)
returns void
language sql
as $$
  insert into public.cycle_windows
    (
      cycle_id,
      window_key,
      title,
      period,
      quarter,
      window_opens,
      window_closes,
      action,
      is_open,
      status
    )
  values
    (
      p_cycle_id,
      'goal_setting',
      'Phase 1 — Goal Setting',
      'Phase 1 — Goal Setting',
      null,
      '2025-05-01',
      '2025-05-31',
      'goal_creation',
      false,
      'closed'
    ),
    (
      p_cycle_id,
      'q1_checkin',
      'Q1 Check-in',
      'Q1 Check-in',
      'q1',
      '2025-07-01',
      '2025-07-15',
      'checkin',
      false,
      'closed'
    ),
    (
      p_cycle_id,
      'q2_checkin',
      'Q2 Check-in',
      'Q2 Check-in',
      'q2',
      '2025-10-01',
      '2025-10-15',
      'checkin',
      false,
      'closed'
    ),
    (
      p_cycle_id,
      'q3_checkin',
      'Q3 Check-in',
      'Q3 Check-in',
      'q3',
      '2026-01-01',
      '2026-01-15',
      'checkin',
      false,
      'closed'
    ),
    (
      p_cycle_id,
      'q4_annual',
      'Q4 / Annual',
      'Q4 / Annual',
      'q4',
      '2026-03-15',
      '2026-04-15',
      'checkin',
      false,
      'closed'
    )
  on conflict (cycle_id, window_key) do nothing;
$$;

grant execute on function public.create_default_fy26_cycle_windows(uuid) to authenticated;

drop trigger if exists cycle_windows_set_updated_at on public.cycle_windows;
create trigger cycle_windows_set_updated_at
  before update on public.cycle_windows
  for each row
  execute function public.set_updated_at();

drop policy if exists "Admins can manage cycle windows" on public.cycle_windows;
create policy "Admins can manage cycle windows"
  on public.cycle_windows
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

drop policy if exists "Authenticated users can read open cycle windows" on public.cycle_windows;
create policy "Authenticated users can read open cycle windows"
  on public.cycle_windows
  for select
  to authenticated
  using (
    status = 'open'
    and exists (
      select 1
      from public.goal_cycles gc
      where gc.id = cycle_windows.cycle_id
        and gc.status = 'active'
    )
  );
