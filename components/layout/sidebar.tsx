'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { UserRole } from '@/lib/types'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  Target,
  CalendarCheck,
  User,
  Users,
  FileText,
  Clock,
  Share2,
  ClipboardList,
  BarChart3,
  LogOut,
  UserCircle,
  Shield,
} from 'lucide-react'

interface SidebarProps {
  role: UserRole
}

const employeeNavItems = [
  { href: '/employee', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/employee/goals', label: 'My Goals', icon: Target },
  { href: '/employee/check-ins', label: 'Check-ins', icon: CalendarCheck },
  { href: '/employee/profile', label: 'Profile', icon: User },
]

const managerNavItems = [
  { href: '/manager', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/manager/team-goals', label: 'Team Goals', icon: Target },
  { href: '/manager/check-ins', label: 'Check-ins', icon: CalendarCheck },
  { href: '/manager/reports', label: 'Reports', icon: FileText },
]

const adminNavItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/employees', label: 'All Employees', icon: Users },
  { href: '/admin/goal-cycles', label: 'Goal Cycles', icon: Clock },
  { href: '/admin/shared-goals', label: 'Shared Goals', icon: Share2 },
  { href: '/admin/audit-log', label: 'Audit Log', icon: ClipboardList },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
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
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Target className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-lg font-semibold text-foreground">GoalSync</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href + '/'))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Demo Role Switcher */}
      <div className="border-t border-border p-3 space-y-1">
        <p className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Demo Views
        </p>
        <Link
          href="/employee"
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
            role === 'employee'
              ? 'bg-primary/10 text-primary font-medium'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
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
              ? 'bg-primary/10 text-primary font-medium'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
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
              ? 'bg-primary/10 text-primary font-medium'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <Shield className="h-4 w-4" />
          Admin
        </Link>
      </div>

      <div className="border-t border-border p-4">
        <Button variant="ghost" asChild className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground">
          <Link href="/">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Link>
        </Button>
      </div>
    </aside>
  )
}
