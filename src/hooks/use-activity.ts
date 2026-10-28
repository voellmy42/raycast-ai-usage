import { useCallback, useEffect, useRef, useState } from "react";
import { environment } from "@raycast/api";
import { homedir } from "node:os";
import { join } from "node:path";
import { importActivity, ActivityImport } from "../lib/activity-store";
export function useActivity() {
  const [data, setData] = useState<ActivityImport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const active = useRef(false),
    alive = useRef(true);
  const refresh = useCallback(async () => {
    if (active.current) return;
    active.current = true;
    setLoading(true);
    setError(null);
    try {
      const base = process.env.CODEX_HOME || join(homedir(), ".codex");
      const roots = [
        { provider: "codex" as const, path: join(base, "sessions") },
        {
          provider: "codex" as const,
          path: join(base, "archived_sessions"),
          optional: true,
        },
      ];
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
  }, []);
  useEffect(() => {
    alive.current = true;
    void refresh();
    return () => {
      alive.current = false;
    };
  }, [refresh]);
  return { data, loading, error, refresh };
}
