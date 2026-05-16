'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Header } from '@/components/layout/header'
import { GoalsTable } from '@/components/goals/goals-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { mockManagerUser, mockTeamGoals } from '@/lib/mock-data'

export default function ManagerTeamGoalsPage() {
  return (
    <DashboardLayout role="manager">
      <Header user={mockManagerUser} title="Team Goals" />

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
