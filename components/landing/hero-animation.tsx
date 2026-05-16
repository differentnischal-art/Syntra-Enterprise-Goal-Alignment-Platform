'use client'

import { User, Users, Shield, Check, FileText, MessageSquare, BarChart3, ClipboardCheck } from 'lucide-react'

export function HeroAnimation() {
  return (
    <div className="relative w-full max-w-4xl mx-auto h-[320px] md:h-[380px]">
      {/* Connecting Lines with Animated Dots */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 380" fill="none" preserveAspectRatio="xMidYMid meet">
        {/* Line from Employee to Manager */}
        <path
          d="M200 190 Q300 190 400 190"
          stroke="url(#gradient1)"
          strokeWidth="2"
          strokeDasharray="6 4"
          className="opacity-40"
        />
        {/* Line from Manager to Admin */}
        <path
          d="M400 190 Q500 190 600 190"
          stroke="url(#gradient2)"
          strokeWidth="2"
          strokeDasharray="6 4"
          className="opacity-40"
        />
        
        {/* Animated Dots */}
        <circle r="4" fill="url(#dotGradient1)" className="animate-[moveRight_3s_ease-in-out_infinite]">
          <animateMotion dur="3s" repeatCount="indefinite" path="M200 190 Q300 190 400 190" />
        </circle>
        <circle r="4" fill="url(#dotGradient2)" className="animate-[moveRight_3s_ease-in-out_infinite_1.5s]">
          <animateMotion dur="3s" repeatCount="indefinite" path="M400 190 Q500 190 600 190" />
        </circle>
        
        <defs>
          <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
          <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>
          <linearGradient id="dotGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
          <linearGradient id="dotGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
      </svg>

      {/* Workflow Cards */}
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 h-full px-4">
        {/* Employee Card */}
        <div className="group relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative bg-card border border-success/20 rounded-xl p-5 w-[200px] shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <User className="h-5 w-5 text-success" />
              </div>
              <span className="font-semibold text-foreground">Employee</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Creates goal sheet</p>
            
            {/* Mini Goal Cards */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 bg-success/5 rounded-lg px-3 py-2 animate-[fadeInUp_0.5s_ease-out]">
                <FileText className="h-3.5 w-3.5 text-success" />
                <span className="text-xs text-muted-foreground">Q1 Goals</span>
                <span className="ml-auto text-xs font-medium text-success">100%</span>
              </div>
              <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 animate-[fadeInUp_0.5s_ease-out_0.1s_both]">
                <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Weightage</span>
              </div>
            </div>
            
            {/* Floating Badge */}
            <div className="absolute -top-2 -right-2 animate-[pulse_2s_ease-in-out_infinite]">
              <div className="bg-success text-success-foreground text-[10px] font-medium px-2 py-0.5 rounded-full shadow-sm">
                Active
              </div>
            </div>
          </div>
        </div>

        {/* Arrow Indicator - Mobile */}
        <div className="flex md:hidden items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center animate-bounce">
            <svg className="w-4 h-4 text-muted-foreground rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
        </div>

        {/* Manager Card */}
        <div className="group relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative bg-card border border-warning/20 rounded-xl p-5 w-[200px] shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <Users className="h-5 w-5 text-warning-foreground" />
              </div>
              <span className="font-semibold text-foreground">Manager</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Reviews and approves</p>
            
            {/* Approval Visual */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 bg-warning/5 rounded-lg px-3 py-2 animate-[fadeInUp_0.5s_ease-out_0.2s_both]">
                <ClipboardCheck className="h-3.5 w-3.5 text-warning-foreground" />
                <span className="text-xs text-muted-foreground">Approval</span>
                <Check className="ml-auto h-3.5 w-3.5 text-success" />
              </div>
              <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 animate-[fadeInUp_0.5s_ease-out_0.3s_both]">
                <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Feedback</span>
              </div>
            </div>
            
            {/* Floating Badge */}
            <div className="absolute -top-2 -right-2 animate-[pulse_2s_ease-in-out_infinite_0.5s]">
              <div className="bg-warning text-warning-foreground text-[10px] font-medium px-2 py-0.5 rounded-full shadow-sm">
                Review
              </div>
            </div>
          </div>
        </div>

        {/* Arrow Indicator - Mobile */}
        <div className="flex md:hidden items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center animate-bounce">
            <svg className="w-4 h-4 text-muted-foreground rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
        </div>

        {/* Admin/HR Card */}
        <div className="group relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative bg-card border border-primary/20 rounded-xl p-5 w-[200px] shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <span className="font-semibold text-foreground">Admin / HR</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Tracks audit & compliance</p>
            
            {/* Audit Visual */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 bg-primary/5 rounded-lg px-3 py-2 animate-[fadeInUp_0.5s_ease-out_0.4s_both]">
                <Shield className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs text-muted-foreground">Audit Log</span>
              </div>
              <div className="relative overflow-hidden bg-muted/50 rounded-lg px-3 py-2 animate-[fadeInUp_0.5s_ease-out_0.5s_both]">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Reports</span>
                </div>
                {/* Progress Bar */}
                <div className="mt-1.5 h-1 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full animate-[progressFill_2s_ease-out_infinite]" style={{ width: '75%' }} />
                </div>
              </div>
            </div>
            
            {/* Floating Badge */}
            <div className="absolute -top-2 -right-2 animate-[pulse_2s_ease-in-out_infinite_1s]">
              <div className="bg-primary text-primary-foreground text-[10px] font-medium px-2 py-0.5 rounded-full shadow-sm">
                Govern
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Keyframe Styles */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes progressFill {
          0%, 100% {
            width: 60%;
          }
          50% {
            width: 85%;
          }
        }
      `}</style>
    </div>
  )
}
