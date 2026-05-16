'use client'

/**
 * Third Supabase slice — Header wired to useCurrentProfile() with demo-safe warnings.
 */

import { Header } from '@/components/layout/header'
import { Badge } from '@/components/ui/badge'
import {
  getRoleProfileLabel,
  getRoleWorkspaceLabel,
  useCurrentProfile,
} from '@/hooks/use-current-profile'

interface DashboardHeaderProps {
  title?: string
  subtitle?: string
}

export function DashboardHeader({ title, subtitle }: DashboardHeaderProps) {
  const {
    profile,
    liveProfile,
    isLoading,
    isUsingMockFallback,
    workspaceRole,
    hasRoleMismatch,
  } = useCurrentProfile()

  return (
    <>
      {hasRoleMismatch && liveProfile && (
        <div
          className="border-b border-warning/30 bg-warning/5 px-6 py-2 text-xs text-warning-foreground"
          role="status"
        >
          You are viewing the {getRoleWorkspaceLabel(workspaceRole)} workspace, but your
          Supabase profile role is {getRoleProfileLabel(liveProfile.role)}. Use the role
          switcher or correct your profile role.
        </div>
      )}

      {!isLoading && (
        <div className="border-b border-border/60 bg-muted/20 px-6 py-1">
          <Badge
            variant="outline"
            className="h-5 border-border/80 px-2 text-[10px] font-normal text-muted-foreground"
          >
            {isUsingMockFallback ? 'Demo profile' : 'Live Supabase profile'}
          </Badge>
        </div>
      )}

      <Header user={profile} title={title} subtitle={subtitle} />
    </>
  )
}
