'use client'

import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { StatusBadge, SharedBadge, LockedBadge } from '@/components/goals/status-badge'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { mockEmployeeUser, mockGoals, mockGoalSheet, mockActivityLogs, mockGoalCycle } from '@/lib/mock-data'
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
} from 'lucide-react'

const uomLabels: Record<string, string> = {
  'numeric-higher-better': 'Higher Better',
  'numeric-lower-better': 'Lower Better',
  'percentage': 'Percentage',
  'timeline': 'Timeline',
  'zero-based': 'Zero Based',
}

export default function MyGoalSheetPage() {
  const totalWeightage = mockGoals.reduce((sum, g) => sum + g.weightage, 0)
  const goalsCount = mockGoals.length
  const maxGoals = 8

  return (
    <DashboardLayout role="employee">
      <Header 
        user={mockEmployeeUser} 
        title="My Goal Sheet" 
        subtitle={mockGoalCycle.name}
      />

      <div className="p-6 space-y-6">
        {/* Lock Banner */}
        <Alert className="border-primary/30 bg-primary/5">
          <Lock className="h-4 w-4 text-primary" />
          <AlertDescription className="text-primary">
            This goal sheet is <span className="font-semibold">approved and locked</span>. Edits require Admin intervention.
          </AlertDescription>
        </Alert>

        {/* Goal Sheet Status Card */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2 border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Goal Sheet Status</CardTitle>
                  <CardDescription>{mockGoalCycle.name}</CardDescription>
                </div>
                <StatusBadge status="locked" type="sheet" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Manager</p>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">{mockGoalSheet.managerName}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Approved Date</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      {mockGoalSheet.approvedAt ? new Date(mockGoalSheet.approvedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      }) : '-'}
                    </p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Goal Count</p>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">{goalsCount} / {maxGoals}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Total Weightage</p>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={`h-4 w-4 ${totalWeightage === 100 ? 'text-success' : 'text-destructive'}`} />
                    <p className={`text-sm font-medium ${totalWeightage === 100 ? 'text-success' : 'text-destructive'}`}>
                      {totalWeightage}%
                    </p>
                  </div>
                </div>
              </div>
              {mockGoalSheet.managerComments && (
                <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Manager Comments</p>
                  <p className="text-sm">{mockGoalSheet.managerComments}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
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

        {/* Goals Table */}
        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold">Goals</CardTitle>
              <CardDescription>{goalsCount} goals totaling {totalWeightage}% weightage</CardDescription>
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
                  {mockGoals.map((goal, index) => (
                    <TableRow key={goal.id} className={index % 2 === 0 ? 'bg-card' : 'bg-muted/30'}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {goal.isLocked && <Lock className="h-3 w-3 text-muted-foreground shrink-0" />}
                          <span className="font-medium line-clamp-2">{goal.title}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{goal.thrustArea}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{uomLabels[goal.unitOfMeasurement]}</TableCell>
                      <TableCell className="text-right tabular-nums">{goal.target}</TableCell>
                      <TableCell className="text-right tabular-nums font-medium">{goal.weightage}%</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={goal.progress || 0} className="h-1.5 w-16" />
                          <span className="text-xs text-muted-foreground w-8">{goal.progress || 0}%</span>
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

        {/* Activity Timeline */}
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
                    <div className={`
                      flex h-8 w-8 items-center justify-center rounded-full border-2 bg-background
                      ${activity.type === 'goal-approved' ? 'border-success text-success' :
                        activity.type === 'goal-returned' ? 'border-destructive text-destructive' :
                        activity.type === 'checkin-submitted' ? 'border-primary text-primary' :
                        'border-muted-foreground text-muted-foreground'}
                    `}>
                      {activity.type === 'goal-approved' && <CheckCircle2 className="h-4 w-4" />}
                      {activity.type === 'goal-returned' && <AlertCircle className="h-4 w-4" />}
                      {activity.type === 'checkin-submitted' && <CalendarCheck className="h-4 w-4" />}
                      {activity.type === 'comment-added' && <FileText className="h-4 w-4" />}
                      {activity.type === 'shared-goal-pushed' && <Share2 className="h-4 w-4" />}
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
      </div>
    </DashboardLayout>
  )
}
