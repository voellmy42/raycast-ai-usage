# Activity, forecasts, and model comparisons

Approved by the user on 2026-09-28.

## Goal and interface

Add a native Raycast Activity view accessible from the quota dashboard. Offer 7/30/90-day ranges, daily token graphs split by model, input/output/cache breakdowns, and explicit local coverage. Keep subscription quota separate from tokens.

Forecast each quota window using fresh observations of quota consumption. Display projected exhaustion relative to reset and estimated remaining capacity at reset. Insufficient observations, stale readings, changing reset boundaries, and ambiguous identity disable forecasts. Wording must describe a continuation of recent pace, not a guaranteed outcome.

Compare recorded activity by model and display provider-reported model quotas where available. Attribute quota consumption to a model only when the observation interval and source coverage support it. Mixed-model or unobserved activity must not produce model efficiency claims. A model-switch simulator is deferred until relationships are validated.

## Data

Import available local historical usage metadata and refresh incrementally. Sources must first be verified against installed formats. Persist only allowlisted timestamps, token counters, model identifiers, opaque deduplication keys, and quota observations. Do not retain prompts, responses, raw transcripts, credentials, or raw account identifiers. Parsing local session files for usage metadata is within the approved feature scope; existing architecture restrictions must be updated to describe this narrow access before implementation.

Local history may cover multiple accounts and omit other devices or hosted work. Never assign imported activity to a currently signed-in account without evidence. Historical tokens do not reconstruct historical quota percentages. Keep unknown values unknown and do not double-count cached input, cumulative token events, replayed messages, or subagent records.

## Delivery and validation

Use local storage and native Raycast details with generated chart images. No hosted service or generation calls. Verify import formats, deduplication, incremental append handling, reset-aware forecasts, identity separation, and chart totals with fixtures. Verify the native interface in both themes. Unsupported providers show an honest availability message.
