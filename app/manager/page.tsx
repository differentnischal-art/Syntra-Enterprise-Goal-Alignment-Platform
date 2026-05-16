'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Header } from '@/components/layout/header'
import { SummaryCard } from '@/components/dashboard/summary-card'
import { StatusBadge } from '@/components/goals/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { mockManagerUser, mockTeamGoals, mockTeamMembers } from '@/lib/mock-data'
import { Goal, TeamMember } from '@/lib/types'
import { Users, Target, CheckCircle2, Clock, Check, X, MessageSquare } from 'lucide-react'

export default function ManagerDashboard() {
  const [goals, setGoals] = useState<Goal[]>(mockTeamGoals)
  const [teamMembers] = useState<TeamMember[]>(mockTeamMembers)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [comment, setComment] = useState('')
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const totalTeamMembers = teamMembers.length
  const pendingApprovals = goals.filter((g) => g.approvalStatus === 'pending').length
  const approvedGoals = goals.filter((g) => g.approvalStatus === 'approved').length
  const returnedGoals = goals.filter((g) => g.approvalStatus === 'returned').length

  const handleApprove = (goalId: string) => {
    setGoals(
      goals.map((g) =>
        g.id === goalId ? { ...g, approvalStatus: 'approved' } : g
      )
    )
  }

  const handleReturn = (goalId: string) => {
    setGoals(
      goals.map((g) =>
        g.id === goalId ? { ...g, approvalStatus: 'returned' } : g
      )
    )
  }

  const openCommentSheet = (member: TeamMember) => {
    setSelectedMember(member)
    setComment('')
    setIsSheetOpen(true)
  }

  const handleSubmitComment = () => {
    console.log('Comment submitted for', selectedMember?.name, ':', comment)
    setIsSheetOpen(false)
    setComment('')
  }

  return (
    <DashboardLayout role="manager">
      <Header user={mockManagerUser} title="Manager Dashboard" />

      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="Team Members"
            value={totalTeamMembers}
            subtitle="Direct reports"
            icon={<Users className="h-5 w-5" />}
            variant="default"
          />
          <SummaryCard
            title="Pending Approvals"
            value={pendingApprovals}
            subtitle="Goals awaiting review"
            icon={<Clock className="h-5 w-5" />}
            variant="warning"
          />
          <SummaryCard
            title="Approved Goals"
            value={approvedGoals}
            subtitle="This cycle"
            icon={<CheckCircle2 className="h-5 w-5" />}
            variant="success"
          />
          <SummaryCard
            title="Returned Goals"
            value={returnedGoals}
            subtitle="Needs revision"
            icon={<Target className="h-5 w-5" />}
            variant="danger"
          />
        </div>

        {/* Team Goals Table */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Team Goal Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            {goals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <Target className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground">No goals submitted</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Team members have not submitted any goals yet.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="min-w-[100px]">Employee</TableHead>
                    <TableHead className="min-w-[150px]">Goal Title</TableHead>
                    <TableHead className="hidden md:table-cell">Thrust Area</TableHead>
                    <TableHead className="w-[70px] text-right">Target</TableHead>
                    <TableHead className="w-[70px] text-right">Weight</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="w-[160px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {goals.map((goal, index) => (
                    <TableRow
                      key={goal.id}
                      className={index % 2 === 0 ? 'bg-card' : 'bg-muted/30'}
                    >
                      <TableCell className="font-medium">{goal.employeeName}</TableCell>
                      <TableCell><span className="line-clamp-1">{goal.title}</span></TableCell>
                      <TableCell className="text-muted-foreground hidden md:table-cell">
                        <span className="line-clamp-1">{goal.thrustArea}</span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{goal.target}</TableCell>
                      <TableCell className="text-right tabular-nums">{goal.weightage}%</TableCell>
                      <TableCell>
                        <StatusBadge status={goal.approvalStatus} type="approval" />
                      </TableCell>
                      <TableCell className="text-right">
                        {goal.approvalStatus === 'pending' && (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 border-success/30 text-success hover:bg-success/10 hover:text-success"
                              onClick={() => handleApprove(goal.id)}
                            >
                              <Check className="mr-1 h-3 w-3" />
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => handleReturn(goal.id)}
                            >
                              <X className="mr-1 h-3 w-3" />
                              Return
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Team Check-ins Table */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Quarterly Check-in Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Team Member</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-center">Q1</TableHead>
                  <TableHead className="text-center">Q2</TableHead>
                  <TableHead className="text-center">Q3</TableHead>
                  <TableHead className="text-center">Q4</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamMembers.map((member, index) => (
                  <TableRow
                    key={member.id}
                    className={index % 2 === 0 ? 'bg-card' : 'bg-muted/30'}
                  >
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell className="text-muted-foreground">{member.department}</TableCell>
                    <TableCell className="text-center">
                      {member.checkIns.Q1 ? (
                        <Check className="mx-auto h-5 w-5 text-success" />
                      ) : (
                        <X className="mx-auto h-5 w-5 text-destructive" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {member.checkIns.Q2 ? (
                        <Check className="mx-auto h-5 w-5 text-success" />
                      ) : (
                        <X className="mx-auto h-5 w-5 text-destructive" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {member.checkIns.Q3 ? (
                        <Check className="mx-auto h-5 w-5 text-success" />
                      ) : (
                        <X className="mx-auto h-5 w-5 text-destructive" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {member.checkIns.Q4 ? (
                        <Check className="mx-auto h-5 w-5 text-success" />
                      ) : (
                        <X className="mx-auto h-5 w-5 text-destructive" />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8"
                        onClick={() => openCommentSheet(member)}
                      >
                        <MessageSquare className="mr-1 h-4 w-4" />
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Comment Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Check-in Review</SheetTitle>
            <SheetDescription>
              {selectedMember && `Review ${selectedMember.name}'s quarterly check-in`}
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
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Check-in Progress</h4>
                <div className="grid grid-cols-4 gap-2">
                  {(['Q1', 'Q2', 'Q3', 'Q4'] as const).map((quarter) => (
                    <div
                      key={quarter}
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
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Add Comment</h4>
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
