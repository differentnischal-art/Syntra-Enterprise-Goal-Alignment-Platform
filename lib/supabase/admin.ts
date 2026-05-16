import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import { isSupabaseConfigured } from '@/lib/supabase/env'

/**
 * Service-role Supabase client — server-only (seed scripts, admin tooling).
 * Never import this module from client components.
 */
export function createAdminClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    console.error(
      '[supabase/admin] SUPABASE_SERVICE_ROLE_KEY is missing. Admin client unavailable.'
    )
    return null
  }

  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
