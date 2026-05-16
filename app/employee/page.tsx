'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Header } from '@/components/layout/header'
import { SummaryCard } from '@/components/dashboard/summary-card'
import { GoalsTable } from '@/components/goals/goals-table'
import { CreateGoalModal } from '@/components/goals/create-goal-modal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { mockUser, mockGoals } from '@/lib/mock-data'
import { Goal } from '@/lib/types'
import { Target, Percent, TrendingUp, CheckCircle2, Plus, AlertTriangle } from 'lucide-react'

export default function EmployeeDashboard() {
  const [goals, setGoals] = useState<Goal[]>(mockGoals)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const totalGoals = goals.length
  const totalWeightage = goals.reduce((sum, goal) => sum + goal.weightage, 0)
  const goalsOnTrack = goals.filter((g) => g.status === 'on-track').length
  const goalsCompleted = goals.filter((g) => g.status === 'completed').length

  const handleCreateGoal = (newGoal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt' | 'employeeId' | 'approvalStatus'>) => {
    const goal: Goal = {
      ...newGoal,
      id: `g${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      employeeId: mockUser.id,
      approvalStatus: 'pending',
    }
    setGoals([...goals, goal])
    setIsCreateModalOpen(false)
  }

  const handleEditGoal = (goal: Goal) => {
    console.log('Edit goal:', goal)
  }

  const handleDeleteGoal = (goal: Goal) => {
    setGoals(goals.filter((g) => g.id !== goal.id))
  }

  return (
    <DashboardLayout role="employee">
      <Header user={mockUser} title="Dashboard" />

      <div className="p-6 space-y-6">
        {/* Warning Banner */}
        {totalWeightage !== 100 && (
          <Alert variant="destructive" className="border-destructive/50 bg-destructive/5">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Weightage Mismatch</AlertTitle>
            <AlertDescription>
              Your total goal weightage is {totalWeightage}%. It must equal exactly 100% before submission.
            </AlertDescription>
          </Alert>
        )}

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="Total Goals"
            value={totalGoals}
            subtitle="Active goals this cycle"
            icon={<Target className="h-5 w-5" />}
            variant="default"
          />
          <SummaryCard
            title="Total Weightage"
            value={`${totalWeightage}%`}
            subtitle={totalWeightage === 100 ? 'Balanced' : 'Needs adjustment'}
            icon={<Percent className="h-5 w-5" />}
            variant={totalWeightage === 100 ? 'success' : 'warning'}
          />
          <SummaryCard
            title="Goals On Track"
            value={goalsOnTrack}
            subtitle={`${Math.round((goalsOnTrack / totalGoals) * 100) || 0}% of total`}
            icon={<TrendingUp className="h-5 w-5" />}
            variant="warning"
          />
          <SummaryCard
            title="Goals Completed"
            value={goalsCompleted}
            subtitle={`${Math.round((goalsCompleted / totalGoals) * 100) || 0}% completion rate`}
            icon={<CheckCircle2 className="h-5 w-5" />}
            variant="success"
          />
        </div>

        {/* Goals Table */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">My Goals</CardTitle>
            <span className="text-sm text-muted-foreground">
              {totalGoals} goal{totalGoals !== 1 ? 's' : ''} total
            </span>
          </CardHeader>
          <CardContent>
            <GoalsTable
              goals={goals}
              onEdit={handleEditGoal}
              onDelete={handleDeleteGoal}
            />
          </CardContent>
        </Card>
      </div>

      {/* Floating Create Button */}
      <Button
        onClick={() => setIsCreateModalOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
        size="icon"
      >
        <Plus className="h-6 w-6" />
        <span className="sr-only">Create new goal</span>
      </Button>

      {/* Create Goal Modal */}
      <CreateGoalModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSubmit={handleCreateGoal}
        existingGoals={goals}
      />
    </DashboardLayout>
  )
}
