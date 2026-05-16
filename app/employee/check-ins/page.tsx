'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { mockUser, mockGoals, mockCheckIns } from '@/lib/mock-data'
import { Goal, GoalStatus, CheckIn } from '@/lib/types'
import { Lock } from 'lucide-react'

type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4'

interface CheckInData {
  goalId: string
  actualAchievement: string
  status: GoalStatus
}

export default function EmployeeCheckInsPage() {
  const [selectedQuarter, setSelectedQuarter] = useState<Quarter>('Q1')
  const [checkInData, setCheckInData] = useState<Record<string, CheckInData>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filter only approved goals
  const approvedGoals = mockGoals.filter((g) => g.approvalStatus === 'approved')

  // Get existing check-ins for the selected quarter
  const getCheckIn = (goalId: string): CheckIn | undefined => {
    return mockCheckIns.find(
      (c) => c.goalId === goalId && c.quarter === selectedQuarter
    )
  }

  // Calculate score based on UoM and achievement
  const calculateScore = (goal: Goal, actualAchievement: number): number => {
    if (goal.unitOfMeasurement === 'numeric-higher-better') {
      return Math.round((actualAchievement / goal.target) * 100)
    } else if (goal.unitOfMeasurement === 'numeric-lower-better') {
      if (actualAchievement <= goal.target) {
        return 100 + Math.round(((goal.target - actualAchievement) / goal.target) * 20)
      }
      return Math.round((goal.target / actualAchievement) * 100)
    }
    return Math.round((actualAchievement / goal.target) * 100)
  }

  const handleAchievementChange = (goalId: string, value: string) => {
    setCheckInData((prev) => ({
      ...prev,
      [goalId]: {
        ...prev[goalId],
        goalId,
        actualAchievement: value,
        status: prev[goalId]?.status || 'not-started',
      },
    }))
  }

  const handleStatusChange = (goalId: string, status: GoalStatus) => {
    setCheckInData((prev) => ({
      ...prev,
      [goalId]: {
        ...prev[goalId],
        goalId,
        actualAchievement: prev[goalId]?.actualAchievement || '',
        status,
      },
    }))
  }

  const handleSubmitAll = async () => {
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    console.log('Submitted check-ins:', checkInData)
    setIsSubmitting(false)
  }

  const getStatusColor = (status: GoalStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-success/10 text-success border-success/20'
      case 'on-track':
        return 'bg-warning/10 text-warning-foreground border-warning/20'
      default:
        return 'bg-destructive/10 text-destructive border-destructive/20'
    }
  }

  return (
    <DashboardLayout role="employee">
      <Header user={mockUser} title="Quarterly Check-ins" />

      <div className="p-6 space-y-6">
        {/* Quarter Tabs */}
        <Tabs
          value={selectedQuarter}
          onValueChange={(v) => setSelectedQuarter(v as Quarter)}
          className="w-full"
        >
          <TabsList className="grid w-full max-w-md grid-cols-4">
            <TabsTrigger value="Q1">Q1</TabsTrigger>
            <TabsTrigger value="Q2">Q2</TabsTrigger>
            <TabsTrigger value="Q3">Q3</TabsTrigger>
            <TabsTrigger value="Q4">Q4</TabsTrigger>
          </TabsList>

          {(['Q1', 'Q2', 'Q3', 'Q4'] as const).map((quarter) => (
            <TabsContent key={quarter} value={quarter} className="mt-6">
              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold">
                      {quarter} Check-in
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Enter your actual achievements for each approved goal
                    </p>
                  </div>
                  <Badge variant="outline" className="text-muted-foreground">
                    <Lock className="mr-1 h-3 w-3" />
                    Goals Locked
                  </Badge>
                </CardHeader>
                <CardContent>
                  {approvedGoals.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="mb-4 h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                        <Lock className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-medium text-foreground">
                        No approved goals
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        You need approved goals before you can submit check-ins.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {approvedGoals.map((goal) => {
                        const existingCheckIn = getCheckIn(goal.id)
                        const currentData = checkInData[goal.id]
                        const achievementValue =
                          currentData?.actualAchievement ??
                          (existingCheckIn?.actualAchievement?.toString() || '')
                        const statusValue =
                          currentData?.status ??
                          existingCheckIn?.status ??
                          'not-started'
                        const score =
                          achievementValue && !isNaN(parseFloat(achievementValue))
                            ? calculateScore(goal, parseFloat(achievementValue))
                            : existingCheckIn?.score ?? null

                        return (
                          <div
                            key={goal.id}
                            className="rounded-lg border border-border bg-card p-5 space-y-4"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-foreground">
                                    {goal.title}
                                  </h4>
                                  <Badge
                                    variant="outline"
                                    className="text-xs font-normal"
                                  >
                                    {goal.weightage}% weight
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {goal.thrustArea}
                                </p>
                              </div>
                              {score !== null && (
                                <Badge
                                  variant="secondary"
                                  className="text-sm font-medium bg-muted text-foreground"
                                >
                                  Score: {score}
                                </Badge>
                              )}
                            </div>

                            <div className="grid gap-4 sm:grid-cols-3">
                              <div className="space-y-2">
                                <Label className="text-muted-foreground">
                                  Planned Target
                                </Label>
                                <div className="flex h-10 items-center rounded-md border border-input bg-muted/50 px-3 text-sm">
                                  {goal.target}
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor={`actual-${goal.id}`}>
                                  Actual Achievement
                                </Label>
                                <Input
                                  id={`actual-${goal.id}`}
                                  type="number"
                                  placeholder="Enter value"
                                  value={achievementValue}
                                  onChange={(e) =>
                                    handleAchievementChange(goal.id, e.target.value)
                                  }
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor={`status-${goal.id}`}>Status</Label>
                                <Select
                                  value={statusValue}
                                  onValueChange={(value) =>
                                    handleStatusChange(goal.id, value as GoalStatus)
                                  }
                                >
                                  <SelectTrigger
                                    id={`status-${goal.id}`}
                                    className={getStatusColor(statusValue)}
                                  >
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="not-started">
                                      Not Started
                                    </SelectItem>
                                    <SelectItem value="on-track">On Track</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        )
                      })}

                      <div className="flex justify-end pt-4 border-t border-border">
                        <Button
                          onClick={handleSubmitAll}
                          disabled={isSubmitting}
                          size="lg"
                        >
                          {isSubmitting ? 'Submitting...' : 'Submit All Check-ins'}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
