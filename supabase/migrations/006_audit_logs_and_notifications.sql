-- Eighth Supabase slice - audit logs and notifications.

-- ---------------------------------------------------------------------------
-- audit_logs
-- ---------------------------------------------------------------------------

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  audit_id text unique not null,
  actor_id uuid references public.profiles (id),
  actor_role text check (actor_role in ('employee', 'manager', 'admin') or actor_role is null),
  employee_id uuid references public.profiles (id),
  goal_id uuid references public.goals (id),
  goal_sheet_id uuid references public.goal_sheets (id),
  action_type text not null,
  field_changed text,
  old_value text,
  new_value text,
  description text,
  created_at timestamptz not null default now()
);

create index audit_logs_actor_id_idx
  on public.audit_logs (actor_id);

create index audit_logs_employee_id_idx
  on public.audit_logs (employee_id);

create index audit_logs_goal_sheet_id_idx
  on public.audit_logs (goal_sheet_id);

create index audit_logs_created_at_idx
  on public.audit_logs (created_at);

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (
    type in (
      'goal_submitted',
      'goal_approved',
      'goal_returned',
      'checkin_due',
      'checkin_submitted',
      'comment_added',
      'shared_goal_assigned',
      'escalation'
    )
  ),
  title text not null,
  message text not null,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_id_idx
  on public.notifications (user_id);

create index notifications_is_read_idx
  on public.notifications (is_read);

create index notifications_created_at_idx
  on public.notifications (created_at);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.audit_logs enable row level security;
alter table public.notifications enable row level security;

-- audit_logs: employee read own lifecycle logs
create policy "Employees can select own audit logs"
  on public.audit_logs
  for select
  to authenticated
  using (employee_id = auth.uid());

-- audit_logs: managers read direct report logs
create policy "Managers can select direct report audit logs"
  on public.audit_logs
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles employee_profile
      where employee_profile.id = audit_logs.employee_id
        and employee_profile.manager_id = auth.uid()
    )
  );

-- audit_logs: admins read all
create policy "Admins can select all audit logs"
  on public.audit_logs
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

-- audit_logs: authenticated users insert actions they perform
create policy "Authenticated users can insert own audit logs"
  on public.audit_logs
  for insert
  to authenticated
  with check (actor_id = auth.uid());

-- notifications: users read own notifications
create policy "Users can select own notifications"
  on public.notifications
  for select
  to authenticated
  using (user_id = auth.uid());

-- notifications: users mark own notifications read
create policy "Users can update own notifications"
  on public.notifications
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- notifications: authenticated lifecycle actions can create notifications
create policy "Authenticated users can insert notifications"
  on public.notifications
  for insert
  to authenticated
  with check (true);
