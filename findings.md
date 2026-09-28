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
