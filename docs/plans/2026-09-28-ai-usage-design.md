# AI Usage — proposed design

Status: Approved by the user on 2026-09-28, including Gemini CLI scope and native runtime adaptation.

## Outcome
A native Raycast extension showing usage for connected AI accounts, with Codex through ChatGPT Plus as the first live integration. Claude Code and Gemini remain required provider goals. Personal use is followed by preparation for public Raycast Store review.

## Approaches considered
1. Native extension with independent provider adapters (recommended): focused dependencies and control over freshness, errors, and account identity. Requires maintaining each provider integration.
2. Raycast frontend to an existing usage aggregator such as CodexBar: potentially faster provider coverage, but adds another installed application and inherits its access methods and compatibility constraints.
3. Hosted aggregation backend: useful for cross-device history, but adds hosting, credential handling, and maintenance that the current use case does not require.

## User experience
- macOS first, using native Raycast List, detail, and action components.
- Main command: Show AI Usage. Provider rows show available quota windows, percentage used/remaining, reset times, connection status, and observation time.
- Actions: refresh, view provider details, open provider usage page, and open extension preferences.
- One currently connected account per provider initially. Model-specific limits appear only when reported by the source; account-wide limits retain their actual scope.
- Cached data appears promptly; refresh runs independently for each provider. Failures preserve the last successful observation with a stale indication.
- Optional menu-bar summary follows successful dashboard verification and uses the same cached data.
- Provider setup uses Raycast preferences and clear README instructions.

## Provider sequence and feasibility
1. Codex: use the installed Codex CLI App Server and documented account/rateLimits/read. Verify login visibility and CLI/version requirements with the user's account. Support optional account token summaries only where returned.
2. Claude Code: evaluate the documented status-line rate_limits payload as a local observation source. Capture only usage-related fields and timestamps. Preserve existing status-line behavior when offering integration instructions. Snapshots update during Claude Code activity; no promise of fresh background account polling. Verify an eligible test account or accurately disclose untested live integration.
3. Gemini CLI: validate account quota access and authentication before implementing a live connector. CLI quota, Gemini web-app limits, and Gemini API billing are different products. This draft assumes Gemini CLI; web-app usage requires separate scope and research. A supported Gemini connector is a goal, not a verified capability.
4. API spending: subsequent separate connectors using eligible provider reporting credentials. API billing is distinct from subscription quota. Normal inference keys may not grant organization reporting access.

If Claude or Gemini cannot supply the needed data through a maintainable Store-compatible route, document the blocker and agree on the next approach before reducing scope. Do not present a placeholder or local session count as a working account quota integration.

## Architecture and protocol adaptation
Keep B.L.A.S.T. phases, SOP-first changes, deterministic normalization, and project memory. Implement the runtime in TypeScript/React, as native Raycast requires, instead of imposing a Python tools runtime. SOPs live in architecture/; deterministic provider adapters live in src/providers/; shared validation, caching, and formatting live in src/lib/.

The final user payload is the Raycast view. Distribution is the Raycast Store, which requires a reviewed submission rather than a generic cloud deployment. Provider credentials belong in supported Raycast password preferences or provider-managed login; development-only secrets may use an ignored .env. Avoid exporting existing login tokens or requesting direct Keychain access.

## Data contract
Proposed input and output contracts are recorded in gemini.md for confirmation with this design. Provider payloads are untrusted and validated before normalization. Never translate missing fields into zero, invent reset schedules, or conflate context-window occupancy with subscription quota.

## Refresh and errors
Refresh on opening the dashboard when the observation is older than five minutes, plus manual refresh. Deduplicate requests, bound network and subprocess timeouts, and respect provider retry guidance. A Claude snapshot is an observation of a past account state, with its actual age shown. A reset timestamp passing makes that window expired; it does not establish zero usage for the next window.

Connection states: ready, not configured, sign-in required, unsupported, or error. Freshness is separate: fresh, stale, expired, or unavailable. A failed provider never prevents other providers from rendering.

## Verification and publication
- Check normalization of nullable fields, multiple windows, reset timestamps, stale/expired observations, and provider errors.
- Verify Codex live results against the provider's own account usage view.
- Verify Claude and Gemini with eligible accounts before advertising them as tested integrations.
- Build and lint the extension; inspect it in Raycast on macOS.
- Prepare a real icon, README, screenshots, changelog, and verified author metadata.
- Present the installed extension and publication package for feedback; submit for Raycast Store review when ready. Store acceptance cannot be guaranteed.

## Approval requested
Approve this approach, native runtime adaptation, initial UI/data contract, and sequence. Gemini CLI is the proposed Gemini product scope; API spending follows subscription usage unless the user changes priority.
