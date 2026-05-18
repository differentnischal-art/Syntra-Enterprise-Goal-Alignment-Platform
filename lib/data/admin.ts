'use client'

import { createAuditLog, getAuditLogs, type AuditLogRow } from '@/lib/data/audit-logs'
import { createNotification } from '@/lib/data/notifications'
import { isRealUuid, mapUomFromDb } from '@/lib/data/goals'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import type { GoalStatus, UnitOfMeasurement, User, UserRole } from '@/lib/types'

type Relation<T> = T | T[] | null | undefined

type DepartmentRef = { name: string | null }
type ProfileRow = {
  id: string
  full_name: string
  email: string
  role: UserRole
  manager_id: string | null
  departments?: Relation<DepartmentRef>
}

type GoalSheetRow = {
  id: string
  employee_id: string
  manager_id: string | null
  cycle_id: string
  status: string
  total_weightage: number | null
  goals_count: number | null
  is_locked: boolean | null
  submitted_at: string | null
  approved_at: string | null
  locked_at: string | null
  unlocked_at: string | null
  unlocked_by: string | null
  unlock_reason: string | null
  created_at: string
  updated_at: string
}

type GoalRow = {
  id: string
  goal_sheet_id: string
  employee_id: string
  title: string
  description: string | null
  uom_type: string
  target: number
  target_date: string | null
  weightage: number
  status: string
  is_locked: boolean
  thrust_areas?: Relation<{ name: string | null }>
}

type CheckInRow = {
  id: string
  goal_id: string
  goal_sheet_id: string
  employee_id: string
  quarter: 'q1' | 'q2' | 'q3' | 'q4'
  planned_target: number
  actual_achievement: number | null
  computed_score: number | null
  status: string
  submitted_at: string | null
}

type CommentRow = {
  checkin_id: string
}

type CycleRow = {
  id: string
  name: string
  year: number
  start_date: string
  end_date: string
  status: 'active' | 'closed' | 'upcoming'
  created_at: string
  updated_at: string
}

type CycleWindowRow = {
  id: string
  cycle_id: string
  period: string
  quarter: 'q1' | 'q2' | 'q3' | 'q4' | null
  window_opens: string
  window_closes: string | null
  action: string
  is_open: boolean
  created_at: string
}

export type AdminOverview = {
  totalEmployees: number
  managers: number
  submittedGoalSheets: number
  pendingApprovals: number
  approvedOrLockedGoalSheets: number
  activeEscalations: number
  recentAuditLogs: AuditLogRow[]
}

export type AdminAchievementReportRow = {
  id: string
  employeeId: string
  employeeName: string
  department: string
  managerName: string
  goalTitle: string
  plannedTarget: number
  actualAchievement: number | null
  weightage: number
  score: number | null
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4'
  status: GoalStatus
  unitOfMeasurement: UnitOfMeasurement
}

export type AdminCompletionReportRow = {
  id: string
  employeeName: string
  department: string
  managerName: string
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4'
  checkInStatus: 'Submitted' | 'Not Submitted'
  submittedDate: string | null
  managerCommentStatus: 'Commented' | 'Pending'
}

export type AdminEscalation = {
  id: string
  type: 'goal-not-submitted' | 'approval-overdue' | 'checkin-pending' | 'weightage-mismatch'
  employeeId: string
  employeeName: string
  managerId: string | null
  managerName: string
  department: string
  severity: 'high' | 'medium' | 'low'
  message: string
  daysOverdue: number
  escalationLevel: 'employee' | 'manager' | 'skip-level' | 'hr'
  targetUserId: string
}

export type AdminCycleWindow = {
  id: string
  cycleId: string
  name: string
  type: string
  startDate: string
  endDate: string | null
  status: 'active' | 'completed' | 'upcoming'
  quarter: 'q1' | 'q2' | 'q3' | 'q4' | null
}

export type AdminCycle = {
  id: string
  name: string
  startDate: string
  endDate: string
  status: 'active' | 'closed' | 'upcoming'
  windows: AdminCycleWindow[]
}

type UnlockGoalSheetForReworkParams = {
  goalSheetId: string
  reason: string
  adminProfileId: string
}

function first<T>(relation: Relation<T>): T | null {
  if (!relation) return null
  return Array.isArray(relation) ? relation[0] ?? null : relation
}

function departmentName(profile: ProfileRow | undefined): string {
  return first(profile?.departments)?.name ?? '-'
}

