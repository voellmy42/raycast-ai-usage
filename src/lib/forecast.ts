import type { QuotaWindow, Usage } from "./types";
export interface QuotaObservation {
  time: number;
  windowId: string;
  resetsAt: string;
  used: number;
}
export interface Forecast {
  rate: number;
  remaining: number;
  exhaustion: number | null;
  headroom: number;
  reset: number;
  samples: number;
  from: number;
  observedAt: number;
}
export function observationsFromUsage(
  usage: Usage,
  now = Date.now(),
): QuotaObservation[] {
  const time = Date.parse(usage.observedAt ?? "");
  if (
    usage.connectionStatus !== "ready" ||
    usage.freshness !== "fresh" ||
    !Number.isFinite(time) ||
    time > now ||
    now - time > 300_000
  )
    return [];
  return usage.quotaWindows.flatMap((w) =>
    w.usedPercent !== null &&
    Number.isFinite(w.usedPercent) &&
    w.usedPercent >= 0 &&
    w.resetsAt &&
    Date.parse(w.resetsAt) > now
      ? [{ time, windowId: w.id, resetsAt: w.resetsAt, used: w.usedPercent }]
      : [],
  );
}
export function forecast(
  window: QuotaWindow,
  observations: QuotaObservation[],
  now = Date.now(),
): { value: Forecast | null; reason: string } {
  const reset = Date.parse(window.resetsAt ?? "");
  if (!Number.isFinite(reset) || reset <= now || window.usedPercent === null)
    return {
      value: null,
      reason: "A current quota and future reset time are required.",
    };
  const unique = new Map<number, QuotaObservation>();
  for (const p of observations)
    if (
      p.windowId === window.id &&
      p.resetsAt === window.resetsAt &&
      p.time <= now &&
      p.time >= now - 2 * 3600_000
    )
      unique.set(p.time, p);
  let points = [...unique.values()].sort((a, b) => a.time - b.time);
  // Restart after idle gaps or a quota decrease; do not extrapolate across them.
  let start = 0;
  for (let i = 1; i < points.length; i++)
    if (
      points[i].used < points[i - 1].used ||
      points[i].time - points[i - 1].time > 30 * 60_000
    )
      start = i;
  points = points.slice(start);
  const first = points[0],
    last = points.at(-1);
  if (!last || now - last.time > 300_000)
    return {
      value: null,
      reason: "Fresh quota observations are needed (within five minutes).",
    };
  if (last.used !== window.usedPercent)
    return {
      value: null,
      reason: "Waiting for an observation matching the current quota.",
    };
  if (points.length < 3 || last.time - first.time < 600_000)
    return {
      value: null,
      reason:
        "Collecting history: at least three readings over ten minutes are needed.",
    };
  const rate = (last.used - first.used) / ((last.time - first.time) / 3600_000);
  const remaining = Math.max(0, 100 - last.used);
  const exhaustion =
    remaining === 0
      ? last.time
      : rate > 0
        ? last.time + (remaining / rate) * 3600_000
        : null;
  const headroom = Math.max(
    0,
    Math.min(100, remaining - (rate * (reset - last.time)) / 3600_000),
  );
  return {
    value: {
      rate,
      remaining,
      exhaustion,
      headroom,
      reset,
      samples: points.length,
      from: first.time,
      observedAt: last.time,
    },
    reason: "",
  };
}
export function forecastText(result: ReturnType<typeof forecast>) {
  const f = result.value;
  if (!f) return result.reason;
  if (f.remaining === 0) return "This quota is already exhausted.";
  if (f.rate === 0)
    return `No quota decrease observed. ${Math.round(f.headroom)}% would remain at reset if that continues.`;
  const at = new Date(f.exhaustion!).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return f.exhaustion! < f.reset
    ? `At the recent pace, quota reaches its limit around ${at}, before reset. Estimate: ${f.rate.toFixed(1)} percentage points/hour.`
    : `At the recent pace, about ${Math.round(f.headroom)}% remains at reset. Estimate: ${f.rate.toFixed(1)} percentage points/hour.`;
}
