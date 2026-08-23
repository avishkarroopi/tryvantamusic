import { useState } from "react";
import { Star } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataState } from "@/components/ui/DataState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { useToast } from "@/hooks/useToast";
import { reviewService, teacherService } from "@/services";
import { relativeFromNow } from "@/lib/date";
import { cn } from "@/lib/cn";

export function ReviewsPage() {
  const reviewsState = useAsync(() => reviewService.listReviews(), []);
  const teachersState = useAsync(() => teacherService.listTeachers(), []);
  const { push } = useToast();
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [comment, setComment] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    const teacher = (teachersState.data ?? []).find((t) => t.id === teacherId) ?? (teachersState.data ?? [])[0];
    if (!teacher || !comment.trim()) return;
    setSaving(true);
    await reviewService.submitReview(teacher.id, teacher.name, rating, comment);
    setSaving(false);
    setComment("");
    push({ kind: "success", title: "Review submitted", description: `Thanks for reviewing ${teacher.name}!` });
    reviewsState.refetch();
  }

  return (
    <div>
      <PageHeader title="Reviews" description="Rate your teachers and share feedback." />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_22rem]">
        <DataState
          state={reviewsState}
          skeleton={<TableSkeleton rows={3} cols={1} />}
          isEmpty={(d) => d.length === 0}
          empty={<Card><EmptyState title="No reviews yet" description="Leave your first review using the form." /></Card>}
        >
          {(reviews) => (
            <div className="space-y-3">
              {reviews.map((r) => (
                <Card key={r.id}>
                  <CardBody>
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-ink-900 dark:text-white">{r.teacherName}</p>
                      <div className="flex items-center gap-0.5 text-accent-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={cn("size-4", i < r.rating ? "fill-current" : "text-ink-200 dark:text-ink-700")} />
                        ))}
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-ink-600 dark:text-ink-300">{r.comment}</p>
                    <p className="mt-1 text-xs text-ink-400 dark:text-ink-500">{relativeFromNow(r.createdAt)}</p>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </DataState>

        <Card>
          <CardHeader>
            <CardTitle>Write a review</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink-700 dark:text-ink-200">Teacher</label>
              <select
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                className="h-10 w-full rounded-lg border border-ink-200 bg-white px-3 text-sm text-ink-900 outline-none focus:border-brand-400 dark:border-ink-700 dark:bg-ink-950 dark:text-white"
              >
                <option value="">Select a teacher…</option>
                {(teachersState.data ?? []).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink-700 dark:text-ink-200">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setRating(n as 1 | 2 | 3 | 4 | 5)} aria-label={`${n} stars`}>
                    <Star className={cn("size-6", n <= rating ? "fill-current text-accent-500" : "text-ink-200 dark:text-ink-700")} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink-700 dark:text-ink-200">Comment</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                placeholder="Share your experience…"
                className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-400 dark:border-ink-700 dark:bg-ink-950 dark:text-white"
              />
            </div>
            <Button className="w-full" loading={saving} onClick={handleSubmit}>
              Submit review
            </Button>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
