import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const priorityEnum = z.enum(["low", "normal", "high", "urgent"]);
const statusEnum = z.enum(["pending", "in_progress", "done", "cancelled"]);

export const createTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      lead_id: z.string().uuid(),
      title: z.string().trim().min(1).max(200),
      description: z.string().trim().max(2000).optional().nullable(),
      due_at: z.string().datetime().optional().nullable(),
      priority: priorityEnum.default("normal"),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("tasks")
      .insert({
        lead_id: data.lead_id,
        title: data.title,
        description: data.description ?? null,
        due_at: data.due_at ?? null,
        priority: data.priority,
        assigned_to: context.userId,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    await context.supabase.from("activities").insert({
      lead_id: data.lead_id, actor_id: context.userId,
      kind: "task.created", payload: { title: data.title, priority: data.priority },
    });
    return row;
  });

export const updateTaskStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), status: statusEnum }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("tasks").update({ status: data.status }).eq("id", data.id)
      .select("*").single();
    if (error) throw new Error(error.message);
    if (row.lead_id) {
      await context.supabase.from("activities").insert({
        lead_id: row.lead_id, actor_id: context.userId,
        kind: "task.status_changed", payload: { task_id: row.id, status: data.status, title: row.title },
      });
    }
    return row;
  });

export const deleteTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("tasks").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const labelEnum = z.enum([
  "hot", "warm", "cold", "high_value", "nri",
  "parent", "adult_learner", "certification", "professional",
]);

export const toggleLeadLabel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      lead_id: z.string().uuid(),
      label: labelEnum,
      on: z.boolean(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    if (data.on) {
      const { error } = await context.supabase
        .from("lead_label_assignments")
        .insert({ lead_id: data.lead_id, label: data.label });
      if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    } else {
      const { error } = await context.supabase
        .from("lead_label_assignments")
        .delete()
        .eq("lead_id", data.lead_id)
        .eq("label", data.label);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });
