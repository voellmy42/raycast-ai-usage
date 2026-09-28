import {
  Icon,
  MenuBarExtra,
  open,
  openExtensionPreferences,
  type LaunchProps,
} from "@raycast/api";
import { useUsage } from "./hooks/use-usage";
import { useMenuVisibility } from "./hooks/use-menu-visibility";
import {
  connectionLabel,
  isExpired,
  quotaSummary,
  resetText,
  shortQuotaLabel,
} from "./lib/format";
import { usagePages } from "./components/usage-details";

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
  const windows = usages[0].quotaWindows.filter(
    (window) => !isExpired(window) && window.usedPercent !== null,
  );
  const remaining = windows.length
    ? Math.max(
        0,
        100 -
          Math.max(...windows.map((window) => window.usedPercent as number)),
      )
    : null;
  const stale =
    usages[0].freshness === "stale" || usages[0].connectionStatus === "error";
  return (
    <MenuBarExtra
      icon={Icon.Gauge}
      title={
        remaining === null
          ? undefined
          : `${Math.round(remaining)}%${stale ? " ·" : ""}`
      }
      tooltip={`AI Usage · ${stale ? "Last observed" : "Lowest remaining"} Codex quota`}
      isLoading={loading}
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
