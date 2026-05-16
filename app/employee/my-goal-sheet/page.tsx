'use client'

import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { StatusBadge, SharedBadge } from '@/components/goals/status-badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { mockActivityLogs } from '@/lib/mock-data'
import { useEmployeeGoalSheetData } from '@/hooks/use-employee-goal-sheet-data'
import type { GoalSheet, GoalSheetStatus } from '@/lib/types'
import {
  Lock,
  FileText,
  Download,
  Share2,
  CheckCircle2,
  Calendar,
  User,
  AlertCircle,
  CalendarCheck,
  Target,
  Clock,
} from 'lucide-react'

const uomLabels: Record<string, string> = {
  'numeric-higher-better': 'Higher Better',
  'numeric-lower-better': 'Lower Better',
  percentage: 'Percentage',
  timeline: 'Timeline',
  'zero-based': 'Zero Based',
}

function sheetStatusForBadge(status: GoalSheetStatus): GoalSheetStatus {
  if (status === 'submitted') return 'pending-approval'
  return status
}

function StatusBanner({ goalSheet }: { goalSheet: GoalSheet }) {
  switch (goalSheet.status) {
    case 'draft':
      return (
        <Alert className="border-warning/30 bg-warning/5">
          <FileText className="h-4 w-4 text-warning-foreground" />
          <AlertDescription className="text-warning-foreground">
            This goal sheet is in <span className="font-semibold">draft</span>. Continue
            editing from Create Goal Sheet.
          </AlertDescription>
        </Alert>
      )
    case 'pending-approval':
    case 'submitted':
      return (
        <Alert className="border-warning/30 bg-warning/5">
          <Clock className="h-4 w-4 text-warning-foreground" />
          <AlertDescription className="text-warning-foreground">
            Your goal sheet is <span className="font-semibold">pending manager approval</span>.
          </AlertDescription>
        </Alert>
      )
    case 'returned':
      return (
        <Alert className="border-destructive/30 bg-destructive/5">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive">
            Your goal sheet was <span className="font-semibold">returned</span> for changes.
            {goalSheet.managerComments && (
              <span className="block mt-1">{goalSheet.managerComments}</span>
            )}
          </AlertDescription>
        </Alert>
      )
    case 'approved':
    case 'locked':
    case 'final-closed':
    default:
      return (
        <Alert className="border-primary/30 bg-primary/5">
          <Lock className="h-4 w-4 text-primary" />
          <AlertDescription className="text-primary">
            This goal sheet is <span className="font-semibold">approved and locked</span>.
            Edits require Admin intervention.
          </AlertDescription>
        </Alert>
      )
  }
}

