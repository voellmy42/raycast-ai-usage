# Findings

- The supplied brief specifies B.L.A.S.T. and the A.N.T. three-layer architecture.
- The current workspace was empty at initialization.
- Confirmed goal: a native Raycast extension for viewing AI account usage without opening each provider app, intended for personal use and eventual Raycast Store publication.
- Initial providers named: OpenAI Codex and Claude Code; architecture should allow additional providers.
- User confirmed Codex through ChatGPT Plus as the main personal account and requested Claude and Gemini for broader adoption.
- Source of truth: linked AI accounts. Delivery: within Raycast. No additional behavioral rules supplied.
- Current account types, available credentials, platform scope, and required usage metrics remain to be clarified.
- Implementation requires approved design, confirmed schemas, and approved Blueprint.

## Research — 2026-09-28
- Raycast Store guidelines prohibit Keychain access and recommend password preferences for API credentials: https://developers.raycast.com/basics/prepare-an-extension-for-store
- Codex App Server documents `account/rateLimits/read` for subscription quota windows and `account/usage/read` for account token summaries. Multiple quota buckets and nullable fields must be handled: https://learn.chatgpt.com/docs/app-server
- Claude Code's documented status-line payload exposes five-hour and seven-day quota usage after an API response for supported subscription plans. A local snapshot integration is feasible, but cannot promise fresh on-demand account usage while Claude Code is inactive: https://code.claude.com/docs/en/statusline
- OpenAI has organization Usage endpoints: https://developers.openai.com/api/reference/resources/admin/subresources/organization/subresources/usage
- Anthropic Usage and Cost endpoints require eligible Admin API credentials; individual accounts and workspace-scoped keys have limitations: https://platform.claude.com/docs/en/manage-claude/usage-cost-api
- Existing project worth assessing for integration patterns and CLI reuse: CodexBar (MIT), https://github.com/steipete/CodexBar. Its capabilities should not be assumed to meet Raycast Store requirements automatically.
- Proposed platform adaptation, pending design approval: native Raycast TypeScript/React, with deterministic provider adapters and SOPs rather than a required Python runtime; Raycast is the runtime delivery destination and the Store is the distribution destination.
- Gemini CLI documentation distinguishes Google login subscription quotas from API-key/Vertex usage. A stable external quota-reading interface remains unverified: https://geminicli.com/docs/resources/quota-and-pricing/ and https://geminicli.com/docs/reference/commands/

## Implementation discoveries — 2026-09-28
- Working provider-managed Codex executable is bundled inside ChatGPT.app. Verified CLI version: 0.158.0-alpha.2.1. The global npm launcher is broken; no global software installation was changed.
- Read-only initialize/account/rateLimits handshake succeeds with host permissions, returning ChatGPT Plus, five-hour and weekly quotas, and an additional independently metered bucket. The completed adapter also succeeded against the live account and preserves source-provided labels, which can differ from earlier responses.
- Raycast API 2.5.2 and project dependencies installed; npm audit reported no vulnerabilities during installation.
- Claude Code version is 2.1.150, below the current documented 2.1.251 quota status-line requirement. Snapshot helper/parser verified with synthetic fixtures; live Claude account verification remains pending.
- Gemini CLI version is 0.61.0. Its official source exports quota retrieval in CodeAssistServer, but the underlying endpoint is v1internal, not a documented third-party quota API: https://raw.githubusercontent.com/google-gemini/gemini-cli/main/packages/core/src/code_assist/server.ts . The choice of supported versus experimental connector was requested from the user; no internal credential/API connector was implemented.
- Raycast full manifest lint confirmed username voellmy returns HTTP 404. The actual author handle is required before Store submission.
- Native Computer Use returned permissions not granted. No screenshot or native interaction was verified. Raycast CLI development build succeeded and copied both commands and assets into its local extension directory.
- tsx CLI tries to create an IPC socket blocked by the workspace sandbox; `node --import tsx --test` runs the same tests successfully without that IPC dependency.
- Raycast build can target the workspace dist directory explicitly for sandbox-friendly validation. Default development output requires access to Raycast's configuration directory.
- UI refresh discovery: Raycast documents returning null from a menu-bar command to remove its item. Store a local visibility choice, expose hide/show actions, and skip menu-bar provider polling while hidden; never directly modify Raycast command preferences.

- Raycast Cache is synchronous, shared across extension commands, and evictable; use LocalStorage as visibility source and a Cache mirror to suppress initial hidden-menu flashes. Provider hooks mount only after visible settings are loaded.
- Store guidelines require a valid Raycast author handle, 512px PNG, distribution testing, provider terms review, and recommend three real 2000×1250 screenshots. Current submission blockers are author verification, native retest, live Claude verification, and Gemini/API support scope.
