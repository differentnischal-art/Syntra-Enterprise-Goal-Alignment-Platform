'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Header } from '@/components/layout/header'
import { SummaryCard } from '@/components/dashboard/summary-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { mockAdminUser, mockEscalations } from '@/lib/mock-data'
import { Escalation, EscalationSeverity } from '@/lib/types'
import { 
  AlertTriangle, 
  Clock, 
  Users, 
  ArrowRight, 
  Bell,
  Search,
  Filter,
  User,
  UserCheck,
  Shield
} from 'lucide-react'

export default function EscalationsPage() {
  const [escalations] = useState<Escalation[]>(mockEscalations)
  const [searchTerm, setSearchTerm] = useState('')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const filteredEscalations = escalations.filter((escalation) => {
    const matchesSearch = 
      escalation.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      escalation.message.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSeverity = severityFilter === 'all' || escalation.severity === severityFilter
    const matchesType = typeFilter === 'all' || escalation.type === typeFilter
    return matchesSearch && matchesSeverity && matchesType
  })

  const highCount = escalations.filter(e => e.severity === 'high' || e.severity === 'critical').length
  const mediumCount = escalations.filter(e => e.severity === 'medium').length
  const lowCount = escalations.filter(e => e.severity === 'low').length

  const getSeverityBadge = (severity: EscalationSeverity) => {
    switch (severity) {
      case 'critical':
        return <Badge className="bg-destructive text-destructive-foreground">Critical</Badge>
      case 'high':
        return <Badge className="bg-destructive/80 text-destructive-foreground">High</Badge>
      case 'medium':
        return <Badge className="bg-warning text-warning-foreground">Medium</Badge>
      case 'low':
        return <Badge variant="secondary">Low</Badge>
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'goal-not-submitted':
        return 'Goal Not Submitted'
      case 'approval-overdue':
        return 'Approval Overdue'
      case 'checkin-pending':
        return 'Check-in Pending'
      case 'weightage-mismatch':
        return 'Weightage Mismatch'
      default:
        return type
    }
  }

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'employee':
        return <User className="h-4 w-4" />
      case 'manager':
        return <UserCheck className="h-4 w-4" />
      case 'skip-level':
        return <Users className="h-4 w-4" />
      case 'hr':
        return <Shield className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  const handleSendReminder = (escalationId: string) => {
    console.log('Sending reminder for escalation:', escalationId)
  }

  return (
    <DashboardLayout role="admin">
      <Header user={mockAdminUser} title="Escalations" />

      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <SummaryCard
            title="Total Escalations"
            value={escalations.length}
            subtitle="Active escalations"
            icon={<AlertTriangle className="h-5 w-5" />}
            variant="danger"
          />
          <SummaryCard
            title="High Severity"
            value={highCount}
            subtitle="Requires immediate action"
            icon={<AlertTriangle className="h-5 w-5" />}
            variant="danger"
          />
          <SummaryCard
            title="Medium Severity"
            value={mediumCount}
            subtitle="Needs attention"
            icon={<Clock className="h-5 w-5" />}
            variant="warning"
          />
          <SummaryCard
            title="Low Severity"
            value={lowCount}
            subtitle="Monitor status"
            icon={<Bell className="h-5 w-5" />}
            variant="default"
          />
        </div>

        {/* Escalation Rules Info */}
        <Card className="shadow-sm border-warning/20 bg-warning/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning-foreground" />
              Escalation Rules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">Goal Submission</p>
                <p className="text-xs text-muted-foreground">
                  Escalate if employee has not submitted goals within 7 days of window opening
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Manager Approval</p>
                <p className="text-xs text-muted-foreground">
                  Escalate if manager has not approved goals within 5 days of submission
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Quarterly Check-in</p>
                <p className="text-xs text-muted-foreground">
                  Escalate if check-in not completed within active window period
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Escalation Chain Visual */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Escalation Chain</CardTitle>
            <CardDescription>
              Automatic escalation path based on days overdue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-2 py-4">
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <User className="h-6 w-6 text-muted-foreground" />
                </div>
                <span className="text-xs font-medium">Employee</span>
                <span className="text-[10px] text-muted-foreground">Day 1-3</span>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground mx-2" />
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
                  <UserCheck className="h-6 w-6 text-warning-foreground" />
                </div>
                <span className="text-xs font-medium">Manager</span>
                <span className="text-[10px] text-muted-foreground">Day 4-7</span>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground mx-2" />
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                  <Users className="h-6 w-6 text-destructive" />
                </div>
                <span className="text-xs font-medium">Skip-Level</span>
                <span className="text-[10px] text-muted-foreground">Day 8-10</span>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground mx-2" />
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/20">
                  <Shield className="h-6 w-6 text-destructive" />
                </div>
                <span className="text-xs font-medium">HR</span>
                <span className="text-[10px] text-muted-foreground">Day 11+</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Escalations Table */}
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <CardTitle className="text-lg font-semibold">Active Escalations</CardTitle>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search escalations..."
                    className="pl-9 w-[200px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-[130px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severity</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="goal-not-submitted">Goal Not Submitted</SelectItem>
                    <SelectItem value="approval-overdue">Approval Overdue</SelectItem>
                    <SelectItem value="checkin-pending">Check-in Pending</SelectItem>
                    <SelectItem value="weightage-mismatch">Weightage Mismatch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead className="text-center">Days Overdue</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEscalations.map((escalation, index) => (
                  <TableRow
                    key={escalation.id}
                    className={index % 2 === 0 ? 'bg-card' : 'bg-muted/30'}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium">{escalation.employeeName}</p>
                        <p className="text-xs text-muted-foreground">{escalation.department}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{getTypeLabel(escalation.type)}</span>
                    </TableCell>
                    <TableCell>{getSeverityBadge(escalation.severity)}</TableCell>
                    <TableCell className="max-w-[200px]">
                      <span className="text-sm line-clamp-2">{escalation.message}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`font-medium ${
                        escalation.daysOverdue > 7 ? 'text-destructive' : 
                        escalation.daysOverdue > 3 ? 'text-warning-foreground' : ''
                      }`}>
                        {escalation.daysOverdue}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getLevelIcon(escalation.escalationLevel)}
                        <span className="text-sm capitalize">{escalation.escalationLevel}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleSendReminder(escalation.id)}
                      >
                        <Bell className="mr-1 h-4 w-4" />
                        Remind
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredEscalations.length === 0 && (
              <div className="py-8 text-center text-muted-foreground">
                No escalations found matching your filters
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
