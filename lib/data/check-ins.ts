/**
 * Seventh Supabase slice - employee quarterly check-ins and manager comments.
 */

import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { createAuditLog } from '@/lib/data/audit-logs'
import { createNotification } from '@/lib/data/notifications'
import {
  isRealUuid,
  mapGoalRowToGoal,
  mapGoalStatusFromDb,
  type DbGoalRow,
} from '@/lib/data/goals'
import type { Goal, GoalStatus, UnitOfMeasurement, User } from '@/lib/types'

export type CheckInQuarter = 'q1' | 'q2' | 'q3' | 'q4'

export type ManagerCheckInCommentType =
  | 'coaching'
  | 'appreciation'
  | 'needs_improvement'
  | 'escalation'

export type ManagerCheckInComment = {
  id: string
  checkinId: string
  managerId: string
  managerName: string
  commentType: ManagerCheckInCommentType | null
  comment: string
  createdAt: string
}

export type EmployeeQuarterlyCheckInRow = {
  checkinId: string | null
  goalId: string
  goalSheetId: string
  goalTitle: string
  thrustArea: string
  plannedTarget: number
  actualAchievement: number | null
  unitOfMeasurement: UnitOfMeasurement
  computedScore: number | null
  status: GoalStatus
  employeeNote: string
  submittedAt: string | null
  managerComments: ManagerCheckInComment[]
  goal: Goal
}

export type EmployeeQuarterlyCheckInsResult = {
  goalSheetId: string
  quarter: CheckInQuarter
  rows: EmployeeQuarterlyCheckInRow[]
}

export type EmployeeCheckInSubmitEntry = {
  goalId: string
  plannedTarget: number
  actualAchievement: number | null
  status: GoalStatus
  employeeNote?: string
  uomType: UnitOfMeasurement
}

export type SubmitEmployeeQuarterlyCheckInsParams = {
  employeeId: string
  goalSheetId: string
  quarter: CheckInQuarter
  entries: EmployeeCheckInSubmitEntry[]
}

export type ManagerTeamCheckInGoalRow = EmployeeQuarterlyCheckInRow

export type ManagerTeamCheckInRow = {
  employee: User
  department: string
  goalSheetId: string
  goalsCount: number
  averageScore: number | null
  quarterCompletionStatus: 'not_started' | 'partial' | 'completed'
  quarter: CheckInQuarter
  checkIns: Record<'Q1' | 'Q2' | 'Q3' | 'Q4', boolean>
  plannedVsActual: ManagerTeamCheckInGoalRow[]
}

type DbQuarterlyCheckInRow = {
  id: string
  goal_id: string
  goal_sheet_id: string
  employee_id: string
  quarter: CheckInQuarter
  planned_target: number
  actual_achievement: number | null
  computed_score: number | null
  status: string
  employee_note: string | null
  submitted_at: string | null
  created_at: string
  updated_at: string
}

type DbCommentRow = {
  id: string
  checkin_id: string
  manager_id: string
  comment_type: ManagerCheckInCommentType | null
  comment: string
  created_at: string
  profiles?: { full_name: string } | { full_name: string }[] | null
}

type DbGoalSheetForCheckIns = {
  id: string
  employee_id: string
  manager_id: string | null
  cycle_id: string
  status: 'approved' | 'locked'
  goals_count: number
  profiles?: {
    id: string
    full_name: string
    email: string
    role: 'employee'
    manager_id: string | null
    departments: { name: string } | { name: string }[] | null
  } | {
    id: string
    full_name: string
    email: string
    role: 'employee'
    manager_id: string | null
    departments: { name: string } | { name: string }[] | null
  }[] | null
  goals: DbGoalRow[] | null
}

type DbGoalSheetNotificationContext = {
  manager_id: string | null
}

type DbCheckInNotificationContext = {
  id: string
  employee_id: string
  goal_id: string
  goal_sheet_id: string
}

const GOAL_SHEET_CHECKIN_SELECT = `
  id,
  employee_id,
  manager_id,
  cycle_id,
  status,
  goals_count,
  goals (
    id,
    goal_sheet_id,
    employee_id,
    thrust_area_id,
    title,
    description,
    uom_type,
    target,
    weightage,
    status,
    approval_status,
    is_shared,
    is_locked,
    created_at,
    updated_at,
    thrust_areas ( name )
  )
`

