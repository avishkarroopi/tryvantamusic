import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataState } from "@/components/ui/DataState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { SessionRow } from "@/components/domain/SessionRow";
import { TrialDetailDrawer } from "@/components/domain/TrialDetailDrawer";
import { useAsync } from "@/hooks/useAsync";
import { useToast } from "@/hooks/useToast";
import { sessionService, trialService } from "@/services";
import type { Session } from "@/domain/types";

type Filter = "upcoming" | "completed" | "cancelled";

export function TrialSessionsPage() {
  const navigate = useNavigate();
  const { push } = useToast();
  const [filter, setFilter] = useState<Filter>("upcoming");
  const [reviewSession, setReviewSession] = useState<Session | null>(null);
  const state = useAsync(() => trialService.listTrialSessions(), []);

  const filtered = useMemo(() => {
    const list = state.data ?? [];
    if (filter === "upcoming") return list.filter((s) => s.status === "scheduled");
    if (filter === "completed") return list.filter((s) => s.status === "completed");
    return list.filter((s) => s.status === "cancelled" || s.status === "no-show");
  }, [state.data, filter]);

  async function handleCancel(session: Session) {
    await sessionService.cancelSession(session.id);
    push({ kind: "success", title: "Trial cancelled", description: `${session.studentName}'s trial was cancelled.` });
    state.refetch();
  }

  return (
    <div>
      <PageHeader
        title="Trial Sessions"
        description="Trial classes you've been assigned, upcoming and past."
        actions={
          <Button onClick={() => navigate("/dashboard/trials/opportunities")}>
            <Sparkles className="size-4" /> Trial opportunities
          </Button>
        }
      />

      <Tabs
        active={filter}
        onChange={setFilter}
        tabs={[
          { value: "upcoming", label: "Upcoming" },
          { value: "completed", label: "Completed" },
          { value: "cancelled", label: "Cancelled / No-show" },
        ]}
      />

      <div className="mt-5">
        <Card>
          <DataState
            state={state}
            skeleton={<TableSkeleton rows={4} cols={3} />}
            isEmpty={() => filtered.length === 0}
            empty={
              <EmptyState
                icon={<Sparkles className="size-6" />}
                title="No trial sessions here"
                description="Claim an open trial opportunity to get started."
                action={
                  <Button size="sm" onClick={() => navigate("/dashboard/trials/opportunities")}>
                    View opportunities
                  </Button>
                }
              />
            }
          >
            {() => (
              <CardBody className="space-y-3">
                {filtered.map((session) => (
                  <SessionRow
                    key={session.id}
                    session={session}
                    onReview={setReviewSession}
                    onCancel={session.status === "scheduled" ? handleCancel : undefined}
                  />
                ))}
              </CardBody>
            )}
          </DataState>
        </Card>
      </div>

      <TrialDetailDrawer session={reviewSession} onClose={() => setReviewSession(null)} />
    </div>
  );
}
