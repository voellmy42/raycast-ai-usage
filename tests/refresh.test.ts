import assert from "node:assert/strict";
import { test } from "node:test";
import { baseUsage, validateCachedUsage } from "../src/lib/normalize";
import { ConnectionError } from "../src/lib/app-server";
import { isolatedRead, refreshFeedback } from "../src/lib/refresh";

test("refresh feedback reflects quota availability and connection failures", () => {
  const ready = {
    ...baseUsage("codex"),
    freshness: "fresh" as const,
    quotaWindows: [
      {
        id: "primary",
        label: "5 Hours",
        scope: "account" as const,
        model: null,
        usedPercent: 25,
        windowDurationMinutes: 300,
        resetsAt: null,
      },
    ],
  };
  assert.equal(refreshFeedback(ready).success, true);
  assert.equal(refreshFeedback(baseUsage("codex")).success, false);
  assert.equal(
    refreshFeedback({ ...ready, freshness: "expired" }).success,
    false,
  );
  for (const connectionStatus of [
    "error",
    "sign_in_required",
    "unsupported",
  ] as const) {
    assert.equal(
      refreshFeedback({ ...ready, connectionStatus }).success,
      false,
    );
  }
  const partial = refreshFeedback(ready, true);
  assert.equal(partial.success, false);
  assert.match(partial.title, /Updated/);
  assert.match(partial.message, /cache/i);
});

test("a failed provider does not suppress another provider or leak raw errors", async () => {
  const [codex, claude] = await Promise.all([
    isolatedRead("codex", async () => {
      throw new Error("token=secret email=private@example.com");
    }),
    isolatedRead("claude", async () => baseUsage("claude")),
  ]);
  assert.equal(codex.connectionStatus, "error");
  assert.ok(!JSON.stringify(codex).includes("secret"));
  assert.equal(claude.connectionStatus, "ready");
});
test("auth failures produce no old quotas", async () => {
  const result = await isolatedRead("codex", async () => {
    throw new ConnectionError("sign_in_required", "Sign in to Codex.");
  });
  assert.equal(result.connectionStatus, "sign_in_required");
  assert.deepEqual(result.quotaWindows, []);
});
test("cache rejects incompatible versions and cannot restore extra secret fields", () => {
  assert.throws(() => validateCachedUsage({ schemaVersion: 0 }));
  const usage = {
    ...baseUsage("codex"),
    source: "codex_app_server",
    observedAt: new Date().toISOString(),
    password: "secret",
    account: { label: "private@example.com", plan: "plus" },
  };
  const restored = validateCachedUsage(usage);
  assert.ok(!JSON.stringify(restored).includes("secret"));
  assert.ok(!JSON.stringify(restored).includes("private@example.com"));
});
