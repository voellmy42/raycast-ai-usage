# Compact Activity Legends

The user requested actual legend colors and shorter widget text. This corrects the approved activity design; the user’s requested presentation is the design approval. Brainstorming considered inline Markdown swatch images versus a legend within the existing SVG. Use SVG: swatches match chart colors exactly, render in the already-verified image path, and need fewer lines. Keep model names, omit provider prefixes, and shorten coverage text. Preserve import warnings and readable model identification.

## Implementation plan

Execute directly under the user's existing authorization to proceed without the missing executing-plans skill.

1. Update `src/lib/activity-chart.ts`: render a compact wrapping swatch legend below the bars, and real line samples for forecast legends. Use the same palette indices as the plotted series; gray always means Other.
2. Update `src/show-ai-activity.tsx`: remove the redundant textual legend and shorten coverage copy. Retain import warnings and source scope.
3. Format and typecheck; run existing chart checks and build locally. Inspect native rendering when Computer Use is available.

## Verification

TypeScript, targeted ESLint, existing chart tests, and the local Raycast build passed. Native dark-theme screenshots confirmed colored activity swatches, a compact wrapping legend, and colored observed/estimate/reset line samples on a populated live forecast. Import notes are now available through Actions instead of filling the overview. Captions and model/forecast explanations were shortened without changing calculations.
