import { Mail, Phone } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { useToast } from "@/hooks/useToast";
import { contactService } from "@/services";
import { formatFullDate } from "@/lib/date";
import type { MeetingRequestStatus } from "@/domain/types";

const STATUS_TONE: Record<MeetingRequestStatus, BadgeTone> = {
  pending: "warning",
  accepted: "success",
  completed: "brand",
  rejected: "danger",
};

export function ContactsPage() {
  const { push } = useToast();
  const contactsState = useAsync(() => contactService.listContacts(), []);
  const meetingsState = useAsync(() => contactService.listMeetingRequests(), []);

  async function respond(id: string, accept: boolean) {
    await contactService.respondToMeetingRequest(id, accept);
    push({ kind: accept ? "success" : "info", title: accept ? "Meeting accepted" : "Meeting declined" });
    meetingsState.refetch();
  }

  return (
    <div>
      <PageHeader title="Contacts" description="Your assigned support staff and pending meeting requests." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Your team</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            {contactsState.loading ? (
              <CardSkeleton rows={2} />
            ) : (
              (contactsState.data ?? []).map((c) => (
                <div key={c.id} className="flex items-center gap-3 rounded-xl border border-ink-100 p-3 dark:border-ink-800">
                  <Avatar name={c.name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold text-ink-900 dark:text-white">{c.name}</p>
                      <Badge tone="neutral">{c.kind}</Badge>
                    </div>
                    <p className="text-xs text-ink-500 dark:text-ink-400">{c.role}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <a
                      href={`mailto:${c.email}`}
                      aria-label={`Email ${c.name}`}
                      className="rounded-lg p-2 text-ink-400 hover:bg-ink-100 hover:text-brand-600 dark:hover:bg-ink-800"
                    >
                      <Mail className="size-4" />
                    </a>
                    {c.phone && (
                      <a
                        href={`tel:${c.phone}`}
                        aria-label={`Call ${c.name}`}
                        className="rounded-lg p-2 text-ink-400 hover:bg-ink-100 hover:text-brand-600 dark:hover:bg-ink-800"
                      >
                        <Phone className="size-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Meeting requests</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            {meetingsState.loading ? (
              <CardSkeleton rows={2} />
            ) : (meetingsState.data ?? []).length === 0 ? (
              <EmptyState title="No meeting requests" description="Requests from parents or staff will show up here." />
            ) : (
              (meetingsState.data ?? []).map((m) => (
                <div key={m.id} className="rounded-xl border border-ink-100 p-3 dark:border-ink-800">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-ink-900 dark:text-white">{m.withName}</p>
                      <p className="text-xs text-ink-400 dark:text-ink-500">{m.withRole}</p>
                    </div>
                    <Badge tone={STATUS_TONE[m.status]} className="capitalize">
                      {m.status}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-ink-600 dark:text-ink-300">{m.reason}</p>
                  <p className="mt-1 text-xs text-ink-400 dark:text-ink-500">Proposed for {formatFullDate(m.proposedDate)}</p>
                  {m.status === "pending" && (
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" onClick={() => respond(m.id, true)}>
                        Accept
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => respond(m.id, false)}>
                        Decline
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
