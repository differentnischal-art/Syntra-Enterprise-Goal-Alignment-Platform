'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
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
import { mockEmployees, mockSharedGoals, thrustAreas } from '@/lib/mock-data'
import { SharedGoal } from '@/lib/types'
import { Send, Share2, Lock, RefreshCw, Users, Target } from 'lucide-react'

export default function AdminSharedGoalsPage() {
  const [sharedGoals] = useState<SharedGoal[]>(mockSharedGoals)
  const [sharedGoalTitle, setSharedGoalTitle] = useState('')
  const [sharedGoalDescription, setSharedGoalDescription] = useState('')
  const [sharedGoalTarget, setSharedGoalTarget] = useState('')
  const [thrustArea, setThrustArea] = useState('')
  const [primaryOwner, setPrimaryOwner] = useState('')
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])

  const toggleEmployee = (employeeId: string) => {
    setSelectedEmployees((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    )
  }

  const selectAllEmployees = () => {
    if (selectedEmployees.length === mockEmployees.length) {
      setSelectedEmployees([])
    } else {
      setSelectedEmployees(mockEmployees.map(e => e.id))
    }
  }

  const handlePushSharedGoal = () => {
    console.log('Pushing shared goal:', {
      title: sharedGoalTitle,
      description: sharedGoalDescription,
      target: sharedGoalTarget,
      thrustArea,
      primaryOwner,
      employees: selectedEmployees,
    })
    setSharedGoalTitle('')
    setSharedGoalDescription('')
    setSharedGoalTarget('')
    setThrustArea('')
    setPrimaryOwner('')
    setSelectedEmployees([])
  }

  const getStatusBadges = (goal: SharedGoal) => {
    const badges = []
    badges.push(
      <Badge key="shared" variant="secondary" className="bg-primary/10 text-primary">
        <Share2 className="mr-1 h-3 w-3" />
        Shared
      </Badge>
    )
    if (goal.syncedAchievement !== null) {
      badges.push(
        <Badge key="synced" variant="secondary" className="bg-success/10 text-success">
          <RefreshCw className="mr-1 h-3 w-3" />
          Synced
        </Badge>
      )
    }
    if (goal.status === 'locked') {
      badges.push(
        <Badge key="locked" variant="secondary" className="bg-warning/10 text-warning-foreground">
          <Lock className="mr-1 h-3 w-3" />
          Locked Target
        </Badge>
      )
    }
    return badges
  }

  return (
    <DashboardLayout role="admin">
      <DashboardHeader title="Shared Goals" />

      <div className="p-6 space-y-6">
        {/* Push New Shared Goal Form */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Create Shared KPI
            </CardTitle>
            <CardDescription>
              Push a shared goal to multiple employees across departments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="kpiTitle">KPI Title *</Label>
                  <Input
                    id="kpiTitle"
                    placeholder="e.g., Complete Cloud Architecture Certification"
                    value={sharedGoalTitle}
                    onChange={(e) => setSharedGoalTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the shared goal objectives..."
                    value={sharedGoalDescription}
                    onChange={(e) => setSharedGoalDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="thrustArea">Thrust Area *</Label>
                    <Select value={thrustArea} onValueChange={setThrustArea}>
                      <SelectTrigger id="thrustArea">
                        <SelectValue placeholder="Select thrust area" />
                      </SelectTrigger>
                      <SelectContent>
                        {thrustAreas.map((area) => (
                          <SelectItem key={area} value={area}>
                            {area}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="target">Target *</Label>
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
                  <Label htmlFor="primaryOwner">Primary Owner *</Label>
                  <Select value={primaryOwner} onValueChange={setPrimaryOwner}>
                    <SelectTrigger id="primaryOwner">
                      <SelectValue placeholder="Select primary owner" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockEmployees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name} ({employee.department})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Link Employees *</Label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={selectAllEmployees}
                    className="h-auto py-1 px-2 text-xs"
                  >
                    {selectedEmployees.length === mockEmployees.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
                <div className="max-h-[280px] overflow-y-auto rounded-lg border border-border p-3 space-y-2">
                  {mockEmployees.map((employee) => (
                    <div
                      key={employee.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`emp-${employee.id}`}
                        checked={selectedEmployees.includes(employee.id)}
                        onCheckedChange={() => toggleEmployee(employee.id)}
                      />
                      <label
                        htmlFor={`emp-${employee.id}`}
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
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" />
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
                  !thrustArea ||
                  !primaryOwner ||
                  selectedEmployees.length === 0
                }
              >
                <Send className="mr-2 h-4 w-4" />
                Push Shared Goal
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Existing Shared Goals */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Existing Shared Goals</CardTitle>
            <CardDescription>
              Manage and monitor shared KPIs across the organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Goal Title</TableHead>
                  <TableHead>Thrust Area</TableHead>
                  <TableHead>Primary Owner</TableHead>
                  <TableHead className="text-right">Target</TableHead>
                  <TableHead className="text-right">Linked</TableHead>
                  <TableHead className="text-center">Achievement</TableHead>
                  <TableHead>Badges</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sharedGoals.map((goal, index) => (
                  <TableRow
                    key={goal.id}
                    className={index % 2 === 0 ? 'bg-card' : 'bg-muted/30'}
                  >
                    <TableCell>
                      <div className="flex items-start gap-2">
                        <Share2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <div>
                          <p className="font-medium">{goal.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {goal.description}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">
                        {goal.thrustArea}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{goal.primaryOwnerName}</span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {goal.target}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm text-muted-foreground">
                        {goal.linkedEmployees.length} employees
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {goal.syncedAchievement !== null ? (
                        <div className="inline-flex items-center gap-2">
                          <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
                            <div 
                              className="h-full bg-success rounded-full transition-all"
                              style={{ width: `${Math.min(goal.syncedAchievement, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{goal.syncedAchievement}%</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {getStatusBadges(goal)}
                      </div>
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
