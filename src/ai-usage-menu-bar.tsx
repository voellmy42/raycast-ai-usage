import {
  Icon,
  MenuBarExtra,
  open,
  openExtensionPreferences,
} from "@raycast/api";
import { useUsage } from "./hooks/use-usage";
import { isExpired, quotaSummary, resetText } from "./lib/format";
import { usagePages } from "./components/usage-details";
export default function AIUsageMenuBar() {
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
  return (
    <MenuBarExtra
      icon={Icon.Gauge}
      title={
        remaining === null
          ? undefined
          : `${Math.round(remaining)}%${usages[0].freshness === "stale" ? " ·" : ""}`
      }
      tooltip="AI Usage · Lowest remaining Codex quota"
      isLoading={loading}
    >
      {usages.map((usage) => (
        <MenuBarExtra.Section
          key={usage.provider}
          title={`${usage.account.label}${usage.freshness === "stale" ? " · Stale" : ""}`}
        >
          {usage.quotaWindows.length ? (
            usage.quotaWindows.map((window) => (
              <MenuBarExtra.Item
                key={window.id}
                title={`${window.label}: ${quotaSummary(window)}`}
                subtitle={resetText(window)}
                onAction={() => open(usagePages[usage.provider])}
              />
            ))
          ) : (
            <MenuBarExtra.Item
              title={
                usage.provider === "gemini"
                  ? "Integration Pending"
                  : "Setup Required"
              }
              onAction={openExtensionPreferences}
            />
          )}
        </MenuBarExtra.Section>
      ))}
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
    </MenuBarExtra>
  );
}
