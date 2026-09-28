import { useCallback, useEffect, useRef, useState } from "react";
import {
  getPreferenceValues,
  LocalStorage,
  showToast,
  Toast,
} from "@raycast/api";
import { baseUsage, validateCachedUsage } from "../lib/normalize";
import { failure, isolatedRead } from "../lib/refresh";
import { readCodex } from "../providers/codex";
import { readClaude } from "../providers/claude";
import { geminiUnavailable } from "../providers/gemini";
import type { CodexCache, Preferences, Usage } from "../lib/types";

import { providerVisible } from "../lib/menu-personalization";

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

export function useUsage(initial?: Usage) {
  const preferences = getPreferenceValues<Preferences>();
  const [usages, setUsages] = useState<Usage[]>(() =>
    [baseUsage("codex"), baseUsage("claude"), geminiUnavailable()].map(
      (usage) => (usage.provider === initial?.provider ? initial : usage),
    ),
  );
  const [loading, setLoading] = useState(true);
  const active = useRef(false);
  const alive = useRef(true);
  const refresh = useCallback(
    async (force = false) => {
      if (active.current) return;
      active.current = true;
      setLoading(true);
      const update = (usage: Usage) => {
        if (alive.current)
          setUsages((previous) =>
            previous.map((item) =>
              item.provider === usage.provider ? usage : item,
            ),
          );
      };
      try {
        await Promise.all([
          (async () => {
            if (!providerVisible("codex", preferences)) return;
            try {
              const result = await readCodex(
                preferences.codexPath,
                await readCache(),
                force,
              );
              update(result.usage);
              if (result.cache)
                await LocalStorage.setItem(key, JSON.stringify(result.cache));
              else await LocalStorage.removeItem(key);
            } catch (error) {
              update(failure("codex", error));
              await LocalStorage.removeItem(key);
            }
          })(),
          (async () =>
            providerVisible("claude", preferences) &&
            update(
              await isolatedRead("claude", () =>
                readClaude(preferences.claudeSnapshot),
              ),
            ))(),
        ]);
        if (force && alive.current)
          await showToast({
            style: Toast.Style.Success,
            title: "Usage Sources Checked",
            message: "Claude snapshots update during Claude Code activity.",
          });
      } catch {
        if (alive.current)
          await showToast({
            style: Toast.Style.Failure,
            title: "Could Not Save Usage Cache",
          });
      } finally {
        active.current = false;
        if (alive.current) setLoading(false);
      }
    },
    [
      preferences.codexPath,
      preferences.claudeSnapshot,
      preferences.codexVisible,
      preferences.claudeVisible,
    ],
  );
  useEffect(() => {
    alive.current = true;
    void refresh();
    return () => {
      alive.current = false;
    };
  }, [refresh]);
  return {
    usages: usages.filter((usage) =>
      providerVisible(usage.provider, preferences),
    ),
    loading,
    refresh,
  };
}
