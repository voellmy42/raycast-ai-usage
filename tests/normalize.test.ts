import assert from "node:assert/strict";
import { test } from "node:test";
import {
  normalizeCodex,
  normalizeClaude,
  remainingPercent,
  freshness,
} from "../src/lib/normalize";

const at = "2026-09-28T08:00:00.000Z";
test("Codex preserves all buckets, zeros, unknown windows, and seconds", () => {
  const result = normalizeCodex(
    {
      rateLimitsByLimitId: {
        codex: {
          primary: {
            usedPercent: 0,
            windowDurationMins: 300,
            resetsAt: 1730947200,
          },
          secondary: null,
        },
        other: {
          limitName: "Additional",
          primary: { usedPercent: null, resetsAt: null },
          secondary: null,
        },
      },
    },
    "plus",
    at,
  );
  assert.equal(result.quotaWindows.length, 2);
  assert.equal(result.quotaWindows[0].usedPercent, 0);
  assert.equal(result.quotaWindows[0].resetsAt, "2024-11-07T02:40:00.000Z");
  assert.equal(result.quotaWindows[1].usedPercent, null);
  assert.equal(result.quotaWindows[1].windowDurationMinutes, null);
});
test("Codex accepts legacy view, rejects invalid finite values, does not infer models", () => {
  const result = normalizeCodex(
    { rateLimits: { primary: { usedPercent: 105 } } },
    null,
    at,
  );
  assert.equal(result.quotaWindows[0].usedPercent, 105);
  assert.equal(result.quotaWindows[0].model, null);
  assert.throws(() =>
    normalizeCodex(
      { rateLimits: { primary: { usedPercent: Infinity } } },
      null,
      at,
    ),
  );
  assert.throws(() =>
    normalizeCodex({ rateLimits: { primary: { usedPercent: -1 } } }, null, at),
  );
  assert.equal(remainingPercent(null), null);
  assert.equal(remainingPercent(105), 0);
  assert.equal(remainingPercent(25), 75);
});
test("expired reset never fabricates unused new quota", () => {
  const result = normalizeCodex(
    { rateLimits: { primary: { usedPercent: 25, resetsAt: 1730947200 } } },
    null,
    at,
  );
  assert.equal(freshness(result, Date.parse(at)), "expired");
  assert.equal(result.quotaWindows[0].usedPercent, 25);
});
test("Claude validates snapshot and independent windows without session data", () => {
  const result = normalizeClaude(
    {
      schemaVersion: 1,
      observedAt: at,
      rate_limits: {
        seven_day: { used_percentage: 41, resets_at: 1791089165 },
      },
    },
    at,
  );
  assert.equal(result.quotaWindows.length, 1);
  assert.equal(result.quotaWindows[0].usedPercent, 41);
  assert.equal(result.quotaWindows[0].label, "Weekly");
  assert.equal(result.account.plan, null);
  assert.throws(() =>
    normalizeClaude({ schemaVersion: 1, observedAt: "invalid" }, at),
  );
  assert.throws(() =>
    normalizeClaude(
      { schemaVersion: 1, observedAt: "2099-01-01T00:00:00Z", rate_limits: {} },
      at,
    ),
  );
  assert.equal(
    normalizeClaude({ schemaVersion: 1, observedAt: at, rate_limits: {} }, at)
      .freshness,
    "unavailable",
  );
});
