import type { SupabaseClient } from '@supabase/supabase-js'
import type { UserRole } from '@/lib/types'

export type GlobalSearchResult = {
  id: string
  type: 'goal' | 'goal_sheet' | 'profile' | 'shared_goal'
  title: string
  subtitle: string
  href: string
  badge: string
}

type SearchProfile = {
  id: string
  full_name: string | null
  email: string | null
  role: UserRole
}

type Relation<T> = T | T[] | null | undefined

type GoalRow = {
  id: string
  title: string
  description: string | null
  approval_status: string
  is_shared: boolean
  thrust_areas?: Relation<{ name: string | null }>
  goal_sheets?: Relation<{
    id: string
    status: string
    employee_id: string
    manager_id: string | null
  }>
  profiles?: Relation<{
    full_name: string | null
    email: string | null
  }>
}

type GoalSheetRow = {
  id: string
  status: string
  employee_id: string
  manager_id: string | null
  profiles?: Relation<{
    full_name: string | null
    email: string | null
  }>
  goals?: GoalRow[] | null
}

type SharedGoalRow = {
  id: string
  title: string
  description: string | null
  status: string
  thrust_areas?: Relation<{ name: string | null }>
}

function first<T>(relation: Relation<T>): T | null {
  if (!relation) return null
  return Array.isArray(relation) ? relation[0] ?? null : relation
}

function textIncludes(value: string | null | undefined, query: string): boolean {
  return value?.toLowerCase().includes(query) ?? false
}

function resultHrefForGoal(role: UserRole, sheetStatus?: string): string {
  if (role === 'employee') {
    return sheetStatus === 'draft' ||
      sheetStatus === 'returned' ||
      sheetStatus === 'rejected' ||
      sheetStatus === 'rework_required'
      ? '/employee/create-goal-sheet'
      : '/employee/my-goal-sheet'
  }

  if (role === 'manager') {
    return sheetStatus === 'pending_approval' || sheetStatus === 'submitted'
      ? '/manager/approvals'
      : '/manager/team-goals'
  }

  return '/admin/reports'
}

function hrefForProfile(role: UserRole): string {
  if (role === 'admin') return '/admin/employees'
  if (role === 'manager') return '/manager/team-goals'
  return '/employee/profile'
}

function hrefForSharedGoal(role: UserRole, id: string): string {
  if (role === 'employee') return `/employee/shared-goals/${id}`
  if (role === 'admin') return '/admin/shared-goals'
  return '/manager/team-goals'
}

function matchesGoal(row: GoalRow, query: string): boolean {
  const sheet = first(row.goal_sheets)
  const employee = first(row.profiles)
  const thrustArea = first(row.thrust_areas)
  return (
    textIncludes(row.title, query) ||
    textIncludes(row.description, query) ||
    textIncludes(thrustArea?.name, query) ||
    textIncludes(sheet?.status, query) ||
    textIncludes(employee?.full_name, query) ||
    textIncludes(employee?.email, query)
  )
}

function matchesGoalSheet(row: GoalSheetRow, query: string): boolean {
  const employee = first(row.profiles)
  return (
    textIncludes(row.status, query) ||
    textIncludes(employee?.full_name, query) ||
    textIncludes(employee?.email, query) ||
    (row.goals ?? []).some((goal) => matchesGoal(goal, query))
  )
}

function matchesSharedGoal(row: SharedGoalRow, query: string): boolean {
  const thrustArea = first(row.thrust_areas)
  return (
    textIncludes(row.title, query) ||
    textIncludes(row.description, query) ||
    textIncludes(row.status, query) ||
    textIncludes(thrustArea?.name, query)
  )
}

function normalizeStatus(status: string | null | undefined): string {
  return status ? status.replace(/_/g, ' ') : 'Goal'
}

export async function getSearchProfile(
  supabase: SupabaseClient
): Promise<SearchProfile | null> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return null
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role')
    .eq('id', user.id)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  return data as SearchProfile
}

