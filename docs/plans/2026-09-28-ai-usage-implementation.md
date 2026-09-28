# AI Usage Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a native macOS Raycast usage dashboard, verify Codex through ChatGPT Plus first, then integrate Claude Code and Gemini CLI through verified data sources and prepare for Store publication.

**Architecture:** Independent provider adapters normalize validated account observations into the approved contract in gemini.md. Shared caching preserves successful observations across partial failures; native Raycast components display accurate scope and freshness. SOPs precede implementation changes, and each provider passes a connectivity check before full logic is built.

**Tech Stack:** Node.js 22, TypeScript, React, @raycast/api, provider CLIs, and a TypeScript test runner. No hosted backend or Python runtime is required.

**Approved design:** docs/plans/2026-09-28-ai-usage-design.md.

**Execution constraint:** The required executing-plans skill was not found in installed skill roots or plugin caches. Resolve its availability or obtain an explicit exception before executing this plan. Planning itself is authorized and complete.

---

## Task 1: Resolve execution prerequisite and establish source control

Files: .gitignore; progress.md.

1. Resolve missing execution skill or user-authorized exception. Do not install a guessed skill package.
2. Check `git rev-parse --show-toplevel`. If this directory has no repository, initialize one here with `git init`; do not use a parent's repository accidentally.
3. Create .gitignore excluding node_modules/, dist/, .tmp/, .env, .env.*, with an exception for .env.example if needed. Never commit account caches, token snapshots, or raw provider data.
4. Commit only approved design and memory documents by exact path, plus .gitignore. Use `git diff --cached --check` before committing.

## Task 2: Codex Link verification

Files: architecture/codex.md; scripts/probe-codex.ts (development-only); .tmp/ (ignored observations).

1. Write SOP: CLI path resolution, JSON-RPC handshake, permitted account-read methods, request timeout, cancellation, and no generation requests.
2. Locate a working installed executable using known app/resource paths before changing the global installation. Current `/usr/local/bin/codex --version` fails with ENOENT for its packaged platform binary.
3. If none exists, install a project-local Codex CLI dependency at a verified version. Keep its launcher separate from extension runtime bundling; inspect Raycast package compatibility before making it a published dependency. Verify `--version`.
4. Create a minimal probe: start `codex app-server`, send initialize with clientInfo, await result, send initialized notification, then account/read and account/rateLimits/read; terminate cleanly. Do not start a thread or model turn.
5. Run `npx tsx scripts/probe-codex.ts`. Expected: sanitized plan, quota percentages, window lengths, and reset times. Never print access tokens, email, account ids, or raw stderr.
6. If signed out, report that user login is needed; never replace or switch their current account automatically. If blocked by environment permissions, request the precise necessary operation.
7. Record observed protocol/version and availability in findings.md and progress.md. Compare with the user's provider account usage view when accessible.

## Task 3: Scaffold native extension after Codex handshake succeeds

Files: package.json; tsconfig.json; eslint.config.js; src/show-ai-usage.tsx; assets/icon.png; README.md.

1. Use current Raycast documentation for manifest and build scripts. Add extension identity `ai-usage`, macOS platform, view command `show-ai-usage`, and optional CLI path preferences. Obtain a verified author handle before submission; never claim an invented author.
2. Install compatible @raycast/api, React, TypeScript, lint tooling, and a TypeScript test runner. Use lockfile-based reproducibility.
3. Add scripts: `dev` → `ray develop`; `build` → `ray build`; `lint` → `ray lint`; `test` → test runner. Add `publish` only with documented Raycast command.
4. Implement a native List entry point with loading, empty, and setup states. Setup actions open Raycast preferences and documentation.
5. Run `npm run build` and `npm run lint`. Expected: valid manifest and compilable native view. Keep incomplete provider connectors out of advertised support.

## Task 4: Define validation and normalization

Files: architecture/data-contract.md; src/lib/types.ts; src/lib/normalize.ts; src/lib/format.ts; tests/normalize.test.ts; tests/format.test.ts.

1. Write SOP from gemini.md, including null semantics, independently absent windows, account/model scope, and source-reported durations.
2. Add regression cases: null is unknown rather than zero; multiple Codex buckets survive; Unix seconds convert correctly; zero remains valid; missing reset does not invent a schedule; non-finite values reject; legitimate percentages above 100 preserve source value.
3. Run focused tests and confirm failures before implementing the relevant normalization.
4. Implement reusable functions equivalent to these specifications:
   - `remainingPercent(null) === null`.
   - `remainingPercent(25) === 75`.
   - `remainingPercent(105) === 0`.
   - `timestampFromSeconds(1730947200) === "2024-11-07T02:40:00.000Z"` (verified using Node Date).
   - A null secondary window yields no fabricated quota row.
5. Add source payload validation before reading nested fields. Unknown fields may be ignored; malformed required fields produce a sanitized provider error.
6. Run `npm run test -- tests/normalize.test.ts tests/format.test.ts`; expected: all cases pass. Commit tested contract implementation.

## Task 5: Implement Codex adapter and subprocess lifecycle

Files: src/providers/codex.ts; src/lib/app-server.ts; src/lib/executables.ts; tests/app-server.test.ts; tests/codex.test.ts; architecture/codex.md.

