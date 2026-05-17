'use client'

import { Goal } from '@/lib/types'
import { StatusBadge } from './status-badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Pencil, Trash2, Eye } from 'lucide-react'

interface GoalsTableProps {
  goals: Goal[]
  onEdit?: (goal: Goal) => void
  onDelete?: (goal: Goal) => void
  onView?: (goal: Goal) => void
  showEmployee?: boolean
}

const uomLabels: Record<string, string> = {
  'numeric-higher-better': 'Higher Better',
  'numeric-lower-better': 'Lower Better',
  percentage: 'Percentage',
  'percentage-higher-better': 'Percentage - Higher Better',
  'percentage-lower-better': 'Percentage - Lower Better',
  'timeline': 'Timeline',
  'zero-based': 'Zero Based',
}

export function GoalsTable({
  goals,
  onEdit,
  onDelete,
  onView,
  showEmployee = false,
}: GoalsTableProps) {
  if (goals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 h-16 w-16 rounded-full bg-muted flex items-center justify-center">
          <svg
            className="h-8 w-8 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-foreground">No goals found</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Get started by creating your first goal.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="min-w-[180px]">Goal Title</TableHead>
            {showEmployee && <TableHead className="min-w-[100px]">Employee</TableHead>}
            <TableHead className="min-w-[100px] hidden md:table-cell">Thrust Area</TableHead>
            <TableHead className="min-w-[80px] hidden lg:table-cell">UoM</TableHead>
            <TableHead className="w-[70px] text-right">Target</TableHead>
            <TableHead className="w-[70px] text-right">Weight</TableHead>
            <TableHead className="w-[100px]">Status</TableHead>
            <TableHead className="w-[50px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {goals.map((goal, index) => (
            <TableRow
              key={goal.id}
              className={index % 2 === 0 ? 'bg-card' : 'bg-muted/30'}
            >
              <TableCell className="font-medium">
                <span className="line-clamp-1">{goal.title}</span>
              </TableCell>
              {showEmployee && (
                <TableCell className="text-muted-foreground">
                  {goal.employeeName}
                </TableCell>
              )}
              <TableCell className="text-muted-foreground hidden md:table-cell">
                <span className="line-clamp-1">{goal.thrustArea}</span>
              </TableCell>
              <TableCell className="text-muted-foreground text-xs hidden lg:table-cell">
                {uomLabels[goal.unitOfMeasurement]}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {goal.unitOfMeasurement === 'timeline' ? goal.targetDate ?? '—' : goal.target}
              </TableCell>
              <TableCell className="text-right tabular-nums">{goal.weightage}%</TableCell>
              <TableCell>
                <StatusBadge status={goal.status} type="goal" />
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onView && (
                      <DropdownMenuItem onClick={() => onView(goal)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                    )}
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(goal)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit Goal
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem
                        onClick={() => onDelete(goal)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Goal
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
