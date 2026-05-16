-- AlignOS / Syntra — reference data schema (first Supabase slice)
-- Run via Supabase CLI or SQL editor after linking your project.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table public.thrust_areas (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role text not null check (role in ('employee', 'manager', 'admin')),
  department_id uuid references public.departments (id),
  manager_id uuid references public.profiles (id),
  job_title text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.goal_cycles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  year int not null,
  start_date date not null,
  end_date date not null,
  status text not null check (status in ('active', 'closed', 'upcoming')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cycle_windows (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references public.goal_cycles (id) on delete cascade,
  period text not null,
  quarter text check (quarter in ('q1', 'q2', 'q3', 'q4') or quarter is null),
  window_opens date not null,
  window_closes date,
  action text not null,
  is_open boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index profiles_role_idx on public.profiles (role);
create index profiles_department_id_idx on public.profiles (department_id);
create index profiles_manager_id_idx on public.profiles (manager_id);
create index goal_cycles_status_idx on public.goal_cycles (status);
create index cycle_windows_cycle_id_idx on public.cycle_windows (cycle_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.departments enable row level security;
alter table public.thrust_areas enable row level security;
alter table public.profiles enable row level security;
alter table public.goal_cycles enable row level security;
alter table public.cycle_windows enable row level security;

-- departments: authenticated read
create policy "Authenticated users can read departments"
  on public.departments
  for select
  to authenticated
  using (true);

-- thrust_areas: authenticated read
create policy "Authenticated users can read thrust_areas"
  on public.thrust_areas
  for select
  to authenticated
  using (true);

-- profiles: own row
create policy "Users can read own profile"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

-- profiles: direct reports for managers
create policy "Managers can read direct reports"
  on public.profiles
  for select
  to authenticated
  using (manager_id = auth.uid());

-- profiles: admins read all
create policy "Admins can read all profiles"
  on public.profiles
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles admin_profile
      where admin_profile.id = auth.uid()
        and admin_profile.role = 'admin'
    )
  );

-- goal_cycles: active cycles for authenticated users
create policy "Authenticated users can read active goal_cycles"
  on public.goal_cycles
  for select
  to authenticated
  using (status = 'active');

-- cycle_windows: windows belonging to active cycles
create policy "Authenticated users can read cycle_windows for active cycles"
  on public.cycle_windows
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.goal_cycles gc
      where gc.id = cycle_windows.cycle_id
        and gc.status = 'active'
    )
  );
