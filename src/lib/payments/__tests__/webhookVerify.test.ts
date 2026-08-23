import { describe, it, expect } from "vitest";
import crypto from "crypto";
import { verifyRazorpayWebhookSignature } from "../webhookVerify";

describe("verifyRazorpayWebhookSignature", () => {
  const secret = "test_webhook_secret";
  const rawBody = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: "pay_1" } } } });

  const sign = (body: string, key: string) => crypto.createHmac("sha256", key).update(body).digest("hex");

  it("accepts a correctly signed payload", () => {
    const signature = sign(rawBody, secret);
    expect(verifyRazorpayWebhookSignature(rawBody, signature, secret)).toBe(true);
  });

  it("rejects a payload signed with the wrong secret", () => {
    const signature = sign(rawBody, "wrong_secret");
    expect(verifyRazorpayWebhookSignature(rawBody, signature, secret)).toBe(false);
  });

  it("rejects a tampered body even with a signature that was valid for the original body", () => {
    const signature = sign(rawBody, secret);
    const tampered = rawBody.replace("pay_1", "pay_2");
    expect(verifyRazorpayWebhookSignature(tampered, signature, secret)).toBe(false);
  });

  it("rejects when no signature header is present", () => {
    expect(verifyRazorpayWebhookSignature(rawBody, null, secret)).toBe(false);
  });

  it("rejects a garbage/malformed signature without throwing", () => {
    expect(() => verifyRazorpayWebhookSignature(rawBody, "not-hex-and-wrong-length", secret)).not.toThrow();
    expect(verifyRazorpayWebhookSignature(rawBody, "not-hex-and-wrong-length", secret)).toBe(false);
  });
});
