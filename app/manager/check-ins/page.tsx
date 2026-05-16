'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { mockManagerUser, mockTeamMembers, mockCheckIns, mockGoals, mockGoalCycle } from '@/lib/mock-data'
import { TeamMember } from '@/lib/types'
import { 
  Check, 
  X, 
  MessageSquare, 
  Target,
  TrendingUp,
  User,
  Send,
  Clock,
  Award,
  ThumbsUp,
  AlertTriangle,
  Lightbulb
} from 'lucide-react'

interface ManagerComment {
  id: string
  type: 'coaching' | 'appreciation' | 'needs-improvement' | 'escalation'
  text: string
  timestamp: string
}

const commentTypeOptions = [
  { value: 'coaching', label: 'Coaching', icon: Lightbulb, color: 'text-primary' },
  { value: 'appreciation', label: 'Appreciation', icon: ThumbsUp, color: 'text-success' },
  { value: 'needs-improvement', label: 'Needs Improvement', icon: AlertTriangle, color: 'text-warning-foreground' },
  { value: 'escalation', label: 'Escalation', icon: AlertTriangle, color: 'text-destructive' },
]

const uomLabels: Record<string, string> = {
  'numeric-higher-better': 'Higher Better',
  'numeric-lower-better': 'Lower Better',
  'percentage': '%',
  'timeline': 'Timeline',
  'zero-based': 'Zero Based',
}

