-- Seed reference data for AlignOS (no auth.users — create users via Supabase Auth first).
-- Re-run safe: uses ON CONFLICT for idempotent department / thrust_area names.

insert into public.departments (name)
values
  ('Engineering'),
  ('Product'),
  ('Sales'),
  ('Customer Success'),
  ('Finance'),
  ('HR'),
  ('Operations')
on conflict (name) do nothing;

insert into public.thrust_areas (name, description)
values
  ('Customer Success', 'Goals focused on customer outcomes and satisfaction'),
  ('Operational Excellence', 'Process efficiency and reliability improvements'),
  ('Innovation', 'New products, capabilities, and technical advancement'),
  ('People & Culture', 'Talent development and organizational health'),
  ('Financial Performance', 'Financial targets and cost discipline'),
  ('Revenue Growth', 'Top-line growth and market expansion'),
  ('Cost Optimization', 'Cost reduction and resource efficiency')
on conflict (name) do nothing;

insert into public.goal_cycles (name, year, start_date, end_date, status)
select
  'FY26 Goal Cycle',
  2026,
  '2025-04-01'::date,
  '2026-03-31'::date,
  'active'
where not exists (
  select 1 from public.goal_cycles where name = 'FY26 Goal Cycle'
);

-- Cycle windows for the active FY26 cycle (matched to mock-data windows where applicable)
insert into public.cycle_windows (
  cycle_id,
  period,
  quarter,
  window_opens,
  window_closes,
  action,
  is_open
)
select
  gc.id,
  v.period,
  v.quarter,
  v.window_opens::date,
  v.window_closes::date,
  v.action,
  v.is_open
from public.goal_cycles gc
cross join (
  values
    (
      'Phase 1 — Goal Setting',
      null::text,
      '2025-05-01',
      '2025-05-31',
      'Goal Creation, Submission & Approval',
      false
    ),
    (
      'Q1 Check-in',
      'q1',
      '2025-07-01',
      '2025-07-15',
      'Progress Update — Planned vs. Actual',
      false
    ),
    (
      'Q2 Check-in',
      'q2',
      '2025-10-01',
      '2025-10-15',
      'Progress Update — Planned vs. Actual',
      false
    ),
    (
      'Q3 Check-in',
      'q3',
      '2026-01-01',
      '2026-01-15',
      'Progress Update — Planned vs. Actual',
      false
    ),
    (
      'Q4 / Annual',
      'q4',
      '2026-03-01',
      '2026-03-31',
      'Final Achievement Capture',
      false
    )
) as v(period, quarter, window_opens, window_closes, action, is_open)
where gc.name = 'FY26 Goal Cycle'
  and not exists (
    select 1
    from public.cycle_windows cw
    where cw.cycle_id = gc.id
      and cw.period = v.period
  );
