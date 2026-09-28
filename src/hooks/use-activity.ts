import { useCallback, useEffect, useRef, useState } from "react";
import { environment, getPreferenceValues } from "@raycast/api";
import { homedir } from "node:os";
import { join } from "node:path";
import { importActivity, ActivityImport } from "../lib/activity-store";
import type { Preferences } from "../lib/types";
export function useActivity() {
  const [data, setData] = useState<ActivityImport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const active = useRef(false),
    alive = useRef(true);
  const { codexVisible, claudeVisible } = getPreferenceValues<Preferences>();
  const refresh = useCallback(async () => {
    if (active.current) return;
    active.current = true;
    setLoading(true);
    setError(null);
    try {
      const roots = [];
      if (codexVisible !== false) {
        const base = process.env.CODEX_HOME || join(homedir(), ".codex");
        roots.push(
          { provider: "codex" as const, path: join(base, "sessions") },
          {
            provider: "codex" as const,
            path: join(base, "archived_sessions"),
            optional: true,
          },
        );
      }
      if (claudeVisible !== false)
        roots.push({
          provider: "claude" as const,
          path: join(
            process.env.CLAUDE_CONFIG_DIR || join(homedir(), ".claude"),
            "projects",
          ),
        });
      const result = await importActivity(
        roots,
        join(environment.supportPath, "analytics"),
      );
      if (alive.current) setData(result);
    } catch {
      if (alive.current)
        setError(
          "Could not import local activity. Check access to the local history directories and refresh.",
        );
    } finally {
      active.current = false;
      if (alive.current) setLoading(false);
    }
  }, [codexVisible, claudeVisible]);
  useEffect(() => {
    alive.current = true;
    void refresh();
    return () => {
      alive.current = false;
    };
  }, [refresh]);
  return { data, loading, error, refresh };
}
