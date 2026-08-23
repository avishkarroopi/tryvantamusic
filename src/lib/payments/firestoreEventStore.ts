import type { Firestore } from "firebase-admin/firestore";
import { getAdminFirestore } from "./firebaseAdmin";
import type { EventStore, TransactionCtx } from "./eventStore";
import type { EntitlementRecord, OrderRecord, PaymentEventRecord, PaymentRecord } from "./types";

const EVENTS = "payment_events";
const ORDERS = "orders";
const PAYMENTS = "payments";
const ENTITLEMENTS = "entitlements";

/** Production EventStore: one Firestore transaction per webhook delivery.
 *  The `payment_events/{eventKey}` doc IS the idempotency lock — the
 *  transaction reads it first, and if it already exists, aborts (reporting
 *  "duplicate") without touching orders/payments/entitlements at all. If it
 *  doesn't exist, every write in the same callback lands atomically with
 *  creating that doc, so a crash or retry mid-way can never leave a partial
 *  duplicate side effect: either the whole transaction lands once, or it
 *  doesn't land at all and the next retry tries again cleanly. */
export class FirestoreEventStore implements EventStore {
  constructor(private db: Firestore = getAdminFirestore()) {}

  async runIdempotent(eventKey: string, fn: (ctx: TransactionCtx) => Promise<void>): Promise<"processed" | "duplicate"> {
    const db = this.db;
    const eventRef = db.collection(EVENTS).doc(eventKey);

    let result: "processed" | "duplicate" = "processed";

    await db.runTransaction(async (tx) => {
      const eventSnap = await tx.get(eventRef);
      if (eventSnap.exists) {
        result = "duplicate";
        return;
      }

      // Firestore transactions require ALL reads before ANY writes, so
      // getOrder here queues a read that resolves against the transaction
      // snapshot rather than issuing a fresh, non-transactional read.
      const orderReadCache = new Map<string, Promise<OrderRecord | null>>();
      const ctx: TransactionCtx = {
        getOrder: (orderId) => {
          if (!orderReadCache.has(orderId)) {
            orderReadCache.set(
              orderId,
              tx.get(db.collection(ORDERS).doc(orderId)).then((s) => (s.exists ? (s.data() as OrderRecord) : null)),
            );
          }
          return orderReadCache.get(orderId)!;
        },
        setOrder: (order) => tx.set(db.collection(ORDERS).doc(order.orderId), order, { merge: true }),
        setPayment: (payment) => tx.set(db.collection(PAYMENTS).doc(payment.paymentId), payment, { merge: true }),
        setEntitlement: (entitlement) => tx.set(db.collection(ENTITLEMENTS).doc(entitlement.id), entitlement, { merge: true }),
      };

      await fn(ctx);

      tx.set(eventRef, { key: eventKey, receivedAt: Date.now() } satisfies Partial<PaymentEventRecord>, { merge: false });
    });

    return result;
  }
}

/** Direct, non-transactional writer for the create-order route: there's no
 *  idempotency concern at order-creation time (orderId is always fresh from
 *  Razorpay), so this is a plain set rather than going through EventStore. */
export async function writeOrderRecord(order: OrderRecord): Promise<void> {
  const db = getAdminFirestore();
  await db.collection(ORDERS).doc(order.orderId).set(order, { merge: true });
}

export async function readOrderRecord(orderId: string): Promise<OrderRecord | null> {
  const db = getAdminFirestore();
  const snap = await db.collection(ORDERS).doc(orderId).get();
  return snap.exists ? (snap.data() as OrderRecord) : null;
}

/** Best-effort audit write for the full raw webhook payload, kept separate
 *  from the idempotency-lock doc's minimal shape so a large payload never
 *  risks bloating the transaction. Safe to skip on failure — it's an audit
 *  trail addendum, not a correctness dependency. */
export async function writeEventAudit(record: PaymentEventRecord): Promise<void> {
  const db = getAdminFirestore();
  await db.collection(EVENTS).doc(record.key).set(record, { merge: true });
}
