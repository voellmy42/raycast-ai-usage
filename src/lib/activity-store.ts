import { boundedLines } from "./bounded-lines";
import {
  mkdir,
  readdir,
  readFile,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import {
  ActivityEvent,
  ActivityProvider,
  createActivityParser,
  deduplicate,
  hash,
  periodStart,
  validEvent,
} from "./activity";

interface Entry {
  signature: string;
  events: ActivityEvent[];
  skipped: number;
}
export interface ActivityImport {
  events: ActivityEvent[];
  notes: string[];
  files: number;
  updatedAt: number;
}
export async function importActivity(
  roots: { provider: ActivityProvider; path: string; optional?: boolean }[],
  cacheDirectory: string,
  now = Date.now(),
): Promise<ActivityImport> {
  await mkdir(cacheDirectory, { recursive: true, mode: 0o700 });
  const cacheFile = join(cacheDirectory, "activity-v1.json");
  let old: Record<string, Entry> = {};
  try {
    if ((await stat(cacheFile)).size < 10_000_000) {
      const parsed = JSON.parse(await readFile(cacheFile, "utf8"));
      if (
        parsed.version === 1 &&
        parsed.files &&
        typeof parsed.files === "object"
      )
        old = parsed.files;
    }
  } catch {
    /* A missing or damaged cache is rebuilt from source. */
  }
  const next: Record<string, Entry> = {};
  const events: ActivityEvent[] = [],
    notes = new Set<string>();
  let files = 0,
    bytes = 0;
  const cutoff = periodStart(90, now);
  async function walk(
    path: string,
    provider: ActivityProvider,
    depth = 0,
    optional = false,
  ): Promise<void> {
    if (depth > 12) {
      notes.add(`${provider}: directory depth limit reached.`);
      return;
    }
    let entries;
    try {
      entries = await readdir(path, { withFileTypes: true });
    } catch (error) {
      if (optional && (error as NodeJS.ErrnoException).code === "ENOENT")
        return;
      notes.add(`${provider}: some history directories are unavailable.`);
      return;
    }
    entries.sort((a, b) => b.name.localeCompare(a.name));
    for (const entry of entries) {
      if (files >= 5000 || bytes >= 4_000_000_000 || events.length >= 25_000) {
        notes.add("Import limit reached; coverage is partial.");
        return;
      }
      const full = join(path, entry.name);
      if (entry.isDirectory()) {
        await walk(full, provider, depth + 1);
        continue;
      }
      if (!entry.isFile() || !entry.name.endsWith(".jsonl")) continue;
      try {
        const info = await stat(full);
        if (info.mtimeMs < cutoff) continue;
        files++;
        const key = hash(`${provider}:${full}`),
          signature = `${info.ino}:${info.size}:${info.mtimeMs}:${info.ctimeMs}`;
        const cached = old[key];
        if (
          cached?.signature === signature &&
          Array.isArray(cached.events) &&
          cached.events.every(validEvent) &&
          Number.isSafeInteger(cached.skipped) &&
          cached.skipped >= 0
        ) {
          const retained = cached.events.filter(
            (e) => e.time >= cutoff && e.time <= now && e.provider === provider,
          );
          next[key] = {
            signature,
            skipped: cached.skipped,
            events: retained.map(
              ({
                id,
                provider,
                model,
                time,
                input,
                output,
                cached,
                cacheWrite,
              }) => ({
                id,
                provider,
                model,
                time,
                input,
                output,
                cached,
                cacheWrite,
              }),
            ),
          };
          events.push(...next[key].events);
          if (cached.skipped)
            notes.add(
              `${provider}: some oversized, incomplete, or unsupported records were skipped; history may be partial.`,
            );
          continue;
        }
        if (info.size > 512_000_000 || bytes + info.size > 4_000_000_000) {
          notes.add(
            `${provider}: large history files skipped; coverage is partial.`,
          );
          continue;
        }
        bytes += info.size;
        const parser = createActivityParser(provider, key, now),
          collected: ActivityEvent[] = [];

        let malformed = 0;
        {
          for await (const line of boundedLines(full, info.size)) {
            if (line === null) {
              malformed++;
              continue;
            }
            try {
              const event = parser.parse(JSON.parse(line));
              if (event && event.time >= cutoff && event.time <= now)
                collected.push(event);
            } catch {
              malformed++;
            }
            if (collected.length + events.length >= 25_000) {
              notes.add("Import limit reached; coverage is partial.");
              malformed++;
              break;
            }
          }
        }
        const skipped = malformed + parser.skipped();
        const normalized = deduplicate(collected);
        // A file appended during the scan must be reparsed on the next refresh.
        const after = await stat(full);
        if (after.size === info.size && after.mtimeMs === info.mtimeMs)
          next[key] = { signature, events: normalized, skipped };
        events.push(...normalized);
        if (skipped)
          notes.add(
            `${provider}: some oversized, incomplete, or unsupported records were skipped; history may be partial.`,
          );
      } catch {
        notes.add(`${provider}: some history files could not be read.`);
      }
    }
  }
  for (const root of roots)
    await walk(root.path, root.provider, 0, root.optional);
  for (const provider of new Set(roots.map((r) => r.provider))) {
    if (!events.some((e) => e.provider === provider))
      notes.add(`${provider}: no supported records in the last 90 days.`);
  }
  const temporary = join(cacheDirectory, `activity-${randomUUID()}.tmp`);
  try {
    await writeFile(temporary, JSON.stringify({ version: 1, files: next }), {
      mode: 0o600,
    });
    await rename(temporary, cacheFile);
  } catch {
    await rm(temporary, { force: true }).catch(() => {});
    notes.add(
      "History cache could not be saved; the next refresh will reimport.",
    );
  }
  return {
    events: deduplicate(events),
    notes: [...notes],
    files,
    updatedAt: now,
  };
}
