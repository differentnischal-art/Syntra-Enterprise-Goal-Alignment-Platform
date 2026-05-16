'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Header } from '@/components/layout/header'
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
import { mockManagerUser, mockTeamMembers, mockTeamGoals, mockGoalCycle } from '@/lib/mock-data'
import { TeamMember } from '@/lib/types'
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
  RotateCcw,
} from 'lucide-react'

const uomLabels: Record<string, string> = {
  'numeric-higher-better': 'Higher Better',
  'numeric-lower-better': 'Lower Better',
  'percentage': 'Percentage',
  'timeline': 'Timeline',
  'zero-based': 'Zero Based',
}

interface ReviewState {
  status: 'pending' | 'approved' | 'returned'
  lockedAt?: string
  returnedAt?: string
}

interface TimelineItem {
  id: string
  action: string
  by: string
  timestamp: string
  type: 'submit' | 'approve' | 'return' | 'pending'
}

export default function ManagerApprovalsPage() {
  const [selectedMember, setSelectedMember] = useState<string | null>('u4') // Karthik Iyer by default
  const [comments, setComments] = useState('')
  const [commentError, setCommentError] = useState<string | null>(null)
  const [reviewStates, setReviewStates] = useState<Record<string, ReviewState>>({})
  const [timelines, setTimelines] = useState<Record<string, TimelineItem[]>>({
    u4: [
      { id: 't1', action: 'Goal sheet submitted for approval', by: 'Karthik Iyer', timestamp: 'Oct 14, 2025 10:30 AM', type: 'submit' },
      { id: 't2', action: 'Pending manager approval', by: '', timestamp: '', type: 'pending' },
    ]
  })

  const pendingMembers = mockTeamMembers.filter(m => {
    const state = reviewStates[m.id]
    if (state) {
      return state.status === 'pending'
    }
    return m.approvalStatus === 'pending'
  })

  const selectedMemberData = mockTeamMembers.find(m => m.id === selectedMember)
  const currentReviewState = selectedMember ? reviewStates[selectedMember] : undefined
  const effectiveStatus = currentReviewState?.status || (selectedMemberData?.approvalStatus === 'pending' ? 'pending' : selectedMemberData?.approvalStatus)
  
  // Get goals for selected member
  const memberGoals = mockTeamGoals.filter(g => g.employeeId === selectedMember)
  const totalWeightage = memberGoals.reduce((sum, g) => sum + g.weightage, 0)

  const handleApprove = () => {
    if (!selectedMember || !selectedMemberData) return
    
    const timestamp = new Date().toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
    })

    setReviewStates(prev => ({
      ...prev,
      [selectedMember]: { status: 'approved', lockedAt: timestamp }
    }))

    setTimelines(prev => ({
      ...prev,
      [selectedMember]: [
        ...(prev[selectedMember]?.filter(t => t.type !== 'pending') || []),
        { 
          id: `t${Date.now()}`, 
          action: `Approved by ${mockManagerUser.name}`, 
          by: mockManagerUser.name, 
          timestamp, 
          type: 'approve' 
        },
        { 
          id: `t${Date.now() + 1}`, 
          action: 'Goal sheet locked', 
          by: 'System', 
          timestamp, 
          type: 'approve' 
        },
      ]
    }))

    setComments('')
    setCommentError(null)
  }

  const handleReturn = () => {
    if (!selectedMember || !selectedMemberData) return

    if (!comments.trim()) {
      setCommentError('Manager comment is required before returning for rework.')
      return
    }
    
    const timestamp = new Date().toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
    })

    setReviewStates(prev => ({
      ...prev,
      [selectedMember]: { status: 'returned', returnedAt: timestamp }
    }))

    setTimelines(prev => ({
      ...prev,
      [selectedMember]: [
        ...(prev[selectedMember]?.filter(t => t.type !== 'pending') || []),
        { 
          id: `t${Date.now()}`, 
          action: `Returned for rework with manager comments`, 
          by: mockManagerUser.name, 
          timestamp, 
          type: 'return' 
        },
      ]
    }))

    setComments('')
    setCommentError(null)
  }

  const isLocked = effectiveStatus === 'approved'
  const isReturned = effectiveStatus === 'returned'

  return (
    <DashboardLayout role="manager">
      <Header 
        user={mockManagerUser} 
        title="Approvals" 
        subtitle="Review and approve team goal sheets"
      />

      <div className="p-6 space-y-6">
        {pendingMembers.length === 0 && Object.keys(reviewStates).length === 0 ? (
          <Card className="border-border/60">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <h3 className="text-lg font-medium text-foreground">All Caught Up!</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                No pending goal sheet approvals at the moment.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-4">
            {/* Pending List */}
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Pending Reviews</CardTitle>
                <CardDescription>{pendingMembers.length} sheets awaiting approval</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {mockTeamMembers.filter(m => m.approvalStatus === 'pending' || reviewStates[m.id]).map((member) => {
                    const state = reviewStates[member.id]
                    const status = state?.status || 'pending'
                    return (
                      <button
                        key={member.id}
                        onClick={() => setSelectedMember(member.id)}
                        className={`
                          w-full flex items-center justify-between px-4 py-3 text-left transition-colors
                          ${selectedMember === member.id ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-muted/50'}
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 border border-border">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{member.name}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">{member.goalsCount} goals</span>
                              {status === 'approved' && (
                                <Badge className="h-4 text-[10px] bg-success/10 text-success border-0">Approved</Badge>
                              )}
                              {status === 'returned' && (
                                <Badge className="h-4 text-[10px] bg-destructive/10 text-destructive border-0">Returned</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Review Panel */}
            <div className="lg:col-span-3 space-y-6">
              {selectedMemberData && (
                <>
                  {/* Status Banners */}
                  {isLocked && (
                    <Alert className="border-success/30 bg-success/5">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <AlertDescription className="text-success">
                        <span className="font-semibold">Goal sheet approved and locked.</span> Employee goals are now finalized for this cycle.
                      </AlertDescription>
                    </Alert>
                  )}

                  {isReturned && (
                    <Alert className="border-destructive/30 bg-destructive/5">
                      <RotateCcw className="h-4 w-4 text-destructive" />
                      <AlertDescription className="text-destructive">
                        <span className="font-semibold">Goal sheet returned for rework.</span> Employee has been notified to make corrections.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Employee Summary */}
                  <Card className="border-border/60">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12 border border-border">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {selectedMemberData.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg font-semibold">{selectedMemberData.name}</CardTitle>
                            <CardDescription>{selectedMemberData.email}</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isLocked && (
                            <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 gap-1">
                              <Lock className="h-3 w-3" />
                              Locked
                            </Badge>
                          )}
                          {isReturned ? (
                            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                              Returned
                            </Badge>
                          ) : isLocked ? (
                            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                              Approved
                            </Badge>
                          ) : (
                            <StatusBadge status="pending" type="approval" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 sm:grid-cols-4">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Department</p>
                          <p className="text-sm font-medium">{selectedMemberData.department}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Submitted Date</p>
                          <p className="text-sm font-medium">Oct 14, 2025</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Total Goals</p>
                          <p className="text-sm font-medium">{selectedMemberData.goalsCount}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Total Weightage</p>
                          <p className={`text-sm font-medium ${totalWeightage === 100 ? 'text-success' : 'text-destructive'}`}>
                            {totalWeightage}%
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Validation Status */}
                  <Alert className={totalWeightage === 100 ? 'border-success/30 bg-success/5' : 'border-destructive/30 bg-destructive/5'}>
                    {totalWeightage === 100 ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    )}
                    <AlertDescription className={totalWeightage === 100 ? 'text-success' : 'text-destructive'}>
                      {totalWeightage === 100 
                        ? 'Validation passed: Total weightage equals 100%'
                        : `Validation failed: Total weightage is ${totalWeightage}% (must be 100%)`
                      }
                    </AlertDescription>
                  </Alert>

                  {/* Info Banner - only show if not yet decided */}
                  {!isLocked && !isReturned && (
                    <Alert className="border-primary/30 bg-primary/5">
                      <Lock className="h-4 w-4 text-primary" />
                      <AlertDescription className="text-primary">
                        Goals will be <span className="font-semibold">locked after approval</span>. Employee will not be able to edit without Admin intervention.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Goals Table */}
                  <Card className="border-border/60">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold">Submitted Goals</CardTitle>
                      <CardDescription>
                        {isLocked ? 'Goals are locked and cannot be modified' : 'Review and adjust targets/weightage if needed'}
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
                              <TableHead className="text-right w-[100px]">Target (Edit)</TableHead>
                              <TableHead className="text-right">Submitted Weight</TableHead>
                              <TableHead className="text-right w-[100px]">Weight (Edit)</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {memberGoals.map((goal, index) => (
                              <TableRow key={goal.id} className={index % 2 === 0 ? 'bg-card' : 'bg-muted/30'}>
                                <TableCell className="font-medium">
                                  <span className="line-clamp-2">{goal.title}</span>
                                </TableCell>
                                <TableCell className="text-muted-foreground">{goal.thrustArea}</TableCell>
                                <TableCell className="text-muted-foreground text-xs">
                                  {uomLabels[goal.unitOfMeasurement]}
                                </TableCell>
                                <TableCell className="text-right tabular-nums">{goal.target}</TableCell>
                                <TableCell className="text-right">
                                  <Input
                                    type="number"
                                    defaultValue={goal.target}
                                    className="h-8 w-20 text-right ml-auto"
                                    disabled={isLocked || isReturned}
                                  />
                                </TableCell>
                                <TableCell className="text-right tabular-nums">{goal.weightage}%</TableCell>
                                <TableCell className="text-right">
                                  <Input
                                    type="number"
                                    defaultValue={goal.weightage}
                                    className="h-8 w-20 text-right ml-auto"
                                    disabled={isLocked || isReturned}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Comments & Actions */}
                  <Card className="border-border/60">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Manager Comments
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Textarea
                          placeholder="Add your comments or feedback for the employee..."
                          value={comments}
                          onChange={(e) => {
                            setComments(e.target.value)
                            if (e.target.value.trim()) setCommentError(null)
                          }}
                          rows={3}
                          disabled={isLocked || isReturned}
                          className={commentError ? 'border-destructive' : ''}
                        />
                        {commentError && (
                          <p className="text-sm text-destructive mt-2">{commentError}</p>
                        )}
                      </div>
                      <div className="flex gap-3">
                        <Button 
                          className="flex-1 bg-success hover:bg-success/90"
                          onClick={handleApprove}
                          disabled={isLocked || isReturned}
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Approve Goal Sheet
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={handleReturn}
                          disabled={isLocked || isReturned}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Return for Rework
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Approval History */}
                  <Card className="border-border/60">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold">Approval History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {(timelines[selectedMember] || [
                          { id: 't1', action: 'Goal sheet submitted for approval', by: selectedMemberData.name, timestamp: 'Oct 14, 2025', type: 'submit' as const },
                          { id: 't2', action: 'Pending manager approval', by: '', timestamp: 'Awaiting review', type: 'pending' as const },
                        ]).map((item, index, arr) => (
                          <div key={item.id} className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 bg-background ${
                                item.type === 'approve' ? 'border-success text-success' :
                                item.type === 'return' ? 'border-destructive text-destructive' :
                                item.type === 'pending' ? 'border-warning text-warning-foreground' :
                                'border-primary text-primary'
                              }`}>
                                {item.type === 'approve' ? <CheckCircle2 className="h-4 w-4" /> :
                                 item.type === 'return' ? <RotateCcw className="h-4 w-4" /> :
                                 item.type === 'pending' ? <Clock className="h-4 w-4" /> :
                                 <FileText className="h-4 w-4" />}
                              </div>
                              {index < arr.length - 1 && <div className="flex-1 w-px bg-border mt-2" />}
                            </div>
                            <div className="flex-1 pb-4">
                              <p className="text-sm font-medium">{item.action}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {item.by ? `by ${item.by}` : ''} {item.timestamp ? (item.by ? `on ${item.timestamp}` : item.timestamp) : ''}
                              </p>
                            </div>
                          </div>
                        ))}
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
