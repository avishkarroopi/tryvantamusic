import { useEffect, useState } from "react";
import { Mail, MapPin, Phone, Save } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { useToast } from "@/hooks/useToast";
import { teacherService } from "@/services";
import type { Teacher } from "@/domain/types";

export function ProfilePage() {
  const { push } = useToast();
  const state = useAsync(() => teacherService.getProfile(), []);
  const [draft, setDraft] = useState<Teacher | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (state.data) setDraft(state.data);
  }, [state.data]);

  async function handleSave() {
    if (!draft) return;
    setSaving(true);
    try {
      await teacherService.updateProfile(draft);
      push({ kind: "success", title: "Profile updated" });
    } finally {
      setSaving(false);
    }
  }

  if (state.loading || !draft) return <CardSkeleton rows={8} />;

  return (
    <div>
      <PageHeader
        title="My Profile"
        description="This is what students and staff see about you."
        actions={
          <Button onClick={handleSave} loading={saving}>
            <Save className="size-4" /> Save changes
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardBody className="flex flex-col items-center text-center">
            <Avatar name={draft.name} size="xl" />
            <p className="mt-3 font-display text-lg font-bold text-ink-900 dark:text-white">{draft.name}</p>
            <p className="text-sm text-ink-500 dark:text-ink-400">Teacher</p>
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {draft.categories.map((c) => (
                <Badge key={c} tone="brand" className="capitalize">
                  {c}
                </Badge>
              ))}
              {draft.isKidFriendly && <Badge tone="success">Kid-friendly</Badge>}
              {draft.isTrialEligible && <Badge tone="warning">Trial eligible</Badge>}
            </div>
            <div className="mt-5 w-full space-y-2 text-left text-sm">
              <p className="flex items-center gap-2 text-ink-600 dark:text-ink-300">
                <Mail className="size-4 text-ink-400" /> {draft.email}
              </p>
              <p className="flex items-center gap-2 text-ink-600 dark:text-ink-300">
                <Phone className="size-4 text-ink-400" /> {draft.phone}
              </p>
              <p className="flex items-center gap-2 text-ink-600 dark:text-ink-300">
                <MapPin className="size-4 text-ink-400" /> {draft.city}, {draft.state}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-ink-700 dark:text-ink-200">Introduction</label>
              <textarea
                rows={5}
                value={draft.introduction}
                onChange={(e) => setDraft({ ...draft, introduction: e.target.value })}
                className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-400 dark:border-ink-700 dark:bg-ink-950 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-ink-700 dark:text-ink-200">Languages</label>
                <p className="text-sm text-ink-600 dark:text-ink-300">{draft.languages.join(", ")}</p>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-ink-700 dark:text-ink-200">Batch limit</label>
                <p className="text-sm text-ink-600 dark:text-ink-300">{draft.batchLimit} students</p>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-ink-700 dark:text-ink-200">Joined</label>
                <p className="text-sm text-ink-600 dark:text-ink-300">
                  {new Date(draft.joinedDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-ink-700 dark:text-ink-200">Status</label>
                <Badge tone="success" className="capitalize">
                  {draft.status}
                </Badge>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
