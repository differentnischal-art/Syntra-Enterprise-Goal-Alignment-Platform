'use client'

import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { StatusBadge } from '@/components/goals/status-badge'
import { mockTeamMembers, mockTeamGoals, mockActivityLogs, mockGoalCycle } from '@/lib/mock-data'
import { 
  Users, 
  Target, 
  CheckCircle2, 
  Clock,
  TrendingUp,
  ArrowRight,
  FileText,
  CalendarCheck,
  AlertCircle,
  BarChart3,
} from 'lucide-react'

export default function ManagerDashboard() {
  const totalTeamMembers = mockTeamMembers.length
  const pendingApprovals = mockTeamMembers.filter(m => m.approvalStatus === 'pending').length
  const teamAvgAchievement = Math.round(
    mockTeamMembers.reduce((sum, m) => sum + m.averageAchievement, 0) / mockTeamMembers.length
  )
  const checkInCompliance = Math.round(
    (mockTeamMembers.filter(m => m.checkIns.Q3).length / mockTeamMembers.length) * 100
  )

  // Get goals by thrust area for distribution
  const thrustAreaDistribution = mockTeamGoals.reduce((acc, goal) => {
    acc[goal.thrustArea] = (acc[goal.thrustArea] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const topThrustAreas = Object.entries(thrustAreaDistribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return (
    <DashboardLayout role="manager">
      <DashboardHeader
        title="Manager Dashboard"
        subtitle="Team Performance Overview"
      />

      <div className="p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border/60">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Direct Reports</p>
                  <p className="text-2xl font-semibold text-foreground">{totalTeamMembers}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">Engineering Team</p>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Pending Approvals</p>
                  <p className="text-2xl font-semibold text-foreground">{pendingApprovals}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                  <Clock className="h-5 w-5 text-warning-foreground" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">Goal sheets awaiting review</p>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Team Avg Achievement</p>
                  <p className="text-2xl font-semibold text-foreground">{teamAvgAchievement}%</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
              </div>
              <Progress value={teamAvgAchievement} className="h-1.5 mt-3" />
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Check-in Compliance</p>
                  <p className="text-2xl font-semibold text-foreground">{checkInCompliance}%</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <CalendarCheck className="h-5 w-5 text-success" />
                </div>
              </div>
              <Progress value={checkInCompliance} className="h-1.5 mt-3" />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Pending Approvals */}
          <div className="lg:col-span-2">
            <Card className="border-border/60">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base font-semibold">Pending Approvals</CardTitle>
                  <CardDescription>Goal sheets awaiting your review</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/manager/approvals">
                    View All
                    <ArrowRight className="ml-2 h-3 w-3" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {pendingApprovals === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                    <div className="mb-4 h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6 text-success" />
                    </div>
                    <p className="text-sm font-medium">All Caught Up!</p>
                    <p className="text-xs text-muted-foreground mt-1">No pending approvals</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {mockTeamMembers.filter(m => m.approvalStatus === 'pending').map((member) => (
                      <div key={member.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border border-border">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{member.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {member.goalsCount} goals | {member.totalWeightage}% weightage
                            </p>
                          </div>
                        </div>
                        <Button size="sm" asChild>
                          <Link href="/manager/approvals">
                            Review
                          </Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
              <CardDescription>Latest team updates</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {mockActivityLogs.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 px-6 py-3">
                    <div className={`
                      mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full
                      ${activity.type === 'goal-approved' ? 'bg-success/10 text-success' :
                        activity.type === 'goal-returned' ? 'bg-destructive/10 text-destructive' :
                        activity.type === 'checkin-submitted' ? 'bg-primary/10 text-primary' :
                        'bg-muted text-muted-foreground'}
                    `}>
                      {activity.type === 'goal-approved' && <CheckCircle2 className="h-3.5 w-3.5" />}
                      {activity.type === 'goal-returned' && <AlertCircle className="h-3.5 w-3.5" />}
                      {activity.type === 'checkin-submitted' && <CalendarCheck className="h-3.5 w-3.5" />}
                      {activity.type === 'comment-added' && <FileText className="h-3.5 w-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground line-clamp-2">{activity.description}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(activity.timestamp).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Roster */}
        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold">Team Roster</CardTitle>
              <CardDescription>Overview of all direct reports</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/manager/team-goals">
                View Details
                <ArrowRight className="ml-2 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Employee</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-3 py-3">Goals</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-3 py-3">Sheet Status</th>
                    <th className="text-center text-xs font-medium text-muted-foreground px-3 py-3">Achievement</th>
                    <th className="text-center text-xs font-medium text-muted-foreground px-3 py-3">Q1</th>
                    <th className="text-center text-xs font-medium text-muted-foreground px-3 py-3">Q2</th>
                    <th className="text-center text-xs font-medium text-muted-foreground px-3 py-3">Q3</th>
                    <th className="text-center text-xs font-medium text-muted-foreground px-3 py-3">Q4</th>
                  </tr>
                </thead>
                <tbody>
                  {mockTeamMembers.map((member, index) => (
                    <tr key={member.id} className={`border-b border-border last:border-0 ${index % 2 === 0 ? 'bg-card' : 'bg-muted/30'}`}>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 border border-border">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{member.name}</p>
                            <p className="text-xs text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-sm">{member.goalsCount}</td>
                      <td className="px-3 py-3">
                        <StatusBadge status={member.sheetStatus} type="sheet" />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Progress value={member.averageAchievement} className="h-1.5 w-12" />
                          <span className="text-xs text-muted-foreground w-8">{member.averageAchievement}%</span>
                        </div>
                      </td>
                      {(['Q1', 'Q2', 'Q3', 'Q4'] as const).map((q) => (
                        <td key={q} className="px-3 py-3 text-center">
                          {member.checkIns[q] ? (
                            <CheckCircle2 className="h-4 w-4 text-success mx-auto" />
                          ) : (
                            <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 mx-auto" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Goal Distribution */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Goal Distribution by Thrust Area</CardTitle>
            <CardDescription>Team goals breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topThrustAreas.map(([area, count]) => (
                <div key={area} className="flex items-center gap-4">
                  <div className="w-40 text-sm font-medium truncate">{area}</div>
                  <div className="flex-1">
                    <Progress value={(count / mockTeamGoals.length) * 100} className="h-2" />
                  </div>
                  <div className="w-12 text-right text-sm text-muted-foreground">{count} goals</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
