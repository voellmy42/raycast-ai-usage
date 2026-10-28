import type { QuotaWindow, Usage } from "./types";
import { remainingPercent } from "./normalize";
export function percent(value: number | null): string {
  return value === null ? "Unknown" : `${Math.round(value)}%`;
}
export function isExpired(window: QuotaWindow, now = Date.now()) {
  return window.resetsAt !== null && Date.parse(window.resetsAt) <= now;
}
export function quotaSummary(window: QuotaWindow): string {
  if (isExpired(window)) return "Expired observation";
  return `${percent(remainingPercent(window.usedPercent))} Remaining`;
}
export function resetText(window: QuotaWindow, now = Date.now()): string {
  if (!window.resetsAt) return "Reset time unavailable";
  const ms = Date.parse(window.resetsAt) - now;
  if (ms <= 0) return "Window ended — refresh required";
  const minutes = Math.ceil(ms / 60_000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const remainder = minutes % 60;
  return `Resets in ${days ? `${days}d ` : ""}${hours ? `${hours}h ` : ""}${remainder}m`;
}
export function observationText(usage: Usage): string {
  if (!usage.observedAt) return "No usage data";
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - Date.parse(usage.observedAt)) / 60_000),
  );
  return minutes < 1
    ? "Observed just now"
    : minutes < 60
      ? `Observed ${minutes}m ago`
      : `Observed ${Math.floor(minutes / 60)}h ago`;
}
export function markdownEscape(value: string): string {
  return value.replace(/[\\`*_{}[\]()#+.!|<>]/g, "\\$&");
}

export function shortQuotaLabel(window: QuotaWindow): string {
  return window.label.replace(/^Codex\s*·\s*/i, "");
}
export function quotaPresentation(
  window: QuotaWindow,
  stale = false,
  now = Date.now(),
) {
  if (isExpired(window, now))
    return {
      remaining: null,
      state: "expired",
      label: "Refresh required",
    } as const;
  const remaining = remainingPercent(window.usedPercent);
  if (remaining === null)
    return {
      remaining,
      state: "unknown",
      label: "Capacity unavailable",
    } as const;
  if (stale)
    return {
      remaining,
      state: "stale",
      label: "Last observed capacity",
    } as const;
  if (remaining <= 10)
    return { remaining, state: "low", label: "Low capacity" } as const;
  if (remaining <= 25)
    return {
      remaining,
      state: "approaching",
      label: "Approaching limit",
    } as const;
  return {
    remaining,
    state: "available",
    label: "Capacity available",
  } as const;
}
export function connectionLabel(usage: Usage) {
  if (usage.connectionStatus === "sign_in_required") return "Sign In Required";
  if (usage.connectionStatus === "error") return "Connection Failed";
  if (usage.connectionStatus === "unsupported")
    return usage.provider === "gemini"
      ? "Coming Later"
      : "Account Not Supported";
  if (usage.connectionStatus === "ready") return "No Quota Reported";
  return "Set Up Connection";
}
