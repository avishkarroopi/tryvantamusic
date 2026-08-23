import { RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";
import { Info } from "lucide-react";
import type { HealthScore } from "@/domain/types";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatFullDate } from "@/lib/date";

function scoreColor(score: number): string {
  if (score >= 85) return "#22a06b";
  if (score >= 60) return "#fa8b0c";
  return "#e5484d";
}

export function HealthScoreCard({ health }: { health: HealthScore }) {
  const chartData = [{ name: "score", value: health.score, fill: scoreColor(health.score) }];
  const items = Object.values(health.breakup);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Teacher Health Score</CardTitle>
        <span className="text-xs font-medium text-ink-400 dark:text-ink-500">
          Refreshes {formatFullDate(health.nextChangeAt)}
        </span>
      </CardHeader>
      <CardBody className="grid grid-cols-1 gap-6 md:grid-cols-[10rem_1fr]">
        <div className="relative mx-auto h-40 w-40">
          <ResponsiveContainer>
            <RadialBarChart
              innerRadius="72%"
              outerRadius="100%"
              data={chartData}
              startAngle={90}
              endAngle={-270}
            >
              <RadialBar dataKey="value" cornerRadius={20} background={{ fill: "var(--color-ink-100)" }} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-3xl font-extrabold text-ink-900 dark:text-white">{health.score}</span>
            <span className="text-xs font-semibold text-ink-400 dark:text-ink-500">out of 100</span>
          </div>
        </div>

        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.label}>
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-800 dark:text-ink-100">
                  {item.label}
                  <span className="group relative">
                    <Info className="size-3.5 text-ink-300 dark:text-ink-600" />
                    <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-56 -translate-x-1/2 rounded-lg bg-ink-900 p-2.5 text-xs font-normal text-white opacity-0 shadow-pop transition-opacity group-hover:opacity-100 dark:bg-ink-700">
                      {item.information}
                      <span className="mt-1 block text-ink-300">Benchmark: {item.benchmark}</span>
                    </span>
                  </span>
                </span>
                <span className="text-sm font-bold text-ink-900 dark:text-white">{item.score}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
                <div
                  className="h-full rounded-full transition-[width] duration-500"
                  style={{ width: `${item.score}%`, backgroundColor: scoreColor(item.score) }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
