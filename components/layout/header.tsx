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
import { Bell, ChevronDown, Search, UserCircle, Users, Shield } from 'lucide-react'

/** `user` accepts mock users or Supabase profiles mapped via mapProfileRowToUser. */
interface HeaderProps {
  user: User
  title?: string
  subtitle?: string
}

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

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative h-9 w-9 text-muted-foreground hover:text-foreground">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
            3
          </span>
          <span className="sr-only">Notifications</span>
        </Button>

        {/* User Info */}
        <div className="flex items-center gap-3 border-l border-border pl-3">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-foreground">{user.name}</p>
            <p className="text-[10px] text-muted-foreground">
              {user.department && user.department !== '—'
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
