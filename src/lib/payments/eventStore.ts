import type { EntitlementRecord, OrderRecord, PaymentRecord } from "./types";

/** Narrow surface the payment-processing logic needs from a transactional
 *  store, so the business logic (src/lib/payments/processPayment.ts) never
 *  talks to Firestore directly and can be unit-tested against a plain
 *  in-memory fake instead of a real database or emulator. */
export interface TransactionCtx {
  /** Async because a real Firestore transaction's reads are async and must
   *  all happen before any writes — this interface mirrors that contract
   *  even though the in-memory test double doesn't strictly need it to be. */
  getOrder(orderId: string): Promise<OrderRecord | null>;
  setOrder(order: OrderRecord): void;
  setPayment(payment: PaymentRecord): void;
  setEntitlement(entitlement: EntitlementRecord): void;
}

export interface EventStore {
  /** Runs `fn` exactly once for a given `eventKey`, atomically with its
   *  writes. A second call with the same key is a no-op that reports
   *  "duplicate" instead of re-running `fn` — this is the idempotency
   *  guarantee duplicate Razorpay webhook deliveries rely on. */
  runIdempotent(eventKey: string, fn: (ctx: TransactionCtx) => Promise<void>): Promise<"processed" | "duplicate">;
}

/** In-memory implementation used by unit tests (and available for local
 *  dev without Firebase Admin credentials configured). Not for production —
 *  see firestoreEventStore.ts for the durable Firestore-backed version. */
export class InMemoryEventStore implements EventStore {
  private seenKeys = new Set<string>();
  orders = new Map<string, OrderRecord>();
  payments = new Map<string, PaymentRecord>();
  entitlements = new Map<string, EntitlementRecord>();

  async runIdempotent(eventKey: string, fn: (ctx: TransactionCtx) => Promise<void>): Promise<"processed" | "duplicate"> {
    if (this.seenKeys.has(eventKey)) return "duplicate";
    this.seenKeys.add(eventKey);
    const ctx: TransactionCtx = {
      getOrder: async (orderId) => this.orders.get(orderId) ?? null,
      setOrder: (order) => this.orders.set(order.orderId, order),
      setPayment: (payment) => this.payments.set(payment.paymentId, payment),
      setEntitlement: (entitlement) => this.entitlements.set(entitlement.id, entitlement),
    };
    await fn(ctx);
    return "processed";
  }
}
