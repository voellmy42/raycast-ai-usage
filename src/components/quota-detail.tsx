import { Color, Icon, List } from "@raycast/api";
import { forecast, forecastText, type QuotaObservation } from "../lib/forecast";
import type { QuotaWindow, Usage } from "../lib/types";
import {
  connectionLabel,
  markdownEscape,
  observationText,
  percent,
  quotaPresentation,
  resetText,
  shortQuotaLabel,
} from "../lib/format";

export function quotaColor(
  state: ReturnType<typeof quotaPresentation>["state"],
) {
  return state === "low"
    ? Color.Red
    : state === "approaching"
      ? Color.Orange
      : state === "available"
        ? Color.Green
        : Color.SecondaryText;
}
export function QuotaDetail({
  usage,
  window,
  observations,
}: {
  usage: Usage;
  window?: QuotaWindow;
  observations?: QuotaObservation[];
}) {
  const heading = `## ${markdownEscape(usage.account.label)}${usage.account.plan ? ` · ${markdownEscape(usage.account.plan)}` : ""}`;
  const snapshot = usage.source === "claude_statusline_snapshot";
  const old =
    usage.freshness === "stale" ||
    usage.connectionStatus === "error" ||
    (usage.observedAt !== null &&
      Date.now() - Date.parse(usage.observedAt) > 300_000);
  const capacity = window ? quotaPresentation(window, old) : null;
  const filled =
    capacity?.remaining == null ? 0 : Math.round(capacity.remaining / 10);
  const meter =
    capacity?.remaining == null
      ? ""
      : `\n\n${"▰".repeat(filled)}${"▱".repeat(10 - filled)}`;
  const setup =
    usage.provider === "claude"
      ? "Connect Claude Code's quota snapshot to see its last reported subscription usage.\n\nChoose **Copy Claude Capture Command** from Actions, then follow the extension's README. Requires quota fields from a compatible Claude Code version."
      : usage.provider === "gemini"
        ? "Gemini account quota is not connected yet. This provider needs a verified account reporting interface before usage can appear here."
        : "Sign in to Codex with your ChatGPT account, then refresh. If Codex cannot be found, select its executable in extension preferences.";
  const body =
    window && capacity
      ? `### ${markdownEscape(shortQuotaLabel(window))}\n\n# ${capacity.remaining === null ? "—" : percent(capacity.remaining)}\n\n${capacity.state === "stale" ? "remaining at last observation" : capacity.remaining === null ? capacity.label : "remaining"}${meter}\n\n**${capacity.label}**\n\n${resetText(window)}\n\n${observationText(usage)}${observations ? `\n\n### Forecast\n\n${forecastText(forecast(window, old ? [] : observations))}` : ""}`
      : `### ${connectionLabel(usage)}\n\n${setup}`;
  return (
    <List.Item.Detail
      markdown={`${heading}\n\n${body}${usage.error ? `\n\n---\n\n${markdownEscape(usage.error.message)}` : ""}\n\n${snapshot ? "Snapshot updates during Claude Code activity. Refresh reads the saved snapshot." : usage.source === "codex_app_server" ? "Quota reported by your signed-in Codex account." : ""}`}
      metadata={
        <List.Item.Detail.Metadata>
          {window && capacity ? (
            <>
              <List.Item.Detail.Metadata.Label
                title="Status"
                text={capacity.label}
                icon={{
                  source: Icon.CircleFilled,
                  tintColor: quotaColor(capacity.state),
                }}
              />
              <List.Item.Detail.Metadata.Label
                title="Scope"
                text={
                  window.scope === "model"
                    ? (window.model ?? "Model quota")
                    : window.scope === "organization"
                      ? "Organization"
                      : "Account quota"
                }
              />
              <List.Item.Detail.Metadata.Label
                title="Reset"
                text={
                  window.resetsAt
                    ? new Date(window.resetsAt).toLocaleString()
                    : "Not reported"
                }
              />
            </>
          ) : null}
          <List.Item.Detail.Metadata.Label
            title="Source"
            text={
              snapshot
                ? "Claude Code snapshot"
                : usage.source === "codex_app_server"
                  ? "Codex account"
                  : "Not connected"
            }
          />
        </List.Item.Detail.Metadata>
      }
    />
  );
}
