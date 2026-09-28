import assert from "node:assert/strict";
import test from "node:test";
import { quotaPresentation, shortQuotaLabel } from "../src/lib/format";
import type { QuotaWindow } from "../src/lib/types";
const window: QuotaWindow = {
  id: "test",
  label: "Codex · 5 Hours",
  scope: "account",
  model: null,
  usedPercent: 40,
  windowDurationMinutes: 300,
  resetsAt: null,
};
test("capacity thresholds reflect remaining quota", () => {
  assert.equal(quotaPresentation(window).state, "available");
  assert.equal(
    quotaPresentation({ ...window, usedPercent: 75 }).state,
    "approaching",
  );
  assert.equal(quotaPresentation({ ...window, usedPercent: 90 }).state, "low");
  assert.equal(quotaPresentation({ ...window, usedPercent: 120 }).remaining, 0);
});
test("unknown and expired quota never show current capacity", () => {
  assert.equal(
    quotaPresentation({ ...window, usedPercent: null }).remaining,
    null,
  );
  assert.equal(
    quotaPresentation({ ...window, resetsAt: "2020-01-01T00:00:00Z" })
      .remaining,
    null,
  );
  assert.equal(quotaPresentation(window, true).state, "stale");
});
test("short labels keep model and organization scope distinctions", () => {
  assert.equal(shortQuotaLabel(window), "5 Hours");
  assert.equal(
    shortQuotaLabel({
      ...window,
      label: "gpt-special · Weekly",
      scope: "model",
      model: "gpt-special",
      windowDurationMinutes: 10080,
    }),
    "gpt-special · Weekly",
  );
  assert.equal(
    shortQuotaLabel({ ...window, label: "Team Budget", scope: "organization" }),
    "Team Budget",
  );
});
