import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtemp,
  mkdir,
  writeFile,
  appendFile,
  rm,
  symlink,
  readFile,
} from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { importActivity } from "../src/lib/activity-store";
import { recordQuota } from "../src/lib/quota-history";
import { baseUsage } from "../src/lib/normalize";
const now = Date.now();
const message = (id: string, output = 10) =>
  JSON.stringify({
    type: "assistant",
    timestamp: new Date(now).toISOString(),
    message: {
      id,
      model: "claude-test",
      content: "SECRET CONVERSATION MUST NOT BE STORED",
      usage: {
        input_tokens: 10,
        output_tokens: output,
        cache_read_input_tokens: 20,
        cache_creation_input_tokens: 0,
      },
    },
  });
test("incremental import, streaming duplicates, appends, partial records, truncation and symlinks", async () => {
  const root = await mkdtemp(join(tmpdir(), "activity-test-"));
  try {
    const source = join(root, "source"),
      cache = join(root, "cache");
    await mkdir(source);
    const path = join(source, "session.jsonl");
    await writeFile(path, message("one") + "\n");
    await symlink(path, join(source, "linked.jsonl"));
    const roots = [{ provider: "claude" as const, path: source }];
    const first = await importActivity(roots, cache, now);
    const second = await importActivity(roots, cache, now);
    assert.deepEqual(second.events, first.events);
    assert.equal(first.events.length, 1);
    assert.equal(first.files, 1);
    assert.equal(
      (await readFile(join(cache, "activity-v1.json"), "utf8")).includes(
        "SECRET",
      ),
      false,
    );
    await appendFile(
      path,
      message("one", 20) + "\n" + message("two").slice(0, 20),
    );
    const partial = await importActivity(roots, cache, now);
    assert.equal(partial.events.length, 1);
    assert.equal(partial.events[0].output, 20);
    assert.ok(partial.notes.length);
    await appendFile(path, message("two").slice(20) + "\n");
    assert.equal((await importActivity(roots, cache, now)).events.length, 2);
    await writeFile(path, message("new") + "\n");
    assert.equal((await importActivity(roots, cache, now)).events.length, 1);
    await rm(path);
    assert.equal((await importActivity(roots, cache, now)).events.length, 0);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
test("quota observations remain partitioned by identity and deduplicate timestamps", async () => {
  const root = await mkdtemp(join(tmpdir(), "quota-test-"));
  try {
    const usage = {
      ...baseUsage("codex"),
      connectionStatus: "ready" as const,
      freshness: "fresh" as const,
      observedAt: new Date(now).toISOString(),
      quotaWindows: [
        {
          id: "primary",
          label: "Quota",
          scope: "account" as const,
          model: null,
          usedPercent: 20,
          windowDurationMinutes: 300,
          resetsAt: new Date(now + 3600_000).toISOString(),
        },
      ],
    };
    assert.equal((await recordQuota(root, "account-a", usage, now)).length, 1);
    assert.equal((await recordQuota(root, "account-a", usage, now)).length, 1);
    assert.equal(
      (await recordQuota(root, "account-b", baseUsage("codex"), now)).length,
      0,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