export default function MyGoalSheetPage() {
  const {
    activeCycle,
    goals,
    goalSheet,
    dataSource,
    fetchError,
  } = useEmployeeGoalSheetData()

  const showEmptyState = dataSource === 'supabase-empty'
  const maxGoals = 8
  const totalWeightage = goalSheet?.totalWeightage ?? goals.reduce((sum, g) => sum + g.weightage, 0)
  const goalsCount = goalSheet?.goalsCount ?? goals.length

  const sourceBadgeLabel =
    dataSource === 'supabase'
      ? 'Live Supabase goal sheet'
      : dataSource === 'supabase-empty'
        ? 'No Supabase goal sheet yet'
        : dataSource === 'loading'
          ? 'Loading goal sheet...'
          : 'Demo goal sheet'

  return (
    <DashboardLayout role="employee">
      <DashboardHeader title="My Goal Sheet" subtitle={activeCycle.name} />

      <div className="p-6 space-y-6">
        <Badge
          variant="outline"
          className="h-5 border-border/80 px-2 text-[10px] font-normal text-muted-foreground"
        >
          {sourceBadgeLabel}
        </Badge>

        {fetchError && (
          <Alert className="border-destructive/30 bg-destructive/5">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">
              {fetchError}. Showing demo goal sheet.
            </AlertDescription>
          </Alert>
        )}

        {showEmptyState ? (
          <Card className="border-border/60">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Target className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground">
                No goal sheet found for this cycle
              </h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-md">
                Create your {activeCycle.name} goal sheet to get started.
              </p>
              <Button className="mt-6" asChild>
                <Link href="/employee/create-goal-sheet">Create Goal Sheet</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {goalSheet && <StatusBanner goalSheet={goalSheet} />}

            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2 border-border/60">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold">Goal Sheet Status</CardTitle>
                      <CardDescription>{activeCycle.name}</CardDescription>
                    </div>
                    {goalSheet && (
                      <StatusBadge
                        status={sheetStatusForBadge(goalSheet.status)}
                        type="sheet"
                      />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Manager</p>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-medium">
                          {goalSheet?.managerName ?? '—'}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Approved Date</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-medium">
                          {goalSheet?.approvedAt
                            ? new Date(goalSheet.approvedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : '—'}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Goal Count</p>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-medium">
                          {goalsCount} / {maxGoals}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Total Weightage</p>
                      <div className="flex items-center gap-2">
                        <CheckCircle2
                          className={`h-4 w-4 ${totalWeightage === 100 ? 'text-success' : 'text-destructive'}`}
                        />
                        <p
                          className={`text-sm font-medium ${totalWeightage === 100 ? 'text-success' : 'text-destructive'}`}
                        >
                          {totalWeightage}%
                        </p>
                      </div>
                    </div>
                  </div>
                  {goalSheet?.managerComments && (
                    <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
                      <p className="text-xs text-muted-foreground mb-1">Manager Comments</p>
                      <p className="text-sm">{goalSheet.managerComments}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/employee/quarterly-check-ins">
                      <CalendarCheck className="mr-2 h-4 w-4" />
                      Submit Q4 Check-in
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="mr-2 h-4 w-4" />
                    Export Goal Sheet
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/60">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base font-semibold">Goals</CardTitle>
                  <CardDescription>
                    {goalsCount} goals totaling {totalWeightage}% weightage
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[300px]">Goal Title</TableHead>
                        <TableHead>Thrust Area</TableHead>
                        <TableHead>UoM</TableHead>
                        <TableHead className="text-right">Target</TableHead>
                        <TableHead className="text-right">Weightage</TableHead>
                        <TableHead className="text-center">Progress</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[100px]">Badges</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {goals.map((goal, index) => (
                        <TableRow
                          key={goal.id}
                          className={index % 2 === 0 ? 'bg-card' : 'bg-muted/30'}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {goal.isLocked && (
                                <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                              )}
                              <span className="font-medium line-clamp-2">{goal.title}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {goal.thrustArea}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {uomLabels[goal.unitOfMeasurement]}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {goal.target}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-medium">
                            {goal.weightage}%
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={goal.progress || 0} className="h-1.5 w-16" />
                              <span className="text-xs text-muted-foreground w-8">
                                {goal.progress || 0}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={goal.status} type="goal" />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {goal.isShared && <SharedBadge />}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Activity Timeline</CardTitle>
                <CardDescription>History of changes to your goal sheet</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockActivityLogs.slice(0, 6).map((activity, index) => (
                    <div key={activity.id} className="flex gap-4">
                      <div className="relative flex flex-col items-center">
                        <div
                          className={`
                      flex h-8 w-8 items-center justify-center rounded-full border-2 bg-background
                      ${
                        activity.type === 'goal-approved'
                          ? 'border-success text-success'
                          : activity.type === 'goal-returned'
                            ? 'border-destructive text-destructive'
                            : activity.type === 'checkin-submitted'
                              ? 'border-primary text-primary'
                              : 'border-muted-foreground text-muted-foreground'
                      }
                    `}
                        >
                          {activity.type === 'goal-approved' && (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                          {activity.type === 'goal-returned' && (
                            <AlertCircle className="h-4 w-4" />
                          )}
                          {activity.type === 'checkin-submitted' && (
                            <CalendarCheck className="h-4 w-4" />
                          )}
                          {activity.type === 'comment-added' && (
                            <FileText className="h-4 w-4" />
                          )}
                          {activity.type === 'shared-goal-pushed' && (
                            <Share2 className="h-4 w-4" />
                          )}
                        </div>
                        {index < mockActivityLogs.slice(0, 6).length - 1 && (
                          <div className="flex-1 w-px bg-border mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.timestamp).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          by {activity.actorName}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
