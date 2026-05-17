'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { StatusBadge, SharedBadge } from '@/components/goals/status-badge'
import { mockActivityLogs } from '@/lib/mock-data'
import { getAuditLogs, type AuditLogRow } from '@/lib/data/audit-logs'
import { isRealUuid } from '@/lib/data/goals'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { useEmployeeGoalSheetData } from '@/hooks/use-employee-goal-sheet-data'
import type { GoalSheetStatus } from '@/lib/types'
import {
  Target,
  Calendar,
  Lock,
  FileText,
  CalendarCheck,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Share2,
} from 'lucide-react'

const lifecycleStages = [
  { id: 'draft', label: 'Draft', status: 'completed' },
  { id: 'submitted', label: 'Submitted', status: 'completed' },
  { id: 'pending', label: 'Pending Approval', status: 'completed' },
  { id: 'approved', label: 'Approved', status: 'completed' },
  { id: 'locked', label: 'Locked', status: 'completed' },
  { id: 'q1', label: 'Q1', status: 'completed' },
  { id: 'q2', label: 'Q2', status: 'completed' },
  { id: 'q3', label: 'Q3', status: 'completed' },
  { id: 'q4', label: 'Q4', status: 'current' },
]

type DisplayActivity = {
  id: string
  type:
    | 'goal-approved'
    | 'goal-returned'
    | 'checkin-submitted'
    | 'shared-goal-pushed'
    | 'comment-added'
    | 'other'
  description: string
  timestamp: string
}

function mapMockActivity(activity: (typeof mockActivityLogs)[number]): DisplayActivity {
  return {
    id: activity.id,
    type:
      activity.type === 'goal-approved' ||
      activity.type === 'goal-returned' ||
      activity.type === 'checkin-submitted' ||
      activity.type === 'shared-goal-pushed' ||
      activity.type === 'comment-added'
        ? activity.type
        : 'other',
    description: activity.description,
    timestamp: activity.timestamp,
  }
}

function mapAuditActivity(row: AuditLogRow): DisplayActivity {
  const type =
    row.actionType === 'goal_approved'
      ? 'goal-approved'
      : row.actionType === 'goal_returned'
        ? 'goal-returned'
        : row.actionType === 'checkin_submitted'
          ? 'checkin-submitted'
          : row.actionType === 'comment_added'
            ? 'comment-added'
            : row.actionType === 'shared_goal_assigned'
              ? 'shared-goal-pushed'
              : 'other'

  return {
    id: row.id,
    type,
    description: row.description ?? `${row.actorName} ${row.actionType.replace(/_/g, ' ')}`,
    timestamp: row.createdAt,
  }
}

function sheetStatusForBadge(
  status: GoalSheetStatus | undefined
): GoalSheetStatus {
  if (!status) return 'draft'
  if (status === 'submitted') return 'pending-approval'
  return status
}

