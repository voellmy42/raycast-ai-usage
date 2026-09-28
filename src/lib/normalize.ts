import type { Freshness, Provider, Usage, QuotaWindow } from "./types";

export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid provider response.");
  return value as Record<string, unknown>;
}
function number(value: unknown, positive = false): number | null {
  if (value == null) return null;
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0 ||
    (positive && value === 0)
  )
    throw new Error("Invalid provider value.");
  return value;
}
function timestamp(value: unknown): string | null {
  const seconds = number(value);
  if (seconds == null) return null;
  const date = new Date(seconds * 1000);
  if (!Number.isFinite(date.getTime())) throw new Error("Invalid reset time.");
  return date.toISOString();
}
export function baseUsage(
  provider: Provider,
  at = new Date().toISOString(),
): Usage {
  return {
    schemaVersion: 1,
    provider,
    connectionId: `${provider}-default`,
    account: {
      label:
        provider === "codex"
          ? "Codex"
          : provider === "claude"
            ? "Claude Code"
            : "Gemini CLI",
      plan: null,
    },
    billingMode: "unknown",
    connectionStatus: "ready",
    freshness: "unavailable",
    source: null,
    observedAt: null,
    lastAttemptAt: at,
    quotaWindows: [],
    activity: null,
    spend: null,
    error: null,
  };
}
export function remainingPercent(used: number | null): number | null {
  return used === null ? null : Math.max(0, 100 - used);
}
export function freshness(usage: Usage, now = Date.now()): Freshness {
  if (!usage.observedAt || !usage.quotaWindows.length) return "unavailable";
  if (
    usage.quotaWindows.every(
      (window) =>
        window.resetsAt !== null && Date.parse(window.resetsAt) <= now,
    )
  )
    return "expired";
  return now - Date.parse(usage.observedAt) > 5 * 60 * 1000 ? "stale" : "fresh";
}
export function normalizeCodex(
  raw: unknown,
  plan: string | null,
  at = new Date().toISOString(),
): Usage {
  const response = object(raw);
  const buckets =
    response.rateLimitsByLimitId != null
      ? object(response.rateLimitsByLimitId)
      : response.rateLimits != null
        ? { codex: response.rateLimits }
        : {};
  const quotaWindows: QuotaWindow[] = [];
  for (const [bucketId, value] of Object.entries(buckets)) {
    if (value == null) continue;
    const bucket = object(value);
    const bucketLabel =
      typeof bucket.limitName === "string"
        ? bucket.limitName
        : bucketId === "codex"
          ? "Codex"
          : bucketId.replaceAll("_", " ");
    for (const key of ["primary", "secondary"] as const) {
      if (bucket[key] == null) continue;
      const window = object(bucket[key]);
      const duration = number(window.windowDurationMins, true);
      const period =
        duration === 300
          ? "5 Hours"
          : duration === 10080
            ? "Weekly"
            : duration
              ? `${duration} Minutes`
              : key === "primary"
                ? "Primary"
                : "Secondary";
      quotaWindows.push({
        id: `${bucketId}-${key}`,
        label: `${bucketLabel} · ${period}`,
        scope: "account",
        model: null,
        usedPercent: number(window.usedPercent),
        windowDurationMinutes: duration,
        resetsAt: timestamp(window.resetsAt),
      });
    }
  }
  const usage: Usage = {
    ...baseUsage("codex", at),
    account: { label: "Codex", plan },
    billingMode: "subscription",
    source: "codex_app_server",
    observedAt: at,
    quotaWindows,
  };
  usage.freshness = freshness(usage, Date.parse(at));
  return usage;
}
export function normalizeClaude(
  raw: unknown,
  at = new Date().toISOString(),
): Usage {
  const snapshot = object(raw);
  const observed =
    typeof snapshot.observedAt === "string"
      ? Date.parse(snapshot.observedAt)
      : NaN;
  if (
    snapshot.schemaVersion !== 1 ||
    !Number.isFinite(observed) ||
    observed > Date.parse(at) + 60_000
  )
    throw new Error("Invalid Claude usage snapshot.");
  const limits = object(snapshot.rate_limits);
  const quotaWindows: QuotaWindow[] = [];
  for (const [key, label, duration] of [
    ["five_hour", "5 Hours", 300],
    ["seven_day", "Weekly", 10080],
    ["spend_limit", "Gateway Spend Limit", null],
  ] as const) {
    if (limits[key] == null) continue;
    const window = object(limits[key]);
    quotaWindows.push({
      id: key,
      label,
      scope: "account",
      model: null,
      usedPercent: number(window.used_percentage),
      windowDurationMinutes: duration,
      resetsAt: timestamp(window.resets_at),
    });
  }
  const usage: Usage = {
    ...baseUsage("claude", at),
    billingMode: quotaWindows.some((w) => w.id !== "spend_limit")
      ? "subscription"
      : "unknown",
    source: "claude_statusline_snapshot",
    observedAt: new Date(observed).toISOString(),
    quotaWindows,
  };
  usage.freshness = freshness(usage, Date.parse(at));
  return usage;
}

// Cache records are re-constructed from allowed fields instead of trusting serialized objects.
export function validateCachedUsage(raw: unknown): Usage {
  const record = object(raw);
  if (
    record.schemaVersion !== 1 ||
    record.provider !== "codex" ||
    record.source !== "codex_app_server" ||
    typeof record.observedAt !== "string" ||
    !Number.isFinite(Date.parse(record.observedAt)) ||
    !Array.isArray(record.quotaWindows)
  )
    throw new Error("Invalid usage cache.");
  if (Date.parse(record.observedAt) > Date.now() + 60_000)
    throw new Error("Invalid usage cache timestamp.");
  const quotaWindows = record.quotaWindows.map((rawWindow) => {
    const window = object(rawWindow);
    if (
      typeof window.id !== "string" ||
      typeof window.label !== "string" ||
      window.scope !== "account" ||
      window.model !== null
    )
      throw new Error("Invalid quota cache.");
    if (
      window.resetsAt !== null &&
      (typeof window.resetsAt !== "string" ||
        !Number.isFinite(Date.parse(window.resetsAt)))
    )
      throw new Error("Invalid quota reset.");
    return {
      id: window.id,
      label: window.label,
      scope: "account" as const,
      model: null,
      usedPercent: number(window.usedPercent),
      windowDurationMinutes: number(window.windowDurationMinutes, true),
      resetsAt: window.resetsAt as string | null,
    };
  });
  const account = object(record.account);
  return {
    ...baseUsage("codex"),
    account: {
      label: "Codex",
      plan: typeof account.plan === "string" ? account.plan : null,
    },
    source: "codex_app_server",
    billingMode: "subscription",
    observedAt: record.observedAt,
    quotaWindows,
  };
}
