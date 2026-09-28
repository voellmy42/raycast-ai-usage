import { test } from "node:test";
import assert from "node:assert/strict";
import { forecast, observationsFromUsage } from "../src/lib/forecast";
import { baseUsage } from "../src/lib/normalize";
import type { QuotaWindow } from "../src/lib/types";
const now = Date.parse("2026-09-28T12:00:00Z");
const window: QuotaWindow = {
  id: "primary",
  label: "Primary",
  scope: "account",
  model: null,
  usedPercent: 80,
  resetsAt: new Date(now + 3600_000).toISOString(),
  windowDurationMinutes: 300,
};
const points = [60, 70, 80].map((used, i) => ({
  windowId: "primary",
  used,
  resetsAt: window.resetsAt!,
  time: now - (2 - i) * 300_000,
}));
test("forecasts percentage consumption against reset, not token counts", () => {
  const f = forecast(window, points, now).value!;
  assert.equal(f.rate, 120);
  assert.equal(f.exhaustion, now + 600_000);
  assert.equal(f.headroom, 0);
  const slow = points.map((p, i) => ({ ...p, used: 78 + i }));
  assert.equal(forecast(window, slow, now).value!.headroom, 8);
});
test("reject stale, sparse, changed-reset, falling, and mismatched readings", () => {
  assert.equal(forecast(window, points, now + 301_000).value, null);
  assert.equal(forecast(window, points.slice(1), now).value, null);
  assert.equal(
    forecast(
      { ...window, resetsAt: new Date(now + 7200_000).toISOString() },
      points,
      now,
    ).value,
    null,
  );
  assert.equal(
    forecast(
      window,
      points.map((p, i) => ({ ...p, used: i === 1 ? 90 : p.used })),
      now,
    ).value,
    null,
  );
  assert.equal(
    forecast({ ...window, usedPercent: 81 }, points, now).value,
    null,
  );
});
test("flat usage gives no finite exhaustion estimate", () => {
  const f = forecast(
    window,
    points.map((p) => ({ ...p, used: 80 })),
    now,
  ).value!;
  assert.equal(f.exhaustion, null);
  assert.equal(f.headroom, 20);
});
test("only fresh successful observations are stored", () => {
  const usage = {
    ...baseUsage("codex"),
    connectionStatus: "ready" as const,
    freshness: "fresh" as const,
    observedAt: new Date(now).toISOString(),
    quotaWindows: [window],
  };
  assert.equal(observationsFromUsage(usage, now).length, 1);
  assert.equal(
    observationsFromUsage({ ...usage, freshness: "stale" }, now).length,
    0,
  );
  assert.equal(observationsFromUsage(usage, now + 301_000).length, 0);
});
