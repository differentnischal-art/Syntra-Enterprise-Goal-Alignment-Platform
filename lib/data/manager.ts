'use client'

import { getActiveGoalCycle } from '@/lib/data/goal-cycles'
import {
  isRealUuid,
  mapGoalRowToGoal,
  type DbGoalRow,
} from '@/lib/data/goals'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import type { Goal, GoalSheetStatus, TeamMember } from '@/lib/types'

type Relation<T> = T | T[] | null | undefined

type DbProfileRow = {
  id: string
  full_name: string
  email: string
  departments?: Relation<{ name: string | null }>
}

type DbGoalSheetRow = {
  id: string
  employee_id: string
  manager_id: string | null
  cycle_id: string
  status: string
  total_weightage: number | null
  goals_count: number | null
  is_locked: boolean | null
  submitted_at: string | null
  updated_at: string
  goals: DbGoalRow[] | null
}

type DbCheckInRow = {
  id: string
  goal_id: string
  goal_sheet_id: string
  employee_id: string
  quarter: 'q1' | 'q2' | 'q3' | 'q4'
  computed_score: number | null
  submitted_at: string | null
}

type DbAuditRow = {
  id: string
  employee_id: string | null
  action_type: string
  description: string | null
  created_at: string
}

export type ManagerActivity = {
  id: string
  type: string
  description: string
  timestamp: string
}

export type ManagerPendingSheetSummary = {
  goalSheetId: string
  name: string
  goalsCount: number
  totalWeightage: number
}

export type ManagerLiveData = {
  managerId: string
  directReportsCount: number
  goalSheetsCount: number
  goalsCount: number
  teamMembers: TeamMember[]
  teamGoals: Goal[]
  pendingSheets: ManagerPendingSheetSummary[]
  pendingApprovals: number
  teamAvgAchievement: number
  checkInCompliance: number
  topThrustAreas: Array<[string, number]>
  recentActivity: ManagerActivity[]
}

