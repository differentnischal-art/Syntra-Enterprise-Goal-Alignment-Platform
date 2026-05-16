'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Header } from '@/components/layout/header'
import { SummaryCard } from '@/components/dashboard/summary-card'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { mockManagerUser, mockTeamGoals, mockTeamMembers, thrustAreas, mockGoalCycle } from '@/lib/mock-data'
import { Goal } from '@/lib/types'
import { 
  Target, 
  Clock, 
  CheckCircle2, 
  RotateCcw, 
  Search,
  MoreHorizontal,
  FileText,
  ClipboardCheck,
  Calendar,
  Filter,
  Users,
  Lock
} from 'lucide-react'

const uomLabels: Record<string, string> = {
  'numeric-higher-better': 'Higher Better',
  'numeric-lower-better': 'Lower Better',
  'percentage': '%',
  'timeline': 'Timeline',
  'zero-based': 'Zero Based',
}

export default function ManagerTeamGoalsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [employeeFilter, setEmployeeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [thrustAreaFilter, setThrustAreaFilter] = useState<string>('all')
  const [quarterFilter, setQuarterFilter] = useState<string>('all')

  // Calculate summary stats
  const totalGoals = mockTeamGoals.length
  const pendingApproval = mockTeamGoals.filter(g => g.approvalStatus === 'pending').length
  const approvedSheets = mockTeamMembers.filter(m => m.approvalStatus === 'approved').length
  const returnedSheets = mockTeamMembers.filter(m => m.approvalStatus === 'returned').length

  // Get unique employees from team goals
  const employees = useMemo(() => {
    const uniqueEmployees = new Map<string, string>()
    mockTeamGoals.forEach(g => {
      if (g.employeeId && g.employeeName) {
        uniqueEmployees.set(g.employeeId, g.employeeName)
      }
    })
    return Array.from(uniqueEmployees, ([id, name]) => ({ id, name }))
  }, [])

  // Filter goals
  const filteredGoals = useMemo(() => {
    return mockTeamGoals.filter(goal => {
      const matchesSearch = 
        searchQuery === '' ||
        goal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        goal.employeeName?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesEmployee = employeeFilter === 'all' || goal.employeeId === employeeFilter
      const matchesStatus = statusFilter === 'all' || goal.approvalStatus === statusFilter || goal.status === statusFilter
      const matchesThrustArea = thrustAreaFilter === 'all' || goal.thrustArea === thrustAreaFilter
      
      return matchesSearch && matchesEmployee && matchesStatus && matchesThrustArea
    })
  }, [searchQuery, employeeFilter, statusFilter, thrustAreaFilter])

  const getSheetStatusBadge = (goal: Goal) => {
    if (goal.isLocked) {
      return <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 gap-1"><Lock className="h-3 w-3" />Locked</Badge>
    }
    switch (goal.approvalStatus) {
      case 'approved':
        return <Badge variant="outline" className="bg-success/10 text-success border-success/20">Approved</Badge>
      case 'pending':
        return <Badge variant="outline" className="bg-warning/10 text-warning-foreground border-warning/20">Pending Approval</Badge>
      case 'returned':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Returned</Badge>
      case 'draft':
        return <Badge variant="outline" className="bg-muted text-muted-foreground">Draft</Badge>
      default:
        return <Badge variant="outline">{goal.approvalStatus}</Badge>
    }
  }

  const getGoalStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-success/10 text-success border-0">Completed</Badge>
      case 'on-track':
        return <Badge className="bg-primary/10 text-primary border-0">On Track</Badge>
      case 'not-started':
        return <Badge variant="secondary">Not Started</Badge>
      case 'overdue':
        return <Badge className="bg-destructive/10 text-destructive border-0">Overdue</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <DashboardLayout role="manager">
      <Header 
        user={mockManagerUser} 
        title="Team Goals" 
        subtitle="Review submitted goals, statuses, and team alignment across the current cycle"
      />

      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="Total Team Goals"
            value={totalGoals}
            subtitle="Across all team members"
            icon={<Target className="h-5 w-5" />}
            variant="default"
          />
          <SummaryCard
            title="Pending Approval"
            value={pendingApproval}
            subtitle="Awaiting your review"
            icon={<Clock className="h-5 w-5" />}
            variant="warning"
          />
          <SummaryCard
            title="Approved Sheets"
            value={approvedSheets}
            subtitle="Team members"
            icon={<CheckCircle2 className="h-5 w-5" />}
            variant="success"
          />
          <SummaryCard
            title="Returned Sheets"
            value={returnedSheets}
            subtitle="Needs rework"
            icon={<RotateCcw className="h-5 w-5" />}
            variant="destructive"
          />
        </div>

        {/* Filters */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base font-semibold">Filters</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by employee or goal title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Employee Filter */}
              <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                <SelectTrigger className="w-full lg:w-[180px]">
                  <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full lg:w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending Approval</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="returned">Returned</SelectItem>
                  <SelectItem value="on-track">On Track</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="not-started">Not Started</SelectItem>
                </SelectContent>
              </Select>

              {/* Thrust Area Filter */}
              <Select value={thrustAreaFilter} onValueChange={setThrustAreaFilter}>
                <SelectTrigger className="w-full lg:w-[180px]">
                  <SelectValue placeholder="Thrust Area" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Thrust Areas</SelectItem>
                  {thrustAreas.map(area => (
                    <SelectItem key={area} value={area}>{area}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Quarter Filter */}
              <Select value={quarterFilter} onValueChange={setQuarterFilter}>
                <SelectTrigger className="w-full lg:w-[120px]">
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
            </div>
          </CardContent>
        </Card>

        {/* Team Goals Table */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Team Goals ({filteredGoals.length})</CardTitle>
                <CardDescription>{mockGoalCycle.name}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent bg-muted/50">
                    <TableHead className="min-w-[140px]">Employee</TableHead>
                    <TableHead className="min-w-[200px]">Goal Title</TableHead>
                    <TableHead className="hidden lg:table-cell">Thrust Area</TableHead>
                    <TableHead className="hidden md:table-cell text-center w-[80px]">UoM</TableHead>
                    <TableHead className="text-right w-[80px]">Target</TableHead>
                    <TableHead className="text-right w-[80px]">Weight</TableHead>
                    <TableHead className="w-[130px]">Sheet Status</TableHead>
                    <TableHead className="hidden sm:table-cell w-[110px]">Goal Status</TableHead>
                    <TableHead className="text-right w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGoals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-32 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <Target className="h-8 w-8 mb-2" />
                          <p>No goals found matching your filters</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredGoals.map((goal, index) => (
                      <TableRow
                        key={goal.id}
                        className={index % 2 === 0 ? 'bg-card' : 'bg-muted/30'}
                      >
                        <TableCell className="font-medium">{goal.employeeName}</TableCell>
                        <TableCell>
                          <span className="line-clamp-2 text-sm" title={goal.title}>
                            {goal.title}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground hidden lg:table-cell text-sm">
                          {goal.thrustArea}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-center hidden md:table-cell text-xs">
                          {uomLabels[goal.unitOfMeasurement]}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{goal.target}</TableCell>
                        <TableCell className="text-right tabular-nums">{goal.weightage}%</TableCell>
                        <TableCell>{getSheetStatusBadge(goal)}</TableCell>
                        <TableCell className="hidden sm:table-cell">{getGoalStatusBadge(goal.status)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/manager/approvals`} className="flex items-center gap-2 cursor-pointer">
                                  <FileText className="h-4 w-4" />
                                  Open Goal Sheet
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/manager/approvals`} className="flex items-center gap-2 cursor-pointer">
                                  <ClipboardCheck className="h-4 w-4" />
                                  Review
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/manager/check-ins`} className="flex items-center gap-2 cursor-pointer">
                                  <Calendar className="h-4 w-4" />
                                  View Check-ins
                                </Link>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="border-t border-border px-4 py-3 text-sm text-muted-foreground">
              Showing {filteredGoals.length} of {totalGoals} goals
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
