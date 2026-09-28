import { Action, ActionPanel, Color, Icon, List } from "@raycast/api";
import { useUsage } from "./hooks/use-usage";
import { UsageActions, UsageDetails } from "./components/usage-details";
import {
  isExpired,
  observationText,
  quotaSummary,
  resetText,
} from "./lib/format";

export default function ShowAIUsage() {
  const { usages, loading, refresh } = useUsage();
  return (
    <List
      isLoading={loading}
      searchBarPlaceholder="Search providers and quota windows…"
    >
      {usages.map((usage) => (
        <List.Section
          key={usage.provider}
          title={`${usage.account.label}${usage.account.plan ? ` · ${usage.account.plan}` : ""}`}
          subtitle={
            usage.provider === "claude"
              ? `Snapshot · ${observationText(usage)}`
              : observationText(usage)
          }
        >
          {usage.quotaWindows.length ? (
            usage.quotaWindows.map((window) => (
              <List.Item
                key={window.id}
                title={window.label}
                icon={{
                  source: isExpired(window) ? Icon.Clock : Icon.Gauge,
                  tintColor:
                    isExpired(window) || usage.freshness === "stale"
                      ? Color.SecondaryText
                      : (window.usedPercent ?? 0) >= 90
                        ? Color.Red
                        : Color.Green,
                }}
                subtitle={quotaSummary(window)}
                accessories={[
                  { text: resetText(window) },
                  {
                    tag:
                      usage.connectionStatus === "error"
                        ? "Refresh Failed"
                        : usage.freshness,
                  },
                ]}
                actions={
                  <ActionPanel>
                    <Action.Push
                      title="View Usage Details"
                      icon={Icon.List}
                      target={<UsageDetails usage={usage} />}
                    />
                    <UsageActions
                      usage={usage}
                      refresh={() => void refresh(true)}
                    />
                  </ActionPanel>
                }
              />
            ))
          ) : (
            <List.Item
              title={usage.account.label}
              icon={
                usage.connectionStatus === "error"
                  ? Icon.ExclamationMark
                  : Icon.Plug
              }
              subtitle={
                loading && usage.provider === "codex"
                  ? "Connecting…"
                  : usage.connectionStatus.replaceAll("_", " ")
              }
              accessories={[
                {
                  text:
                    usage.provider === "gemini"
                      ? "Integration Pending"
                      : "Setup Required",
                },
              ]}
              actions={
                <ActionPanel>
                  <Action.Push
                    title="View Connection Details"
                    target={<UsageDetails usage={usage} />}
                  />
                  <UsageActions
                    usage={usage}
                    refresh={() => void refresh(true)}
                  />
                </ActionPanel>
              }
            />
          )}
        </List.Section>
      ))}
    </List>
  );
}
