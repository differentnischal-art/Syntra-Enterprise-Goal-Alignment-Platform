'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { mockEmployeeUser, mockGoalCycle } from '@/lib/mock-data'
import { 
  CheckCircle2, 
  Calendar, 
  MessageSquare, 
  Share2, 
  AlertTriangle,
  Bell,
  Check,
  Trash2
} from 'lucide-react'

interface Notification {
  id: string
  icon: React.ElementType
  iconColor: string
  bgColor: string
  title: string
  description: string
  timestamp: string
  isUnread: boolean
  category: 'goals' | 'check-ins' | 'comments' | 'shared' | 'alerts'
}

const initialNotifications: Notification[] = [
  {
    id: 'n1',
    icon: CheckCircle2,
    iconColor: 'text-success',
    bgColor: 'bg-success/10',
    title: 'Goal Sheet Approved',
    description: 'Your FY26 goal sheet has been approved by Rohan Mehta. All goals are now locked.',
    timestamp: '2 hours ago',
    isUnread: true,
    category: 'goals',
  },
  {
    id: 'n2',
    icon: Calendar,
    iconColor: 'text-warning-foreground',
    bgColor: 'bg-warning/10',
    title: 'Q4 Check-in Due Soon',
    description: 'Q4 check-in window opens on March 15, 2026. Prepare your quarterly achievement updates.',
    timestamp: '5 hours ago',
    isUnread: true,
    category: 'check-ins',
  },
  {
    id: 'n3',
    icon: MessageSquare,
    iconColor: 'text-primary',
    bgColor: 'bg-primary/10',
    title: 'Manager Comment Added',
    description: 'Rohan Mehta added feedback on your "API Performance Optimization" goal: "Good progress. Focus on caching improvements in Q4."',
    timestamp: '1 day ago',
    isUnread: true,
    category: 'comments',
  },
  {
    id: 'n4',
    icon: Share2,
    iconColor: 'text-primary',
    bgColor: 'bg-primary/10',
    title: 'Shared KPI Assigned',
    description: 'You have been assigned to the shared goal "Complete Cloud Architecture Certification" by Rohan Mehta.',
    timestamp: '2 days ago',
    isUnread: false,
    category: 'shared',
  },
  {
    id: 'n5',
    icon: AlertTriangle,
    iconColor: 'text-destructive',
    bgColor: 'bg-destructive/10',
    title: 'Escalation Reminder',
    description: 'Your Q3 check-in submission is overdue. Please update your progress immediately.',
    timestamp: '3 days ago',
    isUnread: false,
    category: 'alerts',
  },
  {
    id: 'n6',
    icon: CheckCircle2,
    iconColor: 'text-success',
    bgColor: 'bg-success/10',
    title: 'Goal Completed',
    description: 'Congratulations! You have marked "Launch Customer Self-Service Portal" as completed.',
    timestamp: '1 week ago',
    isUnread: false,
    category: 'goals',
  },
  {
    id: 'n7',
    icon: Calendar,
    iconColor: 'text-success',
    bgColor: 'bg-success/10',
    title: 'Q3 Check-in Submitted',
    description: 'Your Q3 quarterly check-in has been successfully submitted and is now visible to your manager.',
    timestamp: '2 weeks ago',
    isUnread: false,
    category: 'check-ins',
  },
  {
    id: 'n8',
    icon: MessageSquare,
    iconColor: 'text-primary',
    bgColor: 'bg-primary/10',
    title: 'Manager Review Complete',
    description: 'Rohan Mehta has reviewed your Q3 check-in and added comments on 3 goals.',
    timestamp: '2 weeks ago',
    isUnread: false,
    category: 'comments',
  },
]

export default function EmployeeNotificationsPage() {
  const [notifications, setNotifications] = useState(initialNotifications)
  const [filter, setFilter] = useState<string>('all')

  const unreadCount = notifications.filter(n => n.isUnread).length

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : filter === 'unread'
      ? notifications.filter(n => n.isUnread)
      : notifications.filter(n => n.category === filter)

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, isUnread: false } : n
    ))
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isUnread: false })))
  }

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  return (
    <DashboardLayout role="employee">
      <Header 
        user={mockEmployeeUser} 
        title="Notifications" 
        subtitle={mockGoalCycle.name}
      />

      <div className="p-6 space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">All Notifications</h2>
            <p className="text-sm text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <Check className="mr-2 h-4 w-4" />
              Mark all as read
            </Button>
          )}
        </div>

        {/* Filter Tabs */}
        <Tabs value={filter} onValueChange={setFilter} className="w-full">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-flex">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread" className="relative">
              Unread
              {unreadCount > 0 && (
                <Badge className="ml-1.5 h-5 w-5 rounded-full p-0 text-[10px]">{unreadCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
            <TabsTrigger value="check-ins">Check-ins</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="mt-6">
            {filteredNotifications.length === 0 ? (
              <Card className="border-border/60">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="mb-4 h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                    <Bell className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground">No notifications</h3>
                  <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                    {filter === 'unread' ? 'You have read all notifications.' : `No ${filter} notifications yet.`}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border/60">
                <CardContent className="p-0 divide-y divide-border">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex gap-4 p-4 hover:bg-muted/50 transition-colors ${
                        notification.isUnread ? 'bg-primary/5' : ''
                      }`}
                    >
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${notification.bgColor}`}>
                        <notification.icon className={`h-5 w-5 ${notification.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-foreground">
                                {notification.title}
                              </p>
                              {notification.isUnread && (
                                <span className="h-2 w-2 rounded-full bg-primary" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.description}
                            </p>
                            <p className="text-xs text-muted-foreground/70 mt-2">
                              {notification.timestamp}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {notification.isUnread && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                onClick={() => markAsRead(notification.id)}
                              >
                                <Check className="h-4 w-4" />
                                <span className="sr-only">Mark as read</span>
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => deleteNotification(notification.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
