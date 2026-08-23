import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const captureSchema = z.object({
  name: z.string().trim().max(200).optional().nullable(),
  parent_name: z.string().trim().max(200).optional().nullable(),
  student_name: z.string().trim().max(200).optional().nullable(),
  phone: z.string().trim().max(40).optional().nullable(),
  email: z.string().trim().email().max(255).optional().nullable(),
  age: z.number().int().min(1).max(120).optional().nullable(),
  country: z.string().trim().max(100).optional().nullable(),
  city: z.string().trim().max(100).optional().nullable(),
  instrument: z.string().trim().max(100).optional().nullable(),
  source: z.enum([
    "website","facebook_ads","instagram_ads","whatsapp",
    "google_ads","organic","referral","manual","other",
  ]).default("website"),
  campaign_source: z.string().trim().max(200).optional().nullable(),
  utm_source: z.string().trim().max(200).optional().nullable(),
  utm_medium: z.string().trim().max(200).optional().nullable(),
  utm_campaign: z.string().trim().max(200).optional().nullable(),
  utm_content: z.string().trim().max(200).optional().nullable(),
  utm_term: z.string().trim().max(200).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  source_metadata: z.record(z.string(), z.unknown()).optional(),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, apikey",
};

export const Route = createFileRoute("/api/public/leads/capture")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { status: 204, headers: corsHeaders }),
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400, headers: corsHeaders });
        }
        const parsed = captureSchema.safeParse(body);
        if (!parsed.success) {
          return Response.json(
            { error: "Validation failed", issues: parsed.error.issues },
            { status: 400, headers: corsHeaders },
          );
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const insert = { ...parsed.data, email: parsed.data.email || null } as never;
        const { data, error } = await supabaseAdmin
          .from("leads").insert(insert).select("id").single();
        if (error) {
          return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
        }

        await supabaseAdmin.from("activities").insert({
          lead_id: data.id, kind: "lead.captured",
          payload: { source: parsed.data.source, via: "public_api" },
        });
        await supabaseAdmin.from("notifications").insert({
          user_id: null, type: "new_lead",
          title: `New lead via ${parsed.data.source}`,
          body: parsed.data.name ?? parsed.data.email ?? parsed.data.phone ?? "unknown",
          lead_id: data.id,
        });

        return Response.json({ ok: true, id: data.id }, { headers: corsHeaders });
      },
    },
  },
});
