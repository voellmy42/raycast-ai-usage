# AI Usage

A native macOS Raycast extension for checking AI subscription quota without opening each app's usage screen.

## Current support

| Provider | Source | Status |
| --- | --- | --- |
| Codex with ChatGPT login | Installed CLI App Server | Live-tested with ChatGPT Plus |
| Claude Code Pro/Max | Opt-in status-line quota snapshot | Helper and parsing tested; live subscription verification pending |
| Gemini CLI | External quota interface | Investigation pending; explicitly unavailable in the UI |
| OpenAI, Anthropic, Gemini API spending | Separate reporting credentials | Subsequent phase; not implemented |

Subscription quota is account-level unless the provider reports model-specific scope. Context-window occupancy and local session token counts are not subscription quota. Unknown fields remain unknown.

## Install locally

Requirements: macOS, Raycast, Node.js 22.14+, npm, and an installed Codex CLI or ChatGPT application with Codex bundled.

```sh
npm ci
npm run dev
```

In Raycast, search **Show AI Usage**. The optional **AI Usage Menu Bar** command shows your selected quota (by default, the lowest remaining available Codex quota) and refreshes every five minutes when enabled. The main dashboard refreshes when opened and offers a manual refresh action. The dashboard and personalization actions have been visually checked in native Raycast.

## Dashboard and menu-bar controls

Select a quota window in **Show AI Usage** to see its remaining capacity, reset countdown, source, and account scope in the native detail panel. Unknown and expired observations never appear as unused quota. Snapshot age and refresh failures remain visible.

To remove the icon, select **Hide Menu Bar** at the top of its menu, or select any dashboard row and use the primary **Hide Menu Bar** action shown in Raycast's bottom bar. The shortcut **⌘⇧M** toggles visibility from the dashboard. To restore the icon, use the primary **Show Menu Bar** action. Both controls also appear in Actions (`⌘K`). The choice is saved across scheduled refreshes and command relaunches. When hidden, the menu command does not check providers; the dashboard still works normally. Raycast's command must remain enabled in extension settings for the dashboard to launch it.

For this refresh, retest: open the dashboard and select several quota windows; hide the menu icon; reopen the dashboard and confirm it stays hidden; leave it hidden through the next five-minute refresh; show it again through Actions; restart Raycast and check the saved choice. Check the layout in light and dark themes.

## Personalize the menu bar

Select a quota window in **Show AI Usage**, open Actions (`⌘K`), and choose **Show in Menu Bar** to pin it. Choose **Use Provider’s Lowest Remaining Quota** to automatically show the lowest remaining available quota for that row’s provider. Both actions save the choice and show the menu bar; the menu command must be enabled in Raycast.

In extension preferences, choose **Menu Bar Display**: **Compact** shows `42%`; **Detailed** shows a provider and the same quota’s reset countdown, such as `Codex 42% · 2h`. The countdown updates with menu refreshes, normally every five minutes. Claude readings are labeled Snapshot, and old observations are labeled Stale.

Use **Show Codex**, **Show Claude**, and **Show Gemini** to control which providers appear in both views. Hidden providers are not checked. Hiding the selected provider, losing a pinned window, or having only expired/unknown data shows **Unavailable** rather than silently choosing a different quota. Re-enable the provider or select another quota to restore the display. If all providers are hidden, the dashboard offers a preferences action.

Manual verification: pin two different quota windows in turn; switch to automatic selection; test both display styles; hide the selected provider and then all providers; restore providers from preferences; restart Raycast to check persistence. The dashboard and new Actions entries were visually verified in native Raycast. Full preference, pin/relaunch, and restart-persistence checks remain manual.

## Activity graphs and forecasts

Search **Show AI Activity** in Raycast, or choose **Show Activity Graphs** from the quota dashboard’s Actions menu. Select the last **7, 30, or 90 days** to see daily token bars, then select a model for its own graph and token breakdown. Colors remain consistent across date ranges within the imported history; the six largest models in the retained history have individual colors, and others share gray.

The importer reads local Codex session JSONL (including an optional archived-sessions directory) and Claude Code project JSONL. Default roots are `~/.codex` and `~/.claude`; `CODEX_HOME` and `CLAUDE_CONFIG_DIR` are honored when present in Raycast’s environment. Provider visibility preferences also control imports. Gemini activity is not supported. Records can include internal model labels such as `codex-auto-review`; these labels do not imply a user-selectable model or a separate quota.

Token totals include input and output. Cached input is included once, with cache reads and writes shown separately; reasoning tokens are already part of output. Repeated cumulative observations and streamed message records are deduplicated. Initial inherited Codex totals are not counted as new work. These are local records, potentially spanning multiple accounts, not a complete account usage report. Blank days mean no local records. Imported token history cannot reconstruct past subscription quota.

Only timestamps, model identifiers, token counts, hashed event/source keys, and file signatures are cached. No prompts, responses, or credentials are retained. Opening Activity or choosing **Refresh Activity and Quotas** imports history; unchanged files reuse the cache, while changed files are streamed again. Activity retains up to 90 local calendar days. Scans are bounded to 5,000 files, 4 GB of changed input, 512 MB per file, and 25,000 records; lines over two million characters are discarded before buffering their complete bodies. Import notes flag skipped or unavailable data. The cache is disposable and reconstructed from source if damaged.

