/**
 * First Supabase integration slice — active goal cycle only.
 * Mock fallback in lib/mock-data.ts remains intentional during migration.
 */

import { createClient } from '@/lib/supabase/client'
import { mockGoalCycle } from '@/lib/mock-data'
import type { GoalCycle } from '@/lib/types'

type DbCycleWindow = {
  period: string
  quarter: string | null
  window_opens: string
  window_closes: string | null
}

type DbGoalCycleRow = {
  id: string
  name: string
  year: number
  start_date: string
  end_date: string
  status: GoalCycle['status']
  cycle_windows: DbCycleWindow[] | null
}

function mapCycleWindows(windows: DbCycleWindow[]): GoalCycle['windows'] {
  const fallback = mockGoalCycle.windows
  const mapped: GoalCycle['windows'] = {
    goalCreation: { ...fallback.goalCreation },
    q1CheckIn: { ...fallback.q1CheckIn },
    q2CheckIn: { ...fallback.q2CheckIn },
    q3CheckIn: { ...fallback.q3CheckIn },
    q4CheckIn: { ...fallback.q4CheckIn },
  }

  for (const window of windows) {
    const start = window.window_opens
    const end = window.window_closes ?? window.window_opens
    const range = { start, end }

    switch (window.quarter) {
      case 'q1':
        mapped.q1CheckIn = range
        break
      case 'q2':
        mapped.q2CheckIn = range
        break
      case 'q3':
        mapped.q3CheckIn = range
        break
      case 'q4':
        mapped.q4CheckIn = range
        break
      default:
        mapped.goalCreation = range
        break
    }
  }

  return mapped
}

function mapRowToGoalCycle(row: DbGoalCycleRow): GoalCycle {
  return {
    id: row.id,
    name: row.name,
    year: row.year,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
    windows: mapCycleWindows(row.cycle_windows ?? []),
  }
}

/**
 * Fetches the active goal cycle from Supabase (with cycle windows).
 * Falls back to mockGoalCycle when env is missing or the query fails.
 */
export async function getActiveGoalCycle(): Promise<GoalCycle> {
  const supabase = createClient()
  if (!supabase) {
    return mockGoalCycle
  }

  try {
    const { data, error } = await supabase
      .from('goal_cycles')
      .select(
        `
        id,
        name,
        year,
        start_date,
        end_date,
        status,
        cycle_windows (
          period,
          quarter,
          window_opens,
          window_closes
        )
      `
      )
      .eq('status', 'active')
      .order('start_date', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('[getActiveGoalCycle] Supabase error:', error.message)
      return mockGoalCycle
    }

    if (!data) {
      return mockGoalCycle
    }

    return mapRowToGoalCycle(data as DbGoalCycleRow)
  } catch (err) {
    console.error('[getActiveGoalCycle] Unexpected error:', err)
    return mockGoalCycle
  }
}
