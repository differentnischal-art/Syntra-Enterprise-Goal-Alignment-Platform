'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { UserRole } from '@/lib/types'
import { mockGoalCycle } from '@/lib/mock-data'
import { Badge } from '@/components/ui/badge'
import {
  LayoutDashboard,
  Target,
  CalendarCheck,
  FileText,
  Users,
  Clock,
  Share2,
  ClipboardList,
  BarChart3,
  LogOut,
  UserCircle,
  Shield,
  AlertTriangle,
  Settings,
  ChevronRight,
  CheckSquare,
  Layers,
} from 'lucide-react'

interface SidebarProps {
  role: UserRole
}

const employeeNavItems = [
  { href: '/employee', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/employee/my-goal-sheet', label: 'My Goal Sheet', icon: FileText },
  { href: '/employee/create-goal-sheet', label: 'Create Goal Sheet', icon: Target },
  { href: '/employee/quarterly-check-ins', label: 'Quarterly Check-ins', icon: CalendarCheck },
  { href: '/employee/shared-goals', label: 'Shared Goals', icon: Share2 },
]

const managerNavItems = [
  { href: '/manager', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/manager/approvals', label: 'Approvals', icon: CheckSquare, badge: 2 },
  { href: '/manager/team-goals', label: 'Team Goals', icon: Target },
  { href: '/manager/check-ins', label: 'Check-ins', icon: CalendarCheck },
  { href: '/manager/performance', label: 'Performance', icon: BarChart3 },
]

const adminNavItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/shared-goals', label: 'Shared Goals', icon: Share2 },
  { href: '/admin/cycle-management', label: 'Cycle Management', icon: Clock },
  { href: '/admin/escalations', label: 'Escalations', icon: AlertTriangle, badge: 4 },
  { href: '/admin/audit-trail', label: 'Audit Trail', icon: ClipboardList },
  { href: '/admin/reports-export', label: 'Reports & Export', icon: BarChart3 },
]

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()

  const navItems =
    role === 'admin'
      ? adminNavItems
      : role === 'manager'
        ? managerNavItems
        : employeeNavItems

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <Layers className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="flex flex-col">
          <span className="text-base font-semibold text-sidebar-foreground">AlignOS</span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-sidebar-foreground/60">Goal Lifecycle Suite</span>
        </div>
      </div>

      {/* Workspace Section */}
      <div className="px-3 pt-4">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
          Workspace
        </p>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 px-3 pb-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href + '/'))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <item.icon className={cn('h-4 w-4', isActive ? 'text-sidebar-primary-foreground' : 'text-sidebar-foreground/50 group-hover:text-sidebar-accent-foreground')} />
              <span className="flex-1">{item.label}</span>
              {'badge' in item && item.badge && (
                <Badge variant="secondary" className="h-5 min-w-5 justify-center rounded-full bg-destructive/90 px-1.5 text-[10px] font-semibold text-destructive-foreground">
                  {item.badge}
                </Badge>
              )}
              {isActive && <ChevronRight className="h-3 w-3 text-sidebar-primary-foreground/50" />}
            </Link>
          )
        })}
      </nav>

      {/* Demo Role Switcher */}
      <div className="border-t border-sidebar-border px-3 py-3">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
          Demo Views
        </p>
        <div className="space-y-0.5">
          <Link
            href="/employee"
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
              role === 'employee'
                ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
            )}
          >
            <UserCircle className="h-4 w-4" />
            Employee
          </Link>
          <Link
            href="/manager"
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
              role === 'manager'
                ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
            )}
          >
            <Users className="h-4 w-4" />
            Manager
          </Link>
          <Link
            href="/admin"
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
              role === 'admin'
                ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
            )}
          >
            <Shield className="h-4 w-4" />
            Admin / HR
          </Link>
        </div>
      </div>

      {/* Cycle Card */}
      <div className="border-t border-sidebar-border p-3">
        <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/30 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
                <Clock className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium text-sidebar-foreground">{mockGoalCycle.name}</p>
                <p className="text-[10px] text-sidebar-foreground/50">Active Cycle</p>
              </div>
            </div>
            <Badge variant="outline" className="border-success/30 bg-success/10 text-success text-[10px]">
              Active
            </Badge>
          </div>
        </div>
      </div>

      {/* Sign Out */}
      <div className="border-t border-sidebar-border p-3">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Link>
      </div>
    </aside>
  )
}
