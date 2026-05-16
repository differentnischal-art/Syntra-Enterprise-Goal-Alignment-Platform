-- Sixth Supabase slice — review history and manager approval RLS.

-- ---------------------------------------------------------------------------
-- goal_sheet_reviews
-- ---------------------------------------------------------------------------

create table public.goal_sheet_reviews (
  id uuid primary key default gen_random_uuid(),
  goal_sheet_id uuid not null references public.goal_sheets (id) on delete cascade,
  reviewer_id uuid not null references public.profiles (id),
  action text not null check (action in ('approved', 'returned')),
  comment text,
  created_at timestamptz not null default now()
);

create index goal_sheet_reviews_goal_sheet_id_idx
  on public.goal_sheet_reviews (goal_sheet_id);

create index goal_sheet_reviews_reviewer_id_idx
  on public.goal_sheet_reviews (reviewer_id);

create index goal_sheet_reviews_created_at_idx
  on public.goal_sheet_reviews (created_at);

alter table public.goal_sheet_reviews enable row level security;

create policy "Managers can insert reviews for team goal sheets"
  on public.goal_sheet_reviews
  for insert
  to authenticated
  with check (
    reviewer_id = auth.uid()
    and exists (
      select 1
      from public.goal_sheets gs
      where gs.id = goal_sheet_id
        and gs.manager_id = auth.uid()
    )
  );

create policy "Managers can select reviews for team goal sheets"
  on public.goal_sheet_reviews
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.goal_sheets gs
      where gs.id = goal_sheet_reviews.goal_sheet_id
        and gs.manager_id = auth.uid()
    )
  );

create policy "Employees can select reviews on own goal sheets"
  on public.goal_sheet_reviews
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.goal_sheets gs
      where gs.id = goal_sheet_reviews.goal_sheet_id
        and gs.employee_id = auth.uid()
    )
  );

create policy "Admins can select all goal sheet reviews"
  on public.goal_sheet_reviews
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

-- ---------------------------------------------------------------------------
-- Manager approval updates on goal_sheets / goals
-- ---------------------------------------------------------------------------

create policy "Managers can update team goal sheets"
  on public.goal_sheets
  for update
  to authenticated
  using (manager_id = auth.uid())
  with check (manager_id = auth.uid());

create policy "Managers can update team goals"
  on public.goals
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.goal_sheets gs
      where gs.id = goals.goal_sheet_id
        and gs.manager_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.goal_sheets gs
      where gs.id = goals.goal_sheet_id
        and gs.manager_id = auth.uid()
    )
  );
