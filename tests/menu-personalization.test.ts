import assert from "node:assert/strict";
import test from "node:test";
import {
  menuPresentation,
  parseSelection,
} from "../src/lib/menu-personalization";
import { baseUsage } from "../src/lib/normalize";
import type { Usage, QuotaWindow } from "../src/lib/types";
const now = Date.parse("2026-09-28T12:00:00Z");
const window: QuotaWindow = {
  id: "short",
  label: "Short",
  scope: "account",
  model: null,
  usedPercent: 58,
  windowDurationMinutes: 300,
  resetsAt: "2026-09-28T14:00:00Z",
};
const usage: Usage = {
  ...baseUsage("codex"),
  connectionStatus: "ready",
  freshness: "fresh",
  observedAt: new Date(now).toISOString(),
  quotaWindows: [
    window,
    {
      ...window,
      id: "long",
      usedPercent: 80,
      resetsAt: "2026-09-29T12:00:00Z",
    },
  ],
};
test("selection validates saved data", () => {
  assert.deepEqual(parseSelection("broken"), {
    provider: "codex",
    windowId: null,
  });
  assert.deepEqual(parseSelection('{"provider":"codex","windowId":"week"}'), {
    provider: "codex",
    windowId: "week",
  });
});
test("retired provider selections migrate to automatic Codex selection", () => {
  for (const provider of ["claude", "gemini"]) {
    assert.deepEqual(
      parseSelection(JSON.stringify({ provider, windowId: "week" })),
      {
        provider: "codex",
        windowId: null,
      },
    );
  }
});
test("automatic selects lowest and uses its own reset", () => {
  assert.equal(
    menuPresentation([usage], parseSelection(), "detailed", now).title,
    "Codex 20% · 1d",
  );
  assert.equal(
    menuPresentation(
      [usage],
      { provider: "codex", windowId: "short" },
      "detailed",
      now,
    ).title,
    "Codex 42% · 2h",
  );
});
test("missing pins and hidden providers never fall back", () => {
  assert.match(
    menuPresentation(
      [usage],
      { provider: "codex", windowId: "missing" },
      "compact",
      now,
    ).title,
    /Unavailable/,
  );
  assert.match(
    menuPresentation([], parseSelection(), "compact", now).title,
    /Unavailable/,
  );
});
test("expired, unknown and authentication failures suppress percentage", () => {
  for (const changed of [
    {
      ...usage,
      quotaWindows: [{ ...window, resetsAt: new Date(now).toISOString() }],
    },
    { ...usage, quotaWindows: [{ ...window, usedPercent: null }] },
    { ...usage, connectionStatus: "sign_in_required" as const },
  ]) {
    assert.doesNotMatch(
      menuPresentation([changed], parseSelection(), "compact", now).title,
      /%/,
    );
  }
});
test("old readings and snapshots are explicit", () => {
  assert.match(
    menuPresentation(
      [{ ...usage, observedAt: new Date(now - 600000).toISOString() }],
      parseSelection(),
      "compact",
      now,
    ).title,
    /Stale/,
  );
  assert.match(
    menuPresentation(
      [{ ...usage, provider: "claude" }],
      { provider: "claude", windowId: null },
      "compact",
      now,
    ).title,
    /Snapshot/,
  );
});