function statusFromDb(status: string): GoalStatus {
  if (status === 'on_track') return 'on-track'
  if (status === 'completed') return 'completed'
  if (status === 'overdue') return 'overdue'
  return 'not-started'
}

function quarterLabel(quarter: CheckInRow['quarter']): 'Q1' | 'Q2' | 'Q3' | 'Q4' {
  return quarter.toUpperCase() as 'Q1' | 'Q2' | 'Q3' | 'Q4'
}

function daysSince(date: string): number {
  const start = new Date(date).getTime()
  if (Number.isNaN(start)) return 0
  return Math.max(0, Math.floor((Date.now() - start) / 86_400_000))
}

function severityForDays(days: number): 'high' | 'medium' | 'low' {
  if (days >= 10) return 'high'
  if (days >= 5) return 'medium'
  return 'low'
}

function levelForDays(days: number): 'employee' | 'manager' | 'skip-level' | 'hr' {
  if (days >= 11) return 'hr'
  if (days >= 8) return 'skip-level'
  if (days >= 4) return 'manager'
  return 'employee'
}

export function calculateAdminScore(params: {
  uomType: UnitOfMeasurement
  plannedTarget: number
  actualAchievement: number | null
  targetDate?: string | null
  submittedAt?: string | null
}): number | null {
  const { uomType, plannedTarget, actualAchievement, targetDate, submittedAt } = params

  if (uomType === 'timeline') {
    if (!targetDate || !submittedAt) return null
    return submittedAt.slice(0, 10) <= targetDate ? 100 : 0
  }

  if (actualAchievement == null || Number.isNaN(actualAchievement)) return null

  if (uomType === 'zero-based') return actualAchievement === 0 ? 100 : 0
  if (plannedTarget === 0) return actualAchievement === 0 ? 100 : null

  if (uomType === 'numeric-lower-better' || uomType === 'percentage-lower-better') {
    if (actualAchievement === 0) return 100
    return Math.max(0, Math.round((plannedTarget / actualAchievement) * 100))
  }

  return Math.max(0, Math.round((actualAchievement / plannedTarget) * 100))
}

async function loadAdminBaseData() {
  if (!isSupabaseConfigured()) {
    return null
  }

  const supabase = createClient()
  if (!supabase) return null

  const [profilesRes, sheetsRes, goalsRes, checkInsRes, commentsRes, windowsRes] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, email, role, manager_id, departments ( name )'),
      supabase
        .from('goal_sheets')
        .select(
          'id, employee_id, manager_id, cycle_id, status, total_weightage, goals_count, is_locked, submitted_at, approved_at, locked_at, unlocked_at, unlocked_by, unlock_reason, created_at, updated_at'
        ),
      supabase
        .from('goals')
        .select(
          'id, goal_sheet_id, employee_id, title, description, uom_type, target, target_date, weightage, status, is_locked, thrust_areas ( name )'
        ),
      supabase
        .from('quarterly_checkins')
        .select(
          'id, goal_id, goal_sheet_id, employee_id, quarter, planned_target, actual_achievement, computed_score, status, submitted_at'
        ),
      supabase.from('manager_checkin_comments').select('checkin_id'),
      supabase
        .from('cycle_windows')
        .select('id, cycle_id, period, quarter, window_opens, window_closes, action, is_open, created_at'),
    ])

  if (profilesRes.error) console.error('[admin] profiles error:', profilesRes.error.message)
  if (sheetsRes.error) console.error('[admin] goal sheets error:', sheetsRes.error.message)
  if (goalsRes.error) console.error('[admin] goals error:', goalsRes.error.message)
  if (checkInsRes.error) console.error('[admin] checkins error:', checkInsRes.error.message)
  if (commentsRes.error) console.error('[admin] comments error:', commentsRes.error.message)
  if (windowsRes.error) console.error('[admin] windows error:', windowsRes.error.message)

  return {
    profiles: (profilesRes.data ?? []) as ProfileRow[],
    sheets: (sheetsRes.data ?? []) as GoalSheetRow[],
    goals: (goalsRes.data ?? []) as GoalRow[],
    checkIns: (checkInsRes.data ?? []) as CheckInRow[],
    comments: (commentsRes.data ?? []) as CommentRow[],
    windows: (windowsRes.data ?? []) as CycleWindowRow[],
  }
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const base = await loadAdminBaseData()
  const recentAuditLogs = await getAuditLogs()

  if (!base) {
    return {
      totalEmployees: 0,
      managers: 0,
      submittedGoalSheets: 0,
      pendingApprovals: 0,
      approvedOrLockedGoalSheets: 0,
      activeEscalations: 0,
      recentAuditLogs: [],
    }
  }

  const escalations = computeEscalations(base)

  return {
    totalEmployees: base.profiles.filter((profile) => profile.role === 'employee').length,
    managers: base.profiles.filter((profile) => profile.role === 'manager').length,
    submittedGoalSheets: base.sheets.filter((sheet) =>
      ['submitted', 'pending_approval', 'approved', 'locked'].includes(sheet.status)
    ).length,
    pendingApprovals: base.sheets.filter((sheet) =>
      ['submitted', 'pending_approval'].includes(sheet.status)
    ).length,
    approvedOrLockedGoalSheets: base.sheets.filter((sheet) =>
      ['approved', 'locked'].includes(sheet.status) || sheet.is_locked
    ).length,
    activeEscalations: escalations.length,
    recentAuditLogs: recentAuditLogs.slice(0, 5),
  }
}

