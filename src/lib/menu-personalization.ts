import type { Provider, Usage } from "./types";
import { isExpired, quotaPresentation, resetText } from "./format";
export const selectionKey = "menu-selection-v1";
export interface MenuSelection {
  provider: Provider;
  windowId: string | null;
}
export function parseSelection(raw?: string): MenuSelection {
  try {
    const value = JSON.parse(raw ?? "null");
    if (
      value &&
      value.provider === "codex" &&
      (value.windowId === null ||
        (typeof value.windowId === "string" && value.windowId.length > 0))
    )
      return { provider: value.provider, windowId: value.windowId };
  } catch {
    /* Invalid storage restores the default. */
  }
  return { provider: "codex", windowId: null };
}
export function menuPresentation(
  usages: Usage[],
  selection: MenuSelection,
  style = "compact",
  now = Date.now(),
) {
  const label = { codex: "Codex", claude: "Claude", gemini: "Gemini" }[
    selection.provider
  ];
  const usage = usages.find((item) => item.provider === selection.provider);
  const usable =
    usage &&
    (usage.connectionStatus === "ready" || usage.connectionStatus === "error");
  const window = usable
    ? selection.windowId !== null
      ? usage.quotaWindows.find((item) => item.id === selection.windowId)
      : usage.quotaWindows
          .filter((item) => !isExpired(item, now) && item.usedPercent !== null)
          .reduce<(typeof usage.quotaWindows)[number] | undefined>(
            (lowest, item) =>
              !lowest || item.usedPercent! > lowest.usedPercent!
                ? item
                : lowest,
            undefined,
          )
    : undefined;
  const stale =
    !!usage &&
    (usage.freshness === "stale" ||
      usage.connectionStatus === "error" ||
      !usage.observedAt ||
      now - Date.parse(usage.observedAt) > 300_000);
  const capacity =
    window &&
    usage?.freshness !== "expired" &&
    usage?.freshness !== "unavailable"
      ? quotaPresentation(window, stale, now)
      : undefined;
  if (!capacity || capacity.remaining === null)
    return {
      title: `${label} · Unavailable`,
      tooltip: `${label} · Selected quota unavailable. Open AI Usage to check the connection or choose another quota.`,
    };
  const reset = window?.resetsAt
    ? resetText(window, now)
        .replace("Resets in ", "")
        .replace(/(?:^| )0m$/, "")
    : "Reset unknown";
  const suffix = `${selection.provider === "claude" ? " · Snapshot" : ""}${stale ? " · Stale" : ""}`;
  return {
    title: `${style === "detailed" ? `${label} ` : ""}${Math.round(capacity.remaining)}%${style === "detailed" ? ` · ${reset}` : ""}${suffix}`,
    tooltip: `${label} · ${window!.label} · ${capacity.remaining}% remaining · ${window?.resetsAt ? resetText(window, now) : "Reset time unavailable"}${suffix}`,
  };
}
