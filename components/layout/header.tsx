'use client'

import Link from 'next/link'
import { User } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown, UserCircle, Users, Shield } from 'lucide-react'

interface HeaderProps {
  user: User
  title?: string
}

export function Header({ user, title }: HeaderProps) {
  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  const roleLabel =
    user.role === 'admin' ? 'Administrator' : user.role === 'manager' ? 'Manager' : 'Employee'

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <div>
        {title && <h1 className="text-xl font-semibold text-foreground">{title}</h1>}
      </div>

      <div className="flex items-center gap-4">
        {/* Role Switch Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <span className="hidden sm:inline">Switch Role</span>
              <span className="sm:hidden">Demo</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Demo Navigation</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/employee" className="flex items-center gap-2 cursor-pointer">
                <UserCircle className="h-4 w-4" />
                Employee View
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/manager" className="flex items-center gap-2 cursor-pointer">
                <Users className="h-4 w-4" />
                Manager View
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin" className="flex items-center gap-2 cursor-pointer">
                <Shield className="h-4 w-4" />
                Admin View
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-foreground">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.department}</p>
          </div>
          <Badge
            variant="outline"
            className="border-primary/30 bg-primary/5 text-primary"
          >
            {roleLabel}
          </Badge>
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}
