import {
  Action,
  ActionPanel,
  Icon,
  Keyboard,
  environment,
  getPreferenceValues,
  openExtensionPreferences,
} from "@raycast/api";
import type { Usage, Preferences } from "../lib/types";
import { claudeCaptureCommand } from "../lib/claude-setup";
import type { MenuVisibilityControl } from "../hooks/use-menu-visibility";

export const usagePages = {
  codex: "https://chatgpt.com/codex/settings/usage",
  claude: "https://claude.ai/settings/usage",
  gemini: "https://geminicli.com/docs/resources/quota-and-pricing/",
};
export function UsageActions({
  usage,
  refresh,
  visibility,
}: {
  usage: Usage;
  refresh: () => void;
  visibility: MenuVisibilityControl;
}) {
  return (
    <ActionPanel>
      <Action
        title={visibility.visible ? "Hide Menu Bar" : "Show Menu Bar"}
        icon={visibility.visible ? Icon.EyeDisabled : Icon.Eye}
        shortcut={{ modifiers: ["cmd", "shift"], key: "m" }}
        onAction={() => visibility.change(!visibility.visible, true)}
      />
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
    </ActionPanel>
  );
}
