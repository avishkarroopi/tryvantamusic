// Phase 21: real unit tests for the cron scheduling math (Phase 2).
import { test } from "node:test";
import assert from "node:assert/strict";
import { computeNextRunAt } from "../scheduler";

test("computes the next daily fire time correctly (UTC)", () => {
  const from = new Date("2026-09-02T10:00:00.000Z");
  const next = computeNextRunAt("0 9 * * *", from); // 09:00 UTC daily
  assert.ok(next);
  assert.equal(next!.toISOString(), "2026-09-03T09:00:00.000Z"); // today's 09:00 already passed, so tomorrow
});

test("computes the next hourly fire time correctly", () => {
  const from = new Date("2026-09-02T10:15:00.000Z");
  const next = computeNextRunAt("0 * * * *", from);
  assert.ok(next);
  assert.equal(next!.toISOString(), "2026-09-02T11:00:00.000Z");
});

test("supports predefined expressions like @daily", () => {
  const from = new Date("2026-09-02T10:00:00.000Z");
  const next = computeNextRunAt("@daily", from);
  assert.ok(next);
  assert.equal(next!.toISOString(), "2026-09-03T00:00:00.000Z");
});

test("returns null (not a thrown error) for an invalid cron expression, so callers can skip gracefully", () => {
  const from = new Date("2026-09-02T10:00:00.000Z");
  const next = computeNextRunAt("not a cron expression", from);
  assert.equal(next, null);
});

test("the computed next fire time is always strictly after `from`", () => {
  const from = new Date("2026-09-02T09:00:00.000Z"); // exactly on the fire time
  const next = computeNextRunAt("0 9 * * *", from);
  assert.ok(next);
  assert.ok(next!.getTime() > from.getTime());
});
