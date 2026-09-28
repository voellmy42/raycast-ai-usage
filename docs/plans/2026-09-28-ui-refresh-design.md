# AI Usage visual refresh

Status: Approved by the user on 2026-09-28. Existing extension remains installed for testing.

## Alternatives
1. Polish the existing compact list: shorten row names, use provider-specific colors, and reduce repeated freshness labels. Smallest change, but requires opening details to understand a quota.
2. Native split view (recommended): compact quota rows on the left and a capacity visualization, remaining percentage, reset countdown, and observation state for the selected quota on the right. Improves scanning while retaining Raycast's native interaction model.

## Proposed UI
- Native List with an inline detail panel. Keep provider sections, shorten quota row labels within their section, and distinguish account-wide versus model scope using accurate source data.
- Selected quota shows a prominent remaining percentage and a modern capacity meter, followed by reset countdown and source observation age. Unknown and expired observations receive neutral presentations.
- Consistent semantic colors: normal capacity, approaching limit, low capacity, and stale/unavailable. Color supplements text.
- Reduce repeated technical freshness labels. Keep errors and stale snapshot age visible. Friendly setup panels explain the next action for Claude and the pending Gemini connector.
- Retain existing keyboard refresh, provider usage links, preferences, and Claude capture-command action.
- Simplify menu-bar rows and align their status language with the main dashboard.

## Menu-bar visibility
- Add an explicit Hide Menu Bar item to the menu itself and a Show/Hide Menu Bar action in the dashboard.
- Persist visibility locally so scheduled refreshes do not restore a hidden icon.
- Hidden execution returns null, as documented by Raycast, and skips provider polling for that menu-bar invocation.
- Show Menu Bar explicitly restores visibility and launches the menu-bar command. Dashboard usage remains available while the menu-bar item is hidden.
- Keep the system-level enabled/disabled command setting under Raycast's control; do not edit Raycast preferences files directly.
- Verify hide, subsequent background execution, explicit show, and persistence across command relaunches.

Reference: https://developers.raycast.com/api-reference/menu-bar-commands (returning null removes a menu-bar item).

## Logo
Built-in imagegen preview: original segmented orbital capacity mark, cyan/blue/violet on a midnight tile, without lettering or provider logos. Draft path: /Users/voellmy/.codex/generated_images/01a0e6a4-8e98-7270-9a4f-88e50cb9cfe7/exec-8d236638-cf5a-4542-839d-1065e05be0a9.png.

After approval, produce a final 512px extension icon with clean outer transparency and readable small-size silhouette, preserve the original asset, and update the manifest to the new versioned icon.

## Validation and handoff
Invoke planning after visual-direction approval. Use existing data tests; add focused checks only if new formatting or capacity logic warrants them. Run TypeScript, ESLint, formatting, and Raycast build; install the refreshed development extension and hand it back for user testing. Publication is outside this visual-update request.