const GOAL_SHEETS_SELECT = `
  id,
  employee_id,
  manager_id,
  cycle_id,
  status,
  total_weightage,
  goals_count,
  is_locked,
  submitted_at,
  updated_at,
  goals (
    id,
    goal_sheet_id,
    employee_id,
    thrust_area_id,
    title,
    description,
    uom_type,
    target,
    target_date,
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

function relationName(relation: Relation<{ name: string | null }>, fallback = '-'): string {
  if (!relation) return fallback
  if (Array.isArray(relation)) {
    return relation[0]?.name ?? fallback
  }
  return relation.name ?? fallback
}

function normalizeSheetStatus(status: string): GoalSheetStatus {
  if (status === 'pending_approval') return 'pending-approval'
  if (status === 'final_closed') return 'final-closed'
  if (status === 'rework_required') return 'rework-required'
  return status as GoalSheetStatus
}

function approvalStatusForSheet(status: string): TeamMember['approvalStatus'] {
  if (status === 'submitted' || status === 'pending_approval') return 'pending'
  if (status === 'approved' || status === 'locked') return 'approved'
  if (status === 'returned' || status === 'rejected' || status === 'rework_required') return 'returned'
  return 'draft'
}

function latestSheetForEmployee(sheets: DbGoalSheetRow[], employeeId: string) {
  return sheets
    .filter((sheet) => sheet.employee_id === employeeId)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0]
}

function average(values: number[]) {
  if (values.length === 0) return 0
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
}

function checkInsForGoals(checkIns: DbCheckInRow[], goalIds: string[]) {
  const goalIdSet = new Set(goalIds)
  return checkIns.filter((checkIn) => goalIdSet.has(checkIn.goal_id))
}

function achievementForGoals(goals: Goal[], checkIns: DbCheckInRow[]) {
  const scoreByGoal = new Map<string, number>()
  for (const checkIn of checkIns) {
    if (checkIn.computed_score !== null) {
      const current = scoreByGoal.get(checkIn.goal_id)
      const score = Math.max(0, Math.min(100, Number(checkIn.computed_score)))
      if (current === undefined || score > current) {
        scoreByGoal.set(checkIn.goal_id, score)
      }
    }
  }

  return goals.map((goal) => scoreByGoal.get(goal.id) ?? 0)
}

function checkInStatusForGoals(checkIns: DbCheckInRow[], goalIds: string[]) {
  const goalIdSet = new Set(goalIds)
  const status = { Q1: false, Q2: false, Q3: false, Q4: false }
  for (const quarter of ['q1', 'q2', 'q3', 'q4'] as const) {
    const quarterRows = checkIns.filter(
      (checkIn) =>
        checkIn.quarter === quarter &&
        goalIdSet.has(checkIn.goal_id) &&
        Boolean(checkIn.submitted_at)
    )
    status[quarter.toUpperCase() as keyof typeof status] =
      goalIdSet.size > 0 && quarterRows.length >= goalIdSet.size
  }
  return status
}

function mapActivity(row: DbAuditRow): ManagerActivity {
  return {
    id: row.id,
    type: row.action_type.replace(/_/g, '-'),
    description: row.description ?? row.action_type.replace(/_/g, ' '),
    timestamp: row.created_at,
  }
}

export async function getManagerLiveData(managerId: string): Promise<ManagerLiveData> {
  if (!isSupabaseConfigured() || !isRealUuid(managerId)) {
    return {
      managerId,
      directReportsCount: 0,
      goalSheetsCount: 0,
      goalsCount: 0,
      teamMembers: [],
      teamGoals: [],
      pendingSheets: [],
      pendingApprovals: 0,
      teamAvgAchievement: 0,
      checkInCompliance: 0,
      topThrustAreas: [],
      recentActivity: [],
    }
  }

  const supabase = createClient()
  if (!supabase) {
    throw new Error('Supabase client unavailable')
  }

  const activeCycle = await getActiveGoalCycle()
  const [profilesResult, sheetsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, email, departments ( name )')
      .eq('manager_id', managerId)
      .eq('role', 'employee')
      .order('full_name'),
    supabase
      .from('goal_sheets')
      .select(GOAL_SHEETS_SELECT)
      .eq('manager_id', managerId)
      .eq('cycle_id', activeCycle?.id ?? '00000000-0000-0000-0000-000000000000')
      .order('updated_at', { ascending: false }),
  ])

  if (profilesResult.error) {
    throw new Error(profilesResult.error.message)
  }
  if (sheetsResult.error) {
    throw new Error(sheetsResult.error.message)
  }

  const directReports = (profilesResult.data ?? []) as DbProfileRow[]
  const sheets = (sheetsResult.data ?? []) as DbGoalSheetRow[]
  const goals = sheets.flatMap((sheet) => sheet.goals ?? [])
  const goalIds = goals.map((goal) => goal.id)

  const [checkInsResult, auditResult] = await Promise.all([
    goalIds.length > 0
      ? supabase
          .from('quarterly_checkins')
          .select('id, goal_id, goal_sheet_id, employee_id, quarter, computed_score, submitted_at')
          .in('goal_id', goalIds)
      : Promise.resolve({ data: [], error: null }),
    directReports.length > 0
      ? supabase
          .from('audit_logs')
          .select('id, employee_id, action_type, description, created_at')
          .in(
            'employee_id',
            directReports.map((employee) => employee.id)
          )
          .order('created_at', { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [], error: null }),
  ])

  if (checkInsResult.error) {
    throw new Error(checkInsResult.error.message)
  }
  if (auditResult.error) {
    throw new Error(auditResult.error.message)
  }

  const checkIns = (checkInsResult.data ?? []) as DbCheckInRow[]
  const teamGoals = sheets.flatMap((sheet) => {
    const employee = directReports.find((report) => report.id === sheet.employee_id)
    const employeeName = employee?.full_name ?? 'Employee'
    return (sheet.goals ?? []).map((goalRow) =>
      mapGoalRowToGoal(goalRow, { employeeName })
    )
  })

  const teamMembers: TeamMember[] = directReports.map((employee) => {
    const sheet = latestSheetForEmployee(sheets, employee.id)
    const sheetGoals = sheet
      ? (sheet.goals ?? []).map((goalRow) =>
          mapGoalRowToGoal(goalRow, { employeeName: employee.full_name })
        )
      : []
    const employeeCheckIns = checkInsForGoals(
      checkIns,
      sheetGoals.map((goal) => goal.id)
    )
    const achievement = average(achievementForGoals(sheetGoals, employeeCheckIns))

    return {
      id: employee.id,
      name: employee.full_name,
      email: employee.email,
      department: relationName(employee.departments),
      goalsCount: sheetGoals.length,
      totalWeightage:
        sheet?.total_weightage == null
          ? sheetGoals.reduce((sum, goal) => sum + goal.weightage, 0)
          : Number(sheet.total_weightage),
      sheetStatus: normalizeSheetStatus(sheet?.status ?? 'draft'),
      approvalStatus: approvalStatusForSheet(sheet?.status ?? 'draft'),
      averageAchievement: achievement,
      checkIns: checkInStatusForGoals(
        employeeCheckIns,
        sheetGoals.map((goal) => goal.id)
      ),
    }
  })

  const thrustAreaDistribution = teamGoals.reduce((acc, goal) => {
    acc[goal.thrustArea] = (acc[goal.thrustArea] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  const pendingSheets = sheets
    .filter(
      (sheet) =>
        ['submitted', 'pending_approval'].includes(sheet.status) &&
        sheet.is_locked === false
    )
    .map((sheet) => {
      const employee = directReports.find((report) => report.id === sheet.employee_id)
      return {
        goalSheetId: sheet.id,
        name: employee?.full_name ?? 'Employee',
        goalsCount: sheet.goals_count ?? sheet.goals?.length ?? 0,
        totalWeightage: Number(sheet.total_weightage ?? 0),
      }
    })

  const submittedCheckIns = checkIns.filter((checkIn) => checkIn.submitted_at).length
  const expectedCheckIns = Math.max(goalIds.length * 4, 0)

  const liveData = {
    managerId,
    directReportsCount: directReports.length,
    goalSheetsCount: sheets.length,
    goalsCount: teamGoals.length,
    teamMembers,
    teamGoals,
    pendingSheets,
    pendingApprovals: pendingSheets.length,
    teamAvgAchievement: average(teamMembers.map((member) => member.averageAchievement)),
    checkInCompliance:
      expectedCheckIns > 0 ? Math.round((submittedCheckIns / expectedCheckIns) * 100) : 0,
    topThrustAreas: Object.entries(thrustAreaDistribution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5),
    recentActivity: ((auditResult.data ?? []) as DbAuditRow[]).map(mapActivity),
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[manager live data]', {
      managerId,
      directReportsCount: liveData.directReportsCount,
      goalSheetsCount: liveData.goalSheetsCount,
      goalsCount: liveData.goalsCount,
    })
  }

  return liveData
}
