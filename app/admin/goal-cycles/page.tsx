'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { mockAdminUser } from '@/lib/mock-data'
import { Plus, Calendar } from 'lucide-react'

const goalCycles = [
  {
    id: 'c1',
    name: 'FY 2024-25',
    startDate: '2024-04-01',
    endDate: '2025-03-31',
    status: 'active',
    goalsCount: 42,
  },
  {
    id: 'c2',
    name: 'FY 2023-24',
    startDate: '2023-04-01',
    endDate: '2024-03-31',
    status: 'completed',
    goalsCount: 156,
  },
  {
    id: 'c3',
    name: 'FY 2022-23',
    startDate: '2022-04-01',
    endDate: '2023-03-31',
    status: 'archived',
    goalsCount: 143,
  },
]

export default function AdminGoalCyclesPage() {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="outline" className="bg-success/10 text-success border-success/20">
            Active
          </Badge>
        )
      case 'completed':
        return (
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            Completed
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-muted text-muted-foreground">
            Archived
          </Badge>
        )
    }
  }

  return (
    <DashboardLayout role="admin">
      <Header user={mockAdminUser} title="Goal Cycles" />

      <div className="p-6">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Goal Cycles</CardTitle>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Cycle
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Cycle Name</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Goals</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {goalCycles.map((cycle, index) => (
                  <TableRow
                    key={cycle.id}
                    className={index % 2 === 0 ? 'bg-card' : 'bg-muted/30'}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {cycle.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(cycle.startDate)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(cycle.endDate)}
                    </TableCell>
                    <TableCell>{cycle.goalsCount}</TableCell>
                    <TableCell>{getStatusBadge(cycle.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
