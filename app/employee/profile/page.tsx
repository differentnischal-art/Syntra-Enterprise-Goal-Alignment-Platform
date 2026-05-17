'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useCurrentProfile } from '@/hooks/use-current-profile'
import { User, Mail, Building2, Shield } from 'lucide-react'

export default function EmployeeProfilePage() {
  const { profile } = useCurrentProfile()
  const displayName = profile?.name ?? 'Profile unavailable'
  const displayEmail = profile?.email ?? '—'
  const displayDepartment = profile?.department ?? '—'
  const displayRole = profile?.role ?? 'employee'
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  return (
    <DashboardLayout role="employee">
      <DashboardHeader title="Profile" />

      <div className="p-6 max-w-2xl">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-semibold">{displayName}</h3>
                <p className="text-muted-foreground">{displayEmail}</p>
                <Badge
                  variant="outline"
                  className="mt-2 border-primary/30 bg-primary/5 text-primary"
                >
                  {displayRole.charAt(0).toUpperCase() + displayRole.slice(1)}
                </Badge>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Full Name
                </Label>
                <Input id="name" value={displayName} disabled />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Email Address
                </Label>
                <Input id="email" value={displayEmail} disabled />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  Department
                </Label>
                <Input id="department" value={displayDepartment} disabled />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  Role
                </Label>
                <Input
                  id="role"
                  value={displayRole.charAt(0).toUpperCase() + displayRole.slice(1)}
                  disabled
                />
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Contact your HR administrator to update your profile information.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
