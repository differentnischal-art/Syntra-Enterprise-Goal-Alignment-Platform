import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabasePublicEnv } from '@/lib/supabase/env'

/**
 * Server-side Supabase client for App Router (RSC, Server Actions).
 * Returns null when env vars are missing.
 */
export async function createClient(): Promise<SupabaseClient | null> {
  const env = getSupabasePublicEnv()
  if (!env) {
    return null
  }

  const cookieStore = await cookies()

  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // setAll can run from a Server Component where cookies are read-only.
        }
      },
    },
  })
}
