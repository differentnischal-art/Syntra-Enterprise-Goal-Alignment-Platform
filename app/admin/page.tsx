'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Header } from '@/components/layout/header'
import { SummaryCard } from '@/components/dashboard/summary-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  mockAdminUser,
  mockAuditLogs,
  mockDepartmentCompletion,
  mockEmployees,
} from '@/lib/mock-data'
import { Users, Target, FileText, Activity, Download, Send } from 'lucide-react'

export default function AdminDashboard() {
  const [sharedGoalTitle, setSharedGoalTitle] = useState('')
  const [sharedGoalTarget, setSharedGoalTarget] = useState('')
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])

  const totalEmployees = mockEmployees.length
  const averageCompletion =
    mockDepartmentCompletion.reduce((sum, d) => sum + d.Q1 + d.Q2 + d.Q3 + d.Q4, 0) /
    (mockDepartmentCompletion.length * 4)

  const toggleEmployee = (employeeId: string) => {
    setSelectedEmployees((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    )
  }

  const handlePushSharedGoal = () => {
    console.log('Pushing shared goal:', {
      title: sharedGoalTitle,
      target: sharedGoalTarget,
      employees: selectedEmployees,
    })
    setSharedGoalTitle('')
    setSharedGoalTarget('')
    setSelectedEmployees([])
  }

  const handleExportCSV = () => {
    console.log('Exporting CSV...')
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getCompletionColor = (value: number) => {
    if (value >= 80) return 'bg-success'
    if (value >= 50) return 'bg-warning'
    if (value > 0) return 'bg-destructive/70'
    return 'bg-muted'
  }

  return (
    <DashboardLayout role="admin">
      <Header user={mockAdminUser} title="Admin Dashboard" />

      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="Total Employees"
            value={totalEmployees}
            subtitle="Across all departments"
            icon={<Users className="h-5 w-5" />}
            variant="default"
          />
          <SummaryCard
            title="Active Goals"
            value={42}
            subtitle="This cycle"
            icon={<Target className="h-5 w-5" />}
            variant="default"
          />
          <SummaryCard
            title="Avg Completion"
            value={`${Math.round(averageCompletion)}%`}
            subtitle="Check-in rate"
            icon={<Activity className="h-5 w-5" />}
            variant="success"
          />
          <SummaryCard
            title="Audit Entries"
            value={mockAuditLogs.length}
            subtitle="Last 30 days"
            icon={<FileText className="h-5 w-5" />}
            variant="default"
          />
        </div>

        {/* Department Completion Heatmap */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Department Check-in Completion Rates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left text-sm font-medium text-muted-foreground pb-3 pr-4">
                      Department
                    </th>
                    <th className="text-center text-sm font-medium text-muted-foreground pb-3 px-2 w-20">
                      Q1
                    </th>
                    <th className="text-center text-sm font-medium text-muted-foreground pb-3 px-2 w-20">
                      Q2
                    </th>
                    <th className="text-center text-sm font-medium text-muted-foreground pb-3 px-2 w-20">
                      Q3
                    </th>
                    <th className="text-center text-sm font-medium text-muted-foreground pb-3 px-2 w-20">
                      Q4
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mockDepartmentCompletion.map((dept) => (
                    <tr key={dept.department} className="border-t border-border">
                      <td className="py-3 pr-4 text-sm font-medium">{dept.department}</td>
                      {(['Q1', 'Q2', 'Q3', 'Q4'] as const).map((quarter) => (
                        <td key={quarter} className="py-3 px-2">
                          <div
                            className={`mx-auto h-10 w-16 rounded-md flex items-center justify-center text-sm font-medium ${getCompletionColor(
                              dept[quarter]
                            )} ${dept[quarter] >= 50 ? 'text-white' : 'text-foreground'}`}
                          >
                            {dept[quarter]}%
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="h-3 w-3 rounded bg-success" />
                80%+
              </span>
              <span className="flex items-center gap-1">
                <span className="h-3 w-3 rounded bg-warning" />
                50-79%
              </span>
              <span className="flex items-center gap-1">
                <span className="h-3 w-3 rounded bg-destructive/70" />
                1-49%
              </span>
              <span className="flex items-center gap-1">
                <span className="h-3 w-3 rounded bg-muted border border-border" />
                Not Started
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Audit Log */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Audit Log</CardTitle>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="min-w-[100px]">Employee</TableHead>
                    <TableHead className="min-w-[120px]">Goal Title</TableHead>
                    <TableHead className="w-[90px]">Field</TableHead>
                    <TableHead className="w-[80px] hidden md:table-cell">Old Value</TableHead>
                    <TableHead className="w-[80px] hidden md:table-cell">New Value</TableHead>
                    <TableHead className="w-[90px] hidden lg:table-cell">Changed By</TableHead>
                    <TableHead className="w-[120px]">Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                {mockAuditLogs.map((log, index) => (
                  <TableRow
                    key={log.id}
                    className={index % 2 === 0 ? 'bg-card' : 'bg-muted/30'}
                  >
                    <TableCell className="font-medium">{log.employeeName}</TableCell>
                    <TableCell className="max-w-[150px]">
                      <span className="line-clamp-1" title={log.goalTitle}>{log.goalTitle}</span>
                    </TableCell>
                    <TableCell>{log.fieldChanged}</TableCell>
                    <TableCell className="text-muted-foreground hidden md:table-cell">{log.oldValue}</TableCell>
                    <TableCell className="hidden md:table-cell">{log.newValue}</TableCell>
                    <TableCell className="text-muted-foreground hidden lg:table-cell">{log.changedBy}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatTimestamp(log.timestamp)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Shared Goal Push Form */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Push Shared Goal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="kpiTitle">KPI Title</Label>
                  <Input
                    id="kpiTitle"
                    placeholder="e.g., Complete compliance training"
                    value={sharedGoalTitle}
                    onChange={(e) => setSharedGoalTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target">Target</Label>
                  <Input
                    id="target"
                    type="number"
                    placeholder="e.g., 100"
                    value={sharedGoalTarget}
                    onChange={(e) => setSharedGoalTarget(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Select Employees</Label>
                <div className="max-h-[180px] overflow-y-auto rounded-lg border border-border p-3 space-y-2">
                  {mockEmployees.map((employee) => (
                    <div
                      key={employee.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={employee.id}
                        checked={selectedEmployees.includes(employee.id)}
                        onCheckedChange={() => toggleEmployee(employee.id)}
                      />
                      <label
                        htmlFor={employee.id}
                        className="flex-1 cursor-pointer text-sm"
                      >
                        {employee.name}
                        <span className="ml-2 text-muted-foreground">
                          ({employee.department})
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedEmployees.length} employee(s) selected
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                onClick={handlePushSharedGoal}
                disabled={
                  !sharedGoalTitle.trim() ||
                  !sharedGoalTarget ||
                  selectedEmployees.length === 0
                }
              >
                <Send className="mr-2 h-4 w-4" />
                Push Goal
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
