'use client'

import { useState } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  mockAdminUser,
  mockAuditLogs,
  mockDepartmentCompletion,
  mockEscalations,
  mockGoalCycle,
  mockActivityLogs,
} from '@/lib/mock-data'
import { 
  Users, 
  Target, 
  FileText, 
  Lock, 
  Download, 
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  ArrowRight,
  BarChart3,
  CalendarCheck,
  Shield,
  Bell,
  User,
  UserCheck,
  FileCheck,
  FileEdit,
} from 'lucide-react'

export default function AdminDashboard() {
  // Calculate stats
  const totalParticipants = 602
  const overallCompletion = 80
  const sheetsLocked = 412
  const activeEscalations = mockEscalations.length

  const avgDeptCompletion = Math.round(
    mockDepartmentCompletion.reduce((sum, d) => sum + d.Q1 + d.Q2 + d.Q3, 0) / 
    (mockDepartmentCompletion.length * 3)
  )

  const getCompletionColor = (value: number) => {
    if (value >= 80) return 'bg-success text-white'
    if (value >= 50) return 'bg-warning text-warning-foreground'
    if (value > 0) return 'bg-destructive/70 text-white'
    return 'bg-muted text-muted-foreground'
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-destructive text-destructive-foreground'
      case 'high': return 'bg-destructive/80 text-white'
      case 'medium': return 'bg-warning text-warning-foreground'
      case 'low': return 'bg-muted text-muted-foreground'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'goal-approved': return <CheckCircle2 className="h-4 w-4 text-success" />
      case 'goal-returned': return <AlertTriangle className="h-4 w-4 text-warning-foreground" />
      case 'checkin-submitted': return <CalendarCheck className="h-4 w-4 text-primary" />
      case 'shared-goal-pushed': return <Target className="h-4 w-4 text-primary" />
      case 'comment-added': return <FileEdit className="h-4 w-4 text-muted-foreground" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  // Sheet status distribution
  const sheetStatusData = [
    { label: 'Locked', value: 412, color: 'bg-primary' },
    { label: 'Approved', value: 98, color: 'bg-success' },
    { label: 'Pending', value: 52, color: 'bg-warning' },
    { label: 'Draft', value: 40, color: 'bg-muted' },
  ]
  const totalSheets = sheetStatusData.reduce((sum, s) => sum + s.value, 0)

  return (
    <DashboardLayout role="admin">
      <Header 
        user={mockAdminUser} 
        title="Admin Dashboard" 
        subtitle={`${mockGoalCycle.name} - Organization-wide goal lifecycle oversight`}
      />

      <div className="p-6 space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">FY26 Cycle Compliance</h2>
            <p className="text-sm text-muted-foreground">
              Organization-wide goal lifecycle, compliance and escalation oversight
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/admin/audit-trail">
                <ClipboardList className="mr-2 h-4 w-4" />
                Audit Trail
              </Link>
            </Button>
            <Button asChild>
              <Link href="/admin/reports-export">
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Link>
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border/60">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Total Participants</p>
                  <p className="text-2xl font-semibold text-foreground">{totalParticipants}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">Across all departments</p>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Overall Completion</p>
                  <p className="text-2xl font-semibold text-foreground">{overallCompletion}%</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
              </div>
              <Progress value={overallCompletion} className="h-1.5 mt-3" />
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Goal Sheets Locked</p>
                  <p className="text-2xl font-semibold text-foreground">{sheetsLocked}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Lock className="h-5 w-5 text-primary" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">{Math.round((sheetsLocked / totalParticipants) * 100)}% of total</p>
            </CardContent>
          </Card>

          <Card className="border-border/60 border-l-4 border-l-destructive">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Active Escalations</p>
                  <p className="text-2xl font-semibold text-destructive">{activeEscalations}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
              </div>
              <Button variant="link" className="h-auto p-0 text-xs mt-2" asChild>
                <Link href="/admin/escalations">
                  View all escalations
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Department KPI Summary */}
          <div className="lg:col-span-2">
            <Card className="border-border/60">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base font-semibold">Department Check-in Rates</CardTitle>
                  <CardDescription>Quarterly completion heatmap by department</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/admin/reports-export">
                    View Report
                    <ArrowRight className="ml-2 h-3 w-3" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="text-left text-xs font-medium text-muted-foreground pb-3 pr-4 w-[140px]">
                          Department
                        </th>
                        <th className="text-center text-xs font-medium text-muted-foreground pb-3 px-2 w-[70px]">
                          Q1
                        </th>
                        <th className="text-center text-xs font-medium text-muted-foreground pb-3 px-2 w-[70px]">
                          Q2
                        </th>
                        <th className="text-center text-xs font-medium text-muted-foreground pb-3 px-2 w-[70px]">
                          Q3
                        </th>
                        <th className="text-center text-xs font-medium text-muted-foreground pb-3 px-2 w-[70px]">
                          Q4
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockDepartmentCompletion.map((dept) => (
                        <tr key={dept.department} className="border-t border-border">
                          <td className="py-2 pr-4">
                            <span className="text-sm font-medium">{dept.department}</span>
                          </td>
                          {(['Q1', 'Q2', 'Q3', 'Q4'] as const).map((quarter) => (
                            <td key={quarter} className="py-2 px-2">
                              <div
                                className={`h-8 w-full rounded flex items-center justify-center text-xs font-medium ${getCompletionColor(dept[quarter])}`}
                              >
                                {dept[quarter]}%
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="h-3 w-3 rounded bg-success" />
                    80%+
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-3 w-3 rounded bg-warning" />
                    50-79%
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-3 w-3 rounded bg-destructive/70" />
                    1-49%
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-3 w-3 rounded bg-muted border border-border" />
                    Not Started
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sheet Status Distribution */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Goal Sheet Status</CardTitle>
              <CardDescription>Distribution across {totalSheets} sheets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {sheetStatusData.map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-muted-foreground">{item.value}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${item.color}`}
                      style={{ width: `${(item.value / totalSheets) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Escalation Summary */}
          <Card className="border-border/60">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold">Escalation Summary</CardTitle>
                <CardDescription>Active issues requiring attention</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/escalations">
                  View All
                  <ArrowRight className="ml-2 h-3 w-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {mockEscalations.slice(0, 4).map((escalation) => (
                  <div key={escalation.id} className="flex items-center justify-between px-6 py-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/10">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{escalation.employeeName}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{escalation.message}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getSeverityColor(escalation.severity)}>
                        {escalation.severity}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{escalation.daysOverdue}d</span>
                    </div>
                  </div>
                ))}
              </div>
              {mockEscalations.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center px-6">
                  <CheckCircle2 className="h-8 w-8 text-success mb-2" />
                  <p className="text-sm font-medium">No Active Escalations</p>
                  <p className="text-xs text-muted-foreground">All issues have been resolved</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Audit Activity */}
          <Card className="border-border/60">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold">Recent Audit Activity</CardTitle>
                <CardDescription>Latest changes in the system</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/audit-trail">
                  View All
                  <ArrowRight className="ml-2 h-3 w-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {mockAuditLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="flex items-start gap-3 px-6 py-3">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                      {log.actionType === 'approve' && <FileCheck className="h-3.5 w-3.5 text-success" />}
                      {log.actionType === 'update' && <FileEdit className="h-3.5 w-3.5 text-primary" />}
                      {log.actionType === 'submit' && <FileText className="h-3.5 w-3.5 text-primary" />}
                      {log.actionType === 'return' && <AlertTriangle className="h-3.5 w-3.5 text-warning-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{log.changedBy}</span>
                        <span className="text-xs text-muted-foreground">{log.actionType}d</span>
                        <span className="text-sm">{log.fieldChanged}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {log.goalTitle} ({log.employeeName})
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(log.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <Link href="/admin/cycle-management" className="block">
                <div className="rounded-lg border border-border p-4 hover:bg-muted/30 transition-colors h-full">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium">Cycle Management</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Manage goal windows and quarterly check-in periods
                  </p>
                </div>
              </Link>

              <Link href="/admin/shared-goals" className="block">
                <div className="rounded-lg border border-border p-4 hover:bg-muted/30 transition-colors h-full">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <Target className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium">Shared Goals</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Push departmental KPIs to multiple employees
                  </p>
                </div>
              </Link>

              <Link href="/admin/escalations" className="block">
                <div className="rounded-lg border border-border p-4 hover:bg-muted/30 transition-colors h-full">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    </div>
                    <span className="font-medium">Escalations</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {activeEscalations} active escalations requiring attention
                  </p>
                </div>
              </Link>

              <Link href="/admin/reports-export" className="block">
                <div className="rounded-lg border border-border p-4 hover:bg-muted/30 transition-colors h-full">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10">
                      <BarChart3 className="h-4 w-4 text-success" />
                    </div>
                    <span className="font-medium">Reports & Export</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Generate and download compliance reports
                  </p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
