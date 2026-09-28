# AI Usage Visual Refresh Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deliver the approved native split dashboard, modern icon, and persistent menu-bar show/hide controls for another local test.

**Architecture:** Keep provider reads and normalized usage unchanged. Render quota presentation in a native List detail panel. Store menu visibility in LocalStorage with a synchronous Cache mirror; only mount the provider-fetching menu component after visibility is loaded and true. Explicit dashboard toggles launch the menu command to apply the change.

**Tech Stack:** Raycast API 2.5.2, React 19, TypeScript, Node test runner, built-in imagegen.

The user already authorized direct execution when the executing-plans skill was unavailable; that exception continues here. Design approved on 2026-09-28.

### Task 1: Persist menu visibility

Files: create `src/lib/menu-visibility.ts`, `src/hooks/use-menu-visibility.ts`, `tests/menu-visibility.test.ts`; modify `src/ai-usage-menu-bar.tsx`, `src/components/usage-details.tsx`.

1. Write tests for stored false surviving scheduled/repeated launches, explicit show/hide overriding saved state, and unknown values defaulting visible.
2. Run `npm test`; expect the new imports to fail until implementation.
3. Implement a pure resolver: explicit boolean wins; otherwise stored false means hidden; all other values mean visible. Save before relaunch; use loading-only menu during initialization and never mount `useUsage` when hidden. Dashboard toggles save and launch the menu command; menu Hide saves and renders null.
4. Run `npm test` and `npm run typecheck`; all tests/types pass.

### Task 2: Native split dashboard

Files: modify `src/show-ai-usage.tsx`, `src/lib/format.ts`, `src/components/usage-details.tsx`; create `src/components/quota-detail.tsx`, `tests/presentation.test.ts`.

1. Test quota presentation boundaries: unknown, expired, 10%/25% remaining, and excess usage; account vs model scope preserved.
2. Implement shared presentation state, concise quota labels, segmented text capacity meter, native metadata, reset and observation labels, friendly provider setup details, and shared menu toggle action. Use a minute timer to age displayed observations.
3. Use native List `isShowingDetail` and `List.Item.Detail`; keep refresh and existing provider actions.
4. Run tests/types/ESLint/Prettier and inspect for repeated reads or stale/unknown values shown as current capacity.

### Task 3: Final icon

Files: create `assets/icon-v2.png`, preserve old icon in `media/icon-v1.png`; modify `package.json`; record prompt in this plan.

1. Use @imagegen built-in editing to preserve the approved orbital mark and navy tile while removing the white outer corners to transparent alpha.
2. Inspect output; copy into project and downscale with native image tooling to exactly 512px while preserving alpha.
3. Point manifest to icon-v2.png and remove unused runtime icon.
4. Verify dimensions, alpha, and build asset copying.

### Task 4: Verify and hand back

Files: modify `README.md`, `CHANGELOG.md`, `progress.md`; create `docs/store-readiness.md`.

1. Document menu toggles, release blockers, provider truth, and local retest sequence.
2. Run `npm test`, `npm run typecheck`, `npx eslint src tests`, `npx prettier --check ...`, `npm run build`, and `npm run lint`.
3. Record any unresolved author validation or native UI verification limits accurately. Keep development registration available for user testing; do not publish.
4. Commit reviewed changes and report concrete retest steps and Store prerequisites.

Final image prompt (built-in edit, transparent background): Preserve the approved segmented cyan/blue/violet orbital mark, composition, and midnight navy rounded-square tile. Remove only the white area outside the rounded-square tile, replacing it with genuine transparent alpha. Crisp macOS extension icon, no text or added objects, square output suitable for downscaling to 512px.
