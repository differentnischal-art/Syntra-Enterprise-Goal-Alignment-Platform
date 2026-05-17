'use client'

import { useEffect, useMemo, useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { SummaryCard } from '@/components/dashboard/summary-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
import { useToast } from '@/hooks/use-toast'
import { useCurrentProfile } from '@/hooks/use-current-profile'
import {
  getAdminEscalations,
  sendEscalationReminder,
  type AdminEscalation,
} from '@/lib/data/admin'
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Clock,
  Filter,
  Search,
  Shield,
  User,
  UserCheck,
  Users,
} from 'lucide-react'

function typeLabel(type: AdminEscalation['type']): string {
  if (type === 'goal-not-submitted') return 'Goal Not Submitted'
  if (type === 'approval-overdue') return 'Approval Overdue'
  if (type === 'checkin-pending') return 'Check-in Pending'
  return 'Weightage Mismatch'
}

function severityBadge(severity: AdminEscalation['severity']) {
  if (severity === 'high') return <Badge className="bg-destructive text-destructive-foreground">High</Badge>
  if (severity === 'medium') return <Badge className="bg-warning text-warning-foreground">Medium</Badge>
  return <Badge variant="secondary">Low</Badge>
}

function levelIcon(level: AdminEscalation['escalationLevel']) {
  if (level === 'manager') return <UserCheck className="h-4 w-4" />
  if (level === 'skip-level') return <Users className="h-4 w-4" />
  if (level === 'hr') return <Shield className="h-4 w-4" />
  return <User className="h-4 w-4" />
}

export default function EscalationsPage() {
  const { liveProfile } = useCurrentProfile()
  const { toast } = useToast()
  const [escalations, setEscalations] = useState<AdminEscalation[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [remindingId, setRemindingId] = useState<string | null>(null)

  const loadEscalations = async () => {
    setIsLoading(true)
    const rows = await getAdminEscalations()
    setEscalations(rows)
    setIsLoading(false)
  }

  useEffect(() => {
    loadEscalations()
  }, [])

  const filteredEscalations = useMemo(() => {
    return escalations.filter((escalation) => {
      const query = searchTerm.toLowerCase()
      const searchMatch =
        escalation.employeeName.toLowerCase().includes(query) ||
        escalation.message.toLowerCase().includes(query) ||
        escalation.department.toLowerCase().includes(query)
      const severityMatch =
        severityFilter === 'all' || escalation.severity === severityFilter
      const typeMatch = typeFilter === 'all' || escalation.type === typeFilter
      return searchMatch && severityMatch && typeMatch
    })
  }, [escalations, searchTerm, severityFilter, typeFilter])

  const highCount = escalations.filter((row) => row.severity === 'high').length
  const mediumCount = escalations.filter((row) => row.severity === 'medium').length
  const lowCount = escalations.filter((row) => row.severity === 'low').length

  const handleSendReminder = async (escalation: AdminEscalation) => {
    if (!liveProfile) return
    setRemindingId(escalation.id)
    const result = await sendEscalationReminder(escalation, liveProfile)
    setRemindingId(null)
    if (result.success) {
      toast({ title: 'Reminder sent', description: 'Notification and audit log created.' })
    } else {
      toast({
        title: 'Reminder failed',
        description: result.error ?? 'Could not create reminder.',
        variant: 'destructive',
      })
    }
  }

  return (
    <DashboardLayout role="admin">
      <DashboardHeader title="Escalations" />

      <div className="space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-4">
          <SummaryCard
            title="Total Escalations"
            value={escalations.length}
            subtitle="Computed from live data"
            icon={<AlertTriangle className="h-5 w-5" />}
            variant="danger"
          />
          <SummaryCard
            title="High"
            value={highCount}
            subtitle="10+ days overdue"
            icon={<AlertTriangle className="h-5 w-5" />}
            variant="danger"
          />
          <SummaryCard
            title="Medium"
            value={mediumCount}
            subtitle="5-9 days overdue"
            icon={<Clock className="h-5 w-5" />}
            variant="warning"
          />
          <SummaryCard
            title="Low"
            value={lowCount}
            subtitle="1-4 days or mismatch"
            icon={<Bell className="h-5 w-5" />}
            variant="default"
          />
        </div>

        <Card className="border-warning/20 bg-warning/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <AlertTriangle className="h-4 w-4 text-warning-foreground" />
              Live Escalation Rules
            </CardTitle>
            <CardDescription>
              Goal not submitted, approval overdue, check-in pending, and weightage mismatch are computed from Supabase.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Escalation Chain</CardTitle>
            <CardDescription>Automatic path based on days overdue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center justify-center gap-2 py-4">
              {[
                { label: 'Employee', detail: 'Day 1-3', icon: User },
                { label: 'Manager', detail: 'Day 4-7', icon: UserCheck },
                { label: 'Skip-Level', detail: 'Day 8-10', icon: Users },
                { label: 'HR', detail: 'Day 11+', icon: Shield },
              ].map((item, index) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <item.icon className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-medium">{item.label}</span>
                    <span className="text-[10px] text-muted-foreground">{item.detail}</span>
                  </div>
                  {index < 3 && <ArrowRight className="h-5 w-5 text-muted-foreground" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <CardTitle className="text-lg font-semibold">Active Escalations</CardTitle>
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search escalations..."
                    className="w-[220px] pl-9"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                </div>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-[140px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severity</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[180px]">
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
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead>Employee</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead className="text-center">Days</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEscalations.map((escalation, index) => (
                    <TableRow key={escalation.id} className={index % 2 === 0 ? 'bg-card' : 'bg-muted/25'}>
                      <TableCell>
                        <p className="font-medium">{escalation.employeeName}</p>
                        <p className="text-xs text-muted-foreground">{escalation.department}</p>
                      </TableCell>
                      <TableCell>{typeLabel(escalation.type)}</TableCell>
                      <TableCell>{severityBadge(escalation.severity)}</TableCell>
                      <TableCell className="min-w-[240px]">{escalation.message}</TableCell>
                      <TableCell className="text-center font-medium">{escalation.daysOverdue}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {levelIcon(escalation.escalationLevel)}
                          <span className="capitalize">{escalation.escalationLevel}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSendReminder(escalation)}
                          disabled={remindingId === escalation.id}
                        >
                          <Bell className="mr-1 h-4 w-4" />
                          Remind
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {!isLoading && filteredEscalations.length === 0 && (
              <div className="py-12 text-center">
                <Shield className="mx-auto mb-3 h-10 w-10 text-success" />
                <p className="font-medium">No live escalations found.</p>
                <p className="text-sm text-muted-foreground">
                  Submitted goals and check-ins will populate this view when rules are breached.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
