# Codex-first release design

Approved by the user on 2026-10-28: ship a working Codex-only app and tease Claude and other providers for later, depending on traction.

## Product

Keep AI Usage branding and all three existing commands. Codex is the only active quota and activity provider. Remove Claude/Gemini preferences and setup actions from the release; keep experimental parsers internally for future work. A small dashboard section says “More Providers Coming Soon”; its detail mentions Claude and others, with no date, signup, or inactive connection controls.

Keep Codex account-level quotas, menu pinning, history, and forecasts. Import only local Codex history, including when an older mixed-provider cache exists. Migrate old Claude/Gemini menu selections to automatic Codex selection, preserving valid Codex pins. Codex is always visible in this single-provider release.

## Interaction and reliability

Refresh Usage becomes the primary dashboard action. Keep the existing menu toggle shortcut. Add direct navigation from the menu bar to Usage and Activity. Manual refresh reports provider failure accurately and distinguishes a successful provider read from a local cache-write failure. Show connection recovery guidance for absent CLI and signed-out accounts. Keep prompts and credentials out of stored usage data.

## Release packaging

Rewrite README around installation from the Store, Codex setup, daily use, local-data privacy, limitations, and development. Consolidate changelog into one initial-release entry. Update Store readiness documentation to the actual remaining gates: author handle, current API requirement, screenshots, and native/clean-Mac verification. Do not invent an author handle or claim native checks that were not performed.

## Validation

Run tests, TypeScript, distribution build, and lint. Add meaningful regression coverage for old-provider selection migration, refresh outcomes, and reuse of mixed-provider activity caches. Inspect native Raycast if available. A second Mac and real account/profile decisions remain external validation steps.
