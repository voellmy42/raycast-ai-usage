import {
  Action,
  ActionPanel,
  Icon,
  Keyboard,
  List,
  environment,
  launchCommand,
  LaunchType,
} from "@raycast/api";
import { useEffect, useMemo, useState } from "react";
import { useActivity } from "./hooks/use-activity";
import { useUsage } from "./hooks/use-usage";
import { aggregate } from "./lib/activity";
import {
  activityChart,
  chartMarkdown,
  colors,
  compact,
  quotaChart,
} from "./lib/activity-chart";
import { forecast, forecastText } from "./lib/forecast";
import { markdownEscape, shortQuotaLabel } from "./lib/format";

export default function ShowAIActivity() {
  const activity = useActivity();
  const quota = useUsage();
  const [days, setDays] = useState("30");
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);
  const summary = useMemo(
    () => aggregate(activity.data?.events ?? [], Number(days), now),
    [activity.data, days, now],
  );
  const dark = environment.appearance === "dark";
  const keys = useMemo(
    () =>
      aggregate(
        activity.data?.events ?? [],
        90,
        activity.data?.updatedAt ?? now,
      )
        .models.slice(0, 6)
        .map((m) => m.key),
    [activity.data, now],
  );
  const chart = useMemo(
    () =>
      chartMarkdown(
        activityChart(summary, dark, keys),
        "Daily tokens by model",
      ),
    [summary, dark, keys],
  );
  const fullEvents = activity.data?.events ?? [];
  const earliest = fullEvents.reduce(
    (min, e) => Math.min(min, e.time),
    Infinity,
  );
  const coverage = `Local records on this Mac${Number.isFinite(earliest) ? ` since ${new Date(earliest).toLocaleDateString()}` : ""}. May include multiple accounts and omit other devices or cloud activity. Blank days mean no local records.`;
  const issues = [
    ...(activity.data?.notes ?? []),
    ...(activity.error ? [activity.error] : []),
  ];
  const legend = keys
    .flatMap((key, i) =>
      summary.models.some((m) => m.key === key)
        ? [
            `- ${["Blue", "Purple", "Teal", "Amber", "Pink", "Sky blue"][i]}: ${markdownEscape(key)}`,
          ]
        : [],
    )
    .join("\n");
  const actions = (
    <ActionPanel>
      <Action
        title="Refresh Activity and Quotas"
        icon={Icon.ArrowClockwise}
        shortcut={Keyboard.Shortcut.Common.Refresh}
        onAction={() => {
          setNow(Date.now());
          void activity.refresh();
          void quota.refresh(true);
        }}
      />
      <Action
        title="Show AI Usage"
        icon={Icon.Gauge}
        onAction={() =>
          launchCommand({
            name: "show-ai-usage",
            type: LaunchType.UserInitiated,
          })
        }
      />
    </ActionPanel>
  );
  return (
    <List
      isLoading={activity.loading || quota.loading}
      isShowingDetail
      searchBarPlaceholder="Search activity, models, and forecasts…"
      searchBarAccessory={
        <List.Dropdown
          tooltip="Activity period"
          value={days}
          onChange={setDays}
        >
          {[7, 30, 90].map((d) => (
            <List.Dropdown.Item
              key={d}
              title={`Last ${d} days`}
              value={String(d)}
            />
          ))}
        </List.Dropdown>
      }
    >
      <List.Section title="Activity" subtitle="This Mac">
        <List.Item
          id="overview"
          title="Token Activity"
          icon={Icon.BarChart}
          accessories={[{ text: `${compact(summary.total)} tokens` }]}
          actions={actions}
          detail={
            <List.Item.Detail
              markdown={`# ${compact(summary.total)} tokens\n\nLast ${days} days · ${summary.models.length} models\n\n${chart}\n\n${summary.events ? `${legend}${summary.models.some((m) => !keys.includes(m.key)) ? "\n- Gray: other models" : ""}` : activity.loading ? "Importing local history…" : "No supported token records found in this period. Try a longer date range."}\n\n### Coverage\n\n${coverage}\n\n${activity.data ? `${activity.data.files} files checked · Updated ${new Date(activity.data.updatedAt).toLocaleTimeString()}` : ""}${issues.length ? `\n\n### Import notes\n\n${issues.map((s) => `- ${markdownEscape(s)}`).join("\n")}` : ""}`}
            />
          }
        />
      </List.Section>
      <List.Section title="Models" subtitle="Local token totals">
        {summary.models.map((row) => {
          const selected = (activity.data?.events ?? []).filter(
            (e) => `${e.provider}/${e.model}` === row.key,
          );
          const modelSummary = aggregate(selected, Number(days), now);
          const reported =
            quota.usages
              .find(
                (u) =>
                  u.provider === row.provider &&
                  u.connectionStatus === "ready" &&
                  u.freshness === "fresh" &&
                  !!u.observedAt &&
                  now - Date.parse(u.observedAt) <= 300_000,
              )
              ?.quotaWindows.filter(
                (w) =>
                  w.scope === "model" &&
                  w.model === row.model &&
                  !!w.resetsAt &&
                  Date.parse(w.resetsAt) > now,
              ) ?? [];
          return (
            <List.Item
              key={row.key}
              id={row.key}
              title={row.model}
              icon={{
                source: Icon.CircleFilled,
                tintColor:
                  colors[
                    keys.indexOf(row.key) >= 0 ? keys.indexOf(row.key) : 6
                  ],
              }}
              accessories={[
                {
                  text: compact(row.input + row.output),
                  tooltip: `${row.provider} · ${summary.total ? Math.round(((row.input + row.output) / summary.total) * 100) : 0}% of recorded tokens`,
                },
              ]}
              actions={actions}
              detail={
                <List.Item.Detail
                  markdown={`# ${markdownEscape(row.model)}\n\n${row.provider} · ${summary.total ? Math.round(((row.input + row.output) / summary.total) * 100) : 0}% of recorded tokens\n\n${chartMarkdown(activityChart(modelSummary, dark, keys), "Daily model token activity")}\n\n| Token category | Tokens |\n| --- | ---: |\n| Fresh input | ${(row.input - row.cached - row.cacheWrite).toLocaleString()} |\n| Cached input read | ${row.cached.toLocaleString()} |\n| Cache write | ${row.cacheWrite.toLocaleString()} |\n| Output (includes reasoning) | ${row.output.toLocaleString()} |\n| **Total** | **${(row.input + row.output).toLocaleString()}** |\n\n### Subscription quota\n\n${reported.length ? reported.map((w) => `${markdownEscape(w.label)}: ${w.usedPercent === null ? "Unknown" : `${w.usedPercent}% used`} (provider-reported; current account, separate from local activity).`).join("\n\n") : "No current matching model-specific quota reported. Shared account quota cannot be attributed to this model."}\n\nToken volume reflects your workload, not model efficiency. Quota consumption comparisons need attributable observations.\n\n${coverage}`}
                />
              }
            />
          );
        })}
      </List.Section>
      <List.Section title="Quota Forecasts" subtitle="Recent pace">
        {quota.usages.flatMap((usage) =>
          usage.quotaWindows.map((window) => {
            const points = quota.history[usage.provider] ?? [];
            const result = forecast(window, points, now),
              f = result.value;
            return (
              <List.Item
                key={`${usage.provider}:${window.id}`}
                id={`forecast:${usage.provider}:${window.id}`}
                title={`${usage.account.label} · ${shortQuotaLabel(window)}`}
                icon={Icon.Clock}
                accessories={[
                  {
                    text: f
                      ? f.exhaustion !== null && f.exhaustion < f.reset
                        ? "Limit before reset"
                        : `${Math.round(f.headroom)}% at reset`
                      : usage.connectionStatus !== "ready" ||
                          !window.resetsAt ||
                          Date.parse(window.resetsAt) <= now
                        ? "Unavailable"
                        : "Collecting",
                  },
                ]}
                actions={actions}
                detail={
                  <List.Item.Detail
                    markdown={`# ${markdownEscape(shortQuotaLabel(window))}\n\n${forecastText(result)}\n\n${
                      f
                        ? chartMarkdown(
                            quotaChart(
                              points.filter(
                                (p) =>
                                  p.windowId === window.id &&
                                  p.resetsAt === window.resetsAt,
                              ),
                              f,
                              dark,
                            ),
                            "Quota history and forecast",
                          )
                        : ""
                    }\n\n${window.resetsAt ? `Reset: ${new Date(window.resetsAt).toLocaleString()}` : "Reset not reported"}\n\n${f ? `${f.samples} readings over ${Math.round((f.observedAt - f.from) / 60000)} minutes. ` : ""}Forecast uses observed quota consumption, not token totals. Changes in workload or model choice can change the result.\n\n${usage.provider === "claude" ? "Claude readings describe the snapshot source; current account identity cannot be verified. " : ""}Readings accumulate when quotas refresh. The enabled menu bar checks every five minutes; use manual refresh when it is hidden.\n\n${quota.historyError ?? ""}`}
                  />
                }
              />
            );
          }),
        )}
        {!quota.usages.some((u) => u.quotaWindows.length) ? (
          <List.Item
            title="No Quota Forecast Available"
            icon={Icon.Info}
            actions={actions}
            detail={
              <List.Item.Detail markdown="## Connect a quota source\n\nForecasts need current quota readings. Open Show AI Usage to connect a supported provider. Historical token activity is available independently." />
            }
          />
        ) : null}
      </List.Section>
    </List>
  );
}
