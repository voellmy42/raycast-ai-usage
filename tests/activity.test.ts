import { test } from "node:test";
import assert from "node:assert/strict";
import {
  aggregate,
  createActivityParser,
  deduplicate,
  periodStart,
} from "../src/lib/activity";
const now = Date.parse("2026-09-28T12:00:00Z");
const token = (
  input: number,
  output: number,
  cached: number,
  lastInput = input,
) => ({
  type: "event_msg",
  timestamp: new Date(now).toISOString(),
  payload: {
    type: "token_count",
    info: {
      total_token_usage: {
        input_tokens: input,
        output_tokens: output,
        cached_input_tokens: cached,
      },
      last_token_usage: {
        input_tokens: lastInput,
        output_tokens: output,
        cached_input_tokens: 0,
      },
    },
  },
});
test("Codex deltas avoid replay and inherited cumulative totals", () => {
  const parser = createActivityParser("codex", "source", now);
  parser.parse({ type: "turn_context", payload: { model: "gpt-test" } });
  const first = parser.parse(token(1000, 10, 100, 100))!;
  assert.equal(first.input, 100);
  assert.equal(parser.parse(token(1000, 10, 100)), null);
  const next = parser.parse(token(1200, 30, 150))!;
  assert.deepEqual([next.input, next.output, next.cached], [200, 20, 50]);
  assert.equal(parser.parse(token(50, 2, 0)), null);
  assert.equal(parser.skipped(), 1);
});
test("Claude streaming messages select the most complete snapshot; cache categories count once", () => {
  const parser = createActivityParser("claude", "source", now);
  const message = (output: number) => ({
    type: "assistant",
    timestamp: new Date(now).toISOString(),
    message: {
      id: "message-1",
      model: "claude-test",
      usage: {
        input_tokens: 10,
        output_tokens: output,
        cache_read_input_tokens: 20,
        cache_creation_input_tokens: 30,
        cache_creation: { ephemeral_1h_input_tokens: 30 },
      },
    },
  });
  const events = deduplicate([
    parser.parse(message(1))!,
    parser.parse(message(15))!,
  ]);
  assert.equal(events.length, 1);
  assert.equal(events[0].input, 60);
  const summary = aggregate(events, 7, now);
  assert.equal(summary.total, 75);
  assert.equal(summary.models[0].output, 15);
  assert.equal(
    summary.daily.reduce((sum, d) => sum + d.total, 0),
    75,
  );
});
test("missing counters are unknown and future records are rejected", () => {
  const parser = createActivityParser("codex", "source", now);
  assert.equal(
    parser.parse({
      type: "event_msg",
      timestamp: new Date(now).toISOString(),
      payload: {
        type: "token_count",
        info: { total_token_usage: { input_tokens: 10 } },
      },
    }),
    null,
  );
  assert.equal(
    parser.parse({ ...token(10, 5, 0), timestamp: "2030-01-01" }),
    null,
  );
  assert.equal(parser.skipped(), 2);
  assert.ok(periodStart(7, now) < now);
});

test("merged streamed records preserve nonnegative token category totals", () => {
  const parser = createActivityParser("claude", "source", now);
  const make = (fresh: number, cached: number, write: number) =>
    parser.parse({
      type: "assistant",
      timestamp: new Date(now).toISOString(),
      message: {
        id: "changing-usage",
        model: "claude-test",
        usage: {
          input_tokens: fresh,
          output_tokens: 2,
          cache_read_input_tokens: cached,
          cache_creation_input_tokens: write,
        },
      },
    })!;
  const [merged] = deduplicate([make(10, 20, 0), make(10, 0, 20)]);
  assert.equal(merged.input - merged.cached - merged.cacheWrite, 10);
  assert.equal(merged.input, 30);
});
