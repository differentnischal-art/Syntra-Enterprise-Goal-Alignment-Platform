import Link from 'next/link'
import { 
  Layers,
  User, 
  Users, 
  Shield, 
  ArrowRight,
  Target,
  Scale,
  ClipboardCheck,
  Lock,
  Calendar,
  MessageSquare,
  BarChart3,
  CheckCircle2,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function DemoGuidePage() {
  const workflowSteps = [
    {
      step: 1,
      title: 'Employee creates goal sheet',
      description: 'Employee drafts goals with title, thrust area, target, and weightage (min 10% each, total 100%)',
      icon: Target,
      color: 'bg-success/10 text-success border-success/20',
    },
    {
      step: 2,
      title: 'System validates weightage rules',
      description: 'Real-time validation ensures max 8 goals, min 10% per goal, and total equals 100%',
      icon: Scale,
      color: 'bg-primary/10 text-primary border-primary/20',
    },
    {
      step: 3,
      title: 'Manager reviews full goal sheet',
      description: 'Manager sees all employee goals, can adjust targets/weightage, and adds comments',
      icon: ClipboardCheck,
      color: 'bg-warning/10 text-warning-foreground border-warning/20',
    },
    {
      step: 4,
      title: 'Manager approves or returns',
      description: 'Manager either approves (locks goals) or returns for rework with mandatory feedback',
      icon: CheckCircle2,
      color: 'bg-success/10 text-success border-success/20',
    },
    {
      step: 5,
      title: 'Approved goals become locked',
      description: 'Once approved, goals are locked for the cycle and cannot be edited without Admin intervention',
      icon: Lock,
      color: 'bg-slate-100 text-slate-600 border-slate-200',
    },
    {
      step: 6,
      title: 'Employee submits quarterly check-in',
      description: 'During Q1/Q2/Q3/Q4 windows, employee updates actual achievement vs planned target',
      icon: Calendar,
      color: 'bg-primary/10 text-primary border-primary/20',
    },
    {
      step: 7,
      title: 'Manager adds check-in comments',
      description: 'Manager reviews planned vs actual, adds structured comments (coaching, appreciation, etc.)',
      icon: MessageSquare,
      color: 'bg-warning/10 text-warning-foreground border-warning/20',
    },
    {
      step: 8,
      title: 'Admin tracks compliance and reports',
      description: 'HR monitors audit logs, escalations, shared goals, completion heatmaps, and exports reports',
      icon: BarChart3,
      color: 'bg-primary/10 text-primary border-primary/20',
    },
  ]

  const quickLinks = [
    { label: 'Start as Employee', href: '/employee', icon: User, color: 'bg-success hover:bg-success/90 text-success-foreground' },
    { label: 'Open Manager Approval', href: '/manager/approvals', icon: ClipboardCheck, color: 'bg-warning hover:bg-warning/90 text-warning-foreground' },
    { label: 'Open Admin Dashboard', href: '/admin', icon: Shield, color: 'bg-primary hover:bg-primary/90' },
    { label: 'View Reports', href: '/admin/reports-export', icon: BarChart3, color: 'bg-primary hover:bg-primary/90' },
    { label: 'View Escalations', href: '/admin/escalations', icon: Target, color: 'bg-destructive hover:bg-destructive/90' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50/30">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary shadow-sm">
                <Layers className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-foreground">AlignOS</span>
                <span className="text-[10px] text-muted-foreground leading-none">Demo Guide</span>
              </div>
            </Link>
            <Link href="/">
              <Button variant="outline" size="sm">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm font-normal border-primary/20 bg-primary/5 text-primary">
            AtomQuest Hackathon 1.0
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl text-balance">
            Demo Guide
          </h1>
          <p className="mt-4 text-xl text-primary font-medium">
            Goal Lifecycle Walkthrough
          </p>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Follow the complete journey of a goal from creation to quarterly check-ins and compliance reporting.
          </p>
        </div>
      </section>

      {/* Workflow Steps */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border hidden sm:block" />

            <div className="space-y-6">
              {workflowSteps.map((item, index) => (
                <div key={item.step} className="relative flex gap-6">
                  {/* Step Number */}
                  <div className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 bg-background ${item.color}`}>
                    <item.icon className="h-5 w-5" />
                  </div>

                  {/* Content */}
                  <Card className="flex-1 border-border/60 hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs">Step {item.step}</Badge>
                        <CardTitle className="text-base">{item.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-sm">{item.description}</CardDescription>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-foreground">Quick Links</h2>
            <p className="mt-2 text-muted-foreground">Jump directly into any role or feature</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quickLinks.map((link) => (
              <Link key={link.label} href={link.href}>
                <Button className={`w-full h-auto py-4 ${link.color}`}>
                  <link.icon className="mr-3 h-5 w-5" />
                  {link.label}
                  <ArrowRight className="ml-auto h-4 w-4" />
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Key Features Summary */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-50/50">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-foreground">Key Features Demonstrated</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              'Role-based dashboards (Employee, Manager, Admin)',
              'Goal sheet creation with weightage validation',
              'Manager approval workflow with lock mechanism',
              'Quarterly check-in with planned vs actual tracking',
              'Shared departmental goals with synced achievement',
              'Complete audit trail with before/after values',
              'Escalation monitoring and compliance alerts',
              'CSV export for reports and audit logs',
            ].map((feature, index) => (
              <div key={index} className="flex items-start gap-3 p-4 rounded-lg border border-border bg-background">
                <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-white py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-muted-foreground">
            Built for AtomQuest Hackathon 1.0 | In-House Goal Setting & Tracking Portal
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            This demo uses frontend-only mock data to simulate the complete workflow.
          </p>
        </div>
      </footer>
    </div>
  )
}
