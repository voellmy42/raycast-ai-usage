import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { join } from "node:path";
import { test } from "node:test";
import { AppServer } from "../src/lib/app-server";

function server(mode: string, timeout = 1000) {
  const child = spawn(process.execPath, [
    join(__dirname, "fixtures/app-server.cjs"),
    mode,
  ]);
  return { child, rpc: new AppServer(child, timeout) };
}
test("RPC handles fragmented stdout and notifications", async () => {
  const { rpc } = server("normal");
  try {
    assert.deepEqual(await rpc.request("account/read"), {
      method: "account/read",
    });
  } finally {
    rpc.close();
  }
});
for (const mode of ["exit", "timeout", "malformed", "null", "huge", "error"]) {
  test(`RPC settles pending requests for ${mode} and does not expose provider messages`, async () => {
    const { rpc } = server(mode, mode === "timeout" ? 50 : 1000);
    try {
      await assert.rejects(
        rpc.request("account/read"),
        (error: Error) => !error.message.includes("private-token"),
      );
    } finally {
      rpc.close();
    }
  });
}
test("RPC launch failures reject", async () => {
  const child = spawn("/not-an-installed-codex-binary", []);
  const rpc = new AppServer(child);
  await assert.rejects(rpc.request("initialize"), /Could not start Codex/);
});
