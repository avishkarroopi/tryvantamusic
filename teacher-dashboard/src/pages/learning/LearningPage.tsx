import { BookOpen, CheckCircle2, Clock, PlayCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { learningService } from "@/services";

export function LearningPage() {
  const modulesState = useAsync(() => learningService.listModules(), []);
  const coursesState = useAsync(() => learningService.listCourses(), []);

  return (
    <div>
      <PageHeader title="My Learning" description="Grow your teaching craft with short modules built for Muziclly teachers." />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Teacher training modules</CardTitle>
            </CardHeader>
            <CardBody>
              {modulesState.loading ? (
                <CardSkeleton rows={4} />
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {(modulesState.data ?? []).map((m) => (
                    <div key={m.id} className="overflow-hidden rounded-xl border border-ink-100 dark:border-ink-800">
                      <div className="flex h-20 items-center justify-center" style={{ backgroundColor: m.thumbnailColor }}>
                        {m.isCompleted ? (
                          <CheckCircle2 className="size-8 text-white/90" />
                        ) : (
                          <PlayCircle className="size-8 text-white/90" />
                        )}
                      </div>
                      <div className="p-4">
                        <Badge tone="neutral">{m.category}</Badge>
                        <p className="mt-2 font-semibold text-ink-900 dark:text-white">{m.title}</p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-400 dark:text-ink-500">
                          <Clock className="size-3.5" /> {m.durationMinutes} min
                        </p>
                        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
                          <div
                            className="h-full rounded-full bg-brand-500 transition-[width]"
                            style={{ width: `${m.progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Course catalog</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            {coursesState.loading ? (
              <CardSkeleton rows={3} />
            ) : (
              (coursesState.data ?? []).map((c) => (
                <div key={c.id} className="rounded-xl border border-ink-100 p-3 dark:border-ink-800">
                  <div className="flex items-center gap-2">
                    <BookOpen className="size-4 text-brand-500" />
                    <p className="font-semibold text-ink-900 dark:text-white">{c.title}</p>
                  </div>
                  <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">{c.description}</p>
                  <div className="mt-2 flex gap-1.5">
                    <Badge tone="brand">{c.level}</Badge>
                    <Badge tone="neutral">{c.durationWeeks} weeks</Badge>
                  </div>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
