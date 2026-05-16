/**
 * Fourth Supabase slice — goal row helpers and UOM mapping.
 */

import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import type { UnitOfMeasurement } from '@/lib/types'

export type GoalSheetGoalInput = {
  title: string
  description: string
  thrustArea: string
  unitOfMeasurement: UnitOfMeasurement
  target: number
  weightage: number
}

type DbUomType =
  | 'numeric_higher_better'
  | 'numeric_lower_better'
  | 'percentage'
  | 'timeline'
  | 'zero_based'

const UOM_TO_DB: Record<UnitOfMeasurement, DbUomType> = {
  'numeric-higher-better': 'numeric_higher_better',
  'numeric-lower-better': 'numeric_lower_better',
  percentage: 'percentage',
  timeline: 'timeline',
  'zero-based': 'zero_based',
}

const UOM_FROM_DB: Record<DbUomType, UnitOfMeasurement> = {
  numeric_higher_better: 'numeric-higher-better',
  numeric_lower_better: 'numeric-lower-better',
  percentage: 'percentage',
  timeline: 'timeline',
  zero_based: 'zero-based',
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
