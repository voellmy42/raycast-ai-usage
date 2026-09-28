import {
  Action,
  ActionPanel,
  Detail,
  Icon,
  Keyboard,
  environment,
  getPreferenceValues,
  openExtensionPreferences,
} from "@raycast/api";
import {
  markdownEscape,
  observationText,
  percent,
  quotaSummary,
  resetText,
} from "../lib/format";
import type { Usage } from "../lib/types";
import { useUsage } from "../hooks/use-usage";
import { claudeCaptureCommand } from "../lib/claude-setup";
import type { Preferences } from "../lib/types";

export const usagePages = {
  codex: "https://chatgpt.com/codex/settings/usage",
  claude: "https://claude.ai/settings/usage",
  gemini: "https://geminicli.com/docs/resources/quota-and-pricing/",
};
export function UsageActions({
  usage,
  refresh,
}: {
  usage: Usage;
  refresh: () => void;
}) {
  return (
    <ActionPanel.Section>
      <Action
        title="Refresh Usage"
        icon={Icon.ArrowClockwise}
        onAction={refresh}
        shortcut={Keyboard.Shortcut.Common.Refresh}
      />
      <Action.OpenInBrowser
        title="Open Provider Usage"
        url={usagePages[usage.provider]}
      />
      {usage.provider === "claude" ? (
        <Action.CopyToClipboard
          title="Copy Claude Capture Command"
          content={claudeCaptureCommand(
            environment.assetsPath,
            getPreferenceValues<Preferences>().claudeSnapshot,
          )}
        />
      ) : null}
      <Action
        title="Open Extension Preferences"
        icon={Icon.Gear}
        onAction={openExtensionPreferences}
      />
    </ActionPanel.Section>
  );
}
export function UsageDetails({ usage: initial }: { usage: Usage }) {
  const { usages, loading, refresh } = useUsage(initial);
  const usage =
    usages.find((item) => item.provider === initial.provider) ?? initial;
  const heading = `# ${markdownEscape(usage.account.label)}${usage.account.plan ? ` · ${markdownEscape(usage.account.plan)}` : ""}`;
  const text = usage.quotaWindows
    .map(
      (window) =>
        `## ${markdownEscape(window.label)}\n\n**${quotaSummary(window)}** · ${percent(window.usedPercent)} used\n\n${resetText(window)}${window.resetsAt ? `\n\n${new Date(window.resetsAt).toLocaleString()}` : ""}`,
    )
    .join("\n\n---\n\n");
  const source =
    usage.source === "claude_statusline_snapshot"
      ? "Last observed Claude Code session. Refresh reads the saved snapshot; it does not poll your Claude account."
      : usage.source === "codex_app_server"
        ? "Account quota reported by Codex."
        : "";
  return (
    <Detail
      isLoading={loading}
      markdown={`${heading}\n\n${usage.error ? markdownEscape(usage.error.message) + "\n\n" : ""}${text || "Usage data is unavailable."}\n\n---\n\n${observationText(usage)}\n\n${source}`}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label
            title="Connection"
            text={usage.connectionStatus.replaceAll("_", " ")}
          />
          <Detail.Metadata.Label title="Freshness" text={usage.freshness} />
          <Detail.Metadata.Label title="Billing" text={usage.billingMode} />
          <Detail.Metadata.Label
            title="Observed"
            text={
              usage.observedAt
                ? new Date(usage.observedAt).toLocaleString()
                : "Unavailable"
            }
          />
        </Detail.Metadata>
      }
      actions={
        <ActionPanel>
          <UsageActions usage={usage} refresh={() => void refresh(true)} />
        </ActionPanel>
      }
    />
  );
}
