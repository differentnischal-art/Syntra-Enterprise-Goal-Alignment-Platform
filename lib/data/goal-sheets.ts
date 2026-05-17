/**
 * Fourth Supabase slice — goal sheet create, draft save, and submit.
 */

import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { createAuditLog } from '@/lib/data/audit-logs'
import { createNotification } from '@/lib/data/notifications'
import {
  deleteGoalsForSheet,
  insertGoalsForSheet,
  isRealUuid,
  mapGoalRowToGoal,
  mapGoalSheetRowToGoalSheet,
  type DbGoalSheetRowWithRelations,
  type GoalSheetGoalInput,
} from '@/lib/data/goals'
import type { Goal, GoalSheet } from '@/lib/types'

export type GoalSheetStatus =
  | 'draft'
  | 'submitted'
  | 'pending_approval'
  | 'approved'
  | 'returned'
  | 'returned_for_rework'
  | 'rejected'
  | 'rework_required'
  | 'unlocked'
  | 'locked'
  | 'final_closed'

export type GoalSheetRecord = {
  id: string
  employeeId: string
  managerId: string | null
  cycleId: string
  status: GoalSheetStatus
  totalWeightage: number
  goalsCount: number
  isLocked: boolean
  submittedAt: string | null
  approvedAt: string | null
  returnedAt: string | null
  lockedAt: string | null
  unlockedAt: string | null
  unlockedBy: string | null
  unlockReason: string | null
  approvedBy: string | null
  managerComment: string | null
  createdAt: string
  updatedAt: string
}

export type GoalSheetMutationResult = {
  goalSheet: GoalSheetRecord | null
  error: string | null
  demoMode?: boolean
}

type DbGoalSheetRow = {
  id: string
  employee_id: string
  manager_id: string | null
  cycle_id: string
  status: GoalSheetStatus
  total_weightage: number
  goals_count: number
  is_locked: boolean | null
  submitted_at: string | null
  approved_at: string | null
  returned_at: string | null
  locked_at: string | null
  unlocked_at: string | null
  unlocked_by: string | null
  unlock_reason: string | null
  approved_by: string | null
  manager_comment: string | null
  created_at: string
  updated_at: string
}

const GOAL_SHEET_SELECT = `
  id,
  employee_id,
  manager_id,
  cycle_id,
  status,
  total_weightage,
  goals_count,
  is_locked,
  submitted_at,
  approved_at,
  returned_at,
  locked_at,
  unlocked_at,
  unlocked_by,
  unlock_reason,
  approved_by,
  manager_comment,
  created_at,
  updated_at
`