export async function getAdminReports(): Promise<{
  achievementRows: AdminAchievementReportRow[]
  completionRows: AdminCompletionReportRow[]
  departments: string[]
}> {
  const base = await loadAdminBaseData()
  if (!base) return { achievementRows: [], completionRows: [], departments: [] }

  const profilesById = new Map(base.profiles.map((profile) => [profile.id, profile]))
  const sheetsById = new Map(base.sheets.map((sheet) => [sheet.id, sheet]))
  const checkInsByGoal = new Map(base.checkIns.map((row) => [row.goal_id, row]))
  const commentedCheckIns = new Set(base.comments.map((comment) => comment.checkin_id))

  const achievementRows = base.goals.map((goal) => {
    const employee = profilesById.get(goal.employee_id)
    const sheet = sheetsById.get(goal.goal_sheet_id)
    const manager = sheet?.manager_id ? profilesById.get(sheet.manager_id) : undefined
    const checkIn = checkInsByGoal.get(goal.id)
    const uom = mapUomFromDb(goal.uom_type)
    const plannedTarget = Number(checkIn?.planned_target ?? goal.target)
    const actualAchievement =
      checkIn?.actual_achievement == null ? null : Number(checkIn.actual_achievement)
    const score =
      checkIn?.computed_score == null
        ? calculateAdminScore({
            uomType: uom,
            plannedTarget,
            actualAchievement,
            targetDate: goal.target_date,
            submittedAt: checkIn?.submitted_at,
          })
        : Number(checkIn.computed_score)

    return {
      id: `${goal.id}-${checkIn?.quarter ?? 'no-checkin'}`,
      employeeId: goal.employee_id,
      employeeName: employee?.full_name ?? 'Employee',
      department: departmentName(employee),
      managerName: manager?.full_name ?? '-',
      goalTitle: goal.title,
      plannedTarget,
      actualAchievement,
      weightage: Number(goal.weightage),
      score,
      quarter: checkIn ? quarterLabel(checkIn.quarter) : 'Q1',
      status: checkIn ? statusFromDb(checkIn.status) : statusFromDb(goal.status),
      unitOfMeasurement: uom,
    }
  })

  const completionRows = base.sheets.flatMap((sheet) => {
    const employee = profilesById.get(sheet.employee_id)
    const manager = sheet.manager_id ? profilesById.get(sheet.manager_id) : undefined
    return (['q1', 'q2', 'q3', 'q4'] as const).map((quarter) => {
      const checkIns = base.checkIns.filter(
        (checkIn) => checkIn.goal_sheet_id === sheet.id && checkIn.quarter === quarter
      )
      const submitted = checkIns.find((checkIn) => checkIn.submitted_at)
      const hasComment = checkIns.some((checkIn) => commentedCheckIns.has(checkIn.id))
      return {
        id: `${sheet.id}-${quarter}`,
        employeeName: employee?.full_name ?? 'Employee',
        department: departmentName(employee),
        managerName: manager?.full_name ?? '-',
        quarter: quarter.toUpperCase() as 'Q1' | 'Q2' | 'Q3' | 'Q4',
        checkInStatus: submitted
          ? ('Submitted' as const)
          : ('Not Submitted' as const),
        submittedDate: submitted?.submitted_at ?? null,
        managerCommentStatus: hasComment ? ('Commented' as const) : ('Pending' as const),
      }
    })
  })

  const departments = Array.from(
    new Set(base.profiles.map((profile) => departmentName(profile)).filter(Boolean))
  ).sort()

  return { achievementRows, completionRows, departments }
}

