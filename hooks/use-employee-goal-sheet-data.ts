'use client'

/**
 * Fifth Supabase slice — load employee goal sheet + goals with mock fallback.
 */

import { useEffect, useMemo, useState } from 'react'
import { getActiveGoalCycle } from '@/lib/data/goal-cycles'
import { getCurrentEmployeeGoalSheetWithGoals } from '@/lib/data/goal-sheets'
import { isRealUuid } from '@/lib/data/goals'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { mockGoalCycle, mockGoalSheet, mockGoals } from '@/lib/mock-data'
import { useCurrentProfile } from '@/hooks/use-current-profile'
import type { Goal, GoalCycle, GoalSheet } from '@/lib/types'

export type EmployeeGoalsDataSource =
  | 'demo'
  | 'loading'
  | 'supabase'
  | 'supabase-empty'

export function useEmployeeGoalSheetData() {
  const { profile, liveProfile } = useCurrentProfile()
  const [activeCycle, setActiveCycle] = useState<GoalCycle | null>(
    isSupabaseConfigured() ? null : mockGoalCycle
  )
  const [sheetData, setSheetData] = useState<{
    goalSheet: GoalSheet
    goals: Goal[]
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [fetchAttempted, setFetchAttempted] = useState(false)

  const canFetch = Boolean(
    isSupabaseConfigured() &&
      liveProfile &&
      activeCycle &&
      isRealUuid(activeCycle.id) &&
      isRealUuid(liveProfile.id)
  )

  useEffect(() => {
    let cancelled = false
    getActiveGoalCycle().then((loaded) => {
      if (!cancelled) {
        setActiveCycle(loaded)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!canFetch || !liveProfile) {
      setSheetData(null)
      setFetchError(null)
      setFetchAttempted(false)
      setIsLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      const employee = liveProfile
      const cycle = activeCycle
      if (!employee || !cycle) return

      setIsLoading(true)
      setFetchError(null)

      try {
        const result = await getCurrentEmployeeGoalSheetWithGoals({
          employeeId: employee.id,
          cycleId: cycle.id,
          employeeName: employee.name,
          department: employee.department,
          managerName: employee.managerName ?? 'Not assigned',
          cycleName: cycle.name,
        })

        if (cancelled) return

        setSheetData(result)
        setFetchAttempted(true)
      } catch (err) {
        if (cancelled) return
        setFetchError(
          err instanceof Error ? err.message : 'Failed to load goal sheet'
        )
        setSheetData(null)
        setFetchAttempted(true)
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
  }, [
    canFetch,
    liveProfile?.id,
    liveProfile?.name,
    liveProfile?.department,
    liveProfile?.managerName,
    activeCycle?.id,
    activeCycle?.name,
  ])

  const dataSource: EmployeeGoalsDataSource = useMemo(() => {
    if (isSupabaseConfigured() && !activeCycle) {
      return 'supabase-empty'
    }
    if (!canFetch) {
      return isSupabaseConfigured() ? 'supabase-empty' : 'demo'
    }
    if (isLoading) {
      return 'loading'
    }
    if (fetchError) {
      return isSupabaseConfigured() ? 'supabase-empty' : 'demo'
    }
    if (sheetData) {
      return 'supabase'
    }
    if (fetchAttempted) {
      return 'supabase-empty'
    }
    return 'loading'
  }, [activeCycle, canFetch, isLoading, fetchError, sheetData, fetchAttempted])

  const goals =
    dataSource === 'supabase'
      ? sheetData!.goals
      : dataSource === 'supabase-empty'
        ? []
        : mockGoals

  const goalSheet: GoalSheet | null =
    dataSource === 'supabase'
      ? sheetData!.goalSheet
      : dataSource === 'supabase-empty'
        ? null
        : mockGoalSheet

  const sourceLabel =
    dataSource === 'supabase'
      ? 'Live Supabase goals'
      : dataSource === 'supabase-empty'
        ? 'No Supabase goal sheet yet'
        : dataSource === 'loading'
          ? 'Loading goals...'
          : 'Demo goal data'

  return {
    profile,
    liveProfile,
    activeCycle,
    goals,
    goalSheet,
    dataSource,
    isLoading,
    fetchError,
    sourceLabel,
    canFetch,
  }
}
