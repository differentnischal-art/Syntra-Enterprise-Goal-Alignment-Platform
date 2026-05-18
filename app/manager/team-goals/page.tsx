'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { GoalsTable } from '@/components/goals/goals-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getManagerLiveData, type ManagerLiveData } from '@/lib/data/manager'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { useCurrentProfile } from '@/hooks/use-current-profile'

export default function ManagerTeamGoalsPage() {
  const { liveProfile, error: profileError } = useCurrentProfile()
  const [managerData, setManagerData] = useState<ManagerLiveData | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setManagerData(null)
      setFetchError(null)
      return
    }

    if (!liveProfile) {
      setManagerData(null)
      setFetchError(profileError)
      return
    }

    let cancelled = false
    const managerId = liveProfile.id

    async function load() {
      try {
        setFetchError(null)
        const data = await getManagerLiveData(managerId)
        if (!cancelled) {
          setManagerData(data)
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[manager team goals] live data failed:', err)
        }
        if (!cancelled) {
          setFetchError(err instanceof Error ? err.message : 'Failed to load team goals.')
          setManagerData(null)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [liveProfile, profileError])

  const teamGoals = managerData?.teamGoals ?? []

  return (
    <DashboardLayout role="manager">
      <DashboardHeader title="Team Goals" />

      <div className="p-6">
        {fetchError && (
          <Card className="mb-4 border-destructive/30 bg-destructive/5">
            <CardContent className="p-4 text-sm text-destructive">{fetchError}</CardContent>
          </Card>
        )}

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">All Team Goals</CardTitle>
          </CardHeader>
          <CardContent>
            {teamGoals.length === 0 ? (
              <div className="mx-auto flex max-w-md flex-col items-center justify-center rounded-lg border border-dashed border-primary/20 bg-gradient-to-br from-primary/5 via-background to-success/5 px-6 py-16 text-center">
                <h3 className="text-lg font-semibold text-foreground">No team goals found.</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Submitted and approved employee goals will appear here.
                </p>
              </div>
            ) : (
              <GoalsTable goals={teamGoals} showEmployee />
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
