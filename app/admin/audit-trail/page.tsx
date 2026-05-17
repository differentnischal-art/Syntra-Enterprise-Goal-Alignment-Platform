'use client'

import { useEffect, useMemo, useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardHeader } from '@/components/layout/dashboard-header'
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
import { useCurrentProfile } from '@/hooks/use-current-profile'
import { getAuditLogs, type AuditLogRow } from '@/lib/data/audit-logs'
import { mockAuditLogs } from '@/lib/mock-data'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import type { UserRole } from '@/lib/types'
import {
  ClipboardList,
  Search,
  Filter,
  Download,
  Clock,
  User,
  UserCheck,
  Shield,
  FileEdit,
  FileCheck,
  FilePlus,
  FileX,
  Send,
} from 'lucide-react'

type AuditTrailEntry = {
  id: string
  auditId: string
  actorName: string
  actorRole: UserRole | null
  employeeName: string
  goalTitle: string
  actionType: string
  fieldChanged: string | null
  oldValue: string | null
  newValue: string | null
  description: string | null
  timestamp: string
}

function labelAction(actionType: string): string {
  return actionType
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function mapLiveAuditLog(row: AuditLogRow): AuditTrailEntry {
  return {
    id: row.id,
    auditId: row.auditId,
    actorName: row.actorName,
    actorRole: row.actorRole,
    employeeName: row.employeeName,
    goalTitle: row.goalTitle,
    actionType: row.actionType,
    fieldChanged: row.fieldChanged,
    oldValue: row.oldValue,
    newValue: row.newValue,
    description: row.description,
    timestamp: row.createdAt,
  }
}

function mapMockAuditLog(log: (typeof mockAuditLogs)[number]): AuditTrailEntry {
  return {
    id: log.id,
    auditId: log.auditId,
    actorName: log.changedBy,
    actorRole: log.changedByRole,
    employeeName: log.employeeName,
    goalTitle: log.goalTitle,
    actionType: log.actionType,
    fieldChanged: log.fieldChanged,
    oldValue: log.oldValue,
    newValue: log.newValue,
    description: `${log.changedBy} changed ${log.fieldChanged}`,
    timestamp: log.timestamp,
  }
}

export default function AuditTrailPage() {
  const { liveProfile } = useCurrentProfile()
  const [liveAuditLogs, setLiveAuditLogs] = useState<AuditTrailEntry[] | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [roleFilter, setRoleFilter] = useState<string>('all')

  useEffect(() => {
    if (liveProfile?.role !== 'admin') {
      setLiveAuditLogs(null)
      return
    }

    let cancelled = false
    getAuditLogs().then((logs) => {
      if (!cancelled) {
        setLiveAuditLogs(logs.map(mapLiveAuditLog))
      }
    })

    return () => {
      cancelled = true
    }
  }, [liveProfile])

  const auditLogs = isSupabaseConfigured()
    ? liveAuditLogs ?? []
    : mockAuditLogs.map(mapMockAuditLog)
  const isLiveMode = isSupabaseConfigured()

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const query = searchTerm.toLowerCase()
      const matchesSearch =
        log.employeeName.toLowerCase().includes(query) ||
        log.goalTitle.toLowerCase().includes(query) ||
        log.auditId.toLowerCase().includes(query) ||
        log.actorName.toLowerCase().includes(query) ||
        (log.description ?? '').toLowerCase().includes(query)
      const matchesAction = actionFilter === 'all' || log.actionType === actionFilter
      const matchesRole = roleFilter === 'all' || log.actorRole === roleFilter
      return matchesSearch && matchesAction && matchesRole
    })
  }, [actionFilter, auditLogs, roleFilter, searchTerm])

  const actionOptions = useMemo(() => {
    return Array.from(new Set(auditLogs.map((log) => log.actionType))).sort()
  }, [auditLogs])

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'create':
      case 'goal_created':
        return <FilePlus className="h-4 w-4 text-success" />
      case 'approve':
      case 'goal_approved':
        return <FileCheck className="h-4 w-4 text-success" />
      case 'return':
      case 'goal_returned':
        return <FileX className="h-4 w-4 text-warning-foreground" />
      case 'submit':
      case 'goal_submitted':
      case 'checkin_submitted':
        return <Send className="h-4 w-4 text-primary" />
      case 'delete':
        return <FileX className="h-4 w-4 text-destructive" />
      default:
        return <FileEdit className="h-4 w-4 text-primary" />
    }
  }

  const getActionBadge = (actionType: string) => {
    const className =
      actionType.includes('approved')
        ? 'bg-success/10 text-success'
        : actionType.includes('returned')
          ? 'bg-warning/10 text-warning-foreground'
          : actionType.includes('delete')
            ? 'bg-destructive/10 text-destructive'
            : 'bg-primary/10 text-primary'

    return <Badge className={className}>{labelAction(actionType)}</Badge>
  }

  const getRoleIcon = (role: UserRole | null) => {
    switch (role) {
      case 'employee':
        return <User className="h-4 w-4" />
      case 'manager':
        return <UserCheck className="h-4 w-4" />
      case 'admin':
        return <Shield className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleExport = () => {
    console.log('Exporting audit trail...')
  }

  return (
    <DashboardLayout role="admin">
      <DashboardHeader title="Audit Trail" />

      <div className="p-6 space-y-6">
        <div className="flex justify-end">
          <Badge variant="outline">
            {isLiveMode ? 'Live Supabase audit logs' : 'Demo audit logs'}
          </Badge>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
            <CardDescription>Last 5 changes in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {auditLogs.slice(0, 5).map((log, index) => (
                <div key={log.id} className="flex items-start gap-4">
                  <div className="relative">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      {getActionIcon(log.actionType)}
                    </div>
                    {index < 4 && (
                      <div className="absolute left-4 top-8 h-full w-0.5 bg-border" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{log.actorName}</span>
                      <span className="text-muted-foreground">{labelAction(log.actionType)}</span>
                      {log.fieldChanged && (
                        <span className="font-medium">{log.fieldChanged}</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {log.description ?? `${log.goalTitle} (${log.employeeName})`}
                    </p>
                    {log.oldValue && log.newValue && (
                      <div className="text-xs text-muted-foreground">
                        <span className="line-through">{log.oldValue}</span>
                        {' -> '}
                        <span className="text-foreground font-medium">{log.newValue}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatTimestamp(log.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">Full Audit Log</CardTitle>
                <CardDescription>
                  Complete history of all goal and check-in changes
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by audit ID, employee, actor, or description..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {actionOptions.map((action) => (
                    <SelectItem key={action} value={action}>
                      {labelAction(action)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent bg-muted/50">
                    <TableHead className="w-[120px]">Audit ID</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Action Type</TableHead>
                    <TableHead>Field Changed</TableHead>
                    <TableHead className="hidden md:table-cell">Old Value</TableHead>
                    <TableHead className="hidden md:table-cell">New Value</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[150px]">Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log, index) => (
                    <TableRow
                      key={log.id}
                      className={index % 2 === 0 ? 'bg-card' : 'bg-muted/30'}
                    >
                      <TableCell>
                        <span className="font-mono text-xs text-muted-foreground">
                          {log.auditId}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getRoleIcon(log.actorRole)}
                          <span className="text-sm">{log.actorName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{log.employeeName}</span>
                      </TableCell>
                      <TableCell>{getActionBadge(log.actionType)}</TableCell>
                      <TableCell>
                        <span className="text-sm">{log.fieldChanged || '-'}</span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-sm text-muted-foreground">
                          {log.oldValue || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-sm font-medium">
                          {log.newValue || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[220px]">
                        <span className="line-clamp-2 text-sm" title={log.description ?? log.goalTitle}>
                          {log.description ?? log.goalTitle}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(log.timestamp)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {filteredLogs.length === 0 && (
              <div className="py-8 text-center text-muted-foreground">
                No audit logs found matching your filters
              </div>
            )}
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <span>Showing {filteredLogs.length} of {auditLogs.length} entries</span>
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                <span>Last updated: {formatTimestamp(new Date().toISOString())}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
