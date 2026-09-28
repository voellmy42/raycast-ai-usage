import {
  mkdir,
  readdir,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { hash } from "./activity";
import { observationsFromUsage, QuotaObservation } from "./forecast";
import type { Usage } from "./types";

export async function recordQuota(
  directory: string,
  identity: string,
  usage: Usage,
  now = Date.now(),
): Promise<QuotaObservation[]> {
  const root = join(directory, "quota-history-v1", hash(identity));
  await mkdir(root, { recursive: true, mode: 0o700 });
  const incoming = observationsFromUsage(usage, now);
  if (incoming.length) {
    const name = `${incoming[0].time}.json`;
    const temp = join(root, `${randomUUID()}.tmp`);
    await writeFile(temp, JSON.stringify(incoming), { mode: 0o600 });
    await rename(temp, join(root, name));
  }
  const files = (await readdir(root)).filter((f) => /^\d+\.json$/.test(f));
  const cutoff = now - 90 * 86400_000;
  for (const file of files)
    if (Number(file.slice(0, -5)) < cutoff)
      await rm(join(root, file), { force: true });
  const recent = files
    .filter((f) => Number(f.slice(0, -5)) >= now - 2 * 3600_000)
    .sort()
    .slice(-256);
  const result: QuotaObservation[] = [];
  for (const file of recent) {
    try {
      const values = JSON.parse(await readFile(join(root, file), "utf8"));
      if (Array.isArray(values))
        for (const v of values)
          if (
            v &&
            Number.isFinite(v.time) &&
            v.time <= now &&
            typeof v.windowId === "string" &&
            typeof v.resetsAt === "string" &&
            Number.isFinite(Date.parse(v.resetsAt)) &&
            Number.isFinite(v.used) &&
            v.used >= 0
          )
            result.push({
              time: v.time,
              windowId: v.windowId,
              resetsAt: v.resetsAt,
              used: v.used,
            });
    } catch {
      /* Ignore incomplete or invalid history entries. */
    }
  }
  return result;
}
