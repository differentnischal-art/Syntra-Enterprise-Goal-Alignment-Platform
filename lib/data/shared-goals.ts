'use client'

import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { createAuditLog } from '@/lib/data/audit-logs'
import { createNotification } from '@/lib/data/notifications'
import {
  getThrustAreaIdByName,
  isRealUuid,
  mapUomFromDb,
  mapUomToDb,
} from '@/lib/data/goals'
import type { SharedGoal, UnitOfMeasurement, User } from '@/lib/types'

type DbRelation<T> = T | T[] | null | undefined

type DbDepartmentRef = {
  name: string
}

type DbProfileRef = {
  id: string
  full_name: string
  email?: string | null
  departments?: DbRelation<DbDepartmentRef>
}

type DbSharedGoalAssignment = {
  id: string
  employee_id: string
  goal_id: string | null
  weightage: number | null
  profiles?: DbRelation<DbProfileRef>
}

type DbSharedGoal = {
  id: string
  title: string
  description: string | null
  thrust_area_id: string | null
  uom_type: string
  target: number
  target_date: string | null
  synced_actual_achievement: number | null
  status: 'active' | 'locked' | 'archived'
  created_at: string
  created_by: string
  primary_owner_id: string
  thrust_areas?: DbRelation<{ name: string }>
  primary_owner?: DbRelation<DbProfileRef>
  shared_goal_assignments?: DbSharedGoalAssignment[] | null
}

export type SharedGoalEmployeeLink = {
  id: string
  name: string
  department: string
  goalId: string | null
  weightage: number | null
  assignmentId: string
}

export type SharedGoalRecord = Omit<SharedGoal, 'linkedEmployees'> & {
  targetDate: string | null
  linkedEmployees: SharedGoalEmployeeLink[]
}

export type CreateSharedGoalInput = {
  title: string
  description: string
  target: number
  unitOfMeasurement: UnitOfMeasurement
  thrustArea: string
  primaryOwnerId: string
  employeeIds: string[]
  cycleId: string
  createdBy: User
}

function first<T>(relation: DbRelation<T>): T | null {
  if (!relation) return null
  return Array.isArray(relation) ? relation[0] ?? null : relation
}

function departmentName(profile: DbProfileRef | null): string {
  return first(profile?.departments)?.name ?? '-'
}

function mapSharedGoalRow(row: DbSharedGoal): SharedGoalRecord {
  const owner = first(row.primary_owner)
  const linkedEmployees = (row.shared_goal_assignments ?? [])
    .map((assignment) => {
      const profile = first(assignment.profiles)
      if (!profile) return null
      return {
        id: profile.id,
        name: profile.full_name,
        department: departmentName(profile),
        goalId: assignment.goal_id,
        weightage: assignment.weightage == null ? null : Number(assignment.weightage),
        assignmentId: assignment.id,
      }
    })
    .filter((employee): employee is SharedGoalEmployeeLink => Boolean(employee))

  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    thrustArea: first(row.thrust_areas)?.name ?? '-',
    target: Number(row.target),
    targetDate: row.target_date,
    unitOfMeasurement: mapUomFromDb(row.uom_type) as UnitOfMeasurement,
    primaryOwnerId: row.primary_owner_id,
    primaryOwnerName: owner?.full_name ?? 'Unassigned',
    linkedEmployees,
    syncedAchievement:
      row.synced_actual_achievement == null
        ? null
        : Number(row.synced_actual_achievement),
    status: row.status === 'locked' ? 'locked' : 'active',
    createdAt: row.created_at,
    createdBy: row.created_by,
  }
}

const SHARED_GOAL_SELECT = `
  id,
  title,
  description,
  thrust_area_id,
  uom_type,
  target,
  target_date,
  synced_actual_achievement,
  status,
  created_at,
  created_by,
  primary_owner_id,
  thrust_areas ( name ),
  primary_owner:profiles!shared_goals_primary_owner_id_fkey (
    id,
    full_name,
    email,
    departments ( name )
  ),
  shared_goal_assignments (
    id,
    employee_id,
    goal_id,
    weightage,
    profiles!shared_goal_assignments_employee_id_fkey (
      id,
      full_name,
      email,
      departments ( name )
    )
  )
`

