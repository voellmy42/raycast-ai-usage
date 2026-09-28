# Usage data

Validate unknown inputs, normalize to gemini.md, and serialize only allowed fields. Missing usage stays null, zero stays zero, and expired windows never become zero for the next period. Display only actual provider-reported durations and scope. Preserve all quota buckets and legitimate source percentages above 100; visual capacity is bounded.

Never use context occupancy or local session token counts as account subscription capacity. Input/output tokens are optional activity, monetary spending is separate. Account identity is used only transiently for a hashed cache partition.

Activity analytics uses a separate versioned local record contract defined in `src/lib/activity.ts`, with device-local scope. Quota observations use `src/lib/forecast.ts` and remain partitioned from imported activity. The existing provider Usage payload remains compatible.
