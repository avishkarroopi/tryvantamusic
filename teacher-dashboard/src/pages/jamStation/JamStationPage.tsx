import { useState } from "react";
import { Guitar, Plus, Radio, Users } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/useToast";

interface JamRoom {
  id: string;
  name: string;
  instrument: string;
  host: string;
  listeners: number;
  isLive: boolean;
}

const ROOMS: JamRoom[] = [
  { id: "jam_1", name: "Friday Blues Jam", instrument: "Guitar", host: "Rohan D'Souza", listeners: 18, isLive: true },
  { id: "jam_2", name: "Piano Chill Sessions", instrument: "Piano", host: "Meera Krishnan", listeners: 9, isLive: true },
  { id: "jam_3", name: "Beginner Ukulele Circle", instrument: "Ukulele", host: "You", listeners: 0, isLive: false },
];

export function JamStationPage() {
  const { push } = useToast();
  const [rooms] = useState(ROOMS);

  return (
    <div>
      <PageHeader
        title="Jam Station"
        description="Join live collaborative jam sessions, or host your own for students."
        actions={
          <Button onClick={() => push({ kind: "info", title: "Room creation coming soon", description: "Hosting your own jam room will be available soon." })}>
            <Plus className="size-4" /> Host a jam
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {rooms.map((room) => (
          <Card key={room.id}>
            <CardBody>
              <div className="flex items-start justify-between">
                <div className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
                  <Guitar className="size-5" />
                </div>
                {room.isLive ? (
                  <Badge tone="danger">
                    <Radio className="size-3" /> Live
                  </Badge>
                ) : (
                  <Badge tone="neutral">Offline</Badge>
                )}
              </div>
              <p className="mt-3 font-display font-semibold text-ink-900 dark:text-white">{room.name}</p>
              <p className="text-xs text-ink-400 dark:text-ink-500">
                {room.instrument} · Hosted by {room.host}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-sm text-ink-500 dark:text-ink-400">
                  <Users className="size-4" /> {room.listeners} listening
                </span>
                <Button size="sm" variant={room.isLive ? "primary" : "outline"} disabled={!room.isLive}>
                  {room.isLive ? "Join" : "Start"}
                </Button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
