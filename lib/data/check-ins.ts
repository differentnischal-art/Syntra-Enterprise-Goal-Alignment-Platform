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

const CHECK_IN_EVIDENCE_BUCKET = 'check-in-evidence'
const MAX_EVIDENCE_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_EVIDENCE_EXTENSIONS = new Set(['csv', 'xlsx'])
const ALLOWED_EVIDENCE_MIME_TYPES = new Set([
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/octet-stream',
  '',
])

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

export type CheckInEvidenceAttachment = {
  id: string
  checkInId: string | null
  goalSheetId: string
  employeeId: string
  cycleId: string
  quarter: CheckInQuarter
  fileName: string
  fileType: string
  fileSize: number
  storagePath: string
  uploadedBy: string
  uploadedAt: string
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
  cycleId: string
  quarter: CheckInQuarter
  rows: EmployeeQuarterlyCheckInRow[]
  evidenceAttachments: CheckInEvidenceAttachment[]
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
  cycleId: string
  quarter: CheckInQuarter
  entries: EmployeeCheckInSubmitEntry[]
  evidenceFile: File
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
  evidenceAttachments: CheckInEvidenceAttachment[]
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

type DbCheckInAttachmentRow = {
  id: string
  check_in_id: string | null
  goal_sheet_id: string
  employee_id: string
  cycle_id: string
  quarter: CheckInQuarter
  file_name: string
  file_type: string
  file_size: number
  storage_path: string
  uploaded_by: string
  uploaded_at: string
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
  targetDate?: string | null
  actualCompletionDate?: string | null
}): number | null {
  const {
    uomType,
    plannedTarget,
    actualAchievement,
    targetDate,
    actualCompletionDate,
  } = params

  if (uomType === 'timeline') {
    if (!targetDate || !actualCompletionDate) {
      return null
    }
    return actualCompletionDate <= targetDate ? 100 : 0
  }

  if (actualAchievement === null || Number.isNaN(actualAchievement)) {
    return null
  }

  if (uomType === 'zero-based') {
    return actualAchievement === 0 ? 100 : 0
  }

  if (plannedTarget === 0) {
    return actualAchievement === 0 ? 100 : null
  }

  if (
    uomType === 'numeric-lower-better' ||
    uomType === 'percentage-lower-better'
  ) {
    if (actualAchievement === 0) {
      return 100
    }
    return Math.max(0, Math.min(100, Math.round((plannedTarget / actualAchievement) * 100)))
  }

  return Math.max(0, Math.min(100, Math.round((actualAchievement / plannedTarget) * 100)))
}

function getEvidenceExtension(fileName: string) {
  return fileName.split('.').pop()?.toLowerCase() ?? ''
}

