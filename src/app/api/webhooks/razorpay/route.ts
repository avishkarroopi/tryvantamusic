import { NextRequest, NextResponse } from "next/server";
import { verifyRazorpayWebhookSignature } from "@/lib/payments/webhookVerify";
import { computeEventKey, extractEventSummary, type RazorpayWebhookBody } from "@/lib/payments/idempotencyKey";
import { handlePaymentCaptured, handlePaymentFailed, handleRefund } from "@/lib/payments/processPayment";
import { FirestoreEventStore, writeEventAudit } from "@/lib/payments/firestoreEventStore";
import { isFirebaseAdminConfigured } from "@/lib/payments/firebaseAdmin";

// Single, centralized, platform-wide Razorpay webhook. Every paid module —
// Store today, courses/subscriptions/M-CAM services/registrations/
// memberships/tools as they ship — reports payment outcomes through this
// one endpoint. Which module an order belongs to travels in the order's
// Razorpay `notes` (see src/app/api/checkout/create-order/route.ts), so
// this route dispatches on event *type* only and never branches on module —
// adding a new paid module never requires touching this file.
//
// Production URL (once the domain is live — see the deployment
// conversation in this project): https://www.muzicllyglobal.com/api/webhooks/razorpay
// Configure that exact URL + these events in Razorpay Dashboard > Settings
// > Webhooks, with a secret you generate there — see RAZORPAY_WEBHOOK_SECRET
// in .env.example. That secret is never sent to, or readable by, the client.

const log = (msg: string, extra?: unknown) => console.log(`[razorpay-webhook] ${msg}`, extra ?? "");
const logError = (msg: string, extra?: unknown) => console.error(`[razorpay-webhook] ${msg}`, extra ?? "");

export async function POST(req: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    logError("RAZORPAY_WEBHOOK_SECRET is not set — rejecting delivery so Razorpay retries once it is.");
    return NextResponse.json({ error: "Webhook not configured." }, { status: 503 });
  }

  // Signature must be verified against the exact raw bytes Razorpay sent —
  // read as text before any JSON parsing, or the HMAC will never match.
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!verifyRazorpayWebhookSignature(rawBody, signature, secret)) {
    logError("Signature verification failed — rejecting delivery.");
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  let body: RazorpayWebhookBody;
  try {
    body = JSON.parse(rawBody);
  } catch {
    logError("Body was not valid JSON despite a valid signature.");
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const eventKey = computeEventKey(body);
  const summary = extractEventSummary(body);
  log(`received ${summary.type}`, { eventKey, orderId: summary.orderId, paymentId: summary.paymentId });

  // Best-effort full-payload audit write — never blocks or fails the
  // response; the idempotency guarantee lives entirely in the transaction
  // below, not in this write.
  writeEventAudit({
    key: eventKey,
    type: summary.type,
    orderId: summary.orderId,
    paymentId: summary.paymentId,
    amount: summary.amount,
    currency: summary.currency,
    receivedAt: Date.now(),
    payload: body,
  }).catch((err) => logError("audit write failed (non-blocking)", err));

  if (!isFirebaseAdminConfigured()) {
    logError("Firebase Admin is not configured — cannot durably process this event yet.");
    return NextResponse.json({ error: "Payment store not configured." }, { status: 500 });
  }

  const store = new FirestoreEventStore();

  try {
    let outcome: "processed" | "duplicate" | "ignored" = "ignored";

    if (summary.type === "payment.captured" || summary.type === "order.paid") {
      if (!summary.orderId || !summary.paymentId || summary.amount === null || summary.currency === null) {
        logError("captured/order.paid event missing required fields", summary);
        return NextResponse.json({ error: "Malformed event." }, { status: 400 });
      }
      outcome = await handlePaymentCaptured(store, {
        eventKey,
        orderId: summary.orderId,
        paymentId: summary.paymentId,
        amount: summary.amount,
        currency: summary.currency,
        method: summary.method,
        notesFallback: summary.notes,
      });
    } else if (summary.type === "payment.failed") {
      if (!summary.orderId) {
        logError("payment.failed event missing order id", summary);
        return NextResponse.json({ error: "Malformed event." }, { status: 400 });
      }
      outcome = await handlePaymentFailed(store, { eventKey, orderId: summary.orderId, paymentId: summary.paymentId });
    } else if (summary.type === "refund.created" || summary.type === "refund.processed") {
      if (!summary.orderId || !summary.paymentId) {
        logError("refund event missing order/payment id", summary);
        return NextResponse.json({ error: "Malformed event." }, { status: 400 });
      }
      outcome = await handleRefund(store, { eventKey, orderId: summary.orderId, paymentId: summary.paymentId });
    } else {
      // Forward-compatible default: acknowledge and record, but don't
      // pretend to have handled an event type nobody has implemented logic
      // for yet.
      log(`no handler registered for event type "${summary.type}" — recorded, not processed.`);
    }

    log(`done: ${summary.type} -> ${outcome}`, { eventKey });
    return NextResponse.json({ received: true, type: summary.type, outcome }, { status: 200 });
  } catch (err) {
    // A genuine processing failure (e.g. Firestore transiently down) should
    // NOT return 200 — that would tell Razorpay we durably accepted an
    // event we actually failed to persist. Returning 5xx here means
    // Razorpay's retry schedule will redeliver it, and the same eventKey
    // makes that redelivery safe.
    logError("unhandled error processing webhook", err);
    return NextResponse.json({ error: "Internal error processing webhook." }, { status: 500 });
  }
}
