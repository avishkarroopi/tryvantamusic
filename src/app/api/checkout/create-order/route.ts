import { NextRequest, NextResponse } from "next/server";

// Real Razorpay order creation — talks to Razorpay's REST API directly
// (Basic Auth with key_id:key_secret) rather than pulling in the razorpay
// SDK, since this is the only call site. Requires RAZORPAY_KEY_ID and
// RAZORPAY_KEY_SECRET to be set (Vercel/production env vars — see
// .env.example). Until then this route responds 503 with a clear message
// instead of crashing the build or throwing an opaque 500.

const RAZORPAY_ORDERS_URL = "https://api.razorpay.com/v1/orders";
const DEFAULT_CURRENCY = process.env.RAZORPAY_CURRENCY || "INR";

export async function POST(req: NextRequest) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return NextResponse.json(
      { error: "Payment gateway is not configured yet. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET." },
      { status: 503 },
    );
  }

  let body: { amount?: number; currency?: string; receipt?: string; notes?: Record<string, string> };
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
      notes: body.notes || {},
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(
      { error: data?.error?.description || "Razorpay order creation failed." },
      { status: res.status },
    );
  }

  return NextResponse.json({
    orderId: data.id,
    amount: data.amount,
    currency: data.currency,
    keyId, // key_id is the publishable half of the credential pair — safe to return to the client
  });
}
