'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { User } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  getNotificationsForUser,
  markNotificationRead,
  type NotificationRow,
} from '@/lib/data/notifications'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { isRealUuid } from '@/lib/data/goals'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Bell, ChevronDown, Search, UserCircle, Users, Shield } from 'lucide-react'

/** `user` accepts mock users or Supabase profiles mapped via mapProfileRowToUser. */
interface HeaderProps {
  user: User
  title?: string
  subtitle?: string
  showRoleSwitcher?: boolean
}

const demoNotifications: NotificationRow[] = [
  {
    id: 'demo-notification-1',
    userId: 'demo',
    type: 'goal_approved',
    title: 'Goal Sheet Approved',
    message: 'Your latest goal sheet is approved and locked.',
    link: '/employee/my-goal-sheet',
    isRead: false,
    createdAt: '2025-05-18T14:22:00Z',
  },
  {
    id: 'demo-notification-2',
    userId: 'demo',
    type: 'checkin_due',
    title: 'Q4 Check-in Window Open',
    message: 'Submit your quarterly check-in before the due date.',
    link: '/employee/quarterly-check-ins',
    isRead: false,
    createdAt: '2026-03-15T09:00:00Z',
  },
  {
    id: 'demo-notification-3',
    userId: 'demo',
    type: 'comment_added',
    title: 'Manager Comment Added',
    message: 'Your manager added feedback on your check-in.',
    link: '/employee/quarterly-check-ins',
    isRead: true,
    createdAt: '2025-10-16T11:00:00Z',
  },
]

export function Header({ user, title, subtitle, showRoleSwitcher = true }: HeaderProps) {
  const [liveNotifications, setLiveNotifications] = useState<NotificationRow[] | null>(null)
  const canFetchNotifications = isSupabaseConfigured() && isRealUuid(user.id)

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

  const notificationFooterHref =
    user.role === 'admin'
      ? '/admin/escalations'
      : user.role === 'manager'
        ? '/manager/check-ins'
        : '/employee/notifications'

  useEffect(() => {
    if (!canFetchNotifications) {
      setLiveNotifications(null)
      return
    }

    let cancelled = false
    getNotificationsForUser(user.id).then((notifications) => {
      if (!cancelled) {
        setLiveNotifications(notifications)
      }
    })

    return () => {
      cancelled = true
    }
  }, [canFetchNotifications, user.id])

  const notifications = liveNotifications ?? demoNotifications
  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications]
  )

  const formatNotificationTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleNotificationClick = async (notification: NotificationRow) => {
    if (!canFetchNotifications || notification.isRead) {
      return
    }

    const success = await markNotificationRead(notification.id)
    if (success) {
      setLiveNotifications((current) =>
        current?.map((item) =>
          item.id === notification.id ? { ...item, isRead: true } : item
        ) ?? current
      )
    }
  }

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

        {showRoleSwitcher ? (
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
        ) : (
          <Badge variant="outline" className={roleColor}>
            {roleLabel}
          </Badge>
        )}

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9 text-muted-foreground hover:text-foreground">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                  {unreadCount}
                </span>
              )}
              <span className="sr-only">Notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              <Badge variant="outline" className="text-[10px]">
                {liveNotifications ? 'Live' : 'Demo'}
              </Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="px-3 py-4 text-sm text-muted-foreground">
                No notifications yet.
              </div>
            ) : (
              notifications.slice(0, 5).map((notification) => (
                <DropdownMenuItem key={notification.id} asChild>
                  <Link
                    href={notification.link ?? notificationFooterHref}
                    className="flex cursor-pointer items-start gap-3 py-3"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-muted">
                      <Bell className="h-3.5 w-3.5 text-muted-foreground" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className="text-sm font-medium">{notification.title}</span>
                        {!notification.isRead && (
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                        )}
                      </span>
                      <span className="mt-0.5 block line-clamp-2 text-xs text-muted-foreground">
                        {notification.message}
                      </span>
                      <span className="mt-1 block text-[10px] text-muted-foreground">
                        {formatNotificationTime(notification.createdAt)}
                      </span>
                    </span>
                  </Link>
                </DropdownMenuItem>
              ))
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={notificationFooterHref} className="cursor-pointer justify-center text-sm font-medium">
                View all notifications
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Info */}
        <div className="flex items-center gap-3 border-l border-border pl-3">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-foreground">{user.name}</p>
            <p className="text-[10px] text-muted-foreground">
              {user.department && user.department !== '-'
                ? user.department
                : 'No department assigned'}
            </p>
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
