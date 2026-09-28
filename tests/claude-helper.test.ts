import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

async function capture(
  destination: string,
  value: unknown,
): Promise<number | null> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [
      join(__dirname, "../assets/claude-statusline.cjs"),
      destination,
    ]);
    child.on("error", reject);
    child.stderr.resume();
    child.stdout.resume();
    child.on("close", resolve);
    child.stdin.end(JSON.stringify(value));
  });
}
test("Claude helper persists only quotas, clears missing windows, and rejects malformed quota", async () => {
  const folder = await mkdtemp(join(tmpdir(), "ai-usage-test-"));
  const file = join(folder, "snapshot.json");
  try {
    assert.equal(
      await capture(file, {
        model: "private",
        transcript_path: "secret",
        rate_limits: {
          five_hour: { used_percentage: 25, resets_at: 1791089165 },
        },
      }),
      0,
    );
    let snapshot = await readFile(file, "utf8");
    assert.ok(!snapshot.includes("secret") && !snapshot.includes("private"));
    assert.equal(
      JSON.parse(snapshot).rate_limits.five_hour.used_percentage,
      25,
    );
    assert.equal(await capture(file, { rate_limits: {} }), 0);
    snapshot = await readFile(file, "utf8");
    assert.deepEqual(JSON.parse(snapshot).rate_limits, {});
    assert.equal(
      await capture(file, {
        rate_limits: { five_hour: { used_percentage: "oops" } },
      }),
      1,
    );
    assert.deepEqual(JSON.parse(await readFile(file, "utf8")).rate_limits, {});
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
});
