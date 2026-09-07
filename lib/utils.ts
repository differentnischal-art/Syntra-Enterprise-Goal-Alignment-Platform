import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calculates the total weightage across an array of goal items.
 */
export function calculateTotalWeightage(
  goals: Array<{ weightage: number }>
): number {
  return goals.reduce((sum, goal) => sum + (Number(goal.weightage) || 0), 0)
}

/**
 * Calculates the overall weighted progress percentage across an array of goals.
 */
export function calculateWeightedProgress(
  goals: Array<{ weightage: number; progress?: number }>
): number {
  const totalWeight = calculateTotalWeightage(goals)
  if (totalWeight === 0) return 0

  const weightedSum = goals.reduce((sum, goal) => {
    const weight = Number(goal.weightage) || 0
    const progress = Number(goal.progress) || 0
    return sum + weight * progress
  }, 0)

  return Math.round((weightedSum / totalWeight) * 100) / 100
}

/**
 * Validates whether the total goal weightage meets the expected target (default 100%).
 */
export function validateGoalWeightages(
  goals: Array<{ weightage: number }>,
  targetTotal = 100
): { total: number; isValid: boolean; remaining: number } {
  const total = calculateTotalWeightage(goals)
  return {
    total,
    isValid: total === targetTotal,
    remaining: targetTotal - total,
  }
}

