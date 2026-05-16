'use client'

import { useState } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Header } from '@/components/layout/header'
import { SummaryCard } from '@/components/dashboard/summary-card'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  mockAdminUser,
  mockAuditLogs,
  mockDepartmentCompletion,
  mockEscalations,
} from '@/lib/mock-data'
import { 
  Users, 
  Target, 
  FileText, 
  Activity, 
  Download, 
  AlertTriangle,
  Lock,
  Clock,
  CheckCircle2,
  RotateCcw,
  ArrowRight,
  Calendar,
  Share2,
  Shield,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { downloadCSV } from '@/lib/export-csv'

export default function AdminDashboard() {
  // KPI values
  const totalParticipants = 602
  const overallCompletion = 80
  const goalSheetsLocked = 412
  const activeEscalations = mockEscalations.length

  // Sheet status breakdown
  const sheetStatusData = [
    { label: 'Draft', count: 45, color: 'bg-muted', textColor: 'text-muted-foreground' },
    { label: 'Pending Approval', count: 78, color: 'bg-warning', textColor: 'text-warning-foreground' },
    { label: 'Approved', count: 67, color: 'bg-success', textColor: 'text-success' },
    { label: 'Returned', count: 12, color: 'bg-destructive', textColor: 'text-destructive' },
    { label: 'Locked', count: 412, color: 'bg-primary', textColor: 'text-primary' },
  ]

  const totalSheets = sheetStatusData.reduce((sum, s) => sum + s.count, 0)

  // Quick actions
  const quickActions = [
    { label: 'Open Cycle Management', href: '/admin/cycle-management', icon: Calendar },
    { label: 'Push Shared Goal', href: '/admin/shared-goals', icon: Share2 },
    { label: 'View Audit Trail', href: '/admin/audit-trail', icon: FileText },
    { label: 'Export Reports', href: '/admin/reports-export', icon: Download },
    { label: 'View Escalations', href: '/admin/escalations', icon: AlertTriangle },
  ]

  // Compliance risk data
  const complianceRisks = mockDepartmentCompletion
    .filter(d => d.Q3 < 70)
    .sort((a, b) => a.Q3 - b.Q3)

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getCompletionColor = (value: number) => {
    if (value >= 80) return 'bg-success'
    if (value >= 50) return 'bg-warning'
    if (value > 0) return 'bg-destructive/70'
    return 'bg-muted'
  }

  const handleExportReport = () => {
    const reportData = mockDepartmentCompletion.map(d => ({
      Department: d.department,
      'Total Employees': d.totalEmployees,
      'Sheets Locked': d.sheetsLocked,
      'Q1 Completion': `${d.Q1}%`,
      'Q2 Completion': `${d.Q2}%`,
      'Q3 Completion': `${d.Q3}%`,
      'Q4 Completion': `${d.Q4}%`,
    }))
    downloadCSV('compliance_report.csv', reportData)
  }

  return (
    <DashboardLayout role="admin">
      <Header 
        user={mockAdminUser} 
        title="FY26 Cycle Compliance" 
        subtitle="Organization-wide goal lifecycle, compliance, audit, reporting, and escalation oversight"
      />

      <div className="p-6 space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">HR Command Center</h2>
            <p className="text-sm text-muted-foreground">Real-time compliance and goal lifecycle overview</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/audit-trail">
              <Button variant="outline" size="sm">
                <FileText className="mr-2 h-4 w-4" />
                Audit Trail
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={handleExportReport}>
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
            <Link href="/admin/escalations">
              <Button size="sm" className="bg-destructive hover:bg-destructive/90">
                <AlertTriangle className="mr-2 h-4 w-4" />
                View Escalations ({activeEscalations})
              </Button>
            </Link>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="Total Participants"
            value={totalParticipants}
            subtitle="Across all departments"
            icon={<Users className="h-5 w-5" />}
            variant="default"
          />
          <SummaryCard
            title="Overall Completion"
            value={`${overallCompletion}%`}
            subtitle="Check-in rate"
            icon={<Activity className="h-5 w-5" />}
            variant="success"
          />
          <SummaryCard
            title="Goal Sheets Locked"
            value={goalSheetsLocked}
            subtitle="Finalized this cycle"
            icon={<Lock className="h-5 w-5" />}
            variant="default"
          />
          <SummaryCard
            title="Active Escalations"
            value={activeEscalations}
            subtitle="Requires attention"
            icon={<AlertTriangle className="h-5 w-5" />}
            variant="danger"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Sheet Status Breakdown */}
          <Card className="border-border/60 lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Sheet Status Breakdown</CardTitle>
              <CardDescription>Distribution of goal sheets across approval stages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sheetStatusData.map((status) => {
                  const percentage = Math.round((status.count / totalSheets) * 100)
                  return (
                    <div key={status.label} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{status.label}</span>
                        <span className={status.textColor}>{status.count} ({percentage}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${status.color} transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Sheets</span>
                <span className="font-semibold">{totalSheets}</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickActions.map((action) => (
                <Link key={action.label} href={action.href}>
                  <Button variant="ghost" className="w-full justify-between h-10 px-3">
                    <div className="flex items-center gap-3">
                      <action.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{action.label}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Second Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Audit Activity Feed */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Recent Audit Activity</CardTitle>
                  <CardDescription>Latest field changes and actions</CardDescription>
                </div>
                <Link href="/admin/audit-trail">
                  <Button variant="ghost" size="sm" className="text-xs">
                    View All
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockAuditLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="flex gap-3 p-3 rounded-lg border border-border bg-muted/30">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    log.actionType === 'approve' ? 'bg-success/10' :
                    log.actionType === 'return' ? 'bg-destructive/10' :
                    log.actionType === 'submit' ? 'bg-primary/10' :
                    'bg-muted'
                  }`}>
                    {log.actionType === 'approve' ? <CheckCircle2 className="h-4 w-4 text-success" /> :
                     log.actionType === 'return' ? <RotateCcw className="h-4 w-4 text-destructive" /> :
                     log.actionType === 'submit' ? <FileText className="h-4 w-4 text-primary" /> :
                     <Activity className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1">{log.employeeName}</p>
                    <p className="text-xs text-muted-foreground">
                      {log.fieldChanged}: <span className="text-destructive line-through">{log.oldValue}</span> → <span className="text-success">{log.newValue}</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground/70 mt-1">{formatTimestamp(log.timestamp)}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Compliance Risk Panel */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Compliance Risks</CardTitle>
                  <CardDescription>Departments requiring attention</CardDescription>
                </div>
                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                  {complianceRisks.length} at risk
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Low Q3 Completion */}
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <ArrowDownRight className="h-4 w-4 text-destructive" />
                  Low Q3 Completion
                </h4>
                {complianceRisks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">All departments are on track</p>
                ) : (
                  <div className="space-y-2">
                    {complianceRisks.map((dept) => (
                      <div key={dept.department} className="flex items-center justify-between p-2 rounded-lg border border-destructive/20 bg-destructive/5">
                        <span className="text-sm font-medium">{dept.department}</span>
                        <Badge className="bg-destructive/10 text-destructive border-0">{dept.Q3}%</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Escalation Summary */}
              <div className="pt-4 border-t border-border">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning-foreground" />
                  Escalation Severity
                </h4>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Critical', count: 0, color: 'bg-destructive' },
                    { label: 'High', count: mockEscalations.filter(e => e.severity === 'high').length, color: 'bg-destructive/70' },
                    { label: 'Medium', count: mockEscalations.filter(e => e.severity === 'medium').length, color: 'bg-warning' },
                    { label: 'Low', count: mockEscalations.filter(e => e.severity === 'low').length, color: 'bg-muted' },
                  ].map((item) => (
                    <div key={item.label} className="text-center p-2 rounded-lg border border-border">
                      <div className={`h-2 w-2 rounded-full ${item.color} mx-auto mb-1`} />
                      <p className="text-lg font-semibold">{item.count}</p>
                      <p className="text-[10px] text-muted-foreground">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Department Completion Heatmap */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Department Check-in Completion Rates</CardTitle>
                <CardDescription>Quarterly progress by department</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleExportReport}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left text-sm font-medium text-muted-foreground pb-3 pr-4">
                      Department
                    </th>
                    <th className="text-center text-sm font-medium text-muted-foreground pb-3 px-2 w-16">
                      Team
                    </th>
                    <th className="text-center text-sm font-medium text-muted-foreground pb-3 px-2 w-20">
                      Q1
                    </th>
                    <th className="text-center text-sm font-medium text-muted-foreground pb-3 px-2 w-20">
                      Q2
                    </th>
                    <th className="text-center text-sm font-medium text-muted-foreground pb-3 px-2 w-20">
                      Q3
                    </th>
                    <th className="text-center text-sm font-medium text-muted-foreground pb-3 px-2 w-20">
                      Q4
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mockDepartmentCompletion.map((dept, index) => (
                    <tr key={dept.department} className={index % 2 === 0 ? 'bg-card' : 'bg-muted/30'}>
                      <td className="py-3 pr-4 text-sm font-medium">{dept.department}</td>
                      <td className="py-3 px-2 text-center text-sm text-muted-foreground">
                        {dept.totalEmployees}
                      </td>
                      {(['Q1', 'Q2', 'Q3', 'Q4'] as const).map((quarter) => (
                        <td key={quarter} className="py-3 px-2">
                          <div
                            className={`mx-auto h-10 w-16 rounded-md flex items-center justify-center text-sm font-medium ${getCompletionColor(
                              dept[quarter]
                            )} ${dept[quarter] >= 50 ? 'text-white' : 'text-foreground'}`}
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
    </DashboardLayout>
  )
}
