# Gemini CLI feasibility

Gemini CLI 0.61.0 is installed. Its official implementation calls retrieveUserQuota and exposes modelId, remainingFraction, and resetTime in internal quota buckets. The documented user interface is `/stats model`; no standalone public read-only JSON quota command has yet been verified.

Do not scrape credentials or Keychain, reuse internal OAuth endpoints blindly, or represent session tokens as account quota. Before building a Gemini connector, verify an external interface and its authentication path. Until then, Gemini is explicitly marked unavailable rather than advertised as supported.