export default function ManagerCheckInsPage() {
  const [teamMembers] = useState<TeamMember[]>(mockTeamMembers)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [comment, setComment] = useState('')
  const [commentType, setCommentType] = useState<string>('coaching')
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [comments, setComments] = useState<ManagerComment[]>([
    {
      id: 'c1',
      type: 'appreciation',
      text: 'Great progress on the API optimization initiative. Keep up the momentum!',
      timestamp: '2025-10-16 11:30'
    },
    {
      id: 'c2',
      type: 'coaching',
      text: 'Consider focusing on caching improvements for Q4 to meet the target.',
      timestamp: '2025-10-15 14:20'
    }
  ])

  const openReviewSheet = (member: TeamMember) => {
    setSelectedMember(member)
    setComment('')
    setCommentType('coaching')
    setIsSheetOpen(true)
  }

  const handleSubmitComment = () => {
    if (!comment.trim()) return
    
    const newComment: ManagerComment = {
      id: `c${Date.now()}`,
      type: commentType as ManagerComment['type'],
      text: comment,
      timestamp: new Date().toLocaleString('en-US', { 
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      })
    }
    
    setComments(prev => [newComment, ...prev])
    setComment('')
  }

  const getScoreBadge = (score: number | null) => {
    if (score === null) return <Badge variant="secondary">N/A</Badge>
    if (score >= 100) return <Badge className="bg-success/10 text-success border-0">{score}%</Badge>
    if (score >= 70) return <Badge className="bg-primary/10 text-primary border-0">{score}%</Badge>
    if (score >= 50) return <Badge className="bg-warning/10 text-warning-foreground border-0">{score}%</Badge>
    return <Badge className="bg-destructive/10 text-destructive border-0">{score}%</Badge>
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-success/10 text-success border-0">Completed</Badge>
      case 'on-track':
        return <Badge className="bg-primary/10 text-primary border-0">On Track</Badge>
      case 'not-started':
        return <Badge variant="secondary">Not Started</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  // Get goals for selected member (using Priya's goals for demo)
  const memberGoals = mockGoals
  const memberCheckIns = mockCheckIns

  return (
    <DashboardLayout role="manager">
      <Header 
        user={mockManagerUser} 
        title="Team Check-ins" 
        subtitle={mockGoalCycle.name}
      />

      <div className="p-6">
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">Quarterly Check-in Status</CardTitle>
            <CardDescription>Review team member progress and add feedback</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-muted/50">
                  <TableHead className="min-w-[160px]">Team Member</TableHead>
                  <TableHead className="hidden sm:table-cell">Department</TableHead>
                  <TableHead className="text-center">Goals</TableHead>
                  <TableHead className="text-center">Avg. Achievement</TableHead>
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
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 border border-border">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{member.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden sm:table-cell">{member.department}</TableCell>
                    <TableCell className="text-center">{member.goalsCount}</TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant="outline" 
                        className={`
                          ${member.averageAchievement >= 70 ? 'bg-success/10 text-success border-success/20' : 
                            member.averageAchievement >= 50 ? 'bg-warning/10 text-warning-foreground border-warning/20' :
                            'bg-muted text-muted-foreground'}
                        `}
                      >
                        {member.averageAchievement}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {member.checkIns.Q1 ? (
                        <Check className="mx-auto h-5 w-5 text-success" />
                      ) : (
                        <X className="mx-auto h-5 w-5 text-destructive/50" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {member.checkIns.Q2 ? (
                        <Check className="mx-auto h-5 w-5 text-success" />
                      ) : (
                        <X className="mx-auto h-5 w-5 text-destructive/50" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {member.checkIns.Q3 ? (
                        <Check className="mx-auto h-5 w-5 text-success" />
                      ) : (
                        <X className="mx-auto h-5 w-5 text-destructive/50" />
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {member.checkIns.Q4 ? (
                        <Check className="mx-auto h-5 w-5 text-success" />
                      ) : (
                        <X className="mx-auto h-5 w-5 text-destructive/50" />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8"
                        onClick={() => openReviewSheet(member)}
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

      {/* Review Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Check-in Review</SheetTitle>
            <SheetDescription>
              {selectedMember && `Review ${selectedMember.name}'s quarterly check-in and provide feedback`}
            </SheetDescription>
          </SheetHeader>

          {selectedMember && (
            <div className="mt-6 space-y-6">
              {/* Employee Profile Summary */}
              <Card className="border-border/60">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14 border border-border">
                      <AvatarFallback className="bg-primary/10 text-primary text-lg">
                        {selectedMember.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{selectedMember.name}</h3>
                      <p className="text-sm text-muted-foreground">{selectedMember.department}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
                    <div className="text-center">
                      <div className="flex items-center justify-center h-10 w-10 mx-auto rounded-full bg-primary/10">
                        <Target className="h-5 w-5 text-primary" />
                      </div>
                      <p className="text-lg font-semibold mt-2">{selectedMember.goalsCount}</p>
                      <p className="text-xs text-muted-foreground">Goals</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center h-10 w-10 mx-auto rounded-full bg-success/10">
                        <TrendingUp className="h-5 w-5 text-success" />
                      </div>
                      <p className="text-lg font-semibold mt-2">{selectedMember.averageAchievement}%</p>
                      <p className="text-xs text-muted-foreground">Avg. Achievement</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center h-10 w-10 mx-auto rounded-full bg-warning/10">
                        <Award className="h-5 w-5 text-warning-foreground" />
                      </div>
                      <p className="text-lg font-semibold mt-2">
                        {Object.values(selectedMember.checkIns).filter(Boolean).length}/4
                      </p>
                      <p className="text-xs text-muted-foreground">Check-ins Done</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quarter Status Cards */}
              <div>
                <h4 className="text-sm font-medium mb-3">Quarterly Status</h4>
                <div className="grid grid-cols-4 gap-2">
                  {(['Q1', 'Q2', 'Q3', 'Q4'] as const).map((quarter) => (
                    <div
                      key={quarter}
                      className={`rounded-lg border p-3 text-center ${
                        selectedMember.checkIns[quarter]
                          ? 'border-success/30 bg-success/5'
                          : 'border-border bg-muted/30'
                      }`}
                    >
                      <p className="text-xs font-medium text-muted-foreground">{quarter}</p>
                      {selectedMember.checkIns[quarter] ? (
                        <Check className="mx-auto mt-1 h-5 w-5 text-success" />
                      ) : (
                        <Clock className="mx-auto mt-1 h-5 w-5 text-muted-foreground" />
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {selectedMember.checkIns[quarter] ? 'Submitted' : 'Pending'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Planned vs Actual Section */}
              <div>
                <h4 className="text-sm font-medium mb-3">Planned vs Actual (Q3)</h4>
                <div className="space-y-3">
                  {memberCheckIns.map((checkIn) => (
                    <Card key={checkIn.id} className="border-border/60">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1">
                            <p className="text-sm font-medium line-clamp-1">{checkIn.goalTitle}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              UoM: {uomLabels[checkIn.unitOfMeasurement]}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {getScoreBadge(checkIn.score)}
                            {getStatusBadge(checkIn.status)}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Planned Target</p>
                            <p className="text-lg font-semibold text-muted-foreground">{checkIn.plannedTarget}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Actual Achievement</p>
                            <p className={`text-lg font-semibold ${
                              checkIn.actualAchievement !== null && checkIn.actualAchievement >= checkIn.plannedTarget
                                ? 'text-success'
                                : 'text-foreground'
                            }`}>
                              {checkIn.actualAchievement ?? '-'}
                            </p>
                          </div>
                        </div>
                        {checkIn.managerComment && (
                          <div className="mt-3 pt-3 border-t border-border">
                            <p className="text-xs text-muted-foreground mb-1">Manager Note</p>
                            <p className="text-sm text-muted-foreground italic">{checkIn.managerComment}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Add Comment Section */}
              <div>
                <h4 className="text-sm font-medium mb-3">Add Comment</h4>
                <Card className="border-border/60">
                  <CardContent className="p-4 space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Comment Type</label>
                      <Select value={commentType} onValueChange={setCommentType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {commentTypeOptions.map(opt => {
                            const Icon = opt.icon
                            return (
                              <SelectItem key={opt.value} value={opt.value}>
                                <div className="flex items-center gap-2">
                                  <Icon className={`h-4 w-4 ${opt.color}`} />
                                  {opt.label}
                                </div>
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <Textarea
                      placeholder="Enter your structured feedback or comment..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={3}
                    />
                    <Button
                      className="w-full"
                      onClick={handleSubmitComment}
                      disabled={!comment.trim()}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Submit Comment
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Previous Comments Timeline */}
              <div>
                <h4 className="text-sm font-medium mb-3">Previous Comments</h4>
                <div className="space-y-3">
                  {comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No comments yet</p>
                  ) : (
                    comments.map((c) => {
                      const typeConfig = commentTypeOptions.find(o => o.value === c.type)
                      const Icon = typeConfig?.icon || MessageSquare
                      return (
                        <div key={c.id} className="flex gap-3">
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted`}>
                            <Icon className={`h-4 w-4 ${typeConfig?.color || 'text-muted-foreground'}`} />
                          </div>
                          <div className="flex-1 rounded-lg border border-border bg-muted/30 p-3">
                            <div className="flex items-center justify-between mb-1">
                              <Badge variant="outline" className="text-[10px]">
                                {typeConfig?.label || 'Comment'}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground">{c.timestamp}</span>
                            </div>
                            <p className="text-sm">{c.text}</p>
                            <p className="text-xs text-muted-foreground mt-1">— {mockManagerUser.name}</p>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  )
}
