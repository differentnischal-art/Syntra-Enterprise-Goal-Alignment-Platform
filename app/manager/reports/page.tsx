'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { SummaryCard } from '@/components/dashboard/summary-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { mockTeamMembers, mockTeamGoals } from '@/lib/mock-data'
import { BarChart3, Download, Users, Target, TrendingUp, CheckCircle2 } from 'lucide-react'

export default function ManagerReportsPage() {
  const completedGoals = mockTeamGoals.filter((g) => g.status === 'completed').length
  const onTrackGoals = mockTeamGoals.filter((g) => g.status === 'on-track').length
  const totalCheckIns = mockTeamMembers.reduce(
    (sum, m) =>
      sum +
      (m.checkIns.Q1 ? 1 : 0) +
      (m.checkIns.Q2 ? 1 : 0) +
      (m.checkIns.Q3 ? 1 : 0) +
      (m.checkIns.Q4 ? 1 : 0),
    0
  )

  return (
    <DashboardLayout role="manager">
      <DashboardHeader title="Reports" />

      <div className="p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="Team Members"
            value={mockTeamMembers.length}
            subtitle="Active employees"
            icon={<Users className="h-5 w-5" />}
          />
          <SummaryCard
            title="Total Goals"
            value={mockTeamGoals.length}
            subtitle="This cycle"
            icon={<Target className="h-5 w-5" />}
          />
          <SummaryCard
            title="On Track"
            value={onTrackGoals}
            subtitle={`${Math.round((onTrackGoals / mockTeamGoals.length) * 100)}% of goals`}
            icon={<TrendingUp className="h-5 w-5" />}
            variant="warning"
          />
          <SummaryCard
            title="Completed"
            value={completedGoals}
            subtitle={`${Math.round((completedGoals / mockTeamGoals.length) * 100)}% completion`}
            icon={<CheckCircle2 className="h-5 w-5" />}
            variant="success"
          />
        </div>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Team Performance Summary</CardTitle>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <BarChart3 className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground">Reports Coming Soon</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-md">
                Detailed team performance reports and analytics will be available here.
                Export your current data using the button above.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
