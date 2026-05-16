import { GoalStatus, ApprovalStatus } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: GoalStatus | ApprovalStatus
  type?: 'goal' | 'approval'
}

export function StatusBadge({ status, type = 'goal' }: StatusBadgeProps) {
  if (type === 'goal') {
    const config = {
      'completed': {
        label: 'Completed',
        className: 'bg-success/10 text-success border-success/20',
      },
      'on-track': {
        label: 'On Track',
        className: 'bg-warning/10 text-warning-foreground border-warning/20',
      },
      'not-started': {
        label: 'Not Started',
        className: 'bg-destructive/10 text-destructive border-destructive/20',
      },
    }

    const { label, className } = config[status as GoalStatus] || config['not-started']

    return (
      <Badge variant="outline" className={cn('font-medium text-xs whitespace-nowrap', className)}>
        {label}
      </Badge>
    )
  }

  const approvalConfig = {
    'pending': {
      label: 'Pending',
      className: 'bg-warning/10 text-warning-foreground border-warning/20',
    },
    'approved': {
      label: 'Approved',
      className: 'bg-success/10 text-success border-success/20',
    },
    'returned': {
      label: 'Returned',
      className: 'bg-destructive/10 text-destructive border-destructive/20',
    },
  }

  const { label, className } = approvalConfig[status as ApprovalStatus] || approvalConfig['pending']

  return (
    <Badge variant="outline" className={cn('font-medium text-xs whitespace-nowrap', className)}>
      {label}
    </Badge>
  )
}
