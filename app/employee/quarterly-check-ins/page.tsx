'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StatusBadge } from '@/components/goals/status-badge'
import { mockEmployeeUser, mockGoals, mockCheckIns, mockGoalCycle } from '@/lib/mock-data'
import { GoalStatus } from '@/lib/types'
import { 
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Send,
  MessageSquare,
  Info,
} from 'lucide-react'

const uomLabels: Record<string, string> = {
  'numeric-higher-better': 'Higher Better',
  'numeric-lower-better': 'Lower Better',
  'percentage': 'Percentage',
  'timeline': 'Timeline',
  'zero-based': 'Zero Based',
}

const statusOptions: { value: GoalStatus; label: string }[] = [
  { value: 'not-started', label: 'Not Started' },
  { value: 'on-track', label: 'On Track' },
  { value: 'completed', label: 'Completed' },
]

interface CheckInEntry {
  goalId: string
  actualAchievement: string
  status: GoalStatus
}

export default function QuarterlyCheckInsPage() {
  const [activeQuarter, setActiveQuarter] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4'>('Q4')
  const [checkInData, setCheckInData] = useState<Record<string, CheckInEntry>>(() => {
    const initial: Record<string, CheckInEntry> = {}
    mockGoals.forEach(goal => {
      const existingCheckIn = mockCheckIns.find(c => c.goalId === goal.id && c.quarter === 'Q4')
      initial[goal.id] = {
        goalId: goal.id,
        actualAchievement: existingCheckIn?.actualAchievement?.toString() || '',
        status: existingCheckIn?.status || 'not-started',
      }
    })
    return initial
  })

  const dueDate = 'Nov 30, 2025'
  const isQ4Active = activeQuarter === 'Q4'

  const updateCheckIn = (goalId: string, field: keyof CheckInEntry, value: string | GoalStatus) => {
    setCheckInData(prev => ({
      ...prev,
      [goalId]: { ...prev[goalId], [field]: value }
    }))
  }

  const calculateScore = (goal: typeof mockGoals[0], actual: number | null): number | null => {
    if (actual === null) return null
    const target = goal.target
    switch (goal.unitOfMeasurement) {
      case 'numeric-higher-better':
      case 'percentage':
        return Math.round((actual / target) * 100)
      case 'numeric-lower-better':
        return actual === 0 ? 100 : Math.round((target / actual) * 100)
      case 'timeline':
        return actual >= target ? 100 : Math.round((actual / target) * 100)
      case 'zero-based':
        return actual === 0 ? 100 : 0
      default:
        return null
    }
  }

  const getExistingCheckIn = (goalId: string, quarter: string) => {
    return mockCheckIns.find(c => c.goalId === goalId && c.quarter === quarter)
  }

  return (
    <DashboardLayout role="employee">
      <Header 
        user={mockEmployeeUser} 
        title="Quarterly Check-ins" 
        subtitle={mockGoalCycle.name}
      />

      <div className="p-6 space-y-6">
        {/* Header Info */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                Active Window: Q4 FY26
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Due Date: <span className="font-medium text-foreground">{dueDate}</span>
            </p>
          </div>
          <Button disabled={!isQ4Active}>
            <Send className="mr-2 h-4 w-4" />
            Submit Q4 Check-in
          </Button>
        </div>

        {/* Quarter Tabs */}
        <Tabs value={activeQuarter} onValueChange={(v) => setActiveQuarter(v as 'Q1' | 'Q2' | 'Q3' | 'Q4')}>
          <TabsList className="grid w-full grid-cols-4 max-w-md">
            <TabsTrigger value="Q1" className="gap-2">
              Q1
              <CheckCircle2 className="h-3 w-3 text-success" />
            </TabsTrigger>
            <TabsTrigger value="Q2" className="gap-2">
              Q2
              <CheckCircle2 className="h-3 w-3 text-success" />
            </TabsTrigger>
            <TabsTrigger value="Q3" className="gap-2">
              Q3
              <CheckCircle2 className="h-3 w-3 text-success" />
            </TabsTrigger>
            <TabsTrigger value="Q4" className="gap-2">
              Q4
              <Clock className="h-3 w-3 text-warning-foreground" />
            </TabsTrigger>
          </TabsList>

          {['Q1', 'Q2', 'Q3', 'Q4'].map((quarter) => (
            <TabsContent key={quarter} value={quarter} className="space-y-4 mt-6">
              {quarter !== 'Q4' && (
                <Alert className="border-muted bg-muted/30">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <AlertDescription>
                    {quarter} check-in completed and submitted.
                  </AlertDescription>
                </Alert>
              )}

              {quarter === 'Q4' && (
                <Alert className="border-warning/30 bg-warning/5">
                  <Clock className="h-4 w-4 text-warning-foreground" />
                  <AlertDescription className="text-warning-foreground">
                    {quarter} check-in window is open. Submit your updates by {dueDate}.
                  </AlertDescription>
                </Alert>
              )}

              {/* Goals Check-in Cards */}
              <div className="space-y-4">
                {mockGoals.map((goal) => {
                  const existingCheckIn = getExistingCheckIn(goal.id, quarter)
                  const isEditable = quarter === 'Q4'
                  const currentData = checkInData[goal.id]
                  const actualValue = isEditable 
                    ? (currentData?.actualAchievement ? parseFloat(currentData.actualAchievement) : null)
                    : existingCheckIn?.actualAchievement
                  const score = calculateScore(goal, actualValue ?? null)

                  return (
                    <Card key={goal.id} className="border-border/60">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <CardTitle className="text-sm font-semibold">{goal.title}</CardTitle>
                            <CardDescription className="mt-1">
                              {goal.thrustArea} | {uomLabels[goal.unitOfMeasurement]} | Target: {goal.target} | Weight: {goal.weightage}%
                            </CardDescription>
                          </div>
                          {score !== null && (
                            <Badge 
                              variant="outline" 
                              className={`
                                ${score >= 100 ? 'bg-success/10 text-success border-success/20' : 
                                  score >= 70 ? 'bg-primary/10 text-primary border-primary/20' :
                                  score >= 50 ? 'bg-warning/10 text-warning-foreground border-warning/20' :
                                  'bg-destructive/10 text-destructive border-destructive/20'}
                              `}
                            >
                              Score: {score}%
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 sm:grid-cols-4">
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">Planned Target</label>
                            <div className="h-10 px-3 flex items-center rounded-md border border-border bg-muted/30 text-sm">
                              {goal.target}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">Actual Achievement</label>
                            {isEditable ? (
                              <Input
                                type="number"
                                placeholder="Enter actual"
                                value={currentData?.actualAchievement || ''}
                                onChange={(e) => updateCheckIn(goal.id, 'actualAchievement', e.target.value)}
                                className="h-10"
                              />
                            ) : (
                              <div className="h-10 px-3 flex items-center rounded-md border border-border bg-muted/30 text-sm">
                                {existingCheckIn?.actualAchievement ?? '-'}
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">Status</label>
                            {isEditable ? (
                              <Select 
                                value={currentData?.status || 'not-started'} 
                                onValueChange={(value) => updateCheckIn(goal.id, 'status', value as GoalStatus)}
                              >
                                <SelectTrigger className="h-10">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {statusOptions.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <div className="h-10 flex items-center">
                                <StatusBadge status={existingCheckIn?.status || 'not-started'} type="goal" />
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">Score</label>
                            <div className="h-10 flex items-center">
                              {score !== null ? (
                                <div className="flex items-center gap-2">
                                  <Progress value={Math.min(score, 100)} className="h-2 w-16" />
                                  <span className="text-sm font-medium">{score}%</span>
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">-</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Manager Comment */}
                        {existingCheckIn?.managerComment && (
                          <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
                            <div className="flex items-center gap-2 mb-1">
                              <MessageSquare className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs font-medium text-muted-foreground">Manager Comment</span>
                            </div>
                            <p className="text-sm">{existingCheckIn.managerComment}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Score Formula Help */}
        <Card className="border-border/60 bg-muted/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              Score Calculation Reference
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
              <div className="p-3 rounded-lg bg-background border border-border">
                <p className="font-medium text-foreground">Higher is Better</p>
                <p className="text-xs text-muted-foreground mt-1">Score = (Actual / Target) x 100</p>
              </div>
              <div className="p-3 rounded-lg bg-background border border-border">
                <p className="font-medium text-foreground">Lower is Better</p>
                <p className="text-xs text-muted-foreground mt-1">Score = (Target / Actual) x 100</p>
              </div>
              <div className="p-3 rounded-lg bg-background border border-border">
                <p className="font-medium text-foreground">Timeline</p>
                <p className="text-xs text-muted-foreground mt-1">Completion vs Deadline %</p>
              </div>
              <div className="p-3 rounded-lg bg-background border border-border">
                <p className="font-medium text-foreground">Zero Based</p>
                <p className="text-xs text-muted-foreground mt-1">0 = 100%, else 0%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
