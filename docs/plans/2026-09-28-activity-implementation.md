# Activity Analytics Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add local historical token graphs, quota forecasts, and evidence-based model comparisons to Raycast.

**Architecture:** Separate local activity records from account quota observations. Provider adapters import allowlisted usage metadata into a versioned local cache; pure aggregation and forecast functions feed native Raycast views. Preserve unknown values and identity boundaries.

**Tech Stack:** TypeScript, React, Raycast API, Node filesystem/streams, node:test with tsx, generated SVG charts.

---

## Execution prerequisite

The planning skill references `superpowers:executing-plans`. It is absent from the available catalog and was not found under ~/.agents/skills, ~/.codex/skills, or ~/.codex/plugins. Resolve this missing prerequisite or obtain authorization to execute the plan directly before implementation.

### Task 1: Verify historical formats and update source policies

Files: `architecture/activity.md`, `architecture/codex.md`, `architecture/claude.md`, `architecture/data-contract.md`, `tests/fixtures/activity/`.

1. Inspect installed source definitions or narrowly extract field names and usage-only examples from local records. Never output conversation text.
2. Identify timestamps, model changes, cumulative versus per-request counters, cache semantics, message IDs, and subagent/replay behavior for each provider.
3. Create synthetic fixtures reproducing verified shapes. Document unsupported formats and incomplete coverage.
4. Update architecture access rules to permit usage-only parsing under this approved design, retaining the prohibition on storing conversation content.
5. Commit the verified source contract and fixtures.

### Task 2: Implement deterministic activity parsing

Files: `src/lib/activity.ts`, `src/providers/activity.ts`, `tests/activity.test.ts`.

1. Add tests for cumulative deltas, duplicate IDs, model switches, malformed records, missing counters, cache overlap, and future timestamps.
2. Run `node --import tsx --test tests/activity.test.ts`; expect failures before implementation.
3. Implement versioned allowlisted activity records with provider, model, timestamp, separate token categories, and opaque stable event keys. Preserve unknown attribution.
4. Parse verified formats with bounded line sizes and sanitized errors. Do not infer model names from arbitrary quota bucket IDs.
5. Run the focused tests; expect all to pass. Commit.

### Task 3: Incremental local storage and aggregation

Files: `src/lib/activity-store.ts`, `src/hooks/use-activity.ts`, `tests/activity-store.test.ts`, `tests/activity.test.ts`.

1. Test file appends, partial final lines, truncation/replacement, repeated refresh, missing directories, and concurrent writers.
2. Track file identity/offset and parser state; atomically persist aggregates and checkpoints. Bound scan work and retention; expose progress and partial coverage.
3. Aggregate local-calendar days for 7/30/90-day ranges with consistent totals across graphs and model rows. Distinguish missing coverage from observed zero.
4. Respect provider visibility; refresh on demand without blocking quota display.
5. Run focused tests and commit.

### Task 4: Quota observations and forecasts

Files: `src/lib/quota-history.ts`, `src/lib/forecast.ts`, `src/hooks/use-usage.ts`, `tests/forecast.test.ts`.

1. Test reset changes, account switches, stale data, duplicate observations, flat usage, decreasing percentages, sparse samples, and exhaustion before/after reset.
2. Record only fresh observations, partitioned by verified identity and quota window/reset boundary. Use a separate snapshot-source identity for Claude without claiming current-account verification.
3. Require at least three distinct observations spanning ten minutes; reject stale or discontinuous series. Estimate percentage-point consumption per hour from the valid recent segment.
4. Compute exhaustion time from remaining percentage/rate, and headroom at reset from remaining percentage minus rate times hours to reset. Never convert tokens into quota or extend a trend across resets. Flat usage produces no finite exhaustion estimate.
5. Integrate persistence without making a history write failure appear to be a provider authentication failure. Run focused tests and commit.

### Task 5: Native activity and model views

Files: `src/show-ai-activity.tsx`, `src/components/activity-detail.tsx`, `src/lib/activity-chart.ts`, `src/components/usage-details.tsx`, `package.json`, `tests/activity-chart.test.ts`.

1. Verify Raycast's installed API supports the chosen local SVG/image rendering path.
2. Add Activity command and dashboard navigation, time-range selection, and provider/model rows with native detail charts.
3. Render daily token bars, readable dates/units, consistent model colors, textual totals, coverage dates, and empty/error states. Escape labels before SVG/Markdown interpolation.
4. Add per-window forecast details with reset marker and explicit recent-pace wording. Show unavailable reasons rather than fabricated values.
5. Show model token breakdowns and only genuinely model-scoped quota windows. Withhold derived model quota comparisons until attributable intervals exist.
6. Test chart totals, escaping, and zero/missing datasets. Run `npm run typecheck`; expect success. Commit.

### Task 6: Documentation and release verification

Files: `README.md`, `CHANGELOG.md`, `architecture/activity.md`, this plan.

1. Document local import scope, retention, refresh behavior, account ambiguity, and forecast limitations.
2. Run `npm test`, `npm run typecheck`, `npm run build`, and `npm run lint`; resolve failures.
3. Verify real import using aggregate-only diagnostics. Confirm a second import does not inflate totals.
4. Open the native Raycast command; inspect 7/30/90-day charts, model rows, empty states, forecast states, and light/dark themes. Record any checks that cannot be performed.
5. Update completion notes and commit the verified implementation.
