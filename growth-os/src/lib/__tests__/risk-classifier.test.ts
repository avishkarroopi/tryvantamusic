// Phase 21: real unit tests for the ONE function allowed to assign risk_level
// (risk-classifier.ts is deliberately plain .ts with no Supabase dependency
// so it can be tested exactly like this, with zero mocking).
import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyRisk, isAutoApprovable, approvalExpiryHours } from "../risk-classifier";

test("read-only actions classify as low risk", () => {
  assert.equal(classifyRisk({ action_type: "meta.read", payload: {} }), "low");
  assert.equal(classifyRisk({ action_type: "ga4.read", payload: {} }), "low");
});

test("pausing a campaign is low risk regardless of platform", () => {
  assert.equal(classifyRisk({ action_type: "meta.pause_campaign", payload: {} }), "low");
  assert.equal(classifyRisk({ action_type: "google_ads.pause_campaign", payload: {} }), "low");
});

test("resuming/duplicating/targeting changes are medium risk", () => {
  assert.equal(classifyRisk({ action_type: "meta.resume_campaign", payload: {} }), "medium");
  assert.equal(
    classifyRisk({ action_type: "google_ads.add_negative_keyword", payload: {} }),
    "medium",
  );
});

test("campaign/budget creation and destructive/mass actions are high risk", () => {
  assert.equal(classifyRisk({ action_type: "meta.create_campaign", payload: {} }), "high");
  assert.equal(classifyRisk({ action_type: "google_ads.update_budget", payload: {} }), "high");
  assert.equal(classifyRisk({ action_type: "whatsapp.mass_send", payload: {} }), "high");
  assert.equal(classifyRisk({ action_type: "resource.delete", payload: {} }), "high");
});

test("an unrecognized action_type fails closed to high, never auto-approved", () => {
  assert.equal(classifyRisk({ action_type: "totally.unknown.action", payload: {} }), "high");
});

test("a large budget swing escalates a normally-medium action to high", () => {
  const risk = classifyRisk({
    action_type: "meta.update_targeting",
    payload: { budget_change_pct: 35 },
  });
  assert.equal(risk, "high");
});

test("a large budget swing escalates a normally-low action too (never de-escalates, only escalates)", () => {
  const risk = classifyRisk({
    action_type: "meta.pause_campaign",
    payload: { budget_change_pct: -50 },
  });
  assert.equal(risk, "high");
});

test("a small budget change does not escalate", () => {
  const risk = classifyRisk({
    action_type: "meta.resume_campaign",
    payload: { budget_change_pct: 5 },
  });
  assert.equal(risk, "medium");
});

test("escalation never downgrades an already-high action", () => {
  const risk = classifyRisk({
    action_type: "meta.create_campaign",
    payload: { budget_change_pct: 1 },
  });
  assert.equal(risk, "high");
});

test("only low risk is auto-approvable", () => {
  assert.equal(isAutoApprovable("low"), true);
  assert.equal(isAutoApprovable("medium"), false);
  assert.equal(isAutoApprovable("high"), false);
});

test("medium risk expires in 24h; high risk never auto-expires", () => {
  assert.equal(approvalExpiryHours("medium"), 24);
  assert.equal(approvalExpiryHours("high"), null);
  assert.equal(approvalExpiryHours("low"), null);
});
