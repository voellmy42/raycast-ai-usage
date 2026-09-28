import assert from "node:assert/strict";
import { test } from "node:test";
import { baseUsage, validateCachedUsage } from "../src/lib/normalize";
import { ConnectionError } from "../src/lib/app-server";
import { isolatedRead } from "../src/lib/refresh";

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
