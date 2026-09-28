# Changelog

## Activity graphs and quota forecasts — 2026-09-28

- Added Show AI Activity with 7/30/90-day stacked token graphs and per-model token/cache breakdowns.
- Imported local Codex and Claude Code usage metadata with deduplication, bounded streaming, and an incremental file cache.
- Added account/source-partitioned quota history and conditional forecasts against each reset time.
- Added dashboard navigation to Activity and explicit coverage/insufficient-history states.


## Menu personalization - 2026-09-28

- Pin a quota window or automatically follow a provider’s lowest remaining quota.
- Choose compact or detailed menu text and hide unused providers.
- Preserve unavailable, stale, and snapshot states in the menu title.

## [Initial Release] - {PR_MERGE_DATE}
- Split dashboard with inline capacity details and a modern orbital icon.
- Persistent menu-bar hide/show controls; hidden menu commands skip provider checks.
- Native subscription usage list, provider detail views, refresh actions, and optional menu-bar summary.
- Codex App Server connection, multiple quota windows, provider reset times, and account-aware cache.
- Opt-in Claude Code quota snapshot helper; current live version prerequisite documented.
- Gemini connector investigation state, explicitly unavailable until verified.
- Hide/show menu-bar control exposed as the primary dashboard action with Cmd+Shift+M, and Hide placed at the top of the menu dropdown.
