'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { StatusBadge } from '@/components/goals/status-badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { mockTeamMembers, mockTeamGoals } from '@/lib/mock-data'
import { useCurrentProfile } from '@/hooks/use-current-profile'
import { useManagerPendingApprovals } from '@/hooks/use-manager-pending-approvals'
import {
  approveGoalSheet,
  getManagerGoalSheetForReview,
  returnGoalSheetForRework,
  saveManagerGoalEdits,
  type ApprovalReviewEntry,
  type ManagerGoalSheetReview,
  type ManagerPendingApproval,
} from '@/lib/data/manager-approvals'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import type { ApprovalStatus, Goal, GoalSheetStatus } from '@/lib/types'
import {
  CheckCircle2,
  X,
  Clock,
  FileText,
  MessageSquare,
  AlertTriangle,
  Check,
  Lock,
  ChevronRight,
} from 'lucide-react'

const uomLabels: Record<string, string> = {
  'numeric-higher-better': 'Higher Better',
  'numeric-lower-better': 'Lower Better',
  percentage: 'Percentage',
  'percentage-higher-better': 'Percentage - Higher Better',
  'percentage-lower-better': 'Percentage - Lower Better',
  timeline: 'Timeline',
  'zero-based': 'Zero Based',
}

type DemoSheetState = {
  status: 'pending' | 'approved' | 'returned'
  reviews: ApprovalReviewEntry[]
}

