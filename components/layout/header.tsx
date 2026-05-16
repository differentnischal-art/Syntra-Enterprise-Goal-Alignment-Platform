'use client'

import Link from 'next/link'
import { User } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { 
  Bell, 
  ChevronDown, 
  Search, 
  UserCircle, 
  Users, 
  Shield,
  CheckCircle2,
  Calendar,
  MessageSquare,
  Share2,
  AlertTriangle,
  ArrowRight
} from 'lucide-react'

interface HeaderProps {
  user: User
  title?: string
  subtitle?: string
}

// Mock notifications data
const mockNotifications = [
  {
    id: 'n1',
    icon: CheckCircle2,
    iconColor: 'text-success',
    bgColor: 'bg-success/10',
    title: 'Goal Sheet Approved',
    description: 'Your FY26 goal sheet has been approved by Rohan Mehta.',
    timestamp: '2 hours ago',
    isUnread: true,
  },
  {
    id: 'n2',
    icon: Calendar,
    iconColor: 'text-warning-foreground',
    bgColor: 'bg-warning/10',
    title: 'Q4 Check-in Due Soon',
    description: 'Q4 check-in window opens in 3 days. Prepare your updates.',
    timestamp: '5 hours ago',
    isUnread: true,
  },
  {
    id: 'n3',
    icon: MessageSquare,
    iconColor: 'text-primary',
    bgColor: 'bg-primary/10',
    title: 'Manager Comment Added',
    description: 'Rohan Mehta added feedback on your API Performance goal.',
    timestamp: '1 day ago',
    isUnread: true,
  },
  {
    id: 'n4',
    icon: Share2,
    iconColor: 'text-primary',
    bgColor: 'bg-primary/10',
    title: 'Shared KPI Assigned',
    description: 'You have been assigned to "Cloud Certification" shared goal.',
    timestamp: '2 days ago',
    isUnread: false,
  },
  {
    id: 'n5',
    icon: AlertTriangle,
    iconColor: 'text-destructive',
    bgColor: 'bg-destructive/10',
    title: 'Escalation Reminder',
    description: 'Goal sheet approval pending for 8 days. Action required.',
    timestamp: '3 days ago',
    isUnread: false,
  },
]

export function Header({ user, title, subtitle }: HeaderProps) {
  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  const roleLabel =
    user.role === 'admin' ? 'Admin / HR' : user.role === 'manager' ? 'Manager' : 'Employee'

  const roleColor = user.role === 'admin' 
    ? 'border-primary/30 bg-primary/5 text-primary'
    : user.role === 'manager'
      ? 'border-warning/30 bg-warning/10 text-warning-foreground'
      : 'border-success/30 bg-success/10 text-success'

  const unreadCount = mockNotifications.filter(n => n.isUnread).length

  // Determine "View all" route based on role
  const viewAllRoute = user.role === 'admin' 
    ? '/admin/escalations'
    : user.role === 'manager'
      ? '/manager/check-ins'
      : '/employee/notifications'

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card px-6">
      {/* Left: Title & Subtitle */}
      <div className="flex items-center gap-4">
        {title && (
          <div>
            <h1 className="text-lg font-semibold text-foreground">{title}</h1>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
        )}
      </div>

      {/* Right: Search, Role Switch, Notifications, User */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search goals, employees, audit IDs..."
            className="h-9 w-64 rounded-lg border-border bg-muted/50 pl-9 text-sm placeholder:text-muted-foreground/60 focus:bg-background"
          />
        </div>

        {/* Role Switch Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-2 border-border bg-transparent text-xs font-medium">
              <span className="hidden sm:inline">Viewing as</span>
              <Badge variant="outline" className={roleColor}>
                {roleLabel}
              </Badge>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-xs text-muted-foreground">Switch Demo View</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/employee" className="flex items-center gap-2 cursor-pointer">
                <UserCircle className="h-4 w-4 text-success" />
                Employee View
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/manager" className="flex items-center gap-2 cursor-pointer">
                <Users className="h-4 w-4 text-warning-foreground" />
                Manager View
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin" className="flex items-center gap-2 cursor-pointer">
                <Shield className="h-4 w-4 text-primary" />
                Admin / HR View
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9 text-muted-foreground hover:text-foreground">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
                  {unreadCount}
                </span>
              )}
              <span className="sr-only">Notifications</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="border-b border-border px-4 py-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">Notifications</h4>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {unreadCount} new
                  </Badge>
                )}
              </div>
            </div>
            <div className="max-h-[320px] overflow-y-auto">
              {mockNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer ${
                    notification.isUnread ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${notification.bgColor}`}>
                    <notification.icon className={`h-4 w-4 ${notification.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-foreground leading-tight">
                        {notification.title}
                      </p>
                      {notification.isUnread && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-primary mt-1" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {notification.description}
                    </p>
                    <p className="text-[10px] text-muted-foreground/70 mt-1">
                      {notification.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-border p-2">
              <Link href={viewAllRoute}>
                <Button variant="ghost" size="sm" className="w-full justify-center text-xs gap-1">
                  View all notifications
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </PopoverContent>
        </Popover>

        {/* User Info */}
        <div className="flex items-center gap-3 border-l border-border pl-3">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-foreground">{user.name}</p>
            <p className="text-[10px] text-muted-foreground">{user.department}</p>
          </div>
          <Avatar className="h-8 w-8 border border-border">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}
