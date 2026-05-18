'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { StatusBadge } from '@/components/goals/status-badge'
import { getManagerLiveData, type ManagerLiveData } from '@/lib/data/manager'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { useCurrentProfile } from '@/hooks/use-current-profile'
import { 
  Users, 
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
  const { liveProfile, error: profileError } = useCurrentProfile()
  const [managerData, setManagerData] = useState<ManagerLiveData | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setManagerData(null)
      setFetchError(null)
      return
    }

    if (!liveProfile) {
      setManagerData(null)
      setFetchError(profileError)
      return
    }

    let cancelled = false
    const managerId = liveProfile.id

    async function load() {
      try {
        setFetchError(null)
        const data = await getManagerLiveData(managerId)
        if (!cancelled) {
          setManagerData(data)
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[manager dashboard] live data failed:', err)
        }
        if (!cancelled) {
          setFetchError(err instanceof Error ? err.message : 'Failed to load manager dashboard data.')
          setManagerData(null)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [liveProfile, profileError])

  const teamMembers = managerData?.teamMembers ?? []
  const pendingSheets = managerData?.pendingSheets ?? []
  const totalTeamMembers = managerData?.directReportsCount ?? 0
  const pendingApprovals = managerData?.pendingApprovals ?? 0
  const teamAvgAchievement = managerData?.teamAvgAchievement ?? 0
  const checkInCompliance = managerData?.checkInCompliance ?? 0
  const topThrustAreas = managerData?.topThrustAreas ?? []
  const recentActivity = managerData?.recentActivity ?? []
  const totalGoals = managerData?.goalsCount ?? 0

  return (
    <DashboardLayout role="manager">
      <DashboardHeader
        title="Manager Dashboard"
        subtitle="Team Performance Overview"
      />

      <div className="space-y-6 p-4 sm:p-6">
        {fetchError && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-4 text-sm text-destructive">{fetchError}</CardContent>
          </Card>
        )}

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="overflow-hidden bg-gradient-to-br from-primary/10 via-card to-card">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Direct Reports</p>
                  <p className="text-2xl font-semibold text-foreground">{totalTeamMembers}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shadow-sm shadow-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">Direct reports</p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden bg-gradient-to-br from-warning/15 via-card to-card">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Pending Approvals</p>
                  <p className="text-2xl font-semibold text-foreground">{pendingApprovals}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 shadow-sm shadow-warning/10">
                  <Clock className="h-5 w-5 text-warning-foreground" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">Goal sheets awaiting review</p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden bg-gradient-to-br from-success/10 via-card to-card">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Team Avg Achievement</p>
                  <p className="text-2xl font-semibold text-foreground">{teamAvgAchievement}%</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 shadow-sm shadow-success/10">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
              </div>
              <Progress value={teamAvgAchievement} className="h-1.5 mt-3" />
            </CardContent>
          </Card>

          <Card className="overflow-hidden bg-gradient-to-br from-success/10 via-card to-card">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Check-in Compliance</p>
                  <p className="text-2xl font-semibold text-foreground">{checkInCompliance}%</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 shadow-sm shadow-success/10">
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
                  <div className="mx-6 mb-6 flex flex-col items-center justify-center rounded-lg border border-dashed border-success/25 bg-gradient-to-br from-success/10 via-background to-primary/5 px-6 py-12 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success shadow-sm shadow-success/10">
                      <CheckCircle2 className="h-6 w-6 text-success" />
                    </div>
                    <p className="text-sm font-semibold">All caught up</p>
                    <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                      No pending goal sheets need review right now.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {pendingSheets.map((sheet) => (
                          <div
                            key={sheet.goalSheetId}
                            className="flex items-center justify-between px-6 py-4 transition-all hover:bg-primary/5"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9 border border-border">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {sheet.name
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">{sheet.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {sheet.goalsCount} goals | {sheet.totalWeightage}% weightage
                                </p>
                              </div>
                            </div>
                            <Button size="sm" asChild>
                              <Link href="/manager/approvals">Review</Link>
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
                {recentActivity.length === 0 ? (
                  <div className="px-6 py-10 text-center">
                    <p className="text-sm font-medium">No recent team activity yet.</p>
                  </div>
                ) : recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 px-6 py-3 transition-colors hover:bg-primary/5">
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
                  {teamMembers.map((member, index) => (
                    <tr key={member.id} className={`border-b border-border transition-colors last:border-0 hover:bg-primary/5 ${index % 2 === 0 ? 'bg-card' : 'bg-muted/25'}`}>
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
                  {teamMembers.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-6 py-10 text-center text-sm text-muted-foreground">
                        No direct reports found.
                      </td>
                    </tr>
                  )}
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
              {topThrustAreas.length === 0 ? (
                <p className="text-sm text-muted-foreground">No team goals found.</p>
              ) : topThrustAreas.map(([area, count]) => (
                <div key={area} className="flex items-center gap-4">
                  <div className="w-40 text-sm font-medium truncate">{area}</div>
                  <div className="flex-1">
                    <Progress value={totalGoals > 0 ? (count / totalGoals) * 100 : 0} className="h-2" />
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
