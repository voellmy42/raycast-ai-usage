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

In Raycast, search **Show AI Usage**. The optional **AI Usage Menu Bar** command shows the lowest remaining available Codex quota and refreshes every five minutes when enabled. The main dashboard refreshes when opened and offers a manual refresh action. Native visual verification is pending on this development machine because Computer Use access is unavailable.

## Dashboard and menu-bar controls

Select a quota window in **Show AI Usage** to see its remaining capacity, reset countdown, source, and account scope in the native detail panel. Unknown and expired observations never appear as unused quota. Snapshot age and refresh failures remain visible.

To remove the icon, select **Hide Menu Bar** in its menu, or open dashboard Actions (`⌘K`) and select **Hide Menu Bar**. To restore it, choose **Show Menu Bar** in dashboard Actions. The choice is saved across scheduled refreshes and command relaunches. When hidden, the menu command does not check providers; the dashboard still works normally. Raycast's command must remain enabled in extension settings for the dashboard to launch it.

For this refresh, retest: open the dashboard and select several quota windows; hide the menu icon; reopen the dashboard and confirm it stays hidden; leave it hidden through the next five-minute refresh; show it again through Actions; restart Raycast and check the saved choice. Check the layout in light and dark themes.

## Codex setup

Sign in to the Codex CLI or ChatGPT application with your ChatGPT account. The extension uses the installed Codex App Server and its provider-managed authentication. It doesn't generate model content, change logins, read conversation files, or consume earned resets.

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

Data stays local. The extension talks to the installed Codex App Server, which contacts its own provider. It stores only normalized Codex quota observations and a hashed account identity in Raycast LocalStorage. It does not store raw email addresses, account IDs, passwords, conversation content, or provider error bodies. Claude quota snapshots are local files at the user-selected path. No analytics or hosted backend is included.

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
