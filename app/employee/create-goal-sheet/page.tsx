'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { mockGoalCycle, thrustAreas } from '@/lib/mock-data'
import { UnitOfMeasurement } from '@/lib/types'
import { 
  Plus, 
  Trash2, 
  Save, 
  Send, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  User,
  ChevronRight,
  Info,
} from 'lucide-react'

interface DraftGoal {
  id: string
  title: string
  description: string
  thrustArea: string
  unitOfMeasurement: UnitOfMeasurement
  target: string
  weightage: string
}

const emptyGoal: () => DraftGoal = () => ({
  id: `draft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  title: '',
  description: '',
  thrustArea: '',
  unitOfMeasurement: 'numeric-higher-better',
  target: '',
  weightage: '',
})

const steps = [
  { id: 1, name: 'Draft Goals', description: 'Create your goals' },
  { id: 2, name: 'Validate Weightage', description: 'Ensure 100% total' },
  { id: 3, name: 'Submit for Approval', description: 'Send to manager' },
  { id: 4, name: 'Manager Review', description: 'Await approval' },
]

const uomOptions = [
  { value: 'numeric-higher-better', label: 'Numeric - Higher is Better' },
  { value: 'numeric-lower-better', label: 'Numeric - Lower is Better' },
  { value: 'percentage', label: 'Percentage' },
  { value: 'timeline', label: 'Timeline' },
  { value: 'zero-based', label: 'Zero Based' },
]

export default function CreateGoalSheetPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [goals, setGoals] = useState<DraftGoal[]>([emptyGoal()])

  const totalWeightage = goals.reduce((sum, g) => sum + (parseInt(g.weightage) || 0), 0)
  const goalsCount = goals.filter(g => g.title.trim()).length

  const validationErrors = {
    weightageNot100: totalWeightage !== 100 && goalsCount > 0,
    maxGoalsExceeded: goals.length > 8,
    minWeightageBreach: goals.some(g => parseInt(g.weightage) > 0 && parseInt(g.weightage) < 10),
    incompleteGoals: goals.some(g => g.title.trim() && (!g.thrustArea || !g.target || !g.weightage)),
  }

  const isValid = !validationErrors.weightageNot100 && 
                  !validationErrors.maxGoalsExceeded && 
                  !validationErrors.minWeightageBreach &&
                  !validationErrors.incompleteGoals &&
                  goalsCount >= 1

  const addGoal = () => {
    if (goals.length < 8) {
      setGoals([...goals, emptyGoal()])
    }
  }

  const removeGoal = (id: string) => {
    if (goals.length > 1) {
      setGoals(goals.filter(g => g.id !== id))
    }
  }

  const updateGoal = (id: string, field: keyof DraftGoal, value: string) => {
    setGoals(goals.map(g => g.id === id ? { ...g, [field]: value } : g))
  }

  return (
    <DashboardLayout role="employee">
      <DashboardHeader
        title="Create Goal Sheet"
        subtitle={mockGoalCycle.name}
      />

      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-warning/10 text-warning-foreground border-warning/20">
                Draft
              </Badge>
              <span className="text-sm text-muted-foreground">Cycle: {mockGoalCycle.name}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Manager: <span className="font-medium text-foreground">Rohan Mehta</span>
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Save className="mr-2 h-4 w-4" />
              Save Draft
            </Button>
            <Button disabled={!isValid}>
              <Send className="mr-2 h-4 w-4" />
              Submit for Approval
            </Button>
          </div>
        </div>

        {/* Stepper */}
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className="flex items-center gap-3">
                    <div className={`
                      flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium
                      ${step.id < currentStep 
                        ? 'bg-success text-success-foreground' 
                        : step.id === currentStep 
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'}
                    `}>
                      {step.id < currentStep ? <CheckCircle2 className="h-4 w-4" /> : step.id}
                    </div>
                    <div className="hidden sm:block">
                      <p className={`text-sm font-medium ${step.id === currentStep ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {step.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <ChevronRight className="h-4 w-4 text-muted-foreground mx-4 hidden sm:block" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Validation Panel */}
        <Card className={`border-border/60 ${isValid ? 'border-success/50 bg-success/5' : ''}`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              {isValid ? (
                <CheckCircle2 className="h-5 w-5 text-success" />
              ) : (
                <AlertCircle className="h-5 w-5 text-warning-foreground" />
              )}
              Validation Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center gap-3">
                <div className={`
                  flex h-10 w-10 items-center justify-center rounded-lg
                  ${totalWeightage === 100 ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning-foreground'}
                `}>
                  <span className="text-sm font-semibold">{totalWeightage}%</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Total Weightage</p>
                  <p className="text-xs text-muted-foreground">Must equal 100%</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className={`
                  flex h-10 w-10 items-center justify-center rounded-lg
                  ${goalsCount >= 1 && goalsCount <= 8 ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning-foreground'}
                `}>
                  <span className="text-sm font-semibold">{goalsCount}/8</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Goals Count</p>
                  <p className="text-xs text-muted-foreground">Max 8 goals</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className={`
                  flex h-10 w-10 items-center justify-center rounded-lg
                  ${!validationErrors.minWeightageBreach ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}
                `}>
                  {!validationErrors.minWeightageBreach ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">Min Weightage</p>
                  <p className="text-xs text-muted-foreground">10% per goal</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className={`
                  flex h-10 w-10 items-center justify-center rounded-lg
                  ${!validationErrors.incompleteGoals ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning-foreground'}
                `}>
                  {!validationErrors.incompleteGoals ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">All Fields</p>
                  <p className="text-xs text-muted-foreground">Complete required</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Goal Entry Cards */}
        <div className="space-y-4">
          {goals.map((goal, index) => (
            <Card key={goal.id} className="border-border/60">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">Goal {index + 1}</CardTitle>
                  {goals.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => removeGoal(goal.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`title-${goal.id}`}>Goal Title *</Label>
                    <Input
                      id={`title-${goal.id}`}
                      placeholder="e.g., Improve API response time by 40%"
                      value={goal.title}
                      onChange={(e) => updateGoal(goal.id, 'title', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`thrust-${goal.id}`}>Thrust Area *</Label>
                    <Select 
                      value={goal.thrustArea} 
                      onValueChange={(value) => updateGoal(goal.id, 'thrustArea', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select thrust area" />
                      </SelectTrigger>
                      <SelectContent>
                        {thrustAreas.map((area) => (
                          <SelectItem key={area} value={area}>{area}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`desc-${goal.id}`}>Description</Label>
                  <Textarea
                    id={`desc-${goal.id}`}
                    placeholder="Describe the goal and success criteria..."
                    value={goal.description}
                    onChange={(e) => updateGoal(goal.id, 'description', e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor={`uom-${goal.id}`}>Unit of Measurement *</Label>
                    <Select 
                      value={goal.unitOfMeasurement} 
                      onValueChange={(value) => updateGoal(goal.id, 'unitOfMeasurement', value as UnitOfMeasurement)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {uomOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`target-${goal.id}`}>Target *</Label>
                    <Input
                      id={`target-${goal.id}`}
                      type="number"
                      placeholder="e.g., 40"
                      value={goal.target}
                      onChange={(e) => updateGoal(goal.id, 'target', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`weight-${goal.id}`}>Weightage % *</Label>
                    <Input
                      id={`weight-${goal.id}`}
                      type="number"
                      placeholder="e.g., 20"
                      min={10}
                      max={100}
                      value={goal.weightage}
                      onChange={(e) => updateGoal(goal.id, 'weightage', e.target.value)}
                      className={parseInt(goal.weightage) > 0 && parseInt(goal.weightage) < 10 ? 'border-destructive' : ''}
                    />
                    {parseInt(goal.weightage) > 0 && parseInt(goal.weightage) < 10 && (
                      <p className="text-xs text-destructive">Minimum 10% required</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add Goal Button */}
        {goals.length < 8 && (
          <Button variant="outline" className="w-full border-dashed" onClick={addGoal}>
            <Plus className="mr-2 h-4 w-4" />
            Add Goal ({goals.length}/8)
          </Button>
        )}

        {/* Score Formula Help */}
        <Card className="border-border/60 bg-muted/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              Score Formula Reference
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
              <div className="p-3 rounded-lg bg-background border border-border">
                <p className="font-medium text-foreground">Higher is Better</p>
                <p className="text-xs text-muted-foreground mt-1">Score = (Actual / Target) x 100</p>
              </div>
              <div className="p-3 rounded-lg bg-background border border-border">
                <p className="font-medium text-foreground">Lower is Better</p>
                <p className="text-xs text-muted-foreground mt-1">Score = (Target / Actual) x 100</p>
              </div>
              <div className="p-3 rounded-lg bg-background border border-border">
                <p className="font-medium text-foreground">Timeline</p>
                <p className="text-xs text-muted-foreground mt-1">Score = Completion vs Deadline</p>
              </div>
              <div className="p-3 rounded-lg bg-background border border-border">
                <p className="font-medium text-foreground">Zero Based</p>
                <p className="text-xs text-muted-foreground mt-1">0 = Success, else penalty</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
