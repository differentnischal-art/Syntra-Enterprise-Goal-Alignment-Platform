'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { mockTeamMembers } from '@/lib/mock-data'
import { TeamMember } from '@/lib/types'
import { Check, X, MessageSquare } from 'lucide-react'

export default function ManagerCheckInsPage() {
  const [teamMembers] = useState<TeamMember[]>(mockTeamMembers)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [comment, setComment] = useState('')
  const [isSheetOpen, setIsSheetOpen] = useState(false)

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
      <DashboardHeader title="Team Check-ins" />

      <div className="p-6">
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
                  <TableHead>Goals</TableHead>
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
                    <TableCell>{member.goalsCount}</TableCell>
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
