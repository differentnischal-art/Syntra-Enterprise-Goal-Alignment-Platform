'use client'

import {
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Shield,
  UserRound,
  UsersRound,
} from 'lucide-react'

const personas = [
  {
    title: 'Employee',
    subtitle: 'Working on goal sheet',
    icon: UserRound,
    accent: 'emerald',
    items: ['Draft goals', 'Update actuals', 'Submit for approval'],
  },
  {
    title: 'Manager',
    subtitle: 'Reviewing team goals',
    icon: UsersRound,
    accent: 'amber',
    items: ['Review team goals', 'Approve / return', 'Check-in comments'],
  },
  {
    title: 'Admin / HR',
    subtitle: 'Controlling compliance',
    icon: Shield,
    accent: 'indigo',
    items: ['Audit logs', 'Cycle control', 'Reports'],
  },
] as const

const accentStyles = {
  emerald: {
    ring: 'border-emerald-300/30',
    iconWrap: 'bg-emerald-400/12 text-emerald-200',
    dot: 'bg-emerald-300',
    glow: 'from-emerald-400/30 via-emerald-300/10 to-transparent',
  },
  amber: {
    ring: 'border-amber-300/30',
    iconWrap: 'bg-amber-400/12 text-amber-100',
    dot: 'bg-amber-200',
    glow: 'from-amber-300/30 via-amber-200/10 to-transparent',
  },
  indigo: {
    ring: 'border-indigo-300/30',
    iconWrap: 'bg-indigo-400/12 text-indigo-100',
    dot: 'bg-indigo-200',
    glow: 'from-indigo-300/30 via-indigo-200/10 to-transparent',
  },
} as const

export function HeroAnimation() {
  return (
    <div className="relative mx-auto w-full max-w-6xl">
      <div className="relative hidden min-h-[430px] lg:block">
        <div className="landing-hero-orbit absolute left-1/2 top-1/2 h-[320px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
        <div className="landing-hero-orbit landing-hero-orbit-delayed absolute left-1/2 top-1/2 h-[250px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/8" />

        <svg
          aria-hidden="true"
          className="absolute inset-0 h-full w-full"
          fill="none"
          viewBox="0 0 1100 430"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="landing-flow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6ee7b7" />
              <stop offset="50%" stopColor="#fde68a" />
              <stop offset="100%" stopColor="#c7d2fe" />
            </linearGradient>
          </defs>

          <path
            d="M150 214 C290 110 392 110 550 214 C708 318 810 318 950 214"
            stroke="url(#landing-flow-gradient)"
            strokeWidth="2.5"
            strokeDasharray="10 12"
            className="opacity-70"
          />
          <path
            d="M150 214 C290 110 392 110 550 214 C708 318 810 318 950 214"
            stroke="url(#landing-flow-gradient)"
            strokeWidth="6"
            className="landing-flow-trace opacity-20"
          />
          <circle r="7" fill="#6ee7b7" className="landing-flow-dot">
            <animateMotion
              dur="5s"
              repeatCount="indefinite"
              path="M150 214 C290 110 392 110 550 214 C708 318 810 318 950 214"
            />
          </circle>
        </svg>

        <div className="absolute left-1/2 top-1/2 w-[360px] -translate-x-1/2 -translate-y-1/2">
          <div className="landing-command-center relative overflow-hidden rounded-[28px] border border-white/15 bg-white/[0.08] p-5 shadow-2xl shadow-slate-950/40 backdrop-blur-xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.2),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.12),transparent_55%)]" />
            <div className="relative">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-white/45">Live workflow</p>
                  <p className="mt-1 text-lg font-semibold text-white">Goal lifecycle</p>
                </div>
                <div className="rounded-full border border-emerald-200/25 bg-emerald-300/10 px-3 py-1 text-xs font-medium text-emerald-100">
                  Audit ready
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { icon: FileText, label: 'Goal sheet drafted', value: 'Employee' },
                  { icon: ClipboardCheck, label: 'Approval queue', value: 'Manager' },
                  { icon: BarChart3, label: 'Compliance report', value: 'Admin / HR' },
                ].map((item, index) => (
                  <div
                    key={item.label}
                    className="landing-status-row flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3"
                    style={{ animationDelay: `${index * 180}ms` }}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white">{item.label}</p>
                      <p className="text-xs text-white/50">{item.value}</p>
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-emerald-200" />
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/20 p-4">
                <div className="mb-2 flex items-center justify-between text-xs text-white/55">
                  <span>Progress across roles</span>
                  <span>82%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="landing-progress-bar h-full rounded-full bg-gradient-to-r from-emerald-300 via-amber-200 to-indigo-200" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {personas.map((persona, index) => {
          const Icon = persona.icon
          const style = accentStyles[persona.accent]
          const positions = [
            'left-0 top-10',
            'left-1/2 top-0 -translate-x-1/2',
            'right-0 top-10',
          ]

          return (
            <div
              key={persona.title}
              className={`landing-floating-card absolute ${positions[index]} w-[240px]`}
              style={{ animationDelay: `${index * 350}ms` }}
            >
              <div className={`absolute -inset-8 rounded-full bg-gradient-to-br ${style.glow} blur-3xl`} />
              <div className={`relative rounded-[24px] border ${style.ring} bg-white/[0.08] p-5 shadow-2xl shadow-slate-950/30 backdrop-blur-xl`}>
                <div className="mb-4 flex items-center gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${style.iconWrap}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{persona.title}</p>
                    <p className="text-xs text-white/55">{persona.subtitle}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {persona.items.map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-2xl border border-white/8 bg-slate-950/15 px-3 py-2.5 text-sm text-white/85"
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid gap-4 lg:hidden">
        {personas.map((persona, index) => {
          const Icon = persona.icon
          const style = accentStyles[persona.accent]

          return (
            <div
              key={persona.title}
              className="landing-floating-card relative overflow-hidden rounded-[24px] border border-white/15 bg-white/[0.08] p-5 shadow-xl shadow-slate-950/25 backdrop-blur-xl"
              style={{ animationDelay: `${index * 220}ms` }}
            >
              <div className={`absolute -right-12 -top-12 h-28 w-28 rounded-full bg-gradient-to-br ${style.glow} blur-2xl`} />
              <div className="relative">
                <div className="mb-4 flex items-center gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${style.iconWrap}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{persona.title}</p>
                    <p className="text-xs text-white/55">{persona.subtitle}</p>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-3">
                  {persona.items.map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2 rounded-2xl border border-white/8 bg-slate-950/15 px-3 py-2.5 text-sm text-white/85"
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}

        <div className="relative overflow-hidden rounded-[24px] border border-white/15 bg-white/[0.08] p-5 shadow-xl shadow-slate-950/25 backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between text-sm text-white/65">
            <span>Employee → Manager → Admin</span>
            <span>82%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className="landing-progress-bar h-full rounded-full bg-gradient-to-r from-emerald-300 via-amber-200 to-indigo-200" />
          </div>
        </div>
      </div>
    </div>
  )
}
