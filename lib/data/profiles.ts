/**
 * Second Supabase slice — profiles mapped to app User type.
 * Mock users in lib/mock-data.ts remain for demo fallback.
 */

import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { getCurrentUser } from '@/lib/data/auth'
import type { User, UserRole } from '@/lib/types'

export type ProfileUpsertInput = {
  id: string
  full_name: string
  email: string
  role: UserRole
  department_id?: string | null
  manager_id?: string | null
  job_title?: string | null
  avatar_url?: string | null
}

type DbDepartment = { name: string } | { name: string }[] | null

type DbProfileRow = {
  id: string
  full_name: string
  email: string
  role: UserRole
  department_id: string | null
  manager_id: string | null
  job_title: string | null
  avatar_url: string | null
  departments: DbDepartment
}

function departmentNameFromRow(departments: DbDepartment): string | undefined {
  if (!departments) return undefined
  if (Array.isArray(departments)) {
    return departments[0]?.name
  }
  return departments.name
}

const PROFILE_SELECT = `
  id,
  full_name,
  email,
  role,
  department_id,
  manager_id,
  job_title,
  avatar_url,
  departments ( name )
`

export function mapProfileRowToUser(row: DbProfileRow, managerName?: string): User {
  return {
    id: row.id,
    name: row.full_name,
    email: row.email,
    role: row.role,
    department: departmentNameFromRow(row.departments) ?? '—',
    avatar: row.avatar_url ?? undefined,
    managerId: row.manager_id ?? undefined,
    managerName,
  }
}

async function fetchManagerName(
  supabase: NonNullable<ReturnType<typeof createClient>>,
  managerId: string | null
): Promise<string | undefined> {
  if (!managerId) return undefined

  const { data, error } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', managerId)
    .maybeSingle()

  if (error) {
    console.error('[profiles] fetchManagerName error:', error.message)
    return undefined
  }

  return data?.full_name ?? undefined
}

async function rowToUser(
  supabase: NonNullable<ReturnType<typeof createClient>>,
  row: DbProfileRow
): Promise<User> {
  const managerName = await fetchManagerName(supabase, row.manager_id)
  return mapProfileRowToUser(row, managerName)
}

/**
 * Loads the signed-in user's profile from Supabase.
 * Returns null when env is missing, user is unsigned, or fetch fails.
 */
export async function getCurrentProfile(): Promise<User | null> {
  if (!isSupabaseConfigured()) {
    return null
  }

  const supabase = createClient()
  if (!supabase) {
    return null
  }

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error('[getCurrentProfile] auth error:', authError.message)
      return null
    }

    if (!user) {
      return null
    }

    const { data, error } = await supabase
      .from('profiles')
      .select(PROFILE_SELECT)
      .eq('id', user.id)
      .maybeSingle()

    if (error) {
      console.error('[getCurrentProfile] profile error:', error.message)
      return null
    }

    if (!data) {
      return null
    }

    return await rowToUser(supabase, data as DbProfileRow)
  } catch (err) {
    console.error('[getCurrentProfile] unexpected error:', err)
    return null
  }
}

export async function requireProfile(): Promise<{
  profile: User | null
  error: string | null
}> {
  if (!isSupabaseConfigured()) {
    return {
      profile: null,
      error: 'Supabase is not configured.',
    }
  }

  const authUser = await getCurrentUser()
  if (!authUser) {
    return {
      profile: null,
      error: 'You must be signed in to continue.',
    }
  }

  const profile = await getCurrentProfile()
  if (!profile) {
    return {
      profile: null,
      error: 'No profile was found for this signed-in user. Please contact Admin/HR.',
    }
  }

  return { profile, error: null }
}

export async function getProfileById(profileId: string): Promise<User | null> {
  if (!isSupabaseConfigured()) {
    return null
  }

  const supabase = createClient()
  if (!supabase) {
    return null
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(PROFILE_SELECT)
      .eq('id', profileId)
      .maybeSingle()

    if (error) {
      console.error('[getProfileById] error:', error.message)
      return null
    }

    if (!data) {
      return null
    }

    return await rowToUser(supabase, data as DbProfileRow)
  } catch (err) {
    console.error('[getProfileById] unexpected error:', err)
    return null
  }
}

export async function getProfilesByRole(
  role: 'employee' | 'manager' | 'admin'
): Promise<User[]> {
  if (!isSupabaseConfigured()) {
    return []
  }

  const supabase = createClient()
  if (!supabase) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(PROFILE_SELECT)
      .eq('role', role)
      .order('full_name')

    if (error) {
      console.error('[getProfilesByRole] error:', error.message)
      return []
    }

    const rows = (data ?? []) as DbProfileRow[]
    return Promise.all(rows.map((row) => rowToUser(supabase, row)))
  } catch (err) {
    console.error('[getProfilesByRole] unexpected error:', err)
    return []
  }
}

export async function getEmployeesForManager(managerId: string): Promise<User[]> {
  if (!isSupabaseConfigured()) {
    return []
  }

  const supabase = createClient()
  if (!supabase) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(PROFILE_SELECT)
      .eq('manager_id', managerId)
      .eq('role', 'employee')
      .order('full_name')

    if (error) {
      console.error('[getEmployeesForManager] error:', error.message)
      return []
    }

    const rows = (data ?? []) as DbProfileRow[]
    return Promise.all(rows.map((row) => rowToUser(supabase, row)))
  } catch (err) {
    console.error('[getEmployeesForManager] unexpected error:', err)
    return []
  }
}

export async function upsertProfile(
  profileInput: ProfileUpsertInput
): Promise<{ profile: User | null; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { profile: null, error: 'Supabase is not configured' }
  }

  const supabase = createClient()
  if (!supabase) {
    return { profile: null, error: 'Supabase client unavailable' }
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(
        {
          id: profileInput.id,
          full_name: profileInput.full_name,
          email: profileInput.email,
          role: profileInput.role,
          department_id: profileInput.department_id ?? null,
          manager_id: profileInput.manager_id ?? null,
          job_title: profileInput.job_title ?? null,
          avatar_url: profileInput.avatar_url ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )
      .select(PROFILE_SELECT)
      .single()

    if (error) {
      console.error('[upsertProfile] error:', error.message)
      return { profile: null, error: error.message }
    }

    if (!data) {
      return { profile: null, error: 'Profile was not returned after upsert' }
    }

    const user = await rowToUser(supabase, data as DbProfileRow)
    return { profile: user, error: null }
  } catch (err) {
    console.error('[upsertProfile] unexpected error:', err)
    return {
      profile: null,
      error: err instanceof Error ? err.message : 'Failed to upsert profile',
    }
  }
}
