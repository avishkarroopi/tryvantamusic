import crypto from "crypto";

/** Razorpay webhook event body, as documented for payment/order/refund
 *  events. Only the fields this module actually reads. */
export interface RazorpayWebhookBody {
  id?: string; // present on some Razorpay accounts/API versions — used when available
  event?: string;
  created_at?: number;
  payload?: {
    payment?: { entity?: { id?: string; order_id?: string; amount?: number; currency?: string; status?: string; method?: string; notes?: Record<string, string> } };
    order?: { entity?: { id?: string; amount?: number; currency?: string; status?: string; notes?: Record<string, string> } };
    refund?: { entity?: { id?: string; payment_id?: string; amount?: number; currency?: string; status?: string } };
  };
}

/** Derives a stable idempotency key for a webhook delivery.
 *
 *  IMPORTANT CAVEAT (verify against real webhook logs during testing): not
 *  every Razorpay account/API version echoes a dedicated top-level event id
 *  in the webhook body the way Stripe does. Rather than assume one exists,
 *  this prefers `body.id` when Razorpay does send it, and otherwise derives
 *  a deterministic key from (event type + primary entity id + created_at).
 *  Razorpay resends the byte-identical payload on retry, so this derived
 *  key is stable across retries of the same delivery and distinct across
 *  genuinely different events — which is all idempotency requires. */
export function computeEventKey(body: RazorpayWebhookBody): string {
  if (typeof body.id === "string" && body.id.length > 0) return body.id;

  const entity =
    body.payload?.payment?.entity ?? body.payload?.order?.entity ?? body.payload?.refund?.entity ?? undefined;
  const primaryId = entity?.id ?? "unknown";
  const raw = `${body.event ?? "unknown"}|${primaryId}|${body.created_at ?? ""}`;
  return crypto.createHash("sha256").update(raw).digest("hex");
}

/** Pulls out the fields the event-processing layer needs, regardless of
 *  which entity the webhook is primarily about. */
export function extractEventSummary(body: RazorpayWebhookBody) {
  const payment = body.payload?.payment?.entity;
  const order = body.payload?.order?.entity;
  const refund = body.payload?.refund?.entity;
  return {
    type: body.event ?? "unknown",
    orderId: payment?.order_id ?? order?.id ?? null,
    paymentId: payment?.id ?? refund?.payment_id ?? null,
    refundId: refund?.id ?? null,
    amount: payment?.amount ?? order?.amount ?? refund?.amount ?? null,
    currency: payment?.currency ?? order?.currency ?? refund?.currency ?? null,
    method: payment?.method ?? null,
    notes: payment?.notes ?? order?.notes ?? {},
  };
}
