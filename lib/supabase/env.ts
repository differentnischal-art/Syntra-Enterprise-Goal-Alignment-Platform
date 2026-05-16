/**
 * Returns true when public Supabase env vars are set (safe for client and server).
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return Boolean(url && anonKey && url.length > 0 && anonKey.length > 0)
}

export function getSupabasePublicEnv(): { url: string; anonKey: string } | null {
  if (!isSupabaseConfigured()) {
    return null
  }
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  }
}
