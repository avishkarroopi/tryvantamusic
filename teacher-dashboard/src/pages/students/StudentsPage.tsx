import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataState } from "@/components/ui/DataState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { studentService } from "@/services";
import type { Student } from "@/domain/types";

const STATUS_TONE: Record<Student["status"], BadgeTone> = {
  active: "success",
  trial: "warning",
  paused: "neutral",
  churned: "danger",
};

export function StudentsPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const state = useAsync(() => studentService.listStudents(), []);

  const filtered = useMemo(() => {
    const list = state.data ?? [];
    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter((s) => s.name.toLowerCase().includes(q) || s.instrument.toLowerCase().includes(q));
  }, [state.data, query]);

  return (
    <div>
      <PageHeader title="Students" description="Everyone you currently teach, across all batches." />

      <div className="mb-4 relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or instrument…"
          className="h-10 w-full rounded-lg border border-ink-200 bg-white pl-9 pr-3 text-sm text-ink-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-ink-700 dark:bg-ink-900 dark:text-white dark:focus:ring-brand-500/20"
        />
      </div>

      <Card>
        <DataState
          state={state}
          skeleton={<TableSkeleton rows={6} cols={5} />}
          isEmpty={() => filtered.length === 0}
          empty={<EmptyState title="No students found" description="Try a different search term." />}
        >
          {() => (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-ink-100 text-xs uppercase tracking-wide text-ink-400 dark:border-ink-800 dark:text-ink-500">
                    <th className="px-5 py-3 font-semibold">Student</th>
                    <th className="px-5 py-3 font-semibold">Instrument</th>
                    <th className="px-5 py-3 font-semibold">Age group</th>
                    <th className="px-5 py-3 font-semibold">Hours</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr
                      key={s.id}
                      onClick={() => navigate(`/dashboard/students/${s.id}`)}
                      className="cursor-pointer border-b border-ink-50 last:border-0 hover:bg-ink-50 dark:border-ink-800/60 dark:hover:bg-ink-800/40"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={s.name} size="sm" />
                          <span className="font-semibold text-ink-900 dark:text-white">{s.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 capitalize text-ink-600 dark:text-ink-300">{s.instrument}</td>
                      <td className="px-5 py-3 text-ink-600 dark:text-ink-300">{s.ageGroup}</td>
                      <td className="px-5 py-3 text-ink-600 dark:text-ink-300">{s.totalHoursCompleted.toFixed(1)}h</td>
                      <td className="px-5 py-3">
                        <Badge tone={STATUS_TONE[s.status]} className="capitalize">
                          {s.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DataState>
      </Card>
    </div>
  );
}
