'use client'

import { useState, useEffect } from 'react'
import { Goal, UnitOfMeasurement } from '@/lib/types'
import { DEFAULT_THRUST_AREAS } from '@/lib/constants/reference-data'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { AlertCircle } from 'lucide-react'

interface CreateGoalModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt' | 'employeeId' | 'approvalStatus'>) => void
  existingGoals: Goal[]
  editGoal?: Goal | null
}

const MAX_GOALS = 8
const MIN_WEIGHTAGE = 10

export function CreateGoalModal({
  open,
  onOpenChange,
  onSubmit,
  existingGoals,
  editGoal,
}: CreateGoalModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [thrustArea, setThrustArea] = useState('')
  const [unitOfMeasurement, setUnitOfMeasurement] = useState<UnitOfMeasurement>('numeric-higher-better')
  const [target, setTarget] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [weightage, setWeightage] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Calculate totals
  const existingWeightage = existingGoals
    .filter((g) => (editGoal ? g.id !== editGoal.id : true))
    .reduce((sum, g) => sum + g.weightage, 0)
  const currentWeightage = weightage ? parseInt(weightage, 10) : 0
  const totalWeightage = existingWeightage + currentWeightage
  const goalsCount = editGoal ? existingGoals.length : existingGoals.length + 1

  // Reset form when modal opens/closes or edit goal changes
  useEffect(() => {
    if (open) {
      if (editGoal) {
        setTitle(editGoal.title)
        setDescription(editGoal.description)
        setThrustArea(editGoal.thrustArea)
        setUnitOfMeasurement(editGoal.unitOfMeasurement)
        setTarget(editGoal.target.toString())
        setTargetDate(editGoal.targetDate ?? '')
        setWeightage(editGoal.weightage.toString())
      } else {
        setTitle('')
        setDescription('')
        setThrustArea('')
        setUnitOfMeasurement('numeric-higher-better')
        setTarget('')
        setTargetDate('')
        setWeightage('')
      }
      setErrors({})
    }
  }, [open, editGoal])

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!title.trim()) {
      newErrors.title = 'Goal title is required'
    }

    if (!description.trim()) {
      newErrors.description = 'Description is required'
    }

    if (!thrustArea) {
      newErrors.thrustArea = 'Please select a thrust area'
    }

    if (unitOfMeasurement === 'timeline') {
      if (!targetDate || Number.isNaN(Date.parse(targetDate))) {
        newErrors.target = 'Please enter a valid target date'
      }
    } else if (unitOfMeasurement === 'zero-based') {
      if (target !== '0') {
        newErrors.target = 'Zero-based goals must use target 0'
      }
    } else if (!target || isNaN(parseFloat(target)) || parseFloat(target) < 0) {
      newErrors.target = 'Please enter a valid target value'
    } else if (
      (unitOfMeasurement === 'percentage' ||
        unitOfMeasurement === 'percentage-higher-better' ||
        unitOfMeasurement === 'percentage-lower-better') &&
      parseFloat(target) > 100
    ) {
      newErrors.target = 'Percentage targets must be between 0 and 100'
    }

    if (!weightage || isNaN(parseInt(weightage, 10))) {
      newErrors.weightage = 'Please enter a valid weightage'
    } else {
      const w = parseInt(weightage, 10)
      if (w < MIN_WEIGHTAGE) {
        newErrors.weightage = `Minimum weightage per goal is ${MIN_WEIGHTAGE}%`
      }
    }

    if (!editGoal && existingGoals.length >= MAX_GOALS) {
      newErrors.general = `Maximum ${MAX_GOALS} goals allowed`
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      thrustArea,
      unitOfMeasurement,
      target:
        unitOfMeasurement === 'zero-based' || unitOfMeasurement === 'timeline'
          ? 0
          : parseFloat(target),
      targetDate: unitOfMeasurement === 'timeline' ? targetDate : null,
      weightage: parseInt(weightage, 10),
      status: 'not-started',
    })
  }

  const isFormValid =
    title.trim() &&
    description.trim() &&
    thrustArea &&
    (unitOfMeasurement === 'timeline'
      ? targetDate
      : unitOfMeasurement === 'zero-based'
        ? target === '0'
        : target && parseFloat(target) >= 0) &&
    weightage &&
    parseInt(weightage, 10) >= MIN_WEIGHTAGE &&
    (editGoal || existingGoals.length < MAX_GOALS)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editGoal ? 'Edit Goal' : 'Create New Goal'}</DialogTitle>
          <DialogDescription>
            {editGoal
              ? 'Update the details of your goal below.'
              : 'Fill in the details below to create a new goal.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Weightage Counter */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 px-4 py-3">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Total Weightage</p>
              <p className="text-xs text-muted-foreground">
                Sum of all goal weightages
              </p>
            </div>
            <div className="text-right">
              <p
                className={`text-2xl font-semibold ${
                  totalWeightage === 100
                    ? 'text-success'
                    : totalWeightage > 100
                      ? 'text-destructive'
                      : 'text-warning-foreground'
                }`}
              >
                {totalWeightage}%
              </p>
              <p className="text-xs text-muted-foreground">of 100% required</p>
            </div>
          </div>

          {/* Validation Errors */}
          {totalWeightage !== 100 && totalWeightage > 0 && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>Total weightage must equal 100%</span>
            </div>
          )}

          {!editGoal && existingGoals.length >= MAX_GOALS && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>Maximum {MAX_GOALS} goals allowed</span>
            </div>
          )}

          {/* Goal Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Goal Title</Label>
            <Input
              id="title"
              placeholder="e.g., Increase quarterly revenue by 15%"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={errors.title ? 'border-destructive' : ''}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the goal and how you plan to achieve it..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={errors.description ? 'border-destructive' : ''}
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description}</p>
            )}
          </div>

          {/* Thrust Area */}
          <div className="space-y-2">
            <Label htmlFor="thrustArea">Thrust Area</Label>
            <Select value={thrustArea} onValueChange={setThrustArea}>
              <SelectTrigger className={errors.thrustArea ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select a thrust area" />
              </SelectTrigger>
              <SelectContent>
                {DEFAULT_THRUST_AREAS.map((area) => (
                  <SelectItem key={area} value={area}>
                    {area}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.thrustArea && (
              <p className="text-sm text-destructive">{errors.thrustArea}</p>
            )}
          </div>

          {/* Unit of Measurement */}
          <div className="space-y-3">
            <Label>Unit of Measurement</Label>
            <RadioGroup
              value={unitOfMeasurement}
              onValueChange={(value) => {
                const nextUom = value as UnitOfMeasurement
                setUnitOfMeasurement(nextUom)
                if (nextUom === 'zero-based') {
                  setTarget('0')
                  setTargetDate('')
                } else if (nextUom === 'timeline') {
                  setTarget('')
                } else {
                  setTargetDate('')
                }
              }}
              className="grid gap-3 sm:grid-cols-2"
            >
              <div className="flex items-center space-x-3 rounded-lg border border-border p-3 hover:bg-muted/50">
                <RadioGroupItem value="numeric-higher-better" id="uom-1" />
                <Label htmlFor="uom-1" className="flex-1 cursor-pointer text-sm font-normal">
                  Numeric - Higher is Better
                </Label>
              </div>
              <div className="flex items-center space-x-3 rounded-lg border border-border p-3 hover:bg-muted/50">
                <RadioGroupItem value="numeric-lower-better" id="uom-2" />
                <Label htmlFor="uom-2" className="flex-1 cursor-pointer text-sm font-normal">
                  Numeric - Lower is Better
                </Label>
              </div>
              <div className="flex items-center space-x-3 rounded-lg border border-border p-3 hover:bg-muted/50">
                <RadioGroupItem value="percentage-higher-better" id="uom-3" />
                <Label htmlFor="uom-3" className="flex-1 cursor-pointer text-sm font-normal">
                  Percentage - Higher is Better
                </Label>
              </div>
              <div className="flex items-center space-x-3 rounded-lg border border-border p-3 hover:bg-muted/50">
                <RadioGroupItem value="percentage-lower-better" id="uom-4" />
                <Label htmlFor="uom-4" className="flex-1 cursor-pointer text-sm font-normal">
                  Percentage - Lower is Better
                </Label>
              </div>
              <div className="flex items-center space-x-3 rounded-lg border border-border p-3 hover:bg-muted/50">
                <RadioGroupItem value="timeline" id="uom-5" />
                <Label htmlFor="uom-5" className="flex-1 cursor-pointer text-sm font-normal">
                  Timeline
                </Label>
              </div>
              <div className="flex items-center space-x-3 rounded-lg border border-border p-3 hover:bg-muted/50">
                <RadioGroupItem value="zero-based" id="uom-6" />
                <Label htmlFor="uom-6" className="flex-1 cursor-pointer text-sm font-normal">
                  Zero Based
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Target and Weightage */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="target">Target</Label>
              {unitOfMeasurement === 'timeline' ? (
                <Input
                  id="target"
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className={errors.target ? 'border-destructive' : ''}
                />
              ) : (
                <Input
                  id="target"
                  type="number"
                  placeholder={unitOfMeasurement === 'zero-based' ? '0' : 'e.g., 15'}
                  value={unitOfMeasurement === 'zero-based' ? '0' : target}
                  onChange={(e) => setTarget(e.target.value)}
                  className={errors.target ? 'border-destructive' : ''}
                  min="0"
                  max={
                    unitOfMeasurement === 'percentage' ||
                    unitOfMeasurement === 'percentage-higher-better' ||
                    unitOfMeasurement === 'percentage-lower-better'
                      ? 100
                      : undefined
                  }
                  step="any"
                  readOnly={unitOfMeasurement === 'zero-based'}
                  disabled={unitOfMeasurement === 'zero-based'}
                />
              )}
              {errors.target && (
                <p className="text-sm text-destructive">{errors.target}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="weightage">Weightage %</Label>
              <Input
                id="weightage"
                type="number"
                placeholder="e.g., 20"
                value={weightage}
                onChange={(e) => setWeightage(e.target.value)}
                className={errors.weightage ? 'border-destructive' : ''}
                min={MIN_WEIGHTAGE}
                max={100}
              />
              {errors.weightage && (
                <p className="text-sm text-destructive">{errors.weightage}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Minimum {MIN_WEIGHTAGE}% per goal
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isFormValid}>
              {editGoal ? 'Update Goal' : 'Create Goal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