**Quota Forecasts** estimate exhaustion and headroom at reset from percentage-point consumption, independently for each quota window. They need at least three fresh readings spanning ten minutes, exclude long gaps and quota decreases, and never extrapolate across resets. The enabled menu bar records readings on its five-minute refresh; the dashboard and Activity also capture readings when opened or manually refreshed. When the menu is hidden there is no background sampling. A forecast is conditional on the recent pace continuing, not a guarantee. Flat readings do not produce a finite exhaustion time.

Codex quota observations are partitioned by verified account fingerprint. Claude observations are partitioned by snapshot source, whose current account cannot be verified. Old snapshots are pruned when that source is refreshed. Model details show explicit current model-scoped quotas when the provider reports a matching model; shared account quota is not divided among models. Model-switch savings estimates remain unavailable without attributable measurements.

## Codex setup

Sign in to the Codex CLI or ChatGPT application with your ChatGPT account. The extension uses the installed Codex App Server and its provider-managed authentication. Quota collection doesn't generate model content, change logins, or consume earned resets. The separate Activity command reads local session files only to extract usage metadata.

ChatGPT/Codex application installations and common CLI paths are detected automatically. If necessary, set **Codex Executable** to an absolute path in extension preferences. If the global npm launcher is broken, select a working executable bundled with ChatGPT instead:

```text
/Applications/ChatGPT.app/Contents/Resources/codex-cli/bin/codex
```

Quota windows come directly from the provider. Unusual additional buckets retain their provider labels instead of being assigned to guessed models. Expired observations do not imply that a new window has zero usage.

## Claude Code setup

The current documented quota status-line fields require **Claude Code 2.1.251 or later** and an eligible subscription/account. This machine has 2.1.150; live quota capture is not yet verified here. Upgrade through your normal Claude Code installation workflow if needed.

The helper ships as `assets/claude-statusline.cjs`. In Raycast, open Claude's connection details and choose **Copy Claude Capture Command** to copy a command pointing to the installed asset and the default snapshot destination. It accepts the original Claude Code status-line JSON on stdin and an absolute output path as its first argument. For a source checkout, the command is:

```sh
node "/absolute/path/to/ai-usage/assets/claude-statusline.cjs" "/absolute/path/to/claude-usage.json"
```

In Claude Code, configure a status-line wrapper that feeds the same JSON to this helper and to your existing renderer. For example, adapt this shell wrapper using your real absolute paths:

```sh
#!/bin/sh
payload=$(cat)
printf '%s' "$payload" | node "/absolute/path/to/assets/claude-statusline.cjs" "/absolute/path/to/claude-usage.json"
# Preserve your renderer by passing the same original input to it:
printf '%s' "$payload" | /absolute/path/to/your-existing-statusline-renderer
```

If you have no existing renderer, replace the last line with `printf 'AI Usage snapshot captured'`. Review Claude Code's documented status-line configuration before changing it; this project does not automatically modify your settings.

The copied command uses `~/Library/Application Support/AI Usage/claude-usage.json`, which Raycast detects automatically. If you choose another destination, select that JSON file in Raycast's **Claude Usage Snapshot** preference. The helper writes only allowlisted quota fields and an observation time, using an atomic rename and private file permissions. It emits no terminal status-line text of its own.

Snapshots update during Claude Code activity after the provider supplies quota fields. Raycast refresh reads the snapshot file; it cannot refresh a Claude account while Claude Code is inactive. The snapshot describes the last observed session and cannot prove which account is currently signed in. Missing quota fields clear previously recorded windows.

## Privacy and failures

Data stays local. The extension talks to the installed Codex App Server, which contacts its own provider. It stores the latest normalized Codex quota observation and a hashed account identity in Raycast LocalStorage. Activity adds a usage-only file cache and quota history in the extension’s local support directory. It does not store raw email addresses, account IDs, passwords, conversation content, or provider error bodies. Claude quota snapshots are local files at the user-selected path. No analytics or hosted backend is included.

Codex identity is checked before cached observations are reused. Account switches discard the old observation; authentication errors never show old quotas. A failed quota read may show the previous observation only after verifying that the account still matches, with a stale/error label. Unknown reset times and missing fields are displayed explicitly.

## Development and publication

```sh
npm test
npm run typecheck
npm run build
npm run lint
```

Local tests cover normalization, malformed snapshots, subprocess fragmentation/errors/timeouts, partial provider failures, and account-aware cache behavior. `scripts/probe-codex.cjs` is a read-only development handshake.

The manifest author `voellmy` is an unverified development value; confirm the actual Raycast Store handle before submission. Capture real Raycast screenshots, verify the UI and live Claude integration, and resolve Gemini scope before advertising broader provider support. This extension has not been submitted to the Store. Publishing opens a review request in Raycast's extension repository; acceptance is external.

Architecture SOPs and the approved design/implementation plan are included under `architecture/` and `docs/plans/`.
