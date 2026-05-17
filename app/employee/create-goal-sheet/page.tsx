'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { mockGoalCycle } from '@/lib/mock-data'
import { getActiveGoalCycle } from '@/lib/data/goal-cycles'
import {
  getCurrentEmployeeGoalSheetWithGoals,
  isEditableGoalSheetStatus,
  saveGoalSheetDraft,
  submitGoalSheet,
} from '@/lib/data/goal-sheets'
import type { GoalSheetGoalInput } from '@/lib/data/goals'
import { isRealUuid } from '@/lib/data/goals'
import { getThrustAreaNames } from '@/lib/data/reference-data'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { useCurrentProfile } from '@/hooks/use-current-profile'
import type { GoalCycle, GoalSheetStatus, UnitOfMeasurement } from '@/lib/types'
import { 
  Plus, 
  Trash2, 
  Save, 
  Send, 
  CheckCircle2, 
  AlertCircle,
  Info,
  ChevronRight,
} from 'lucide-react'

interface DraftGoal {
  id: string
  title: string
  description: string
  thrustArea: string
  unitOfMeasurement: UnitOfMeasurement
  target: string
  targetDate: string
  weightage: string
}

type DraftGoalTextField = Exclude<keyof DraftGoal, 'id' | 'unitOfMeasurement'>

const emptyGoal = (id: string): DraftGoal => ({
  id,
  title: '',
  description: '',
  thrustArea: '',
  unitOfMeasurement: 'numeric-higher-better',
  target: '',
  targetDate: '',
  weightage: '',
})

const steps = [
  { id: 1, name: 'Draft Goals', description: 'Create your goals' },
  { id: 2, name: 'Validate Weightage', description: 'Ensure 100% total' },
  { id: 3, name: 'Submit for Approval', description: 'Send to manager' },
  { id: 4, name: 'Manager Review', description: 'Await approval' },
]

const uomOptions = [
  { value: 'numeric-higher-better', label: 'Numeric - Higher is Better' },
  { value: 'numeric-lower-better', label: 'Numeric - Lower is Better' },
  { value: 'percentage-higher-better', label: 'Percentage - Higher is Better' },
  { value: 'percentage-lower-better', label: 'Percentage - Lower is Better' },
  { value: 'timeline', label: 'Timeline' },
  { value: 'zero-based', label: 'Zero Based' },
]

function toGoalInputs(goals: DraftGoal[]): GoalSheetGoalInput[] {
  return goals
    .filter((g) => g.title.trim())
    .map((g) => ({
      title: g.title.trim(),
      description: g.description,
      thrustArea: g.thrustArea,
      unitOfMeasurement: g.unitOfMeasurement,
      target:
        g.unitOfMeasurement === 'timeline' || g.unitOfMeasurement === 'zero-based'
          ? 0
          : parseFloat(g.target) || 0,
      targetDate: g.unitOfMeasurement === 'timeline' ? g.targetDate : null,
      weightage: parseInt(g.weightage, 10) || 0,
    }))
}

function isPercentageUom(uom: UnitOfMeasurement) {
  return (
    uom === 'percentage' ||
    uom === 'percentage-higher-better' ||
    uom === 'percentage-lower-better'
  )
}

function hasValidTarget(goal: DraftGoal, cycle: GoalCycle | null) {
  if (goal.unitOfMeasurement === 'timeline') {
    if (!goal.targetDate || Number.isNaN(Date.parse(goal.targetDate))) {
      return false
    }
    if (!cycle) {
      return true
    }
    return goal.targetDate >= cycle.startDate && goal.targetDate <= cycle.endDate
  }

  if (goal.unitOfMeasurement === 'zero-based') {
    return goal.target === '0'
  }

  if (!goal.target.trim() || Number.isNaN(Number(goal.target))) {
    return false
  }

  const target = Number(goal.target)
  if (target < 0) {
    return false
  }

  return !isPercentageUom(goal.unitOfMeasurement) || target <= 100
}

