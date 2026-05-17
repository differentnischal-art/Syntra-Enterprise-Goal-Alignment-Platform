'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Layers, UserCircle, Users, Shield, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { signInWithEmail, signUpWithEmail } from '@/lib/data/auth'
import { getCurrentProfile } from '@/lib/data/profiles'
import type { UserRole } from '@/lib/types'

function redirectPathForRole(role: UserRole): string {
  if (role === 'admin') return '/admin'
  if (role === 'manager') return '/manager'
  return '/employee'
}

export default function LoginPage() {
  const router = useRouter()
  const supabaseEnabled = isSupabaseConfigured()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<string>('')
  const [errors, setErrors] = useState<{ email?: string; password?: string; role?: string }>({})
  const [authError, setAuthError] = useState<string | null>(null)
  const [authMessage, setAuthMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSigningUp, setIsSigningUp] = useState(false)

  const validateForm = (requireRole: boolean) => {
    const newErrors: { email?: string; password?: string; role?: string } = {}

    if (!email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (requireRole && !role) {
      newErrors.role = 'Please select a role'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError(null)
    setAuthMessage(null)

    if (supabaseEnabled) {
      if (!validateForm(false)) return

      setIsLoading(true)
      try {
        const result = await signInWithEmail(email, password)

        if (result.error) {
          setAuthError(result.error)
          return
        }

        const profile = await getCurrentProfile()

        if (!profile) {
          setAuthError(
            'Signed in, but no profile was found. Please contact Admin/HR.'
          )
          return
        }

        router.push(redirectPathForRole(profile.role))
      } finally {
        setIsLoading(false)
      }
      return
    }

    if (!validateForm(true)) return

    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 800))
    setIsLoading(false)

    router.push(redirectPathForRole(role as UserRole))
  }

  const handleQuickAccess = (selectedRole: 'employee' | 'manager' | 'admin') => {
    setAuthError(null)
    setAuthMessage(null)
    router.push(redirectPathForRole(selectedRole))
  }

  const handleCreateDemoAccount = async () => {
    setAuthError(null)
    setAuthMessage(null)

    if (!supabaseEnabled) {
      setAuthError('Supabase is not configured. Use Quick Demo Access instead.')
      return
    }

    if (!validateForm(true)) return

    setIsSigningUp(true)
    try {
      const fullName =
        email.split('@')[0]?.replace(/[._]/g, ' ').trim() || 'Demo User'
      const result = await signUpWithEmail(
        email,
        password,
        fullName,
        role as UserRole
      )

      if (result.error) {
        setAuthError(result.error)
        return
      }

      if (result.message) {
        setAuthMessage(result.message)
      }

      if (result.session) {
        const profile = await getCurrentProfile()
        if (profile) {
          router.push(redirectPathForRole(profile.role))
        }
      }
    } finally {
      setIsSigningUp(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4">
      <Card className="w-full max-w-md border border-border/60 shadow-xl">
        <CardHeader className="space-y-4 text-center pb-2">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <div className="w-20" />
          </div>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary shadow-lg">
            <Layers className="h-7 w-7 text-primary-foreground" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-semibold text-foreground">Welcome to AlignOS</CardTitle>
            <CardDescription className="text-muted-foreground">
              Enterprise Goal Lifecycle Suite
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {!supabaseEnabled && (
            <p className="mb-4 rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-center text-xs text-muted-foreground">
              Demo mode: Supabase is not configured, using mock role navigation.
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`h-10 ${errors.email ? 'border-destructive' : ''}`}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`h-10 ${errors.password ? 'border-destructive' : ''}`}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password}</p>
              )}
            </div>

            {!supabaseEnabled && (
              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm font-medium">
                  Select Role
                </Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className={`h-10 ${errors.role ? 'border-destructive' : ''}`}>
                    <SelectValue placeholder="Choose your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Administrator / HR</SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && (
                  <p className="text-xs text-destructive">{errors.role}</p>
                )}
              </div>
            )}

            {authError && (
              <p className="text-xs text-destructive text-center">{authError}</p>
            )}
            {authMessage && (
              <p className="text-xs text-muted-foreground text-center">{authMessage}</p>
            )}

            <Button
              type="submit"
              className="w-full h-10 font-medium"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Having trouble signing in? Contact{' '}
              <a href="mailto:support@alignos.com" className="text-primary hover:underline">
                IT Support
              </a>
            </p>
          </form>
        </CardContent>

        {!supabaseEnabled && (
          <>
            <div className="px-6">
              <Separator />
            </div>

            <CardFooter className="flex flex-col space-y-4 pt-6">
              <p className="text-xs font-medium text-muted-foreground text-center">Quick Demo Access</p>
              <div className="flex w-full gap-2">
                <Button
                  variant="outline"
                  className="flex-1 h-10 gap-2 border-success/30 text-success hover:bg-success/5 hover:text-success hover:border-success/50"
                  onClick={() => handleQuickAccess('employee')}
                >
                  <UserCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Employee</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 h-10 gap-2 border-warning/30 text-warning-foreground hover:bg-warning/5 hover:text-warning-foreground hover:border-warning/50"
                  onClick={() => handleQuickAccess('manager')}
                >
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Manager</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 h-10 gap-2 border-primary/30 text-primary hover:bg-primary/5 hover:text-primary hover:border-primary/50"
                  onClick={() => handleQuickAccess('admin')}
                >
                  <Shield className="h-4 w-4" />
                  <span className="hidden sm:inline">Admin</span>
                </Button>
              </div>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  )
}
