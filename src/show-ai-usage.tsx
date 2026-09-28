import { Icon, List } from "@raycast/api";
import { useEffect, useState } from "react";
import { useUsage } from "./hooks/use-usage";
import { useMenuVisibility } from "./hooks/use-menu-visibility";
import { UsageActions } from "./components/usage-details";
import { QuotaDetail, quotaColor } from "./components/quota-detail";
import {
  connectionLabel,
  observationText,
  percent,
  quotaPresentation,
  shortQuotaLabel,
} from "./lib/format";

export default function ShowAIUsage() {
  const { usages, loading, refresh } = useUsage();
  const visibility = useMenuVisibility();
  const [, tick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => tick((value) => value + 1), 60_000);
    return () => clearInterval(timer);
  }, []);
  return (
    <List
      isLoading={loading}
      isShowingDetail
      searchBarPlaceholder="Search providers and quota windows…"
    >
      {usages.map((usage) => (
        <List.Section
          key={usage.provider}
          title={`${usage.account.label}${usage.account.plan ? ` · ${usage.account.plan}` : ""}`}
          subtitle={
            usage.provider === "claude" ? "Snapshot" : observationText(usage)
          }
        >
          {usage.quotaWindows.length ? (
            usage.quotaWindows.map((window) => {
              const stale =
                usage.freshness === "stale" ||
                usage.connectionStatus === "error" ||
                (usage.observedAt !== null &&
                  Date.now() - Date.parse(usage.observedAt) > 300_000);
              const capacity = quotaPresentation(window, stale);
              return (
                <List.Item
                  key={window.id}
                  id={`${usage.provider}:${window.id}`}
                  title={shortQuotaLabel(window)}
                  icon={{
                    source:
                      capacity.state === "expired" ? Icon.Clock : Icon.Gauge,
                    tintColor: quotaColor(capacity.state),
                  }}
                  accessories={[
                    {
                      text:
                        capacity.state === "expired"
                          ? "Refresh"
                          : capacity.remaining === null
                            ? "Unknown"
                            : `${percent(capacity.remaining)} left`,
                    },
                    ...(stale ? [{ tag: "Stale" }] : []),
                  ]}
                  detail={<QuotaDetail usage={usage} window={window} />}
                  actions={
                    <UsageActions
                      usage={usage}
                      refresh={() => void refresh(true)}
                      visibility={visibility}
                    />
                  }
                />
              );
            })
          ) : (
            <List.Item
              id={usage.provider}
              title={
                loading && usage.provider === "codex"
                  ? "Connecting…"
                  : connectionLabel(usage)
              }
              icon={
                usage.connectionStatus === "error"
                  ? Icon.ExclamationMark
                  : Icon.Plug
              }
              detail={<QuotaDetail usage={usage} />}
              actions={
                <UsageActions
                  usage={usage}
                  refresh={() => void refresh(true)}
                  visibility={visibility}
                />
              }
            />
          )}
        </List.Section>
      ))}
    </List>
  );
}
