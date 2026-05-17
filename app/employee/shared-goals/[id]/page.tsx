'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useCurrentProfile } from '@/hooks/use-current-profile'
import {
  getSharedGoalByIdForProfile,
  type SharedGoalRecord,
} from '@/lib/data/shared-goals'
import { isRealUuid } from '@/lib/data/goals'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { ArrowLeft, Info, Lock, Share2, Users } from 'lucide-react'

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

function targetLabel(goal: SharedGoalRecord): string {
  return goal.unitOfMeasurement === 'timeline'
    ? goal.targetDate ?? '-'
    : String(goal.target)
}

export default function EmployeeSharedGoalDetailPage() {
  const params = useParams<{ id: string }>()
  const { liveProfile, isLoading: isProfileLoading } = useCurrentProfile()
  const [sharedGoal, setSharedGoal] = useState<SharedGoalRecord | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    const id = params.id
    if (
      !isSupabaseConfigured() ||
      !liveProfile ||
      !isRealUuid(liveProfile.id) ||
      !isRealUuid(id)
    ) {
      setSharedGoal(null)
      setIsLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      setIsLoading(true)
      setFetchError(null)
      try {
        const row = await getSharedGoalByIdForProfile(id, liveProfile)
        if (!cancelled) {
          setSharedGoal(row)
        }
      } catch (err) {
        if (!cancelled) {
          setFetchError(
            err instanceof Error ? err.message : 'Failed to load shared goal.'
          )
          setSharedGoal(null)
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
  }, [params.id, liveProfile])

  const loading = isProfileLoading || isLoading

  return (
    <DashboardLayout role="employee">
      <DashboardHeader title="Shared Goal" subtitle="Assigned goal detail" />

      <div className="space-y-6 p-6">
        <Button variant="outline" size="sm" asChild>
          <Link href="/employee/shared-goals">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Shared Goals
          </Link>
        </Button>

        {fetchError && (
          <Alert className="border-destructive/30 bg-destructive/5">
            <Info className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">
              {fetchError}
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <Card className="border-border/60">
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              Loading shared goal...
            </CardContent>
          </Card>
        ) : !sharedGoal ? (
          <Card className="border-border/60">
            <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Share2 className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                Shared goal unavailable
              </h3>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                This shared goal may not exist or may not be assigned to your profile.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="border-border/60">
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
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
                <div>
                  <CardTitle className="text-2xl font-semibold">
                    {sharedGoal.title}
                  </CardTitle>
                  <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                    {sharedGoal.description || 'No description provided.'}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Thrust Area</p>
                    <p className="text-sm font-medium">{sharedGoal.thrustArea}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">UOM</p>
                    <p className="text-sm font-medium">
                      {uomLabels[sharedGoal.unitOfMeasurement]}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Target</p>
                    <p className="text-sm font-medium">{targetLabel(sharedGoal)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Weightage</p>
                    <p className="text-sm font-medium">
                      {(() => {
                        const assignment = sharedGoal.linkedEmployees.find(
                          (employee) => employee.id === liveProfile?.id
                        )
                        if (assignment?.weightage != null) {
                          return `${assignment.weightage}%`
                        }
                        return assignment?.goalId ? 'Linked to your sheet' : 'Not synced yet'
                      })()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Owner</p>
                    <p className="text-sm font-medium">
                      {sharedGoal.primaryOwnerName}
                    </p>
                  </div>
                </div>

                {sharedGoal.syncedAchievement !== null && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Sync status</span>
                      <span className="font-medium">
                        {sharedGoal.syncedAchievement}%
                      </span>
                    </div>
                    <Progress value={sharedGoal.syncedAchievement} className="h-2" />
                  </div>
                )}
              </CardContent>
            </Card>

            {sharedGoal.linkedEmployees.length > 0 && (
              <Card className="border-border/60">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <Users className="h-4 w-4 text-primary" />
                    Linked Employees
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {sharedGoal.linkedEmployees.map((employee) => (
                      <span
                        key={employee.assignmentId}
                        className="flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1.5 text-sm"
                      >
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="bg-primary/10 text-[10px] text-primary">
                            {initials(employee.name)}
                          </AvatarFallback>
                        </Avatar>
                        {employee.name}
                        {employee.id === liveProfile?.id && ' (You)'}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
