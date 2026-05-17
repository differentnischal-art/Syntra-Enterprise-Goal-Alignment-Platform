import { DEFAULT_THRUST_AREAS } from '@/lib/constants/reference-data'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/env'

export async function getThrustAreaNames(): Promise<string[]> {
  if (!isSupabaseConfigured()) {
    return [...DEFAULT_THRUST_AREAS]
  }

  const supabase = createClient()
  if (!supabase) {
    return []
  }

  const { data, error } = await supabase
    .from('thrust_areas')
    .select('name')
    .order('name', { ascending: true })

  if (error) {
    console.error('[getThrustAreaNames] error:', error.message)
    return []
  }

  return (data ?? []).map((row) => row.name)
}
