/**
 * Eighth Supabase slice - notifications.
 */

import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { isRealUuid } from '@/lib/data/goals'

export type NotificationType =
  | 'goal_submitted'
  | 'goal_approved'
  | 'goal_returned'
  | 'checkin_due'
  | 'checkin_submitted'
  | 'comment_added'
  | 'shared_goal_assigned'
  | 'escalation'

export type NotificationInput = {
  userId: string
  type: NotificationType
  title: string
  message: string
  link?: string | null
}

export type NotificationRow = {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  link: string | null
  isRead: boolean
  createdAt: string
}

type DbNotificationRow = {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  link: string | null
  is_read: boolean
  created_at: string
}

const NOTIFICATION_SELECT = `
  id,
  user_id,
  type,
  title,
  message,
  link,
  is_read,
  created_at
`

function mapNotificationRow(row: DbNotificationRow): NotificationRow {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    message: row.message,
    link: row.link,
    isRead: row.is_read,
    createdAt: row.created_at,
  }
}

export async function createNotification(
  input: NotificationInput
): Promise<NotificationRow | null> {
  if (!isSupabaseConfigured() || !isRealUuid(input.userId)) {
    return null
  }

  const supabase = createClient()
  if (!supabase) {
    return null
  }

  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        link: input.link ?? null,
      })

    if (error) {
      console.error('[createNotification] error:', error.message)
      return null
    }

    return {
      id: '',
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      link: input.link ?? null,
      isRead: false,
      createdAt: new Date().toISOString(),
    }
  } catch (err) {
    console.error('[createNotification] unexpected error:', err)
    return null
  }
}

export async function getNotificationsForUser(
  userId: string
): Promise<NotificationRow[]> {
  if (!isSupabaseConfigured() || !isRealUuid(userId)) {
    return []
  }

  const supabase = createClient()
  if (!supabase) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from('notifications')
      .select(NOTIFICATION_SELECT)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('[getNotificationsForUser] error:', error.message)
      return []
    }

    return ((data ?? []) as DbNotificationRow[]).map(mapNotificationRow)
  } catch (err) {
    console.error('[getNotificationsForUser] unexpected error:', err)
    return []
  }
}

export async function markNotificationRead(
  notificationId: string
): Promise<boolean> {
  if (!isSupabaseConfigured() || !isRealUuid(notificationId)) {
    return false
  }

  const supabase = createClient()
  if (!supabase) {
    return false
  }

  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)

    if (error) {
      console.error('[markNotificationRead] error:', error.message)
      return false
    }

    return true
  } catch (err) {
    console.error('[markNotificationRead] unexpected error:', err)
    return false
  }
}

export async function markAllNotificationsRead(userId: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !isRealUuid(userId)) {
    return false
  }

  const supabase = createClient()
  if (!supabase) {
    return false
  }

  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (error) {
      console.error('[markAllNotificationsRead] error:', error.message)
      return false
    }

    return true
  } catch (err) {
    console.error('[markAllNotificationsRead] unexpected error:', err)
    return false
  }
}
