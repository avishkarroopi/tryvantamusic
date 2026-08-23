import { useState } from "react";
import { Plus, Sparkles, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataState } from "@/components/ui/DataState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { useToast } from "@/hooks/useToast";
import { availabilityService } from "@/services";
import { WEEKDAYS } from "@/lib/date";
import type { AvailabilitySlot } from "@/domain/types";

export function AvailabilityPage() {
  const { push } = useToast();
  const state = useAsync(() => availabilityService.listSlots(), []);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ day: "Mon" as AvailabilitySlot["day"], startTime: "16:00", endTime: "18:00", isTrialSlot: false });
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    setSaving(true);
    try {
      await availabilityService.addSlot(form);
      push({ kind: "success", title: "Availability added", description: `${form.day}, ${form.startTime}–${form.endTime}` });
      setModalOpen(false);
      state.refetch();
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(slot: AvailabilitySlot) {
    await availabilityService.removeSlot(slot.id);
    push({ kind: "info", title: "Slot removed" });
    state.refetch();
  }

  return (
    <div>
      <PageHeader
        title="My Availability"
        description="The weekly hours you're open for regular classes and trial sessions."
        actions={
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="size-4" /> Add slot
          </Button>
        }
      />

      <DataState
        state={state}
        skeleton={<TableSkeleton rows={5} cols={2} />}
        isEmpty={(d) => d.length === 0}
        empty={
          <Card>
            <EmptyState
              title="No availability set"
              description="Add your first weekly time slot so we can schedule trials and classes."
              action={
                <Button size="sm" onClick={() => setModalOpen(true)}>
                  <Plus className="size-4" /> Add slot
                </Button>
              }
            />
          </Card>
        }
      >
        {(slots) => (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {WEEKDAYS.map((day) => {
              const daySlots = slots.filter((s) => s.day === day);
              return (
                <Card key={day}>
                  <CardBody>
                    <p className="font-display font-semibold text-ink-900 dark:text-white">{day}</p>
                    {daySlots.length === 0 ? (
                      <p className="mt-3 text-xs text-ink-400 dark:text-ink-500">No availability</p>
                    ) : (
                      <div className="mt-3 space-y-2">
                        {daySlots.map((slot) => (
                          <div
                            key={slot.id}
                            className="flex items-center justify-between rounded-lg border border-ink-100 px-3 py-2 text-sm dark:border-ink-800"
                          >
                            <span className="text-ink-700 dark:text-ink-200">
                              {slot.startTime} – {slot.endTime}
                            </span>
                            <div className="flex items-center gap-2">
                              {slot.isTrialSlot && (
                                <Badge tone="warning">
                                  <Sparkles className="size-3" /> Trial
                                </Badge>
                              )}
                              <button
                                onClick={() => handleRemove(slot)}
                                aria-label="Remove slot"
                                className="rounded-md p-1 text-ink-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}
      </DataState>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add availability slot"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} loading={saving}>
              Add slot
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink-700 dark:text-ink-200">Day</label>
            <select
              value={form.day}
              onChange={(e) => setForm((f) => ({ ...f, day: e.target.value as AvailabilitySlot["day"] }))}
              className="h-10 w-full rounded-lg border border-ink-200 bg-white px-3 text-sm dark:border-ink-700 dark:bg-ink-950 dark:text-white"
            >
              {WEEKDAYS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink-700 dark:text-ink-200">Start</label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                className="h-10 w-full rounded-lg border border-ink-200 bg-white px-3 text-sm dark:border-ink-700 dark:bg-ink-950 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink-700 dark:text-ink-200">End</label>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                className="h-10 w-full rounded-lg border border-ink-200 bg-white px-3 text-sm dark:border-ink-700 dark:bg-ink-950 dark:text-white"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-700 dark:text-ink-200">
            <input
              type="checkbox"
              checked={form.isTrialSlot}
              onChange={(e) => setForm((f) => ({ ...f, isTrialSlot: e.target.checked }))}
              className="size-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
            />
            Open this slot for trial sessions too
          </label>
        </div>
      </Modal>
    </div>
  );
}
