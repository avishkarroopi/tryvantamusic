import { useRef, useState } from "react";
import { Circle, Music4, Play, Square, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatFullDate } from "@/lib/date";
import { makeId } from "@/lib/id";

interface Recording {
  id: string;
  title: string;
  createdAt: string;
  durationLabel: string;
}

const SEED: Recording[] = [
  { id: "rec_1", title: "Nocturne Op.9 — practice take 3", createdAt: "2026-08-05", durationLabel: "2:14" },
  { id: "rec_2", title: "Warm-up scales", createdAt: "2026-07-28", durationLabel: "0:48" },
];

export function MusicStudioPage() {
  const [recordings, setRecordings] = useState<Recording[]>(SEED);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function startRecording() {
    setIsRecording(true);
    setElapsed(0);
    const start = Date.now();
    intervalRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
  }

  function stopRecording() {
    setIsRecording(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setElapsed((finalElapsed) => {
      const mins = Math.floor(finalElapsed / 60);
      const secs = finalElapsed % 60;
      setRecordings((prev) => [
        {
          id: makeId("rec"),
          title: `New take — ${new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`,
          createdAt: new Date().toISOString().slice(0, 10),
          durationLabel: `${mins}:${secs.toString().padStart(2, "0")}`,
        },
        ...prev,
      ]);
      return finalElapsed;
    });
  }

  return (
    <div>
      <PageHeader title="Music Studio" description="Record quick practice takes and demo clips to share with students." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardBody className="flex flex-col items-center gap-4 py-10 text-center">
            <div
              className={`flex size-20 items-center justify-center rounded-full ${
                isRecording
                  ? "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400"
                  : "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300"
              }`}
            >
              <Music4 className="size-9" />
            </div>
            <p className="font-display text-2xl font-bold tabular-nums text-ink-900 dark:text-white">
              {Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, "0")}
            </p>
            <Button onClick={isRecording ? stopRecording : startRecording} variant={isRecording ? "danger" : "primary"}>
              {isRecording ? <Square className="size-4" /> : <Circle className="size-4 fill-current" />}
              {isRecording ? "Stop recording" : "Start recording"}
            </Button>
            <p className="text-xs text-ink-400 dark:text-ink-500">Local demo recorder — audio isn't actually captured in this preview.</p>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Your recordings</CardTitle>
          </CardHeader>
          <CardBody>
            {recordings.length === 0 ? (
              <EmptyState title="No recordings yet" description="Start recording to save your first take." />
            ) : (
              <div className="space-y-2">
                {recordings.map((r) => (
                  <div key={r.id} className="flex items-center justify-between rounded-xl border border-ink-100 p-3 dark:border-ink-800">
                    <div className="flex items-center gap-3">
                      <button className="flex size-9 items-center justify-center rounded-full bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300">
                        <Play className="size-4" />
                      </button>
                      <div>
                        <p className="text-sm font-semibold text-ink-900 dark:text-white">{r.title}</p>
                        <p className="text-xs text-ink-400 dark:text-ink-500">
                          {formatFullDate(r.createdAt)} · {r.durationLabel}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setRecordings((prev) => prev.filter((x) => x.id !== r.id))}
                      aria-label="Delete recording"
                      className="rounded-md p-1.5 text-ink-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
