import { Star } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataState } from "@/components/ui/DataState";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { reviewService } from "@/services";
import { formatFullDate } from "@/lib/date";
import type { ReviewSentiment } from "@/domain/types";

const SENTIMENT_TONE: Record<ReviewSentiment, BadgeTone> = {
  positive: "success",
  neutral: "neutral",
  negative: "danger",
};

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`size-4 ${i < rating ? "fill-accent-500 text-accent-500" : "text-ink-200 dark:text-ink-700"}`} />
      ))}
    </div>
  );
}

export function ReviewsPage() {
  const state = useAsync(() => reviewService.getReviews(), []);

  return (
    <div>
      <PageHeader title="Reviews" description="Feedback shared by students and parents after your sessions." />

      <DataState
        state={state}
        skeleton={<CardSkeleton rows={5} />}
        isEmpty={(d) => d.reviews.length === 0}
        empty={
          <Card>
            <EmptyState icon={<Star className="size-6" />} title="No reviews yet" description="Reviews from students and parents will appear here." />
          </Card>
        }
      >
        {(summary) => (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Card>
                <CardBody className="flex items-center gap-4">
                  <p className="font-display text-4xl font-bold text-ink-900 dark:text-white">{summary.avgRating}</p>
                  <div>
                    <Stars rating={Math.round(summary.avgRating)} />
                    <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Average rating</p>
                  </div>
                </CardBody>
              </Card>
              <Card>
                <CardBody className="flex items-center gap-4">
                  <p className="font-display text-4xl font-bold text-ink-900 dark:text-white">{summary.totalReviews}</p>
                  <p className="text-sm text-ink-500 dark:text-ink-400">Total reviews received</p>
                </CardBody>
              </Card>
            </div>

            <Card>
              <CardBody className="space-y-4">
                {summary.reviews.map((review) => (
                  <div key={review.id} className="rounded-xl border border-ink-100 p-4 dark:border-ink-800">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-ink-900 dark:text-white">{review.studentName}</p>
                        {review.batchName && <p className="text-xs text-ink-400 dark:text-ink-500">{review.batchName}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Stars rating={review.rating} />
                        <Badge tone={SENTIMENT_TONE[review.sentiment]} className="capitalize">
                          {review.sentiment}
                        </Badge>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-ink-600 dark:text-ink-300">{review.comment}</p>
                    <p className="mt-2 text-xs text-ink-400 dark:text-ink-500">{formatFullDate(review.createdAt)}</p>
                  </div>
                ))}
              </CardBody>
            </Card>
          </div>
        )}
      </DataState>
    </div>
  );
}
