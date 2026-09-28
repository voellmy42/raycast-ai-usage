import {
  Cache,
  LocalStorage,
  LaunchType,
  launchCommand,
  showToast,
  Toast,
} from "@raycast/api";
import { useEffect, useState } from "react";
import {
  menuVisibilityKey,
  resolveMenuVisibility,
} from "../lib/menu-visibility";

const mirror = new Cache({ namespace: "menu-visibility" });
function updateMirror(visible: boolean) {
  try {
    mirror.set(menuVisibilityKey, String(visible));
  } catch {
    // The saved LocalStorage choice remains authoritative if the cache fails.
  }
}

export function useMenuVisibility(explicit?: boolean) {
  const cached = mirror.get(menuVisibilityKey);
  const [visible, setVisible] = useState(() =>
    resolveMenuVisibility(cached === "false" ? false : undefined, explicit),
  );
  // A mirrored hidden choice can return null immediately, avoiding scheduled icon flashes.
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const stored = await LocalStorage.getItem<boolean>(menuVisibilityKey);
        const next = resolveMenuVisibility(stored, explicit);
        if (explicit !== undefined)
          await LocalStorage.setItem(menuVisibilityKey, next);
        updateMirror(next);
        if (alive) setVisible(next);
      } catch {
        // If no mirror exists, fail closed instead of resurrecting a hidden menu.
        if (alive && cached === undefined) setVisible(false);
      } finally {
        if (alive) setLoading(false);
      }
    }
    void load();
    return () => {
      alive = false;
    };
  }, [explicit]);

  async function change(next: boolean, relaunch: boolean) {
    if (loading || saving) return;
    setSaving(true);
    try {
      await LocalStorage.setItem(menuVisibilityKey, next);
      updateMirror(next);
      setVisible(next);
      if (relaunch)
        await launchCommand({
          name: "ai-usage-menu-bar",
          type: LaunchType.Background,
          context: { visible: next },
        });
    } catch {
      await showToast({
        style: Toast.Style.Failure,
        title: "Could Not Update Menu Bar",
        message:
          "Check that AI Usage Menu Bar is enabled in Raycast, then try again.",
      });
    } finally {
      setSaving(false);
    }
  }
  return { visible, loading, saving, change };
}
export type MenuVisibilityControl = ReturnType<typeof useMenuVisibility>;
