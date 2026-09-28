# Claude Code quota snapshot

The documented status-line rate_limits fields require Claude Code v2.1.251 or later for the current documentation. This host has v2.1.150. Do not update global software or modify status-line configuration automatically.

An opt-in standalone Node helper in assets/claude-statusline.cjs reads Claude Code status-line JSON from stdin and atomically writes an allowlisted quota snapshot to the path supplied by the user. It ships with the extension; a Copy Claude Capture Command action provides its installed path and a stable default snapshot destination. The default application-support snapshot is detected automatically; preferences support other paths. It emits no status-line text, so it can run before the user's existing renderer. README explains composition and user-controlled setup.

Never read Claude credentials, Keychain, conversation text, or transcript files. Persist only quotas, observation time, and schema version. Do not claim the snapshot identifies a current account; UI says last observed Claude Code session. Never combine or add quota percentages across sessions. Latest source observation wins. Missing quotas invalidate previously captured data; expired windows remain expired.
