# Menu Personalization Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let users choose the quota shown in the menu bar and hide unused providers.

**Architecture:** Pure selection/presentation helpers validate persisted selections and build titles. A dashboard action saves selection then launches the menu; extension preferences own display style and provider visibility. Both surfaces share visibility filtering.

**Tech Stack:** TypeScript, React, Raycast API, node:test.

---

The referenced executing-plans skill is not installed; execute these explicit steps directly using the available tools.

### Task 1: Selection and presentation
Files: src/lib/menu-personalization.ts; tests/menu-personalization.test.ts; src/lib/types.ts.
Write tests for default selection, missing pins, hidden providers, lowest quota, stale/expired/unknown states and reset association. Run `node --import tsx --test tests/menu-personalization.test.ts` to observe failure. Implement pure validation, filtering and title helpers; rerun for PASS.

### Task 2: Preferences and actions
Files: package.json; src/components/usage-details.tsx; src/show-ai-usage.tsx; src/hooks/use-usage.ts.
Add compact/detailed preference and three visibility checkboxes, defaulting to existing behavior. Pass selected quota to actions. Save `{provider, windowId}` under a versioned key before showing/relaunching the menu. Expose automatic provider selection. Filter hidden providers and skip their reads; provide empty-state preferences action. Verify `npm run typecheck`.

### Task 3: Menu integration
File: src/ai-usage-menu-bar.tsx.
Load saved selection before displaying quota. Derive percentage/countdown from the same selected window. Show explicit unavailable/stale/snapshot states. Preserve hide/show controls. Verify focused tests and typecheck.

### Task 4: Review and documentation
Files: README.md; CHANGELOG.md.
Document selection, formats, hidden-provider behavior and manual verification. Review React changes with react-best-practices skill. Run `npm test`, `npm run typecheck`, `npm run build`, `npm run lint`. Record limitations accurately; preserve unrelated progress.md changes.

## Verification results

- 31 tests passed, including five new selection/presentation tests.
- TypeScript and Raycast build passed; local extension updated.
- ESLint and Prettier passed. Full Raycast lint fails only on the existing author `voellmy` (HTTP 404).
- Native screenshot confirms loaded quota dashboard and both new Actions entries. Preference changes, pin/relaunch behavior, and restart persistence still need manual interaction checks.
- Unrelated progress.md edits preserved.
