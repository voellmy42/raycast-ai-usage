import { useCallback, useEffect, useRef, useState } from "react";
import {
  environment,
  getPreferenceValues,
  LocalStorage,
  showToast,
  Toast,
} from "@raycast/api";
import { join } from "node:path";
import { baseUsage, validateCachedUsage } from "../lib/normalize";
import { failure, refreshFeedback } from "../lib/refresh";
import { readCodex, type CodexResult } from "../providers/codex";
import type { CodexCache, Preferences, Usage } from "../lib/types";
import { recordQuota } from "../lib/quota-history";
import type { QuotaObservation } from "../lib/forecast";

const key = "codex-usage-v1";
export async function readCache(): Promise<CodexCache | null> {
  try {
    const text = await LocalStorage.getItem<string>(key);
    if (!text) return null;
    const record = JSON.parse(text);
    if (
      typeof record.fingerprint !== "string" ||
      !/^[a-f0-9]{64}$/.test(record.fingerprint)
    )
      return null;
    return {
      fingerprint: record.fingerprint,
      usage: validateCachedUsage(record.usage),
    };
  } catch {
    return null;
  }
}

export function useUsage() {
  const { codexPath } = getPreferenceValues<Preferences>();
  const [usage, setUsage] = useState<Usage>(() => baseUsage("codex"));
  const [history, setHistory] = useState<Record<string, QuotaObservation[]>>(
    {},
  );
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const active = useRef(false);
  const alive = useRef(true);
  const refresh = useCallback(
    async (force = false) => {
      if (active.current) return;
      active.current = true;
      if (alive.current) {
        setLoading(true);
        setHistory({});
        setHistoryError(null);
      }
      try {
        let result: CodexResult;
        try {
          result = await readCodex(codexPath, await readCache(), force);
        } catch (error) {
          result = { usage: failure("codex", error), cache: null };
        }
        if (alive.current) setUsage(result.usage);
        let cacheError = false;
        try {
          if (result.cache)
            await LocalStorage.setItem(key, JSON.stringify(result.cache));
          else await LocalStorage.removeItem(key);
        } catch {
          cacheError = true;
          if (alive.current)
            setHistoryError(
              "The local usage cache could not be updated. Try refreshing again.",
            );
        }
        if (result.cache) {
          try {
            const points = await recordQuota(
              join(environment.supportPath, "analytics"),
              `codex:${result.cache.fingerprint}`,
              result.usage,
            );
            if (
              alive.current &&
              result.usage.connectionStatus === "ready" &&
              result.usage.freshness === "fresh"
            )
              setHistory({ codex: points });
          } catch {
            if (alive.current)
              setHistoryError(
                "Quota history could not be saved. Forecasts may be unavailable.",
              );
          }
        }
        if (force && alive.current) {
          const feedback = refreshFeedback(result.usage, cacheError);
          await showToast({
            style: feedback.success ? Toast.Style.Success : Toast.Style.Failure,
            title: feedback.title,
            message: feedback.message,
          });
        }
      } finally {
        active.current = false;
        if (alive.current) setLoading(false);
      }
    },
    [codexPath],
  );
  useEffect(() => {
    alive.current = true;
    void refresh();
    return () => {
      alive.current = false;
    };
  }, [refresh]);
  return { usages: [usage], loading, refresh, history, historyError };
}
