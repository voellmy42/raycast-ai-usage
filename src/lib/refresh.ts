import { ConnectionError } from "./app-server";
import { baseUsage } from "./normalize";
import type { Provider, Usage } from "./types";

export function failure(provider: Provider, error: unknown): Usage {
  const code = error instanceof ConnectionError ? error.code : "read_failed";
  const message =
    error instanceof ConnectionError
      ? error.message
      : provider === "claude"
        ? "Could not read a valid Claude usage snapshot. Check the file and helper setup."
        : "Could not read Codex account usage. Check your login and executable, then refresh.";
  return {
    ...baseUsage(provider),
    connectionStatus:
      code === "sign_in_required" ? "sign_in_required" : "error",
    error: { code, message, retryAt: null },
  };
}
export async function isolatedRead(
  provider: Provider,
  read: () => Promise<Usage>,
): Promise<Usage> {
  try {
    return await read();
  } catch (error) {
    return failure(provider, error);
  }
}
