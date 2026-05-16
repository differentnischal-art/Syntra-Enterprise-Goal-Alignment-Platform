'use client'

import { useEffect, useMemo, useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import { useCurrentProfile } from '@/hooks/use-current-profile'
import {
  calculateCheckInScore,
  getEmployeeQuarterlyCheckIns,
  submitEmployeeQuarterlyCheckIns,
  type CheckInQuarter,
  type EmployeeQuarterlyCheckInRow,
} from '@/lib/data/check-ins'
import { getActiveGoalCycle } from '@/lib/data/goal-cycles'
import { isRealUuid } from '@/lib/data/goals'
import { mockGoals, mockCheckIns, mockGoalCycle } from '@/lib/mock-data'
import type { GoalCycle, GoalStatus, UnitOfMeasurement } from '@/lib/types'
import {
  CheckCircle2,
  Clock,
  Send,
  MessageSquare,
  Info,
} from 'lucide-react'

const uomLabels: Record<string, string> = {
  'numeric-higher-better': 'Higher Better',
  'numeric-lower-better': 'Lower Better',
  percentage: 'Percentage',
  timeline: 'Timeline',
  'zero-based': 'Zero Based',
}

const statusOptions: { value: GoalStatus; label: string }[] = [
  { value: 'not-started', label: 'Not Started' },
  { value: 'on-track', label: 'On Track' },
  { value: 'completed', label: 'Completed' },
  { value: 'overdue', label: 'Overdue' },
]

const quarterToDb: Record<'Q1' | 'Q2' | 'Q3' | 'Q4', CheckInQuarter> = {
  Q1: 'q1',
  Q2: 'q2',
  Q3: 'q3',
  Q4: 'q4',
}

interface CheckInEntry {
  goalId: string
  actualAchievement: string
  status: GoalStatus
  employeeNote: string
}

function createMockEntries(quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4') {
  const initial: Record<string, CheckInEntry> = {}
  mockGoals.forEach((goal) => {
    const existingCheckIn = mockCheckIns.find(
      (checkIn) => checkIn.goalId === goal.id && checkIn.quarter === quarter
    )
    initial[goal.id] = {
      goalId: goal.id,
      actualAchievement: existingCheckIn?.actualAchievement?.toString() || '',
      status: existingCheckIn?.status || 'not-started',
      employeeNote: '',
    }
  })
  return initial
}

function createLiveEntries(rows: EmployeeQuarterlyCheckInRow[]) {
  const initial: Record<string, CheckInEntry> = {}
  rows.forEach((row) => {
    initial[row.goalId] = {
      goalId: row.goalId,
      actualAchievement: row.actualAchievement?.toString() || '',
      status: row.status,
      employeeNote: row.employeeNote,
    }
  })
  return initial
}

export default function QuarterlyCheckInsPage() {
  const { liveProfile } = useCurrentProfile()
  const [activeQuarter, setActiveQuarter] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4'>('Q4')
  const [activeCycle, setActiveCycle] = useState<GoalCycle>(mockGoalCycle)
  const [checkInData, setCheckInData] = useState<Record<string, CheckInEntry>>(() =>
    createMockEntries('Q4')
  )
  const [liveRows, setLiveRows] = useState<EmployeeQuarterlyCheckInRow[] | null>(null)
  const [liveGoalSheetId, setLiveGoalSheetId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitMessage, setSubmitMessage] = useState<string | null>(null)

  const dueDate = 'Nov 30, 2025'
  const isQ4Active = activeQuarter === 'Q4'
  const dbQuarter = quarterToDb[activeQuarter]
  const canFetchLive = Boolean(
    liveProfile &&
      isRealUuid(liveProfile.id) &&
      isRealUuid(activeCycle.id)
  )

  useEffect(() => {
    let cancelled = false
    getActiveGoalCycle().then((cycle) => {
      if (!cancelled) {
        setActiveCycle(cycle)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    setSubmitError(null)
    setSubmitMessage(null)

    if (!canFetchLive || !liveProfile) {
      setLiveRows(null)
      setLiveGoalSheetId(null)
      setCheckInData(createMockEntries(activeQuarter))
      setIsLoading(false)
      return
    }

    let cancelled = false
    const employeeProfile = liveProfile

    async function loadCheckIns() {
      setIsLoading(true)
      const result = await getEmployeeQuarterlyCheckIns(
        employeeProfile.id,
        activeCycle.id,
        dbQuarter
      )

      if (cancelled) return

      if (result && result.rows.length > 0) {
        setLiveRows(result.rows)
        setLiveGoalSheetId(result.goalSheetId)
        setCheckInData(createLiveEntries(result.rows))
      } else {
        setLiveRows(null)
        setLiveGoalSheetId(null)
        setCheckInData(createMockEntries(activeQuarter))
      }

      setIsLoading(false)
    }

    loadCheckIns()

    return () => {
      cancelled = true
    }
  }, [activeCycle.id, activeQuarter, canFetchLive, dbQuarter, liveProfile])

  const isLiveMode = Boolean(liveRows && liveGoalSheetId && liveProfile)
  const sourceLabel = isLiveMode ? 'Live Supabase check-ins' : 'Demo check-ins'

  const displayRows = useMemo(() => {
    if (liveRows) {
      return liveRows
    }

    return mockGoals.map((goal) => {
      const existingCheckIn = mockCheckIns.find(
        (checkIn) => checkIn.goalId === goal.id && checkIn.quarter === activeQuarter
      )
      return {
        checkinId: existingCheckIn?.id ?? null,
        goalId: goal.id,
        goalSheetId: 'demo',
        goalTitle: goal.title,
        thrustArea: goal.thrustArea,
        plannedTarget: goal.target,
        actualAchievement: existingCheckIn?.actualAchievement ?? null,
        unitOfMeasurement: goal.unitOfMeasurement,
        computedScore: existingCheckIn?.score ?? null,
        status: existingCheckIn?.status ?? goal.status,
        employeeNote: '',
        submittedAt: existingCheckIn?.submittedAt ?? null,
        managerComments: existingCheckIn?.managerComment
          ? [
              {
                id: `${existingCheckIn.id}-manager-comment`,
                checkinId: existingCheckIn.id,
                managerId: 'u2',
                managerName: 'Manager',
                commentType: 'coaching' as const,
                comment: existingCheckIn.managerComment,
                createdAt: existingCheckIn.submittedAt ?? '',
              },
            ]
          : [],
        goal,
      } satisfies EmployeeQuarterlyCheckInRow
    })
  }, [activeQuarter, liveRows])

  const updateCheckIn = (
    goalId: string,
    field: keyof CheckInEntry,
    value: string | GoalStatus
  ) => {
    setCheckInData((prev) => ({
      ...prev,
      [goalId]: { ...prev[goalId], goalId, [field]: value },
    }))
  }

  const handleSubmit = async () => {
    setSubmitError(null)
    setSubmitMessage(null)

    if (!isQ4Active) {
      return
    }

    if (!isLiveMode || !liveProfile || !liveGoalSheetId) {
      setSubmitMessage('Check-in submitted locally for demo.')
      return
    }

    const result = await submitEmployeeQuarterlyCheckIns({
      employeeId: liveProfile.id,
      goalSheetId: liveGoalSheetId,
      quarter: dbQuarter,
      entries: displayRows.map((row) => {
        const entry = checkInData[row.goalId]
        const actualAchievement =
          entry?.actualAchievement.trim() === ''
            ? null
            : Number(entry?.actualAchievement)
        return {
          goalId: row.goalId,
          plannedTarget: row.plannedTarget,
          actualAchievement,
          status: entry?.status ?? 'not-started',
          employeeNote: entry?.employeeNote,
          uomType: row.unitOfMeasurement as UnitOfMeasurement,
        }
      }),
    })

    if (result.error) {
      setSubmitError(result.error)
      return
    }

    setSubmitMessage(`${activeQuarter} check-in submitted to Supabase.`)
    const refreshed = await getEmployeeQuarterlyCheckIns(
      liveProfile.id,
      activeCycle.id,
      dbQuarter
    )
    if (refreshed) {
      setLiveRows(refreshed.rows)
      setLiveGoalSheetId(refreshed.goalSheetId)
      setCheckInData(createLiveEntries(refreshed.rows))
    }
  }

  return (
    <DashboardLayout role="employee">
      <DashboardHeader
        title="Quarterly Check-ins"
        subtitle={activeCycle.name}
      />

      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                Active Window: Q4 FY26
              </Badge>
              <Badge variant="outline">
                {sourceLabel}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Due Date: <span className="font-medium text-foreground">{dueDate}</span>
            </p>
          </div>
          <Button disabled={!isQ4Active || isLoading} onClick={handleSubmit}>
            <Send className="mr-2 h-4 w-4" />
            Submit Q4 Check-in
          </Button>
        </div>

        {submitError && (
          <Alert className="border-destructive/30 bg-destructive/5">
            <AlertDescription className="text-destructive">
              {submitError}
            </AlertDescription>
          </Alert>
        )}

        {submitMessage && (
          <Alert className="border-success/30 bg-success/5">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <AlertDescription>{submitMessage}</AlertDescription>
          </Alert>
        )}

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

          {(['Q1', 'Q2', 'Q3', 'Q4'] as const).map((quarter) => (
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

              <div className="space-y-4">
                {displayRows.map((row) => {
                  const isEditable = quarter === 'Q4'
                  const currentData = checkInData[row.goalId]
                  const actualValue = isEditable
                    ? (currentData?.actualAchievement ? Number(currentData.actualAchievement) : null)
                    : row.actualAchievement
                  const score = calculateCheckInScore({
                    uomType: row.unitOfMeasurement,
                    plannedTarget: row.plannedTarget,
                    actualAchievement: actualValue,
                  }) ?? row.computedScore

                  return (
                    <Card key={row.goalId} className="border-border/60">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <CardTitle className="text-sm font-semibold">{row.goalTitle}</CardTitle>
                            <CardDescription className="mt-1">
                              {row.thrustArea} | {uomLabels[row.unitOfMeasurement]} | Target: {row.plannedTarget} | Weight: {row.goal.weightage}%
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
                              {row.plannedTarget}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">Actual Achievement</label>
                            {isEditable ? (
                              <Input
                                type="number"
                                placeholder="Enter actual"
                                value={currentData?.actualAchievement || ''}
                                onChange={(e) => updateCheckIn(row.goalId, 'actualAchievement', e.target.value)}
                                className="h-10"
                              />
                            ) : (
                              <div className="h-10 px-3 flex items-center rounded-md border border-border bg-muted/30 text-sm">
                                {row.actualAchievement ?? '-'}
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">Status</label>
                            {isEditable ? (
                              <Select
                                value={currentData?.status || 'not-started'}
                                onValueChange={(value) => updateCheckIn(row.goalId, 'status', value as GoalStatus)}
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
                                <StatusBadge status={row.status} type="goal" />
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

                        {isEditable && (
                          <div className="mt-4 space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">Employee Note</label>
                            <Textarea
                              placeholder="Add context for your manager..."
                              value={currentData?.employeeNote || ''}
                              onChange={(e) => updateCheckIn(row.goalId, 'employeeNote', e.target.value)}
                              rows={2}
                            />
                          </div>
                        )}

                        {row.managerComments.map((comment) => (
                          <div key={comment.id} className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
                            <div className="flex items-center gap-2 mb-1">
                              <MessageSquare className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs font-medium text-muted-foreground">
                                {comment.managerName} Comment
                              </span>
                            </div>
                            <p className="text-sm">{comment.comment}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>

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
