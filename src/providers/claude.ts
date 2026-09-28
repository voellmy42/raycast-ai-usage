import { readFile, stat } from "node:fs/promises";
import { isAbsolute } from "node:path";
import { baseUsage, normalizeClaude } from "../lib/normalize";
import { ConnectionError } from "../lib/app-server";
import type { Usage } from "../lib/types";
import { defaultClaudeSnapshot } from "../lib/claude-setup";

export async function readClaude(path?: string): Promise<Usage> {
  if (!path) {
    try {
      await stat(defaultClaudeSnapshot);
      path = defaultClaudeSnapshot;
    } catch {
      return {
        ...baseUsage("claude"),
        connectionStatus: "not_configured",
        error: {
          code: "setup",
          message:
            "Connect a Claude Code quota snapshot in preferences. See setup instructions; current quota fields require Claude Code 2.1.251 or later.",
          retryAt: null,
        },
      };
    }
  }
  if (!isAbsolute(path))
    throw new ConnectionError(
      "invalid_snapshot",
      "Choose an absolute Claude snapshot path in preferences.",
    );
  if ((await stat(path)).size > 64_000)
    throw new ConnectionError(
      "invalid_snapshot",
      "Claude snapshot is too large. Select the helper's usage-only snapshot.",
    );
  return normalizeClaude(JSON.parse(await readFile(path, "utf8")));
}
