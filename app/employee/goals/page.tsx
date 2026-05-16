'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Header } from '@/components/layout/header'
import { GoalsTable } from '@/components/goals/goals-table'
import { CreateGoalModal } from '@/components/goals/create-goal-modal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { mockUser, mockGoals } from '@/lib/mock-data'
import { Goal } from '@/lib/types'
import { useState } from 'react'
import { Plus } from 'lucide-react'

export default function EmployeeGoalsPage() {
  const [goals, setGoals] = useState<Goal[]>(mockGoals)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

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

  return (
    <DashboardLayout role="employee">
      <Header user={mockUser} title="My Goals" />

      <div className="p-6">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">All Goals</CardTitle>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Goal
            </Button>
          </CardHeader>
          <CardContent>
            <GoalsTable
              goals={goals}
              onEdit={(goal) => console.log('Edit:', goal)}
              onDelete={(goal) => setGoals(goals.filter((g) => g.id !== goal.id))}
            />
          </CardContent>
        </Card>
      </div>

      <CreateGoalModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSubmit={handleCreateGoal}
        existingGoals={goals}
      />
    </DashboardLayout>
  )
}