const MANAGER_GOAL_SHEET_CHECKIN_SELECT = `
  id,
  employee_id,
  manager_id,
  cycle_id,
  status,
  goals_count,
  profiles!goal_sheets_employee_id_fkey (
    id,
    full_name,
    email,
    role,
    manager_id,
    departments ( name )
  ),
  goals (
    id,
    goal_sheet_id,
    employee_id,
    thrust_area_id,
    title,
    description,
    uom_type,
    target,
    weightage,
    status,
    approval_status,
    is_shared,
    is_locked,
    created_at,
    updated_at,
    thrust_areas ( name )
  )
`

const QUARTER_KEYS: Record<CheckInQuarter, 'Q1' | 'Q2' | 'Q3' | 'Q4'> = {
  q1: 'Q1',
  q2: 'Q2',
  q3: 'Q3',
  q4: 'Q4',
}

const STATUS_TO_DB: Record<GoalStatus, string> = {
  'not-started': 'not_started',
  'on-track': 'on_track',
  completed: 'completed',
  overdue: 'overdue',
}

export function calculateCheckInScore(params: {
  uomType: UnitOfMeasurement
  plannedTarget: number
  actualAchievement: number | null
}): number | null {
  const { uomType, plannedTarget, actualAchievement } = params

  if (actualAchievement === null || Number.isNaN(actualAchievement)) {
    return null
  }

  if (uomType === 'zero-based') {
    return actualAchievement === 0 ? 100 : 0
  }

  if (plannedTarget === 0) {
    return actualAchievement === 0 ? 100 : null
  }

  if (uomType === 'numeric-lower-better') {
    if (actualAchievement === 0) {
      return 100
    }
    return Math.round((plannedTarget / actualAchievement) * 100)
  }

  return Math.round((actualAchievement / plannedTarget) * 100)
}

function profileRelationToUser(
  relation: DbGoalSheetForCheckIns['profiles']
): User | null {
  if (!relation) return null
  const profile = Array.isArray(relation) ? relation[0] : relation
  if (!profile) return null

  const departments = profile.departments
  const department = Array.isArray(departments)
    ? departments[0]?.name
    : departments?.name

  return {
    id: profile.id,
    name: profile.full_name,
    email: profile.email,
    role: 'employee',
    department: department ?? '-',
    managerId: profile.manager_id ?? undefined,
  }
}

function mapCommentRow(row: DbCommentRow): ManagerCheckInComment {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
  return {
    id: row.id,
    checkinId: row.checkin_id,
    managerId: row.manager_id,
    managerName: profile?.full_name ?? 'Manager',
    commentType: row.comment_type,
    comment: row.comment,
    createdAt: row.created_at,
  }
}

function emptyQuarterStatus() {
  return { Q1: false, Q2: false, Q3: false, Q4: false }
}

function mergeGoalsWithCheckIns(params: {
  goalSheetId: string
  goals: DbGoalRow[]
  checkIns: DbQuarterlyCheckInRow[]
  comments: DbCommentRow[]
  employeeName?: string
}): EmployeeQuarterlyCheckInRow[] {
  const checkInsByGoal = new Map(params.checkIns.map((row) => [row.goal_id, row]))
  const commentsByCheckIn = new Map<string, ManagerCheckInComment[]>()

  for (const comment of params.comments) {
    const list = commentsByCheckIn.get(comment.checkin_id) ?? []
    list.push(mapCommentRow(comment))
    commentsByCheckIn.set(comment.checkin_id, list)
  }

  return params.goals.map((goalRow) => {
    const goal = mapGoalRowToGoal(goalRow, { employeeName: params.employeeName })
    const checkIn = checkInsByGoal.get(goal.id)
    const actualAchievement =
      checkIn?.actual_achievement === undefined ? null : checkIn.actual_achievement
    const plannedTarget =
      checkIn?.planned_target === undefined ? goal.target : Number(checkIn.planned_target)
    const computedScore =
      checkIn?.computed_score === undefined || checkIn.computed_score === null
        ? calculateCheckInScore({
            uomType: goal.unitOfMeasurement,
            plannedTarget,
            actualAchievement,
          })
        : Number(checkIn.computed_score)

    return {
      checkinId: checkIn?.id ?? null,
      goalId: goal.id,
      goalSheetId: params.goalSheetId,
      goalTitle: goal.title,
      thrustArea: goal.thrustArea,
      plannedTarget,
      actualAchievement,
      unitOfMeasurement: goal.unitOfMeasurement,
      computedScore,
      status: checkIn ? mapGoalStatusFromDb(checkIn.status) : goal.status,
      employeeNote: checkIn?.employee_note ?? '',
      submittedAt: checkIn?.submitted_at ?? null,
      managerComments: checkIn ? commentsByCheckIn.get(checkIn.id) ?? [] : [],
      goal,
    }
  })
}

