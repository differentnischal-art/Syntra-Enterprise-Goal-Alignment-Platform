'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { mockGoalCycle } from '@/lib/mock-data'
import { 
  Clock, 
  Calendar, 
  CalendarCheck, 
  Lock, 
  Bell, 
  PlayCircle, 
  StopCircle,
  CheckCircle2,
  AlertCircle,
  Target
} from 'lucide-react'

const cycleWindows = [
  {
    id: 'goal-creation',
    name: 'Goal Creation Window',
    description: 'Employees create and submit goal sheets for manager approval',
    start: '1 May 2025',
    end: '31 May 2025',
    status: 'completed' as const,
    icon: Target,
  },
  {
    id: 'q1-checkin',
    name: 'Q1 Check-in',
    description: 'First quarterly review - July performance assessment',
    start: '1 Jul 2025',
    end: '15 Jul 2025',
    status: 'completed' as const,
    icon: CalendarCheck,
  },
  {
    id: 'q2-checkin',
    name: 'Q2 Check-in',
    description: 'Second quarterly review - October performance assessment',
    start: '1 Oct 2025',
    end: '15 Oct 2025',
    status: 'active' as const,
    icon: CalendarCheck,
  },
  {
    id: 'q3-checkin',
    name: 'Q3 Check-in',
    description: 'Third quarterly review - January performance assessment',
    start: '1 Jan 2026',
    end: '15 Jan 2026',
    status: 'upcoming' as const,
    icon: CalendarCheck,
  },
  {
    id: 'q4-annual',
    name: 'Q4 / Annual Review',
    description: 'Final quarterly review and annual performance closure',
    start: '15 Mar 2026',
    end: '31 Mar 2026',
    status: 'upcoming' as const,
    icon: CheckCircle2,
  },
]

export default function CycleManagementPage() {
  const [selectedWindow, setSelectedWindow] = useState<string | null>(null)

  const getStatusBadge = (status: 'completed' | 'active' | 'upcoming') => {
    switch (status) {
      case 'completed':
        return <Badge variant="secondary" className="bg-muted text-muted-foreground">Completed</Badge>
      case 'active':
        return <Badge className="bg-success/10 text-success border-success/20">Active</Badge>
      case 'upcoming':
        return <Badge variant="outline" className="text-muted-foreground">Upcoming</Badge>
    }
  }

  const getStatusIcon = (status: 'completed' | 'active' | 'upcoming') => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
      case 'active':
        return <PlayCircle className="h-5 w-5 text-success" />
      case 'upcoming':
        return <Clock className="h-5 w-5 text-muted-foreground" />
    }
  }

  const handleOpenWindow = (windowId: string) => {
    console.log('Opening window:', windowId)
  }

  const handleCloseWindow = (windowId: string) => {
    console.log('Closing window:', windowId)
  }

  const handleLockGoals = () => {
    console.log('Locking all approved goals')
  }

  const handleSendReminder = () => {
    console.log('Sending reminder to pending employees')
  }

  return (
    <DashboardLayout role="admin">
      <DashboardHeader title="Cycle Management" />

      <div className="p-6 space-y-6">
        {/* Active Cycle Overview */}
        <Card className="shadow-sm border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">{mockGoalCycle.name}</CardTitle>
                  <CardDescription>
                    April 2025 - March 2026 | Financial Year 2025-26
                  </CardDescription>
                </div>
              </div>
              <Badge className="bg-success text-success-foreground px-3 py-1">
                Active Cycle
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground mb-1">Cycle Start</p>
                <p className="text-lg font-semibold">1 Apr 2025</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground mb-1">Cycle End</p>
                <p className="text-lg font-semibold">31 Mar 2026</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground mb-1">Current Phase</p>
                <p className="text-lg font-semibold text-success">Q2 Check-in</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground mb-1">Days Remaining</p>
                <p className="text-lg font-semibold">168</p>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleSendReminder}>
                <Bell className="mr-2 h-4 w-4" />
                Send Reminder
              </Button>
              <Button variant="outline" size="sm" onClick={handleLockGoals}>
                <Lock className="mr-2 h-4 w-4" />
                Lock Goals
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Cycle Timeline */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Cycle Windows</CardTitle>
            <CardDescription>
              Manage goal creation and quarterly check-in windows
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {cycleWindows.map((window, index) => (
                <div
                  key={window.id}
                  className={`relative rounded-lg border p-4 transition-colors ${
                    window.status === 'active' 
                      ? 'border-success/30 bg-success/5' 
                      : 'border-border bg-card'
                  } ${selectedWindow === window.id ? 'ring-2 ring-primary/20' : ''}`}
                  onClick={() => setSelectedWindow(window.id)}
                >
                  {/* Timeline connector */}
                  {index < cycleWindows.length - 1 && (
                    <div className="absolute left-7 top-16 h-8 w-0.5 bg-border" />
                  )}
                  
                  <div className="flex items-start gap-4">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                      window.status === 'active' 
                        ? 'bg-success/10' 
                        : window.status === 'completed'
                          ? 'bg-muted'
                          : 'bg-muted/50'
                    }`}>
                      {getStatusIcon(window.status)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{window.name}</h4>
                        {getStatusBadge(window.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {window.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {window.start}
                        </span>
                        <span>→</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {window.end}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {window.status === 'upcoming' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenWindow(window.id)
                          }}
                        >
                          <PlayCircle className="mr-1 h-4 w-4" />
                          Open
                        </Button>
                      )}
                      {window.status === 'active' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleCloseWindow(window.id)
                          }}
                        >
                          <StopCircle className="mr-1 h-4 w-4" />
                          Close
                        </Button>
                      )}
                      {window.status === 'completed' && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <CheckCircle2 className="h-4 w-4" />
                          Closed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-border p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/10">
                    <AlertCircle className="h-4 w-4 text-warning-foreground" />
                  </div>
                  <h4 className="font-medium">Pending Submissions</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  12 employees have not submitted their goal sheets
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  <Bell className="mr-2 h-4 w-4" />
                  Send Reminder
                </Button>
              </div>

              <div className="rounded-lg border border-border p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <h4 className="font-medium">Pending Approvals</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  8 goal sheets awaiting manager approval
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  <Bell className="mr-2 h-4 w-4" />
                  Notify Managers
                </Button>
              </div>

              <div className="rounded-lg border border-border p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10">
                    <Lock className="h-4 w-4 text-success" />
                  </div>
                  <h4 className="font-medium">Lock All Goals</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Lock all approved goals to prevent further edits
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  <Lock className="mr-2 h-4 w-4" />
                  Lock Goals
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
