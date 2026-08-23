import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Verifies the HMAC-SHA256 signature Razorpay returns after a successful
// checkout (order_id|payment_id, signed with the key_secret). This is the
// step that actually proves the payment is genuine — the client-side
// `handler` callback firing is not sufficient on its own since it runs in
// the browser and could be spoofed.
//
// NOTE: there's no orders table/database wired into this project yet, so a
// verified payment is not currently persisted anywhere server-side beyond
// this request. This is the seam where that would hook in — write the order
// (cart contents, customer details, razorpay_payment_id) to a DB and send a
// confirmation email — once a database is connected. Flagged honestly rather
// than faked.

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

  return NextResponse.json({ verified: true, paymentId: razorpay_payment_id, orderId: razorpay_order_id });
}
