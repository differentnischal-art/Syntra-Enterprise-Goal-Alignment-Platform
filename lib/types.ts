export type UserRole = 'employee' | 'manager' | 'admin'

export type GoalStatus = 'not-started' | 'on-track' | 'completed' | 'overdue'

export type ApprovalStatus = 'draft' | 'pending' | 'approved' | 'returned'

export type UnitOfMeasurement = 
  | 'numeric-higher-better' 
  | 'numeric-lower-better' 
  | 'percentage'
  | 'percentage-higher-better'
  | 'percentage-lower-better'
  | 'timeline' 
  | 'zero-based'

export type GoalSheetStatus = 
  | 'draft'
  | 'submitted'
  | 'pending-approval'
  | 'approved'
  | 'returned'
  | 'rejected'
  | 'rework-required'
  | 'locked'
  | 'q1-updated'
  | 'q2-updated'
  | 'q3-updated'
  | 'final-closed'

export type EscalationType = 
  | 'goal-not-submitted'
  | 'approval-overdue'
  | 'checkin-pending'
  | 'weightage-mismatch'

export type EscalationSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface GoalCycle {
  id: string
  name: string
  year: number
  startDate: string
  endDate: string
  status: 'active' | 'closed' | 'upcoming'
  windows: {
    goalCreation: { start: string; end: string }
    q1CheckIn: { start: string; end: string }
    q2CheckIn: { start: string; end: string }
    q3CheckIn: { start: string; end: string }
    q4CheckIn: { start: string; end: string }
  }
}

export interface GoalSheet {
  id: string
  employeeId: string
  employeeName: string
  department: string
  managerId: string
  managerName: string
  cycleId: string
  cycleName: string
  status: GoalSheetStatus
  totalWeightage: number
  goalsCount: number
  submittedAt: string | null
  approvedAt: string | null
  approvedBy: string | null
  managerComments: string | null
  lastUpdated: string
}

export interface Escalation {
  id: string
  type: EscalationType
  employeeId: string
  employeeName: string
  managerId: string
  managerName: string
  department: string
  severity: EscalationSeverity
  message: string
  daysOverdue: number
  escalationLevel: 'employee' | 'manager' | 'skip-level' | 'hr'
  dueDate: string
  createdAt: string
}

export interface ActivityLog {
  id: string
  type: 'goal-created' | 'goal-updated' | 'goal-submitted' | 'goal-approved' | 'goal-returned' | 'checkin-submitted' | 'shared-goal-pushed' | 'comment-added'
  actorId: string
  actorName: string
  actorRole: UserRole
  targetId: string
  targetName: string
  description: string
  timestamp: string
}

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  department: string
  avatar?: string
  managerId?: string
  managerName?: string
}

export interface Goal {
  id: string
  title: string
  description: string
  thrustArea: string
  unitOfMeasurement: UnitOfMeasurement
  target: number
  targetDate?: string | null
  weightage: number
  status: GoalStatus
  approvalStatus: ApprovalStatus
  isShared?: boolean
  isLocked?: boolean
  createdAt: string
  updatedAt: string
  employeeId: string
  employeeName?: string
  progress?: number
  actualAchievement?: number
}

export interface CheckIn {
  id: string
  goalId: string
  goalTitle: string
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4'
  plannedTarget: number
  actualAchievement: number | null
  unitOfMeasurement: UnitOfMeasurement
  status: GoalStatus
  score: number | null
  managerComment?: string
  submittedAt: string | null
}

export interface TeamMember {
  id: string
  name: string
  email: string
  department: string
  goalsCount: number
  totalWeightage: number
  sheetStatus: GoalSheetStatus
  approvalStatus: ApprovalStatus
  averageAchievement: number
  checkIns: {
    Q1: boolean
    Q2: boolean
    Q3: boolean
    Q4: boolean
  }
}

export interface AuditLog {
  id: string
  auditId: string
  employeeId: string
  employeeName: string
  goalId: string
  goalTitle: string
  fieldChanged: string
  oldValue: string
  newValue: string
  changedBy: string
  changedByRole: UserRole
  actionType: 'create' | 'update' | 'delete' | 'approve' | 'return' | 'submit'
  timestamp: string
}

export interface DepartmentCompletion {
  department: string
  totalEmployees: number
  sheetsLocked: number
  Q1: number
  Q2: number
  Q3: number
  Q4: number
}

export interface SharedGoal {
  id: string
  title: string
  description: string
  thrustArea: string
  target: number
  unitOfMeasurement: UnitOfMeasurement
  primaryOwnerId: string
  primaryOwnerName: string
  linkedEmployees: { id: string; name: string; department: string }[]
  syncedAchievement: number | null
  status: 'active' | 'locked'
  createdAt: string
  createdBy: string
}

export interface Report {
  employeeId: string
  employeeName: string
  department: string
  managerName: string
  goalTitle: string
  thrustArea: string
  plannedTarget: number
  actualAchievement: number | null
  weightage: number
  score: number | null
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4'
  status: GoalStatus
}
