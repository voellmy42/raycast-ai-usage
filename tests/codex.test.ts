import assert from "node:assert/strict";
import { test } from "node:test";
import { readCodexAccount } from "../src/providers/codex";

const account = {
  type: "chatgpt",
  email: "fixture@example.invalid",
  planType: "plus",
};
const quota = {
  rateLimits: {
    primary: {
      usedPercent: 25,
      windowDurationMins: 300,
      resetsAt: Math.floor(Date.now() / 1000) + 3600,
    },
  },
};
function fake(
  options: {
    email?: string;
    failQuota?: boolean;
    switchAccount?: boolean;
    signedOut?: boolean;
    api?: boolean;
  } = {},
) {
  let calls = 0;
  const methods: string[] = [];
  return {
    methods,
    async request(method: string) {
      methods.push(method);
      if (method === "account/read") {
        calls++;
        return {
          account: options.signedOut
            ? null
            : options.api
              ? { type: "apiKey" }
              : {
                  ...account,
                  email:
                    options.switchAccount && calls > 1
                      ? "different@example.invalid"
                      : options.email || account.email,
                },
        };
      }
      if (options.failQuota) throw new Error("raw provider secret");
      return quota;
    },
  };
}
test("Codex cache is reused only after verifying current identity", async () => {
  const first = await readCodexAccount(fake());
  const server = fake();
  const next = await readCodexAccount(server, first.cache);
  assert.deepEqual(server.methods, ["account/read"]);
  assert.equal(next.usage.observedAt, first.usage.observedAt);
  assert.ok(!JSON.stringify(first.cache).includes(account.email));
});
test("account changes invalidate cache and changing mid-refresh rejects", async () => {
  const first = await readCodexAccount(fake());
  const changed = fake({ email: "new@example.invalid" });
  const next = await readCodexAccount(changed, first.cache);
  assert.ok(changed.methods.includes("account/rateLimits/read"));
  assert.notEqual(next.cache?.fingerprint, first.cache?.fingerprint);
  await assert.rejects(
    readCodexAccount(fake({ switchAccount: true })),
    /account changed/,
  );
});
test("quota failure preserves only the observation of a twice-verified matching account", async () => {
  const first = await readCodexAccount(fake());
  const next = await readCodexAccount(
    fake({ failQuota: true }),
    first.cache,
    true,
  );
  assert.equal(next.usage.freshness, "stale");
  assert.equal(next.usage.connectionStatus, "error");
  assert.equal(next.usage.quotaWindows[0].usedPercent, 25);
  assert.ok(!JSON.stringify(next).includes("secret"));
  await assert.rejects(
    readCodexAccount(
      fake({ failQuota: true, email: "other@example.invalid" }),
      first.cache,
      true,
    ),
  );
});
test("signed-out and API accounts never display cached subscription quotas", async () => {
  const first = await readCodexAccount(fake());
  await assert.rejects(
    readCodexAccount(fake({ signedOut: true }), first.cache),
    /Sign in/,
  );
  const api = await readCodexAccount(fake({ api: true }), first.cache);
  assert.equal(api.usage.billingMode, "api");
  assert.deepEqual(api.usage.quotaWindows, []);
  assert.equal(api.cache, null);
});