async function fetchCommentsForCheckIns(
  checkInIds: string[]
): Promise<DbCommentRow[]> {
  if (checkInIds.length === 0) {
    return []
  }

  const supabase = createClient()
  if (!supabase) {
    return []
  }

  const { data, error } = await supabase
    .from('manager_checkin_comments')
    .select(
      `
      id,
      checkin_id,
      manager_id,
      comment_type,
      comment,
      created_at,
      profiles!manager_checkin_comments_manager_id_fkey ( full_name )
    `
    )
    .in('checkin_id', checkInIds)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[fetchCommentsForCheckIns] error:', error.message)
    return []
  }

  return (data ?? []) as DbCommentRow[]
}

export async function getEmployeeQuarterlyCheckIns(
  employeeId: string,
  cycleId: string,
  quarter: CheckInQuarter
): Promise<EmployeeQuarterlyCheckInsResult | null> {
  if (
    !isSupabaseConfigured() ||
    !isRealUuid(employeeId) ||
    !isRealUuid(cycleId)
  ) {
    return null
  }

  const supabase = createClient()
  if (!supabase) {
    return null
  }

  try {
    const { data: sheetData, error: sheetError } = await supabase
      .from('goal_sheets')
      .select(GOAL_SHEET_CHECKIN_SELECT)
      .eq('employee_id', employeeId)
      .eq('cycle_id', cycleId)
      .in('status', ['approved', 'locked'])
      .maybeSingle()

    if (sheetError) {
      console.error('[getEmployeeQuarterlyCheckIns] sheet error:', sheetError.message)
      return null
    }

    if (!sheetData) {
      return null
    }

    const sheet = sheetData as DbGoalSheetForCheckIns
    const goals = sheet.goals ?? []
    if (goals.length === 0) {
      return null
    }

    const goalIds = goals.map((goal) => goal.id)
    const { data: checkInData, error: checkInError } = await supabase
      .from('quarterly_checkins')
      .select(
        `
        id,
        goal_id,
        goal_sheet_id,
        employee_id,
        quarter,
        planned_target,
        actual_achievement,
        computed_score,
        status,
        employee_note,
        submitted_at,
        created_at,
        updated_at
      `
      )
      .eq('employee_id', employeeId)
      .eq('goal_sheet_id', sheet.id)
      .eq('quarter', quarter)
      .in('goal_id', goalIds)

    if (checkInError) {
      console.error(
        '[getEmployeeQuarterlyCheckIns] check-in error:',
        checkInError.message
      )
      return null
    }

    const checkIns = (checkInData ?? []) as DbQuarterlyCheckInRow[]
    const comments = await fetchCommentsForCheckIns(checkIns.map((row) => row.id))

    return {
      goalSheetId: sheet.id,
      quarter,
      rows: mergeGoalsWithCheckIns({
        goalSheetId: sheet.id,
        goals,
        checkIns,
        comments,
      }),
    }
  } catch (err) {
    console.error('[getEmployeeQuarterlyCheckIns] unexpected error:', err)
    return null
  }
}

