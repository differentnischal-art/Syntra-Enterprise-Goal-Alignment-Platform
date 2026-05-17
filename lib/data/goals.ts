/**
 * Fourth / fifth Supabase slice — goal row helpers, UOM mapping, and UI types.
 */

import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import type {
  ApprovalStatus,
  Goal,
  GoalSheet,
  GoalSheetStatus,
  GoalStatus,
  UnitOfMeasurement,
} from '@/lib/types'
type DbGoalSheetStatus =
  | 'draft'
  | 'submitted'
  | 'pending_approval'
  | 'approved'
  | 'returned'
  | 'locked'
  | 'final_closed'

export type GoalSheetGoalInput = {
  title: string
  description: string
  thrustArea: string
  unitOfMeasurement: UnitOfMeasurement
  target: number
  targetDate?: string | null
  weightage: number
}

type DbUomType =
  | 'numeric_higher_better'
  | 'numeric_lower_better'
  | 'percentage'
  | 'percentage_higher_better'
  | 'percentage_lower_better'
  | 'timeline'
  | 'zero_based'

type DbGoalStatus = 'not_started' | 'on_track' | 'completed' | 'overdue'
type DbApprovalStatus = 'draft' | 'pending' | 'approved' | 'returned'

export type DbGoalRow = {
  id: string
  goal_sheet_id: string
  employee_id: string
  thrust_area_id: string | null
  title: string
  description: string | null
  uom_type: string
  target: number
  target_date: string | null
  weightage: number
  status: DbGoalStatus
  approval_status: DbApprovalStatus
  is_shared: boolean
  is_locked: boolean
  created_at: string
  updated_at: string
  thrust_areas: { name: string } | { name: string }[] | null
}

export type DbGoalSheetRowWithRelations = {
  id: string
  employee_id: string
  manager_id: string | null
  cycle_id: string
  status: DbGoalSheetStatus
  total_weightage: number
  goals_count: number
  submitted_at: string | null
  approved_at: string | null
  returned_at: string | null
  locked_at: string | null
  approved_by: string | null
  manager_comment: string | null
  created_at: string
  updated_at: string
  goal_cycles: { name: string } | { name: string }[] | null
  goals: DbGoalRow[] | null
}

export type GoalSheetMappingContext = {
  cycleName: string
  employeeName: string
  department: string
  managerName: string
}

const UOM_TO_DB: Record<UnitOfMeasurement, DbUomType> = {
  'numeric-higher-better': 'numeric_higher_better',
  'numeric-lower-better': 'numeric_lower_better',
  percentage: 'percentage',
  'percentage-higher-better': 'percentage_higher_better',
  'percentage-lower-better': 'percentage_lower_better',
  timeline: 'timeline',
  'zero-based': 'zero_based',
}

const UOM_FROM_DB: Record<DbUomType, UnitOfMeasurement> = {
  numeric_higher_better: 'numeric-higher-better',
  numeric_lower_better: 'numeric-lower-better',
  percentage: 'percentage-higher-better',
  percentage_higher_better: 'percentage-higher-better',
  percentage_lower_better: 'percentage-lower-better',
  timeline: 'timeline',
  zero_based: 'zero-based',
}

const GOAL_STATUS_FROM_DB: Record<DbGoalStatus, GoalStatus> = {
  not_started: 'not-started',
  on_track: 'on-track',
  completed: 'completed',
  overdue: 'overdue',
}

const APPROVAL_STATUS_FROM_DB: Record<DbApprovalStatus, ApprovalStatus> = {
  draft: 'draft',
  pending: 'pending',
  approved: 'approved',
  returned: 'returned',
}

const SHEET_STATUS_FROM_DB: Record<DbGoalSheetStatus, GoalSheetStatus> = {
  draft: 'draft',
  submitted: 'submitted',
  pending_approval: 'pending-approval',
  approved: 'approved',
  returned: 'returned',
  locked: 'locked',
  final_closed: 'final-closed',
}

export function isRealUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  )
}

function thrustAreaNameFromRow(
  thrustAreas: DbGoalRow['thrust_areas']
): string {
  if (!thrustAreas) return '—'
  if (Array.isArray(thrustAreas)) {
    return thrustAreas[0]?.name ?? '—'
  }
  return thrustAreas.name
}

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

export function mapUomToDb(value: UnitOfMeasurement): DbUomType {
  return UOM_TO_DB[value]
}

export function mapUomFromDb(value: string): UnitOfMeasurement {
  if (value in UOM_FROM_DB) {
    return UOM_FROM_DB[value as DbUomType]
  }
  return 'numeric-higher-better'
}

