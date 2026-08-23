import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, CalendarDays, MapPin, MessageSquareText, Phone } from "lucide-react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { batchService, studentService } from "@/services";
import type { Student } from "@/domain/types";

const STATUS_TONE: Record<Student["status"], BadgeTone> = {
  active: "success",
  trial: "warning",
  paused: "neutral",
  churned: "danger",
};

export function StudentDetailPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const studentState = useAsync(() => studentService.getStudent(studentId!), [studentId]);
  const batchesState = useAsync(() => batchService.listBatches(), []);

  if (studentState.loading) return <CardSkeleton rows={6} />;
  if (!studentState.data) {
    return (
      <Card>
        <CardBody>
          <p className="text-sm text-ink-500 dark:text-ink-400">Student not found.</p>
          <Link to="/dashboard/students" className="mt-2 inline-block text-sm font-semibold text-brand-600">
            Back to Students
          </Link>
        </CardBody>
      </Card>
    );
  }

  const student = studentState.data;
  const batch = (batchesState.data ?? []).find((b) => b.id === student.batchId);

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-3">
        <ArrowLeft className="size-4" /> Back
      </Button>

      <div className="mb-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={student.name} size="lg" />
          <div>
            <h1 className="font-display text-2xl font-bold text-ink-900 dark:text-white">{student.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge tone={STATUS_TONE[student.status]} className="capitalize">
                {student.status}
              </Badge>
              <Badge tone="neutral" className="capitalize">
                {student.instrument}
              </Badge>
              <Badge tone="neutral">{student.ageGroup}</Badge>
            </div>
          </div>
        </div>
        <Button onClick={() => navigate("/dashboard/messages")}>
          <MessageSquareText className="size-4" /> Message
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Learning progress</CardTitle>
          </CardHeader>
          <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Stat label="Hours completed" value={`${student.totalHoursCompleted.toFixed(1)}h`} />
            <Stat label="Joined" value={new Date(student.joinedDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} />
            <Stat label="Current batch" value={batch?.name ?? "Not assigned"} />
          </CardBody>
          {student.notes && (
            <CardBody className="border-t border-ink-100 dark:border-ink-800">
              <p className="text-sm font-semibold text-ink-800 dark:text-ink-100">Teaching notes</p>
              <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{student.notes}</p>
            </CardBody>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-ink-600 dark:text-ink-300">
              <Phone className="size-4 text-ink-400" /> {student.guardianPhone ?? "Not available"}
            </div>
            <div className="flex items-center gap-2 text-ink-600 dark:text-ink-300">
              <MapPin className="size-4 text-ink-400" /> {student.city ?? "—"}, Region {student.region}
            </div>
            <div className="flex items-center gap-2 text-ink-600 dark:text-ink-300">
              <CalendarDays className="size-4 text-ink-400" /> Guardian: {student.guardianName ?? "—"}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-ink-50 p-4 dark:bg-ink-800/60">
      <p className="font-display text-lg font-bold text-ink-900 dark:text-white">{value}</p>
      <p className="text-xs text-ink-500 dark:text-ink-400">{label}</p>
    </div>
  );
}
