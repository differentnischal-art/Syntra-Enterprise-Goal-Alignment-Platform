'use client'

/**
 * Sixth Supabase slice — manager pending goal sheet approvals with mock fallback.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  getManagerPendingGoalSheets,
  type ManagerPendingApproval,
} from '@/lib/data/manager-approvals'
import { isRealUuid } from '@/lib/data/goals'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { mockTeamMembers } from '@/lib/mock-data'
import { useCurrentProfile } from '@/hooks/use-current-profile'
export type ManagerApprovalsDataSource = 'demo' | 'loading' | 'supabase'

export function useManagerPendingApprovals() {
  const { liveProfile, profile } = useCurrentProfile()
  const [pendingSheets, setPendingSheets] = useState<ManagerPendingApproval[] | null>(
    null
  )
  const [isLoading, setIsLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const canFetch = Boolean(
    isSupabaseConfigured() &&
      liveProfile &&
      liveProfile.role === 'manager' &&
      isRealUuid(liveProfile.id)
  )

  const loadPending = useCallback(async () => {
    if (!canFetch || !liveProfile) {
      setPendingSheets(null)
      setFetchError(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setFetchError(null)

    try {
      const result = await getManagerPendingGoalSheets(liveProfile.id)
      setPendingSheets(result ?? [])
    } catch (err) {
      setFetchError(
        err instanceof Error ? err.message : 'Failed to load pending approvals'
      )
      setPendingSheets(null)
    } finally {
      setIsLoading(false)
    }
  }, [canFetch, liveProfile])

  useEffect(() => {
    loadPending()
  }, [loadPending])

  const dataSource: ManagerApprovalsDataSource = useMemo(() => {
    if (!canFetch || fetchError) {
      return 'demo'
    }
    if (isLoading) {
      return 'loading'
    }
    return 'supabase'
  }, [canFetch, fetchError, isLoading])

  const demoPendingMembers = useMemo(
    () => mockTeamMembers.filter((m) => m.approvalStatus === 'pending'),
    []
  )

  const pendingCount =
    dataSource === 'supabase'
      ? (pendingSheets?.length ?? 0)
      : demoPendingMembers.length

  const sourceLabel =
    dataSource === 'supabase'
      ? 'Live Supabase approvals'
      : dataSource === 'loading'
        ? 'Loading approvals...'
        : 'Demo approvals'

  return {
    profile,
    liveProfile,
    dataSource,
    isLoading,
    fetchError,
    sourceLabel,
    pendingSheets: dataSource === 'supabase' ? (pendingSheets ?? []) : [],
    demoPendingMembers,
    pendingCount,
    reloadPending: loadPending,
  }
}
