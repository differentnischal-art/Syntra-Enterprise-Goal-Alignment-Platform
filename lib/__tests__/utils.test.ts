import { describe, it, expect } from 'vitest'
import {
  cn,
  calculateTotalWeightage,
  calculateWeightedProgress,
  validateGoalWeightages,
} from '../utils'

describe('utils', () => {
  describe('cn', () => {
    it('merges class names correctly', () => {
      expect(cn('px-2 py-1', 'bg-blue-500')).toBe('px-2 py-1 bg-blue-500')
      expect(cn('px-2', false && 'hidden', 'py-1')).toBe('px-2 py-1')
      expect(cn('p-4', 'p-2')).toBe('p-2')
    })
  })

  describe('calculateTotalWeightage', () => {
    it('returns 0 for empty goals list', () => {
      expect(calculateTotalWeightage([])).toBe(0)
    })

    it('sums weightages of all goals', () => {
      const goals = [{ weightage: 30 }, { weightage: 50 }, { weightage: 20 }]
      expect(calculateTotalWeightage(goals)).toBe(100)
    })

    it('handles floating point values correctly', () => {
      const goals = [{ weightage: 33.3 }, { weightage: 33.3 }, { weightage: 33.4 }]
      expect(calculateTotalWeightage(goals)).toBeCloseTo(100)
    })
  })

  describe('calculateWeightedProgress', () => {
    it('returns 0 when total weightage is 0', () => {
      expect(calculateWeightedProgress([])).toBe(0)
      expect(calculateWeightedProgress([{ weightage: 0, progress: 50 }])).toBe(0)
    })

    it('calculates weighted progress correctly', () => {
      const goals = [
        { weightage: 50, progress: 100 },
        { weightage: 50, progress: 50 },
      ]
      expect(calculateWeightedProgress(goals)).toBe(75)
    })

    it('handles missing progress as 0', () => {
      const goals = [
        { weightage: 60, progress: 80 },
        { weightage: 40 },
      ]
      expect(calculateWeightedProgress(goals)).toBe(48)
    })
  })

  describe('validateGoalWeightages', () => {
    it('validates 100% total weightage as valid', () => {
      const goals = [{ weightage: 40 }, { weightage: 60 }]
      const result = validateGoalWeightages(goals)
      expect(result.isValid).toBe(true)
      expect(result.total).toBe(100)
      expect(result.remaining).toBe(0)
    })

    it('identifies incomplete weightage', () => {
      const goals = [{ weightage: 30 }, { weightage: 40 }]
      const result = validateGoalWeightages(goals)
      expect(result.isValid).toBe(false)
      expect(result.total).toBe(70)
      expect(result.remaining).toBe(30)
    })
  })
})
