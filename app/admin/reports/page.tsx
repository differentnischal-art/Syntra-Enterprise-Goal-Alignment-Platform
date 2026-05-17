'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { SummaryCard } from '@/components/dashboard/summary-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { mockDepartmentCompletion, mockEmployees } from '@/lib/mock-data'
import { BarChart3, Download, Users, Target, TrendingUp, CheckCircle2 } from 'lucide-react'

export default function AdminReportsPage() {
  const averageCompletion =
    mockDepartmentCompletion.reduce((sum, d) => sum + d.Q1 + d.Q2 + d.Q3 + d.Q4, 0) /
    (mockDepartmentCompletion.length * 4)

  return (
    <DashboardLayout role="admin">
      <DashboardHeader title="Reports" />

      <div className="p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="Total Employees"
            value={mockEmployees.length}
            subtitle="Active employees"
            icon={<Users className="h-5 w-5" />}
          />
          <SummaryCard
            title="Total Goals"
            value={42}
            subtitle="This cycle"
            icon={<Target className="h-5 w-5" />}
          />
          <SummaryCard
            title="Avg Completion"
            value={`${Math.round(averageCompletion)}%`}
            subtitle="Check-in rate"
            icon={<TrendingUp className="h-5 w-5" />}
            variant="success"
          />
          <SummaryCard
            title="Departments"
            value={mockDepartmentCompletion.length}
            subtitle="Active departments"
            icon={<CheckCircle2 className="h-5 w-5" />}
          />
        </div>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Organization Reports</CardTitle>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export All Reports
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <BarChart3 className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground">Advanced Reports Coming Soon</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-md">
                Detailed organization-wide reports, analytics, and insights will be available here.
                Export your current data using the button above.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
