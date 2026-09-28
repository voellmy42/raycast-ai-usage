import { access, realpath } from "node:fs/promises";
import { constants } from "node:fs";
import { homedir } from "node:os";
import { isAbsolute, join } from "node:path";
import { ConnectionError } from "./app-server";

export async function codexCommand(
  custom?: string,
): Promise<{ command: string; args: string[] }> {
  const candidates = custom?.trim()
    ? [custom.trim()]
    : [
        "/Applications/ChatGPT.app/Contents/Resources/codex-cli/bin/codex",
        "/Applications/ChatGPT.app/Contents/Resources/codex-cli/CodexCLI.app/Contents/MacOS/codex",
        "/Applications/Codex.app/Contents/Resources/codex",
        join(
          homedir(),
          "Applications/ChatGPT.app/Contents/Resources/codex-cli/bin/codex",
        ),
        join(homedir(), ".local/bin/codex"),
        "/opt/homebrew/bin/codex",
        "/usr/local/bin/codex",
      ];
  for (const path of candidates) {
    if (!isAbsolute(path))
      throw new ConnectionError(
        "invalid_path",
        "Codex executable must be an absolute path.",
      );
    try {
      await access(path, constants.X_OK);
      const resolved = await realpath(path);
      return resolved.endsWith(".js")
        ? { command: process.execPath, args: [resolved, "app-server"] }
        : { command: path, args: ["app-server"] };
    } catch {
      /* Try next installation. */
    }
  }
  throw new ConnectionError(
    "not_installed",
    "Install Codex CLI or ChatGPT, then sign in with your ChatGPT account.",
  );
}
