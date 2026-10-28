# Codex-first Release Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deliver a polished Codex-only release with a quiet future-provider teaser.

**Architecture:** Keep experimental normalization/parsing isolated from shipping entry points. Limit quota loading and history roots to Codex; migrate unsupported saved menu selections. Preserve existing account validation, bounded imports, and quota forecasting.

**Tech Stack:** TypeScript, React, Raycast API, Node.js tests with tsx.

---

The referenced executing-plans skill is absent from the installed skill directories; execute the explicit tasks below directly under the approved brainstorming → planning → implementation workflow.

### Task 1: Codex-only runtime and preferences

Files: `package.json`, `src/lib/types.ts`, `src/hooks/use-usage.ts`, `src/hooks/use-activity.ts`, `src/lib/menu-personalization.ts`, `tests/menu-personalization.test.ts`, `tests/activity-store.test.ts`.

1. Add regression tests: saved Claude/Gemini selections resolve to `{ provider: "codex", windowId: null }`; valid Codex pins survive. Reimport a mixed-provider cache with only Codex roots and assert Claude records are absent.
2. Run `npm test`; selection migration should fail before implementation.
3. Remove provider visibility and Claude snapshot preferences from manifest/types. Initialize and load only Codex usage; import only Codex session/archive roots. Accept only Codex in saved menu selection parsing. Retain experimental provider parsers without runtime entry-point references.
4. Run tests and `npm run typecheck`. Expected: all pass.

### Task 2: Refresh outcomes

Files: `src/hooks/use-usage.ts`, `src/lib/refresh.ts`, `tests/refresh.test.ts`.

1. Test refresh result presentation for ready, stale-error, missing-login, unsupported-auth, and no-reported-quota states, plus successful usage with a cache error.
2. Implement a pure refresh-feedback helper; map successful quota reads to success and unsuccessful reads to failure with actionable sanitized provider messages. Catch storage failure separately so a good provider result stays visible. Preserve quota-history warnings.
3. Run `npm test` and `npm run typecheck`. Expected: passing feedback and existing account/cache tests.

### Task 3: Dashboard and menu navigation

Files: `src/components/usage-details.tsx`, `src/components/quota-detail.tsx`, `src/show-ai-usage.tsx`, `src/ai-usage-menu-bar.tsx`, `src/show-ai-activity.tsx`.

1. Place Refresh Usage first in dashboard actions, retain Cmd+Shift+M menu visibility control, remove Claude setup/capture and unsupported-provider pin controls.
2. Add a small “More Providers Coming Soon” dashboard row with detail mentioning Claude and others, dependent on demand, without a release date. Its actions navigate to Activity/preferences without enabling unsupported providers.
3. Add menu items launching `show-ai-usage` and `show-ai-activity` with `LaunchType.UserInitiated`. Keep provider usage website accessible through existing quota items.
4. Update connection/coverage language for Codex-only behavior and surface history-save warnings in the quota dashboard.
5. Review edited TSX with `vercel:react-best-practices`. Run typecheck, formatting, tests.

### Task 4: Release docs and validation

Files: `README.md`, `CHANGELOG.md`, `docs/store-readiness.md`.

1. Replace development diary content with user-facing Codex setup, features, privacy, limits, and troubleshooting. Include future-provider note, not advertised support. Preserve accurate importer limits and quota semantics.
2. Consolidate changelog to `## [Initial Release] - {PR_MERGE_DATE}`. Update readiness checklist, retaining author verification as a blocker.
3. Run `npm test`, `npm run typecheck`, `npm run build`, `npm run lint`. Retry sandbox-restricted build/lint using approved escalation flow. Do not change author without a verified handle.
4. Inspect native Raycast if available; report actual checks and outstanding manual screenshot/clean-Mac gates. Inspect `git diff --check` and final changes. Commit coherent implementation after verification.
