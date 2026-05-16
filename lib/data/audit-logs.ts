/**
 * Eighth Supabase slice - audit logs.
 */

import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { isRealUuid } from '@/lib/data/goals'
import type { UserRole } from '@/lib/types'

export type AuditActionType =
  | 'goal_submitted'
  | 'goal_approved'
  | 'goal_returned'
  | 'checkin_submitted'
  | 'comment_added'
  | string

export type AuditLogInput = {
  actorId: string
  actorRole?: UserRole | null
  employeeId?: string | null
  goalId?: string | null
  goalSheetId?: string | null
  actionType: AuditActionType
  fieldChanged?: string | null
  oldValue?: string | null
  newValue?: string | null
  description?: string | null
}

export type AuditLogFilters = {
  employeeId?: string
  actorId?: string
  goalSheetId?: string
  actionType?: string
}

export type AuditLogRow = {
  id: string
  auditId: string
  actorId: string | null
  actorName: string
  actorRole: UserRole | null
  employeeId: string | null
  employeeName: string
  goalId: string | null
  goalTitle: string
  goalSheetId: string | null
  actionType: string
  fieldChanged: string | null
  oldValue: string | null
  newValue: string | null
  description: string | null
  createdAt: string
}

type DbProfileRef = { full_name: string } | { full_name: string }[] | null

type DbAuditLogRow = {
  id: string
  audit_id: string
  actor_id: string | null
  actor_role: UserRole | null
  employee_id: string | null
  goal_id: string | null
  goal_sheet_id: string | null
  action_type: string
  field_changed: string | null
  old_value: string | null
  new_value: string | null
  description: string | null
  created_at: string
  actor?: DbProfileRef
  employee?: DbProfileRef
  goals?: { title: string } | { title: string }[] | null
}

const AUDIT_SELECT = `
  id,
  audit_id,
  actor_id,
  actor_role,
  employee_id,
  goal_id,
  goal_sheet_id,
  action_type,
  field_changed,
  old_value,
  new_value,
  description,
  created_at,
  actor:profiles!audit_logs_actor_id_fkey ( full_name ),
  employee:profiles!audit_logs_employee_id_fkey ( full_name ),
  goals ( title )
`

function generateAuditId(): string {
  const date = new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, '')
  const random = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `AUD-${date}-${random}`
}

function relationName(relation: DbProfileRef, fallback: string): string {
  if (!relation) return fallback
  if (Array.isArray(relation)) {
    return relation[0]?.full_name ?? fallback
  }
  return relation.full_name
}

function goalTitleFromRow(
  relation: DbAuditLogRow['goals'],
  fallback: string
): string {
  if (!relation) return fallback
  if (Array.isArray(relation)) {
    return relation[0]?.title ?? fallback
  }
  return relation.title
}

function mapAuditRow(row: DbAuditLogRow): AuditLogRow {
  return {
    id: row.id,
    auditId: row.audit_id,
    actorId: row.actor_id,
    actorName: relationName(row.actor ?? null, 'System'),
    actorRole: row.actor_role,
    employeeId: row.employee_id,
    employeeName: relationName(row.employee ?? null, '-'),
    goalId: row.goal_id,
    goalTitle: goalTitleFromRow(row.goals, row.goal_sheet_id ? 'Goal Sheet' : '-'),
    goalSheetId: row.goal_sheet_id,
    actionType: row.action_type,
    fieldChanged: row.field_changed,
    oldValue: row.old_value,
    newValue: row.new_value,
    description: row.description,
    createdAt: row.created_at,
  }
}

export async function createAuditLog(
  input: AuditLogInput
): Promise<AuditLogRow | null> {
  if (!isSupabaseConfigured() || !isRealUuid(input.actorId)) {
    return null
  }

  const supabase = createClient()
  if (!supabase) {
    return null
  }

  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .insert({
        audit_id: generateAuditId(),
        actor_id: input.actorId,
        actor_role: input.actorRole ?? null,
        employee_id: input.employeeId ?? null,
        goal_id: input.goalId ?? null,
        goal_sheet_id: input.goalSheetId ?? null,
        action_type: input.actionType,
        field_changed: input.fieldChanged ?? null,
        old_value: input.oldValue ?? null,
        new_value: input.newValue ?? null,
        description: input.description ?? null,
      })
      .select(AUDIT_SELECT)
      .single()

    if (error) {
      console.error('[createAuditLog] error:', error.message)
      return null
    }

    return mapAuditRow(data as DbAuditLogRow)
  } catch (err) {
    console.error('[createAuditLog] unexpected error:', err)
    return null
  }
}

export async function getAuditLogs(
  filters?: AuditLogFilters
): Promise<AuditLogRow[]> {
  if (!isSupabaseConfigured()) {
    return []
  }

  const supabase = createClient()
  if (!supabase) {
    return []
  }

  try {
    let query = supabase
      .from('audit_logs')
      .select(AUDIT_SELECT)
      .order('created_at', { ascending: false })
      .limit(100)

    if (filters?.employeeId && isRealUuid(filters.employeeId)) {
      query = query.eq('employee_id', filters.employeeId)
    }
    if (filters?.actorId && isRealUuid(filters.actorId)) {
      query = query.eq('actor_id', filters.actorId)
    }
    if (filters?.goalSheetId && isRealUuid(filters.goalSheetId)) {
      query = query.eq('goal_sheet_id', filters.goalSheetId)
    }
    if (filters?.actionType && filters.actionType !== 'all') {
      query = query.eq('action_type', filters.actionType)
    }

    const { data, error } = await query

    if (error) {
      console.error('[getAuditLogs] error:', error.message)
      return []
    }

    return ((data ?? []) as DbAuditLogRow[]).map(mapAuditRow)
  } catch (err) {
    console.error('[getAuditLogs] unexpected error:', err)
    return []
  }
}
