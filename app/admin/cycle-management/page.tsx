'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { useCurrentProfile } from '@/hooks/use-current-profile'
import {
  createDefaultCycleWindows,
  getAdminCycle,
  updateCycleWindowStatus,
  type AdminCycle,
  type AdminCycleWindow,
} from '@/lib/data/admin'
import {
  Calendar,
  CalendarCheck,
  CheckCircle2,
  Clock,
  PlayCircle,
  StopCircle,
  Target,
} from 'lucide-react'

function formatDate(value: string | null): string {
  if (!value) return '-'
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function windowIcon(window: AdminCycleWindow) {
  if (window.type === 'goal_creation') return Target
  if (window.quarter === 'q4') return CheckCircle2
  return CalendarCheck
}

function statusBadge(status: AdminCycleWindow['status']) {
  if (status === 'open') {
    return <Badge className="border-success/20 bg-success/10 text-success">Open</Badge>
  }
  if (status === 'completed') {
    return <Badge variant="secondary" className="bg-muted text-muted-foreground">Completed</Badge>
  }
  return <Badge variant="outline" className="text-muted-foreground">Closed</Badge>
}

export default function CycleManagementPage() {
  const { liveProfile } = useCurrentProfile()
  const { toast } = useToast()
  const [cycle, setCycle] = useState<AdminCycle | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [updatingWindowId, setUpdatingWindowId] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadCycle = async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const result = await getAdminCycle()
      setCycle(result)
    } catch (error) {
      setCycle(null)
      setLoadError('Could not load cycle windows.')
      if (process.env.NODE_ENV === 'development') {
        console.error('[cycle management] failed:', error)
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadCycle()
  }, [])

  const activeWindow = cycle?.windows.find((window) => window.status === 'open')
  const daysRemaining = cycle
    ? Math.max(
        0,
        Math.ceil((new Date(`${cycle.endDate}T00:00:00`).getTime() - Date.now()) / 86_400_000)
      )
    : 0

  const handleToggleWindow = async (window: AdminCycleWindow, isOpen: boolean) => {
    if (!liveProfile) return
    setUpdatingWindowId(window.id)
    const result = await updateCycleWindowStatus({
      windowId: window.id,
      isOpen,
      admin: liveProfile,
    })
    setUpdatingWindowId(null)
    if (result.success) {
      toast({
        title: isOpen ? 'Window opened' : 'Window closed',
        description: `${window.name} updated in Supabase.`,
      })
      await loadCycle()
    } else {
      toast({
        title: 'Cycle update failed',
        description: result.error ?? 'Could not update cycle window.',
        variant: 'destructive',
      })
    }
  }

  const handleCreateDefaultWindows = async () => {
    if (!liveProfile || !cycle) return
    setUpdatingWindowId('default-windows')
    const result = await createDefaultCycleWindows({
      cycleId: cycle.id,
      admin: liveProfile,
    })
    setUpdatingWindowId(null)

    if (result.success) {
      toast({
        title: 'Cycle windows created',
        description: 'Default FY26 windows were saved to Supabase.',
      })
      await loadCycle()
    } else {
      toast({
        title: 'Cycle update failed',
        description: result.error ?? 'Could not create cycle windows.',
        variant: 'destructive',
      })
    }
  }

  return (
    <DashboardLayout role="admin">
      <DashboardHeader title="Cycle Management" />

      <div className="space-y-6 p-6">
        {loadError && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="py-4 text-sm text-destructive">
              {loadError}
            </CardContent>
          </Card>
        )}

        {!isLoading && !cycle && !loadError ? (
          <Card className="border-border/60">
            <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <Calendar className="mb-3 h-12 w-12 text-primary" />
              <h3 className="text-lg font-semibold">No live cycle found.</h3>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Add a goal cycle and cycle windows in Supabase to manage the lifecycle.
              </p>
            </CardContent>
          </Card>
        ) : cycle ? (
          <>
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <Calendar className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{cycle.name}</CardTitle>
                      <CardDescription>
                        {formatDate(cycle.startDate)} - {formatDate(cycle.endDate)}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-success text-success-foreground px-3 py-1">
                    {cycle.status === 'active' ? 'Active Cycle' : cycle.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="rounded-lg border border-border bg-card p-4">
                    <p className="mb-1 text-xs text-muted-foreground">Cycle Start</p>
                    <p className="text-lg font-semibold">{formatDate(cycle.startDate)}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-4">
                    <p className="mb-1 text-xs text-muted-foreground">Cycle End</p>
                    <p className="text-lg font-semibold">{formatDate(cycle.endDate)}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-4">
                    <p className="mb-1 text-xs text-muted-foreground">Current Phase</p>
                    <p className="text-lg font-semibold text-success">
                      {activeWindow?.name ?? 'No open window'}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-4">
                    <p className="mb-1 text-xs text-muted-foreground">Days Remaining</p>
                    <p className="text-lg font-semibold">{daysRemaining}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Cycle Windows</CardTitle>
                <CardDescription>Open or close goal creation and quarterly check-in windows.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cycle.windows.length === 0 ? (
                    <div className="rounded-lg border border-border bg-card p-6 text-center">
                      <p className="text-sm text-muted-foreground">
                        No cycle windows configured yet.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={handleCreateDefaultWindows}
                        disabled={updatingWindowId === 'default-windows'}
                      >
                        <CalendarCheck className="mr-1 h-4 w-4" />
                        Create Default FY26 Windows
                      </Button>
                    </div>
                  ) : cycle.windows.map((window, index) => {
                    const Icon = windowIcon(window)
                    return (
                      <div
                        key={window.id}
                        className={`relative rounded-lg border p-4 ${
                          window.status === 'open'
                            ? 'border-success/30 bg-success/5'
                            : 'border-border bg-card'
                        }`}
                      >
                        {index < cycle.windows.length - 1 && (
                          <div className="absolute left-7 top-16 h-8 w-0.5 bg-border" />
                        )}
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                              <h4 className="font-medium">{window.name}</h4>
                              {statusBadge(window.status)}
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(window.startDate)}
                              </span>
                              <span>to</span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(window.endDate)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {window.status !== 'open' ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleWindow(window, true)}
                                disabled={updatingWindowId === window.id}
                              >
                                <PlayCircle className="mr-1 h-4 w-4" />
                                Open
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleWindow(window, false)}
                                disabled={updatingWindowId === window.id}
                              >
                                <StopCircle className="mr-1 h-4 w-4" />
                                Close
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="border-border/60">
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              Loading cycle management...
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
