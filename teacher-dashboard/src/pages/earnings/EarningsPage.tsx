import { CircleDollarSign, Download } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataState } from "@/components/ui/DataState";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { earningsService } from "@/services";
import { formatINR } from "@/lib/format";
import { formatFullDate } from "@/lib/date";
import type { EarningStatement } from "@/domain/types";

const STATUS_TONE: Record<EarningStatement["status"], BadgeTone> = {
  paid: "success",
  processing: "warning",
  upcoming: "neutral",
};

const LINE_TONE: Record<string, string> = {
  base: "text-ink-700 dark:text-ink-200",
  incentive: "text-emerald-600 dark:text-emerald-400",
  bonus: "text-emerald-600 dark:text-emerald-400",
  deduction: "text-rose-600 dark:text-rose-400",
};

export function EarningsPage() {
  const state = useAsync(() => earningsService.listStatements(), []);

  const latest = state.data?.[0];
  const ytdTotal = (state.data ?? []).reduce((sum, e) => sum + e.total, 0);

  return (
    <div>
      <PageHeader title="Earnings" description="Your payout statements, incentives and bonuses." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Latest statement" value={latest ? formatINR(latest.total) : "—"} icon={CircleDollarSign} tone="brand" />
        <StatCard label="Total across statements" value={formatINR(ytdTotal)} icon={CircleDollarSign} tone="success" />
        <StatCard
          label="Status"
          value={latest ? latest.status[0].toUpperCase() + latest.status.slice(1) : "—"}
          icon={CircleDollarSign}
          tone="accent"
        />
      </div>

      <div className="mt-6">
        <DataState
          state={state}
          skeleton={<CardSkeleton rows={5} />}
          isEmpty={(d) => d.length === 0}
          empty={
            <Card>
              <EmptyState title="No earning statements yet" description="Your first statement will appear once sessions are delivered." />
            </Card>
          }
        >
          {(statements) => (
            <div className="space-y-4">
              {statements.map((statement) => (
                <Card key={statement.id}>
                  <CardHeader>
                    <CardTitle>{statement.periodLabel}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge tone={STATUS_TONE[statement.status]} className="capitalize">
                        {statement.status}
                      </Badge>
                      <Button size="sm" variant="outline">
                        <Download className="size-3.5" /> Statement
                      </Button>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <div className="divide-y divide-ink-100 dark:divide-ink-800">
                      {statement.lines.map((line) => (
                        <div key={line.id} className="flex items-center justify-between py-2 text-sm">
                          <span className="text-ink-600 dark:text-ink-300">{line.label}</span>
                          <span className={`font-semibold ${LINE_TONE[line.type]}`}>
                            {line.amount < 0 ? "-" : ""}
                            {formatINR(Math.abs(line.amount))}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 flex items-center justify-between border-t border-ink-100 pt-3 dark:border-ink-800">
                      <span className="font-display font-semibold text-ink-900 dark:text-white">Total</span>
                      <span className="font-display text-lg font-bold text-ink-900 dark:text-white">{formatINR(statement.total)}</span>
                    </div>
                    {statement.payoutDate && (
                      <p className="mt-2 text-xs text-ink-400 dark:text-ink-500">Paid out on {formatFullDate(statement.payoutDate)}</p>
                    )}
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </DataState>
      </div>
    </div>
  );
}
