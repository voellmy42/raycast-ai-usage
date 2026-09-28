import {
  Icon,
  LocalStorage,
  getPreferenceValues,
  MenuBarExtra,
  open,
  openExtensionPreferences,
  type LaunchProps,
} from "@raycast/api";
import { useUsage } from "./hooks/use-usage";
import { useMenuVisibility } from "./hooks/use-menu-visibility";
import {
  connectionLabel,
  quotaSummary,
  resetText,
  shortQuotaLabel,
} from "./lib/format";
import { usagePages } from "./components/usage-details";

import { useEffect, useState } from "react";
import {
  menuPresentation,
  parseSelection,
  selectionKey,
  type MenuSelection,
} from "./lib/menu-personalization";
import type { Preferences } from "./lib/types";

export default function AIUsageMenuBar(
  props: LaunchProps<{ launchContext: { visible?: boolean } }>,
) {
  const visibility = useMenuVisibility(props.launchContext?.visible);
  if (!visibility.visible) return null;
  if (visibility.loading)
    return (
      <MenuBarExtra
        icon={Icon.Gauge}
        isLoading
        tooltip="Loading AI Usage preferences…"
      />
    );
  // Keeping provider hooks in this child prevents reads while the menu is hidden.
  return <VisibleMenu hide={() => visibility.change(false, false)} />;
}
function VisibleMenu({ hide }: { hide: () => Promise<void> }) {
  const { usages, loading, refresh } = useUsage();
  const [selection, setSelection] = useState<MenuSelection>();
  const [selectionError, setSelectionError] = useState(false);
  useEffect(() => {
    let alive = true;
    void LocalStorage.getItem<string>(selectionKey)
      .then((raw) => {
        if (alive) setSelection(parseSelection(raw));
      })
      .catch(() => {
        if (alive) setSelectionError(true);
      });
    return () => {
      alive = false;
    };
  }, []);
  const preferences = getPreferenceValues<Preferences>();
  const presentation = selection
    ? menuPresentation(usages, selection, preferences.menuStyle)
    : {
        title: selectionError ? "Selection unavailable" : undefined,
        tooltip: selectionError
          ? "Could not load saved menu selection"
          : "Loading menu selection…",
      };
  return (
    <MenuBarExtra
      icon={Icon.Gauge}
      title={presentation.title}
      tooltip={presentation.tooltip}
      isLoading={loading || (!selection && !selectionError)}
    >
      <MenuBarExtra.Section>
        <MenuBarExtra.Item
          title="Hide Menu Bar"
          icon={Icon.EyeDisabled}
          onAction={hide}
        />
      </MenuBarExtra.Section>
      {usages.map((usage) => (
        <MenuBarExtra.Section
          key={usage.provider}
          title={`${usage.account.label}${usage.source === "claude_statusline_snapshot" ? " · Snapshot" : ""}${usage.freshness === "stale" ? " · Stale" : ""}`}
        >
          {usage.quotaWindows.length ? (
            usage.quotaWindows.map((window) => (
              <MenuBarExtra.Item
                key={window.id}
                title={`${shortQuotaLabel(window)}: ${quotaSummary(window)}`}
                subtitle={resetText(window)}
                onAction={() => open(usagePages[usage.provider])}
              />
            ))
          ) : (
            <MenuBarExtra.Item
              title={connectionLabel(usage)}
              onAction={openExtensionPreferences}
            />
          )}
        </MenuBarExtra.Section>
      ))}
      <MenuBarExtra.Section>
        <MenuBarExtra.Item
          title="Refresh Usage"
          icon={Icon.ArrowClockwise}
          onAction={() => refresh(true)}
        />
        <MenuBarExtra.Item
          title="Open Extension Preferences"
          icon={Icon.Gear}
          onAction={openExtensionPreferences}
        />
      </MenuBarExtra.Section>
    </MenuBarExtra>
  );
}