function mapRow(row: DbGoalSheetRow): GoalSheetRecord {
  return {
    id: row.id,
    employeeId: row.employee_id,
    managerId: row.manager_id,
    cycleId: row.cycle_id,
    status: row.status,
    totalWeightage: Number(row.total_weightage),
    goalsCount: row.goals_count,
    isLocked: row.is_locked ?? (row.status === 'locked' || row.status === 'approved'),
    submittedAt: row.submitted_at,
    approvedAt: row.approved_at,
    returnedAt: row.returned_at,
    lockedAt: row.locked_at,
    unlockedAt: row.unlocked_at,
    unlockedBy: row.unlocked_by,
    unlockReason: row.unlock_reason,
    approvedBy: row.approved_by,
    managerComment: row.manager_comment,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function filterGoalsForSave(goals: GoalSheetGoalInput[]): GoalSheetGoalInput[] {
  return goals.filter((g) => g.title.trim().length > 0)
}

function computeTotals(goals: GoalSheetGoalInput[]) {
  const totalWeightage = goals.reduce((sum, g) => sum + g.weightage, 0)
  return {
    totalWeightage,
    goalsCount: goals.length,
  }
}

export function isEditableGoalSheetStatus(status: string | null | undefined): boolean {
  return (
    status === 'draft' ||
    status === 'returned' ||
    status === 'returned_for_rework' ||
    status === 'returned-for-rework' ||
    status === 'rejected' ||
    status === 'rework_required' ||
    status === 'rework-required' ||
    status === 'unlocked'
  )
}

export function isGoalSheetEditableForEmployee(
  sheet: Pick<GoalSheetRecord, 'status' | 'isLocked'> | null | undefined
): boolean {
  return Boolean(sheet && !sheet.isLocked && isEditableGoalSheetStatus(sheet.status))
}

async function validateTimelineTargetsWithinCycle(
  cycleId: string,
  goals: GoalSheetGoalInput[]
): Promise<string | null> {
  const timelineGoals = goals.filter((goal) => goal.unitOfMeasurement === 'timeline')
  if (timelineGoals.length === 0) {
    return null
  }

  const supabase = createClient()
  if (!supabase) {
    return 'Supabase client unavailable'
  }

  const { data, error } = await supabase
    .from('goal_cycles')
    .select('start_date, end_date')
    .eq('id', cycleId)
    .maybeSingle()

  if (error) {
    console.error('[validateTimelineTargetsWithinCycle] error:', error.message)
    return 'Could not validate timeline target dates.'
  }

  if (!data) {
    return 'Goal cycle not found.'
  }

  for (const goal of timelineGoals) {
    if (
      !goal.targetDate ||
      goal.targetDate < data.start_date ||
      goal.targetDate > data.end_date
    ) {
      return 'Timeline target dates must fall within the goal cycle.'
    }
  }

  return null
}

export function validateGoalsForDraft(goals: GoalSheetGoalInput[]): string | null {
  if (goals.length > 8) {
    return 'Maximum 8 goals allowed.'
  }

  for (const goal of goals) {
    if (goal.weightage < 0 || goal.weightage > 100) {
      return 'Goal weightage must be between 0 and 100.'
    }

    if (goal.unitOfMeasurement === 'timeline') {
      if (!goal.targetDate || Number.isNaN(Date.parse(goal.targetDate))) {
        return 'Timeline goals require a valid target date.'
      }
      continue
    }

    if (!Number.isFinite(goal.target) || goal.target < 0) {
      return 'Goal targets cannot be negative.'
    }

    if (
      (goal.unitOfMeasurement === 'percentage' ||
        goal.unitOfMeasurement === 'percentage-higher-better' ||
        goal.unitOfMeasurement === 'percentage-lower-better') &&
      goal.target > 100
    ) {
      return 'Percentage targets must be between 0 and 100.'
    }

    if (goal.unitOfMeasurement === 'zero-based' && goal.target !== 0) {
      return 'Zero-based goals must use a target of 0.'
    }
  }

  return null
}

export function validateGoalsForSubmit(goals: GoalSheetGoalInput[]): string | null {
  if (goals.length < 1) {
    return 'At least one goal is required.'
  }
  if (goals.length > 8) {
    return 'Maximum 8 goals allowed.'
  }

  for (const goal of goals) {
    if (!goal.title.trim() || !goal.thrustArea || !goal.weightage) {
      return 'All goals must have title, thrust area, unit of measurement, target, and weightage.'
    }
    if (!Number.isFinite(goal.weightage) || goal.weightage < 10 || goal.weightage > 100) {
      return 'Goal weightage must be between 10 and 100.'
    }

    if (goal.unitOfMeasurement === 'timeline') {
      if (!goal.targetDate || Number.isNaN(Date.parse(goal.targetDate))) {
        return 'Timeline goals require a valid target date.'
      }
      continue
    }

    if (!Number.isFinite(goal.target) || goal.target < 0) {
      return 'Goal targets cannot be negative.'
    }

    if (
      (goal.unitOfMeasurement === 'percentage' ||
        goal.unitOfMeasurement === 'percentage-higher-better' ||
        goal.unitOfMeasurement === 'percentage-lower-better') &&
      goal.target > 100
    ) {
      return 'Percentage targets must be between 0 and 100.'
    }

    if (goal.unitOfMeasurement === 'zero-based' && goal.target !== 0) {
      return 'Zero-based goals must use a target of 0.'
    }
  }

  const { totalWeightage } = computeTotals(goals)
  if (totalWeightage !== 100) {
    return 'Total weightage must equal 100%.'
  }

  return null
}

export type EmployeeGoalSheetWithGoals = {
  goalSheet: GoalSheet
  goals: Goal[]
}

const GOAL_SHEET_WITH_GOALS_SELECT = `
  id,
  employee_id,
  manager_id,
  cycle_id,
  status,
  total_weightage,
  goals_count,
  is_locked,
  submitted_at,
  approved_at,
  returned_at,
  locked_at,
  unlocked_at,
  unlocked_by,
  unlock_reason,
  approved_by,
  manager_comment,
  created_at,
  updated_at,
  goal_cycles ( name ),
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

export async function getCurrentEmployeeGoalSheetWithGoals(params: {
  employeeId: string
  cycleId: string
  employeeName?: string
  department?: string
  managerName?: string
  cycleName?: string
}): Promise<EmployeeGoalSheetWithGoals | null> {
  if (!isSupabaseConfigured()) {
    return null
  }

  if (!isRealUuid(params.employeeId) || !isRealUuid(params.cycleId)) {
    return null
  }

  const supabase = createClient()
  if (!supabase) {
    return null
  }

  try {
    const { data, error } = await supabase
      .from('goal_sheets')
      .select(GOAL_SHEET_WITH_GOALS_SELECT)
      .eq('employee_id', params.employeeId)
      .eq('cycle_id', params.cycleId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error(
        '[getCurrentEmployeeGoalSheetWithGoals] error:',
        error.message
      )
      return null
    }

    if (!data) {
      return null
    }

    const row = data as DbGoalSheetRowWithRelations
    const cycleName =
      params.cycleName ?? relationNameFromRow(row.goal_cycles, 'FY Goal Cycle')
    const employeeName = params.employeeName ?? 'Employee'
    const department = params.department ?? '—'
    const managerName = params.managerName ?? 'Not assigned'

    const goalSheet = mapGoalSheetRowToGoalSheet(row, {
      cycleName,
      employeeName,
      department,
      managerName,
    })

    const goals = (row.goals ?? []).map((goalRow) =>
      mapGoalRowToGoal(goalRow, { employeeName })
    )

    return { goalSheet, goals }
  } catch (err) {
    console.error('[getCurrentEmployeeGoalSheetWithGoals] unexpected error:', err)
    return null
  }
}

function relationNameFromRow(
  relation: { name: string } | { name: string }[] | null | undefined,
  fallback: string
): string {
  if (!relation) return fallback
  if (Array.isArray(relation)) {
    return relation[0]?.name ?? fallback
  }
  return relation.name
}

export async function getEmployeeGoalSheet(
  employeeId: string,
  cycleId: string
): Promise<GoalSheetRecord | null> {
  if (!isSupabaseConfigured()) {
    return null
  }

  if (!isRealUuid(employeeId) || !isRealUuid(cycleId)) {
    return null
  }

  const supabase = createClient()
  if (!supabase) {
    return null
  }

  const { data, error } = await supabase
    .from('goal_sheets')
    .select(GOAL_SHEET_SELECT)
    .eq('employee_id', employeeId)
    .eq('cycle_id', cycleId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('[getEmployeeGoalSheet] error:', error.message)
    return null
  }

  if (!data) {
    return null
  }

  return mapRow(data as DbGoalSheetRow)
}

export async function getOrCreateCurrentGoalSheet(
  employeeId: string,
  cycleId: string,
  managerId?: string | null
): Promise<GoalSheetRecord | null> {
  if (!isSupabaseConfigured()) {
    return null
  }

  if (
    !isRealUuid(employeeId) ||
    !isRealUuid(cycleId) ||
    (managerId != null && !isRealUuid(managerId))
  ) {
    return null
  }

  const existing = await getEmployeeGoalSheet(employeeId, cycleId)
  if (existing) {
    return existing
  }

  const supabase = createClient()
  if (!supabase) {
    return null
  }

  const { data, error } = await supabase
    .from('goal_sheets')
    .insert({
      employee_id: employeeId,
      manager_id: managerId ?? null,
      cycle_id: cycleId,
      status: 'draft',
      total_weightage: 0,
      goals_count: 0,
    })
    .select(GOAL_SHEET_SELECT)
    .single()

  if (error) {
    console.error('[getOrCreateCurrentGoalSheet] error:', error.message)
    return null
  }

  return mapRow(data as DbGoalSheetRow)
}

async function persistGoalSheetGoals(
  goalSheetId: string,
  employeeId: string,
  goals: GoalSheetGoalInput[],
  approvalStatus: 'draft' | 'pending'
): Promise<string | null> {
  const deleteError = await deleteGoalsForSheet(goalSheetId)
  if (deleteError) {
    return deleteError
  }

  if (goals.length === 0) {
    return null
  }

  return insertGoalsForSheet(goalSheetId, employeeId, goals, { approvalStatus })
}

type SaveParams = {
  employeeId: string
  managerId?: string | null
  cycleId: string
  goals: GoalSheetGoalInput[]
}

export async function saveGoalSheetDraft(
  params: SaveParams
): Promise<GoalSheetMutationResult> {
  if (!isSupabaseConfigured()) {
    return { goalSheet: null, error: null, demoMode: true }
  }

  if (
    !isRealUuid(params.employeeId) ||
    !isRealUuid(params.cycleId) ||
    (params.managerId != null && !isRealUuid(params.managerId))
  ) {
    return { goalSheet: null, error: 'Invalid goal sheet payload.' }
  }

  const supabase = createClient()
  if (!supabase) {
    return { goalSheet: null, error: 'Supabase client unavailable' }
  }

  const goals = filterGoalsForSave(params.goals)
  const validationError = validateGoalsForDraft(goals)
  if (validationError) {
    return { goalSheet: null, error: validationError }
  }
  const timelineValidationError = await validateTimelineTargetsWithinCycle(
    params.cycleId,
    goals
  )
  if (timelineValidationError) {
    return { goalSheet: null, error: timelineValidationError }
  }
  const { totalWeightage, goalsCount } = computeTotals(goals)

  try {
    const sheet =
      (await getEmployeeGoalSheet(params.employeeId, params.cycleId)) ??
      (await getOrCreateCurrentGoalSheet(
        params.employeeId,
        params.cycleId,
        params.managerId
      ))

    if (!sheet) {
      return { goalSheet: null, error: 'Could not create or load goal sheet.' }
    }

    if (!isGoalSheetEditableForEmployee(sheet)) {
      return {
        goalSheet: null,
        error: 'Goal sheet can only be edited while unlocked, draft, or returned for rework.',
      }
    }

    const goalsError = await persistGoalSheetGoals(
      sheet.id,
      params.employeeId,
      goals,
      'draft'
    )
    if (goalsError) {
      return { goalSheet: null, error: goalsError }
    }

    const { data, error } = await supabase
      .from('goal_sheets')
      .update({
        manager_id: params.managerId ?? sheet.managerId,
        status: sheet.status === 'draft' ? 'draft' : sheet.status,
        is_locked: false,
        total_weightage: totalWeightage,
        goals_count: goalsCount,
        submitted_at: null,
        approved_at: null,
        approved_by: null,
        locked_at: null,
      })
      .eq('id', sheet.id)
      .select(GOAL_SHEET_SELECT)
      .single()

    if (error) {
      console.error('[saveGoalSheetDraft] update error:', error.message)
      return { goalSheet: null, error: error.message }
    }

    const savedSheet = mapRow(data as DbGoalSheetRow)

    try {
      if (sheet.unlockedAt) {
        await createAuditLog({
          actorId: params.employeeId,
          actorRole: 'employee',
          employeeId: params.employeeId,
          goalSheetId: savedSheet.id,
          actionType: 'goal_updated_after_unlock',
          fieldChanged: 'Goal Sheet Goals',
          oldValue: sheet.status,
          newValue: 'submitted',
          description: 'Employee edited goal sheet after admin unlock',
        })
      }

      await createAuditLog({
        actorId: params.employeeId,
        actorRole: 'employee',
        employeeId: params.employeeId,
        goalSheetId: savedSheet.id,
        actionType: sheet.unlockedAt ? 'goal_updated_after_unlock' : 'goal_draft_saved',
        fieldChanged: 'Goal Sheet Draft',
        oldValue: sheet.status,
        newValue: savedSheet.status,
        description: sheet.unlockedAt
          ? 'Employee edited goal sheet after admin unlock'
          : 'Employee saved goal sheet draft',
      })
    } catch (err) {
      console.error('[saveGoalSheetDraft] audit error:', err)
    }

    return { goalSheet: savedSheet, error: null }
  } catch (err) {
    return {
      goalSheet: null,
      error: err instanceof Error ? err.message : 'Failed to save draft',
    }
  }
}

export async function submitGoalSheet(
  params: SaveParams
): Promise<GoalSheetMutationResult> {
  if (!isSupabaseConfigured()) {
    return { goalSheet: null, error: null, demoMode: true }
  }

  if (
    !isRealUuid(params.employeeId) ||
    !isRealUuid(params.cycleId) ||
    (params.managerId != null && !isRealUuid(params.managerId))
  ) {
    return { goalSheet: null, error: 'Invalid goal sheet payload.' }
  }

  const validationError = validateGoalsForSubmit(
    filterGoalsForSave(
      params.goals.map((g) => ({
        ...g,
        title: g.title.trim(),
      }))
    )
  )
  if (validationError) {
    return { goalSheet: null, error: validationError }
  }
  const timelineValidationError = await validateTimelineTargetsWithinCycle(
    params.cycleId,
    params.goals
  )
  if (timelineValidationError) {
    return { goalSheet: null, error: timelineValidationError }
  }

  const goals = filterGoalsForSave(params.goals).map((g) => ({
    title: g.title.trim(),
    description: g.description,
    thrustArea: g.thrustArea,
    unitOfMeasurement: g.unitOfMeasurement,
    target: Number(g.target),
    targetDate: g.targetDate ?? null,
    weightage: Number(g.weightage),
  }))

  const supabase = createClient()
  if (!supabase) {
    return { goalSheet: null, error: 'Supabase client unavailable' }
  }

  try {
    const sheet =
      (await getEmployeeGoalSheet(params.employeeId, params.cycleId)) ??
      (await getOrCreateCurrentGoalSheet(
        params.employeeId,
        params.cycleId,
        params.managerId
      ))

    if (!sheet) {
      return { goalSheet: null, error: 'Could not create or load goal sheet.' }
    }

    if (!isGoalSheetEditableForEmployee(sheet)) {
      return {
        goalSheet: null,
        error: 'Goal sheet has already been submitted or approved.',
      }
    }

    const goalsError = await persistGoalSheetGoals(
      sheet.id,
      params.employeeId,
      goals,
      'pending'
    )
    if (goalsError) {
      return { goalSheet: null, error: goalsError }
    }

    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('goal_sheets')
      .update({
        manager_id: params.managerId ?? sheet.managerId,
        status: 'submitted',
        is_locked: false,
        total_weightage: 100,
        goals_count: goals.length,
        submitted_at: now,
        approved_at: null,
        approved_by: null,
        locked_at: null,
      })
      .eq('id', sheet.id)
      .select(GOAL_SHEET_SELECT)
      .single()

    if (error) {
      console.error('[submitGoalSheet] update error:', error.message)
      return { goalSheet: null, error: error.message }
    }

    const savedSheet = mapRow(data as DbGoalSheetRow)

    try {
      await createAuditLog({
        actorId: params.employeeId,
        actorRole: 'employee',
        employeeId: params.employeeId,
        goalSheetId: savedSheet.id,
        actionType: 'goal_submitted',
        fieldChanged: 'Goal Sheet Status',
        oldValue: sheet.status,
        newValue: 'submitted',
        description: sheet.unlockedAt
          ? 'Goal sheet resubmitted after admin unlock'
          : 'Employee submitted a goal sheet for approval',
      })

      if (savedSheet.managerId) {
        await createNotification({
          userId: savedSheet.managerId,
          type: 'goal_submitted',
          title: 'Goal Sheet Submitted',
          message: 'Employee submitted a goal sheet for approval',
          link: '/manager/approvals',
        })
      }
    } catch (err) {
      console.error('[submitGoalSheet] audit/notification error:', err)
    }

    return { goalSheet: savedSheet, error: null }
  } catch (err) {
    return {
      goalSheet: null,
      error: err instanceof Error ? err.message : 'Failed to submit goal sheet',
    }
  }
}
