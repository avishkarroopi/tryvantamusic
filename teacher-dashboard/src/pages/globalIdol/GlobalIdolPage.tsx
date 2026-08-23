import { Medal, Star, Trophy } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { useToast } from "@/hooks/useToast";
import { students } from "@/mocks/seed";

const LEADERBOARD = [
  { rank: 1, name: "Myra Joshi", points: 980, instrument: "Piano" },
  { rank: 2, name: "Ishaan Verma", points: 910, instrument: "Piano" },
  { rank: 3, name: "Zara Sheikh", points: 875, instrument: "Guitar" },
];

const MEDAL_COLORS = ["text-amber-500", "text-ink-400", "text-amber-700"];

export function GlobalIdolPage() {
  const { push } = useToast();

  return (
    <div>
      <PageHeader title="Global Idol" description="A global stage for your students to showcase their talent and compete." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>This season's leaderboard</CardTitle>
            <Badge tone="brand">Season 4</Badge>
          </CardHeader>
          <CardBody className="space-y-2">
            {LEADERBOARD.map((entry) => (
              <div key={entry.rank} className="flex items-center gap-3 rounded-xl border border-ink-100 p-3 dark:border-ink-800">
                <Medal className={`size-5 ${MEDAL_COLORS[entry.rank - 1] ?? "text-ink-300"}`} />
                <Avatar name={entry.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink-900 dark:text-white">{entry.name}</p>
                  <p className="text-xs text-ink-400 dark:text-ink-500">{entry.instrument}</p>
                </div>
                <p className="font-display text-sm font-bold text-ink-900 dark:text-white">{entry.points} pts</p>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nominate a student</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            <div className="flex items-center gap-2 rounded-xl bg-accent-50 p-3 text-sm text-accent-800 dark:bg-accent-500/10 dark:text-accent-300">
              <Trophy className="size-4 shrink-0" />
              Nominations close in 6 days.
            </div>
            {students.slice(0, 3).map((s) => (
              <div key={s.id} className="flex items-center gap-3 rounded-xl border border-ink-100 p-2.5 dark:border-ink-800">
                <Avatar name={s.name} size="sm" />
                <p className="flex-1 truncate text-sm font-semibold text-ink-900 dark:text-white">{s.name}</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => push({ kind: "success", title: "Nominated", description: `${s.name} was nominated for Global Idol.` })}
                >
                  <Star className="size-3.5" /> Nominate
                </Button>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
