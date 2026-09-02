// Phase 21: real unit tests for the deterministic SEO opportunity-scoring
// formula (seo-intelligence.server.ts's computeOpportunityScore) -- pure,
// no network/DB, no AI, matching Part 13's "deterministic scoring" requirement.
import { test } from "node:test";
import assert from "node:assert/strict";
import { computeOpportunityScore } from "../seo-intelligence.server";

test("no competitor evidence at all -> zero opportunity", () => {
  assert.equal(computeOpportunityScore(null, null), 0);
  assert.equal(computeOpportunityScore(5, null), 0);
});

test("competitor ranks #1, we don't rank at all -> maximum opportunity", () => {
  assert.equal(computeOpportunityScore(null, 1), 100);
});

test("competitor ranks #1, we also rank #1 -> zero opportunity", () => {
  assert.equal(computeOpportunityScore(1, 1), 0);
});

test("competitor ranks better than us -> positive opportunity proportional to the gap", () => {
  const score = computeOpportunityScore(8, 2);
  assert.ok(score > 0);
  assert.equal(score, (11 - 2 - (11 - 8)) * 10);
});

test("we rank BETTER than the competitor -> never negative, floors at zero", () => {
  assert.equal(computeOpportunityScore(1, 9), 0);
});

test("competitor beyond position 10 contributes nothing (Math.max floors at 0)", () => {
  assert.equal(computeOpportunityScore(null, 15), 0);
});
