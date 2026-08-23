import crypto from "crypto";

/** Verifies a Razorpay webhook delivery: HMAC-SHA256 of the *raw, unparsed*
 *  request body, keyed with the webhook secret (Razorpay Dashboard >
 *  Settings > Webhooks — distinct from the API key pair used for orders).
 *  Must run against the exact bytes Razorpay sent, before any JSON.parse,
 *  or the signature will never match. Pure function — no I/O, easy to
 *  unit-test directly. */
export function verifyRazorpayWebhookSignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  if (expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
