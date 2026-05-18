'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { StatusBadge } from '@/components/goals/status-badge'
import { getManagerLiveData, type ManagerLiveData } from '@/lib/data/manager'
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
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { useCurrentProfile } from '@/hooks/use-current-profile'
import { 
  Users, 
  CheckCircle2, 
  Clock,
  TrendingUp,
  ArrowRight,
  FileText,
  CalendarCheck,
  AlertCircle,
  Download,
} from 'lucide-react'

type QuarterLabel = 'Q1' | 'Q2' | 'Q3' | 'Q4'

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

function quarterStatusTitle(quarter: QuarterLabel, status: 'submitted' | 'missing' | 'inactive') {
  if (status === 'submitted') return `${quarter} submitted`
  if (status === 'inactive') return `${quarter} window closed/not active`
  return `${quarter} not submitted`
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function ManagerDashboard() {
  const { liveProfile, error: profileError } = useCurrentProfile()
  const [managerData, setManagerData] = useState<ManagerLiveData | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [selectedQuarter, setSelectedQuarter] = useState<QuarterLabel>('Q1')
  const [selectedQuarterDetail, setSelectedQuarterDetail] = useState<ManagerTeamCheckInRow | null>(null)
  const [quarterMessage, setQuarterMessage] = useState<string | null>(null)
  const [quarterError, setQuarterError] = useState<string | null>(null)
  const [evidenceError, setEvidenceError] = useState<string | null>(null)
  const [selectedCheckinId, setSelectedCheckinId] = useState('')
  const [commentType, setCommentType] = useState<ManagerCheckInCommentType>('coaching')
  const [comment, setComment] = useState('')
  const [commentError, setCommentError] = useState<string | null>(null)
  const [commentMessage, setCommentMessage] = useState<string | null>(null)
  const [isQuarterSheetOpen, setIsQuarterSheetOpen] = useState(false)
  const [isQuarterLoading, setIsQuarterLoading] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setManagerData(null)
      setFetchError(null)
      return
    }

    if (!liveProfile) {
      setManagerData(null)
      setFetchError(profileError)
      return
    }

    let cancelled = false
    const managerId = liveProfile.id

    async function load() {
      try {
        setFetchError(null)
        const data = await getManagerLiveData(managerId)
        if (!cancelled) {
          setManagerData(data)
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[manager dashboard] live data failed:', err)
        }
        if (!cancelled) {
          setFetchError(err instanceof Error ? err.message : 'Failed to load manager dashboard data.')
          setManagerData(null)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [liveProfile, profileError])

  const teamMembers = managerData?.teamMembers ?? []
  const pendingSheets = managerData?.pendingSheets ?? []
  const totalTeamMembers = managerData?.directReportsCount ?? 0
  const pendingApprovals = managerData?.pendingApprovals ?? 0
  const teamAvgAchievement = managerData?.teamAvgAchievement ?? 0
  const checkInCompliance = managerData?.checkInCompliance ?? 0
  const topThrustAreas = managerData?.topThrustAreas ?? []
  const recentActivity = managerData?.recentActivity ?? []
  const totalGoals = managerData?.goalsCount ?? 0
  const selectedSubmittedRows =
    selectedQuarterDetail?.plannedVsActual.filter((row) => row.checkinId && row.submittedAt) ?? []
  const selectedSubmittedDate =
    selectedSubmittedRows
      .map((row) => row.submittedAt)
      .filter((value): value is string => Boolean(value))
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null
  const selectedAverageScore =
    selectedQuarterDetail?.averageScore === null || selectedQuarterDetail?.averageScore === undefined
      ? '-'
      : `${selectedQuarterDetail.averageScore}%`
  const reviewableCheckIns = selectedSubmittedRows
  const commentTimeline =
    selectedQuarterDetail?.plannedVsActual
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

  const handleQuarterClick = async (employeeId: string, quarter: QuarterLabel) => {
    setSelectedQuarter(quarter)
    setSelectedQuarterDetail(null)
    setQuarterMessage(null)
    setQuarterError(null)
    setEvidenceError(null)
    setSelectedCheckinId('')
    setCommentType('coaching')
    setComment('')
    setCommentError(null)
    setCommentMessage(null)
    setIsQuarterSheetOpen(true)

    if (!liveProfile) {
      setQuarterMessage(`No ${quarter} check-in submitted by this employee yet.`)
      return
    }

    setIsQuarterLoading(true)
    try {
      const rows = await getManagerTeamCheckIns(liveProfile.id, quarterToDb[quarter])
      const detail = rows?.find((row) => row.employee.id === employeeId) ?? null
      const submittedRows =
        detail?.plannedVsActual.filter((row) => row.checkinId && row.submittedAt) ?? []

      if (!detail || submittedRows.length === 0) {
        setSelectedQuarterDetail(detail)
        setQuarterMessage(`No ${quarter} check-in submitted by this employee yet.`)
        return
      }

      setSelectedQuarterDetail(detail)
      setSelectedCheckinId(submittedRows[0]?.checkinId ?? '')
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[manager roster check-ins] failed:', err)
      }
      setQuarterError('Could not load this check-in. Please try again.')
    } finally {
      setIsQuarterLoading(false)
    }
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

  const updateSelectedQuarterDetailComment = (newComment: ManagerCheckInComment) => {
    setSelectedQuarterDetail((current) => {
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
  }

  const handleSubmitComment = async () => {
    setCommentError(null)
    setCommentMessage(null)

    if (!selectedCheckinId) {
      setCommentError('Select a submitted check-in before adding a comment.')
      return
    }

    if (!liveProfile) {
      setCommentError('No submitted live check-in is available for review.')
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
      updateSelectedQuarterDetailComment(result.comment)
    }

    setComment('')
    setCommentMessage('Manager comment saved to Supabase.')
  }

  return (
    <DashboardLayout role="manager">
      <DashboardHeader
        title="Manager Dashboard"
        subtitle="Team Performance Overview"
      />

      <div className="space-y-6 p-4 sm:p-6">
        {fetchError && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-4 text-sm text-destructive">{fetchError}</CardContent>
          </Card>
        )}

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="overflow-hidden bg-gradient-to-br from-primary/10 via-card to-card">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Direct Reports</p>
                  <p className="text-2xl font-semibold text-foreground">{totalTeamMembers}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shadow-sm shadow-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">Direct reports</p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden bg-gradient-to-br from-warning/15 via-card to-card">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Pending Approvals</p>
                  <p className="text-2xl font-semibold text-foreground">{pendingApprovals}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 shadow-sm shadow-warning/10">
                  <Clock className="h-5 w-5 text-warning-foreground" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">Goal sheets awaiting review</p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden bg-gradient-to-br from-success/10 via-card to-card">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Team Avg Achievement</p>
                  <p className="text-2xl font-semibold text-foreground">{teamAvgAchievement}%</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 shadow-sm shadow-success/10">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
              </div>
              <Progress value={teamAvgAchievement} className="h-1.5 mt-3" />
            </CardContent>
          </Card>

          <Card className="overflow-hidden bg-gradient-to-br from-success/10 via-card to-card">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Check-in Compliance</p>
                  <p className="text-2xl font-semibold text-foreground">{checkInCompliance}%</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 shadow-sm shadow-success/10">
                  <CalendarCheck className="h-5 w-5 text-success" />
                </div>
              </div>
              <Progress value={checkInCompliance} className="h-1.5 mt-3" />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Pending Approvals */}
          <div className="lg:col-span-2">
            <Card className="border-border/60">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base font-semibold">Pending Approvals</CardTitle>
                  <CardDescription>Goal sheets awaiting your review</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/manager/approvals">
                    View All
                    <ArrowRight className="ml-2 h-3 w-3" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {pendingApprovals === 0 ? (
                  <div className="mx-6 mb-6 flex flex-col items-center justify-center rounded-lg border border-dashed border-success/25 bg-gradient-to-br from-success/10 via-background to-primary/5 px-6 py-12 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success shadow-sm shadow-success/10">
                      <CheckCircle2 className="h-6 w-6 text-success" />
                    </div>
                    <p className="text-sm font-semibold">All caught up</p>
                    <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                      No pending goal sheets need review right now.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {pendingSheets.map((sheet) => (
                          <div
                            key={sheet.goalSheetId}
                            className="flex items-center justify-between px-6 py-4 transition-all hover:bg-primary/5"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9 border border-border">
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
                                  {sheet.goalsCount} goals | {sheet.totalWeightage}% weightage
                                </p>
                              </div>
                            </div>
                            <Button size="sm" asChild>
                              <Link href="/manager/approvals">Review</Link>
                            </Button>
                          </div>
                        ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
              <CardDescription>Latest team updates</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {recentActivity.length === 0 ? (
                  <div className="px-6 py-10 text-center">
                    <p className="text-sm font-medium">No recent team activity yet.</p>
                  </div>
                ) : recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 px-6 py-3 transition-colors hover:bg-primary/5">
                    <div className={`
                      mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full
                      ${activity.type === 'goal-approved' ? 'bg-success/10 text-success' :
                        activity.type === 'goal-returned' ? 'bg-destructive/10 text-destructive' :
                        activity.type === 'checkin-submitted' ? 'bg-primary/10 text-primary' :
                        'bg-muted text-muted-foreground'}
                    `}>
                      {activity.type === 'goal-approved' && <CheckCircle2 className="h-3.5 w-3.5" />}
                      {activity.type === 'goal-returned' && <AlertCircle className="h-3.5 w-3.5" />}
                      {activity.type === 'checkin-submitted' && <CalendarCheck className="h-3.5 w-3.5" />}
                      {activity.type === 'comment-added' && <FileText className="h-3.5 w-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground line-clamp-2">{activity.description}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(activity.timestamp).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Roster */}
        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold">Team Roster</CardTitle>
              <CardDescription>Overview of all direct reports</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/manager/team-goals">
                View Details
                <ArrowRight className="ml-2 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Employee</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-3 py-3">Goals</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-3 py-3">Sheet Status</th>
                    <th className="text-center text-xs font-medium text-muted-foreground px-3 py-3">Achievement</th>
                    <th className="text-center text-xs font-medium text-muted-foreground px-3 py-3">Q1</th>
                    <th className="text-center text-xs font-medium text-muted-foreground px-3 py-3">Q2</th>
                    <th className="text-center text-xs font-medium text-muted-foreground px-3 py-3">Q3</th>
                    <th className="text-center text-xs font-medium text-muted-foreground px-3 py-3">Q4</th>
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.map((member, index) => (
                    <tr key={member.id} className={`border-b border-border transition-colors last:border-0 hover:bg-primary/5 ${index % 2 === 0 ? 'bg-card' : 'bg-muted/25'}`}>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 border border-border">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{member.name}</p>
                            <p className="text-xs text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-sm">{member.goalsCount}</td>
                      <td className="px-3 py-3">
                        <StatusBadge status={member.sheetStatus} type="sheet" />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Progress value={member.averageAchievement} className="h-1.5 w-12" />
                          <span className="text-xs text-muted-foreground w-8">{member.averageAchievement}%</span>
                        </div>
                      </td>
                      {(['Q1', 'Q2', 'Q3', 'Q4'] as const).map((q) => (
                        <td key={q} className="px-3 py-3 text-center">
                          {(() => {
                            const status = member.checkInStatuses?.[q] ?? (member.checkIns[q] ? 'submitted' : 'missing')
                            return (
                              <button
                                type="button"
                                title={quarterStatusTitle(q, status)}
                                aria-label={`${member.name} ${quarterStatusTitle(q, status)}`}
                                aria-disabled={status === 'inactive'}
                                onClick={() => handleQuarterClick(member.id, q)}
                                className="mx-auto flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                              >
                                {status === 'submitted' ? (
                                  <CheckCircle2 className="h-4 w-4 text-success" />
                                ) : (
                                  <span
                                    className={`h-4 w-4 rounded-full border-2 ${
                                      status === 'inactive'
                                        ? 'border-muted-foreground/20 bg-muted/50'
                                        : 'border-muted-foreground/30'
                                    }`}
                                  />
                                )}
                              </button>
                            )
                          })()}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {teamMembers.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-6 py-10 text-center text-sm text-muted-foreground">
                        No direct reports found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Goal Distribution */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Goal Distribution by Thrust Area</CardTitle>
            <CardDescription>Team goals breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topThrustAreas.length === 0 ? (
                <p className="text-sm text-muted-foreground">No team goals found.</p>
              ) : topThrustAreas.map(([area, count]) => (
                <div key={area} className="flex items-center gap-4">
                  <div className="w-40 text-sm font-medium truncate">{area}</div>
                  <div className="flex-1">
                    <Progress value={totalGoals > 0 ? (count / totalGoals) * 100 : 0} className="h-2" />
                  </div>
                  <div className="w-12 text-right text-sm text-muted-foreground">{count} goals</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Sheet open={isQuarterSheetOpen} onOpenChange={setIsQuarterSheetOpen}>
        <SheetContent className="w-[420px] overflow-y-auto sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>Check-in Details</SheetTitle>
            <SheetDescription>
              {selectedQuarterDetail
                ? `${selectedQuarterDetail.employee.name} - ${selectedQuarter}`
                : selectedQuarter}
            </SheetDescription>
          </SheetHeader>

          <div className="px-4 pb-6">
            {isQuarterLoading ? (
              <p className="text-sm text-muted-foreground">Loading check-in details...</p>
            ) : (
              <div className="space-y-6">
                {quarterError && (
                  <Alert className="border-destructive/30 bg-destructive/5">
                    <AlertDescription className="text-destructive">{quarterError}</AlertDescription>
                  </Alert>
                )}

                {quarterMessage && (
                  <Alert className="border-warning/30 bg-warning/10">
                    <AlertDescription>{quarterMessage}</AlertDescription>
                  </Alert>
                )}

                {selectedQuarterDetail && selectedSubmittedRows.length > 0 && (
                  <>
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Employee</h4>
                      <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm">
                        <div className="grid gap-2 sm:grid-cols-2">
                          <p>
                            <span className="text-muted-foreground">Name:</span>{' '}
                            <span className="font-medium">{selectedQuarterDetail.employee.name}</span>
                          </p>
                          <p>
                            <span className="text-muted-foreground">Quarter:</span>{' '}
                            <span className="font-medium">{selectedQuarter}</span>
                          </p>
                          <p>
                            <span className="text-muted-foreground">Submitted:</span>{' '}
                            <span className="font-medium">{formatDateTime(selectedSubmittedDate)}</span>
                          </p>
                          <p>
                            <span className="text-muted-foreground">Status:</span>{' '}
                            <span className="font-medium">
                              {selectedQuarterDetail.quarterCompletionStatus.replace('_', ' ')}
                            </span>
                          </p>
                          <p>
                            <span className="text-muted-foreground">Goals:</span>{' '}
                            <span className="font-medium">{selectedQuarterDetail.goalsCount}</span>
                          </p>
                          <p>
                            <span className="text-muted-foreground">Score:</span>{' '}
                            <span className="font-medium">{selectedAverageScore}</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">Goals</h4>
                      {selectedQuarterDetail.plannedVsActual.map((row) => (
                        <div key={row.goalId} className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-medium">{row.goalTitle}</p>
                            <StatusBadge status={row.status} type="goal" />
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <p className="text-muted-foreground">Planned Target</p>
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
                          <p className="text-xs text-muted-foreground">
                            Employee note:{' '}
                            <span className="text-foreground">{row.employeeNote || '-'}</span>
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Evidence</h4>
                      {selectedQuarterDetail.evidenceAttachments.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No evidence uploaded</p>
                      ) : (
                        <div className="space-y-2">
                          {selectedQuarterDetail.evidenceAttachments.map((attachment) => (
                            <div
                              key={attachment.id}
                              className="flex flex-col gap-2 rounded-lg border border-border bg-muted/40 p-3 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div>
                                <p className="text-sm font-medium">{attachment.fileName}</p>
                                <p className="text-xs text-muted-foreground">
                                  Uploaded {formatDateTime(attachment.uploadedAt)}
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
                      {evidenceError && <p className="text-sm text-destructive">{evidenceError}</p>}
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Manager Comments</h4>
                      {commentTimeline.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No manager comments yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {commentTimeline.map((managerComment) => (
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
                              <p className="mt-1 text-xs text-muted-foreground">
                                {managerComment.managerName} - {formatDateTime(managerComment.createdAt)}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
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
                      <h4 className="text-sm font-medium">Add Manager Comment</h4>
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
                        onChange={(event) => setComment(event.target.value)}
                        rows={4}
                      />
                      <Button
                        type="button"
                        onClick={handleSubmitComment}
                        disabled={!comment.trim()}
                      >
                        Submit Comment
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  )
}
