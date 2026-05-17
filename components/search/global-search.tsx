'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { isRealUuid } from '@/lib/data/goals'
import type { GlobalSearchResult } from '@/lib/data/search'
import type { User } from '@/lib/types'
import { FileText, Loader2, Search, Share2, Target, UserCircle } from 'lucide-react'

type GlobalSearchProps = {
  user: User
}

function iconForResult(type: GlobalSearchResult['type']) {
  if (type === 'profile') return UserCircle
  if (type === 'shared_goal') return Share2
  if (type === 'goal_sheet') return FileText
  return Target
}

export function GlobalSearch({ user }: GlobalSearchProps) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [results, setResults] = useState<GlobalSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isDisabled, setIsDisabled] = useState(
    !isSupabaseConfigured() || !isRealUuid(user.id)
  )
  const containerRef = useRef<HTMLDivElement | null>(null)

  const trimmedQuery = query.trim()
  const showEmptyState = debouncedQuery.length >= 2 && !isLoading && results.length === 0

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(trimmedQuery)
    }, 300)

    return () => window.clearTimeout(timer)
  }, [trimmedQuery])

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured() || !isRealUuid(user.id)) {
      setIsDisabled(true)
      setResults([])
      return
    }

    if (debouncedQuery.length < 2) {
      setResults([])
      setIsLoading(false)
      return
    }

    const controller = new AbortController()

    async function runSearch() {
      setIsLoading(true)
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(debouncedQuery)}`,
          { signal: controller.signal }
        )
        const payload = (await response.json()) as {
          results?: GlobalSearchResult[]
          disabled?: boolean
        }
        setIsDisabled(Boolean(payload.disabled))
        setResults(payload.results ?? [])
        setIsOpen(true)
      } catch (err) {
        if (!(err instanceof DOMException && err.name === 'AbortError')) {
          console.error('[GlobalSearch] search error:', err)
          setResults([])
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    runSearch()

    return () => controller.abort()
  }, [debouncedQuery, user.id])

  const placeholder = useMemo(() => {
    if (isDisabled) return 'Search unavailable'
    return 'Search goals, sheets, people...'
  }, [isDisabled])

  return (
    <div ref={containerRef} className="relative hidden md:block">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          setIsOpen(true)
        }}
        onFocus={() => setIsOpen(true)}
        disabled={isDisabled}
        placeholder={placeholder}
        className="h-9 w-72 rounded-lg border-border/80 bg-background/80 pl-9 pr-9 text-sm placeholder:text-muted-foreground/60 shadow-sm focus:bg-background disabled:cursor-not-allowed disabled:opacity-60"
      />
      {isLoading && (
        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      )}

      {isOpen && debouncedQuery.length >= 2 && !isDisabled && (
        <div className="absolute right-0 top-11 z-50 w-[26rem] overflow-hidden rounded-xl border border-border/80 bg-popover shadow-xl shadow-slate-950/10">
          {showEmptyState ? (
            <div className="px-4 py-5 text-sm text-muted-foreground">
              No matching goals found.
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto py-1">
              {results.map((result) => {
                const Icon = iconForResult(result.type)
                return (
                  <Link
                    key={result.id}
                    href={result.href}
                    onClick={() => {
                      setIsOpen(false)
                      setQuery('')
                    }}
                    className="flex items-start gap-3 px-3 py-3 transition-colors hover:bg-muted/60"
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {result.title}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {result.subtitle}
                      </span>
                    </span>
                    <Badge variant="outline" className="mt-0.5 shrink-0 text-[10px]">
                      {result.badge}
                    </Badge>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
