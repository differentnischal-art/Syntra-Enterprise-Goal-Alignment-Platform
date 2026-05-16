'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Header } from '@/components/layout/header'
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
import { mockAdminUser, mockAuditLogs } from '@/lib/mock-data'
import { AuditLog } from '@/lib/types'
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
  Send
} from 'lucide-react'

export default function AuditTrailPage() {
  const [auditLogs] = useState<AuditLog[]>(mockAuditLogs)
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [roleFilter, setRoleFilter] = useState<string>('all')

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch = 
      log.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.goalTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.auditId.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesAction = actionFilter === 'all' || log.actionType === actionFilter
    const matchesRole = roleFilter === 'all' || log.changedByRole === roleFilter
    return matchesSearch && matchesAction && matchesRole
  })

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'create':
        return <FilePlus className="h-4 w-4 text-success" />
      case 'update':
        return <FileEdit className="h-4 w-4 text-primary" />
      case 'approve':
        return <FileCheck className="h-4 w-4 text-success" />
      case 'return':
        return <FileX className="h-4 w-4 text-warning-foreground" />
      case 'submit':
        return <Send className="h-4 w-4 text-primary" />
      case 'delete':
        return <FileX className="h-4 w-4 text-destructive" />
      default:
        return <FileEdit className="h-4 w-4" />
    }
  }

  const getActionBadge = (actionType: string) => {
    switch (actionType) {
      case 'create':
        return <Badge className="bg-success/10 text-success">Created</Badge>
      case 'update':
        return <Badge className="bg-primary/10 text-primary">Updated</Badge>
      case 'approve':
        return <Badge className="bg-success/10 text-success">Approved</Badge>
      case 'return':
        return <Badge className="bg-warning/10 text-warning-foreground">Returned</Badge>
      case 'submit':
        return <Badge className="bg-primary/10 text-primary">Submitted</Badge>
      case 'delete':
        return <Badge className="bg-destructive/10 text-destructive">Deleted</Badge>
      default:
        return <Badge variant="secondary">{actionType}</Badge>
    }
  }

  const getRoleIcon = (role: string) => {
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
      <Header user={mockAdminUser} title="Audit Trail" />

      <div className="p-6 space-y-6">
        {/* Recent Changes Timeline */}
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
                      <span className="font-medium">{log.changedBy}</span>
                      <span className="text-muted-foreground">
                        {log.actionType === 'update' ? 'updated' : log.actionType + 'd'}
                      </span>
                      <span className="font-medium">{log.fieldChanged}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {log.goalTitle} ({log.employeeName})
                    </p>
                    {log.oldValue && log.newValue && (
                      <div className="text-xs text-muted-foreground">
                        <span className="line-through">{log.oldValue}</span>
                        {' → '}
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

        {/* Audit Log Table */}
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
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by audit ID, employee, or goal..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="create">Created</SelectItem>
                  <SelectItem value="update">Updated</SelectItem>
                  <SelectItem value="approve">Approved</SelectItem>
                  <SelectItem value="return">Returned</SelectItem>
                  <SelectItem value="submit">Submitted</SelectItem>
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

            {/* Table */}
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent bg-muted/50">
                    <TableHead className="w-[120px]">Audit ID</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Goal Title</TableHead>
                    <TableHead>Field Changed</TableHead>
                    <TableHead className="hidden md:table-cell">Old Value</TableHead>
                    <TableHead className="hidden md:table-cell">New Value</TableHead>
                    <TableHead>Changed By</TableHead>
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
                        <span className="font-medium">{log.employeeName}</span>
                      </TableCell>
                      <TableCell className="max-w-[180px]">
                        <span className="line-clamp-1 text-sm" title={log.goalTitle}>
                          {log.goalTitle}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getActionBadge(log.actionType)}
                          <span className="text-sm">{log.fieldChanged}</span>
                        </div>
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
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getRoleIcon(log.changedByRole)}
                          <span className="text-sm">{log.changedBy}</span>
                        </div>
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
