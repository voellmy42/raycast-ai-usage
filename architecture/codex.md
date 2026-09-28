# Codex account usage

Use a working installed Codex CLI, preferring a user-configured executable, then the CLI bundled with ChatGPT/Codex and standard CLI locations. The existing global npm launcher is broken on this machine; the ChatGPT application contains a usable executable.

Start `app-server` over stdio in an empty temporary directory. Send `initialize` with identifying client metadata, wait for its response, and send `initialized`. Read `account/read` and `account/rateLimits/read` only; no conversations, generation, logout, login switching, credit consumption, or emails.

Validate all responses. Prefer the multi-bucket view and preserve nullable windows. Percentage is usage consumed, timestamps are Unix seconds, duration comes from the provider. Missing data stays unknown. Do not infer model scope from arbitrary bucket IDs.

Bound process output and per-request timeouts. Ignore notifications and reject unsupported server requests. On failure settle pending requests, sanitize errors, and terminate the child process. Never print raw account objects, credentials, or raw provider errors.

Verified with bundled CLI 0.158.0-alpha.2.1. The global npm launcher fails with ENOENT. Sandboxed CLI startup failed because the provider runtime needs its normal account-storage permissions; the same read-only handshake succeeds with host execution permissions. Protocol output may contain JSON primitives or malformed lines: reject them rather than accessing object fields blindly.

Use provider-managed authentication without reading credential files or Keychain. Match any cached observation to the current provider account before reuse; derive a non-reversible local identity fingerprint, never persist raw email/account identifiers.

Activity feature exception (approved 2026-09-28): the separate local activity importer may parse session files for allowlisted usage metadata under `architecture/activity.md`. It does not change quota authentication or associate imported activity with the signed-in account.