function sanitizeEvidenceFileName(fileName: string) {
  const trimmed = fileName.trim()
  const extension = getEvidenceExtension(trimmed)
  const baseName = trimmed.slice(0, Math.max(0, trimmed.length - extension.length - 1))
  const safeBase = baseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${safeBase || 'achievement-evidence'}.${extension}`
}

function mapAttachmentRow(row: DbCheckInAttachmentRow): CheckInEvidenceAttachment {
  return {
    id: row.id,
    checkInId: row.check_in_id,
    goalSheetId: row.goal_sheet_id,
    employeeId: row.employee_id,
    cycleId: row.cycle_id,
    quarter: row.quarter,
    fileName: row.file_name,
    fileType: row.file_type,
    fileSize: Number(row.file_size),
    storagePath: row.storage_path,
    uploadedBy: row.uploaded_by,
    uploadedAt: row.uploaded_at,
  }
}

function storageObjectPath(storagePath: string) {
  return storagePath.startsWith(`${CHECK_IN_EVIDENCE_BUCKET}/`)
    ? storagePath.slice(CHECK_IN_EVIDENCE_BUCKET.length + 1)
    : storagePath
}

export function validateCheckInEvidenceFile(file: File | null): string | null {
  if (!file) {
    return 'Please attach a CSV or XLSX evidence file before submitting.'
  }

  const extension = getEvidenceExtension(file.name)
  if (!ALLOWED_EVIDENCE_EXTENSIONS.has(extension)) {
    return 'Evidence file must be a CSV or XLSX file.'
  }

  if (!ALLOWED_EVIDENCE_MIME_TYPES.has(file.type)) {
    return 'Evidence file must be a CSV or XLSX file.'
  }

  if (file.size > MAX_EVIDENCE_FILE_SIZE) {
    return 'Evidence file must be 10 MB or smaller.'
  }

  return null
}

async function uploadCheckInEvidenceFile(params: {
  employeeId: string
  cycleId: string
  quarter: CheckInQuarter
  file: File
}): Promise<{ storagePath: string; error: string | null }> {
  const supabase = createClient()
  if (!supabase) {
    return { storagePath: '', error: 'Supabase client unavailable' }
  }

  const validationError = validateCheckInEvidenceFile(params.file)
  if (validationError) {
    return { storagePath: '', error: validationError }
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const fileName = sanitizeEvidenceFileName(params.file.name)
  const objectPath = `${params.employeeId}/${params.cycleId}/${params.quarter}/${timestamp}-${fileName}`

  const { error } = await supabase.storage
    .from(CHECK_IN_EVIDENCE_BUCKET)
    .upload(objectPath, params.file, {
      contentType: params.file.type || undefined,
      upsert: false,
    })

  if (error) {
    console.error('[uploadCheckInEvidenceFile] error:', error.message)
    return { storagePath: '', error: error.message }
  }

  return {
    storagePath: `${CHECK_IN_EVIDENCE_BUCKET}/${objectPath}`,
    error: null,
  }
}

async function removeUploadedEvidence(storagePath: string) {
  const supabase = createClient()
  if (!supabase || !storagePath) {
    return
  }

  const { error } = await supabase.storage
    .from(CHECK_IN_EVIDENCE_BUCKET)
    .remove([storageObjectPath(storagePath)])

  if (error) {
    console.error('[removeUploadedEvidence] error:', error.message)
  }
}

async function fetchCheckInEvidenceAttachments(params: {
  employeeId?: string
  goalSheetIds?: string[]
  goalSheetId?: string
  cycleId?: string
  quarter: CheckInQuarter
}): Promise<CheckInEvidenceAttachment[]> {
  const supabase = createClient()
  if (!supabase) {
    return []
  }

  let query = supabase
    .from('check_in_attachments')
    .select(
      `
      id,
      check_in_id,
      goal_sheet_id,
      employee_id,
      cycle_id,
      quarter,
      file_name,
      file_type,
      file_size,
      storage_path,
      uploaded_by,
      uploaded_at
    `
    )
    .eq('quarter', params.quarter)
    .order('uploaded_at', { ascending: false })

  if (params.employeeId) {
    query = query.eq('employee_id', params.employeeId)
  }
  if (params.goalSheetId) {
    query = query.eq('goal_sheet_id', params.goalSheetId)
  }
  if (params.cycleId) {
    query = query.eq('cycle_id', params.cycleId)
  }
  if (params.goalSheetIds && params.goalSheetIds.length > 0) {
    query = query.in('goal_sheet_id', params.goalSheetIds)
  }

  const { data, error } = await query

  if (error) {
    console.error('[fetchCheckInEvidenceAttachments] error:', error.message)
    return []
  }

  return ((data ?? []) as DbCheckInAttachmentRow[]).map(mapAttachmentRow)
}

async function insertCheckInEvidenceAttachment(params: {
  checkInId: string | null
  goalSheetId: string
  employeeId: string
  cycleId: string
  quarter: CheckInQuarter
  file: File
  storagePath: string
  uploadedBy: string
}): Promise<{ attachment: CheckInEvidenceAttachment | null; error: string | null }> {
  const supabase = createClient()
  if (!supabase) {
    return { attachment: null, error: 'Supabase client unavailable' }
  }

  const { data, error } = await supabase
    .from('check_in_attachments')
    .insert({
      check_in_id: params.checkInId,
      goal_sheet_id: params.goalSheetId,
      employee_id: params.employeeId,
      cycle_id: params.cycleId,
      quarter: params.quarter,
      file_name: params.file.name,
      file_type: params.file.type || getEvidenceExtension(params.file.name),
      file_size: params.file.size,
      storage_path: params.storagePath,
      uploaded_by: params.uploadedBy,
    })
    .select(
      `
      id,
      check_in_id,
      goal_sheet_id,
      employee_id,
      cycle_id,
      quarter,
      file_name,
      file_type,
      file_size,
      storage_path,
      uploaded_by,
      uploaded_at
    `
    )
    .single()

  if (error) {
    console.error('[insertCheckInEvidenceAttachment] error:', error.message)
    return { attachment: null, error: error.message }
  }

  return {
    attachment: mapAttachmentRow(data as DbCheckInAttachmentRow),
    error: null,
  }
}

export async function createCheckInEvidenceSignedUrl(
  storagePath: string
): Promise<{ url: string | null; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { url: null, error: null }
  }

  const supabase = createClient()
  if (!supabase) {
    return { url: null, error: 'Supabase client unavailable' }
  }

  const { data, error } = await supabase.storage
    .from(CHECK_IN_EVIDENCE_BUCKET)
    .createSignedUrl(storageObjectPath(storagePath), 60)

  if (error) {
    console.error('[createCheckInEvidenceSignedUrl] error:', error.message)
    return { url: null, error: error.message }
  }

  return { url: data.signedUrl, error: null }
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
            targetDate: goal.targetDate,
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
    const evidenceAttachments = await fetchCheckInEvidenceAttachments({
      employeeId,
      goalSheetId: sheet.id,
      cycleId,
      quarter,
    })

    return {
      goalSheetId: sheet.id,
      cycleId: sheet.cycle_id,
      quarter,
      evidenceAttachments,
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
    !isRealUuid(params.cycleId) ||
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

  let uploadedStoragePath = ''

  try {
    const uploadResult = await uploadCheckInEvidenceFile({
      employeeId: params.employeeId,
      cycleId: params.cycleId,
      quarter: params.quarter,
      file: params.evidenceFile,
    })

    if (uploadResult.error) {
      return { rows: null, error: uploadResult.error }
    }
    uploadedStoragePath = uploadResult.storagePath

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
      await removeUploadedEvidence(uploadResult.storagePath)
      return { rows: null, error: error.message }
    }

    const savedRows = (data ?? []) as DbQuarterlyCheckInRow[]
    const attachmentResult = await insertCheckInEvidenceAttachment({
      checkInId: savedRows[0]?.id ?? null,
      goalSheetId: params.goalSheetId,
      employeeId: params.employeeId,
      cycleId: params.cycleId,
      quarter: params.quarter,
      file: params.evidenceFile,
      storagePath: uploadResult.storagePath,
      uploadedBy: params.employeeId,
    })

    if (attachmentResult.error) {
      await removeUploadedEvidence(uploadResult.storagePath)
      return { rows: null, error: attachmentResult.error }
    }

    try {
      await createAuditLog({
        actorId: params.employeeId,
        actorRole: 'employee',
        employeeId: params.employeeId,
        goalSheetId: params.goalSheetId,
        actionType: 'checkin_submitted',
        fieldChanged: `${params.quarter.toUpperCase()} Check-in`,
        newValue: params.evidenceFile.name,
        description: `Employee submitted ${params.quarter.toUpperCase()} check-in with evidence file`,
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
          message: 'Employee submitted quarterly check-in updates with evidence',
          link: '/manager/check-ins',
        })
      }
    } catch (err) {
      console.error('[submitEmployeeQuarterlyCheckIns] audit/notification error:', err)
    }

    return { rows: savedRows, error: null }
  } catch (err) {
    await removeUploadedEvidence(uploadedStoragePath)
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
    const evidenceAttachments = await fetchCheckInEvidenceAttachments({
      goalSheetIds: sheets.map((sheet) => sheet.id),
      quarter,
    })
    const evidenceBySheet = new Map<string, CheckInEvidenceAttachment[]>()
    evidenceAttachments.forEach((attachment) => {
      const existing = evidenceBySheet.get(attachment.goalSheetId) ?? []
      existing.push(attachment)
      evidenceBySheet.set(attachment.goalSheetId, existing)
    })

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
          evidenceAttachments: evidenceBySheet.get(sheet.id) ?? [],
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
