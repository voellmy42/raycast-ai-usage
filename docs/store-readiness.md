# Raycast Store readiness

The first release is Codex-only. Claude and other providers appear only in a small coming-soon note. Distribution uses the public GitHub repository and a local source build. No Store submission is planned for this release; the checklist below is retained for a possible future Store release.

## Remaining submission gates

- Create a Raycast account (the author does not have one yet), then use its verified username in the manifest. `voellmy` is a placeholder and returns HTTP 404 from Store author validation.
- Recheck the latest Raycast API immediately before submission. Updated to registry release 2.10.1 and validated on 2026-10-28.
- Review applicable provider terms before submission.
- Capture at least three real Store screenshots using Raycast's **Capture Window** command: quota dashboard, activity graph, and a model/forecast detail. Use 2000×1250 PNG, save to `metadata`, and omit sensitive account details.
- Test the distribution build on a clean second Mac. Verify missing Codex installation, signed-out and API-key accounts, valid ChatGPT subscription login, failed refresh, and stale/expired observations.
- Check both themes and menu visibility through a scheduled refresh and Raycast restart.

## Release behavior

- Codex is always available in the UI. No Claude/Gemini setup or visibility preferences are exposed.
- Quota reads use the installed Codex App Server with provider-managed authentication.
- Activity scans only Codex session and archived-session roots. Older mixed-provider cache entries are removed on the next import.
- Old Claude/Gemini menu selections migrate to automatic Codex selection; existing Codex pins are preserved.
- Return on a quota row refreshes usage. Cmd+Shift+M still toggles menu visibility.
- Menu navigation opens Usage and Activity directly; quota items retain the provider website shortcut.
- Refresh failures do not show a success toast, and local storage failures do not replace successful provider data with a connection failure.

## Native retest

1. Run `npm run build`, then open **Show AI Usage** in Raycast.
2. Check selected quota details, percentage, scope, reset, unknown values, and stale labels. Only Codex plus a quiet future-provider note should appear.
3. Press Return to refresh. Open Actions and confirm Refresh is primary, the menu toggle shortcut remains, and no Claude setup action is offered.
4. Pin two different windows in turn; switch to automatic selection; check both display styles.
5. Use menu links to open Usage and Activity. Confirm activity includes only Codex models and that forecasts show collecting/unavailable states honestly.
6. Hide the menu; wait through a scheduled refresh; show it from the dashboard. Hide again, restart Raycast, and confirm persistence.
7. Repeat visual checks in light theme and capture Store screenshots.

## Automated checks

Run `npm test`, `npm run typecheck`, `npm run build`, and `npm run lint`. Tests cover account changes, stale caches, subprocess faults, normalization, bounded activity imports, menu selection migration, and refresh feedback.

References: [Prepare an extension for Store](https://developers.raycast.com/basics/prepare-an-extension-for-store), [Publish an extension](https://developers.raycast.com/basics/publish-an-extension).

## Verification on 2026-10-28

- 46 automated tests pass; TypeScript and the distribution build pass against Raycast API 2.10.1.
- Store lint passes icon validation, ESLint, and Prettier. Author validation fails because the placeholder username has no Raycast account.
- Native Raycast dark-theme checks: live signed-in Codex quotas and reset times, Return-to-refresh with success feedback, both quota row details, the coming-soon teaser, navigation from the teaser to Activity, and a completed Codex-only activity import with model graphs.
- Native testing caught and corrected literal newline escapes in static markdown; the corrected teaser layout was visually rechecked.
- Still manual: menu navigation/pinning, scheduled hide/restart persistence, light theme, signed-out/missing-CLI failure UI, second-Mac installation, and Store screenshots. Automated checks cover the underlying selection, persistence, and failure logic; they do not replace these native checks.
