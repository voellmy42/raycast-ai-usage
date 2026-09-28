import {
  Action,
  ActionPanel,
  LocalStorage,
  showToast,
  Toast,
  Icon,
  Keyboard,
  environment,
  getPreferenceValues,
  openExtensionPreferences,
} from "@raycast/api";
import type { Usage, Preferences, QuotaWindow } from "../lib/types";
import { claudeCaptureCommand } from "../lib/claude-setup";
import type { MenuVisibilityControl } from "../hooks/use-menu-visibility";

import { selectionKey } from "../lib/menu-personalization";

export const usagePages = {
  codex: "https://chatgpt.com/codex/settings/usage",
  claude: "https://claude.ai/settings/usage",
  gemini: "https://geminicli.com/docs/resources/quota-and-pricing/",
};
export function UsageActions({
  usage,
  refresh,
  visibility,
  window,
}: {
  window?: QuotaWindow;
  usage: Usage;
  refresh: () => void;
  visibility: MenuVisibilityControl;
}) {
  async function select(windowId: string | null) {
    if (visibility.loading || visibility.saving) return;
    try {
      await LocalStorage.setItem(
        selectionKey,
        JSON.stringify({ provider: usage.provider, windowId }),
      );
      await visibility.change(true, true);
    } catch {
      await showToast({
        style: Toast.Style.Failure,
        title: "Could Not Save Menu Selection",
      });
    }
  }
  return (
    <ActionPanel>
      <Action
        title={visibility.visible ? "Hide Menu Bar" : "Show Menu Bar"}
        icon={visibility.visible ? Icon.EyeDisabled : Icon.Eye}
        shortcut={{ modifiers: ["cmd", "shift"], key: "m" }}
        onAction={() => visibility.change(!visibility.visible, true)}
      />
      <ActionPanel.Section title="Menu Bar Quota">
        {window ? (
          <Action
            title="Show in Menu Bar"
            icon={Icon.Pin}
            onAction={() => select(window.id)}
          />
        ) : null}
        <Action
          title="Use Provider’s Lowest Remaining Quota"
          icon={Icon.Gauge}
          onAction={() => select(null)}
        />
      </ActionPanel.Section>
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
