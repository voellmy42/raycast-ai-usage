# Project Constitution

## State
Design, Blueprint, native runtime adaptation, and proposed payload approved by the user on 2026-09-28. Implementation plan prepared; connectivity verification pending.

## Data schemas
The following JSON contracts were approved with the design on 2026-09-28.

### Input shape
```json
{
  "provider": "codex",
  "connectionId": "codex-default",
  "operation": "read_usage",
  "forceRefresh": false
}
```
`provider` is one of codex, claude, or gemini. `connectionId` is an opaque local identifier, not a credential. `operation` is read_usage. `forceRefresh` is boolean. Connection configuration and secrets are resolved privately by the adapter and never copied into usage records.

### Output shape (illustrative values)
```json
{
  "schemaVersion": 1,
  "provider": "codex",
  "connectionId": "codex-default",
  "account": { "label": "Codex", "plan": "Plus" },
  "billingMode": "subscription",
  "connectionStatus": "ready",
  "freshness": "fresh",
  "source": "codex_app_server",
  "observedAt": "2026-09-28T08:00:00Z",
  "lastAttemptAt": "2026-09-28T08:00:00Z",
  "quotaWindows": [
    {
      "id": "codex-primary",
      "label": "Primary window",
      "scope": "account",
      "model": null,
      "usedPercent": 25,
      "windowDurationMinutes": 300,
      "resetsAt": "2026-09-28T12:00:00Z"
    }
  ],
  "activity": null,
  "spend": null,
  "error": null
}
```
Required keys appear even when nullable. Account label is a string; plan is string or null. billingMode is subscription, api, or unknown. connectionStatus is ready, not_configured, sign_in_required, unsupported, or error. freshness is fresh, stale, expired, or unavailable. source is an adapter source identifier or null; timestamps are UTC ISO-8601 strings or null, except lastAttemptAt is always a timestamp.

quotaWindows is an array, possibly empty. Each window carries a stable id, source-based label, scope (account, model, or organization), model (string or null), usedPercent (nonnegative finite number or null), windowDurationMinutes (positive number or null), and resetsAt (timestamp or null). Preserve legitimate source percentages above 100; clamp only the visual progress indicator. Derive remaining percentage as max(0, 100 - usedPercent) only when usage is known. Do not invent window lengths.

activity, when supported, contains periodStart and periodEnd (nullable timestamps), inputTokens and outputTokens (nullable nonnegative integers), totalTokens (nullable nonnegative integer), and scope (account or local_session). spend, for later API connectors, contains amount (nonnegative finite number), currency (string), periodStart and periodEnd (timestamps), scope (account or organization), and isEstimate (boolean). error is null or an object with code (string), message (sanitized string), and retryAt (nullable timestamp). No secrets, conversation content, or raw provider error bodies appear in these records.

## Behavioral rules
- Prioritize reliability and deterministic business logic; do not guess business requirements.
- Follow brainstorming → approved design → planning → implementation.
- Do not build tools until discovery is answered, schemas are defined and confirmed, and the Blueprint is approved.
- Use Raycast password preferences or provider-managed login for runtime credentials; use an ignored `.env` only for development secrets. Never record secrets in project memory.
- Record meaningful progress, errors, tests, and discoveries in the planning documents.

## Architectural invariants
- `architecture/`: Markdown SOPs defining goals, inputs, logic, and edge cases.
- Navigation layer: route work between SOPs and execution tools.
- `src/providers/`: independent, deterministic TypeScript provider adapters; native Raycast runtime uses React/TypeScript.
- `src/lib/`: shared validation, normalization, caching, and formatting.
- `.tmp/`: ephemeral intermediate files.
- Update SOPs before changing implementation logic; document repair findings after verification.
- Runtime payload is delivered within Raycast; public distribution requires Raycast Store submission and review.

## Maintenance log
No deployed system yet.