export async function submitEmployeeQuarterlyCheckIns(
  params: SubmitEmployeeQuarterlyCheckInsParams
): Promise<{ rows: DbQuarterlyCheckInRow[] | null; error: string | null; demoMode?: boolean }> {
  if (!isSupabaseConfigured()) {
    return { rows: null, error: null, demoMode: true }
  }

  if (
    !isRealUuid(params.employeeId) ||
    !isRealUuid(params.goalSheetId) ||
    params.entries.some((entry) => !isRealUuid(entry.goalId))
  ) {
    return { rows: null, error: 'Invalid check-in payload' }
  }

  const supabase = createClient()
  if (!supabase) {
    return { rows: null, error: 'Supabase client unavailable' }
  }

  const now = new Date().toISOString()
  const rows = params.entries.map((entry) => ({
    goal_id: entry.goalId,
    goal_sheet_id: params.goalSheetId,
    employee_id: params.employeeId,
    quarter: params.quarter,
    planned_target: entry.plannedTarget,
    actual_achievement: entry.actualAchievement,
    computed_score: calculateCheckInScore({
      uomType: entry.uomType,
      plannedTarget: entry.plannedTarget,
      actualAchievement: entry.actualAchievement,
    }),
    status: STATUS_TO_DB[entry.status],
    employee_note: entry.employeeNote?.trim() || null,
    submitted_at: now,
  }))

  try {
    const { data, error } = await supabase
      .from('quarterly_checkins')
      .upsert(rows, { onConflict: 'goal_id,quarter' })
      .select(
        `
        id,
        goal_id,
        goal_sheet_id,
        employee_id,
        quarter,
        planned_target,
        actual_achievement,
        computed_score,
        status,
        employee_note,
        submitted_at,
        created_at,
        updated_at
      `
      )

    if (error) {
      console.error('[submitEmployeeQuarterlyCheckIns] error:', error.message)
      return { rows: null, error: error.message }
    }

    try {
      await createAuditLog({
        actorId: params.employeeId,
        actorRole: 'employee',
        employeeId: params.employeeId,
        goalSheetId: params.goalSheetId,
        actionType: 'checkin_submitted',
        fieldChanged: `${params.quarter.toUpperCase()} Check-in`,
        newValue: 'submitted',
        description: 'Employee submitted quarterly check-in updates',
      })

      const { data: sheetContext } = await supabase
        .from('goal_sheets')
        .select('manager_id')
        .eq('id', params.goalSheetId)
        .eq('employee_id', params.employeeId)
        .maybeSingle()

      const context = sheetContext as DbGoalSheetNotificationContext | null
      if (context?.manager_id) {
        await createNotification({
          userId: context.manager_id,
          type: 'checkin_submitted',
          title: 'Quarterly Check-in Submitted',
          message: 'Employee submitted quarterly check-in updates',
          link: '/manager/check-ins',
        })
      }
    } catch (err) {
      console.error('[submitEmployeeQuarterlyCheckIns] audit/notification error:', err)
    }

    return { rows: (data ?? []) as DbQuarterlyCheckInRow[], error: null }
  } catch (err) {
    return {
      rows: null,
      error: err instanceof Error ? err.message : 'Failed to submit check-ins',
    }
  }
}

