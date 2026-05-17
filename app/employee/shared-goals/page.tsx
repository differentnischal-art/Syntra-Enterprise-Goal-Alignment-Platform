'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { mockEmployeeUser, mockSharedGoals, mockGoalCycle } from '@/lib/mock-data'
import { 
  Share2,
  Lock,
  Users,
  Info,
  Target,
} from 'lucide-react'

const uomLabels: Record<string, string> = {
  'numeric-higher-better': 'Higher Better',
  'numeric-lower-better': 'Lower Better',
  'percentage': 'Percentage',
  'percentage-higher-better': 'Percentage - Higher Better',
  'percentage-lower-better': 'Percentage - Lower Better',
  'timeline': 'Timeline',
  'zero-based': 'Zero Based',
}

export default function EmployeeSharedGoalsPage() {
  // Filter shared goals that include current user
  const mySharedGoals = mockSharedGoals.filter(sg => 
    sg.linkedEmployees.some(e => e.id === mockEmployeeUser.id)
  )

  return (
    <DashboardLayout role="employee">
      <DashboardHeader
        title="Shared Goals"
        subtitle={mockGoalCycle.name}
      />

      <div className="p-6 space-y-6">
        {/* Info Banner */}
        <Alert className="border-primary/30 bg-primary/5">
          <Info className="h-4 w-4 text-primary" />
          <AlertDescription className="text-primary">
            Shared goals are pushed by Admin/Manager. You can adjust only weightage. Goal title and target are locked.
          </AlertDescription>
        </Alert>

        {/* Shared Goals List */}
        <div className="space-y-4">
          {mySharedGoals.length === 0 ? (
            <Card className="border-border/60">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <Share2 className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground">No Shared Goals</h3>
                <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                  You have not been assigned any shared departmental goals yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            mySharedGoals.map((sharedGoal) => (
              <Card key={sharedGoal.id} className="border-border/60">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-base font-semibold">{sharedGoal.title}</CardTitle>
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 gap-1">
                          <Share2 className="h-3 w-3" />
                          Shared
                        </Badge>
                        {sharedGoal.status === 'locked' && (
                          <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 gap-1">
                            <Lock className="h-3 w-3" />
                            Locked
                          </Badge>
                        )}
                      </div>
                      <CardDescription>{sharedGoal.description}</CardDescription>
                    </div>
                    {sharedGoal.syncedAchievement !== null && (
                      <Badge 
                        variant="outline" 
                        className={`
                          ${sharedGoal.syncedAchievement >= 80 ? 'bg-success/10 text-success border-success/20' : 
                            sharedGoal.syncedAchievement >= 50 ? 'bg-warning/10 text-warning-foreground border-warning/20' :
                            'bg-destructive/10 text-destructive border-destructive/20'}
                        `}
                      >
                        Synced: {sharedGoal.syncedAchievement}%
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Goal Details */}
                  <div className="grid gap-4 sm:grid-cols-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Thrust Area</p>
                      <p className="text-sm font-medium">{sharedGoal.thrustArea}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Target</p>
                      <div className="flex items-center gap-2">
                        <Lock className="h-3 w-3 text-muted-foreground" />
                        <p className="text-sm font-medium">{sharedGoal.target}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Unit of Measurement</p>
                      <p className="text-sm font-medium">{uomLabels[sharedGoal.unitOfMeasurement]}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Primary Owner</p>
                      <p className="text-sm font-medium">{sharedGoal.primaryOwnerName}</p>
                    </div>
                  </div>

                  {/* Progress */}
                  {sharedGoal.syncedAchievement !== null && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Synced Achievement</span>
                        <span className="font-medium">{sharedGoal.syncedAchievement}%</span>
                      </div>
                      <Progress value={sharedGoal.syncedAchievement} className="h-2" />
                    </div>
                  )}

                  {/* Linked Employees */}
                  <div className="pt-3 border-t border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium">Linked Employees ({sharedGoal.linkedEmployees.length})</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {sharedGoal.linkedEmployees.slice(0, 8).map((employee) => (
                        <div
                          key={employee.id}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm
                            ${employee.id === mockEmployeeUser.id 
                              ? 'border-primary/30 bg-primary/5' 
                              : 'border-border bg-muted/30'}
                          `}
                        >
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                              {employee.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className={employee.id === mockEmployeeUser.id ? 'font-medium text-primary' : ''}>
                            {employee.name}
                            {employee.id === mockEmployeeUser.id && ' (You)'}
                          </span>
                        </div>
                      ))}
                      {sharedGoal.linkedEmployees.length > 8 && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-muted/30 text-sm text-muted-foreground">
                          +{sharedGoal.linkedEmployees.length - 8} more
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* All Shared Goals in Organization */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">All Organization Shared Goals</CardTitle>
            <CardDescription>View all shared goals pushed by Admin/HR</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockSharedGoals.map((sg) => (
                <div key={sg.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <Target className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{sg.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {sg.thrustArea} | {sg.linkedEmployees.length} employees
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {sg.syncedAchievement !== null && (
                      <div className="text-right">
                        <p className="text-sm font-medium">{sg.syncedAchievement}%</p>
                        <p className="text-xs text-muted-foreground">Achievement</p>
                      </div>
                    )}
                    {mySharedGoals.some(m => m.id === sg.id) ? (
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                        Assigned
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-muted text-muted-foreground">
                        Not Assigned
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