export function mapGoalStatusFromDb(value: string): GoalStatus {
  if (value in GOAL_STATUS_FROM_DB) {
    return GOAL_STATUS_FROM_DB[value as DbGoalStatus]
  }
  return 'not-started'
}

export function mapApprovalStatusFromDb(value: string): ApprovalStatus {
  if (value in APPROVAL_STATUS_FROM_DB) {
    return APPROVAL_STATUS_FROM_DB[value as DbApprovalStatus]
  }
  return 'draft'
}

export function mapSheetStatusFromDb(value: string): GoalSheetStatus {
  if (value in SHEET_STATUS_FROM_DB) {
    return SHEET_STATUS_FROM_DB[value as DbGoalSheetStatus]
  }
  return 'draft'
}

export function mapGoalRowToGoal(
  row: DbGoalRow,
  options?: { employeeName?: string }
): Goal {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    thrustArea: thrustAreaNameFromRow(row.thrust_areas),
    unitOfMeasurement: mapUomFromDb(row.uom_type),
    target: Number(row.target),
    targetDate: row.target_date,
    weightage: Number(row.weightage),
    status: mapGoalStatusFromDb(row.status),
    approvalStatus: mapApprovalStatusFromDb(row.approval_status),
    isShared: row.is_shared,
    isLocked: row.is_locked,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    employeeId: row.employee_id,
    employeeName: options?.employeeName,
    progress: 0,
  }
}

export function mapGoalSheetRowToGoalSheet(
  row: DbGoalSheetRowWithRelations,
  context: GoalSheetMappingContext
): GoalSheet {
  return {
    id: row.id,
    employeeId: row.employee_id,
    employeeName: context.employeeName,
    department: context.department,
    managerId: row.manager_id ?? '',
    managerName: context.managerName,
    cycleId: row.cycle_id,
    cycleName: context.cycleName,
    status: mapSheetStatusFromDb(row.status),
    totalWeightage: Number(row.total_weightage),
    goalsCount: row.goals_count,
    submittedAt: row.submitted_at,
    approvedAt: row.approved_at,
    approvedBy: row.approved_by,
    managerComments: row.manager_comment,
    lastUpdated: row.updated_at,
  }
}

export async function getThrustAreaIdByName(name: string): Promise<string | null> {
  if (!isSupabaseConfigured() || !name.trim()) {
    return null
  }

  const supabase = createClient()
  if (!supabase) {
    return null
  }

  const { data, error } = await supabase
    .from('thrust_areas')
    .select('id')
    .eq('name', name)
    .maybeSingle()

  if (error) {
    console.error('[getThrustAreaIdByName] error:', error.message)
    return null
  }

  return data?.id ?? null
}

export async function deleteGoalsForSheet(goalSheetId: string): Promise<string | null> {
  if (!isSupabaseConfigured()) {
    return 'Supabase is not configured'
  }

  const supabase = createClient()
  if (!supabase) {
    return 'Supabase client unavailable'
  }

  const { error } = await supabase.from('goals').delete().eq('goal_sheet_id', goalSheetId)

  if (error) {
    console.error('[deleteGoalsForSheet] error:', error.message)
    return error.message
  }

  return null
}

export async function insertGoalsForSheet(
  goalSheetId: string,
  employeeId: string,
  goals: GoalSheetGoalInput[],
  options?: { approvalStatus?: 'draft' | 'pending' }
): Promise<string | null> {
  if (!isSupabaseConfigured()) {
    return 'Supabase is not configured'
  }

  const supabase = createClient()
  if (!supabase) {
    return 'Supabase client unavailable'
  }

  const approvalStatus = options?.approvalStatus ?? 'draft'

  const rows = []
  for (const goal of goals) {
    const thrustAreaId = await getThrustAreaIdByName(goal.thrustArea)
    rows.push({
      goal_sheet_id: goalSheetId,
      employee_id: employeeId,
      thrust_area_id: thrustAreaId,
      title: goal.title.trim(),
      description: goal.description.trim() || null,
      uom_type: mapUomToDb(goal.unitOfMeasurement),
      target: goal.target,
      target_date: goal.targetDate ?? null,
      weightage: goal.weightage,
      status: 'not_started',
      approval_status: approvalStatus,
      is_shared: false,
      is_locked: false,
    })
  }

  if (rows.length === 0) {
    return null
  }

  const { error } = await supabase.from('goals').insert(rows)

  if (error) {
    console.error('[insertGoalsForSheet] error:', error.message)
    return error.message
  }

  return null
}
