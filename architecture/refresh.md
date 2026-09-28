# Refresh and cache

Read account identity on every Codex refresh before reusing account-bound observations. Cache only sanitized validated usage plus a local identity fingerprint. Cached data is displayed as unverified/stale until the same identity is confirmed. Authentication failure removes cached Codex quota display; transport failure may retain verified-in-this-run data with a stale label. Never silently show a different account's data.

Refresh on opening, use a five-minute TTL for usage reads, and allow manual refresh. Account identity is checked even when using the quota cache. Provider reads run independently and overlapping refreshes are deduplicated. Honor retry timestamps. Reject schema-incompatible cached observations. Claude snapshots always show their actual observation time; reading a file does not update that timestamp.
