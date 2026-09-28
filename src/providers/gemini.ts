import { baseUsage } from "../lib/normalize";
export function geminiUnavailable() {
  return {
    ...baseUsage("gemini"),
    connectionStatus: "unsupported" as const,
    error: {
      code: "interface_pending",
      message:
        "Gemini CLI integration is under investigation. A supported external account-quota interface has not been verified. Session token counts are not account quota.",
      retryAt: null,
    },
  };
}
