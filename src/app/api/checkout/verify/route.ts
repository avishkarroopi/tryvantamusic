import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { isFirebaseAdminConfigured } from "@/lib/payments/firebaseAdmin";
import { FirestoreEventStore, readOrderRecord } from "@/lib/payments/firestoreEventStore";
import { handlePaymentCaptured } from "@/lib/payments/processPayment";

// Verifies the HMAC-SHA256 signature Razorpay returns after a successful
// checkout (order_id|payment_id, signed with the key_secret). This is the
// step that actually proves the payment is genuine — the client-side
// `handler` callback firing is not sufficient on its own since it runs in
// the browser and could be spoofed. The verification contract below
// (verified: true/false, paymentId, orderId) is unchanged from before —
// existing Store checkout code keeps working exactly as-is.
//
// This is also one of two entry points into the centralized payment layer
// (see src/lib/payments/), the other being the Razorpay webhook — a browser
// that closes the tab right after payment still gets its order marked paid
// here; if the webhook *also* fires for the same payment, both paths
// converge on the same deterministic Firestore doc IDs, so neither can
// create a duplicate order/payment/entitlement. If Firebase Admin isn't
// configured yet, this step is skipped gracefully and only signature
// verification happens — matching this route's original behavior.
const RAZORPAY_PAYMENTS_URL = "https://api.razorpay.com/v1/payments";

export async function POST(req: NextRequest) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return NextResponse.json(
      { error: "Payment gateway is not configured yet." },
      { status: 503 },
    );
  }

  let body: {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: "Missing payment verification fields." }, { status: 400 });
  }

  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  const isValid =
    expectedSignature.length === razorpay_signature.length &&
    crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(razorpay_signature));

  if (!isValid) {
    return NextResponse.json({ error: "Payment signature verification failed.", verified: false }, { status: 400 });
  }

  // Best-effort: mark the order paid centrally. Never lets a Firestore or
  // Razorpay-lookup hiccup turn a genuinely-verified payment into an error
  // response — the signature check above is what actually matters to the
  // customer, and the webhook is the durable backstop if this step can't
  // complete right now.
  if (isFirebaseAdminConfigured()) {
    try {
      let amount: number | null = null;
      let currency: string | null = null;
      let method: string | null = null;
      let notesFallback: Record<string, string> = {};

      const existingOrder = await readOrderRecord(razorpay_order_id);
      if (existingOrder) {
        amount = existingOrder.amount;
        currency = existingOrder.currency;
        notesFallback = existingOrder.notes;
      } else {
        const keyId = process.env.RAZORPAY_KEY_ID;
        if (keyId) {
          const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
          const res = await fetch(`${RAZORPAY_PAYMENTS_URL}/${razorpay_payment_id}`, {
            headers: { Authorization: `Basic ${auth}` },
          });
          if (res.ok) {
            const payment = await res.json();
            amount = payment.amount ?? null;
            currency = payment.currency ?? null;
            method = payment.method ?? null;
            notesFallback = payment.notes ?? {};
          }
        }
      }

      if (amount !== null && currency !== null) {
        await handlePaymentCaptured(new FirestoreEventStore(), {
          eventKey: `verify:${razorpay_payment_id}`,
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
          amount,
          currency,
          method,
          notesFallback,
        });
      } else {
        console.error("[checkout/verify] could not resolve amount/currency to mark order paid", { razorpay_order_id });
      }
    } catch (err) {
      console.error("[checkout/verify] non-blocking: failed to mark order paid centrally", err);
    }
  }

  return NextResponse.json({ verified: true, paymentId: razorpay_payment_id, orderId: razorpay_order_id });
}
