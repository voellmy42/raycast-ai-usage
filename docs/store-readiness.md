# Raycast Store readiness

No submission has been made. A first release needs dependable supported connectors and a tested native experience; alerts, charts, usage history, and multiple-account switching can follow later.

## Current blockers
- Confirm the real Raycast account username. `voellmy` is a development placeholder and Store author validation returns HTTP 404.
- Live-test Claude capture on a compatible Claude Code version/account. The current connector is a last-observed session snapshot, not an authenticated current-account quota read; its identity limitation must remain explicit. Account-linked current Claude usage still needs investigation for the original product goal.
- Decide the first-release provider scope. Gemini quota reporting and all API spending connectors are unimplemented. Do not advertise these as working integrations. The initial product's full multi-provider goal is not yet complete.
- Test the distribution build in Raycast, including absent CLI, signed-out account, failed refresh, stale/expired quota, light/dark themes, menu hide → scheduled refresh → show → restart, and a clean installation on another Mac.
- Capture real Store screenshots with Raycast Window Capture; recommended at least three, 2000×1250 PNG, saved to metadata, with no sensitive account details.
- Confirm provider terms and latest Raycast API immediately before submission, complete lint, and submit through the normal Raycast extension review workflow.

Already present: MIT license, npm lockfile, local-only normalized storage, account-aware Codex cache, refresh/error states, install/setup README, changelog, unique 512px PNG icon, and automated subprocess/data checks.

## Retest checklist
1. Run `npm run dev` if the local watcher is not running; launch **Show AI Usage** in Raycast.
2. Check selected quota details, percentage, scope, reset time, unknown values, and stale labels.
3. Choose **Hide Menu Bar**; wait through a scheduled refresh and confirm the icon stays absent.
4. In dashboard Actions choose **Show Menu Bar**; confirm it reappears. Hide again, restart Raycast, and confirm persistence.
5. Repeat in light theme and capture the final UI once approved.

References: https://developers.raycast.com/basics/prepare-an-extension-for-store and https://developers.raycast.com/basics/publish-an-extension.
