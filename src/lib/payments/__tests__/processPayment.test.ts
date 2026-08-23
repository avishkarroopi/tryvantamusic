import { describe, it, expect } from "vitest";
import { InMemoryEventStore } from "../eventStore";
import { handlePaymentCaptured, handlePaymentFailed, handleRefund } from "../processPayment";

describe("handlePaymentCaptured — idempotent processing", () => {
  it("processes a captured payment once: creates order, payment, and entitlement", async () => {
    const store = new InMemoryEventStore();
    const outcome = await handlePaymentCaptured(store, {
      eventKey: "evt_1",
      orderId: "order_1",
      paymentId: "pay_1",
      amount: 4999,
      currency: "INR",
      method: "card",
      notesFallback: { module: "store", userId: "uid_123", productRef: "k-beg-1x1" },
    });

    expect(outcome).toBe("processed");
    expect(store.orders.get("order_1")?.status).toBe("paid");
    expect(store.payments.get("pay_1")?.status).toBe("captured");
    expect(store.entitlements.get("uid_123_store_k-beg-1x1")?.status).toBe("active");
  });

  it("a duplicate delivery of the SAME event key is a no-op, not a second order/payment/entitlement", async () => {
    const store = new InMemoryEventStore();
    const input = {
      eventKey: "evt_1",
      orderId: "order_1",
      paymentId: "pay_1",
      amount: 4999,
      currency: "INR",
      method: "card",
      notesFallback: { module: "store", userId: "uid_123", productRef: "k-beg-1x1" },
    };

    const first = await handlePaymentCaptured(store, input);
    const second = await handlePaymentCaptured(store, input); // simulates a Razorpay webhook retry
    const third = await handlePaymentCaptured(store, input);

    expect(first).toBe("processed");
    expect(second).toBe("duplicate");
    expect(third).toBe("duplicate");
    expect(store.orders.size).toBe(1);
    expect(store.payments.size).toBe(1);
    expect(store.entitlements.size).toBe(1);
  });

  it("webhook path and client-verify path racing for the same payment converge without duplicating state", async () => {
    // Different eventKeys (as real webhook vs /verify calls would produce)
    // but the same orderId/paymentId/userId/productRef — deterministic doc
    // IDs mean both land on the exact same records.
    const store = new InMemoryEventStore();
    const base = {
      orderId: "order_2",
      paymentId: "pay_2",
      amount: 1000,
      currency: "INR",
      method: "upi",
      notesFallback: { module: "store", userId: "uid_9", productRef: "b-1x1" },
    };

    const webhookOutcome = await handlePaymentCaptured(store, { ...base, eventKey: "webhook:evt_9" });
    const verifyOutcome = await handlePaymentCaptured(store, { ...base, eventKey: "verify:pay_2" });

    expect(webhookOutcome).toBe("processed");
    expect(verifyOutcome).toBe("processed"); // different key, so it DOES run again...
    // ...but writes are idempotent overwrites of the same doc IDs, so state never duplicates:
    expect(store.orders.size).toBe(1);
    expect(store.payments.size).toBe(1);
    expect(store.entitlements.size).toBe(1);
    expect(store.orders.get("order_2")?.status).toBe("paid");
  });

  it("recovers module/userId/productRef from notesFallback when no order doc exists yet", async () => {
    const store = new InMemoryEventStore();
    await handlePaymentCaptured(store, {
      eventKey: "evt_recover",
      orderId: "order_recover",
      paymentId: "pay_recover",
      amount: 500,
      currency: "INR",
      method: "netbanking",
      notesFallback: { module: "course", userId: "uid_5", productRef: "course_101" },
    });
    const order = store.orders.get("order_recover");
    expect(order?.module).toBe("course");
    expect(order?.userId).toBe("uid_5");
    expect(order?.productRef).toBe("course_101");
  });

  it("does not grant an entitlement for a guest checkout with no userId", async () => {
    const store = new InMemoryEventStore();
    await handlePaymentCaptured(store, {
      eventKey: "evt_guest",
      orderId: "order_guest",
      paymentId: "pay_guest",
      amount: 500,
      currency: "INR",
      method: "card",
      notesFallback: { module: "store", productRef: "b-1x1" }, // no userId
    });
    expect(store.orders.get("order_guest")?.status).toBe("paid");
    expect(store.entitlements.size).toBe(0);
  });

  it("falls back to module 'other' for an unrecognized module string", async () => {
    const store = new InMemoryEventStore();
    await handlePaymentCaptured(store, {
      eventKey: "evt_bad_module",
      orderId: "order_bad",
      paymentId: "pay_bad",
      amount: 500,
      currency: "INR",
      method: "card",
      notesFallback: { module: "not-a-real-module" },
    });
    expect(store.orders.get("order_bad")?.module).toBe("other");
  });
});

describe("handlePaymentFailed", () => {
  it("marks a known order failed, exactly once per event key", async () => {
    const store = new InMemoryEventStore();
    store.orders.set("order_3", {
      orderId: "order_3", userId: null, module: "store", productRef: null, description: "",
      amount: 100, currency: "INR", status: "created", notes: {}, paymentId: null, createdAt: 0, updatedAt: 0,
    });

    const first = await handlePaymentFailed(store, { eventKey: "evt_fail_1", orderId: "order_3", paymentId: "pay_3" });
    const dup = await handlePaymentFailed(store, { eventKey: "evt_fail_1", orderId: "order_3", paymentId: "pay_3" });

    expect(first).toBe("processed");
    expect(dup).toBe("duplicate");
    expect(store.orders.get("order_3")?.status).toBe("failed");
  });

  it("is a safe no-op for an order it has never seen", async () => {
    const store = new InMemoryEventStore();
    const outcome = await handlePaymentFailed(store, { eventKey: "evt_fail_unknown", orderId: "order_unknown", paymentId: null });
    expect(outcome).toBe("processed");
    expect(store.orders.has("order_unknown")).toBe(false);
  });
});

describe("handleRefund", () => {
  it("marks a paid order refunded, exactly once per event key", async () => {
    const store = new InMemoryEventStore();
    store.orders.set("order_4", {
      orderId: "order_4", userId: "uid_1", module: "store", productRef: "g-elec-1x1", description: "",
      amount: 24900, currency: "INR", status: "paid", notes: {}, paymentId: "pay_4", createdAt: 0, updatedAt: 0,
    });

    const first = await handleRefund(store, { eventKey: "evt_refund_1", orderId: "order_4", paymentId: "pay_4" });
    const dup = await handleRefund(store, { eventKey: "evt_refund_1", orderId: "order_4", paymentId: "pay_4" });

    expect(first).toBe("processed");
    expect(dup).toBe("duplicate");
    expect(store.orders.get("order_4")?.status).toBe("refunded");
  });
});
