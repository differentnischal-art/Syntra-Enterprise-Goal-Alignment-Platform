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

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<string>('')
  const [errors, setErrors] = useState<{ email?: string; password?: string; role?: string }>({})
  const [isLoading, setIsLoading] = useState(false)

  const validateForm = () => {
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

    if (!role) {
      newErrors.role = 'Please select a role'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800))

    // Redirect based on role
    if (role === 'admin') {
      router.push('/admin')
    } else if (role === 'manager') {
      router.push('/manager')
    } else {
      router.push('/employee')
    }
  }

  const handleQuickAccess = (selectedRole: 'employee' | 'manager' | 'admin') => {
    if (selectedRole === 'admin') {
      router.push('/admin')
    } else if (selectedRole === 'manager') {
      router.push('/manager')
    } else {
      router.push('/employee')
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
            <div className="w-20" /> {/* Spacer for alignment */}
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

            <div className="space-y-2">
              <Label htmlFor="role" className="text-sm font-medium">Select Role</Label>
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
      </Card>
    </div>
  )
}
