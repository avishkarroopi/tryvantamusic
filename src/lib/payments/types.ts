// Shared vocabulary for every paid flow on the platform — Store today,
// courses/subscriptions/M-CAM services/registrations/memberships/tools as
// they come online. Nothing here is Store-specific; the Store is just the
// first module to plug into it.

/** Which part of the platform an order/payment belongs to. Extend this list
 *  as new paid modules ship — the webhook and event layer don't need to
 *  change to support a new value. */
export type PaymentModule =
  | "store"
  | "course"
  | "subscription"
  | "mcam"
  | "registration"
  | "membership"
  | "tool"
  | "other";

export type OrderStatus = "created" | "paid" | "failed" | "refunded";

export interface OrderRecord {
  orderId: string; // Razorpay order id — also the Firestore doc id in `orders`
  userId: string | null; // Firebase uid, when the purchaser was signed in at checkout time
  module: PaymentModule;
  productRef: string | null; // e.g. joined Store SKUs, a course id, a plan id
  description: string;
  amount: number; // subunits (paise/cents) — same unit Razorpay uses
  currency: string;
  status: OrderStatus;
  notes: Record<string, string>;
  paymentId: string | null;
  createdAt: number; // epoch ms
  updatedAt: number;
}

export type PaymentStatus = "captured" | "failed" | "refunded";

export interface PaymentRecord {
  paymentId: string; // Razorpay payment id — Firestore doc id in `payments`
  orderId: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  method: string | null;
  module: PaymentModule;
  userId: string | null;
  productRef: string | null;
  createdAt: number;
  updatedAt: number;
}

export type EntitlementStatus = "active" | "revoked";

export interface EntitlementRecord {
  id: string; // deterministic: `${userId}_${module}_${productRef}`
  userId: string;
  module: PaymentModule;
  productRef: string;
  orderId: string;
  paymentId: string;
  status: EntitlementStatus;
  grantedAt: number;
  revokedAt: number | null;
}

export type WebhookEventStatus = "processed" | "duplicate" | "ignored";

export interface PaymentEventRecord {
  key: string; // the derived idempotency key — Firestore doc id in `payment_events`
  type: string; // e.g. "payment.captured"
  orderId: string | null;
  paymentId: string | null;
  amount: number | null;
  currency: string | null;
  receivedAt: number;
  payload: unknown; // the parsed webhook body, for audit/replay
}
