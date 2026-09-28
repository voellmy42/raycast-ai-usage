import { homedir } from "node:os";
import { join } from "node:path";
export const defaultClaudeSnapshot = join(
  homedir(),
  "Library/Application Support/AI Usage/claude-usage.json",
);
export function shellQuote(value: string) {
  return "'" + value.replaceAll("'", "'\\''") + "'";
}
export function claudeCaptureCommand(assetsPath: string, snapshot?: string) {
  return `node ${shellQuote(join(assetsPath, "claude-statusline.cjs"))} ${shellQuote(snapshot || defaultClaudeSnapshot)}`;
}
