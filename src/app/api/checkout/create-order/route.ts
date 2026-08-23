import { NextRequest, NextResponse } from "next/server";
import type { PaymentModule } from "@/lib/payments/types";
import { writeOrderRecord } from "@/lib/payments/firestoreEventStore";
import { isFirebaseAdminConfigured } from "@/lib/payments/firebaseAdmin";

// Real Razorpay order creation — talks to Razorpay's REST API directly
// (Basic Auth with key_id:key_secret) rather than pulling in the razorpay
// SDK, since this is the only call site. Requires RAZORPAY_KEY_ID and
// RAZORPAY_KEY_SECRET to be set (Vercel/production env vars — see
// .env.example). Until then this route responds 503 with a clear message
// instead of crashing the build or throwing an opaque 500.
//
// Platform-wide, not Store-specific: any paid module (Store, courses,
// subscriptions, M-CAM services, registrations, memberships, tools) calls
// this same route with its own `module`/`productRef`/`userId`. Those travel
// two ways: into Firestore immediately (best-effort — see below) AND into
// the Razorpay order's own `notes`, so the centralized webhook
// (src/app/api/webhooks/razorpay/route.ts) can always recover what an
// order was for even if the Firestore write below happened to fail.

const RAZORPAY_ORDERS_URL = "https://api.razorpay.com/v1/orders";
const DEFAULT_CURRENCY = process.env.RAZORPAY_CURRENCY || "INR";
const KNOWN_MODULES: PaymentModule[] = ["store", "course", "subscription", "mcam", "registration", "membership", "tool", "other"];

export async function POST(req: NextRequest) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return NextResponse.json(
      { error: "Payment gateway is not configured yet. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET." },
      { status: 503 },
    );
  }

  let body: {
    amount?: number;
    currency?: string;
    receipt?: string;
    notes?: Record<string, string>;
    module?: string;
    userId?: string;
    productRef?: string;
    description?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Invalid order amount." }, { status: 400 });
  }
  // Razorpay caps a single order at ₹5,00,00,000 (in paise). Guard against
  // accidental/garbage amounts rather than forwarding them.
  if (amount > 500000) {
    return NextResponse.json({ error: "Order amount exceeds the allowed limit." }, { status: 400 });
  }

  const currency = body.currency || DEFAULT_CURRENCY;
  const amountInSubunits = Math.round(amount * 100); // rupees/dollars -> paise/cents

  const module: PaymentModule = KNOWN_MODULES.includes(body.module as PaymentModule)
    ? (body.module as PaymentModule)
    : "other";
  const description = body.description || "";

  // Everything the webhook needs to reconstruct this order if it never
  // makes it into Firestore is embedded in Razorpay's own notes — this is
  // the resilience path, not a formality.
  const notes: Record<string, string> = {
    ...(body.notes || {}),
    module,
    ...(body.userId ? { userId: body.userId } : {}),
    ...(body.productRef ? { productRef: body.productRef } : {}),
    ...(description ? { description } : {}),
  };

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  const res = await fetch(RAZORPAY_ORDERS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify({
      amount: amountInSubunits,
      currency,
      receipt: body.receipt || `muziclly_${Date.now()}`,
      notes,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(
      { error: data?.error?.description || "Razorpay order creation failed." },
      { status: res.status },
    );
  }

  // Best-effort: persist the order centrally so the admin/audit trail and
  // the webhook have a record to reconcile against. A Firestore hiccup here
  // must never block a customer from paying — the order still exists in
  // Razorpay either way, and the webhook can recover module/userId/
  // productRef from `notes` above if this write never landed.
  if (isFirebaseAdminConfigured()) {
    const now = Date.now();
    writeOrderRecord({
      orderId: data.id,
      userId: body.userId ?? null,
      module,
      productRef: body.productRef ?? null,
      description,
      amount: data.amount,
      currency: data.currency,
      status: "created",
      notes,
      paymentId: null,
      createdAt: now,
      updatedAt: now,
    }).catch((err) => console.error("[create-order] Firestore order write failed (non-blocking)", err));
  }

  return NextResponse.json({
    orderId: data.id,
    amount: data.amount,
    currency: data.currency,
    keyId, // key_id is the publishable half of the credential pair — safe to return to the client
  });
}
