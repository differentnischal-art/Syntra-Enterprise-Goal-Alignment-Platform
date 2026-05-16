'use client'

/**
 * Second Supabase slice — client hook for current user profile.
 * Dashboard pages still pass mock users directly; adopt this hook in later slices.
 */

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { getCurrentProfile } from '@/lib/data/profiles'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import {
  mockAdminUser,
  mockEmployeeUser,
  mockManagerUser,
} from '@/lib/mock-data'
import type { User } from '@/lib/types'

function mockUserForPath(pathname: string): User {
  if (pathname.startsWith('/admin')) {
    return mockAdminUser
  }
  if (pathname.startsWith('/manager')) {
    return mockManagerUser
  }
  return mockEmployeeUser
}

export function useCurrentProfile() {
  const pathname = usePathname()
  const [profile, setProfile] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUsingMockFallback, setIsUsingMockFallback] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setError(null)

      if (!isSupabaseConfigured()) {
        if (!cancelled) {
          setProfile(mockUserForPath(pathname))
          setIsUsingMockFallback(true)
          setIsLoading(false)
        }
        return
      }

      try {
        const loaded = await getCurrentProfile()

        if (cancelled) return

        if (loaded) {
          setProfile(loaded)
          setIsUsingMockFallback(false)
        } else {
          setProfile(mockUserForPath(pathname))
          setIsUsingMockFallback(true)
        }
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load profile')
        setProfile(mockUserForPath(pathname))
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
    isLoading,
    isUsingMockFallback,
    error,
  }
}
