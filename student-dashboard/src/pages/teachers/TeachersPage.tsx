import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataState } from "@/components/ui/DataState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { teacherService } from "@/services";

export function TeachersPage() {
  const state = useAsync(() => teacherService.listTeachers(), []);
  const navigate = useNavigate();

  return (
    <div>
      <PageHeader title="My Teachers" description="The mentors guiding your musical journey." />

      <DataState
        state={state}
        skeleton={<TableSkeleton rows={3} cols={2} />}
        isEmpty={(d) => d.length === 0}
        empty={<Card><EmptyState title="No teachers yet" /></Card>}
      >
        {(teachers) => (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {teachers.map((t) => (
              <Card key={t.id}>
                <CardBody>
                  <div className="flex items-center gap-3">
                    <Avatar name={t.name} size="lg" />
                    <div>
                      <p className="font-display font-semibold text-ink-900 dark:text-white">{t.name}</p>
                      <p className="text-xs capitalize text-ink-400 dark:text-ink-500">{t.instrument} teacher</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-ink-600 dark:text-ink-300">{t.introduction}</p>
                  <div className="mt-3 flex items-center gap-1 text-sm text-accent-600 dark:text-accent-400">
                    <Star className="size-4 fill-current" /> {t.rating.toFixed(1)}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => navigate("/dashboard/messages")}>
                      Message
                    </Button>
                    <Button size="sm" variant="ghost" className="flex-1" onClick={() => navigate("/dashboard/reviews")}>
                      Review
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </DataState>
    </div>
  );
}