1. Write fake-process tests for fragmented stdout, unsolicited notifications, RPC errors, initialize failure, process exit, missing executable, timeout, and cleanup. Assert every pending request settles and child processes terminate.
2. Implement newline-delimited JSON-RPC with bounded buffers and timeouts. Invoke an explicit executable with argument arrays, never shell interpolation.
3. Resolve CLI path through preferences and known install paths; do not rely solely on GUI PATH. Configure a harmless working directory and verify how to avoid irrelevant MCP/plugin startup before using optional flags.
4. Read account and quota data through documented methods only. Prefer rateLimitsByLimitId when present, fall back to rateLimits, and preserve all supported windows. Never label arbitrary buckets as specific models without provider evidence.
5. Sanitize errors into actionable states. A broken launcher is a connection error; API-key-only auth is not subscription quota support.
6. Run focused tests and the sanitized live probe, then build/lint. Commit after passing checks.

## Task 6: Cache and dashboard

Files: architecture/refresh.md; src/lib/cache.ts; src/lib/refresh.ts; src/hooks/use-usage.ts; src/show-ai-usage.tsx; src/components/usage-details.tsx; tests/refresh.test.ts.

1. Write SOP: refresh observations older than five minutes, deduplicate requests, respect retryAt, isolate provider failures, and avoid account mixing.
2. Test partial failure while another provider succeeds; cached observation retained with stale/error state; expired reset does not imply zero usage; force refresh respects provider cooldown.
3. Implement cache for sanitized normalized observations only, with schema-version validation. Account-switch detection must invalidate prior account cache; suppress previous data if identity cannot be confirmed after auth changes.
4. Render native provider sections and quota rows. Show source, actual observation age, plan, scope, percentages, and reset time; use explicit unavailable labels.
5. Add Refresh, Open Usage Page, and Open Extension Preferences actions. Keep token counts and spending distinct from subscription capacity.
6. Run focused tests, full tests, build, and lint. Import the extension in Raycast and inspect navigation, loading, errors, dark/light themes, and keyboard actions. Record what was actually verified.

## Task 7: Claude Code Link and snapshot adapter

Files: architecture/claude.md; scripts/claude-statusline.cjs; src/providers/claude.ts; tests/claude.test.ts; README.md.

1. Verify installed Claude Code version and documented status-line fields. Do not read Keychain or export OAuth tokens.
2. Write an opt-in status-line integration SOP and installation instructions that preserve any existing status-line command. The approved design does not authorize automatic replacement of user configuration.
3. Build a small capture helper that accepts status-line JSON, validates rate_limits, and atomically stores only normalized usage fields and observation time in a stable application-support location. Keep runtime observations out of project intermediates and version control.
4. Test missing windows, expired windows, malformed payload, partial input, concurrent updates, and absence of account identity. Never attach a snapshot to an assumed email/account.
5. Raycast reads the snapshot path from preferences and displays its age. Refresh reads the local snapshot; it does not imply a provider network refresh.
6. Verify live with an eligible Claude account if available. Otherwise record that live verification requires an account and keep that limitation visible in README.
7. Run focused/full tests, build, lint, and Raycast inspection. Commit the working integration and its source/freshness documentation.

## Task 8: Gemini CLI feasibility before full implementation

Files: architecture/gemini.md; findings.md; scripts/probe-gemini.ts (only after selecting a justified read-only interface); src/providers/gemini.ts and tests/gemini.test.ts (only after handshake).

1. Inspect current official Gemini CLI source and documentation around `/stats model`, quota retrieval, authentication, and JSON output. Identify whether an external machine-readable read exists and distinguish session statistics from account quota.
2. Validate credential scope and a Raycast Store-compatible route. Do not import browser cookies, request Keychain access, or assume Gemini web-app quota matches CLI quota.
3. Run a minimal read-only handshake without generating model content, billable work, or modifying user login.
4. If no viable route exists, document exact evidence and ask the user to choose the next approach. This is a provider blocker, not successful Gemini support; do not quietly drop the requested integration.
5. After a successful handshake, test quota units, reset timestamps, model grouping, missing values, and auth errors; implement against the approved contract with any necessary SOP/schema update.
6. Run tests, build, lint, and live verification with an eligible account. Commit only verified adapter behavior.

## Task 9: Optional menu bar and publication package

Files: src/ai-usage-menu-bar.tsx (optional); package.json; assets/icon.png; README.md; CHANGELOG.md; media/; progress.md; gemini.md.

1. After the dashboard works, add the optional menu bar command using shared cache/refresh functions and Raycast background refresh. Avoid duplicate provider requests and show stale state.
2. Create a distinct 512×512 PNG icon; inspect it in light and dark themes. Capture actual Raycast screenshots with account identifiers hidden.
3. README documents supported provider/account combinations, credential requirements, snapshot freshness, local data storage, and tested CLI versions. Do not advertise unfinished API billing connectors.
4. Obtain the user's Raycast author handle and verify public repository/submission prerequisites.
5. Run `npm run test`, `npm run build`, `npm run lint`, and inspect `git diff --check`; expected: passing checks and no accidental secrets or runtime cache files.
6. Present the concrete installed extension and publication package for feedback, then submit through the documented Raycast publication workflow when authorized. Attach any created PR to this chat. Acceptance is external and must be reported separately from submission.
7. Finalize maintenance log: provider interfaces, version assumptions, refresh behavior, known limitations, and tested recovery paths.

## Completion criteria

The user can inspect real Codex Plus usage in Raycast. Claude and Gemini integration goals are either live-verified or explicitly recorded as blockers requiring a user decision, not silently marked complete. Store package is reviewed locally with accurate documentation and submitted when ready; Store acceptance is an external milestone. API spending remains the approved subsequent phase.
