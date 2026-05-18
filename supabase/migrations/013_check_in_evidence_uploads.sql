-- Add quarterly check-in evidence uploads.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'check-in-evidence',
  'check-in-evidence',
  false,
  10485760,
  array[
    'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/octet-stream'
  ]
)
on conflict (id) do update
set
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.check_in_attachments (
  id uuid primary key default gen_random_uuid(),
  check_in_id uuid null references public.quarterly_checkins (id) on delete set null,
  goal_sheet_id uuid not null references public.goal_sheets (id) on delete cascade,
  employee_id uuid not null references public.profiles (id) on delete cascade,
  cycle_id uuid not null references public.goal_cycles (id) on delete cascade,
  quarter text not null check (quarter in ('q1', 'q2', 'q3', 'q4')),
  file_name text not null,
  file_type text not null,
  file_size bigint not null check (file_size > 0 and file_size <= 10485760),
  storage_path text not null,
  uploaded_by uuid not null references public.profiles (id),
  uploaded_at timestamptz not null default now()
);

create index if not exists check_in_attachments_goal_sheet_id_idx
  on public.check_in_attachments (goal_sheet_id);

create index if not exists check_in_attachments_employee_id_idx
  on public.check_in_attachments (employee_id);

create index if not exists check_in_attachments_cycle_quarter_idx
  on public.check_in_attachments (cycle_id, quarter);

create unique index if not exists check_in_attachments_storage_path_idx
  on public.check_in_attachments (storage_path);

alter table public.check_in_attachments enable row level security;

drop policy if exists "Employees can insert own check-in attachments" on public.check_in_attachments;
create policy "Employees can insert own check-in attachments"
  on public.check_in_attachments
  for insert
  to authenticated
  with check (
    employee_id = auth.uid()
    and uploaded_by = auth.uid()
    and exists (
      select 1
      from public.goal_sheets gs
      where gs.id = check_in_attachments.goal_sheet_id
        and gs.employee_id = auth.uid()
        and gs.cycle_id = check_in_attachments.cycle_id
    )
  );

drop policy if exists "Employees can select own check-in attachments" on public.check_in_attachments;
create policy "Employees can select own check-in attachments"
  on public.check_in_attachments
  for select
  to authenticated
  using (employee_id = auth.uid());

drop policy if exists "Managers can select direct report check-in attachments" on public.check_in_attachments;
create policy "Managers can select direct report check-in attachments"
  on public.check_in_attachments
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles employee_profile
      where employee_profile.id = check_in_attachments.employee_id
        and employee_profile.manager_id = auth.uid()
    )
  );

drop policy if exists "Admins and HR can select check-in attachments" on public.check_in_attachments;
create policy "Admins and HR can select check-in attachments"
  on public.check_in_attachments
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'hr')
    )
  );

drop policy if exists "Employees can upload own check-in evidence objects" on storage.objects;
create policy "Employees can upload own check-in evidence objects"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'check-in-evidence'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'employee'
    )
  );

drop policy if exists "Employees can read own check-in evidence objects" on storage.objects;
create policy "Employees can read own check-in evidence objects"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'check-in-evidence'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Managers can read direct report check-in evidence objects" on storage.objects;
create policy "Managers can read direct report check-in evidence objects"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'check-in-evidence'
    and exists (
      select 1
      from public.profiles employee_profile
      where employee_profile.id::text = (storage.foldername(name))[1]
        and employee_profile.manager_id = auth.uid()
    )
  );

drop policy if exists "Admins and HR can read check-in evidence objects" on storage.objects;
create policy "Admins and HR can read check-in evidence objects"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'check-in-evidence'
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'hr')
    )
  );