export default function EmployeeDashboard() {
  const {
    profile,
    activeCycle,
    goals,
    goalSheet,
    dataSource,
    fetchError,
    sourceLabel,
  } = useEmployeeGoalSheetData()
  const [liveActivityLogs, setLiveActivityLogs] = useState<AuditLogRow[] | null>(null)

  useEffect(() => {
    if (
      !isSupabaseConfigured() ||
      !profile ||
      !isRealUuid(profile.id)
    ) {
      setLiveActivityLogs(null)
      return
    }

    let cancelled = false
    getAuditLogs({ employeeId: profile.id }).then((logs) => {
      if (!cancelled) {
        setLiveActivityLogs(logs)
      }
    })

    return () => {
      cancelled = true
    }
  }, [profile])

  const displayName = profile?.name.split(' ')[0] ?? 'Employee'
  const maxGoals = 8
  const totalGoals = goals.length
  const overallAchievement =
    goals.length > 0
      ? Math.round(
          goals.reduce((sum, g) => sum + (g.progress || 0), 0) / goals.length
        )
      : 0
  const nextCheckIn = 'Nov 30, 2025'
  const sheetStatus = goalSheet?.status
  const showEmptyState = dataSource === 'supabase-empty'
  const activityLogs: DisplayActivity[] = isSupabaseConfigured()
    ? (liveActivityLogs ?? []).map(mapAuditActivity)
    : mockActivityLogs.map(mapMockActivity)

  const welcomeMessage = showEmptyState
    ? `No goal sheet created yet for ${activeCycle?.name ?? 'the active cycle'}. Create your goal sheet to begin.`
    : sheetStatus === 'pending-approval' || sheetStatus === 'submitted'
      ? 'Your goal sheet is pending manager approval.'
      : sheetStatus === 'draft' || sheetStatus === 'returned'
        ? 'Your goal sheet is in progress. Complete and submit when ready.'
        : `Your goal sheet is approved. Q4 check-in is due by ${nextCheckIn}.`

  return (
    <DashboardLayout role="employee">
      <DashboardHeader
        title="Dashboard"
        subtitle={`${activeCycle?.name ?? 'No active cycle'} - ${profile?.department ?? 'Profile unavailable'}`}
      />

      <div className="p-6 space-y-6">
        <Badge
          variant="outline"
          className="h-5 border-border/80 px-2 text-[10px] font-normal text-muted-foreground"
        >
          {sourceLabel}
        </Badge>

        {fetchError && (
          <Alert className="border-destructive/30 bg-destructive/5">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">
              {fetchError}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Welcome back, {displayName}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">{welcomeMessage}</p>
          </div>
          <div className="flex gap-2">
            {showEmptyState ? (
              <Button asChild>
                <Link href="/employee/create-goal-sheet">
                  <Target className="mr-2 h-4 w-4" />
                  Create Goal Sheet
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild>
                  <Link href="/employee/quarterly-check-ins">
                    <CalendarCheck className="mr-2 h-4 w-4" />
                    Submit Q4 Check-in
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/employee/my-goal-sheet">
                    <FileText className="mr-2 h-4 w-4" />
                    View Goal Sheet
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border/60">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Active Goals</p>
                  <p className="text-2xl font-semibold text-foreground">
                    {totalGoals}{' '}
                    <span className="text-sm font-normal text-muted-foreground">
                      of max {maxGoals}
                    </span>
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Target className="h-5 w-5 text-primary" />
                </div>
              </div>
              <Progress
                value={maxGoals > 0 ? (totalGoals / maxGoals) * 100 : 0}
                className="h-1.5 mt-3"
              />
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Overall Achievement
                  </p>
                  <p className="text-2xl font-semibold text-foreground">
                    {overallAchievement}%
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
              </div>
              <Progress value={overallAchievement} className="h-1.5 mt-3" />
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Next Check-in</p>
                  <p className="text-2xl font-semibold text-foreground">{nextCheckIn}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                  <Calendar className="h-5 w-5 text-warning-foreground" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">Q4 FY26 window open</p>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Sheet Status</p>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge
                      status={sheetStatusForBadge(sheetStatus)}
                      type="sheet"
                    />
                  </div>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Lock className="h-5 w-5 text-primary" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                {showEmptyState
                  ? 'Not created yet'
                  : sheetStatus === 'locked' || sheetStatus === 'approved'
                    ? 'Locked for edits'
                    : 'Current cycle sheet'}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Goal Lifecycle Tracker</CardTitle>
            <CardDescription>Your progress through the FY26 goal cycle</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 overflow-x-auto pb-2">
              {lifecycleStages.map((stage, index) => (
                <div key={stage.id} className="flex items-center">
                  <div
                    className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap
                    ${
                      stage.status === 'completed'
                        ? 'bg-success/10 text-success'
                        : stage.status === 'current'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                    }
                  `}
                  >
                    {stage.status === 'completed' && (
                      <CheckCircle2 className="h-3 w-3" />
                    )}
                    {stage.status === 'current' && <Clock className="h-3 w-3" />}
                    {stage.label}
                  </div>
                  {index < lifecycleStages.length - 1 && (
                    <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0 mx-1" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card className="border-border/60">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base font-semibold">My Goals</CardTitle>
                  <CardDescription>
                    {totalGoals} goals for {activeCycle?.name ?? 'the active cycle'}
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/employee/my-goal-sheet">
                    View All
                    <ArrowRight className="ml-2 h-3 w-3" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {showEmptyState ? (
                  <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                    <Target className="h-10 w-10 text-muted-foreground mb-3" />
                    <p className="text-sm font-medium text-foreground">
                      No goal sheet created yet
                    </p>
                    <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                      Create your {activeCycle?.name ?? 'active cycle'} goal sheet to begin.
                    </p>
                    <Button className="mt-4" asChild>
                      <Link href="/employee/create-goal-sheet">Create Goal Sheet</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {goals.map((goal) => (
                      <div
                        key={goal.id}
                        className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-foreground truncate">
                              {goal.title}
                            </p>
                            {goal.isShared && <SharedBadge />}
                            {goal.isLocked && (
                              <Lock className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{goal.thrustArea}</span>
                            <span>Target: {goal.target}</span>
                            <span>Weight: {goal.weightage}%</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-24">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="font-medium">{goal.progress || 0}%</span>
                            </div>
                            <Progress value={goal.progress || 0} className="h-1.5" />
                          </div>
                          <StatusBadge status={goal.status} type="goal" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
                <CardDescription>Latest updates on your goals</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {activityLogs.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 px-6 py-3">
                      <div
                        className={`
                        mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full
                        ${
                          activity.type === 'goal-approved'
                            ? 'bg-success/10 text-success'
                            : activity.type === 'goal-returned'
                              ? 'bg-destructive/10 text-destructive'
                              : activity.type === 'checkin-submitted'
                                ? 'bg-primary/10 text-primary'
                                : 'bg-muted text-muted-foreground'
                        }
                      `}
                      >
                        {activity.type === 'goal-approved' && (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        )}
                        {activity.type === 'goal-returned' && (
                          <AlertCircle className="h-3.5 w-3.5" />
                        )}
                        {activity.type === 'checkin-submitted' && (
                          <CalendarCheck className="h-3.5 w-3.5" />
                        )}
                        {activity.type === 'comment-added' && (
                          <FileText className="h-3.5 w-3.5" />
                        )}
                        {activity.type === 'shared-goal-pushed' && (
                          <Share2 className="h-3.5 w-3.5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">{activity.description}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(activity.timestamp).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
