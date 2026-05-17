import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface SummaryCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger'
}

export function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  variant = 'default',
}: SummaryCardProps) {
  const iconBgClass = {
    default: 'bg-primary/10 text-primary shadow-primary/10',
    success: 'bg-success/10 text-success shadow-success/10',
    warning: 'bg-warning/10 text-warning-foreground shadow-warning/10',
    danger: 'bg-destructive/10 text-destructive shadow-destructive/10',
  }

  const cardAccentClass = {
    default: 'from-primary/10 via-card to-card',
    success: 'from-success/10 via-card to-card',
    warning: 'from-warning/15 via-card to-card',
    danger: 'from-destructive/10 via-card to-card',
  }

  return (
    <Card className={cn('overflow-hidden bg-gradient-to-br', cardAccentClass[variant])}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-semibold tracking-tight text-foreground">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {icon && (
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg shadow-sm',
                iconBgClass[variant]
              )}
            >
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
