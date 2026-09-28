import { createHash } from "node:crypto";

export type ActivityProvider = "codex" | "claude";
export interface ActivityEvent {
  id: string;
  provider: ActivityProvider;
  model: string;
  time: number;
  input: number;
  output: number;
  cached: number;
  cacheWrite: number;
}
export const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
const obj = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
const count = (value: unknown): value is number =>
  Number.isSafeInteger(value) && (value as number) >= 0;
const modelName = (value: unknown) =>
  typeof value === "string" && /^[a-zA-Z0-9._:/-]{1,120}$/.test(value)
    ? value
    : "Unknown model";

export function validEvent(value: unknown): value is ActivityEvent {
  const e = obj(value);
  return (
    typeof e.id === "string" &&
    /^[a-f0-9]{64}$/.test(e.id) &&
    (e.provider === "codex" || e.provider === "claude") &&
    typeof e.model === "string" &&
    (e.model === "Unknown model" || modelName(e.model) === e.model) &&
    typeof e.time === "number" &&
    Number.isFinite(e.time) &&
    [e.input, e.output, e.cached, e.cacheWrite].every(count) &&
    (e.cached as number) + (e.cacheWrite as number) <= (e.input as number)
  );
}

export function createActivityParser(
  provider: ActivityProvider,
  sourceId: string,
  now = Date.now(),
) {
  let session = sourceId;
  let model = "Unknown model";
  let previous: number[] | null = null;
  let skipped = 0;
  function parse(value: unknown): ActivityEvent | null {
    const r = obj(value),
      p = obj(r.payload);
    if (
      provider === "codex" &&
      r.type === "session_meta" &&
      typeof p.id === "string"
    )
      session = p.id;
    if (provider === "codex" && r.type === "turn_context")
      model = modelName(p.model);
    const candidate =
      provider === "codex"
        ? r.type === "event_msg" && p.type === "token_count"
        : r.type === "assistant" && !!obj(r.message).usage;
    if (!candidate) return null;
    const time =
      typeof r.timestamp === "string" ? Date.parse(r.timestamp) : NaN;
    if (!Number.isFinite(time) || time > now + 60_000) {
      skipped++;
      return null;
    }
    let event: ActivityEvent;
    if (provider === "codex") {
      const info = obj(p.info),
        total = obj(info.total_token_usage),
        last = obj(info.last_token_usage);
      // Cached input is a subset of input; reasoning is a subset of output.
      const counters = [
        total.input_tokens,
        total.output_tokens,
        total.cached_input_tokens,
      ];
      if (!counters.every(count)) {
        if (p.info != null) skipped++;
        return null;
      }
      const totals = counters as number[];
      const delta = previous
        ? totals.map((v, i) => v - previous![i])
        : [last.input_tokens, last.output_tokens, last.cached_input_tokens];
      previous = totals;
      if (!delta.every(count) || (delta[2] as number) > (delta[0] as number)) {
        skipped++;
        return null;
      }
      const [input, output, cached] = delta as number[];
      if (!input && !output) return null;
      // Cumulative counters deduplicate replayed observations, including copied sessions.
      event = {
        id: hash(`codex:${session}:${totals.join(":")}`),
        provider,
        model,
        time,
        input,
        output,
        cached,
        cacheWrite: 0,
      };
    } else {
      const message = obj(r.message),
        usage = obj(message.usage);
      const fields = [
        usage.input_tokens,
        usage.output_tokens,
        usage.cache_read_input_tokens,
        usage.cache_creation_input_tokens,
      ];
      if (!fields.every(count) || typeof message.id !== "string") {
        skipped++;
        return null;
      }
      const [fresh, output, cached, cacheWrite] = fields as number[];
      event = {
        id: hash(`claude:${message.id}`),
        provider,
        model: modelName(message.model),
        time,
        input: fresh + cached + cacheWrite,
        output,
        cached,
        cacheWrite,
      };
    }
    if (!validEvent(event)) {
      skipped++;
      return null;
    }
    return event;
  }
  return { parse, skipped: () => skipped };
}

export function deduplicate(events: ActivityEvent[]) {
  const result = new Map<string, ActivityEvent>();
  for (const event of events) {
    const old = result.get(event.id);
    if (!old) result.set(event.id, event);
    else {
      // Keep a coherent reported snapshot; mixing per-category maxima can
      // invent tokens when a provider corrects its cache attribution.
      const winner =
        event.output > old.output ||
        (event.output === old.output && event.input >= old.input)
          ? event
          : old;
      result.set(event.id, {
        ...winner,
        time: Math.min(old.time, event.time),
        model: old.model === event.model ? old.model : "Unknown model",
      });
    }
  }
  return [...result.values()];
}
export function dayKey(time: number) {
  const date = new Date(time);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function periodStart(days: number, now = Date.now()) {
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - days + 1);
  return date.getTime();
}
export function aggregate(
  events: ActivityEvent[],
  days: number,
  now = Date.now(),
) {
  const start = periodStart(days, now);
  const selected = events.filter((e) => e.time >= start && e.time <= now);
  const daily = Array.from({ length: days }, (_, i) => {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    return {
      day: dayKey(date.getTime()),
      models: {} as Record<string, number>,
      total: 0,
    };
  });
  const buckets = new Map(daily.map((d) => [d.day, d]));
  const models = new Map<
    string,
    {
      key: string;
      provider: ActivityProvider;
      model: string;
      input: number;
      output: number;
      cached: number;
      cacheWrite: number;
    }
  >();
  for (const e of selected) {
    const key = `${e.provider}/${e.model}`;
    const row = models.get(key) ?? {
      key,
      provider: e.provider,
      model: e.model,
      input: 0,
      output: 0,
      cached: 0,
      cacheWrite: 0,
    };
    row.input += e.input;
    row.output += e.output;
    row.cached += e.cached;
    row.cacheWrite += e.cacheWrite;
    models.set(key, row);
    const day = buckets.get(dayKey(e.time))!;
    day.models[key] = (day.models[key] ?? 0) + e.input + e.output;
    day.total += e.input + e.output;
  }
  return {
    daily,
    models: [...models.values()].sort(
      (a, b) => b.input + b.output - a.input - a.output,
    ),
    total: daily.reduce((sum, d) => sum + d.total, 0),
    events: selected.length,
  };
}
