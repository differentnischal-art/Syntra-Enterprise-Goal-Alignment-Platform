'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { mockAdminUser, mockEmployees } from '@/lib/mock-data'
import { Send, Share2 } from 'lucide-react'

const existingSharedGoals = [
  {
    id: 'sg1',
    title: 'Complete annual compliance training',
    target: 100,
    assignedCount: 8,
    createdAt: '2024-01-15',
  },
  {
    id: 'sg2',
    title: 'Achieve customer satisfaction score of 90%',
    target: 90,
    assignedCount: 12,
    createdAt: '2024-02-01',
  },
]

export default function AdminSharedGoalsPage() {
  const [sharedGoalTitle, setSharedGoalTitle] = useState('')
  const [sharedGoalTarget, setSharedGoalTarget] = useState('')
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])

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

  return (
    <DashboardLayout role="admin">
      <Header user={mockAdminUser} title="Shared Goals" />

      <div className="p-6 space-y-6">
        {/* Push New Shared Goal Form */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Push New Shared Goal</CardTitle>
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

        {/* Existing Shared Goals */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Existing Shared Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Goal Title</TableHead>
                  <TableHead className="text-right">Target</TableHead>
                  <TableHead className="text-right">Assigned To</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {existingSharedGoals.map((goal, index) => (
                  <TableRow
                    key={goal.id}
                    className={index % 2 === 0 ? 'bg-card' : 'bg-muted/30'}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Share2 className="h-4 w-4 text-muted-foreground" />
                        {goal.title}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{goal.target}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{goal.assignedCount} employees</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(goal.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
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
