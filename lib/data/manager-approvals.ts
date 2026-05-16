/**
 * Sixth Supabase slice — manager goal sheet approval workflow.
 */

import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { createAuditLog } from '@/lib/data/audit-logs'
import { createNotification } from '@/lib/data/notifications'
import {
  isRealUuid,
  mapGoalRowToGoal,
  mapGoalSheetRowToGoalSheet,
  type DbGoalRow,
  type DbGoalSheetRowWithRelations,
} from '@/lib/data/goals'
import type { Goal, GoalSheet, GoalSheetStatus } from '@/lib/types'

type DbProfileEmbed = {
  id: string
  full_name: string
  email: string
  departments: { name: string } | { name: string }[] | null
}

type DbReviewRow = {
  id: string
  goal_sheet_id: string
  reviewer_id: string
  action: 'approved' | 'returned'
  comment: string | null
  created_at: string
  profiles?: { full_name: string } | { full_name: string }[] | null
}

type DbGoalSheetWithEmployee = DbGoalSheetRowWithRelations & {
  profiles: DbProfileEmbed | DbProfileEmbed[] | null
}

type DbGoalSheetActionContext = {
  employee_id: string
  status: string
}

export type ApprovalReviewEntry = {
  id: string
  action: 'approved' | 'returned'
  comment: string | null
  reviewerId: string
  reviewerName: string
  createdAt: string
}

export type ManagerPendingApproval = {
  goalSheetId: string
  employeeId: string
  name: string
  email: string
  department: string
  goalsCount: number
  totalWeightage: number
  submittedAt: string | null
  status: GoalSheetStatus
  goals: Goal[]
  goalSheet: GoalSheet
  cycleName: string
}

export type ManagerGoalSheetReview = ManagerPendingApproval & {
  reviews: ApprovalReviewEntry[]
}

export type ManagerApprovalResult = {
  success: boolean
  error: string | null
  demoMode?: boolean
}

const PENDING_GOAL_SHEET_SELECT = `
  id,
  employee_id,
  manager_id,
  cycle_id,
  status,
  total_weightage,
  goals_count,
  submitted_at,
  approved_at,
  returned_at,
  locked_at,
  approved_by,
  manager_comment,
  created_at,
  updated_at,
  goal_cycles ( name ),
  profiles!goal_sheets_employee_id_fkey (
    id,
    full_name,
    email,
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

const REVIEW_GOAL_SHEET_SELECT = `
  ${PENDING_GOAL_SHEET_SELECT},
  goal_sheet_reviews (
    id,
    goal_sheet_id,
    reviewer_id,
    action,
    comment,
    created_at,
    profiles!goal_sheet_reviews_reviewer_id_fkey ( full_name )
  )
