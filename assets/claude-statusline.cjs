#!/usr/bin/env node
// Shipped as an extension asset. Compose before an existing renderer; emits no status-line text.
const { mkdir, writeFile, rename, rm } = require("node:fs/promises");
const { dirname, isAbsolute } = require("node:path");
const { randomUUID } = require("node:crypto");
let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  input += chunk;
  if (Buffer.byteLength(input) > 1_000_000) {
    process.stderr.write("AI Usage: status-line input too large.\n");
    process.exit(1);
  }
});
process.stdin.on("end", async () => {
  const destination = process.argv[2];
  let temporary;
  try {
    if (!destination || !isAbsolute(destination))
      throw new Error("An absolute snapshot destination is required.");
    const data = JSON.parse(input);
    const rate_limits = {};
    for (const key of ["five_hour", "seven_day", "spend_limit"]) {
      const value = data.rate_limits?.[key];
      if (value == null) continue;
      const percent = value.used_percentage;
      const reset = value.resets_at;
      if (
        (percent != null &&
          (typeof percent !== "number" ||
            !Number.isFinite(percent) ||
            percent < 0)) ||
        (reset != null &&
          (typeof reset !== "number" ||
            !Number.isFinite(reset) ||
            reset < 0 ||
            !Number.isFinite(new Date(reset * 1000).getTime())))
      )
        throw new Error("Invalid quota fields.");
      rate_limits[key] = {
        used_percentage: percent ?? null,
        resets_at: reset ?? null,
      };
    }
    const snapshot = {
      schemaVersion: 1,
      observedAt: new Date().toISOString(),
      rate_limits,
    };
    await mkdir(dirname(destination), { recursive: true, mode: 0o700 });
    temporary = `${destination}.${randomUUID()}.tmp`;
    await writeFile(temporary, JSON.stringify(snapshot), {
      mode: 0o600,
      flag: "wx",
    });
    await rename(temporary, destination);
  } catch {
    if (temporary) await rm(temporary, { force: true }).catch(() => {});
    process.stderr.write(
      "AI Usage: could not capture quota snapshot. Check destination and input.\n",
    );
    process.exitCode = 1;
  }
});
