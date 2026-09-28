export type Provider = "codex" | "claude" | "gemini";
export type Freshness = "fresh" | "stale" | "expired" | "unavailable";
export type ConnectionStatus =
  "ready" | "not_configured" | "sign_in_required" | "unsupported" | "error";
export interface QuotaWindow {
  id: string;
  label: string;
  scope: "account" | "model" | "organization";
  model: string | null;
  usedPercent: number | null;
  windowDurationMinutes: number | null;
  resetsAt: string | null;
}
export interface Usage {
  schemaVersion: 1;
  provider: Provider;
  connectionId: string;
  account: { label: string; plan: string | null };
  billingMode: "subscription" | "api" | "unknown";
  connectionStatus: ConnectionStatus;
  freshness: Freshness;
  source: string | null;
  observedAt: string | null;
  lastAttemptAt: string;
  quotaWindows: QuotaWindow[];
  activity: null;
  spend: null;
  error: { code: string; message: string; retryAt: string | null } | null;
}
export interface Preferences {
  codexPath?: string;
  claudeSnapshot?: string;
}
export interface CodexCache {
  fingerprint: string;
  usage: Usage;
}
