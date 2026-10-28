# AI Usage

Keep your Codex subscription capacity in view, with quota reset times, an optional menu-bar percentage, and local token activity graphs.

**Codex is supported today. Claude and more providers are coming next as AI Usage grows, guided by demand.** This release does not connect to other providers or report API spending.

## Install from GitHub

This extension is distributed through this public GitHub repository. You do not need a Raycast Store account or Store submission to install it locally.

Install Raycast, Node.js 22.14+ with npm, and Git, then run:

```sh
git clone https://github.com/voellmy42/raycast-ai-usage.git
cd raycast-ai-usage
npm ci
npm run build
```

The build installs the extension into Raycast's local extensions directory. Open Raycast and search **Show AI Usage**. For quotas, you also need a working Codex installation signed in with your ChatGPT account.

To update, run these commands from the same checkout:

```sh
git pull --ff-only origin main
npm ci
npm run build
```

Reopen the commands after rebuilding. GitHub installations are managed locally and do not receive Raycast Store automatic updates.

## Get started

1. Install and sign in to Codex CLI, the Codex app, or a ChatGPT app installation that includes Codex. Use your ChatGPT subscription login; API-key authentication does not expose subscription quotas.
2. Open **Show AI Usage** in Raycast. Your installed Codex executable is detected automatically.
3. Select a quota window to see remaining capacity, its reset time, and a forecast once enough readings have been collected.

If the executable is not detected, set **Codex Executable** to its absolute path in extension preferences. A working Codex executable bundled with ChatGPT can also be used instead of a broken global npm launcher.

Requirements: macOS, Raycast, and a working signed-in Codex installation. This release is distributed from GitHub; it is not listed in the Raycast Store.

## Daily use

| Command | What it shows |
| --- | --- |
| **Show AI Usage** | Codex quota windows, remaining capacity, reset times, and conditional forecasts |
| **AI Usage Menu Bar** | A pinned quota or the lowest remaining Codex quota, refreshed every five minutes |
| **Show AI Activity** | Local Codex token graphs for 7, 30, or 90 days, model breakdowns, and quota forecasts |

Press **Return** or **⌘R** on a quota row to refresh usage. Actions (**⌘K**) also opens your provider usage page, activity graphs, and preferences. Failed refreshes remain visible; old or expired data never appears as a fresh unused quota.

### Personalize the menu bar

Select a quota row and choose **Show in Menu Bar** in Actions to pin it. Choose **Use Lowest Remaining Codex Quota** to follow whichever available Codex window has the least capacity remaining. Both actions save the selection and show the menu bar.

In extension preferences, **Menu Bar Display** offers:

- **Compact:** `42%`
- **Detailed:** `Codex 42% · 2h`

The percentage always means **remaining** capacity. The reset countdown belongs to the same selected window. Old readings are marked **Stale**; a missing pinned window shows **Unavailable** until it returns or you choose another quota.

Use **Hide Menu Bar** in its menu or **⌘⇧M** in the usage dashboard. The choice persists across refreshes and relaunches. Show it again using the same dashboard shortcut or Actions. The menu command must remain enabled in Raycast for the dashboard to launch it. When hidden, no background quota checks run; the dashboard still works normally.

The menu also links directly to the usage dashboard and activity graphs. Clicking a quota item opens the Codex usage website.

## Activity and forecasts

Activity reads local Codex session files on this Mac, including archived sessions. It uses `~/.codex` by default and honors `CODEX_HOME` when present in Raycast's environment. It does not import Claude history.

Graphs show token totals by day and model. Input includes cached input once; reasoning tokens are already included in output. Repeated cumulative observations are deduplicated, and inherited session totals are not counted as new work. Internal model labels can appear in logs without representing a selectable model or separate quota.

Local activity may span accounts, excludes other devices, and is not a complete account usage report. Blank days mean no local records. Token totals cannot reconstruct past subscription quota or measure model-switch savings.

Forecasts use recent changes in quota percentage. They need at least three fresh readings spanning ten minutes, exclude long gaps and falling usage, and do not extrapolate across resets. The menu bar samples every five minutes when enabled and visible; opening or refreshing Usage or Activity also records quota readings. No background samples are collected while the menu is hidden. Forecasts assume the recent pace continues; flat usage has no finite exhaustion estimate.

## Troubleshooting

- **Codex not found:** install Codex or choose a working absolute executable path in preferences. Common app, Homebrew, and local CLI paths are checked automatically.
- **Sign In Required:** sign in through Codex using your ChatGPT account, then refresh.
- **Account Not Supported:** API-key logins do not provide subscription quota. Use a ChatGPT subscription login.
- **No Quota Reported:** check the provider usage page and your plan, then refresh. The extension shows only quota windows reported by Codex.
- **Stale or expired:** refresh. A failed quota read can retain a labeled previous observation only after the account identity has been verified. An expired observation does not imply the next window has zero usage.
- **No activity:** confirm Codex has local sessions on this Mac. Import Details in Activity explains missing directories, skipped records, and partial imports.
- **No forecast:** leave the menu visible while you work, or collect several readings manually at least ten minutes apart.

## Privacy

No analytics or hosted backend is included. The extension talks to the installed Codex App Server, which contacts its provider using provider-managed authentication. Quota reads do not generate model content or change logins.

The extension stores normalized quota observations and a hashed account identity in Raycast LocalStorage. Identity is checked before reusing cached quotas; account changes discard old observations, and authentication failures do not display old quotas.

Activity reads local session JSONL and retains only timestamps, model identifiers, token counts, hashed source/event keys, and file signatures. Prompts, responses, raw account identities, credentials, and provider error bodies are not retained. Usage history and the disposable activity cache are stored in the extension's local support directory.

Activity retains up to 90 local calendar days. Imports are bounded to 5,000 files, 4 GB of changed input, 512 MB per file, and 25,000 records. Oversized lines are discarded before buffering complete bodies. Unchanged files reuse the cache; damaged caches are rebuilt from source. Import notes report incomplete coverage.

## Development

Use Node.js 22.14+ and npm:

```sh
npm ci
npm run dev
```

Validate changes with:

```sh
npm test
npm run typecheck
npm run build
npm run lint
```

The distribution build installs into Raycast's local extension directory. Test the built commands in native Raycast before submission. See [Store readiness](docs/store-readiness.md) for outstanding release checks and [architecture](architecture/) for internal data contracts. Experimental provider code remains in the repository but is not connected to shipping commands.