type GoalEditDraft = {
  target: string
  targetDate: string
  weightage: string
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function ManagerApprovalsPage() {
  const { liveProfile } = useCurrentProfile()
  const {
    dataSource,
    fetchError,
    sourceLabel,
    pendingSheets,
    demoPendingMembers,
    reloadPending,
  } = useManagerPendingApprovals()

  const useSupabase = dataSource === 'supabase'

  const [selectedGoalSheetId, setSelectedGoalSheetId] = useState<string | null>(null)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(
    isSupabaseConfigured() ? null : 'u4'
  )
  const [reviewDetail, setReviewDetail] = useState<ManagerGoalSheetReview | null>(null)
  const [comments, setComments] = useState('')
  const [commentError, setCommentError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isActing, setIsActing] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [warningMessage, setWarningMessage] = useState<string | null>(null)
  const [goalEdits, setGoalEdits] = useState<Record<string, GoalEditDraft>>({})
  const [demoSheetStates, setDemoSheetStates] = useState<Record<string, DemoSheetState>>({})
  const [removedDemoIds, setRemovedDemoIds] = useState<Set<string>>(new Set())

  const demoPending = useMemo(
    () => demoPendingMembers.filter((m) => !removedDemoIds.has(m.id)),
    [demoPendingMembers, removedDemoIds]
  )

  useEffect(() => {
    if (useSupabase && pendingSheets.length > 0 && !selectedGoalSheetId) {
      setSelectedGoalSheetId(pendingSheets[0].goalSheetId)
    }
    if (!useSupabase && demoPending.length > 0 && !selectedMemberId) {
      setSelectedMemberId(demoPending[0].id)
    }
  }, [useSupabase, pendingSheets, selectedGoalSheetId, demoPending, selectedMemberId])

  const loadReviewDetail = useCallback(
    async (goalSheetId: string) => {
      if (!useSupabase || !liveProfile) return
      const detail = await getManagerGoalSheetForReview(goalSheetId, {
        managerName: liveProfile.name,
      })
      setReviewDetail(detail)
    },
    [useSupabase, liveProfile]
  )

  useEffect(() => {
    if (useSupabase && selectedGoalSheetId) {
      loadReviewDetail(selectedGoalSheetId)
    } else {
      setReviewDetail(null)
    }
  }, [useSupabase, selectedGoalSheetId, loadReviewDetail])

  const selectedSupabaseSheet = useMemo(
    () => pendingSheets.find((s) => s.goalSheetId === selectedGoalSheetId) ?? reviewDetail,
    [pendingSheets, selectedGoalSheetId, reviewDetail]
  )

  useEffect(() => {
    if (!selectedSupabaseSheet) {
      setGoalEdits({})
      return
    }

    setGoalEdits(
      Object.fromEntries(
        selectedSupabaseSheet.goals.map((goal) => [
          goal.id,
          {
            target:
              goal.unitOfMeasurement === 'timeline'
                ? ''
                : goal.unitOfMeasurement === 'zero-based'
                  ? '0'
                  : goal.target.toString(),
            targetDate: goal.targetDate ?? '',
            weightage: goal.weightage.toString(),
          },
        ])
      )
    )
  }, [selectedSupabaseSheet])

  const selectedMemberData = mockTeamMembers.find((m) => m.id === selectedMemberId)
  const demoState = selectedMemberId ? demoSheetStates[selectedMemberId] : undefined
  const demoStatus: ApprovalStatus =
    demoState?.status === 'approved'
      ? 'approved'
      : demoState?.status === 'returned'
        ? 'returned'
        : 'pending'

  const memberGoals: Goal[] = useSupabase
    ? (selectedSupabaseSheet?.goals ?? [])
    : mockTeamGoals.filter((g) => g.employeeId === selectedMemberId)

  const totalWeightage = useSupabase
    ? (selectedSupabaseSheet?.totalWeightage ??
      memberGoals.reduce((sum, g) => sum + g.weightage, 0))
    : memberGoals.reduce((sum, g) => sum + g.weightage, 0)

  const sheetStatus: GoalSheetStatus | undefined = useSupabase
    ? selectedSupabaseSheet?.status
    : demoStatus === 'approved'
      ? 'locked'
      : demoStatus === 'returned'
        ? 'returned'
        : 'pending-approval'

  const isResolved =
    sheetStatus === 'locked' ||
    sheetStatus === 'approved' ||
    sheetStatus === 'returned' ||
    demoStatus === 'approved' ||
    demoStatus === 'returned'

  const inputsDisabled = isResolved || isActing

  const pendingListCount = useSupabase ? pendingSheets.length : demoPending.length

  const updateGoalEdit = (
    goalId: string,
    field: keyof GoalEditDraft,
    value: string
  ) => {
    setGoalEdits((current) => ({
      ...current,
      [goalId]: {
        ...(current[goalId] ?? { target: '', targetDate: '', weightage: '' }),
        [field]: value,
      },
    }))
  }

  const handleSaveManagerEdits = async () => {
    setActionError(null)
    setSuccessMessage(null)
    setWarningMessage(null)

    if (!useSupabase || !selectedGoalSheetId || !liveProfile || !selectedSupabaseSheet) {
      return
    }

    setIsActing(true)
    const result = await saveManagerGoalEdits(
      selectedGoalSheetId,
      liveProfile.id,
      selectedSupabaseSheet.goals.map((goal) => {
        const edit = goalEdits[goal.id]
        return {
          goalId: goal.id,
          target:
            goal.unitOfMeasurement === 'timeline' ||
            goal.unitOfMeasurement === 'zero-based'
              ? 0
              : Number(edit?.target ?? goal.target),
          targetDate:
            goal.unitOfMeasurement === 'timeline'
              ? edit?.targetDate ?? goal.targetDate ?? null
              : null,
          weightage: Number(edit?.weightage ?? goal.weightage),
        }
      })
    )
    setIsActing(false)

    if (result.error || !result.success) {
      setActionError(result.error ?? 'Failed to save manager edits')
      return
    }

    setSuccessMessage('Manager edits saved.')
    await loadReviewDetail(selectedGoalSheetId)
    await reloadPending()
  }

  const handleApprove = async () => {
    setCommentError(null)
    setActionError(null)
    setSuccessMessage(null)
    setWarningMessage(null)

    if (useSupabase && selectedGoalSheetId && liveProfile) {
      setIsActing(true)
      const result = await approveGoalSheet(
        selectedGoalSheetId,
        liveProfile.id,
        comments
      )
      setIsActing(false)

      if (result.error || !result.success) {
        setActionError(result.error ?? 'Failed to approve goal sheet')
        return
      }

      setSuccessMessage('Goal sheet approved and locked.')
      clearSupabaseSelectionAfterAction()
      await reloadPending()
      return
    }

    if (!selectedMemberId) return

    setDemoSheetStates((prev) => ({
      ...prev,
      [selectedMemberId]: {
        status: 'approved',
        reviews: [
          ...(prev[selectedMemberId]?.reviews ?? []),
          {
            id: `demo-approved-${Date.now()}`,
            action: 'approved',
            comment: comments.trim() || null,
            reviewerId: 'demo-manager',
            reviewerName: 'You',
            createdAt: new Date().toISOString(),
          },
        ],
      },
    }))
    setRemovedDemoIds((prev) => new Set(prev).add(selectedMemberId))
    setSuccessMessage('Goal sheet approved and locked.')
  }

  const handleReturn = async () => {
    setCommentError(null)
    setActionError(null)
    setSuccessMessage(null)
    setWarningMessage(null)

    if (!comments.trim()) {
      setCommentError('Manager comment is required when returning a goal sheet.')
      return
    }

    if (useSupabase && selectedGoalSheetId && liveProfile) {
      setIsActing(true)
      const result = await returnGoalSheetForRework(
        selectedGoalSheetId,
        liveProfile.id,
        comments
      )
      setIsActing(false)

      if (result.error || !result.success) {
        setActionError(result.error ?? 'Failed to return goal sheet')
        return
      }

      setWarningMessage('Goal sheet returned for rework.')
      clearSupabaseSelectionAfterAction()
      await reloadPending()
      return
    }

    if (!selectedMemberId) return

    setDemoSheetStates((prev) => ({
      ...prev,
      [selectedMemberId]: {
        status: 'returned',
        reviews: [
          ...(prev[selectedMemberId]?.reviews ?? []),
          {
            id: `demo-returned-${Date.now()}`,
            action: 'returned',
            comment: comments.trim(),
            reviewerId: 'demo-manager',
            reviewerName: 'You',
            createdAt: new Date().toISOString(),
          },
        ],
      },
    }))
    setRemovedDemoIds((prev) => new Set(prev).add(selectedMemberId))
    setWarningMessage('Goal sheet returned for rework.')
  }

  function clearSupabaseSelectionAfterAction() {
    setSelectedGoalSheetId(null)
    setReviewDetail(null)
    setComments('')
  }

  const displayName = useSupabase
    ? selectedSupabaseSheet?.name
    : selectedMemberData?.name
  const displayEmail = useSupabase
    ? selectedSupabaseSheet?.email
    : selectedMemberData?.email
  const displayDepartment = useSupabase
    ? selectedSupabaseSheet?.department
    : selectedMemberData?.department
  const displayGoalsCount = useSupabase
    ? selectedSupabaseSheet?.goalsCount
    : selectedMemberData?.goalsCount
  const submittedDate = useSupabase
    ? formatDate(selectedSupabaseSheet?.submittedAt)
    : 'Oct 14, 2025'

  const timelineReviews: ApprovalReviewEntry[] = useSupabase
    ? (reviewDetail?.reviews ?? [])
    : (demoState?.reviews ?? [])

  const showReviewPanel =
    (useSupabase && Boolean(selectedGoalSheetId && selectedSupabaseSheet)) ||
    (!useSupabase && selectedMemberData && !removedDemoIds.has(selectedMemberId ?? ''))

  return (
    <DashboardLayout role="manager">
      <DashboardHeader
        title="Approvals"
        subtitle="Review and approve team goal sheets"
      />

      <div className="p-6 space-y-6">
        <Badge
          variant="outline"
          className="h-5 border-border/80 px-2 text-[10px] font-normal text-muted-foreground"
        >
          {sourceLabel}
        </Badge>

        {fetchError && (
          <Alert className="border-destructive/30 bg-destructive/5">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">
              {fetchError}
            </AlertDescription>
          </Alert>
        )}

        {actionError && (
          <Alert className="border-destructive/30 bg-destructive/5">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">{actionError}</AlertDescription>
          </Alert>
        )}

        {successMessage && (
          <Alert className="border-success/30 bg-success/5">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <AlertDescription className="text-success">{successMessage}</AlertDescription>
          </Alert>
        )}

        {warningMessage && (
          <Alert className="border-warning/30 bg-warning/5">
            <AlertTriangle className="h-4 w-4 text-warning-foreground" />
            <AlertDescription className="text-warning-foreground">
              {warningMessage}
            </AlertDescription>
          </Alert>
        )}

        {pendingListCount === 0 && !showReviewPanel ? (
          <Card className="border-border/60">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              {useSupabase ? (
                <>
                  <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground">
                    No pending goal sheets
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                    Submitted employee goal sheets will appear here for review.
                  </p>
                </>
              ) : (
                <>
                  <div className="mb-4 h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-success" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground">All Caught Up!</h3>
                  <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                    No pending goal sheet approvals at the moment.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-4">
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Pending Reviews</CardTitle>
                <CardDescription>
                  {pendingListCount} sheets awaiting approval
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {useSupabase
                    ? pendingSheets.map((sheet: ManagerPendingApproval) => (
                        <button
                          key={sheet.goalSheetId}
                          type="button"
                          onClick={() => {
                            setSelectedGoalSheetId(sheet.goalSheetId)
                            setSuccessMessage(null)
                            setWarningMessage(null)
                            setActionError(null)
                          }}
                          className={`
                        w-full flex items-center justify-between px-4 py-3 text-left transition-colors
                        ${selectedGoalSheetId === sheet.goalSheetId ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-muted/50'}
                      `}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 border border-border">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {sheet.name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{sheet.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {sheet.goalsCount} goals
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </button>
                      ))
                    : demoPending.map((member) => (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() => {
                            setSelectedMemberId(member.id)
                            setSuccessMessage(null)
                            setWarningMessage(null)
                            setActionError(null)
                          }}
                          className={`
                        w-full flex items-center justify-between px-4 py-3 text-left transition-colors
                        ${selectedMemberId === member.id ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-muted/50'}
                      `}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 border border-border">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {member.name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{member.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {member.goalsCount} goals
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </button>
                      ))}
                </div>
              </CardContent>
            </Card>

            <div className="lg:col-span-3 space-y-6">
              {showReviewPanel && (
                <>
                  <Card className="border-border/60">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12 border border-border">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {(displayName ?? '')
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg font-semibold">
                              {displayName}
                            </CardTitle>
                            <CardDescription>{displayEmail}</CardDescription>
                          </div>
                        </div>
                        <StatusBadge
                          status={
                            sheetStatus === 'locked'
                              ? 'approved'
                              : sheetStatus === 'pending-approval'
                                ? 'pending'
                                : demoStatus
                          }
                          type="approval"
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 sm:grid-cols-4">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Department</p>
                          <p className="text-sm font-medium">{displayDepartment}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Submitted Date</p>
                          <p className="text-sm font-medium">{submittedDate}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Total Goals</p>
                          <p className="text-sm font-medium">{displayGoalsCount}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Total Weightage</p>
                          <p
                            className={`text-sm font-medium ${totalWeightage === 100 ? 'text-success' : 'text-destructive'}`}
                          >
                            {totalWeightage}%
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Alert
                    className={
                      totalWeightage === 100
                        ? 'border-success/30 bg-success/5'
                        : 'border-destructive/30 bg-destructive/5'
                    }
                  >
                    {totalWeightage === 100 ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    )}
                    <AlertDescription
                      className={
                        totalWeightage === 100 ? 'text-success' : 'text-destructive'
                      }
                    >
                      {totalWeightage === 100
                        ? 'Validation passed: Total weightage equals 100%'
                        : `Validation failed: Total weightage is ${totalWeightage}% (must be 100%)`}
                    </AlertDescription>
                  </Alert>

                  <Alert className="border-primary/30 bg-primary/5">
                    <Lock className="h-4 w-4 text-primary" />
                    <AlertDescription className="text-primary">
                      Goals will be{' '}
                      <span className="font-semibold">locked after approval</span>. Employee
                      will not be able to edit without Admin intervention.
                    </AlertDescription>
                  </Alert>

                  <Card className="border-border/60">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold">
                        Submitted Goals
                      </CardTitle>
                      <CardDescription>
                        Review and adjust targets/weightage if needed
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="hover:bg-transparent">
                              <TableHead className="w-[250px]">Goal Title</TableHead>
                              <TableHead>Thrust Area</TableHead>
                              <TableHead>UoM</TableHead>
                              <TableHead className="text-right">Submitted Target</TableHead>
                              <TableHead className="text-right w-[100px]">
                                Target (Edit)
                              </TableHead>
                              <TableHead className="text-right">Submitted Weight</TableHead>
                              <TableHead className="text-right w-[100px]">
                                Weight (Edit)
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {memberGoals.map((goal, index) => (
                              <TableRow
                                key={goal.id}
                                className={index % 2 === 0 ? 'bg-card' : 'bg-muted/30'}
                              >
                                <TableCell className="font-medium">
                                  <span className="line-clamp-2">{goal.title}</span>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {goal.thrustArea}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-xs">
                                  {uomLabels[goal.unitOfMeasurement]}
                                </TableCell>
                                <TableCell className="text-right tabular-nums">
                                  {goal.unitOfMeasurement === 'timeline'
                                    ? goal.targetDate ?? '—'
                                    : goal.target}
                                </TableCell>
                                <TableCell className="text-right">
                                  {goal.unitOfMeasurement === 'timeline' ? (
                                    <Input
                                      type="date"
                                      value={goalEdits[goal.id]?.targetDate ?? ''}
                                      onChange={(event) =>
                                        updateGoalEdit(goal.id, 'targetDate', event.target.value)
                                      }
                                      disabled={inputsDisabled}
                                      className="h-8 w-36 ml-auto"
                                    />
                                  ) : (
                                    <Input
                                      type="number"
                                      min={0}
                                      max={
                                        goal.unitOfMeasurement === 'percentage' ||
                                        goal.unitOfMeasurement === 'percentage-higher-better' ||
                                        goal.unitOfMeasurement === 'percentage-lower-better'
                                          ? 100
                                          : undefined
                                      }
                                      value={
                                        goal.unitOfMeasurement === 'zero-based'
                                          ? '0'
                                          : goalEdits[goal.id]?.target ?? ''
                                      }
                                      onChange={(event) =>
                                        updateGoalEdit(goal.id, 'target', event.target.value)
                                      }
                                      disabled={inputsDisabled || goal.unitOfMeasurement === 'zero-based'}
                                      readOnly={goal.unitOfMeasurement === 'zero-based'}
                                      className="h-8 w-20 text-right ml-auto"
                                    />
                                  )}
                                </TableCell>
                                <TableCell className="text-right tabular-nums">
                                  {goal.weightage}%
                                </TableCell>
                                <TableCell className="text-right">
                                  <Input
                                    type="number"
                                    min={10}
                                    max={100}
                                    value={goalEdits[goal.id]?.weightage ?? ''}
                                    onChange={(event) =>
                                      updateGoalEdit(goal.id, 'weightage', event.target.value)
                                    }
                                    disabled={inputsDisabled}
                                    className="h-8 w-20 text-right ml-auto"
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/60">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Manager Comments
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Textarea
                        placeholder="Add your comments or feedback for the employee..."
                        value={comments}
                        onChange={(e) => {
                          setComments(e.target.value)
                          if (commentError) setCommentError(null)
                        }}
                        disabled={inputsDisabled}
                        rows={3}
                      />
                      {commentError && (
                        <p className="text-sm text-destructive">{commentError}</p>
                      )}
                      <div className="flex gap-3">
                        {useSupabase && !inputsDisabled && (
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={handleSaveManagerEdits}
                            disabled={isActing}
                          >
                            Save Review Edits
                          </Button>
                        )}
                        <Button
                          className="flex-1 bg-success hover:bg-success/90"
                          onClick={handleApprove}
                          disabled={inputsDisabled}
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Approve Goal Sheet
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={handleReturn}
                          disabled={inputsDisabled}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Return for Rework
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/60">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold">
                        Approval History
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-background text-primary">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div className="flex-1 w-px bg-border mt-2" />
                          </div>
                          <div className="flex-1 pb-4">
                            <p className="text-sm font-medium">
                              Goal sheet submitted for approval
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              by {displayName} on {submittedDate}
                            </p>
                          </div>
                        </div>

                        {timelineReviews.map((review, index) => (
                          <div key={review.id} className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div
                                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 bg-background ${
                                  review.action === 'approved'
                                    ? 'border-success text-success'
                                    : 'border-destructive text-destructive'
                                }`}
                              >
                                {review.action === 'approved' ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <X className="h-4 w-4" />
                                )}
                              </div>
                              {index < timelineReviews.length - 1 && (
                                <div className="flex-1 w-px bg-border mt-2" />
                              )}
                            </div>
                            <div className="flex-1 pb-4">
                              <p className="text-sm font-medium">
                                {review.action === 'approved'
                                  ? 'Goal sheet approved and locked'
                                  : 'Goal sheet returned for rework'}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                by {review.reviewerName} on{' '}
                                {formatDate(review.createdAt)}
                              </p>
                              {review.comment && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {review.comment}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}

                        {!isResolved && (
                          <div className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-warning bg-background text-warning-foreground">
                                <Clock className="h-4 w-4" />
                              </div>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">
                                Pending manager approval
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Awaiting review
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
