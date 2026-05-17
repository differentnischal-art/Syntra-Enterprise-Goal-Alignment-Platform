'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardHeader } from '@/components/layout/dashboard-header'
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
import { getAuditLogs, type AuditLogRow } from '@/lib/data/audit-logs'
import { Download } from 'lucide-react'

export default function AdminAuditLogPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLogRow[]>([])

  useEffect(() => {
    let cancelled = false
    getAuditLogs().then((rows) => {
      if (!cancelled) {
        setAuditLogs(rows)
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleExportCSV = () => {
    const rows = [
      ['Employee Name', 'Goal Title', 'Field Changed', 'Old Value', 'New Value', 'Changed By', 'Timestamp'],
      ...auditLogs.map((log) => [
        log.employeeName,
        log.goalTitle,
        log.fieldChanged ?? '',
        log.oldValue ?? '',
        log.newValue ?? '',
        log.actorName,
        log.createdAt,
      ]),
    ]

    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'audit-log.csv'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <DashboardLayout role="admin">
      <DashboardHeader title="Audit Log" />

      <div className="p-6">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Activity Log</CardTitle>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Employee Name</TableHead>
                  <TableHead>Goal Title</TableHead>
                  <TableHead>Field Changed</TableHead>
                  <TableHead>Old Value</TableHead>
                  <TableHead>New Value</TableHead>
                  <TableHead>Changed By</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map((log, index) => (
                  <TableRow
                    key={log.id}
                    className={index % 2 === 0 ? 'bg-card' : 'bg-muted/30'}
                  >
                    <TableCell className="font-medium">{log.employeeName}</TableCell>
                    <TableCell className="max-w-[200px] truncate" title={log.goalTitle}>
                      {log.goalTitle}
                    </TableCell>
                    <TableCell>{log.fieldChanged ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{log.oldValue ?? '—'}</TableCell>
                    <TableCell>{log.newValue ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{log.actorName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatTimestamp(log.createdAt)}
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
