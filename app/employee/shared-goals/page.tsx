'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useCurrentProfile } from '@/hooks/use-current-profile'
import {
  getSharedGoalsForProfile,
  type SharedGoalRecord,
} from '@/lib/data/shared-goals'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { isRealUuid } from '@/lib/data/goals'
import {
  ChevronRight,
  Info,
  Lock,
  Share2,
  Target,
  Users,
} from 'lucide-react'

const uomLabels: Record<string, string> = {
  'numeric-higher-better': 'Higher Better',
  'numeric-lower-better': 'Lower Better',
  percentage: 'Percentage',
  'percentage-higher-better': 'Percentage - Higher Better',
  'percentage-lower-better': 'Percentage - Lower Better',
  timeline: 'Timeline',
  'zero-based': 'Zero Based',
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function formatTarget(goal: SharedGoalRecord): string {
  if (goal.unitOfMeasurement === 'timeline') {
    return goal.targetDate ?? '-'
  }
  return String(goal.target)
}

export default function EmployeeSharedGoalsPage() {
  const { liveProfile, isLoading: isProfileLoading } = useCurrentProfile()
  const [sharedGoals, setSharedGoals] = useState<SharedGoalRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const canFetchLive = Boolean(
    isSupabaseConfigured() && liveProfile && isRealUuid(liveProfile.id)
  )

  useEffect(() => {
    if (!canFetchLive || !liveProfile) {
      setSharedGoals([])
      setFetchError(null)
      setIsLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      setIsLoading(true)
      setFetchError(null)
      try {
        const rows = await getSharedGoalsForProfile(liveProfile)
        if (!cancelled) {
          setSharedGoals(rows)
        }
      } catch (err) {
        if (!cancelled) {
          setFetchError(
            err instanceof Error ? err.message : 'Failed to load shared goals.'
          )
          setSharedGoals([])
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [canFetchLive, liveProfile])

  const showLoading = isProfileLoading || isLoading

  return (
    <DashboardLayout role="employee">
      <DashboardHeader title="Shared Goals" subtitle="Manager and admin assigned goals" />

      <div className="space-y-6 p-6">
        <Alert className="border-primary/30 bg-primary/5">
          <Info className="h-4 w-4 text-primary" />
          <AlertDescription className="text-primary">
            Shared goals pushed by your manager or admin appear here when assigned
            to your profile.
          </AlertDescription>
        </Alert>

        {fetchError && (
          <Alert className="border-destructive/30 bg-destructive/5">
            <Info className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">
              {fetchError}
            </AlertDescription>
          </Alert>
        )}

        {showLoading ? (
          <Card className="border-border/60">
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              Loading shared goals...
            </CardContent>
          </Card>
        ) : sharedGoals.length === 0 ? (
          <Card className="border-border/60">
            <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary shadow-sm shadow-primary/10">
                <Share2 className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                No shared goals assigned yet.
              </h3>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Shared goals pushed by your manager or admin will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sharedGoals.map((sharedGoal) => (
              <Card
                key={sharedGoal.id}
                className="border-border/60 transition-colors hover:border-primary/30 hover:bg-primary/[0.015]"
              >
                <Link href={`/employee/shared-goals/${sharedGoal.id}`} className="block">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <CardTitle className="text-base font-semibold">
                            {sharedGoal.title}
                          </CardTitle>
                          <Badge
                            variant="outline"
                            className="gap-1 border-primary/20 bg-primary/10 text-primary"
                          >
                            <Share2 className="h-3 w-3" />
                            Shared
                          </Badge>
                          {sharedGoal.status === 'locked' && (
                            <Badge
                              variant="outline"
                              className="gap-1 border-slate-200 bg-slate-100 text-slate-600"
                            >
                              <Lock className="h-3 w-3" />
                              Locked
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="line-clamp-2">
                          {sharedGoal.description || 'No description provided.'}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-3">
                        {sharedGoal.syncedAchievement !== null && (
                          <Badge
                            variant="outline"
                            className={
                              sharedGoal.syncedAchievement >= 80
                                ? 'border-success/20 bg-success/10 text-success'
                                : sharedGoal.syncedAchievement >= 50
                                  ? 'border-warning/20 bg-warning/10 text-warning-foreground'
                                  : 'border-destructive/20 bg-destructive/10 text-destructive'
                            }
                          >
                            Synced: {sharedGoal.syncedAchievement}%
                          </Badge>
                        )}
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardHeader>
                </Link>

                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Thrust Area</p>
                      <p className="text-sm font-medium">{sharedGoal.thrustArea}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Target</p>
                      <div className="flex items-center gap-2">
                        <Lock className="h-3 w-3 text-muted-foreground" />
                        <p className="text-sm font-medium">{formatTarget(sharedGoal)}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Unit of Measurement</p>
                      <p className="text-sm font-medium">
                        {uomLabels[sharedGoal.unitOfMeasurement]}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Primary Owner</p>
                      <p className="text-sm font-medium">{sharedGoal.primaryOwnerName}</p>
                    </div>
                  </div>

                  {sharedGoal.syncedAchievement !== null && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Synced Achievement</span>
                        <span className="font-medium">{sharedGoal.syncedAchievement}%</span>
                      </div>
                      <Progress value={sharedGoal.syncedAchievement} className="h-2" />
                    </div>
                  )}

                  {sharedGoal.linkedEmployees.length > 0 && (
                    <div className="border-t border-border pt-3">
                      <div className="mb-3 flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-medium">
                          Linked Employees ({sharedGoal.linkedEmployees.length})
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {sharedGoal.linkedEmployees.slice(0, 8).map((employee) => {
                          const chip = (
                            <>
                              <Avatar className="h-5 w-5">
                                <AvatarFallback className="bg-primary/10 text-[10px] text-primary">
                                  {initials(employee.name)}
                                </AvatarFallback>
                              </Avatar>
                              <span
                                className={
                                  employee.id === liveProfile?.id
                                    ? 'font-medium text-primary'
                                    : ''
                                }
                              >
                                {employee.name}
                                {employee.id === liveProfile?.id && ' (You)'}
                              </span>
                            </>
                          )

                          if (!employee.goalId) {
                            return (
                              <span
                                key={employee.assignmentId}
                                className="flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1.5 text-sm"
                              >
                                {chip}
                              </span>
                            )
                          }

                          return (
                            <Link
                              key={employee.assignmentId}
                              href="/employee/my-goal-sheet"
                              className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-sm transition-colors hover:bg-primary/10"
                            >
                              {chip}
                            </Link>
                          )
                        })}
                        {sharedGoal.linkedEmployees.length > 8 && (
                          <span className="flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1.5 text-sm text-muted-foreground">
                            +{sharedGoal.linkedEmployees.length - 8} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {sharedGoals.length > 0 && (
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Target className="h-4 w-4 text-primary" />
                Assigned Shared Goals
              </CardTitle>
              <CardDescription>
                {sharedGoals.length} live shared goal
                {sharedGoals.length === 1 ? '' : 's'} assigned to you
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