function computeEscalations(base: NonNullable<Awaited<ReturnType<typeof loadAdminBaseData>>>): AdminEscalation[] {
  const profilesById = new Map(base.profiles.map((profile) => [profile.id, profile]))
  const employees = base.profiles.filter((profile) => profile.role === 'employee')
  const escalations: AdminEscalation[] = []
  const goalCreationWindow = base.windows.find((window) => window.action === 'goal_creation')
  const checkInWindows = base.windows.filter((window) => window.action === 'checkin')

  for (const employee of employees) {
    const employeeSheets = base.sheets.filter((sheet) => sheet.employee_id === employee.id)
    const latestSheet = employeeSheets.sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0]
    const manager = employee.manager_id ? profilesById.get(employee.manager_id) : undefined
    const managerName = manager?.full_name ?? '-'
    const targetUserId = employee.manager_id ?? employee.id

    if (goalCreationWindow) {
      const daysAfterOpen = daysSince(goalCreationWindow.window_opens)
      const hasSubmitted = employeeSheets.some((sheet) =>
        ['submitted', 'pending_approval', 'approved', 'locked'].includes(sheet.status)
      )
      if (!hasSubmitted && daysAfterOpen >= 7) {
        escalations.push({
          id: `goal-not-submitted-${employee.id}`,
          type: 'goal-not-submitted',
          employeeId: employee.id,
          employeeName: employee.full_name,
          managerId: employee.manager_id,
          managerName,
          department: departmentName(employee),
          severity: severityForDays(daysAfterOpen - 7),
          message: 'Goal sheet has not been submitted after the goal creation window opened.',
          daysOverdue: daysAfterOpen - 7,
          escalationLevel: levelForDays(daysAfterOpen - 7),
          targetUserId,
        })
      }
    }

    if (latestSheet && ['submitted', 'pending_approval'].includes(latestSheet.status) && latestSheet.submitted_at) {
      const overdueDays = daysSince(latestSheet.submitted_at) - 5
      if (overdueDays >= 1) {
        escalations.push({
          id: `approval-overdue-${latestSheet.id}`,
          type: 'approval-overdue',
          employeeId: employee.id,
          employeeName: employee.full_name,
          managerId: latestSheet.manager_id,
          managerName,
          department: departmentName(employee),
          severity: severityForDays(overdueDays),
          message: 'Submitted goal sheet is waiting for manager approval.',
          daysOverdue: overdueDays,
          escalationLevel: levelForDays(overdueDays),
          targetUserId: latestSheet.manager_id ?? employee.id,
        })
      }
    }

    if (latestSheet && Number(latestSheet.total_weightage ?? 0) !== 100) {
      escalations.push({
        id: `weightage-mismatch-${latestSheet.id}`,
        type: 'weightage-mismatch',
        employeeId: employee.id,
        employeeName: employee.full_name,
        managerId: latestSheet.manager_id,
        managerName,
        department: departmentName(employee),
        severity: 'low',
        message: `Goal sheet weightage is ${Number(latestSheet.total_weightage ?? 0)}%, not 100%.`,
        daysOverdue: 1,
        escalationLevel: 'employee',
        targetUserId: employee.id,
      })
    }

    for (const window of checkInWindows) {
      const isWindowRelevant = window.is_open || daysSince(window.window_closes ?? window.window_opens) >= 1
      if (!latestSheet || !window.quarter || !isWindowRelevant) continue
      const hasSubmittedCheckIn = base.checkIns.some(
        (checkIn) =>
          checkIn.employee_id === employee.id &&
          checkIn.goal_sheet_id === latestSheet.id &&
          checkIn.quarter === window.quarter &&
          Boolean(checkIn.submitted_at)
      )
      const overdueDays = daysSince(window.window_opens)
      if (!hasSubmittedCheckIn && overdueDays >= 1) {
        escalations.push({
          id: `checkin-pending-${employee.id}-${window.quarter}`,
          type: 'checkin-pending',
          employeeId: employee.id,
          employeeName: employee.full_name,
          managerId: latestSheet.manager_id,
          managerName,
          department: departmentName(employee),
          severity: severityForDays(overdueDays),
          message: `${window.period} check-in has not been submitted.`,
          daysOverdue: overdueDays,
          escalationLevel: levelForDays(overdueDays),
          targetUserId,
        })
      }
    }
  }

  return escalations.sort((a, b) => b.daysOverdue - a.daysOverdue)
}

