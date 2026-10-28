import {
  Action,
  ActionPanel,
  LocalStorage,
  showToast,
  Toast,
  Icon,
  Keyboard,
  openExtensionPreferences,
  launchCommand,
  LaunchType,
} from "@raycast/api";
import type { Usage, QuotaWindow } from "../lib/types";
import type { MenuVisibilityControl } from "../hooks/use-menu-visibility";

import { selectionKey } from "../lib/menu-personalization";

export const codexUsagePage = "https://chatgpt.com/codex/settings/usage";
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
        title="Refresh Usage"
        icon={Icon.ArrowClockwise}
        onAction={refresh}
        shortcut={Keyboard.Shortcut.Common.Refresh}
      />
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
          title="Use Lowest Remaining Codex Quota"
          icon={Icon.Gauge}
          onAction={() => select(null)}
        />
      </ActionPanel.Section>
      <ActionPanel.Section>
        <Action
          title="Show Activity Graphs"
          icon={Icon.BarChart}
          onAction={() =>
            launchCommand({
              name: "show-ai-activity",
              type: LaunchType.UserInitiated,
            })
          }
        />
        <Action.OpenInBrowser
          title="Open Provider Usage"
          url={codexUsagePage}
        />
        <Action
          title="Open Extension Preferences"
          icon={Icon.Gear}
          onAction={openExtensionPreferences}
        />
      </ActionPanel.Section>
    </ActionPanel>
  );
}