export async function getManagerTeamCheckIns(
  managerId: string,
  quarter: CheckInQuarter
): Promise<ManagerTeamCheckInRow[] | null> {
  if (!isSupabaseConfigured() || !isRealUuid(managerId)) {
    return null
  }

  const supabase = createClient()
  if (!supabase) {
    return null
  }

  try {
    const { data: sheetData, error: sheetError } = await supabase
      .from('goal_sheets')
      .select(MANAGER_GOAL_SHEET_CHECKIN_SELECT)
      .eq('manager_id', managerId)
      .in('status', ['approved', 'locked'])
      .order('updated_at', { ascending: false })

    if (sheetError) {
      console.error('[getManagerTeamCheckIns] sheet error:', sheetError.message)
      return null
    }

    const sheets = (sheetData ?? []) as DbGoalSheetForCheckIns[]
    if (sheets.length === 0) {
      return null
    }

    const goalIds = sheets.flatMap((sheet) => (sheet.goals ?? []).map((goal) => goal.id))
    if (goalIds.length === 0) {
      return null
    }

    const { data: checkInData, error: checkInError } = await supabase
      .from('quarterly_checkins')
      .select(
        `
        id,
        goal_id,
        goal_sheet_id,
        employee_id,
        quarter,
        planned_target,
        actual_achievement,
        computed_score,
        status,
        employee_note,
        submitted_at,
        created_at,
        updated_at
      `
      )
      .eq('quarter', quarter)
      .in('goal_id', goalIds)

    if (checkInError) {
      console.error('[getManagerTeamCheckIns] check-in error:', checkInError.message)
      return null
    }

    const checkIns = (checkInData ?? []) as DbQuarterlyCheckInRow[]
    const comments = await fetchCommentsForCheckIns(checkIns.map((row) => row.id))
    const quarterKey = QUARTER_KEYS[quarter]

    return sheets
      .map((sheet) => {
        const employee = profileRelationToUser(sheet.profiles)
        if (!employee) {
          return null
        }

        const goals = sheet.goals ?? []
        const sheetCheckIns = checkIns.filter((row) => row.goal_sheet_id === sheet.id)
        const rows = mergeGoalsWithCheckIns({
          goalSheetId: sheet.id,
          goals,
          checkIns: sheetCheckIns,
          comments,
          employeeName: employee.name,
        })
        const submittedRows = rows.filter((row) => row.submittedAt)
        const scores = rows
          .map((row) => row.computedScore)
          .filter((score): score is number => score !== null)
        const averageScore =
          scores.length > 0
            ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
            : null
        const quarterCompletionStatus =
          submittedRows.length === 0
            ? 'not_started'
            : submittedRows.length === rows.length
              ? 'completed'
              : 'partial'
        const checkInsByQuarter = emptyQuarterStatus()
        checkInsByQuarter[quarterKey] = quarterCompletionStatus === 'completed'

        return {
          employee,
          department: employee.department,
          goalSheetId: sheet.id,
          goalsCount: goals.length,
          averageScore,
          quarterCompletionStatus,
          quarter,
          checkIns: checkInsByQuarter,
          plannedVsActual: rows,
        }
      })
      .filter((row): row is ManagerTeamCheckInRow => row !== null)
  } catch (err) {
    console.error('[getManagerTeamCheckIns] unexpected error:', err)
    return null
  }
}

export async function addManagerCheckInComment(
  checkinId: string,
  managerId: string,
  commentType: ManagerCheckInCommentType | null,
  comment: string
): Promise<{ comment: ManagerCheckInComment | null; error: string | null; demoMode?: boolean }> {
  if (!isSupabaseConfigured()) {
    return { comment: null, error: null, demoMode: true }
  }

  const trimmed = comment.trim()
  if (!trimmed) {
    return { comment: null, error: 'Comment is required.' }
  }

  if (!isRealUuid(checkinId) || !isRealUuid(managerId)) {
    return { comment: null, error: 'Invalid check-in or manager id' }
  }

  const supabase = createClient()
  if (!supabase) {
    return { comment: null, error: 'Supabase client unavailable' }
  }

  try {
    const { data, error } = await supabase
      .from('manager_checkin_comments')
      .insert({
        checkin_id: checkinId,
        manager_id: managerId,
        comment_type: commentType,
        comment: trimmed,
      })
      .select(
        `
        id,
        checkin_id,
        manager_id,
        comment_type,
        comment,
        created_at,
        profiles!manager_checkin_comments_manager_id_fkey ( full_name )
      `
      )
      .single()

    if (error) {
      console.error('[addManagerCheckInComment] error:', error.message)
      return { comment: null, error: error.message }
    }

    const mappedComment = mapCommentRow(data as DbCommentRow)

    try {
      const { data: checkInContext } = await supabase
        .from('quarterly_checkins')
        .select('id, employee_id, goal_id, goal_sheet_id')
        .eq('id', checkinId)
        .maybeSingle()

      const context = checkInContext as DbCheckInNotificationContext | null
      if (context?.employee_id) {
        await createAuditLog({
          actorId: managerId,
          actorRole: 'manager',
          employeeId: context.employee_id,
          goalId: context.goal_id,
          goalSheetId: context.goal_sheet_id,
          actionType: 'comment_added',
          fieldChanged: 'Manager Comment',
          newValue: trimmed,
          description: 'Manager added feedback on a quarterly check-in',
        })

        await createNotification({
          userId: context.employee_id,
          type: 'comment_added',
          title: 'Manager Comment Added',
          message: 'Your manager added feedback on your check-in',
          link: '/employee/quarterly-check-ins',
        })
      }
    } catch (err) {
      console.error('[addManagerCheckInComment] audit/notification error:', err)
    }

    return { comment: mappedComment, error: null }
  } catch (err) {
    return {
      comment: null,
      error: err instanceof Error ? err.message : 'Failed to add manager comment',
    }
  }
}
