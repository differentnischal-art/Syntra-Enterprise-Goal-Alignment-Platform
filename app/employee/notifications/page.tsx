'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  getNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationRow,
} from '@/lib/data/notifications'
import { useCurrentProfile } from '@/hooks/use-current-profile'
import { isRealUuid } from '@/lib/data/goals'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { Bell, CheckCircle2 } from 'lucide-react'

const demoNotifications: NotificationRow[] = [
  {
    id: 'demo-notification-1',
    userId: 'demo',
    type: 'goal_approved',
    title: 'Goal Sheet Approved',
    message: 'Your goal sheet has been approved and locked.',
    link: '/employee/my-goal-sheet',
    isRead: false,
    createdAt: '2025-05-18T14:22:00Z',
  },
  {
    id: 'demo-notification-2',
    userId: 'demo',
    type: 'comment_added',
    title: 'Manager Comment Added',
    message: 'Your manager added feedback on your check-in.',
    link: '/employee/quarterly-check-ins',
    isRead: true,
    createdAt: '2025-10-16T11:00:00Z',
  },
]

export default function EmployeeNotificationsPage() {
  const { liveProfile } = useCurrentProfile()
  const [liveNotifications, setLiveNotifications] = useState<NotificationRow[] | null>(null)
  const [demoState, setDemoState] = useState<NotificationRow[]>(demoNotifications)

  const canFetchLive = Boolean(liveProfile && isRealUuid(liveProfile.id))

  useEffect(() => {
    if (!canFetchLive || !liveProfile) {
      setLiveNotifications(null)
      return
    }

    let cancelled = false
    getNotificationsForUser(liveProfile.id).then((notifications) => {
      if (!cancelled) {
        setLiveNotifications(notifications)
      }
    })

    return () => {
      cancelled = true
    }
  }, [canFetchLive, liveProfile])

  const notifications = isSupabaseConfigured()
    ? liveNotifications ?? []
    : demoState
  const isLiveMode = isSupabaseConfigured()
  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications]
  )

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleMarkRead = async (notification: NotificationRow) => {
    if (notification.isRead) {
      return
    }

    if (isLiveMode) {
      const success = await markNotificationRead(notification.id)
      if (!success) return
      setLiveNotifications((current) =>
        current?.map((item) =>
          item.id === notification.id ? { ...item, isRead: true } : item
        ) ?? current
      )
      return
    }

    if (isSupabaseConfigured()) {
      return
    }

    setDemoState((current) =>
      current.map((item) =>
        item.id === notification.id ? { ...item, isRead: true } : item
      )
    )
  }

  const handleMarkAllRead = async () => {
    if (isLiveMode && liveProfile) {
      const success = await markAllNotificationsRead(liveProfile.id)
      if (!success) return
      setLiveNotifications((current) =>
        current?.map((notification) => ({ ...notification, isRead: true })) ?? current
      )
      return
    }

    if (isSupabaseConfigured()) {
      return
    }

    setDemoState((current) =>
      current.map((notification) => ({ ...notification, isRead: true }))
    )
  }

  return (
    <DashboardLayout role="employee">
      <DashboardHeader title="Notifications" />

      <div className="p-6 space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="outline">
              {isLiveMode ? 'Live Supabase notifications' : 'Demo notifications'}
            </Badge>
            <Badge variant="outline">{unreadCount} unread</Badge>
          </div>
          <Button variant="outline" size="sm" onClick={handleMarkAllRead} disabled={unreadCount === 0}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Mark all read
          </Button>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Latest Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No notifications yet.
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="rounded-lg border border-border bg-card p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                        <Bell className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-medium">{notification.title}</h3>
                              {!notification.isRead && (
                                <span className="h-2 w-2 rounded-full bg-primary" />
                              )}
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {notification.message}
                            </p>
                            <p className="mt-2 text-xs text-muted-foreground">
                              {formatTimestamp(notification.createdAt)}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkRead(notification)}
                            disabled={notification.isRead}
                          >
                            {notification.isRead ? 'Read' : 'Mark read'}
                          </Button>
                        </div>
                        {notification.link && (
                          <Button asChild variant="link" className="mt-2 h-auto p-0">
                            <Link href={notification.link}>Open</Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