export async function getSharedGoalsForProfile(
  profile: User | null
): Promise<SharedGoalRecord[]> {
  if (!isSupabaseConfigured() || !profile || !isRealUuid(profile.id)) {
    return []
  }

  const supabase = createClient()
  if (!supabase) {
    return []
  }

  try {
    if (profile.role === 'employee') {
      const { data, error } = await supabase
        .from('shared_goals')
        .select(SHARED_GOAL_SELECT)
        .eq('shared_goal_assignments.employee_id', profile.id)
        .neq('status', 'archived')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[getSharedGoalsForProfile] employee error:', error.message)
        return []
      }

      return ((data ?? []) as DbSharedGoal[]).map(mapSharedGoalRow)
    }

    const { data, error } = await supabase
      .from('shared_goals')
      .select(SHARED_GOAL_SELECT)
      .neq('status', 'archived')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[getSharedGoalsForProfile] error:', error.message)
      return []
    }

    return ((data ?? []) as DbSharedGoal[]).map(mapSharedGoalRow)
  } catch (err) {
    console.error('[getSharedGoalsForProfile] unexpected error:', err)
    return []
  }
}

export async function getSharedGoalByIdForProfile(
  id: string,
  profile: User | null
): Promise<SharedGoalRecord | null> {
  if (!isSupabaseConfigured() || !profile || !isRealUuid(id) || !isRealUuid(profile.id)) {
    return null
  }

  const supabase = createClient()
  if (!supabase) {
    return null
  }

  try {
    const { data, error } = await supabase
      .from('shared_goals')
      .select(SHARED_GOAL_SELECT)
      .eq('id', id)
      .maybeSingle()

    if (error) {
      console.error('[getSharedGoalByIdForProfile] error:', error.message)
      return null
    }

    if (!data) {
      return null
    }

    const record = mapSharedGoalRow(data as DbSharedGoal)
    if (
      profile.role === 'employee' &&
      !record.linkedEmployees.some((employee) => employee.id === profile.id)
    ) {
      return null
    }

    return record
  } catch (err) {
    console.error('[getSharedGoalByIdForProfile] unexpected error:', err)
    return null
  }
}

export async function createSharedGoalWithAssignments(
  input: CreateSharedGoalInput
): Promise<{ success: boolean; error: string | null }> {
  if (
    !isSupabaseConfigured() ||
    !isRealUuid(input.createdBy.id) ||
    !isRealUuid(input.primaryOwnerId) ||
    !isRealUuid(input.cycleId) ||
    input.employeeIds.some((id) => !isRealUuid(id))
  ) {
    return { success: false, error: 'Invalid shared goal payload.' }
  }

  const supabase = createClient()
  if (!supabase) {
    return { success: false, error: 'Supabase client unavailable.' }
  }

  try {
    const thrustAreaId = await getThrustAreaIdByName(input.thrustArea)
    const { data: sharedGoal, error: goalError } = await supabase
      .from('shared_goals')
      .insert({
        cycle_id: input.cycleId,
        created_by: input.createdBy.id,
        primary_owner_id: input.primaryOwnerId,
        thrust_area_id: thrustAreaId,
        title: input.title.trim(),
        description: input.description.trim() || null,
        uom_type: mapUomToDb(input.unitOfMeasurement),
        target: input.unitOfMeasurement === 'timeline' ? 0 : input.target,
        target_date: null,
        status: 'active',
      })
      .select('id')
      .single()

    if (goalError || !sharedGoal) {
      return { success: false, error: goalError?.message ?? 'Could not create shared goal.' }
    }

    const sharedGoalId = (sharedGoal as { id: string }).id
    const assignments = input.employeeIds.map((employeeId) => ({
      shared_goal_id: sharedGoalId,
      employee_id: employeeId,
      weightage: null,
    }))

    const { error: assignmentError } = await supabase
      .from('shared_goal_assignments')
      .insert(assignments)

    if (assignmentError) {
      return { success: false, error: assignmentError.message }
    }

    await Promise.all(
      input.employeeIds.map((employeeId) =>
        createNotification({
          userId: employeeId,
          type: 'shared_goal_assigned',
          title: 'Shared KPI Assigned',
          message: input.title.trim(),
          link: `/employee/shared-goals/${sharedGoalId}`,
        })
      )
    )

    await createAuditLog({
      actorId: input.createdBy.id,
      actorRole: 'admin',
      goalId: null,
      actionType: 'shared_kpi_pushed',
      fieldChanged: 'Shared KPI',
      newValue: input.title.trim(),
      description: `Shared KPI pushed to ${input.employeeIds.length} employee(s).`,
    })

    return { success: true, error: null }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to create shared KPI.',
    }
  }
}
