# Codex account usage

Use a working installed Codex CLI, preferring a user-configured executable, then the CLI bundled with ChatGPT/Codex and standard CLI locations. The existing global npm launcher is broken on this machine; the ChatGPT application contains a usable executable.

Start `app-server` over stdio in an empty temporary directory. Send `initialize` with identifying client metadata, wait for its response, and send `initialized`. Read `account/read` and `account/rateLimits/read` only; no conversations, generation, logout, login switching, credit consumption, or emails.

Validate all responses. Prefer the multi-bucket view and preserve nullable windows. Percentage is usage consumed, timestamps are Unix seconds, duration comes from the provider. Missing data stays unknown. Do not infer model scope from arbitrary bucket IDs.

Bound process output and per-request timeouts. Ignore notifications and reject unsupported server requests. On failure settle pending requests, sanitize errors, and terminate the child process. Never print raw account objects, credentials, or raw provider errors.

Use provider-managed authentication without reading credential files or Keychain. Match any cached observation to the current provider account before reuse; derive a non-reversible local identity fingerprint, never persist raw email/account identifiers.
