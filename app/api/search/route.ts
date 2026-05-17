import { NextResponse } from 'next/server'
import { getSearchProfile, searchSupabaseRecords } from '@/lib/data/search'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.trim() ?? ''

  if (query.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const supabase = await createClient()
  if (!supabase) {
    return NextResponse.json({ results: [], disabled: true })
  }

  try {
    const profile = await getSearchProfile(supabase)
    if (!profile) {
      return NextResponse.json({ results: [], disabled: true })
    }

    const results = await searchSupabaseRecords(supabase, profile, query)
    return NextResponse.json({ results })
  } catch (err) {
    console.error('[api/search] unexpected error:', err)
    return NextResponse.json({ results: [] }, { status: 200 })
  }
}
