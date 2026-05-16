'use client'

import { useState } from 'react'
import { UserRole } from '@/lib/types'
import { Sidebar } from './sidebar'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu, Target } from 'lucide-react'
import Link from 'next/link'

interface DashboardLayoutProps {
  children: React.ReactNode
  role: UserRole
}

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 flex h-14 items-center gap-4 border-b border-border bg-card px-4 lg:hidden">
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="flex h-full flex-col">
              <div className="flex h-16 items-center gap-2 border-b border-border px-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <Target className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-lg font-semibold text-foreground">GoalSync</span>
              </div>
              <nav className="flex-1 px-3 py-4">
                <MobileNav role={role} onNavigate={() => setSidebarOpen(false)} />
              </nav>
            </div>
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Target className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground">GoalSync</span>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar role={role} />
      </div>

      {/* Main Content */}
      <main className="lg:ml-64">
        {children}
      </main>
    </div>
  )
}

// Mobile navigation items
function MobileNav({ role, onNavigate }: { role: UserRole; onNavigate: () => void }) {
  const navItems = role === 'admin'
    ? [
        { href: '/admin', label: 'Dashboard' },
        { href: '/admin/employees', label: 'All Employees' },
        { href: '/admin/goal-cycles', label: 'Goal Cycles' },
        { href: '/admin/shared-goals', label: 'Shared Goals' },
        { href: '/admin/audit-log', label: 'Audit Log' },
        { href: '/admin/reports', label: 'Reports' },
      ]
    : role === 'manager'
      ? [
          { href: '/manager', label: 'Dashboard' },
          { href: '/manager/team-goals', label: 'Team Goals' },
          { href: '/manager/check-ins', label: 'Check-ins' },
          { href: '/manager/reports', label: 'Reports' },
        ]
      : [
          { href: '/employee', label: 'Dashboard' },
          { href: '/employee/goals', label: 'My Goals' },
          { href: '/employee/check-ins', label: 'Check-ins' },
          { href: '/employee/profile', label: 'Profile' },
        ]

  return (
    <div className="space-y-1">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {item.label}
        </Link>
      ))}
      <div className="my-4 border-t border-border" />
      <p className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Demo Views
      </p>
      <Link href="/employee" onClick={onNavigate} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
        Employee
      </Link>
      <Link href="/manager" onClick={onNavigate} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
        Manager
      </Link>
      <Link href="/admin" onClick={onNavigate} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
        Admin
      </Link>
      <div className="my-4 border-t border-border" />
      <Link href="/" onClick={onNavigate} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
        Sign Out
      </Link>
    </div>
  )
}
