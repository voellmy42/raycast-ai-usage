import { createHash } from "node:crypto";
import {
  withAppServer,
  ConnectionError,
  type AppServer,
} from "../lib/app-server";
import { codexCommand } from "../lib/executables";
import { baseUsage, freshness, normalizeCodex, object } from "../lib/normalize";
import type { CodexCache, Usage } from "../lib/types";

export type CodexResult = { usage: Usage; cache: CodexCache | null };
export async function readCodex(
  path?: string,
  cached?: CodexCache | null,
  force = false,
): Promise<CodexResult> {
  const { command, args } = await codexCommand(path);
  return withAppServer(command, args, (server) =>
    readCodexAccount(server, cached, force),
  );
}
export async function readCodexAccount(
  server: Pick<AppServer, "request">,
  cached?: CodexCache | null,
  force = false,
): Promise<CodexResult> {
  const response = object(
    await server.request("account/read", { refreshToken: false }),
  );
  if (response.account == null)
    throw new ConnectionError(
      "sign_in_required",
      "Sign in to Codex with your ChatGPT account, then refresh.",
    );
  const account = object(response.account);
  if (account.type !== "chatgpt") {
    return {
      usage: {
        ...baseUsage("codex"),
        billingMode: "api",
        connectionStatus: "unsupported",
        error: {
          code: "api_auth",
          message:
            "Codex uses API authentication. Subscription quotas require ChatGPT login; API spending is a separate reporting connection.",
          retryAt: null,
        },
      },
      cache: null,
    };
  }
  const identity =
    typeof account.id === "string"
      ? account.id
      : typeof account.email === "string"
        ? account.email
        : null;
  const fingerprint = identity
    ? createHash("sha256")
        .update(`codex:${identity}:${account.planType ?? ""}`)
        .digest("hex")
    : null;
  if (
    !force &&
    fingerprint &&
    cached?.fingerprint === fingerprint &&
    cached.usage.observedAt &&
    Date.now() - Date.parse(cached.usage.observedAt) < 300_000 &&
    freshness(cached.usage) !== "expired"
  ) {
    return {
      usage: {
        ...cached.usage,
        lastAttemptAt: new Date().toISOString(),
        freshness: freshness(cached.usage),
      },
      cache: cached,
    };
  }
  let raw: unknown;
  let readError: unknown;
  try {
    raw = await server.request("account/rateLimits/read");
  } catch (error) {
    readError = error;
  }
  // Recheck identity after reading quota in case the user switched account mid-request.
  const check = object(
    await server.request("account/read", { refreshToken: false }),
  );
  const current = check.account == null ? null : object(check.account);
  if (
    !current ||
    current.type !== account.type ||
    current.email !== account.email ||
    current.id !== account.id ||
    current.planType !== account.planType
  )
    throw new ConnectionError(
      "account_changed",
      "Codex account changed during refresh. Refresh again.",
    );
  if (readError) {
    if (fingerprint && cached?.fingerprint === fingerprint)
      return {
        usage: {
          ...cached.usage,
          connectionStatus: "error",
          freshness: "stale",
          lastAttemptAt: new Date().toISOString(),
          error: {
            code: "quota_read_failed",
            message:
              "Quota refresh failed. Showing the last observation for this verified account.",
            retryAt: null,
          },
        },
        cache: cached,
      };
    throw readError;
  }
  const usage = normalizeCodex(
    raw,
    typeof account.planType === "string" ? account.planType : null,
  );
  return { usage, cache: fingerprint ? { fingerprint, usage } : null };
}
