import { GoalStatus, ApprovalStatus, GoalSheetStatus, EscalationSeverity } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Lock, Share2 } from 'lucide-react'

interface StatusBadgeProps {
  status: GoalStatus | ApprovalStatus | GoalSheetStatus | EscalationSeverity | string
  type?: 'goal' | 'approval' | 'sheet' | 'severity'
}

export function StatusBadge({ status, type = 'goal' }: StatusBadgeProps) {
  if (type === 'severity') {
    const severityConfig = {
      'low': { label: 'Low', className: 'bg-muted text-muted-foreground border-muted shadow-sm' },
      'medium': { label: 'Medium', className: 'bg-warning/10 text-warning-foreground border-warning/25 shadow-sm shadow-warning/10' },
      'high': { label: 'High', className: 'bg-destructive/10 text-destructive border-destructive/25 shadow-sm shadow-destructive/10' },
      'critical': { label: 'Critical', className: 'bg-destructive text-destructive-foreground border-destructive shadow-sm shadow-destructive/20' },
    }
    const { label, className } = severityConfig[status as EscalationSeverity] || severityConfig['low']
    return (
      <Badge variant="outline" className={cn('font-medium text-xs whitespace-nowrap', className)}>
        {label}
      </Badge>
    )
  }

  if (type === 'sheet') {
    const sheetConfig = {
      'draft': { label: 'Draft', className: 'bg-muted text-muted-foreground border-muted shadow-sm' },
      'submitted': { label: 'Submitted for Approval', className: 'bg-primary/10 text-primary border-primary/25 shadow-sm shadow-primary/10' },
      'pending-approval': { label: 'Submitted for Approval', className: 'bg-warning/10 text-warning-foreground border-warning/25 shadow-sm shadow-warning/10' },
      'approved': { label: 'Approved / Locked', className: 'bg-success/10 text-success border-success/25 shadow-sm shadow-success/10' },
      'returned': { label: 'Returned for Rework', className: 'bg-destructive/10 text-destructive border-destructive/25 shadow-sm shadow-destructive/10' },
      'rejected': { label: 'Rejected', className: 'bg-destructive/10 text-destructive border-destructive/25 shadow-sm shadow-destructive/10' },
      'rework-required': { label: 'Rework Required', className: 'bg-destructive/10 text-destructive border-destructive/25 shadow-sm shadow-destructive/10' },
      'locked': { label: 'Approved / Locked', className: 'bg-primary/10 text-primary border-primary/25 shadow-sm shadow-primary/10' },
      'q1-updated': { label: 'Q1 Updated', className: 'bg-success/10 text-success border-success/25 shadow-sm shadow-success/10' },
      'q2-updated': { label: 'Q2 Updated', className: 'bg-success/10 text-success border-success/25 shadow-sm shadow-success/10' },
      'q3-updated': { label: 'Q3 Updated', className: 'bg-success/10 text-success border-success/25 shadow-sm shadow-success/10' },
      'final-closed': { label: 'Final Closed', className: 'bg-muted text-muted-foreground border-muted shadow-sm' },
    }
    const { label, className } = sheetConfig[status as GoalSheetStatus] || sheetConfig['draft']
    return (
      <Badge variant="outline" className={cn('font-medium text-xs whitespace-nowrap gap-1', className)}>
        {status === 'locked' && <Lock className="h-3 w-3" />}
        {label}
      </Badge>
    )
  }

  if (type === 'goal') {
    const config = {
      'completed': {
        label: 'Completed',
        className: 'bg-success/10 text-success border-success/25 shadow-sm shadow-success/10',
      },
      'on-track': {
        label: 'On Track',
        className: 'bg-primary/10 text-primary border-primary/25 shadow-sm shadow-primary/10',
      },
      'not-started': {
        label: 'Not Started',
        className: 'bg-muted text-muted-foreground border-muted shadow-sm',
      },
      'overdue': {
        label: 'Overdue',
        className: 'bg-destructive/10 text-destructive border-destructive/25 shadow-sm shadow-destructive/10',
      },
    }

    const { label, className } = config[status as GoalStatus] || config['not-started']

    return (
      <Badge variant="outline" className={cn('font-medium text-xs whitespace-nowrap', className)}>
        {label}
      </Badge>
    )
  }

  // Approval status
  const approvalConfig = {
    'draft': {
      label: 'Draft',
      className: 'bg-muted text-muted-foreground border-muted shadow-sm',
    },
    'pending': {
      label: 'Pending',
      className: 'bg-warning/10 text-warning-foreground border-warning/25 shadow-sm shadow-warning/10',
    },
    'approved': {
      label: 'Approved',
      className: 'bg-success/10 text-success border-success/25 shadow-sm shadow-success/10',
    },
    'returned': {
      label: 'Returned',
      className: 'bg-destructive/10 text-destructive border-destructive/25 shadow-sm shadow-destructive/10',
    },
  }

  const { label, className } = approvalConfig[status as ApprovalStatus] || approvalConfig['pending']

  return (
    <Badge variant="outline" className={cn('font-medium text-xs whitespace-nowrap', className)}>
      {label}
    </Badge>
  )
}

// Shared Goal Badge
export function SharedBadge() {
  return (
    <Badge variant="outline" className="font-medium text-xs whitespace-nowrap gap-1 bg-primary/5 text-primary border-primary/25 shadow-sm shadow-primary/10">
      <Share2 className="h-3 w-3" />
      Shared
    </Badge>
  )
}

// Locked Badge
export function LockedBadge() {
  return (
    <Badge variant="outline" className="font-medium text-xs whitespace-nowrap gap-1 bg-slate-100 text-slate-600 border-slate-200 shadow-sm">
      <Lock className="h-3 w-3" />
      Locked
    </Badge>
  )
}
