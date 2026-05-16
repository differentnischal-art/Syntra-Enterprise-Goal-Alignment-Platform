'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Header } from '@/components/layout/header'
import { SummaryCard } from '@/components/dashboard/summary-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { mockManagerUser, mockTeamMembers } from '@/lib/mock-data'
import { TeamMember } from '@/lib/types'
import { 
  TrendingUp, 
  Users, 
  Target,
  Award,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react'

export default function ManagerPerformancePage() {
  const [teamMembers] = useState<TeamMember[]>(mockTeamMembers)

  // Calculate performance metrics
  const avgAchievement = Math.round(
    teamMembers.reduce((sum, m) => sum + m.averageAchievement, 0) / teamMembers.length
  )
  const topPerformers = teamMembers.filter(m => m.averageAchievement >= 65).length
  const needsAttention = teamMembers.filter(m => m.averageAchievement > 0 && m.averageAchievement < 50).length
  const notStarted = teamMembers.filter(m => m.averageAchievement === 0).length

  const getPerformanceBadge = (achievement: number) => {
    if (achievement >= 80) {
      return <Badge className="bg-success/10 text-success">Excellent</Badge>
    }
    if (achievement >= 65) {
      return <Badge className="bg-primary/10 text-primary">Good</Badge>
    }
    if (achievement >= 50) {
      return <Badge className="bg-warning/10 text-warning-foreground">On Track</Badge>
    }
    if (achievement > 0) {
      return <Badge className="bg-destructive/10 text-destructive">Needs Attention</Badge>
    }
    return <Badge variant="secondary">Not Started</Badge>
  }

  const getCheckInCompletion = (member: TeamMember) => {
    const completed = Object.values(member.checkIns).filter(Boolean).length
    return `${completed}/4`
  }

  return (
    <DashboardLayout role="manager">
      <Header user={mockManagerUser} title="Team Performance" />

      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <SummaryCard
            title="Team Avg Achievement"
            value={`${avgAchievement}%`}
            subtitle="Across all goals"
            icon={<TrendingUp className="h-5 w-5" />}
            variant={avgAchievement >= 60 ? 'success' : 'warning'}
          />
          <SummaryCard
            title="Top Performers"
            value={topPerformers}
            subtitle="65%+ achievement"
            icon={<Award className="h-5 w-5" />}
            variant="success"
          />
          <SummaryCard
            title="Needs Attention"
            value={needsAttention}
            subtitle="Below 50% achievement"
            icon={<AlertCircle className="h-5 w-5" />}
            variant="danger"
          />
          <SummaryCard
            title="Not Started"
            value={notStarted}
            subtitle="No progress recorded"
            icon={<Clock className="h-5 w-5" />}
            variant="default"
          />
        </div>

        {/* Performance Distribution */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Performance Distribution</CardTitle>
            <CardDescription>Team members by achievement level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-lg border border-success/20 bg-success/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  <span className="font-medium">Excellent (80%+)</span>
                </div>
                <p className="text-3xl font-bold text-success">
                  {teamMembers.filter(m => m.averageAchievement >= 80).length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">team members</p>
              </div>
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-5 w-5 text-primary" />
                  <span className="font-medium">Good (65-79%)</span>
                </div>
                <p className="text-3xl font-bold text-primary">
                  {teamMembers.filter(m => m.averageAchievement >= 65 && m.averageAchievement < 80).length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">team members</p>
              </div>
              <div className="rounded-lg border border-warning/20 bg-warning/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-warning-foreground" />
                  <span className="font-medium">On Track (50-64%)</span>
                </div>
                <p className="text-3xl font-bold text-warning-foreground">
                  {teamMembers.filter(m => m.averageAchievement >= 50 && m.averageAchievement < 65).length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">team members</p>
              </div>
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <span className="font-medium">{'Needs Focus (<50%)'}</span>
                </div>
                <p className="text-3xl font-bold text-destructive">
                  {teamMembers.filter(m => m.averageAchievement > 0 && m.averageAchievement < 50).length + 
                   teamMembers.filter(m => m.averageAchievement === 0).length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">team members</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Performance Table */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Team Performance Details</CardTitle>
            <CardDescription>Individual performance metrics for your direct reports</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Team Member</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-center">Goals</TableHead>
                  <TableHead className="text-center">Weightage</TableHead>
                  <TableHead className="text-center">Achievement</TableHead>
                  <TableHead className="text-center">Check-ins</TableHead>
                  <TableHead>Performance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamMembers
                  .sort((a, b) => b.averageAchievement - a.averageAchievement)
                  .map((member, index) => (
                  <TableRow
                    key={member.id}
                    className={index % 2 === 0 ? 'bg-card' : 'bg-muted/30'}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{member.department}</TableCell>
                    <TableCell className="text-center">{member.goalsCount}</TableCell>
                    <TableCell className="text-center">{member.totalWeightage}%</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all ${
                              member.averageAchievement >= 65 ? 'bg-success' :
                              member.averageAchievement >= 50 ? 'bg-warning' :
                              member.averageAchievement > 0 ? 'bg-destructive' : 'bg-muted'
                            }`}
                            style={{ width: `${Math.min(member.averageAchievement, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-10 text-right">
                          {member.averageAchievement}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{getCheckInCompletion(member)}</Badge>
                    </TableCell>
                    <TableCell>
                      {getPerformanceBadge(member.averageAchievement)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
