export type UserRole = 'employee' | 'manager' | 'admin'

export type GoalStatus = 'not-started' | 'on-track' | 'completed'

export type ApprovalStatus = 'pending' | 'approved' | 'returned'

export type UnitOfMeasurement = 
  | 'numeric-higher-better' 
  | 'numeric-lower-better' 
  | 'timeline' 
  | 'zero-based'

export type GoalSheetStatus = 
  | 'draft'
  | 'submitted'
  | 'pending-approval'
  | 'approved'
  | 'returned'
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

export interface GoalCycle {
  id: string
  name: string
  year: number
  startDate: string
  endDate: string
  status: 'active' | 'closed' | 'upcoming'
}

export interface GoalSheet {
  id: string
  employeeId: string
  employeeName: string
  department: string
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
  department: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  dueDate: string
  createdAt: string
}

export interface ActivityLog {
  id: string
  type: 'goal-created' | 'goal-updated' | 'goal-submitted' | 'goal-approved' | 'goal-returned' | 'checkin-submitted' | 'shared-goal-pushed'
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
}

export interface Goal {
  id: string
  title: string
  description: string
  thrustArea: string
  unitOfMeasurement: UnitOfMeasurement
  target: number
  weightage: number
  status: GoalStatus
  approvalStatus: ApprovalStatus
  createdAt: string
  updatedAt: string
  employeeId: string
  employeeName?: string
}

export interface CheckIn {
  id: string
  goalId: string
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4'
  plannedTarget: number
  actualAchievement: number | null
  status: GoalStatus
  score: number | null
  submittedAt: string | null
}

export interface TeamMember {
  id: string
  name: string
  email: string
  department: string
  goalsCount: number
  approvalStatus: ApprovalStatus
  checkIns: {
    Q1: boolean
    Q2: boolean
    Q3: boolean
    Q4: boolean
  }
}

export interface AuditLog {
  id: string
  employeeId: string
  employeeName: string
  goalId: string
  goalTitle: string
  fieldChanged: string
  oldValue: string
  newValue: string
  changedBy: string
  timestamp: string
}

export interface DepartmentCompletion {
  department: string
  Q1: number
  Q2: number
  Q3: number
  Q4: number
}

export interface SharedGoal {
  id: string
  title: string
  target: number
  assignedEmployees: string[]
  createdAt: string
}
