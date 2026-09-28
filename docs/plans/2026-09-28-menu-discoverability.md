# Menu Visibility Discoverability Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the already approved hide/show control immediately findable and restart Raycast development mode.

**Architecture:** Preserve the existing visibility storage and provider-read gating. Render the toggle directly as the first action in a complete native ActionPanel, exposing its label in Raycast's footer. Put Hide at the top of the menu dropdown. The user's request to fix the existing feature authorizes this correction to the previously approved design; no new feature scope is added. The earlier executing-plans exception continues.

**Tech Stack:** React, Raycast API, TypeScript, existing npm checks.

## Design decision
The installed bundles contain Hide Menu Bar, but it is secondary in dashboard Actions and below provider rows in the menu. Alternatives: document its current location (does not address discovery); promote existing controls (selected); add separate commands (unnecessary new scope). Promote the existing controls and add Cmd+Shift+M to the dashboard toggle.

## Task 1: Expose the controls
Files: `src/components/usage-details.tsx`, `src/show-ai-usage.tsx`, `src/ai-usage-menu-bar.tsx`.
1. Change UsageActions to return a complete ActionPanel with a direct first Action titled Hide Menu Bar or Show Menu Bar, retaining the existing handler and adding `shortcut={{ modifiers: ["cmd", "shift"], key: "m" }}`. Keep refresh with Cmd+R and existing provider/setup/preferences actions in one secondary Section.
2. Use this ActionPanel directly for both dashboard row variants; remove the redundant ActionPanel wrapper.
3. Move Hide Menu Bar into the first MenuBarExtra section before provider rows.
4. Verify TypeScript, ESLint, formatting, and the existing 26 tests. No additional implementation-mirroring test is warranted for action ordering.

## Task 2: Restart and verify registration
Files: `README.md`, `progress.md`.
1. Document the visible footer control, Cmd+Shift+M, and top-of-menu location.
2. Stop the previous known development session if still running; start `npm run dev` with registration permissions and wait for successful compilation.
3. Verify the installed bundle has the primary toggle and shortcut and the manifest points to current assets. Native visual verification still needs the user because Computer Use permission was unavailable.
4. Commit the correction and give exact testing steps.
