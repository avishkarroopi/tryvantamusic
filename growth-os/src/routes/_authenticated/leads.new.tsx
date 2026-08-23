import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createLead } from "@/lib/leads.functions";

export const Route = createFileRoute("/_authenticated/leads/new")({
  component: NewLeadPage,
});

function NewLeadPage() {
  const navigate = useNavigate();
  const createFn = useServerFn(createLead);
  const [state, setState] = useState({
    name: "", parent_name: "", student_name: "", phone: "", email: "",
    country: "", city: "", instrument: "", learning_goal: "" as string,
    skill_level: "" as string, source: "manual" as string,
    utm_source: "", utm_medium: "", utm_campaign: "",
    notes: "",
  });

  const set = (k: string, v: string) => setState((s) => ({ ...s, [k]: v }));

  const mutation = useMutation({
    mutationFn: createFn,
    onSuccess: (row) => {
      toast.success("Lead captured");
      navigate({ to: "/leads/$id", params: { id: row.id } });
    },
    onError: (e) => toast.error(e.message),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      data: {
        ...state,
        age: null,
        learning_goal: (state.learning_goal || null) as never,
        skill_level: (state.skill_level || null) as never,
        source: state.source as never,
      },
    });
  };

  return (
    <>
      <PageHeader title="New lead" description="Manual capture. Every field feeds scoring & attribution." />
      <div className="p-6 md:p-8 max-w-3xl">
        <form onSubmit={submit} className="grid gap-5">
          <Section title="Identity">
            <Field label="Name"><Input value={state.name} onChange={(e) => set("name", e.target.value)} /></Field>
            <Field label="Student name"><Input value={state.student_name} onChange={(e) => set("student_name", e.target.value)} /></Field>
            <Field label="Parent name"><Input value={state.parent_name} onChange={(e) => set("parent_name", e.target.value)} /></Field>
            <Field label="Phone"><Input value={state.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
            <Field label="Email"><Input type="email" value={state.email} onChange={(e) => set("email", e.target.value)} /></Field>
          </Section>

          <Section title="Location">
            <Field label="Country"><Input value={state.country} onChange={(e) => set("country", e.target.value)} /></Field>
            <Field label="City"><Input value={state.city} onChange={(e) => set("city", e.target.value)} /></Field>
          </Section>

          <Section title="Interest">
            <Field label="Instrument"><Input placeholder="e.g. Piano, Guitar…" value={state.instrument} onChange={(e) => set("instrument", e.target.value)} /></Field>
            <Field label="Skill level">
              <select className="h-9 rounded-md border border-input bg-background px-3 text-sm w-full" value={state.skill_level} onChange={(e) => set("skill_level", e.target.value)}>
                <option value="">—</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </Field>
            <Field label="Learning goal">
              <select className="h-9 rounded-md border border-input bg-background px-3 text-sm w-full" value={state.learning_goal} onChange={(e) => set("learning_goal", e.target.value)}>
                <option value="">—</option>
                <option value="hobby">Hobby</option>
                <option value="certification">Certification</option>
                <option value="professional">Professional</option>
                <option value="teacher_training">Teacher training</option>
              </select>
            </Field>
          </Section>

          <Section title="Attribution">
            <Field label="Source">
              <select className="h-9 rounded-md border border-input bg-background px-3 text-sm w-full" value={state.source} onChange={(e) => set("source", e.target.value)}>
                {["manual","website","facebook_ads","instagram_ads","whatsapp","google_ads","organic","referral","other"].map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                ))}
              </select>
            </Field>
            <Field label="UTM source"><Input value={state.utm_source} onChange={(e) => set("utm_source", e.target.value)} /></Field>
            <Field label="UTM medium"><Input value={state.utm_medium} onChange={(e) => set("utm_medium", e.target.value)} /></Field>
            <Field label="UTM campaign"><Input value={state.utm_campaign} onChange={(e) => set("utm_campaign", e.target.value)} /></Field>
          </Section>

          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Notes</Label>
            <Textarea value={state.notes} onChange={(e) => set("notes", e.target.value)} rows={3} className="mt-1.5" />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => navigate({ to: "/leads" })}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving…" : "Create lead"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">{title}</div>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
