import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataState } from "@/components/ui/DataState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { TrialOpportunityCard } from "@/components/domain/TrialOpportunityCard";
import { useAsync } from "@/hooks/useAsync";
import { useToast } from "@/hooks/useToast";
import { notifyAttentionChanged } from "@/hooks/useAttentionCounts";
import { trialService } from "@/services";
import type { TrialOpportunity } from "@/domain/types";

export function TrialOpportunitiesPage() {
  const navigate = useNavigate();
  const { push } = useToast();
  const state = useAsync(() => trialService.listOpportunities(), []);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function handleClaim(opp: TrialOpportunity) {
    setPendingId(opp.id);
    try {
      await trialService.claimOpportunity(opp.id);
      push({
        kind: "success",
        title: "Trial claimed",
        description: `${opp.studentName}'s trial was added to your schedule.`,
      });
      state.refetch();
      notifyAttentionChanged();
    } finally {
      setPendingId(null);
    }
  }

  async function handleDecline(opp: TrialOpportunity) {
    await trialService.declineOpportunity(opp.id);
    push({ kind: "info", title: "Opportunity declined", description: `${opp.studentName}'s trial was returned to the pool.` });
    state.refetch();
    notifyAttentionChanged();
  }

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-3">
        <ArrowLeft className="size-4" /> Back
      </Button>
      <PageHeader
        title="Trial Opportunities"
        description="Open trial requests matching your category and region — claim what fits your schedule."
      />

      <Card>
        <DataState
          state={state}
          skeleton={<TableSkeleton rows={4} cols={3} />}
          isEmpty={(d) => d.length === 0}
          empty={
            <EmptyState
              icon={<Sparkles className="size-6" />}
              title="No open opportunities right now"
              description="New trial requests will appear here automatically as students book them."
            />
          }
        >
          {(opportunities) => (
            <CardBody className="space-y-3">
              {opportunities.map((opp) => (
                <TrialOpportunityCard
                  key={opp.id}
                  opportunity={opp}
                  onClaim={handleClaim}
                  onDecline={handleDecline}
                  claiming={pendingId === opp.id}
                />
              ))}
            </CardBody>
          )}
        </DataState>
      </Card>
    </div>
  );
}
