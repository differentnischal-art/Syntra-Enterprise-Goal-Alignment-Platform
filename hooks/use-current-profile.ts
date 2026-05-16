'use client'

/**
 * Third Supabase slice — current user profile for dashboard headers.
 * Mock users in lib/mock-data.ts remain the fallback when Supabase is unavailable.
 */

import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { getCurrentProfile } from '@/lib/data/profiles'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import {
  mockAdminUser,
  mockEmployeeUser,
  mockManagerUser,
} from '@/lib/mock-data'
import type { User, UserRole } from '@/lib/types'

export function getWorkspaceRoleFromPath(pathname: string): UserRole {
  if (pathname.startsWith('/admin')) {
    return 'admin'
  }
  if (pathname.startsWith('/manager')) {
    return 'manager'
  }
  return 'employee'
}

export function getMockUserForPath(pathname: string): User {
  const role = getWorkspaceRoleFromPath(pathname)
  if (role === 'admin') {
    return mockAdminUser
  }
  if (role === 'manager') {
    return mockManagerUser
  }
  return mockEmployeeUser
}

export function getRoleWorkspaceLabel(role: UserRole): string {
  if (role === 'admin') {
    return 'Admin'
  }
  if (role === 'manager') {
    return 'Manager'
  }
  return 'Employee'
}

export function getRoleProfileLabel(role: UserRole): string {
  if (role === 'admin') {
    return 'Administrator / HR'
  }
  if (role === 'manager') {
    return 'Manager'
  }
  return 'Employee'
}

export function useCurrentProfile() {
  const pathname = usePathname()
  const workspaceRole = useMemo(
    () => getWorkspaceRoleFromPath(pathname),
    [pathname]
  )
  const mockFallback = useMemo(() => getMockUserForPath(pathname), [pathname])

  const [liveProfile, setLiveProfile] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUsingMockFallback, setIsUsingMockFallback] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const profile = liveProfile ?? mockFallback
  const hasRoleMismatch = Boolean(
    liveProfile && liveProfile.role !== workspaceRole
  )

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setError(null)

      if (!isSupabaseConfigured()) {
        if (!cancelled) {
          setLiveProfile(null)
          setIsUsingMockFallback(true)
          setIsLoading(false)
        }
        return
      }

      try {
        const loaded = await getCurrentProfile()

        if (cancelled) return

        if (loaded) {
          setLiveProfile(loaded)
          setIsUsingMockFallback(false)
        } else {
          setLiveProfile(null)
          setIsUsingMockFallback(true)
        }
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load profile')
        setLiveProfile(null)
        setIsUsingMockFallback(true)
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
  }, [pathname])

  return {
    profile,
    liveProfile,
    isLoading,
    isUsingMockFallback,
    error,
    workspaceRole,
    hasRoleMismatch,
    mockFallback,
  }
}