`

function relationName(
  relation: { name: string } | { name: string }[] | null | undefined,
  fallback: string
): string {
  if (!relation) return fallback
  if (Array.isArray(relation)) {
    return relation[0]?.name ?? fallback
  }
  return relation.name
}

function profileFromRow(
  profiles: DbGoalSheetWithEmployee['profiles']
): DbProfileEmbed | null {
  if (!profiles) return null
  if (Array.isArray(profiles)) {
    return profiles[0] ?? null
  }
  return profiles
}

function departmentFromProfile(profile: DbProfileEmbed | null): string {
  if (!profile?.departments) return '—'
  if (Array.isArray(profile.departments)) {
    return profile.departments[0]?.name ?? '—'
  }
  return profile.departments.name
}

function reviewerNameFromRow(
  profiles: DbReviewRow['profiles']
): string {
  if (!profiles) return 'Manager'
  if (Array.isArray(profiles)) {
    return profiles[0]?.full_name ?? 'Manager'
  }
  return profiles.full_name
}

export function mapManagerReviewData(
  row: DbGoalSheetWithEmployee,
  options?: { managerName?: string }
): ManagerPendingApproval {
  const profile = profileFromRow(row.profiles)
  const employeeName = profile?.full_name ?? 'Employee'
  const cycleName = relationName(row.goal_cycles, 'FY Goal Cycle')
  const managerName = options?.managerName ?? 'Manager'
  const department = departmentFromProfile(profile)

  const goalSheet = mapGoalSheetRowToGoalSheet(row, {
    cycleName,
    employeeName,
    department,
    managerName,
  })

  const goals = (row.goals ?? []).map((goalRow: DbGoalRow) =>
    mapGoalRowToGoal(goalRow, { employeeName })
  )

  return {
    goalSheetId: row.id,
    employeeId: row.employee_id,
    name: employeeName,
    email: profile?.email ?? '',
    department,
    goalsCount: row.goals_count,
    totalWeightage: Number(row.total_weightage),
    submittedAt: row.submitted_at,
    status: goalSheet.status,
    goals,
    goalSheet,
    cycleName,
  }
}

function mapReviewRow(row: DbReviewRow): ApprovalReviewEntry {
  return {
    id: row.id,
    action: row.action,
    comment: row.comment,
    reviewerId: row.reviewer_id,
    reviewerName: reviewerNameFromRow(row.profiles),
    createdAt: row.created_at,
  }
}

export async function getManagerPendingGoalSheets(
  managerId: string
): Promise<ManagerPendingApproval[] | null> {
  if (!isSupabaseConfigured() || !isRealUuid(managerId)) {
    return null
  }

  const supabase = createClient()
  if (!supabase) {
    return null
  }

  try {
    const { data, error } = await supabase
      .from('goal_sheets')
      .select(PENDING_GOAL_SHEET_SELECT)
      .eq('manager_id', managerId)
      .eq('status', 'pending_approval')
      .order('submitted_at', { ascending: true })

    if (error) {
      console.error('[getManagerPendingGoalSheets] error:', error.message)
      return null
    }

    const rows = (data ?? []) as DbGoalSheetWithEmployee[]
    return rows.map((row) => mapManagerReviewData(row))
  } catch (err) {
    console.error('[getManagerPendingGoalSheets] unexpected error:', err)
    return null
  }
}

export async function getManagerGoalSheetForReview(
  goalSheetId: string,
  options?: { managerName?: string }
): Promise<ManagerGoalSheetReview | null> {
  if (!isSupabaseConfigured() || !isRealUuid(goalSheetId)) {
    return null
  }

  const supabase = createClient()
  if (!supabase) {
    return null
  }

  try {
    const { data, error } = await supabase
      .from('goal_sheets')
      .select(REVIEW_GOAL_SHEET_SELECT)
      .eq('id', goalSheetId)
      .maybeSingle()

    if (error) {
      console.error('[getManagerGoalSheetForReview] error:', error.message)
      return null
    }

    if (!data) {
      return null
    }

    const row = data as DbGoalSheetWithEmployee & {
      goal_sheet_reviews: DbReviewRow[] | null
    }
    const pending = mapManagerReviewData(row, options)
    const reviews = (row.goal_sheet_reviews ?? [])
      .map(mapReviewRow)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )

    return { ...pending, reviews }
  } catch (err) {
    console.error('[getManagerGoalSheetForReview] unexpected error:', err)
    return null
  }
}

export async function approveGoalSheet(
  goalSheetId: string,
  managerId: string,
  comment?: string
): Promise<ManagerApprovalResult> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: null, demoMode: true }
  }

  if (!isRealUuid(goalSheetId) || !isRealUuid(managerId)) {
    return { success: false, error: 'Invalid goal sheet or manager id' }
  }

  const supabase = createClient()
  if (!supabase) {
    return { success: false, error: 'Supabase client unavailable' }
  }

  const now = new Date().toISOString()

  try {
    const { data: sheetContext } = await supabase
      .from('goal_sheets')
      .select('employee_id, status')
      .eq('id', goalSheetId)
      .eq('manager_id', managerId)
      .maybeSingle()

    const { error: sheetError } = await supabase
      .from('goal_sheets')
      .update({
        status: 'locked',
        approved_at: now,
        locked_at: now,
        approved_by: managerId,
        manager_comment: comment?.trim() || null,
      })
      .eq('id', goalSheetId)
      .eq('manager_id', managerId)

    if (sheetError) {
      console.error('[approveGoalSheet] sheet error:', sheetError.message)
      return { success: false, error: sheetError.message }
    }

    const { error: goalsError } = await supabase
      .from('goals')
      .update({
        approval_status: 'approved',
        is_locked: true,
      })
      .eq('goal_sheet_id', goalSheetId)

    if (goalsError) {
      console.error('[approveGoalSheet] goals error:', goalsError.message)
      return { success: false, error: goalsError.message }
    }

    const { error: reviewError } = await supabase.from('goal_sheet_reviews').insert({
      goal_sheet_id: goalSheetId,
      reviewer_id: managerId,
      action: 'approved',
      comment: comment?.trim() || null,
    })

    if (reviewError) {
      console.error('[approveGoalSheet] review error:', reviewError.message)
      return { success: false, error: reviewError.message }
    }

    try {
      const context = sheetContext as DbGoalSheetActionContext | null
      if (context?.employee_id) {
        await createAuditLog({
          actorId: managerId,
          actorRole: 'manager',
          employeeId: context.employee_id,
          goalSheetId,
          actionType: 'goal_approved',
          fieldChanged: 'Goal Sheet Status',
          oldValue: context.status,
          newValue: 'locked',
          description: 'Manager approved and locked the goal sheet',
        })

        await createNotification({
          userId: context.employee_id,
          type: 'goal_approved',
          title: 'Goal Sheet Approved',
          message: 'Your goal sheet has been approved and locked',
          link: '/employee/my-goal-sheet',
        })
      }
    } catch (err) {
      console.error('[approveGoalSheet] audit/notification error:', err)
    }

    return { success: true, error: null }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to approve goal sheet',
    }
  }
}

export async function returnGoalSheetForRework(
  goalSheetId: string,
  managerId: string,
  comment: string
): Promise<ManagerApprovalResult> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: null, demoMode: true }
  }

  const trimmed = comment.trim()
  if (!trimmed) {
    return { success: false, error: 'Manager comment is required when returning a goal sheet.' }
  }

  if (!isRealUuid(goalSheetId) || !isRealUuid(managerId)) {
    return { success: false, error: 'Invalid goal sheet or manager id' }
  }

  const supabase = createClient()
  if (!supabase) {
    return { success: false, error: 'Supabase client unavailable' }
  }

  const now = new Date().toISOString()

  try {
    const { data: sheetContext } = await supabase
      .from('goal_sheets')
      .select('employee_id, status')
      .eq('id', goalSheetId)
      .eq('manager_id', managerId)
      .maybeSingle()

    const { error: sheetError } = await supabase
      .from('goal_sheets')
      .update({
        status: 'returned',
        returned_at: now,
        manager_comment: trimmed,
      })
      .eq('id', goalSheetId)
      .eq('manager_id', managerId)

    if (sheetError) {
      console.error('[returnGoalSheetForRework] sheet error:', sheetError.message)
      return { success: false, error: sheetError.message }
    }

    const { error: goalsError } = await supabase
      .from('goals')
      .update({
        approval_status: 'returned',
        is_locked: false,
      })
      .eq('goal_sheet_id', goalSheetId)

    if (goalsError) {
      console.error('[returnGoalSheetForRework] goals error:', goalsError.message)
      return { success: false, error: goalsError.message }
    }

    const { error: reviewError } = await supabase.from('goal_sheet_reviews').insert({
      goal_sheet_id: goalSheetId,
      reviewer_id: managerId,
      action: 'returned',
      comment: trimmed,
    })

    if (reviewError) {
      console.error('[returnGoalSheetForRework] review error:', reviewError.message)
      return { success: false, error: reviewError.message }
    }

    try {
      const context = sheetContext as DbGoalSheetActionContext | null
      if (context?.employee_id) {
        await createAuditLog({
          actorId: managerId,
          actorRole: 'manager',
          employeeId: context.employee_id,
          goalSheetId,
          actionType: 'goal_returned',
          fieldChanged: 'Goal Sheet Status',
          oldValue: context.status,
          newValue: 'returned',
          description: 'Manager returned the goal sheet for rework',
        })

        await createNotification({
          userId: context.employee_id,
          type: 'goal_returned',
          title: 'Goal Sheet Returned',
          message: 'Your manager returned your goal sheet for rework',
          link: '/employee/my-goal-sheet',
        })
      }
    } catch (err) {
      console.error('[returnGoalSheetForRework] audit/notification error:', err)
    }

    return { success: true, error: null }
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : 'Failed to return goal sheet for rework',
    }
  }
}
