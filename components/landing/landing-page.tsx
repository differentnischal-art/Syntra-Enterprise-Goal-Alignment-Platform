'use client'

import Link from 'next/link'
import { 
  Layers, 
  User, 
  Users, 
  Shield, 
  ArrowRight,
  Eye,
  FileWarning,
  HelpCircle,
  Calendar,
  Target,
  Scale,
  Share2,
  CalendarCheck,
  ClipboardCheck,
  FileText,
  Download,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { HeroAnimation } from './hero-animation'
import { isSupabaseConfigured } from '@/lib/supabase/env'

export function LandingPage() {
  const showDemoAccess = !isSupabaseConfigured()
  const lifecycleSteps = [
    { title: 'Goal Creation', icon: Target },
    { title: 'Manager Approval', icon: ClipboardCheck },
    { title: 'Goal Locking', icon: Shield },
    { title: 'Quarterly Check-ins', icon: CalendarCheck },
    { title: 'Reports & Audit Trail', icon: FileText },
  ]

  const features = [
    { title: 'Weightage Validation', icon: Scale, description: 'Ensure goals add up to 100%' },
    { title: 'Shared Departmental KPIs', icon: Share2, description: 'Align team objectives' },
    { title: 'Quarterly Check-ins', icon: CalendarCheck, description: 'Track progress regularly' },
    { title: 'Manager Approval Workspace', icon: ClipboardCheck, description: 'Streamlined review process' },
    { title: 'Audit Trail', icon: FileText, description: 'Complete activity history' },
    { title: 'Reports & Export', icon: Download, description: 'Generate compliance reports' },
    { title: 'Escalation Monitoring', icon: AlertTriangle, description: 'Track overdue approvals' },
    { title: 'Admin Compliance Dashboard', icon: BarChart3, description: 'Organization-wide visibility' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50/30">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 text-white backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-950 shadow-sm">
                <Layers className="h-5 w-5 text-slate-950" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-white">AlignOS</span>
                <span className="text-[10px] leading-none text-white/55">Enterprise Goal Suite</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href={showDemoAccess ? '#demo' : '#lifecycle'}>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 hover:text-white">
                  {showDemoAccess ? 'View Demo' : 'View Workflows'}
                </Button>
              </Link>
              <Link href="/login">
                <Button size="sm" className="bg-white text-slate-950 hover:bg-white/90">Sign In</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-950 pt-16 pb-20 text-white md:pt-24 md:pb-28">
        {/* Background Decorations */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="landing-grid absolute inset-0 opacity-70" />
          <div className="landing-hero-radial absolute inset-0" />
          <div className="landing-hero-blob landing-hero-blob-one absolute -left-24 top-10 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="landing-hero-blob landing-hero-blob-two absolute right-[-5rem] top-6 h-[26rem] w-[26rem] rounded-full bg-indigo-500/25 blur-3xl" />
          <div className="landing-hero-blob landing-hero-blob-three absolute bottom-[-10rem] left-1/3 h-[24rem] w-[24rem] rounded-full bg-emerald-400/15 blur-3xl" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />
        </div>

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] lg:gap-8 lg:px-8">
          <div className="text-center lg:text-left">
            <Badge variant="outline" className="mb-6 border-white/15 bg-white/10 px-4 py-1.5 text-sm font-normal text-white/85">
              Enterprise Goal Lifecycle Suite
            </Badge>
            
            <h1 className="mx-auto max-w-4xl text-balance text-4xl font-bold tracking-tight text-white sm:text-5xl lg:mx-0 lg:text-6xl">
              Align goals, approvals, check-ins, and performance visibility in one place
            </h1>
            
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-white/68 lg:mx-0">
              A role-based goal setting and tracking portal for employees, managers, and HR teams to manage the full goal lifecycle from creation to quarterly check-ins and audit-ready reporting.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
              <Link href={showDemoAccess ? '#demo' : '/login'}>
                <Button size="lg" className="gap-2 bg-white px-8 text-slate-950 shadow-lg shadow-white/10 hover:bg-white/90">
                  {showDemoAccess ? 'Open Demo' : 'Sign In'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="#lifecycle">
                <Button variant="outline" size="lg" className="gap-2 border-white/20 bg-white/5 px-8 text-white hover:bg-white/10 hover:text-white">
                  View Workflows
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Hero Animation */}
          <div className="mt-14 lg:mt-0">
            <HeroAnimation />
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Why this portal matters</h2>
            <p className="mt-4 text-lg text-muted-foreground">Common challenges in traditional goal management</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: FileWarning, title: 'Spreadsheets create blind spots', description: 'Scattered data leads to missed goals and misalignment' },
              { icon: Eye, title: 'Managers lack real-time visibility', description: 'No unified view of team progress and performance' },
              { icon: HelpCircle, title: 'Employees lack goal clarity', description: 'Unclear expectations and disconnected objectives' },
              { icon: Calendar, title: 'HR struggles during appraisal cycles', description: 'Manual tracking creates compliance risks' },
            ].map((problem, index) => (
              <Card key={index} className="border-border/50 bg-card hover:shadow-md transition-shadow duration-300">
                <CardHeader className="pb-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-destructive/10 mb-3">
                    <problem.icon className="h-5 w-5 text-destructive" />
                  </div>
                  <CardTitle className="text-base">{problem.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">{problem.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Role-Based Workflow Section */}
      <section className="py-20 bg-slate-50/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Role-Based Workflows</h2>
            <p className="mt-4 text-lg text-muted-foreground">Tailored experiences for every stakeholder</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Employee */}
            <Card className="border-success/20 bg-gradient-to-br from-card to-success/5 hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10 mb-4">
                  <User className="h-6 w-6 text-success" />
                </div>
                <CardTitle className="text-xl">Employee</CardTitle>
                <CardDescription>Own your goals and track achievement</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {['Creates goals with weightage', 'Submits goal sheet for approval', 'Updates quarterly achievement', 'Views shared departmental KPIs'].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Manager */}
            <Card className="border-warning/20 bg-gradient-to-br from-card to-warning/5 hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10 mb-4">
                  <Users className="h-6 w-6 text-warning-foreground" />
                </div>
                <CardTitle className="text-xl">Manager</CardTitle>
                <CardDescription>Guide and approve team goals</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {['Reviews team goal submissions', 'Approves or returns with feedback', 'Adds check-in comments', 'Monitors team performance'].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-warning-foreground mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Admin/HR */}
            <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5 hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Admin / HR</CardTitle>
                <CardDescription>Govern and ensure compliance</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {['Manages goal cycles and periods', 'Configures shared goals', 'Monitors audit logs', 'Generates compliance reports'].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Lifecycle Section */}
      <section id="lifecycle" className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Goal Lifecycle</h2>
            <p className="mt-4 text-lg text-muted-foreground">End-to-end workflow from creation to reporting</p>
          </div>

          {/* Desktop Stepper */}
          <div className="hidden lg:block">
            <div className="relative">
              {/* Progress Line */}
              <div className="absolute top-8 left-0 right-0 h-0.5 bg-border" />
              <div className="absolute top-8 left-0 h-0.5 bg-primary w-full animate-[progressLine_4s_ease-out_forwards]" style={{ maxWidth: '100%' }} />

              <div className="relative flex justify-between">
                {lifecycleSteps.map((step, index) => (
                  <div key={index} className="flex flex-col items-center" style={{ animationDelay: `${index * 0.2}s` }}>
                    <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary bg-card shadow-md">
                      <step.icon className="h-7 w-7 text-primary" />
                    </div>
                    <span className="mt-4 text-sm font-medium text-foreground text-center max-w-[120px]">{step.title}</span>
                    {index < lifecycleSteps.length - 1 && (
                      <div className="absolute top-8 left-[calc(50%+32px)] w-[calc(100%-64px)] flex items-center justify-center">
                        <ChevronRight className="h-5 w-5 text-primary/40" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile Stepper */}
          <div className="lg:hidden">
            <div className="relative pl-8">
              <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-primary/20" />
              <div className="space-y-6">
                {lifecycleSteps.map((step, index) => (
                  <div key={index} className="relative flex items-center gap-4">
                    <div className="absolute -left-5 flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary bg-card shadow-sm">
                      <step.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="ml-8">
                      <span className="text-sm font-medium text-foreground">{step.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-50/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Feature Highlights</h2>
            <p className="mt-4 text-lg text-muted-foreground">Everything you need for enterprise goal management</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-border/50 bg-card hover:shadow-md hover:border-primary/20 transition-all duration-300 group">
                <CardContent className="pt-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 mb-4 group-hover:bg-primary/15 transition-colors">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {showDemoAccess && (
        <section id="demo" className="py-20 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Demo Access</h2>
              <p className="mt-4 text-lg text-muted-foreground">Explore the portal from each role&apos;s perspective</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {/* Employee Demo */}
              <Card className="border-success/20 bg-gradient-to-br from-card to-success/5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="pt-8 pb-6 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10 mx-auto mb-5">
                    <User className="h-8 w-8 text-success" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Employee Demo</h3>
                  <p className="text-sm text-muted-foreground mb-6">Create goals and track progress</p>
                  <Link href="/employee">
                    <Button className="w-full bg-success hover:bg-success/90 text-success-foreground">
                      Enter as Employee
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Manager Demo */}
              <Card className="border-warning/20 bg-gradient-to-br from-card to-warning/5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="pt-8 pb-6 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-warning/10 mx-auto mb-5">
                    <Users className="h-8 w-8 text-warning-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Manager Demo</h3>
                  <p className="text-sm text-muted-foreground mb-6">Review and approve team goals</p>
                  <Link href="/manager">
                    <Button className="w-full bg-warning hover:bg-warning/90 text-warning-foreground">
                      Enter as Manager
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Admin Demo */}
              <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="pt-8 pb-6 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mx-auto mb-5">
                    <Shield className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Admin / HR Demo</h3>
                  <p className="text-sm text-muted-foreground mb-6">Manage cycles and compliance</p>
                  <Link href="/admin">
                    <Button className="w-full">
                      Enter as Admin
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-border/40 bg-slate-50/50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Layers className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">AlignOS</span>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm text-muted-foreground">Built for AtomQuest Hackathon 1.0</p>
              <p className="text-xs text-muted-foreground">In-House Goal Setting & Tracking Portal</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
