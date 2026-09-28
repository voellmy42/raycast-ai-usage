# Project plan

Status: Codex-first development extension built and registered locally. Claude snapshot connector tested; Gemini live connection and Store readiness remain pending.

## Protocol 0 — Initialization
- [x] Initialize project memory and constitution.
- [x] Answer initial discovery questions.
- [x] Confirm initial account types and usage priorities.
- [x] Define and confirm input/output JSON schemas.
- [x] Approve Blueprint and design.
- [x] Invoke planning skill after design approval.
- [x] Create detailed implementation plan.
- [x] Resolve missing required executing-plans skill or obtain a workflow exception (user: execute).

## B — Blueprint
Confirm desired outcome, integrations, source of truth, delivery destination, and behavioral rules. Research relevant resources once scope is known. Compare approaches and present the design for approval.

## L — Link
Verify required credentials and API connections with minimal handshakes. The global Codex CLI launcher currently fails because its platform executable is absent; recover a working CLI before testing its App Server. Do not inspect or export credential contents.

- [x] Locate working bundled Codex executable and verify Plus account quotas.
- [ ] Verify live Claude quota capture (installed CLI is below documented requirement).
- [ ] Establish a supported Gemini quota route or resolve experimental connector choice.

## A — Architect
Document SOPs before implementing deterministic, testable TypeScript provider adapters and native Raycast UI.

- [x] Provider SOPs, normalized contract, subprocess lifecycle, and account cache.
- [x] Codex live adapter, native dashboard/details, and menu bar.
- [x] Claude opt-in snapshot helper and reader, tested with fixtures.
- [x] 20 automated tests, type check, ESLint, and formatting.
- [ ] Gemini live adapter, after connectivity verification.

## S — Stylize
Refine payload and any UI; obtain feedback before deployment.

- [x] Native components, custom icon, and setup/maintenance documentation.
- [x] Development build and local Raycast registration.
- [ ] Native visual verification/screenshots (Computer Use permission unavailable).
- [ ] User feedback on installed extension.

## T — Trigger
Deliver within Raycast, prepare public Store submission, configure any approved Raycast refresh scheduling, and finalize maintenance documentation.

- [x] Optional menu-bar refresh interval and development installation.
- [ ] Confirm actual Raycast author handle and pass full manifest lint.
- [ ] Submit complete, accurately documented extension for Store review.
- [ ] Store acceptance (external milestone).
