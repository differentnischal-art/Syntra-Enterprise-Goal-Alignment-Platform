'use client'

import { useEffect, useMemo, useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { StatusBadge } from '@/components/goals/status-badge'
import { useCurrentProfile } from '@/hooks/use-current-profile'
import {
  addManagerCheckInComment,
  createCheckInEvidenceSignedUrl,
  getManagerTeamCheckIns,
  type CheckInEvidenceAttachment,
  type CheckInQuarter,
  type ManagerCheckInComment,
  type ManagerCheckInCommentType,
  type ManagerTeamCheckInRow,
} from '@/lib/data/check-ins'
import { mockCheckIns, mockGoals, mockTeamMembers } from '@/lib/mock-data'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import type { TeamMember } from '@/lib/types'
import { Check, Download, X, MessageSquare } from 'lucide-react'

type QuarterLabel = 'Q1' | 'Q2' | 'Q3' | 'Q4'

type CheckInReviewMember = {
  id: string
  name: string
  email: string
  department: string
  goalsCount: number
  checkIns: Record<QuarterLabel, boolean>
  averageScore: number | null
  quarterCompletionStatus: 'not_started' | 'partial' | 'completed'
  plannedVsActual: ManagerTeamCheckInRow['plannedVsActual']
  evidenceAttachments: CheckInEvidenceAttachment[]
}

const quarterToDb: Record<QuarterLabel, CheckInQuarter> = {
  Q1: 'q1',
  Q2: 'q2',
  Q3: 'q3',
  Q4: 'q4',
}

const commentTypeOptions: { value: ManagerCheckInCommentType; label: string }[] = [
  { value: 'coaching', label: 'Coaching' },
  { value: 'appreciation', label: 'Appreciation' },
  { value: 'needs_improvement', label: 'Needs Improvement' },
  { value: 'escalation', label: 'Escalation' },
]

function buildDemoReviewMembers(): CheckInReviewMember[] {
  return mockTeamMembers.map((member) => {
    const memberGoals = mockGoals.filter((goal) => goal.employeeId === member.id)
    const plannedVsActual = (memberGoals.length > 0 ? memberGoals : mockGoals.slice(0, member.goalsCount)).map(
      (goal) => {
        const checkIn = mockCheckIns.find(
          (item) => item.goalId === goal.id && item.quarter === 'Q3'
        )
        return {
          checkinId: checkIn?.id ?? null,
          goalId: goal.id,
          goalSheetId: 'demo',
          goalTitle: goal.title,
          thrustArea: goal.thrustArea,
          plannedTarget: goal.target,
          actualAchievement: checkIn?.actualAchievement ?? null,
          unitOfMeasurement: goal.unitOfMeasurement,
          computedScore: checkIn?.score ?? null,
          status: checkIn?.status ?? goal.status,
          employeeNote: '',
          submittedAt: checkIn?.submittedAt ?? null,
          managerComments: checkIn?.managerComment
            ? [
                {
                  id: `${checkIn.id}-manager-comment`,
                  checkinId: checkIn.id,
                  managerId: 'u2',
                  managerName: 'Rohan Mehta',
                  commentType: 'coaching' as const,
                  comment: checkIn.managerComment,
                  createdAt: checkIn.submittedAt ?? '',
                },
              ]
            : [],
          goal,
        }
      }
    )

    return {
      id: member.id,
      name: member.name,
      email: member.email,
      department: member.department,
      goalsCount: member.goalsCount,
      checkIns: member.checkIns,
      averageScore: member.averageAchievement,
      quarterCompletionStatus: member.checkIns.Q4 ? 'completed' : 'not_started',
      plannedVsActual,
      evidenceAttachments: [],
    }
  })
}

function mapLiveRow(row: ManagerTeamCheckInRow): CheckInReviewMember {
  return {
    id: row.employee.id,
    name: row.employee.name,
    email: row.employee.email,
    department: row.department,
    goalsCount: row.goalsCount,
    checkIns: row.checkIns,
    averageScore: row.averageScore,
    quarterCompletionStatus: row.quarterCompletionStatus,
    plannedVsActual: row.plannedVsActual,
    evidenceAttachments: row.evidenceAttachments,
  }
}

function mergeLiveQuarterRows(
  quarterRows: Partial<Record<QuarterLabel, ManagerTeamCheckInRow[]>>,
  selectedQuarter: QuarterLabel
): CheckInReviewMember[] {
  const selectedRows =
    quarterRows[selectedQuarter] ??
    quarterRows.Q4 ??
    quarterRows.Q3 ??
    quarterRows.Q2 ??
    quarterRows.Q1 ??
    []
  const byEmployee = new Map<string, CheckInReviewMember>()

  selectedRows.forEach((row) => {
    byEmployee.set(row.employee.id, mapLiveRow(row))
  })

  ;(['Q1', 'Q2', 'Q3', 'Q4'] as const).forEach((quarter) => {
    const rows = quarterRows[quarter] ?? []
    rows.forEach((row) => {
      const existing = byEmployee.get(row.employee.id) ?? mapLiveRow(row)
      existing.checkIns[quarter] = row.quarterCompletionStatus === 'completed'
      byEmployee.set(row.employee.id, existing)
    })
  })

  return Array.from(byEmployee.values())
}

export default function ManagerCheckInsPage() {
  const { liveProfile } = useCurrentProfile()
  const [activeQuarter, setActiveQuarter] = useState<QuarterLabel>('Q4')
  const [teamMembers, setTeamMembers] = useState<CheckInReviewMember[]>(() =>
    isSupabaseConfigured() ? [] : buildDemoReviewMembers()
  )
  const [liveQuarterRows, setLiveQuarterRows] = useState<
    Partial<Record<QuarterLabel, ManagerTeamCheckInRow[]>>
  >({})
  const [selectedMember, setSelectedMember] = useState<CheckInReviewMember | null>(null)
  const [selectedCheckinId, setSelectedCheckinId] = useState<string>('')
  const [commentType, setCommentType] = useState<ManagerCheckInCommentType>('coaching')
  const [comment, setComment] = useState('')
  const [commentError, setCommentError] = useState<string | null>(null)
  const [commentMessage, setCommentMessage] = useState<string | null>(null)
  const [evidenceError, setEvidenceError] = useState<string | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const isLiveMode = Boolean(liveProfile && Object.keys(liveQuarterRows).length > 0)
  const sourceLabel = isLiveMode
    ? 'Live Supabase check-ins'
    : isSupabaseConfigured()
      ? 'No live check-ins yet'
      : 'Demo check-ins'

  useEffect(() => {
    if (!liveProfile) {
      setLiveQuarterRows({})
      setTeamMembers(isSupabaseConfigured() ? [] : buildDemoReviewMembers())
      return
    }

    let cancelled = false
    const managerProfile = liveProfile

    async function loadTeamCheckIns() {
      setIsLoading(true)
      const entries = await Promise.all(
        (['Q1', 'Q2', 'Q3', 'Q4'] as const).map(async (quarter) => {
          const rows = await getManagerTeamCheckIns(managerProfile.id, quarterToDb[quarter])
          return [quarter, rows] as const
        })
      )

      if (cancelled) return

      const nextQuarterRows: Partial<Record<QuarterLabel, ManagerTeamCheckInRow[]>> = {}
      entries.forEach(([quarter, rows]) => {
        if (rows) {
          nextQuarterRows[quarter] = rows
        }
      })

      if (Object.keys(nextQuarterRows).length > 0) {
        setLiveQuarterRows(nextQuarterRows)
        setTeamMembers(mergeLiveQuarterRows(nextQuarterRows, activeQuarter))
      } else {
        setLiveQuarterRows({})
        setTeamMembers(isSupabaseConfigured() ? [] : buildDemoReviewMembers())
      }

      setIsLoading(false)
    }

    loadTeamCheckIns()

    return () => {
      cancelled = true
    }
  }, [activeQuarter, liveProfile])

  useEffect(() => {
    if (!isLiveMode) {
      return
    }

    const activeRows = liveQuarterRows[activeQuarter]
    if (activeRows) {
      setTeamMembers(mergeLiveQuarterRows(liveQuarterRows, activeQuarter))
    }
  }, [activeQuarter, isLiveMode, liveQuarterRows])

  const reviewableCheckIns = useMemo(
    () =>
      selectedMember?.plannedVsActual.filter((row) => row.checkinId) ?? [],
    [selectedMember]
  )

  const commentTimeline = useMemo(() => {
    return (
      selectedMember?.plannedVsActual
        .flatMap((row) =>
          row.managerComments.map((managerComment) => ({
            ...managerComment,
            goalTitle: row.goalTitle,
          }))
        )
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        ) ?? []
    )
  }, [selectedMember])

  const openCommentSheet = (member: CheckInReviewMember | TeamMember) => {
    const normalized = 'plannedVsActual' in member ? member : buildDemoReviewMembers().find((row) => row.id === member.id)
    if (!normalized) {
      return
    }

    setSelectedMember(normalized)
    setSelectedCheckinId(normalized.plannedVsActual.find((row) => row.checkinId)?.checkinId ?? '')
    setCommentType('coaching')
    setComment('')
    setCommentError(null)
    setCommentMessage(null)
    setEvidenceError(null)
    setIsSheetOpen(true)
  }

  const updateSelectedMemberComment = (newComment: ManagerCheckInComment) => {
    setSelectedMember((current) => {
      if (!current) return current
      return {
        ...current,
        plannedVsActual: current.plannedVsActual.map((row) =>
          row.checkinId === newComment.checkinId
            ? { ...row, managerComments: [...row.managerComments, newComment] }
            : row
        ),
      }
    })
    setTeamMembers((currentRows) =>
      currentRows.map((member) =>
        member.id === selectedMember?.id
          ? {
              ...member,
              plannedVsActual: member.plannedVsActual.map((row) =>
                row.checkinId === newComment.checkinId
                  ? { ...row, managerComments: [...row.managerComments, newComment] }
                  : row
              ),
            }
          : member
      )
    )
  }

  const handleSubmitComment = async () => {
    setCommentError(null)
    setCommentMessage(null)

    if (!selectedMember) {
      return
    }

    if (!selectedCheckinId) {
      setCommentError('Select a submitted check-in before adding a comment.')
      return
    }

    if (!isLiveMode || !liveProfile) {
      if (isSupabaseConfigured()) {
        setCommentError('No submitted live check-in is available for review.')
        return
      }
      const demoComment: ManagerCheckInComment = {
        id: `demo-comment-${Date.now()}`,
        checkinId: selectedCheckinId,
        managerId: 'demo-manager',
        managerName: 'Manager',
        commentType,
        comment: comment.trim(),
        createdAt: new Date().toISOString(),
      }
      updateSelectedMemberComment(demoComment)
      setComment('')
      setCommentMessage('Comment added locally for demo.')
      return
    }

    const result = await addManagerCheckInComment(
      selectedCheckinId,
      liveProfile.id,
      commentType,
      comment
    )

    if (result.error) {
      setCommentError(result.error)
      return
    }

    if (result.comment) {
      updateSelectedMemberComment(result.comment)
    }

    setComment('')
    setCommentMessage('Manager comment saved to Supabase.')
  }

  const handleDownloadEvidence = async (attachment: CheckInEvidenceAttachment) => {
    setEvidenceError(null)
    const result = await createCheckInEvidenceSignedUrl(attachment.storagePath)

    if (result.error || !result.url) {
      setEvidenceError('Could not download evidence file.')
      return
    }

    window.open(result.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <DashboardLayout role="manager">
      <DashboardHeader title="Team Check-ins" />

      <div className="p-6">
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <CardTitle className="text-lg font-semibold">Quarterly Check-in Status</CardTitle>
                <Badge variant="outline">{sourceLabel}</Badge>
              </div>
              <Select
                value={activeQuarter}
                onValueChange={(value) => setActiveQuarter(value as QuarterLabel)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Q1">Q1</SelectItem>
                  <SelectItem value="Q2">Q2</SelectItem>
                  <SelectItem value="Q3">Q3</SelectItem>
                  <SelectItem value="Q4">Q4</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Team Member</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Goals</TableHead>
                  <TableHead className="text-center">Q1</TableHead>
                  <TableHead className="text-center">Q2</TableHead>
                  <TableHead className="text-center">Q3</TableHead>
                  <TableHead className="text-center">Q4</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                      No submitted team check-ins found for the selected quarter.
                    </TableCell>
                  </TableRow>
                ) : (
                  teamMembers.map((member, index) => (
                    <TableRow
                      key={member.id}
                      className={index % 2 === 0 ? 'bg-card' : 'bg-muted/30'}
                    >
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell className="text-muted-foreground">{member.department}</TableCell>
                      <TableCell>{member.goalsCount}</TableCell>
                      {(['Q1', 'Q2', 'Q3', 'Q4'] as const).map((quarter) => (
                        <TableCell key={quarter} className="text-center">
                          {member.checkIns[quarter] ? (
                            <Check className="mx-auto h-5 w-5 text-success" />
                          ) : (
                            <X className="mx-auto h-5 w-5 text-destructive" />
                          )}
                        </TableCell>
                      ))}
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8"
                          onClick={() => openCommentSheet(member)}
                          disabled={isLoading}
                        >
                          <MessageSquare className="mr-1 h-4 w-4" />
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Check-in Review</SheetTitle>
            <SheetDescription>
              {selectedMember && `Review ${selectedMember.name}'s ${activeQuarter} check-in`}
            </SheetDescription>
          </SheetHeader>

          {selectedMember && (
            <div className="mt-6 space-y-6">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Employee Details</h4>
                <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-2">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Name:</span>{' '}
                    <span className="font-medium">{selectedMember.name}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Department:</span>{' '}
                    <span className="font-medium">{selectedMember.department}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Goals:</span>{' '}
                    <span className="font-medium">{selectedMember.goalsCount}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Average Score:</span>{' '}
                    <span className="font-medium">
                      {selectedMember.averageScore === null ? '-' : `${selectedMember.averageScore}%`}
                    </span>
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Achievement Evidence</h4>
                {selectedMember.evidenceAttachments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No evidence file uploaded for this quarter.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedMember.evidenceAttachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex flex-col gap-2 rounded-lg border border-border bg-muted/40 p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="text-sm font-medium">{attachment.fileName}</p>
                          <p className="text-xs text-muted-foreground">
                            Uploaded {new Date(attachment.uploadedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadEvidence(attachment)}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download Evidence
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                {evidenceError && (
                  <p className="text-sm text-destructive">{evidenceError}</p>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Check-in Progress</h4>
                <div className="grid grid-cols-4 gap-2">
                  {(['Q1', 'Q2', 'Q3', 'Q4'] as const).map((quarter) => (
                    <button
                      type="button"
                      key={quarter}
                      onClick={() => setActiveQuarter(quarter)}
                      className={`rounded-lg border p-3 text-center ${
                        selectedMember.checkIns[quarter]
                          ? 'border-success/30 bg-success/5'
                          : 'border-destructive/30 bg-destructive/5'
                      }`}
                    >
                      <p className="text-xs text-muted-foreground">{quarter}</p>
                      {selectedMember.checkIns[quarter] ? (
                        <Check className="mx-auto mt-1 h-5 w-5 text-success" />
                      ) : (
                        <X className="mx-auto mt-1 h-5 w-5 text-destructive" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-medium">Planned vs Actual</h4>
                <div className="space-y-3">
                  {selectedMember.plannedVsActual.map((row) => (
                    <div key={row.goalId} className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium">{row.goalTitle}</p>
                        <StatusBadge status={row.status} type="goal" />
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">Planned</p>
                          <p className="font-medium">{row.plannedTarget}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Actual</p>
                          <p className="font-medium">{row.actualAchievement ?? '-'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Score</p>
                          <Badge variant="outline">
                            {row.computedScore === null ? '-' : `${row.computedScore}%`}
                          </Badge>
                        </div>
                      </div>
                      {row.employeeNote && (
                        <p className="text-xs text-muted-foreground">
                          Employee note: <span className="text-foreground">{row.employeeNote}</span>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Manager Comments</h4>
                <div className="space-y-2">
                  {commentTimeline.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No manager comments yet.</p>
                  ) : (
                    commentTimeline.map((managerComment) => (
                      <div key={managerComment.id} className="rounded-lg border border-border bg-muted/40 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-medium">{managerComment.goalTitle}</p>
                          {managerComment.commentType && (
                            <Badge variant="outline">
                              {commentTypeOptions.find((item) => item.value === managerComment.commentType)?.label}
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-sm">{managerComment.comment}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{managerComment.managerName}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {commentError && (
                <Alert className="border-destructive/30 bg-destructive/5">
                  <AlertDescription className="text-destructive">{commentError}</AlertDescription>
                </Alert>
              )}

              {commentMessage && (
                <Alert className="border-success/30 bg-success/5">
                  <AlertDescription>{commentMessage}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Add Comment</h4>
                <Select value={selectedCheckinId} onValueChange={setSelectedCheckinId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select submitted check-in" />
                  </SelectTrigger>
                  <SelectContent>
                    {reviewableCheckIns.map((row) => (
                      <SelectItem key={row.checkinId} value={row.checkinId!}>
                        {row.goalTitle}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={commentType}
                  onValueChange={(value) => setCommentType(value as ManagerCheckInCommentType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {commentTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea
                  placeholder="Enter your feedback or comments..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsSheetOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSubmitComment}
                  disabled={!comment.trim()}
                >
                  Submit Comment
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  )
}
