'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Header } from '@/components/layout/header'
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
import { mockAdminUser, mockAuditLogs } from '@/lib/mock-data'
import { Download } from 'lucide-react'

export default function AdminAuditLogPage() {
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
    console.log('Exporting CSV...')
  }

  return (
    <DashboardLayout role="admin">
      <Header user={mockAdminUser} title="Audit Log" />

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
                {mockAuditLogs.map((log, index) => (
                  <TableRow
                    key={log.id}
                    className={index % 2 === 0 ? 'bg-card' : 'bg-muted/30'}
                  >
                    <TableCell className="font-medium">{log.employeeName}</TableCell>
                    <TableCell className="max-w-[200px] truncate" title={log.goalTitle}>
                      {log.goalTitle}
                    </TableCell>
                    <TableCell>{log.fieldChanged}</TableCell>
                    <TableCell className="text-muted-foreground">{log.oldValue}</TableCell>
                    <TableCell>{log.newValue}</TableCell>
                    <TableCell className="text-muted-foreground">{log.changedBy}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatTimestamp(log.timestamp)}
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
