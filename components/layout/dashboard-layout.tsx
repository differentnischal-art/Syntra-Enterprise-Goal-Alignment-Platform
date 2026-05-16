'use client'

import { useState } from 'react'
import { UserRole } from '@/lib/types'
import { Sidebar } from './sidebar'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu, Layers, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { mockGoalCycle } from '@/lib/mock-data'
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
            <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 border-r border-sidebar-border">
            <div className="flex h-full flex-col bg-sidebar">
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
              
              {/* Navigation */}
              <nav className="flex-1 px-3 py-4">
                <MobileNav role={role} onNavigate={() => setSidebarOpen(false)} />
              </nav>

              {/* Cycle Card */}
              <div className="border-t border-sidebar-border p-3">
                <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/30 p-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-sidebar-foreground">{mockGoalCycle.name}</p>
                      <p className="text-[10px] text-sidebar-foreground/50">Active Cycle</p>
                    </div>
                    <Badge variant="outline" className="border-success/30 bg-success/10 text-success text-[10px]">
                      Active
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Layers className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground">AlignOS</span>
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
        { href: '/admin/shared-goals', label: 'Shared Goals' },
        { href: '/admin/cycle-management', label: 'Cycle Management' },
        { href: '/admin/escalations', label: 'Escalations' },
        { href: '/admin/audit-trail', label: 'Audit Trail' },
        { href: '/admin/reports-export', label: 'Reports & Export' },
      ]
    : role === 'manager'
      ? [
          { href: '/manager', label: 'Dashboard' },
          { href: '/manager/approvals', label: 'Approvals' },
          { href: '/manager/team-goals', label: 'Team Goals' },
          { href: '/manager/check-ins', label: 'Check-ins' },
          { href: '/manager/performance', label: 'Performance' },
        ]
      : [
          { href: '/employee', label: 'Dashboard' },
          { href: '/employee/my-goal-sheet', label: 'My Goal Sheet' },
          { href: '/employee/create-goal-sheet', label: 'Create Goal Sheet' },
          { href: '/employee/quarterly-check-ins', label: 'Quarterly Check-ins' },
          { href: '/employee/shared-goals', label: 'Shared Goals' },
        ]

  return (
    <div className="space-y-1">
      <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
        Workspace
      </p>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          {item.label}
        </Link>
      ))}
      <div className="my-4 border-t border-sidebar-border" />
      <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
        Demo Views
      </p>
      <Link href="/employee" onClick={onNavigate} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground">
        Employee
      </Link>
      <Link href="/manager" onClick={onNavigate} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground">
        Manager
      </Link>
      <Link href="/admin" onClick={onNavigate} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground">
        Admin / HR
      </Link>
      <div className="my-4 border-t border-sidebar-border" />
      <Link href="/" onClick={onNavigate} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground">
        Sign Out
      </Link>
    </div>
  )
}
