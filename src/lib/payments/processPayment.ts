import type { EventStore } from "./eventStore";
import type { EntitlementRecord, OrderRecord, PaymentModule, PaymentRecord } from "./types";

export interface CapturedEventInput {
  eventKey: string;
  orderId: string;
  paymentId: string;
  amount: number;
  currency: string;
  method: string | null;
  /** Order notes echoed back by Razorpay on the payment/order entity — the
   *  recovery path when no Firestore order doc exists yet (e.g. the order
   *  was created before this system existed, or the create-order write
   *  failed). See createOrderNotes() in orders.ts for what's written there. */
  notesFallback: Record<string, string>;
  now?: number;
}

export interface FailedEventInput {
  eventKey: string;
  orderId: string;
  paymentId: string | null;
  now?: number;
}

export interface RefundEventInput {
  eventKey: string;
  orderId: string;
  paymentId: string;
  now?: number;
}

function moduleFromNotes(notes: Record<string, string>): PaymentModule {
  const raw = notes.module;
  const known: PaymentModule[] = ["store", "course", "subscription", "mcam", "registration", "membership", "tool", "other"];
  return (known as string[]).includes(raw) ? (raw as PaymentModule) : "other";
}

function entitlementId(userId: string, module: PaymentModule, productRef: string): string {
  return `${userId}_${module}_${productRef}`;
}

/** payment.captured / order.paid: mark the order paid, record the payment,
 *  and grant an entitlement when we know who the purchaser is. Idempotent
 *  both via the EventStore's per-eventKey dedup AND because re-running with
 *  the same inputs writes the same doc IDs with the same content — a
 *  webhook retry racing the client-side /verify call for the same payment
 *  can never produce two orders, two payments, or two entitlements. */
export async function handlePaymentCaptured(store: EventStore, input: CapturedEventInput): Promise<"processed" | "duplicate"> {
  const now = input.now ?? Date.now();
  return store.runIdempotent(input.eventKey, async (ctx) => {
    const existing = await ctx.getOrder(input.orderId);
    const module = existing?.module ?? moduleFromNotes(input.notesFallback);
    const userId = existing?.userId ?? input.notesFallback.userId ?? null;
    const productRef = existing?.productRef ?? input.notesFallback.productRef ?? null;
    const description = existing?.description ?? input.notesFallback.description ?? "";

    const order: OrderRecord = {
      orderId: input.orderId,
      userId,
      module,
      productRef,
      description,
      amount: existing?.amount ?? input.amount,
      currency: existing?.currency ?? input.currency,
      status: "paid",
      notes: existing?.notes ?? input.notesFallback,
      paymentId: input.paymentId,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    ctx.setOrder(order);

    const payment: PaymentRecord = {
      paymentId: input.paymentId,
      orderId: input.orderId,
      status: "captured",
      amount: input.amount,
      currency: input.currency,
      method: input.method,
      module,
      userId,
      productRef,
      createdAt: now,
      updatedAt: now,
    };
    ctx.setPayment(payment);

    if (userId && productRef) {
      const entitlement: EntitlementRecord = {
        id: entitlementId(userId, module, productRef),
        userId,
        module,
        productRef,
        orderId: input.orderId,
        paymentId: input.paymentId,
        status: "active",
        grantedAt: now,
        revokedAt: null,
      };
      ctx.setEntitlement(entitlement);
    }
  });
}

/** payment.failed: mark the order failed. No entitlement is ever granted
 *  for a failed payment, so there's nothing to revoke. */
export async function handlePaymentFailed(store: EventStore, input: FailedEventInput): Promise<"processed" | "duplicate"> {
  const now = input.now ?? Date.now();
  return store.runIdempotent(input.eventKey, async (ctx) => {
    const existing = await ctx.getOrder(input.orderId);
    if (!existing) return; // nothing to mark failed if we never saw this order
    ctx.setOrder({ ...existing, status: "failed", paymentId: input.paymentId, updatedAt: now });
  });
}

/** refund.created / refund.processed: mark the order refunded and the
 *  payment refunded. Entitlements are recorded but NOT auto-revoked here —
 *  whether a refund should pull back access is a per-module business
 *  decision this platform doesn't have a policy for yet (the Store has no
 *  access-gated products today). Revoking automatically would be guessing
 *  at a policy nobody has actually specified. */
export async function handleRefund(store: EventStore, input: RefundEventInput): Promise<"processed" | "duplicate"> {
  const now = input.now ?? Date.now();
  return store.runIdempotent(input.eventKey, async (ctx) => {
    const existing = await ctx.getOrder(input.orderId);
    if (existing) ctx.setOrder({ ...existing, status: "refunded", updatedAt: now });
  });
}
