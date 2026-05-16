'use client'

import { useState } from 'react'
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
import { mockTeamMembers, mockTeamGoals, mockGoalCycle } from '@/lib/mock-data'
import { 
  CheckCircle2, 
  X,
  Clock,
  User,
  Calendar,
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
  'percentage': 'Percentage',
  'timeline': 'Timeline',
  'zero-based': 'Zero Based',
}

export default function ManagerApprovalsPage() {
  const [selectedMember, setSelectedMember] = useState<string | null>('u4') // Karthik Iyer by default
  const [comments, setComments] = useState('')

  const pendingMembers = mockTeamMembers.filter(m => m.approvalStatus === 'pending')
  const selectedMemberData = mockTeamMembers.find(m => m.id === selectedMember)
  
  // Get goals for selected member
  const memberGoals = mockTeamGoals.filter(g => g.employeeId === selectedMember)
  const totalWeightage = memberGoals.reduce((sum, g) => sum + g.weightage, 0)

  const handleApprove = () => {
    alert('Goal sheet approved! (Demo only - no backend)')
  }

  const handleReturn = () => {
    alert('Goal sheet returned for rework! (Demo only - no backend)')
  }

  return (
    <DashboardLayout role="manager">
      <DashboardHeader
        title="Approvals"
        subtitle="Review and approve team goal sheets"
      />

      <div className="p-6 space-y-6">
        {pendingMembers.length === 0 ? (
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
                  {pendingMembers.map((member) => (
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
                          <p className="text-xs text-muted-foreground">{member.goalsCount} goals</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Review Panel */}
            <div className="lg:col-span-3 space-y-6">
              {selectedMemberData && (
                <>
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
                        <StatusBadge status="pending" type="approval" />
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

                  {/* Info Banner */}
                  <Alert className="border-primary/30 bg-primary/5">
                    <Lock className="h-4 w-4 text-primary" />
                    <AlertDescription className="text-primary">
                      Goals will be <span className="font-semibold">locked after approval</span>. Employee will not be able to edit without Admin intervention.
                    </AlertDescription>
                  </Alert>

                  {/* Goals Table */}
                  <Card className="border-border/60">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold">Submitted Goals</CardTitle>
                      <CardDescription>Review and adjust targets/weightage if needed</CardDescription>
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
                                  />
                                </TableCell>
                                <TableCell className="text-right tabular-nums">{goal.weightage}%</TableCell>
                                <TableCell className="text-right">
                                  <Input
                                    type="number"
                                    defaultValue={goal.weightage}
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

                  {/* Comments & Actions */}
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
                        onChange={(e) => setComments(e.target.value)}
                        rows={3}
                      />
                      <div className="flex gap-3">
                        <Button 
                          className="flex-1 bg-success hover:bg-success/90"
                          onClick={handleApprove}
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Approve Goal Sheet
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={handleReturn}
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
                        <div className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-background text-primary">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div className="flex-1 w-px bg-border mt-2" />
                          </div>
                          <div className="flex-1 pb-4">
                            <p className="text-sm font-medium">Goal sheet submitted for approval</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              by {selectedMemberData.name} on Oct 14, 2025
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-warning bg-background text-warning-foreground">
                              <Clock className="h-4 w-4" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">Pending manager approval</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Awaiting review
                            </p>
                          </div>
                        </div>
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
