// Meta WhatsApp Cloud API webhook.
// GET  -> hub.mode=subscribe verification: echoes hub.challenge when hub.verify_token matches.
// POST -> receives message events / status updates; verifies X-Hub-Signature-256 using META_APP_SECRET.
// Responds 200 quickly (per Meta guidance) — heavy processing happens async / logs only.
//
// Required secrets (Lovable Cloud secrets, read via process.env at request time):
//   WHATSAPP_VERIFY_TOKEN  – any random string; must match value pasted into Meta App dashboard.
//   META_APP_SECRET        – App Secret from Meta App Settings > Basic. Used to verify signature.
//
// Public URL (stable, HTTPS):
//   https://project--24be85bd-b434-4c06-956e-a10034e0fdf0.lovable.app/api/meta/webhook

import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "node:crypto";

function verifySignature(rawBody: string, headerSig: string | null, appSecret: string): boolean {
  if (!headerSig || !headerSig.startsWith("sha256=")) return false;
  const provided = headerSig.slice("sha256=".length).trim();
  const expected = createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex");
  const a = Buffer.from(provided, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length === 0 || a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

type WhatsAppChange = {
  field?: string;
  value?: {
    messaging_product?: string;
    metadata?: { display_phone_number?: string; phone_number_id?: string };
    contacts?: Array<{ wa_id?: string; profile?: { name?: string } }>;
    messages?: Array<{
      id?: string;
      from?: string;
      timestamp?: string;
      type?: string;
      text?: { body?: string };
      button?: { text?: string; payload?: string };
      interactive?: unknown;
      image?: unknown;
      audio?: unknown;
      video?: unknown;
      document?: unknown;
      location?: unknown;
    }>;
    statuses?: Array<{
      id?: string;
      status?: "sent" | "delivered" | "read" | "failed" | string;
      timestamp?: string;
      recipient_id?: string;
      conversation?: { id?: string; origin?: { type?: string } };
      pricing?: { billable?: boolean; pricing_model?: string; category?: string };
      errors?: Array<{ code?: number; title?: string; message?: string }>;
    }>;
  };
};

type WhatsAppWebhookPayload = {
  object?: string;
  entry?: Array<{ id?: string; time?: number; changes?: WhatsAppChange[] }>;
};

function logEvent(payload: WhatsAppWebhookPayload): void {
  const entries = payload.entry ?? [];
  for (const entry of entries) {
    for (const change of entry.changes ?? []) {
      const v = change.value ?? {};
      const phoneId = v.metadata?.phone_number_id;
      for (const msg of v.messages ?? []) {
        console.log("[meta-webhook] message", {
          phone_number_id: phoneId,
          from: msg.from,
          id: msg.id,
          type: msg.type,
          timestamp: msg.timestamp,
          text: msg.text?.body?.slice(0, 500),
          button: msg.button?.text,
        });
      }
      for (const st of v.statuses ?? []) {
        console.log("[meta-webhook] status", {
          phone_number_id: phoneId,
          id: st.id,
          status: st.status,
          recipient_id: st.recipient_id,
          timestamp: st.timestamp,
          errors: st.errors,
        });
      }
      if ((v.messages?.length ?? 0) === 0 && (v.statuses?.length ?? 0) === 0) {
        console.log("[meta-webhook] change", { field: change.field, value: v });
      }
    }
  }
}

export const Route = createFileRoute("/api/meta/webhook")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const mode = url.searchParams.get("hub.mode");
        const token = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge");

        const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
        console.log("[meta-webhook] verify", {
          mode,
          hasChallenge: Boolean(challenge),
          tokenConfigured: Boolean(verifyToken),
          tokenMatches: Boolean(verifyToken) && token === verifyToken,
        });

        if (!verifyToken) {
          return new Response("WHATSAPP_VERIFY_TOKEN not configured", { status: 500 });
        }
        if (mode === "subscribe" && token === verifyToken && challenge) {
          return new Response(challenge, {
            status: 200,
            headers: { "content-type": "text/plain; charset=utf-8" },
          });
        }
        return new Response("Forbidden", { status: 403 });
      },

      POST: async ({ request }) => {
        const appSecret = process.env.META_APP_SECRET;
        const signature = request.headers.get("x-hub-signature-256");
        const rawBody = await request.text();

        if (!appSecret) {
          console.error("[meta-webhook] META_APP_SECRET not configured — cannot verify signature");
          // Still 200 so Meta doesn't disable the webhook; log for operator.
          return new Response("ok", { status: 200 });
        }
        if (!verifySignature(rawBody, signature, appSecret)) {
          console.warn("[meta-webhook] signature verification failed", {
            hasHeader: Boolean(signature),
            bodyLength: rawBody.length,
          });
          return new Response("invalid signature", { status: 401 });
        }

        let payload: WhatsAppWebhookPayload = {};
        try {
          payload = JSON.parse(rawBody) as WhatsAppWebhookPayload;
        } catch {
          console.error("[meta-webhook] invalid JSON body");
          return new Response("ok", { status: 200 });
        }

        try {
          logEvent(payload);
        } catch (err) {
          console.error("[meta-webhook] logEvent failed", err);
        }

        // Meta requires a fast 200. Return immediately; any long-running work
        // should be pushed to a queue by a follow-up change.
        return new Response("ok", { status: 200 });
      },
    },
  },
});