export async function getAdminEscalations(): Promise<AdminEscalation[]> {
  const base = await loadAdminBaseData()
  return base ? computeEscalations(base) : []
}

export async function sendEscalationReminder(
  escalation: AdminEscalation,
  admin: User
): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured() || !isRealUuid(admin.id) || !isRealUuid(escalation.targetUserId)) {
    return { success: false, error: 'Live admin session is required.' }
  }

  try {
    await createNotification({
      userId: escalation.targetUserId,
      type: 'escalation',
      title: 'Goal lifecycle reminder',
      message: escalation.message,
      link: '/employee/my-goal-sheet',
    })

    await createAuditLog({
      actorId: admin.id,
      actorRole: 'admin',
      employeeId: escalation.employeeId,
      actionType: 'escalation_reminder_sent',
      fieldChanged: escalation.type,
      newValue: 'reminder_sent',
      description: `Admin reminder sent: ${escalation.message}`,
    })

    return { success: true, error: null }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to send reminder.',
    }
  }
}

export async function getAdminCycle(): Promise<AdminCycle | null> {
  if (!isSupabaseConfigured()) return null
  const supabase = createClient()
  if (!supabase) return null

  const { data: cycleData, error: cycleError } = await supabase
    .from('goal_cycles')
    .select('id, name, year, start_date, end_date, status, created_at, updated_at')
    .order('start_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (cycleError || !cycleData) {
    if (cycleError) console.error('[getAdminCycle] cycle error:', cycleError.message)
    return null
  }

  const cycle = cycleData as CycleRow
  const { data: windowsData, error: windowsError } = await supabase
    .from('cycle_windows')
    .select('id, cycle_id, period, quarter, window_opens, window_closes, action, is_open, created_at')
    .eq('cycle_id', cycle.id)
    .order('window_opens', { ascending: true })

  if (windowsError) {
    console.error('[getAdminCycle] windows error:', windowsError.message)
  }

  const today = new Date().toISOString().slice(0, 10)
  const windows: AdminCycleWindow[] = ((windowsData ?? []) as CycleWindowRow[]).map((window) => {
    const status: AdminCycleWindow['status'] = window.is_open
      ? 'active'
      : window.window_closes && window.window_closes < today
        ? 'completed'
        : 'upcoming'

    return {
      id: window.id,
      cycleId: window.cycle_id,
      name: window.period,
      type: window.action,
      startDate: window.window_opens,
      endDate: window.window_closes,
      status,
      quarter: window.quarter,
    }
  })

  return {
    id: cycle.id,
    name: cycle.name,
    startDate: cycle.start_date,
    endDate: cycle.end_date,
    status: cycle.status,
    windows,
  }
}

export async function updateCycleWindowStatus(params: {
  windowId: string
  isOpen: boolean
  admin: User
}): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured() || !isRealUuid(params.windowId) || !isRealUuid(params.admin.id)) {
    return { success: false, error: 'Live admin session is required.' }
  }

  const supabase = createClient()
  if (!supabase) return { success: false, error: 'Supabase client unavailable.' }

  const { data: before } = await supabase
    .from('cycle_windows')
    .select('period, is_open')
    .eq('id', params.windowId)
    .maybeSingle()

  const { error } = await supabase
    .from('cycle_windows')
    .update({ is_open: params.isOpen })
    .eq('id', params.windowId)

  if (error) {
    console.error('[updateCycleWindowStatus] error:', error.message)
    return { success: false, error: error.message }
  }

  await createAuditLog({
    actorId: params.admin.id,
    actorRole: 'admin',
    actionType: params.isOpen ? 'cycle_window_opened' : 'cycle_window_closed',
    fieldChanged: (before as { period?: string } | null)?.period ?? 'Cycle Window',
    oldValue: String((before as { is_open?: boolean } | null)?.is_open ?? false),
    newValue: String(params.isOpen),
    description: `Admin ${params.isOpen ? 'opened' : 'closed'} a cycle window.`,
  })

  return { success: true, error: null }
}

export async function getUnlockableGoalSheets(): Promise<
  Array<{
    id: string
    employeeName: string
    department: string
    status: string
    isLocked: boolean
    totalWeightage: number
    updatedAt: string
  }>
