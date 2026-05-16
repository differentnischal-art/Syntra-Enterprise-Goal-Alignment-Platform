/**
 * Second Supabase slice — Auth helpers with safe missing-config handling.
 */

import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { upsertProfile } from '@/lib/data/profiles'
import type { UserRole } from '@/lib/types'
import type { Session, User } from '@supabase/supabase-js'

export type AuthErrorResult = {
  user: null
  session: null
  error: string
  message?: string
}

export type SignInResult =
  | {
      user: User
      session: Session
      error: null
      message?: string
    }
  | AuthErrorResult

export type SignUpResult =
  | {
      user: User
      session: Session | null
      error: null
      message?: string
    }
  | AuthErrorResult

function notConfiguredError(): AuthErrorResult {
  return {
    user: null,
    session: null,
    error: 'Supabase is not configured. Use demo access or set environment variables.',
  }
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<SignInResult> {
  if (!isSupabaseConfigured()) {
    return notConfiguredError()
  }

  const supabase = createClient()
  if (!supabase) {
    return notConfiguredError()
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { user: null, session: null, error: error.message }
    }

    if (!data.user || !data.session) {
      return { user: null, session: null, error: 'Sign-in failed. Please try again.' }
    }

    return {
      user: data.user,
      session: data.session,
      error: null,
    }
  } catch (err) {
    return {
      user: null,
      session: null,
      error: err instanceof Error ? err.message : 'Sign-in failed',
    }
  }
}

export async function signUpWithEmail(
  email: string,
  password: string,
  fullName: string,
  role: UserRole
): Promise<SignUpResult> {
  if (!isSupabaseConfigured()) {
    return notConfiguredError()
  }

  const supabase = createClient()
  if (!supabase) {
    return notConfiguredError()
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
        },
      },
    })

    if (error) {
      return { user: null, session: null, error: error.message }
    }

    if (!data.user) {
      return { user: null, session: null, error: 'Sign-up failed. Please try again.' }
    }

    if (!data.session) {
      return {
        user: data.user,
        session: null,
        error: null,
        message:
          'Account created. Check your email to confirm your address, then sign in. Ask an admin to link your profile if needed.',
      }
    }

    const { error: profileError } = await upsertProfile({
      id: data.user.id,
      full_name: fullName,
      email,
      role,
    })

    if (profileError) {
      return {
        user: data.user,
        session: data.session,
        error: null,
        message:
          'Signed up, but profile setup failed. Please contact Admin/HR to complete your profile.',
      }
    }

    return {
      user: data.user,
      session: data.session,
      error: null,
      message: 'Account created successfully.',
    }
  } catch (err) {
    return {
      user: null,
      session: null,
      error: err instanceof Error ? err.message : 'Sign-up failed',
    }
  }
}

export async function signOut(): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { error: null }
  }

  const supabase = createClient()
  if (!supabase) {
    return { error: null }
  }

  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      return { error: error.message }
    }
    return { error: null }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Sign-out failed',
    }
  }
}

export async function getSession(): Promise<Session | null> {
  if (!isSupabaseConfigured()) {
    return null
  }

  const supabase = createClient()
  if (!supabase) {
    return null
  }

  try {
    const { data, error } = await supabase.auth.getSession()
    if (error) {
      console.error('[getSession] error:', error.message)
      return null
    }
    return data.session
  } catch (err) {
    console.error('[getSession] unexpected error:', err)
    return null
  }
}

export async function getCurrentUser(): Promise<User | null> {
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
      error,
    } = await supabase.auth.getUser()

    if (error) {
      console.error('[getCurrentUser] error:', error.message)
      return null
    }

    return user
  } catch (err) {
    console.error('[getCurrentUser] unexpected error:', err)
    return null
  }
}
