import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataState } from "@/components/ui/DataState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { useToast } from "@/hooks/useToast";
import { leaveService } from "@/services";
import { formatFullDate, todayISO } from "@/lib/date";
import type { Leave, LeaveStatus } from "@/domain/types";

const STATUS_TONE: Record<LeaveStatus, BadgeTone> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
  cancelled: "neutral",
};

export function LeavesPage() {
  const { push } = useToast();
  const state = useAsync(() => leaveService.listLeaves(), []);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ fromDate: todayISO(), toDate: todayISO(), reason: "" });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await leaveService.applyLeave(form);
      push({ kind: "success", title: "Leave request submitted", description: "Your manager will review it shortly." });
      setModalOpen(false);
      setForm({ fromDate: todayISO(), toDate: todayISO(), reason: "" });
      state.refetch();
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel(leave: Leave) {
    await leaveService.cancelLeave(leave.id);
    push({ kind: "info", title: "Leave request cancelled" });
    state.refetch();
  }

  return (
    <div>
      <PageHeader
        title="My Leaves"
        description="Apply for leave and track approval status."
        actions={
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="size-4" /> Apply for leave
          </Button>
        }
      />

      <Card>
        <DataState
          state={state}
          skeleton={<TableSkeleton rows={4} cols={3} />}
          isEmpty={(d) => d.length === 0}
          empty={
            <EmptyState
              title="No leave requests yet"
              description="Apply for leave when you need time off — your manager will be notified."
              action={
                <Button size="sm" onClick={() => setModalOpen(true)}>
                  <Plus className="size-4" /> Apply for leave
                </Button>
              }
            />
          }
        >
          {(leaves) => (
            <CardBody className="space-y-3">
              {leaves.map((leave) => (
                <div
                  key={leave.id}
                  className="flex flex-col gap-3 rounded-xl border border-ink-100 p-4 dark:border-ink-800 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-ink-900 dark:text-white">
                        {formatFullDate(leave.fromDate)}
                        {leave.toDate !== leave.fromDate ? ` – ${formatFullDate(leave.toDate)}` : ""}
                      </p>
                      <Badge tone={STATUS_TONE[leave.status]} className="capitalize">
                        {leave.status}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-sm text-ink-500 dark:text-ink-400">{leave.reason}</p>
                    {leave.approverNote && (
                      <p className="mt-1 text-xs italic text-ink-400 dark:text-ink-500">"{leave.approverNote}"</p>
                    )}
                  </div>
                  {leave.status === "pending" && (
                    <Button size="sm" variant="ghost" onClick={() => handleCancel(leave)} className="self-end sm:self-center">
                      Cancel request
                    </Button>
                  )}
                </div>
              ))}
            </CardBody>
          )}
        </DataState>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Apply for leave"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={saving}>
              Submit request
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink-700 dark:text-ink-200">From</label>
              <input
                type="date"
                value={form.fromDate}
                onChange={(e) => setForm((f) => ({ ...f, fromDate: e.target.value }))}
                className="h-10 w-full rounded-lg border border-ink-200 bg-white px-3 text-sm dark:border-ink-700 dark:bg-ink-950 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink-700 dark:text-ink-200">To</label>
              <input
                type="date"
                value={form.toDate}
                onChange={(e) => setForm((f) => ({ ...f, toDate: e.target.value }))}
                className="h-10 w-full rounded-lg border border-ink-200 bg-white px-3 text-sm dark:border-ink-700 dark:bg-ink-950 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink-700 dark:text-ink-200">Reason</label>
            <textarea
              required
              rows={3}
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              placeholder="Let your manager know why you need this leave…"
              className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm dark:border-ink-700 dark:bg-ink-950 dark:text-white"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
