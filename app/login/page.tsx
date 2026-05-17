'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Layers,
  Shield,
  UserCircle,
  Users,
} from 'lucide-react'
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
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="login-grid absolute inset-0 opacity-70" />
        <div className="login-radial absolute inset-0" />
        <div className="login-blob login-blob-one absolute -left-24 top-10 h-80 w-80 rounded-full bg-primary/30 blur-3xl" />
        <div className="login-blob login-blob-two absolute right-[-6rem] top-0 h-[28rem] w-[28rem] rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="login-blob login-blob-three absolute bottom-[-10rem] left-1/3 h-[24rem] w-[24rem] rounded-full bg-indigo-400/20 blur-3xl" />
      </div>

      <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.82fr)] lg:gap-12 lg:px-8">
        <section className="order-2 lg:order-1">
          <div className="mx-auto max-w-2xl lg:mx-0">
            <div className="mb-8">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/80 backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_16px_rgba(167,139,250,0.95)]" />
                Role-based workflow control
              </div>
              <h1 className="max-w-2xl text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Sign in to keep employee goals, approvals, and compliance moving together.
              </h1>
              <p className="mt-5 max-w-xl text-pretty text-sm leading-7 text-white/62 sm:text-base">
                AlignOS gives every role a clear handoff: employees draft goals, managers review submissions,
                and Admin / HR keeps audit logs and cycle control visible.
              </p>
            </div>

            <div className="relative hidden min-h-[360px] lg:block">
              <svg
                aria-hidden="true"
                className="absolute inset-0 h-full w-full"
                fill="none"
                viewBox="0 0 720 360"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="login-flow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#c4b5fd" />
                    <stop offset="50%" stopColor="#e9d5ff" />
                    <stop offset="100%" stopColor="#ddd6fe" />
                  </linearGradient>
                </defs>
                <path
                  d="M86 210 C190 124 265 124 360 180 C455 236 530 236 634 150"
                  stroke="url(#login-flow-gradient)"
                  strokeWidth="2"
                  strokeDasharray="8 10"
                  className="opacity-60"
                />
                <path
                  d="M86 210 C190 124 265 124 360 180 C455 236 530 236 634 150"
                  stroke="url(#login-flow-gradient)"
                  strokeWidth="6"
                  className="login-flow-trace opacity-20"
                />
                <circle r="7" fill="#ddd6fe" className="login-flow-dot">
                  <animateMotion
                    dur="5s"
                    repeatCount="indefinite"
                    path="M86 210 C190 124 265 124 360 180 C455 236 530 236 634 150"
                  />
                </circle>
              </svg>

              <div className="login-visual-card login-visual-card-one absolute left-0 top-20 w-[230px] rounded-[24px] border border-white/15 bg-white/[0.08] p-5 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/20 text-primary-foreground">
                    <UserCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">Employee</p>
                    <p className="text-xs text-white/55">Creating goal sheet</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {['Draft goals', 'Update actuals', 'Submit for approval'].map((item) => (
                    <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/15 px-3 py-2.5 text-sm text-white/82">
                      <span className="h-1.5 w-1.5 rounded-full bg-violet-200" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="login-visual-card login-visual-card-two absolute left-[235px] top-0 w-[230px] rounded-[24px] border border-white/15 bg-white/[0.08] p-5 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-fuchsia-300/15 text-fuchsia-100">
                    <ClipboardCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">Manager</p>
                    <p className="text-xs text-white/55">Reviewing approval</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {['Review team goals', 'Approve / return', 'Check-in comments'].map((item) => (
                    <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/15 px-3 py-2.5 text-sm text-white/82">
                      <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-200" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="login-visual-card login-visual-card-three absolute right-0 top-16 w-[230px] rounded-[24px] border border-white/15 bg-white/[0.08] p-5 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-300/15 text-indigo-100">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">Admin / HR</p>
                    <p className="text-xs text-white/55">Audit & compliance</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {['Audit logs', 'Cycle control', 'Reports'].map((item) => (
                    <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/15 px-3 py-2.5 text-sm text-white/82">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-200" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="absolute bottom-0 left-24 right-20 rounded-[28px] border border-white/15 bg-white/[0.08] p-5 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-white/45">Workflow status</p>
                    <p className="mt-1 text-lg font-semibold text-white">Audit-ready handoff</p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-violet-200" />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { icon: FileText, label: 'Goal sheet', value: 'Drafted' },
                    { icon: ClipboardCheck, label: 'Approval', value: 'In review' },
                    { icon: BarChart3, label: 'Compliance', value: 'Tracked' },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-white/10 bg-slate-950/15 p-3">
                      <item.icon className="mb-3 h-4 w-4 text-violet-100" />
                      <p className="text-xs text-white/45">{item.label}</p>
                      <p className="mt-1 text-sm font-medium text-white">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-3 lg:hidden">
              {[
                { icon: UserCircle, title: 'Employee', detail: 'Draft goals' },
                { icon: ClipboardCheck, title: 'Manager', detail: 'Review approval' },
                { icon: Shield, title: 'Admin / HR', detail: 'Audit logs' },
              ].map((item) => (
                <div key={item.title} className="rounded-[22px] border border-white/15 bg-white/[0.08] p-4 backdrop-blur-xl">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                      <item.icon className="h-4 w-4 text-violet-100" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{item.title}</p>
                      <p className="text-sm text-white/55">{item.detail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="order-1 lg:order-2">
          <Card className="mx-auto w-full max-w-md border border-white/15 bg-white/[0.1] text-white shadow-2xl shadow-slate-950/35 backdrop-blur-2xl">
            <CardHeader className="space-y-4 pb-2 text-center">
              <div className="flex items-center justify-between">
                <Link href="/">
                  <Button variant="ghost" size="sm" className="gap-2 text-white/65 hover:bg-white/10 hover:text-white">
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                </Link>
                <div className="w-20" />
              </div>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30">
                <Layers className="h-7 w-7 text-primary-foreground" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-2xl font-semibold text-white">Welcome to AlignOS</CardTitle>
                <CardDescription className="text-white/60">
                  Enterprise Goal Lifecycle Suite
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {!supabaseEnabled && (
                <p className="mb-4 rounded-2xl border border-white/10 bg-white/[0.08] px-3 py-2 text-center text-xs text-white/62">
                  Demo mode: Supabase is not configured, using mock role navigation.
                </p>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-white/85">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`h-11 border-white/15 bg-white/[0.06] text-white placeholder:text-white/35 ${errors.email ? 'border-destructive' : ''}`}
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-white/85">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`h-11 border-white/15 bg-white/[0.06] text-white placeholder:text-white/35 ${errors.password ? 'border-destructive' : ''}`}
                  />
                  {errors.password && (
                    <p className="text-xs text-destructive">{errors.password}</p>
                  )}
                </div>

                {!supabaseEnabled && (
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-sm font-medium text-white/85">
                      Select Role
                    </Label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger className={`h-11 border-white/15 bg-white/[0.06] text-white ${errors.role ? 'border-destructive' : ''}`}>
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
                  <p className="text-center text-xs text-destructive">{authError}</p>
                )}
                {authMessage && (
                  <p className="text-center text-xs text-white/62">{authMessage}</p>
                )}

                <Button
                  type="submit"
                  className="h-11 w-full bg-primary font-medium shadow-lg shadow-primary/25 hover:bg-primary/90"
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>

                <p className="text-center text-xs text-white/58">
                  Having trouble signing in? Contact{' '}
                  <a href="mailto:support@alignos.com" className="text-violet-200 hover:text-white hover:underline">
                    IT Support
                  </a>
                </p>
              </form>
            </CardContent>

            {!supabaseEnabled && (
              <>
                <div className="px-6">
                  <Separator className="bg-white/10" />
                </div>

                <CardFooter className="flex flex-col space-y-4 pt-6">
                  <p className="text-center text-xs font-medium text-white/55">Quick Demo Access</p>
                  <div className="flex w-full gap-2">
                    <Button
                      variant="outline"
                      className="h-10 flex-1 gap-2 border-success/30 bg-white/[0.04] text-success hover:border-success/50 hover:bg-success/5 hover:text-success"
                      onClick={() => handleQuickAccess('employee')}
                    >
                      <UserCircle className="h-4 w-4" />
                      <span className="hidden sm:inline">Employee</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-10 flex-1 gap-2 border-warning/30 bg-white/[0.04] text-warning-foreground hover:border-warning/50 hover:bg-warning/5 hover:text-warning-foreground"
                      onClick={() => handleQuickAccess('manager')}
                    >
                      <Users className="h-4 w-4" />
                      <span className="hidden sm:inline">Manager</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-10 flex-1 gap-2 border-primary/30 bg-white/[0.04] text-violet-100 hover:border-primary/50 hover:bg-primary/10 hover:text-white"
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
      </div>
    </div>
  )
}