function normalizeGoalSheetStatus(status: string): GoalSheetStatus {
  if (status === 'pending_approval') return 'pending-approval'
  if (status === 'rework_required') return 'rework-required'
  if (status === 'final_closed') return 'final-closed'
  return status as GoalSheetStatus
}

export default function CreateGoalSheetPage() {
  const { liveProfile, error: profileError } = useCurrentProfile()
  const [activeCycle, setActiveCycle] = useState<GoalCycle | null>(
    isSupabaseConfigured() ? null : mockGoalCycle
  )
  const [thrustAreaOptions, setThrustAreaOptions] = useState<string[]>([])
  const [currentStep, setCurrentStep] = useState(1)
  const [goals, setGoals] = useState<DraftGoal[]>([emptyGoal('draft-1')])
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [nextDraftId, setNextDraftId] = useState(2)
  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingSheet, setIsLoadingSheet] = useState(false)
  const [goalSheetStatus, setGoalSheetStatus] = useState<GoalSheetStatus>('draft')
  const [managerFeedback, setManagerFeedback] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const employeeId = liveProfile?.id
  const managerId = liveProfile?.managerId ?? null
  const managerName = liveProfile?.managerName ?? 'Not assigned'
  const canPersistToSupabase = Boolean(
    isSupabaseConfigured() &&
      liveProfile &&
      employeeId &&
      managerId &&
      activeCycle &&
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
    if (
      !isSupabaseConfigured() ||
      !liveProfile ||
      !activeCycle ||
      !isRealUuid(liveProfile.id) ||
      !isRealUuid(activeCycle.id)
    ) {
      return
    }

    let cancelled = false
    const employeeProfile = liveProfile
    const cycle = activeCycle
    async function loadExistingSheet() {
      setIsLoadingSheet(true)
      const result = await getCurrentEmployeeGoalSheetWithGoals({
        employeeId: employeeProfile.id,
        cycleId: cycle.id,
        employeeName: employeeProfile.name,
        department: employeeProfile.department,
        managerName: employeeProfile.managerName,
        cycleName: cycle.name,
      })

      if (cancelled) return

      if (result) {
        setGoals(
          result.goals.length > 0
            ? result.goals.map((goal) => ({
                id: goal.id,
                title: goal.title,
                description: goal.description,
                thrustArea: goal.thrustArea === '—' ? '' : goal.thrustArea,
                unitOfMeasurement: goal.unitOfMeasurement,
                target:
                  goal.unitOfMeasurement === 'timeline'
                    ? ''
                    : goal.unitOfMeasurement === 'zero-based'
                      ? '0'
                      : goal.target.toString(),
                targetDate: goal.targetDate ?? '',
                weightage: goal.weightage.toString(),
              }))
            : [emptyGoal('draft-1')]
        )
        setNextDraftId(Math.max(result.goals.length + 1, 2))
        setGoalSheetStatus(result.goalSheet.status)
        setManagerFeedback(result.goalSheet.managerComments)
        setIsSubmitted(!isEditableGoalSheetStatus(result.goalSheet.status))
        setCurrentStep(isEditableGoalSheetStatus(result.goalSheet.status) ? 1 : 4)
      }

      setIsLoadingSheet(false)
    }

    loadExistingSheet()

    return () => {
      cancelled = true
    }
  }, [activeCycle, liveProfile])

  useEffect(() => {
    let cancelled = false
    getThrustAreaNames().then((areas) => {
      if (!cancelled) {
        setThrustAreaOptions(areas)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  const isReadOnly = !isEditableGoalSheetStatus(goalSheetStatus)

  const totalWeightage = goals.reduce((sum, g) => sum + (parseInt(g.weightage, 10) || 0), 0)
  const goalsCount = goals.filter((g) => g.title.trim()).length

  const validationErrors = {
    weightageNot100: totalWeightage !== 100 && goalsCount > 0,
    maxGoalsExceeded: goals.length > 8,
    minWeightageBreach: goals.some(
      (g) => parseInt(g.weightage, 10) > 0 && parseInt(g.weightage, 10) < 10
    ),
    incompleteGoals: goals.some((g) => {
      if (!g.title.trim()) {
        return false
      }
      return !g.thrustArea || !g.weightage || !hasValidTarget(g, activeCycle)
    }),
    invalidTargets: goals.some(
      (g) => g.title.trim() && !hasValidTarget(g, activeCycle)
    ),
  }

  const isValid =
    !validationErrors.weightageNot100 &&
    !validationErrors.maxGoalsExceeded &&
    !validationErrors.minWeightageBreach &&
    !validationErrors.incompleteGoals &&
    !validationErrors.invalidTargets &&
    goalsCount >= 1

  const addGoal = () => {
    if (goals.length < 8 && !isReadOnly) {
      setGoals((currentGoals) => [
        ...currentGoals,
        emptyGoal(`draft-${nextDraftId}`),
      ])
      setNextDraftId((current) => current + 1)
    }
  }

  const removeGoalAt = (goalIndex: number) => {
    if (isReadOnly) return
    setGoals((currentGoals) =>
      currentGoals.length > 1
        ? currentGoals.filter((_, index) => index !== goalIndex)
        : currentGoals
    )
  }

  const updateGoalAt = (goalIndex: number, getNextGoal: (goal: DraftGoal) => DraftGoal) => {
    if (isReadOnly) return
    setGoals((currentGoals) =>
      currentGoals.map((goal, index) => (index === goalIndex ? getNextGoal(goal) : goal))
    )
  }

  const updateGoalFieldAt = (
    goalIndex: number,
    field: DraftGoalTextField,
    value: string
  ) => {
    updateGoalAt(goalIndex, (goal) => ({ ...goal, [field]: value }))
  }

  const updateGoalUnitAt = (goalIndex: number, unitOfMeasurement: UnitOfMeasurement) => {
    updateGoalAt(goalIndex, (goal) => ({
      ...goal,
      unitOfMeasurement,
      target:
        unitOfMeasurement === 'zero-based'
          ? '0'
          : unitOfMeasurement === 'timeline'
            ? ''
            : goal.target,
      targetDate: unitOfMeasurement === 'timeline' ? goal.targetDate : '',
    }))
  }

  const handleSaveDraft = async () => {
    setErrorMessage(null)
    setStatusMessage(null)

    if (canPersistToSupabase && employeeId && activeCycle) {
      setIsSaving(true)
      try {
        const result = await saveGoalSheetDraft({
          employeeId,
          managerId: managerId ?? null,
          cycleId: activeCycle.id,
          goals: toGoalInputs(goals),
        })

        if (result.error) {
          setErrorMessage(result.error)
          return
        }

        if (result.goalSheet) {
          setGoalSheetStatus(normalizeGoalSheetStatus(result.goalSheet.status))
          setIsSubmitted(false)
        }
        setStatusMessage('Draft saved to Supabase.')
      } finally {
        setIsSaving(false)
      }
      return
    }

    if (isSupabaseConfigured()) {
      if (!liveProfile) {
        setErrorMessage(profileError ?? 'No profile found for this signed-in user.')
        return
      }
      if (!activeCycle) {
        setErrorMessage('No active goal cycle is configured.')
        return
      }
      if (!managerId) {
        setErrorMessage('No manager is assigned to your profile. Please contact Admin/HR.')
        return
      }
    }

    setStatusMessage('Draft saved locally for demo.')
  }

  const handleSubmit = async () => {
    setErrorMessage(null)
    setStatusMessage(null)

    if (!isValid) {
      setErrorMessage('Please fix validation errors before submitting.')
      return
    }

    if (canPersistToSupabase && employeeId && activeCycle) {
      setIsSubmitting(true)
      try {
        const result = await submitGoalSheet({
          employeeId,
          managerId: managerId ?? null,
          cycleId: activeCycle.id,
          goals: toGoalInputs(goals),
        })

        if (result.error) {
          setErrorMessage(result.error)
          return
        }

        setGoalSheetStatus('pending-approval')
        setIsSubmitted(true)
        setCurrentStep(4)
        setManagerFeedback(null)
        setStatusMessage('Goal sheet submitted for manager approval.')
      } finally {
        setIsSubmitting(false)
      }
      return
    }

    if (isSupabaseConfigured()) {
      if (!liveProfile) {
        setErrorMessage(profileError ?? 'No profile found for this signed-in user.')
        return
      }
      if (!activeCycle) {
        setErrorMessage('No active goal cycle is configured.')
        return
      }
      if (!managerId) {
        setErrorMessage('No manager is assigned to your profile. Please contact Admin/HR.')
        return
      }
    }

    setCurrentStep(4)
    setGoalSheetStatus('pending-approval')
    setIsSubmitted(true)
    setStatusMessage('Goal sheet submitted locally for demo.')
  }

  const statusBadge =
    goalSheetStatus === 'approved' ||
    goalSheetStatus === 'locked' ||
    goalSheetStatus === 'final-closed' ? (
    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
      Locked
    </Badge>
  ) : goalSheetStatus === 'pending-approval' || goalSheetStatus === 'submitted' ? (
    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
      Pending Approval
    </Badge>
  ) : goalSheetStatus === 'returned' ||
    goalSheetStatus === 'rejected' ||
    goalSheetStatus === 'rework-required' ? (
    <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
      Returned for Rework
    </Badge>
  ) : (
    <Badge variant="outline" className="bg-warning/10 text-warning-foreground border-warning/20">
      Draft
    </Badge>
  )

  return (
    <DashboardLayout role="employee">
      <DashboardHeader title="Create Goal Sheet" subtitle={activeCycle?.name ?? 'No active cycle'} />

      <div className="space-y-6 p-4 sm:p-6">
        {statusMessage && (
          <Alert className="border-success/30 bg-success/5">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <AlertDescription className="text-success">{statusMessage}</AlertDescription>
          </Alert>
        )}

        {errorMessage && (
          <Alert className="border-destructive/30 bg-destructive/5">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">{errorMessage}</AlertDescription>
          </Alert>
        )}

        {isEditableGoalSheetStatus(goalSheetStatus) && managerFeedback && (
          <Alert className="border-destructive/30 bg-destructive/5">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">
              <span className="font-medium">Manager feedback:</span>{' '}
              {managerFeedback}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col gap-4 rounded-lg border border-primary/10 bg-gradient-to-br from-primary/10 via-card/90 to-success/10 p-5 shadow-sm shadow-primary/10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              {statusBadge}
              <span className="text-sm text-muted-foreground">
                Cycle: {activeCycle?.name ?? 'No active cycle'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Manager: <span className="font-medium text-foreground">{managerName}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={isReadOnly || isSaving || isLoadingSheet}
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Draft'}
            </Button>
            <Button
              disabled={!isValid || isReadOnly || isSubmitting || isLoadingSheet}
              onClick={handleSubmit}
            >
              <Send className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
            </Button>
          </div>
        </div>

        <Card className="border-border/60 bg-card/90">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className="flex items-center gap-3">
                    <div
                      className={`
                      flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium shadow-sm transition-all
                      ${step.id < currentStep
                          ? 'bg-success text-success-foreground shadow-success/20'
                          : step.id === currentStep
                            ? 'bg-primary text-primary-foreground shadow-primary/25'
                            : 'bg-muted text-muted-foreground'}
                    `}
                    >
                      {step.id < currentStep ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        step.id
                      )}
                    </div>
                    <div className="hidden sm:block">
                      <p
                        className={`text-sm font-medium ${step.id === currentStep ? 'text-foreground' : 'text-muted-foreground'}`}
                      >
                        {step.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <ChevronRight className="h-4 w-4 text-muted-foreground mx-4 hidden sm:block" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className={`border-border/60 bg-card/90 ${isValid ? 'border-success/50 bg-gradient-to-br from-success/10 via-card to-card' : 'bg-gradient-to-br from-warning/10 via-card to-card'}`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              {isValid ? (
                <CheckCircle2 className="h-5 w-5 text-success" />
              ) : (
                <AlertCircle className="h-5 w-5 text-warning-foreground" />
              )}
              Validation Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center gap-3">
                <div
                  className={`
                  flex h-10 w-10 items-center justify-center rounded-lg shadow-sm
                  ${totalWeightage === 100 ? 'bg-success/10 text-success shadow-success/10' : 'bg-warning/10 text-warning-foreground shadow-warning/10'}
                `}
                >
                  <span className="text-sm font-semibold">{totalWeightage}%</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Total Weightage</p>
                  <p className="text-xs text-muted-foreground">Must equal 100%</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className={`
                  flex h-10 w-10 items-center justify-center rounded-lg shadow-sm
                  ${goalsCount >= 1 && goalsCount <= 8 ? 'bg-success/10 text-success shadow-success/10' : 'bg-warning/10 text-warning-foreground shadow-warning/10'}
                `}
                >
                  <span className="text-sm font-semibold">{goalsCount}/8</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Goals Count</p>
                  <p className="text-xs text-muted-foreground">Max 8 goals</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className={`
                  flex h-10 w-10 items-center justify-center rounded-lg shadow-sm
                  ${!validationErrors.minWeightageBreach ? 'bg-success/10 text-success shadow-success/10' : 'bg-destructive/10 text-destructive shadow-destructive/10'}
                `}
                >
                  {!validationErrors.minWeightageBreach ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">Min Weightage</p>
                  <p className="text-xs text-muted-foreground">10% per goal</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className={`
                  flex h-10 w-10 items-center justify-center rounded-lg shadow-sm
                  ${!validationErrors.incompleteGoals ? 'bg-success/10 text-success shadow-success/10' : 'bg-warning/10 text-warning-foreground shadow-warning/10'}
                `}
                >
                  {!validationErrors.incompleteGoals ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">All Fields</p>
                  <p className="text-xs text-muted-foreground">Complete required</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {goals.map((goal, index) => (
            <Card key={goal.id} className="border-border/60 bg-card/95">
              <CardHeader className="border-b border-border/60 bg-gradient-to-r from-primary/5 via-transparent to-success/5 pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">Goal {index + 1}</CardTitle>
                  {goals.length > 1 && !isReadOnly && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => removeGoalAt(index)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`title-${goal.id}`}>Goal Title *</Label>
                    <Input
                      id={`title-${goal.id}`}
                      placeholder="e.g., Improve API response time by 40%"
                      value={goal.title}
                      onChange={(e) => updateGoalFieldAt(index, 'title', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`thrust-${goal.id}`}>Thrust Area *</Label>
                    <Select
                      value={goal.thrustArea}
                      onValueChange={(value) => updateGoalFieldAt(index, 'thrustArea', value)}
                      disabled={isReadOnly}
                    >
                      <SelectTrigger id={`thrust-${goal.id}`}>
                        <SelectValue placeholder="Select thrust area" />
                      </SelectTrigger>
                      <SelectContent>
                        {thrustAreaOptions.map((area) => (
                          <SelectItem key={area} value={area}>
                            {area}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`desc-${goal.id}`}>Description</Label>
                  <Textarea
                    id={`desc-${goal.id}`}
                    placeholder="Describe the goal and success criteria..."
                    value={goal.description}
                    onChange={(e) => updateGoalFieldAt(index, 'description', e.target.value)}
                    rows={2}
                    disabled={isReadOnly}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor={`uom-${goal.id}`}>Unit of Measurement *</Label>
                    <Select
                      value={goal.unitOfMeasurement}
                      onValueChange={(value) =>
                        updateGoalUnitAt(index, value as UnitOfMeasurement)
                      }
                      disabled={isReadOnly}
                    >
                      <SelectTrigger id={`uom-${goal.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {uomOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`target-${goal.id}`}>Target *</Label>
                    {goal.unitOfMeasurement === 'timeline' ? (
                      <Input
                        id={`target-${goal.id}`}
                        type="date"
                        min={activeCycle?.startDate}
                        max={activeCycle?.endDate}
                        value={goal.targetDate}
                        onChange={(e) => updateGoalFieldAt(index, 'targetDate', e.target.value)}
                        disabled={isReadOnly}
                        className={!hasValidTarget(goal, activeCycle) && goal.title.trim() ? 'border-destructive' : ''}
                      />
                    ) : (
                      <Input
                        id={`target-${goal.id}`}
                        type="number"
                        placeholder={goal.unitOfMeasurement === 'zero-based' ? '0' : 'e.g., 40'}
                        min={0}
                        max={isPercentageUom(goal.unitOfMeasurement) ? 100 : undefined}
                        value={goal.unitOfMeasurement === 'zero-based' ? '0' : goal.target}
                        onChange={(e) => updateGoalFieldAt(index, 'target', e.target.value)}
                        disabled={isReadOnly || goal.unitOfMeasurement === 'zero-based'}
                        readOnly={goal.unitOfMeasurement === 'zero-based'}
                        className={!hasValidTarget(goal, activeCycle) && goal.title.trim() ? 'border-destructive' : ''}
                      />
                    )}
                    {goal.title.trim() && !hasValidTarget(goal, activeCycle) && (
                      <p className="text-xs text-destructive">
                        {goal.unitOfMeasurement === 'timeline'
                          ? activeCycle
                            ? `Choose a date within ${activeCycle.startDate} and ${activeCycle.endDate}.`
                            : 'Choose a valid target date.'
                          : goal.unitOfMeasurement === 'zero-based'
                            ? 'Zero-based goals must use target 0.'
                            : isPercentageUom(goal.unitOfMeasurement)
                              ? 'Percentage targets must be between 0 and 100.'
                              : 'Target cannot be negative.'}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`weight-${goal.id}`}>Weightage % *</Label>
                    <Input
                      id={`weight-${goal.id}`}
                      type="number"
                      placeholder="e.g., 20"
                      min={10}
                      max={100}
                      value={goal.weightage}
                      onChange={(e) => updateGoalFieldAt(index, 'weightage', e.target.value)}
                      disabled={isReadOnly}
                      className={
                        parseInt(goal.weightage, 10) > 0 && parseInt(goal.weightage, 10) < 10
                          ? 'border-destructive'
                          : ''
                      }
                    />
                    {parseInt(goal.weightage, 10) > 0 && parseInt(goal.weightage, 10) < 10 && (
                      <p className="text-xs text-destructive">Minimum 10% required</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {goals.length < 8 && !isReadOnly && (
          <Button variant="outline" className="w-full border-dashed" onClick={addGoal}>
            <Plus className="mr-2 h-4 w-4" />
            Add Goal ({goals.length}/8)
          </Button>
        )}

        <Card className="border-border/60 bg-gradient-to-br from-muted/50 via-card to-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              Score Formula Reference
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
                <p className="text-xs text-muted-foreground mt-1">Score = Completion vs Deadline</p>
              </div>
              <div className="p-3 rounded-lg bg-background border border-border">
                <p className="font-medium text-foreground">Zero Based</p>
                <p className="text-xs text-muted-foreground mt-1">0 = Success, else penalty</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
