import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, stat, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { boundedLines } from "../src/lib/bounded-lines";
test("discard an oversized line and recover subsequent records across chunk boundaries", async () => {
  const root = await mkdtemp(join(tmpdir(), "bounded-lines-"));
  try {
    const file = join(root, "test.jsonl");
    await writeFile(
      file,
      "first\r\n" + "x".repeat(8_000_000) + '\n{"model":"é"}\nlast',
    );
    const result = [];
    for await (const line of boundedLines(file, (await stat(file)).size, 1000))
      result.push(line);
    assert.deepEqual(result, ["first", null, '{"model":"é"}', "last"]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
