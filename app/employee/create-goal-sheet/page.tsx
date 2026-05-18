'use client'

import { useEffect, useMemo, useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { useToast } from '@/hooks/use-toast'
import { useCurrentProfile } from '@/hooks/use-current-profile'
import { mockGoalCycle } from '@/lib/mock-data'
import { getActiveGoalCycle } from '@/lib/data/goal-cycles'
import {
  getCurrentEmployeeGoalSheetWithGoals,
  getOrCreateCurrentGoalSheet,
  saveGoalSheetDraft,
  submitGoalSheet,
  type GoalSheetRecord,
} from '@/lib/data/goal-sheets'
import type { GoalSheetGoalInput } from '@/lib/data/goals'
import { isRealUuid } from '@/lib/data/goals'
import { getThrustAreaNames } from '@/lib/data/reference-data'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import type { Goal, GoalCycle, UnitOfMeasurement } from '@/lib/types'
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

type DraftGoal = {
  id: string
  title: string
  description: string
  thrustArea: string
  unitOfMeasurement: UnitOfMeasurement
  target: string
  targetDate: string
  weightage: string
  isShared?: boolean
}

type DraftGoalTextField = Exclude<keyof DraftGoal, 'id' | 'unitOfMeasurement' | 'isShared'>

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

const uomOptions: Array<{ value: UnitOfMeasurement; label: string }> = [
  { value: 'numeric-higher-better', label: 'Numeric - Higher is Better' },
  { value: 'numeric-lower-better', label: 'Numeric - Lower is Better' },
  { value: 'percentage-higher-better', label: 'Percentage - Higher is Better' },
  { value: 'percentage-lower-better', label: 'Percentage - Lower is Better' },
  { value: 'timeline', label: 'Timeline' },
  { value: 'zero-based', label: 'Zero Based' },
]

function normalizeSheetStatus(status: string | null | undefined): string {
  if (status === 'pending_approval') return 'pending-approval'
  if (status === 'final_closed') return 'final-closed'
  return status ?? 'draft'
}

function isPercentageUom(uom: UnitOfMeasurement) {
  return (
    uom === 'percentage' ||
    uom === 'percentage-higher-better' ||
    uom === 'percentage-lower-better'
  )
}

function draftGoalsFromGoals(goals: Goal[]): DraftGoal[] {
  if (goals.length === 0) {
    return [emptyGoal('draft-1')]
  }

  return goals.map((goal) => ({
    id: goal.id,
    title: goal.title,
    description: goal.description,
    thrustArea: goal.thrustArea === 'â€”' ? '' : goal.thrustArea,
    unitOfMeasurement: goal.unitOfMeasurement,
    target:
      goal.unitOfMeasurement === 'timeline'
        ? ''
        : goal.unitOfMeasurement === 'zero-based'
          ? '0'
          : goal.target.toString(),
    targetDate: goal.targetDate ?? '',
    weightage: goal.weightage.toString(),
    isShared: goal.isShared ?? false,
  }))
}

function toGoalInputs(goals: DraftGoal[]): GoalSheetGoalInput[] {
  return goals
    .filter((goal) => goal.title.trim())
    .map((goal) => ({
      title: goal.title.trim(),
      description: goal.description,
      thrustArea: goal.thrustArea,
      unitOfMeasurement: goal.unitOfMeasurement,
      target:
        goal.unitOfMeasurement === 'timeline' || goal.unitOfMeasurement === 'zero-based'
          ? 0
          : parseFloat(goal.target) || 0,
      targetDate: goal.unitOfMeasurement === 'timeline' ? goal.targetDate : null,
      weightage: parseInt(goal.weightage, 10) || 0,
      isShared: goal.isShared ?? false,
    }))
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

export default function CreateGoalSheetPage() {
  const { liveProfile, error: profileError } = useCurrentProfile()
  const { toast } = useToast()
  const [activeCycle, setActiveCycle] = useState<GoalCycle | null>(
    isSupabaseConfigured() ? null : mockGoalCycle
  )
  const [thrustAreaOptions, setThrustAreaOptions] = useState<string[]>([])
  const [goals, setGoals] = useState<DraftGoal[]>([emptyGoal('draft-1')])
  const [nextDraftId, setNextDraftId] = useState(2)
  const [goalSheetId, setGoalSheetId] = useState<string | null>(null)
  const [goalSheetStatus, setGoalSheetStatus] = useState<string>('draft')
  const [goalSheetIsLocked, setGoalSheetIsLocked] = useState(false)
  const [unlockedAt, setUnlockedAt] = useState<string | null>(null)
  const [unlockReason, setUnlockReason] = useState<string | null>(null)
  const [managerFeedback, setManagerFeedback] = useState<string | null>(null)
  const [isLoadingSheet, setIsLoadingSheet] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const employeeId = liveProfile?.id
  const managerId = liveProfile?.managerId ?? null
  const managerName = liveProfile?.managerName ?? 'Not assigned'
  const canPersistToSupabase = Boolean(
    isSupabaseConfigured() &&
      liveProfile &&
      employeeId &&
      activeCycle &&
      isRealUuid(activeCycle.id) &&
      isRealUuid(liveProfile.id)
  )

  const isAdminUnlockedForRework = Boolean(unlockedAt)
  const isSubmittedOrApproved = [
    'submitted',
    'pending_approval',
    'pending-approval',
    'approved',
    'locked',
  ].includes(goalSheetStatus)
  const canEdit = goalSheetStatus === 'draft' && goalSheetIsLocked === false
  const isReadOnly = !canEdit
  const currentStep = canEdit ? 1 : isSubmittedOrApproved ? 4 : 1

  useEffect(() => {
    let cancelled = false
    getActiveGoalCycle()
      .then((cycle) => {
        if (!cancelled) {
          setActiveCycle(cycle)
        }
      })
      .catch((err) => {
        if (process.env.NODE_ENV === 'development') {
          console.error('[employee create goal sheet] active cycle load failed:', err)
        }
        if (!cancelled) {
          setErrorMessage('Could not load the active goal cycle.')
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    getThrustAreaNames()
      .then((areas) => {
        if (!cancelled) {
          setThrustAreaOptions(areas)
        }
      })
      .catch((err) => {
        if (process.env.NODE_ENV === 'development') {
          console.error('[employee create goal sheet] thrust areas load failed:', err)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      return
    }

    if (!liveProfile || !activeCycle) {
      return
    }

    if (!isRealUuid(liveProfile.id) || !isRealUuid(activeCycle.id)) {
      setErrorMessage('Could not load your live goal sheet because the profile or cycle id is invalid.')
      return
    }

    let cancelled = false
    const employeeProfile = liveProfile
    const cycle = activeCycle

    async function loadGoalSheet() {
      setIsLoadingSheet(true)
      setErrorMessage(null)

      try {
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
          setGoalSheetId(result.goalSheet.id)
          setGoalSheetStatus(normalizeSheetStatus(result.goalSheet.status))
          setGoalSheetIsLocked(Boolean(result.goalSheet.isLocked))
          setUnlockedAt(result.goalSheet.unlockedAt ?? null)
          setUnlockReason(result.goalSheet.unlockReason ?? null)
          setManagerFeedback(result.goalSheet.managerComments)
          setGoals(draftGoalsFromGoals(result.goals))
          setNextDraftId(Math.max(result.goals.length + 1, 2))
          return
        }

        const createdSheet = await getOrCreateCurrentGoalSheet(
          employeeProfile.id,
          cycle.id,
          employeeProfile.managerId ?? null
        )

        if (cancelled) return

        if (!createdSheet) {
          setErrorMessage('Could not load or create your draft goal sheet.')
          return
        }

        setGoalSheetId(createdSheet.id)
        setGoalSheetStatus(normalizeSheetStatus(createdSheet.status))
        setGoalSheetIsLocked(Boolean(createdSheet.isLocked))
        setUnlockedAt(createdSheet.unlockedAt)
        setUnlockReason(createdSheet.unlockReason)
        setManagerFeedback(createdSheet.managerComment)
        setGoals([emptyGoal('draft-1')])
        setNextDraftId(2)
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[employee create goal sheet] load failed:', err)
        }
        if (!cancelled) {
          setErrorMessage(
            err instanceof Error ? err.message : 'Could not load your goal sheet.'
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoadingSheet(false)
        }
      }
    }

    loadGoalSheet()

    return () => {
      cancelled = true
    }
  }, [activeCycle, liveProfile])

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[employee create goal sheet]', {
        goalSheetId,
        goalSheetStatus,
        goalSheetIsLocked,
        unlockedAt,
        unlockReason,
        canEdit,
        isReadOnly,
      })
    }
  }, [canEdit, goalSheetId, goalSheetIsLocked, goalSheetStatus, isReadOnly, unlockReason, unlockedAt])

  const totalWeightage = useMemo(
    () => goals.reduce((sum, goal) => sum + (parseInt(goal.weightage, 10) || 0), 0),
    [goals]
  )
  const goalsCount = goals.filter((goal) => goal.title.trim()).length
  const validationErrors = {
    weightageNot100: totalWeightage !== 100 && goalsCount > 0,
    maxGoalsExceeded: goals.length > 8,
    minWeightageBreach: goals.some(
      (goal) => parseInt(goal.weightage, 10) > 0 && parseInt(goal.weightage, 10) < 10
    ),
    incompleteGoals: goals.some((goal) => {
      if (!goal.title.trim()) {
        return false
      }
      return !goal.thrustArea || !goal.weightage || !hasValidTarget(goal, activeCycle)
    }),
    invalidTargets: goals.some(
      (goal) => goal.title.trim() && !hasValidTarget(goal, activeCycle)
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
    if (isReadOnly || goals.length >= 8) return
    setGoals((currentGoals) => [...currentGoals, emptyGoal(`draft-${nextDraftId}`)])
    setNextDraftId((current) => current + 1)
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

  const updateSheetFromRecord = (sheet: GoalSheetRecord) => {
    setGoalSheetId(sheet.id)
    setGoalSheetStatus(normalizeSheetStatus(sheet.status))
    setGoalSheetIsLocked(Boolean(sheet.isLocked))
    setUnlockedAt(sheet.unlockedAt)
    setUnlockReason(sheet.unlockReason)
  }

  const handleSaveDraft = async () => {
    setErrorMessage(null)
    setStatusMessage(null)

    if (!canEdit) {
      setErrorMessage('This goal sheet is not editable.')
      return
    }

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
          updateSheetFromRecord(result.goalSheet)
        }

        setStatusMessage('Draft saved to Supabase.')
        toast({ title: 'Draft saved', description: 'Your goal sheet draft was saved.' })
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[employee create goal sheet] save draft failed:', err)
        }
        setErrorMessage(err instanceof Error ? err.message : 'Could not save draft.')
      } finally {
        setIsSaving(false)
      }
      return
    }

    if (isSupabaseConfigured()) {
      setErrorMessage(
        profileError ??
          (!activeCycle
            ? 'No active goal cycle is configured.'
            : 'No live employee profile was found for this signed-in user.')
      )
      return
    }

    setStatusMessage('Draft saved locally for demo.')
    toast({ title: 'Draft saved', description: 'Your local draft was saved.' })
  }

  const handleSubmit = async () => {
    setErrorMessage(null)
    setStatusMessage(null)

    if (!canEdit) {
      setErrorMessage('This goal sheet is not editable.')
      return
    }

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

        if (result.goalSheet) {
          updateSheetFromRecord(result.goalSheet)
        } else {
          setGoalSheetStatus('submitted')
          setGoalSheetIsLocked(false)
        }

        setManagerFeedback(null)
        setStatusMessage('Goal sheet submitted for manager approval.')
        toast({
          title: isAdminUnlockedForRework ? 'Goal sheet resubmitted' : 'Goal sheet submitted',
          description: 'Your manager can now review this goal sheet.',
        })
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[employee create goal sheet] submit failed:', err)
        }
        setErrorMessage(err instanceof Error ? err.message : 'Could not submit goal sheet.')
      } finally {
        setIsSubmitting(false)
      }
      return
    }

    if (isSupabaseConfigured()) {
      setErrorMessage(
        profileError ??
          (!activeCycle
            ? 'No active goal cycle is configured.'
            : 'No live employee profile was found for this signed-in user.')
      )
      return
    }

    setGoalSheetStatus('submitted')
    setGoalSheetIsLocked(false)
    setStatusMessage('Goal sheet submitted locally for demo.')
  }

  const statusBadge = goalSheetIsLocked || goalSheetStatus === 'locked' ? (
    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
      Locked
    </Badge>
  ) : isAdminUnlockedForRework ? (
    <Badge variant="outline" className="bg-warning/10 text-warning-foreground border-warning/20">
      Unlocked for Rework
    </Badge>
  ) : ['submitted', 'pending_approval', 'pending-approval'].includes(goalSheetStatus) ? (
    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
      Submitted for Approval
    </Badge>
  ) : goalSheetStatus === 'draft' ? (
    <Badge variant="outline" className="bg-warning/10 text-warning-foreground border-warning/20">
      Draft
    </Badge>
  ) : (
    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
      {goalSheetStatus === 'approved' ? 'Approved' : 'Draft'}
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

        {managerFeedback && canEdit && !isAdminUnlockedForRework && (
          <Alert className="border-destructive/30 bg-destructive/5">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">
              <span className="font-medium">Manager feedback:</span> {managerFeedback}
            </AlertDescription>
          </Alert>
        )}

        {isAdminUnlockedForRework && !goalSheetIsLocked && (
          <Alert className="border-warning/30 bg-warning/5">
            <Info className="h-4 w-4 text-warning-foreground" />
            <AlertDescription className="text-warning-foreground">
              Admin unlocked this goal sheet for rework. Edit and resubmit for manager approval.
              {unlockReason && <span className="mt-1 block">Reason: {unlockReason}</span>}
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
              disabled={!canEdit || isSaving || isLoadingSheet}
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Draft'}
            </Button>
            <Button
              disabled={!canEdit || !isValid || isSubmitting || isLoadingSheet}
              onClick={handleSubmit}
            >
              <Send className="mr-2 h-4 w-4" />
              {isSubmitting
                ? 'Submitting...'
                : isAdminUnlockedForRework
                  ? 'Resubmit for Approval'
                  : 'Submit for Approval'}
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
                      ${
                        step.id < currentStep
                          ? 'bg-success text-success-foreground shadow-success/20'
                          : step.id === currentStep
                            ? 'bg-primary text-primary-foreground shadow-primary/25'
                            : 'bg-muted text-muted-foreground'
                      }
                    `}
                    >
                      {step.id < currentStep ? <CheckCircle2 className="h-4 w-4" /> : step.id}
                    </div>
                    <div className="hidden sm:block">
                      <p
                        className={`text-sm font-medium ${
                          step.id === currentStep ? 'text-foreground' : 'text-muted-foreground'
                        }`}
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

        <Card
          className={`border-border/60 bg-card/90 ${
            isValid
              ? 'border-success/50 bg-gradient-to-br from-success/10 via-card to-card'
              : 'bg-gradient-to-br from-warning/10 via-card to-card'
          }`}
        >
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
                  className={`flex h-10 w-10 items-center justify-center rounded-lg shadow-sm ${
                    totalWeightage === 100
                      ? 'bg-success/10 text-success shadow-success/10'
                      : 'bg-warning/10 text-warning-foreground shadow-warning/10'
                  }`}
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
                  className={`flex h-10 w-10 items-center justify-center rounded-lg shadow-sm ${
                    goalsCount >= 1 && goalsCount <= 8
                      ? 'bg-success/10 text-success shadow-success/10'
                      : 'bg-warning/10 text-warning-foreground shadow-warning/10'
                  }`}
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
                  className={`flex h-10 w-10 items-center justify-center rounded-lg shadow-sm ${
                    !validationErrors.minWeightageBreach
                      ? 'bg-success/10 text-success shadow-success/10'
                      : 'bg-destructive/10 text-destructive shadow-destructive/10'
                  }`}
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
                  className={`flex h-10 w-10 items-center justify-center rounded-lg shadow-sm ${
                    !validationErrors.incompleteGoals
                      ? 'bg-success/10 text-success shadow-success/10'
                      : 'bg-warning/10 text-warning-foreground shadow-warning/10'
                  }`}
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
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-semibold">Goal {index + 1}</CardTitle>
                    {goal.isShared && (
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/25">
                        Shared read-only
                      </Badge>
                    )}
                  </div>
                  {goals.length > 1 && canEdit && (
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
                      onChange={(event) => updateGoalFieldAt(index, 'title', event.target.value)}
                      disabled={isReadOnly || goal.isShared}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`thrust-${goal.id}`}>Thrust Area *</Label>
                    <Select
                      value={goal.thrustArea}
                      onValueChange={(value) => updateGoalFieldAt(index, 'thrustArea', value)}
                      disabled={isReadOnly || goal.isShared}
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
                    onChange={(event) => updateGoalFieldAt(index, 'description', event.target.value)}
                    rows={2}
                    disabled={isReadOnly || goal.isShared}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor={`uom-${goal.id}`}>Unit of Measurement *</Label>
                    <Select
                      value={goal.unitOfMeasurement}
                      onValueChange={(value) => updateGoalUnitAt(index, value as UnitOfMeasurement)}
                      disabled={isReadOnly || goal.isShared}
                    >
                      <SelectTrigger id={`uom-${goal.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {uomOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
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
                        onChange={(event) => updateGoalFieldAt(index, 'targetDate', event.target.value)}
                        disabled={isReadOnly || goal.isShared}
                        className={
                          !hasValidTarget(goal, activeCycle) && goal.title.trim()
                            ? 'border-destructive'
                            : ''
                        }
                      />
                    ) : (
                      <Input
                        id={`target-${goal.id}`}
                        type="number"
                        placeholder={goal.unitOfMeasurement === 'zero-based' ? '0' : 'e.g., 40'}
                        min={0}
                        max={isPercentageUom(goal.unitOfMeasurement) ? 100 : undefined}
                        value={goal.unitOfMeasurement === 'zero-based' ? '0' : goal.target}
                        onChange={(event) => updateGoalFieldAt(index, 'target', event.target.value)}
                        disabled={
                          isReadOnly ||
                          goal.isShared ||
                          goal.unitOfMeasurement === 'zero-based'
                        }
                        readOnly={goal.unitOfMeasurement === 'zero-based' || goal.isShared}
                        className={
                          !hasValidTarget(goal, activeCycle) && goal.title.trim()
                            ? 'border-destructive'
                            : ''
                        }
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
                      onChange={(event) => updateGoalFieldAt(index, 'weightage', event.target.value)}
                      disabled={isReadOnly || goal.isShared}
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

        {goals.length < 8 && canEdit && (
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