export async function searchSupabaseRecords(
  supabase: SupabaseClient,
  profile: SearchProfile,
  rawQuery: string
): Promise<GlobalSearchResult[]> {
  const query = rawQuery.trim().toLowerCase()
  if (query.length < 2) {
    return []
  }

  const results: GlobalSearchResult[] = []

  try {
    const { data, error } = await supabase
      .from('goals')
      .select(
        `
          id,
          title,
          description,
          approval_status,
          is_shared,
          thrust_areas ( name ),
          goal_sheets (
            id,
            status,
            employee_id,
            manager_id
          ),
          profiles!goals_employee_id_fkey (
            full_name,
            email
          )
        `
      )
      .order('updated_at', { ascending: false })
      .limit(100)

    if (!error) {
      for (const row of ((data ?? []) as GoalRow[]).filter((goal) =>
        matchesGoal(goal, query)
      )) {
        const sheet = first(row.goal_sheets)
        const employee = first(row.profiles)
        const thrustArea = first(row.thrust_areas)
        results.push({
          id: `goal-${row.id}`,
          type: 'goal',
          title: row.title,
          subtitle: [
            thrustArea?.name,
            employee?.full_name,
            normalizeStatus(sheet?.status),
          ]
            .filter(Boolean)
            .join(' - '),
          href: resultHrefForGoal(profile.role, sheet?.status),
          badge: row.is_shared ? 'Shared goal' : 'Goal',
        })
      }
    }
  } catch (err) {
    console.error('[searchSupabaseRecords] goals error:', err)
  }

  try {
    const { data, error } = await supabase
      .from('goal_sheets')
      .select(
        `
          id,
          status,
          employee_id,
          manager_id,
          profiles!goal_sheets_employee_id_fkey (
            full_name,
            email
          ),
          goals (
            id,
            title,
            description,
            approval_status,
            is_shared,
            thrust_areas ( name )
          )
        `
      )
      .order('updated_at', { ascending: false })
      .limit(50)

    if (!error) {
      for (const row of ((data ?? []) as GoalSheetRow[]).filter((sheet) =>
        matchesGoalSheet(sheet, query)
      )) {
        const employee = first(row.profiles)
        results.push({
          id: `goal-sheet-${row.id}`,
          type: 'goal_sheet',
          title: employee?.full_name
            ? `${employee.full_name} goal sheet`
            : 'Goal sheet',
          subtitle: normalizeStatus(row.status),
          href: resultHrefForGoal(profile.role, row.status),
          badge: 'Goal sheet',
        })
      }
    }
  } catch (err) {
    console.error('[searchSupabaseRecords] goal sheets error:', err)
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .order('full_name')
      .limit(50)

    if (!error) {
      for (const row of ((data ?? []) as SearchProfile[]).filter(
        (candidate) =>
          textIncludes(candidate.full_name, query) ||
          textIncludes(candidate.email, query)
      )) {
        results.push({
          id: `profile-${row.id}`,
          type: 'profile',
          title: row.full_name || row.email?.split('@')[0] || 'Profile',
          subtitle: row.email ?? row.role,
          href: hrefForProfile(profile.role),
          badge: row.role,
        })
      }
    }
  } catch (err) {
    console.error('[searchSupabaseRecords] profiles error:', err)
  }

  try {
    const { data, error } = await supabase
      .from('shared_goals')
      .select(
        `
          id,
          title,
          description,
          status,
          thrust_areas ( name )
        `
      )
      .neq('status', 'archived')
      .order('updated_at', { ascending: false })
      .limit(50)

    if (!error) {
      for (const row of ((data ?? []) as SharedGoalRow[]).filter((goal) =>
        matchesSharedGoal(goal, query)
      )) {
        const thrustArea = first(row.thrust_areas)
        results.push({
          id: `shared-goal-${row.id}`,
          type: 'shared_goal',
          title: row.title,
          subtitle: [thrustArea?.name, normalizeStatus(row.status)]
            .filter(Boolean)
            .join(' - '),
          href: hrefForSharedGoal(profile.role, row.id),
          badge: 'Shared',
        })
      }
    }
  } catch (err) {
    console.error('[searchSupabaseRecords] shared goals error:', err)
  }

  const seen = new Set<string>()
  return results.filter((result) => {
    if (seen.has(result.id)) return false
    seen.add(result.id)
    return true
  }).slice(0, 8)
}
