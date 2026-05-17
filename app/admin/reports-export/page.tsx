'use client'

import { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useCurrentProfile } from '@/hooks/use-current-profile'
import { createAuditLog } from '@/lib/data/audit-logs'
import {
  getAdminReports,
  type AdminAchievementReportRow,
  type AdminCompletionReportRow,
} from '@/lib/data/admin'
import { Download, FileSpreadsheet, FileText, Target, TrendingUp } from 'lucide-react'

function escapeCsv(value: unknown): string {
  const text = value == null ? '' : String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function downloadBlob(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function statusBadge(status: string) {
  if (status === 'completed') return <Badge className="bg-success/10 text-success">Completed</Badge>
  if (status === 'on-track') return <Badge className="bg-primary/10 text-primary">On Track</Badge>
  if (status === 'overdue') return <Badge className="bg-destructive/10 text-destructive">Overdue</Badge>
  return <Badge variant="secondary">Not Started</Badge>
}

function scoreClass(score: number | null) {
  if (score == null) return 'text-muted-foreground'
  if (score >= 100) return 'font-semibold text-success'
  if (score >= 70) return 'text-primary'
  if (score >= 50) return 'text-warning-foreground'
  return 'text-destructive'
}

export default function ReportsExportPage() {
  const { liveProfile } = useCurrentProfile()
  const [achievementRows, setAchievementRows] = useState<AdminAchievementReportRow[]>([])
  const [completionRows, setCompletionRows] = useState<AdminCompletionReportRow[]>([])
  const [departments, setDepartments] = useState<string[]>([])
  const [quarterFilter, setQuarterFilter] = useState('all')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    getAdminReports().then((result) => {
      if (!cancelled) {
        setAchievementRows(result.achievementRows)
        setCompletionRows(result.completionRows)
        setDepartments(result.departments)
        setIsLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  const filteredAchievementRows = useMemo(() => {
    return achievementRows.filter((row) => {
      const quarterMatch = quarterFilter === 'all' || row.quarter === quarterFilter
      const departmentMatch = departmentFilter === 'all' || row.department === departmentFilter
      return quarterMatch && departmentMatch
    })
  }, [achievementRows, departmentFilter, quarterFilter])

  const filteredCompletionRows = useMemo(() => {
    return completionRows.filter((row) => {
      const quarterMatch = quarterFilter === 'all' || row.quarter === quarterFilter
      const departmentMatch = departmentFilter === 'all' || row.department === departmentFilter
      return quarterMatch && departmentMatch
    })
  }, [completionRows, departmentFilter, quarterFilter])

  const scoredRows = filteredAchievementRows.filter((row) => row.score != null)
  const avgScore =
    scoredRows.length > 0
      ? Math.round(scoredRows.reduce((sum, row) => sum + (row.score ?? 0), 0) / scoredRows.length)
      : null
  const submittedCheckIns = filteredCompletionRows.filter(
    (row) => row.checkInStatus === 'Submitted'
  ).length

  async function logExport(type: string) {
    if (!liveProfile) return
    await createAuditLog({
      actorId: liveProfile.id,
      actorRole: 'admin',
      actionType: 'report_exported',
      fieldChanged: type,
      newValue: `${quarterFilter}/${departmentFilter}`,
      description: `Admin exported ${type} report.`,
    })
  }

  const achievementHeaders = [
    'Employee',
    'Department',
    'Manager',
    'Goal',
    'Planned Target',
    'Actual Achievement',
    'Weightage',
    'Score',
    'Quarter',
    'Status',
  ]
  const completionHeaders = [
    'Employee',
    'Department',
    'Manager',
    'Quarter',
    'Check-in Status',
    'Submitted Date',
    'Manager Comment Status',
  ]

  async function exportCsv(reportType: 'achievement' | 'completion') {
    const rows =
      reportType === 'achievement'
        ? filteredAchievementRows.map((row) => [
            row.employeeName,
            row.department,
            row.managerName,
            row.goalTitle,
            row.plannedTarget,
            row.actualAchievement ?? '',
            `${row.weightage}%`,
            row.score == null ? '' : `${row.score}%`,
            row.quarter,
            row.status,
          ])
        : filteredCompletionRows.map((row) => [
            row.employeeName,
            row.department,
            row.managerName,
            row.quarter,
            row.checkInStatus,
            row.submittedDate ?? '',
            row.managerCommentStatus,
          ])
    const headers = reportType === 'achievement' ? achievementHeaders : completionHeaders
    const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n')
    downloadBlob(`${reportType}-report.csv`, csv, 'text/csv;charset=utf-8')
    await logExport(`${reportType}_csv`)
  }

  async function exportExcel(reportType: 'achievement' | 'completion') {
    const headers = reportType === 'achievement' ? achievementHeaders : completionHeaders
    const rows =
      reportType === 'achievement'
        ? filteredAchievementRows.map((row) => [
            row.employeeName,
            row.department,
            row.managerName,
            row.goalTitle,
            row.plannedTarget,
            row.actualAchievement ?? '',
            `${row.weightage}%`,
            row.score == null ? '' : `${row.score}%`,
            row.quarter,
            row.status,
          ])
        : filteredCompletionRows.map((row) => [
            row.employeeName,
            row.department,
            row.managerName,
            row.quarter,
            row.checkInStatus,
            row.submittedDate ?? '',
            row.managerCommentStatus,
          ])

    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows])
    XLSX.utils.book_append_sheet(workbook, worksheet, reportType)
    XLSX.writeFile(workbook, `${reportType}-report.xlsx`)
    await logExport(`${reportType}_excel`)
  }

  return (
    <DashboardLayout role="admin">
      <DashboardHeader title="Reports & Export" />

      <div className="space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-border/60">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Report Rows</p>
              <p className="mt-1 text-2xl font-semibold">{filteredAchievementRows.length}</p>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Submitted Check-ins</p>
              <p className="mt-1 text-2xl font-semibold text-success">{submittedCheckIns}</p>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Avg Score</p>
              <p className={`mt-1 text-2xl font-semibold ${scoreClass(avgScore)}`}>
                {avgScore == null ? '-' : `${avgScore}%`}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Departments</p>
              <p className="mt-1 text-2xl font-semibold">{departments.length}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/60">
          <CardHeader>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">Live Report Preview</CardTitle>
                <CardDescription>
                  Built from Supabase profiles, goal sheets, goals, and check-ins.
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Select value={quarterFilter} onValueChange={setQuarterFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Quarter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Quarters</SelectItem>
                    <SelectItem value="Q1">Q1</SelectItem>
                    <SelectItem value="Q2">Q2</SelectItem>
                    <SelectItem value="Q3">Q3</SelectItem>
                    <SelectItem value="Q4">Q4</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((department) => (
                      <SelectItem key={department} value={department}>
                        {department}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="achievement">
              <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <TabsList>
                  <TabsTrigger value="achievement">Achievement Report</TabsTrigger>
                  <TabsTrigger value="completion">Completion Report</TabsTrigger>
                </TabsList>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => exportCsv('achievement')}>
                    <FileText className="mr-2 h-4 w-4" />
                    Achievement CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => exportExcel('achievement')}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Achievement Excel
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => exportCsv('completion')}>
                    <Download className="mr-2 h-4 w-4" />
                    Completion CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => exportExcel('completion')}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Completion Excel
                  </Button>
                </div>
              </div>

              <TabsContent value="achievement">
                <div className="overflow-x-auto rounded-lg border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        {achievementHeaders.map((header) => (
                          <TableHead key={header} className="whitespace-nowrap">
                            {header}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAchievementRows.map((row, index) => (
                        <TableRow key={row.id} className={index % 2 === 0 ? 'bg-card' : 'bg-muted/25'}>
                          <TableCell className="font-medium">{row.employeeName}</TableCell>
                          <TableCell>{row.department}</TableCell>
                          <TableCell>{row.managerName}</TableCell>
                          <TableCell className="min-w-[220px]">{row.goalTitle}</TableCell>
                          <TableCell className="text-right">{row.plannedTarget}</TableCell>
                          <TableCell className="text-right">{row.actualAchievement ?? '-'}</TableCell>
                          <TableCell className="text-right">{row.weightage}%</TableCell>
                          <TableCell className={`text-right ${scoreClass(row.score)}`}>
                            {row.score == null ? '-' : `${row.score}%`}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">{row.quarter}</Badge>
                          </TableCell>
                          <TableCell>{statusBadge(row.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {!isLoading && filteredAchievementRows.length === 0 && (
                  <div className="py-12 text-center">
                    <Target className="mx-auto mb-3 h-10 w-10 text-primary" />
                    <p className="font-medium">No live data found yet.</p>
                    <p className="text-sm text-muted-foreground">
                      Create employee goals/check-ins to populate this report.
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="completion">
                <div className="overflow-x-auto rounded-lg border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        {completionHeaders.map((header) => (
                          <TableHead key={header} className="whitespace-nowrap">
                            {header}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCompletionRows.map((row, index) => (
                        <TableRow key={row.id} className={index % 2 === 0 ? 'bg-card' : 'bg-muted/25'}>
                          <TableCell className="font-medium">{row.employeeName}</TableCell>
                          <TableCell>{row.department}</TableCell>
                          <TableCell>{row.managerName}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{row.quarter}</Badge>
                          </TableCell>
                          <TableCell>{row.checkInStatus}</TableCell>
                          <TableCell>{row.submittedDate ? new Date(row.submittedDate).toLocaleDateString('en-IN') : '-'}</TableCell>
                          <TableCell>{row.managerCommentStatus}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Showing live rows for the selected filters.
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
