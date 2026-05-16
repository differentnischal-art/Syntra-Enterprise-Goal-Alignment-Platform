'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { mockAdminUser, mockReportData, mockDepartmentCompletion } from '@/lib/mock-data'
import { Report } from '@/lib/types'
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  BarChart3,
  PieChart,
  TrendingUp,
  CheckCircle2,
  Clock,
  Target
} from 'lucide-react'
import { downloadCSV, formatReportDataForExport } from '@/lib/export-csv'

export default function ReportsExportPage() {
  const [reportData] = useState<Report[]>(mockReportData)
  const [quarterFilter, setQuarterFilter] = useState<string>('Q3')
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')

  const filteredReports = reportData.filter((report) => {
    const matchesQuarter = quarterFilter === 'all' || report.quarter === quarterFilter
    const matchesDepartment = departmentFilter === 'all' || report.department === departmentFilter
    return matchesQuarter && matchesDepartment
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-success/10 text-success">Completed</Badge>
      case 'on-track':
        return <Badge className="bg-primary/10 text-primary">On Track</Badge>
      case 'overdue':
        return <Badge className="bg-destructive/10 text-destructive">Overdue</Badge>
      case 'not-started':
        return <Badge variant="secondary">Not Started</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-muted-foreground'
    if (score >= 100) return 'text-success font-semibold'
    if (score >= 70) return 'text-primary'
    if (score >= 50) return 'text-warning-foreground'
    return 'text-destructive'
  }

  const handleExportCSV = (reportType: string) => {
    if (reportType === 'achievement' || reportType === 'preview') {
      downloadCSV('achievement_report.csv', formatReportDataForExport(filteredReports))
    } else if (reportType === 'completion') {
      const completionData = mockDepartmentCompletion.map(d => ({
        Department: d.department,
        'Total Employees': d.totalEmployees,
        'Sheets Locked': d.sheetsLocked,
        'Q1 (%)': d.Q1,
        'Q2 (%)': d.Q2,
        'Q3 (%)': d.Q3,
        'Q4 (%)': d.Q4,
      }))
      downloadCSV('completion_report.csv', completionData)
    } else if (reportType === 'scores') {
      downloadCSV('score_analysis.csv', formatReportDataForExport(filteredReports))
    }
  }

  const handleExportExcel = (reportType: string) => {
    // For demo, Excel export uses the same CSV function
    handleExportCSV(reportType)
  }

  // Calculate summary stats
  const avgScore = filteredReports.filter(r => r.score !== null).reduce((sum, r) => sum + (r.score || 0), 0) / 
    filteredReports.filter(r => r.score !== null).length || 0
  const completedCount = filteredReports.filter(r => r.status === 'completed').length
  const totalGoals = filteredReports.length

  return (
    <DashboardLayout role="admin">
      <Header user={mockAdminUser} title="Reports & Export" />

      <div className="p-6 space-y-6">
        {/* Report Type Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <Badge variant="outline">Most Used</Badge>
              </div>
              <h3 className="font-semibold mb-1">Achievement Report</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Planned vs actual achievement across all employees
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleExportCSV('achievement')}
                >
                  <FileText className="mr-1 h-4 w-4" />
                  CSV
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleExportExcel('achievement')}
                >
                  <FileSpreadsheet className="mr-1 h-4 w-4" />
                  Excel
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
                  <PieChart className="h-6 w-6 text-success" />
                </div>
              </div>
              <h3 className="font-semibold mb-1">Completion Dashboard</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Department-wise check-in completion rates
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleExportCSV('completion')}
                >
                  <FileText className="mr-1 h-4 w-4" />
                  CSV
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleExportExcel('completion')}
                >
                  <FileSpreadsheet className="mr-1 h-4 w-4" />
                  Excel
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10">
                  <BarChart3 className="h-6 w-6 text-warning-foreground" />
                </div>
              </div>
              <h3 className="font-semibold mb-1">Score Analysis</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Weighted scores and performance distribution
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleExportCSV('scores')}
                >
                  <FileText className="mr-1 h-4 w-4" />
                  CSV
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleExportExcel('scores')}
                >
                  <FileSpreadsheet className="mr-1 h-4 w-4" />
                  Excel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Report Preview */}
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">Report Preview</CardTitle>
                <CardDescription>
                  Preview data before exporting
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <Select value={quarterFilter} onValueChange={setQuarterFilter}>
                  <SelectTrigger className="w-[120px]">
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
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    <SelectItem value="Engineering">Engineering</SelectItem>
                    <SelectItem value="Product">Product</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="Customer Success">Customer Success</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={() => handleExportCSV('preview')}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Summary Stats */}
            <div className="grid gap-4 md:grid-cols-4 mb-6">
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Total Goals</span>
                </div>
                <p className="text-2xl font-semibold">{totalGoals}</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span className="text-xs text-muted-foreground">Completed</span>
                </div>
                <p className="text-2xl font-semibold text-success">{completedCount}</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">In Progress</span>
                </div>
                <p className="text-2xl font-semibold text-primary">{totalGoals - completedCount}</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Avg Score</span>
                </div>
                <p className={`text-2xl font-semibold ${getScoreColor(avgScore)}`}>
                  {Math.round(avgScore)}%
                </p>
              </div>
            </div>

            {/* Data Table */}
            <Tabs defaultValue="achievement" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="achievement">Achievement Report</TabsTrigger>
                <TabsTrigger value="completion">Completion Report</TabsTrigger>
              </TabsList>

              <TabsContent value="achievement">
                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent bg-muted/50">
                        <TableHead>Employee</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Manager</TableHead>
                        <TableHead>Goal</TableHead>
                        <TableHead className="text-right">Planned</TableHead>
                        <TableHead className="text-right">Actual</TableHead>
                        <TableHead className="text-right">Weightage</TableHead>
                        <TableHead className="text-right">Score</TableHead>
                        <TableHead className="text-center">Quarter</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReports.map((report, index) => (
                        <TableRow
                          key={`${report.employeeId}-${report.goalTitle}-${index}`}
                          className={index % 2 === 0 ? 'bg-card' : 'bg-muted/30'}
                        >
                          <TableCell className="font-medium">
                            {report.employeeName}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {report.department}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {report.managerName}
                          </TableCell>
                          <TableCell className="max-w-[200px]">
                            <span className="line-clamp-1" title={report.goalTitle}>
                              {report.goalTitle}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            {report.plannedTarget}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {report.actualAchievement ?? '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {report.weightage}%
                          </TableCell>
                          <TableCell className={`text-right ${getScoreColor(report.score)}`}>
                            {report.score !== null ? `${report.score}%` : '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">{report.quarter}</Badge>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(report.status)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="completion">
                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent bg-muted/50">
                        <TableHead>Department</TableHead>
                        <TableHead className="text-right">Employees</TableHead>
                        <TableHead className="text-right">Sheets Locked</TableHead>
                        <TableHead className="text-center">Q1</TableHead>
                        <TableHead className="text-center">Q2</TableHead>
                        <TableHead className="text-center">Q3</TableHead>
                        <TableHead className="text-center">Q4</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockDepartmentCompletion.map((dept, index) => (
                        <TableRow
                          key={dept.department}
                          className={index % 2 === 0 ? 'bg-card' : 'bg-muted/30'}
                        >
                          <TableCell className="font-medium">
                            {dept.department}
                          </TableCell>
                          <TableCell className="text-right">
                            {dept.totalEmployees}
                          </TableCell>
                          <TableCell className="text-right">
                            {dept.sheetsLocked}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={dept.Q1 >= 80 ? 'text-success font-medium' : dept.Q1 >= 50 ? 'text-warning-foreground' : 'text-destructive'}>
                              {dept.Q1}%
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={dept.Q2 >= 80 ? 'text-success font-medium' : dept.Q2 >= 50 ? 'text-warning-foreground' : 'text-destructive'}>
                              {dept.Q2}%
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={dept.Q3 >= 80 ? 'text-success font-medium' : dept.Q3 >= 50 ? 'text-warning-foreground' : 'text-destructive'}>
                              {dept.Q3}%
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-muted-foreground">
                              {dept.Q4}%
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <span>Showing {filteredReports.length} records</span>
              <span>Data as of {new Date().toLocaleDateString('en-IN')}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