> {
  const base = await loadAdminBaseData()
  if (!base) return []
  const profilesById = new Map(base.profiles.map((profile) => [profile.id, profile]))
  return base.sheets
    .filter((sheet) => ['approved', 'locked'].includes(sheet.status) || sheet.is_locked)
    .map((sheet) => {
      const employee = profilesById.get(sheet.employee_id)
      return {
        id: sheet.id,
        employeeName: employee?.full_name ?? 'Employee',
        department: departmentName(employee),
        status: sheet.status,
        isLocked: Boolean(sheet.is_locked || ['approved', 'locked'].includes(sheet.status)),
        totalWeightage: Number(sheet.total_weightage ?? 0),
        updatedAt: sheet.updated_at,
      }
    })
}

export async function unlockGoalSheetForRework({
  goalSheetId,
  reason,
  adminProfileId,
}: UnlockGoalSheetForReworkParams): Promise<void> {
  const cleanGoalSheetId = String(goalSheetId ?? '').trim()

  if (!cleanGoalSheetId) {
    throw new Error('Missing goal sheet id for unlock')
  }

  if (!isSupabaseConfigured() || !isRealUuid(cleanGoalSheetId) || !isRealUuid(adminProfileId)) {
    throw new Error('Live admin session is required.')
  }

  const trimmedReason = reason.trim()
  if (!trimmedReason) {
    throw new Error('Unlock reason is required.')
  }

  const supabase = createClient()
  if (!supabase) throw new Error('Supabase client unavailable.')

  const { data: goalSheetRef, error: goalSheetRefError } = await supabase
    .from('goal_sheets')
    .select('id,employee_id')
    .eq('id', cleanGoalSheetId)
    .maybeSingle()

  if (goalSheetRefError) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[admin unlock] goal sheet lookup failed:', goalSheetRefError)
    }
    throw goalSheetRefError
  }

  if (!goalSheetRef) {
    throw new Error('Unlock failed: goal sheet row not found')
  }

  const now = new Date().toISOString()
  const unlockPayload = {
    status: 'draft',
    is_locked: false,
    approved_at: null,
    locked_at: null,
    unlocked_at: now,
    unlocked_by: adminProfileId,
    unlock_reason: trimmedReason,
    updated_at: now,
  }

  const { error: updateSheetError } = await supabase
    .from('goal_sheets')
    .update(unlockPayload)
    .eq('id', cleanGoalSheetId)

  if (updateSheetError) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[admin unlock] goal_sheets update failed:', updateSheetError)
    }
    throw updateSheetError
  }

  const { data: verifyRow, error: verifyError } = await supabase
    .from('goal_sheets')
    .select('id,status,is_locked,approved_at,locked_at,unlocked_at,unlock_reason')
    .eq('id', cleanGoalSheetId)
    .maybeSingle()

  if (verifyError) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[admin unlock] verify failed:', verifyError)
    }
    throw verifyError
  }

  if (!verifyRow) {
    throw new Error('Unlock failed: goal sheet row not found after update')
  }

  if (
    verifyRow.status !== 'draft' ||
    verifyRow.is_locked !== false ||
    verifyRow.approved_at !== null ||
    verifyRow.locked_at !== null ||
    !verifyRow.unlocked_at
  ) {
    throw new Error('Unlock failed: goal sheet state did not change')
  }

  const { error: updateGoalsError } = await supabase
    .from('goals')
    .update({
      is_locked: false,
      updated_at: now,
    })
    .eq('goal_sheet_id', cleanGoalSheetId)

  if (updateGoalsError) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[admin unlock] goals update failed:', updateGoalsError)
    }
    throw updateGoalsError
  }

  await createAuditLog({
    actorId: adminProfileId,
    actorRole: 'admin',
    employeeId: (goalSheetRef as { employee_id: string }).employee_id,
    goalSheetId: cleanGoalSheetId,
    actionType: 'goal_sheet_unlocked',
    fieldChanged: 'Goal Sheet Unlocked',
    newValue: 'draft',
    description: `Admin unlocked goal sheet for rework: ${trimmedReason}`,
  })

  await createNotification({
    userId: (goalSheetRef as { employee_id: string }).employee_id,
    type: 'goal_returned',
    title: 'Goal Sheet Unlocked',
    message: 'Admin unlocked your goal sheet for rework. Edit and resubmit for manager approval.',
    link: '/employee/create-goal-sheet',
  })
}
