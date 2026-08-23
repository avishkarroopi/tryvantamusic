import { describe, it, expect } from "vitest";
import { computeEventKey, extractEventSummary, type RazorpayWebhookBody } from "../idempotencyKey";

const capturedEvent: RazorpayWebhookBody = {
  event: "payment.captured",
  created_at: 1700000000,
  payload: {
    payment: {
      entity: { id: "pay_ABC123", order_id: "order_XYZ789", amount: 4999, currency: "INR", status: "captured", method: "card", notes: { module: "store" } },
    },
  },
};

describe("computeEventKey", () => {
  it("prefers a top-level event id when Razorpay provides one", () => {
    const body: RazorpayWebhookBody = { ...capturedEvent, id: "evt_real_123" };
    expect(computeEventKey(body)).toBe("evt_real_123");
  });

  it("derives a stable key from event type + entity id + created_at when no id is present", () => {
    const key1 = computeEventKey(capturedEvent);
    const key2 = computeEventKey(capturedEvent);
    expect(key1).toBe(key2);
    expect(key1).toMatch(/^[a-f0-9]{64}$/); // sha256 hex
  });

  it("produces a byte-identical retry the same key (retry simulation)", () => {
    // Razorpay retries resend the exact same payload — simulate that by
    // deep-cloning rather than constructing a new object literal.
    const retry: RazorpayWebhookBody = JSON.parse(JSON.stringify(capturedEvent));
    expect(computeEventKey(retry)).toBe(computeEventKey(capturedEvent));
  });

  it("produces a different key for a genuinely different event", () => {
    const other: RazorpayWebhookBody = {
      ...capturedEvent,
      payload: { payment: { entity: { ...capturedEvent.payload!.payment!.entity, id: "pay_DIFFERENT" } } },
    };
    expect(computeEventKey(other)).not.toBe(computeEventKey(capturedEvent));
  });

  it("produces a different key for the same entity id but a different event type", () => {
    const failed: RazorpayWebhookBody = { ...capturedEvent, event: "payment.failed" };
    expect(computeEventKey(failed)).not.toBe(computeEventKey(capturedEvent));
  });
});

describe("extractEventSummary", () => {
  it("pulls order/payment/amount/currency/notes from a payment event", () => {
    const summary = extractEventSummary(capturedEvent);
    expect(summary).toMatchObject({
      type: "payment.captured",
      orderId: "order_XYZ789",
      paymentId: "pay_ABC123",
      amount: 4999,
      currency: "INR",
      method: "card",
      notes: { module: "store" },
    });
  });

  it("falls back to the refund entity's payment_id for refund events", () => {
    const refundEvent: RazorpayWebhookBody = {
      event: "refund.processed",
      payload: { refund: { entity: { id: "rfnd_1", payment_id: "pay_ABC123", amount: 4999, currency: "INR", status: "processed" } } },
    };
    const summary = extractEventSummary(refundEvent);
    expect(summary.paymentId).toBe("pay_ABC123");
  });
});
