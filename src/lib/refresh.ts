import { ConnectionError } from "./app-server";
import { baseUsage } from "./normalize";
import type { Provider, Usage } from "./types";

export function refreshFeedback(usage: Usage, cacheError = false) {
  if (usage.connectionStatus !== "ready")
    return {
      success: false,
      title: "Could Not Refresh Usage",
      message:
        usage.error?.message ?? "Check your Codex connection and try again.",
    };
  if (
    usage.freshness !== "fresh" ||
    !usage.quotaWindows.some((window) => window.usedPercent !== null)
  )
    return {
      success: false,
      title: "No Current Quota Available",
      message:
        "Codex did not report current subscription capacity. Check your account and try again.",
    };
  if (cacheError)
    return {
      success: false,
      title: "Usage Updated, Cache Not Saved",
      message:
        "Current usage is shown. The local cache could not be saved; try refreshing again.",
    };
  return {
    success: true,
    title: "Usage Updated",
    message: "Codex subscription quotas are up to date.",
  };
}

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
