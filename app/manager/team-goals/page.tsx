'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { GoalsTable } from '@/components/goals/goals-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { mockTeamGoals } from '@/lib/mock-data'

export default function ManagerTeamGoalsPage() {
  return (
    <DashboardLayout role="manager">
      <DashboardHeader title="Team Goals" />

      <div className="p-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">All Team Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <GoalsTable
              goals={mockTeamGoals}
              showEmployee
              onView={(goal) => console.log('View:', goal)}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
