'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { SummaryCard } from '@/components/dashboard/summary-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { useCurrentProfile } from '@/hooks/use-current-profile'
import type { AuditLogRow } from '@/lib/data/audit-logs'
import {
  getAdminOverview,
  getUnlockableGoalSheets,
  unlockGoalSheet,
  type AdminOverview,
} from '@/lib/data/admin'
import {
  AlertTriangle,
  ClipboardList,
  FileCheck,
  LockOpen,
  Shield,
  UserCheck,
  Users,
} from 'lucide-react'

type UnlockableSheet = Awaited<ReturnType<typeof getUnlockableGoalSheets>>[number]

function formatDate(value: string): string {
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function actionLabel(action: string): string {
  return action.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export default function AdminDashboard() {
  const { liveProfile } = useCurrentProfile()
  const { toast } = useToast()
  const [overview, setOverview] = useState<AdminOverview | null>(null)
  const [unlockableSheets, setUnlockableSheets] = useState<UnlockableSheet[]>([])
  const [unlockingId, setUnlockingId] = useState<string | null>(null)
  const [selectedUnlockSheet, setSelectedUnlockSheet] = useState<UnlockableSheet | null>(null)
  const [unlockReason, setUnlockReason] = useState('')
  const [unlockReasonError, setUnlockReasonError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadDashboard = async () => {
    setIsLoading(true)
    const [overviewResult, unlockableResult] = await Promise.all([
      getAdminOverview(),
      getUnlockableGoalSheets(),
    ])
    setOverview(overviewResult)
    setUnlockableSheets(unlockableResult)
    setIsLoading(false)
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const openUnlockDialog = (sheet: UnlockableSheet) => {
    setSelectedUnlockSheet(sheet)
    setUnlockReason('')
    setUnlockReasonError(null)
  }

  const isUnlocking = Boolean(unlockingId)
  const canUnlock =
    Boolean(selectedUnlockSheet?.id) &&
    unlockReason.trim().length > 0 &&
    !isUnlocking

  const handleConfirmUnlock = async () => {
    if (!selectedUnlockSheet) return
    if (!liveProfile) {
      toast({
        title: 'Unlock failed',
        description: 'Live admin session is required.',
        variant: 'destructive',
      })
      return
    }
    const reason = unlockReason.trim()
    if (!reason) {
      setUnlockReasonError('Unlock reason is required.')
      return
    }

    const sheet = selectedUnlockSheet
    setUnlockingId(sheet.id)
    try {
      const result = await unlockGoalSheet(sheet.id, liveProfile, reason)
      if (result.success) {
        toast({
          title: 'Goal sheet unlocked',
          description: `${sheet.employeeName}'s sheet is unlocked for rework.`,
        })
        setSelectedUnlockSheet(null)
        setUnlockReason('')
        setUnlockReasonError(null)
        await loadDashboard()
      } else {
        toast({
          title: 'Unlock failed',
          description: result.error ?? 'Could not unlock the goal sheet.',
          variant: 'destructive',
        })
      }
    } catch (err) {
      toast({
        title: 'Unlock failed',
        description: err instanceof Error ? err.message : 'Could not unlock the goal sheet.',
        variant: 'destructive',
      })
    } finally {
      setUnlockingId(null)
    }
  }

  const recentAuditLogs: AuditLogRow[] = overview?.recentAuditLogs ?? []

  function sheetStatusLabel(sheet: UnlockableSheet): string {
    if (sheet.isLocked || sheet.status === 'locked') return 'Approved / Locked'
    if (sheet.status === 'approved') return 'Approved / Locked'
    return actionLabel(sheet.status)
  }

  return (
    <DashboardLayout role="admin">
      <DashboardHeader title="Admin Dashboard" />

      <div className="space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <SummaryCard
            title="Employees"
            value={overview?.totalEmployees ?? 0}
            subtitle="Live employee profiles"
            icon={<Users className="h-5 w-5" />}
          />
          <SummaryCard
            title="Managers"
            value={overview?.managers ?? 0}
            subtitle="Live manager profiles"
            icon={<UserCheck className="h-5 w-5" />}
          />
          <SummaryCard
            title="Submitted"
            value={overview?.submittedGoalSheets ?? 0}
            subtitle="Submitted or beyond"
            icon={<ClipboardList className="h-5 w-5" />}
          />
          <SummaryCard
            title="Pending"
            value={overview?.pendingApprovals ?? 0}
            subtitle="Awaiting approval"
            icon={<AlertTriangle className="h-5 w-5" />}
            variant="warning"
          />
          <SummaryCard
            title="Approved/Locked"
            value={overview?.approvedOrLockedGoalSheets ?? 0}
            subtitle="Completed reviews"
            icon={<FileCheck className="h-5 w-5" />}
            variant="success"
          />
          <SummaryCard
            title="Escalations"
            value={overview?.activeEscalations ?? 0}
            subtitle="Computed live"
            icon={<Shield className="h-5 w-5" />}
            variant="danger"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="border-border/60">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-semibold">Goal Unlock / Exceptions</CardTitle>
                <CardDescription>Unlock approved or locked sheets for admin-approved rework.</CardDescription>
              </div>
              <Badge variant="outline">Live Supabase</Badge>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead>Employee</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Weightage</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unlockableSheets.map((sheet) => (
                      <TableRow key={sheet.id}>
                        <TableCell>
                          <p className="font-medium">{sheet.employeeName}</p>
                          <p className="text-xs text-muted-foreground">{sheet.department}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{sheetStatusLabel(sheet)}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{sheet.totalWeightage}%</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openUnlockDialog(sheet)}
                            disabled={unlockingId === sheet.id}
                          >
                            <LockOpen className="mr-2 h-4 w-4" />
                            Unlock
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {!isLoading && unlockableSheets.length === 0 && (
                <div className="py-10 text-center">
                  <LockOpen className="mx-auto mb-3 h-10 w-10 text-primary" />
                  <p className="font-medium">No approved or locked goal sheets found.</p>
                  <p className="text-sm text-muted-foreground">
                    Exception handling actions will appear once goal sheets are approved.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-semibold">Recent Audit Trail</CardTitle>
                <CardDescription>Latest organization lifecycle events.</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/audit-trail">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentAuditLogs.map((log) => (
                  <div key={log.id} className="rounded-lg border border-border bg-muted/20 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">{actionLabel(log.actionType)}</p>
                      <span className="text-xs text-muted-foreground">{formatDate(log.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {log.description ?? `${log.actorName} updated ${log.goalTitle}`}
                    </p>
                  </div>
                ))}
              </div>
              {!isLoading && recentAuditLogs.length === 0 && (
                <div className="py-10 text-center">
                  <ClipboardList className="mx-auto mb-3 h-10 w-10 text-primary" />
                  <p className="font-medium">No audit activity yet.</p>
                  <p className="text-sm text-muted-foreground">
                    Lifecycle actions will appear here once users submit or update records.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog
        open={Boolean(selectedUnlockSheet)}
        onOpenChange={(open) => {
          if (!open && !isUnlocking) {
            setSelectedUnlockSheet(null)
            setUnlockReason('')
            setUnlockReasonError(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unlock goal sheet for rework?</DialogTitle>
            <DialogDescription>
              This will allow the employee to edit and resubmit. Manager approval will be required again.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Textarea
              placeholder="Reason for unlock"
              value={unlockReason}
              onChange={(event) => {
                setUnlockReason(event.target.value)
                if (unlockReasonError) setUnlockReasonError(null)
              }}
              rows={4}
            />
            {unlockReasonError && (
              <p className="text-sm text-destructive">{unlockReasonError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedUnlockSheet(null)
                setUnlockReason('')
                setUnlockReasonError(null)
              }}
              disabled={Boolean(unlockingId)}
              type="button"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmUnlock}
              disabled={!canUnlock}
            >
              <LockOpen className="mr-2 h-4 w-4" />
              {isUnlocking ? 'Unlocking...' : 'Unlock for Rework'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
