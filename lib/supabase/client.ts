import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabasePublicEnv, isSupabaseConfigured } from '@/lib/supabase/env'

export { isSupabaseConfigured }

let browserClient: SupabaseClient | null = null

/**
 * Browser-safe Supabase client for client components.
 * Returns null when env vars are missing so the app can fall back to mock data.
 */
export function createClient(): SupabaseClient | null {
  const env = getSupabasePublicEnv()
  if (!env) {
    return null
  }

  if (!browserClient) {
    browserClient = createBrowserClient(env.url, env.anonKey)
  }

  return browserClient
}
