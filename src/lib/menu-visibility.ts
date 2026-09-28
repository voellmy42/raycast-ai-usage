/** Missing/invalid settings default visible; only explicit choices override saved state. */
export function resolveMenuVisibility(
  stored: unknown,
  explicit?: boolean,
): boolean {
  return typeof explicit === "boolean" ? explicit : stored !== false;
}
export const menuVisibilityKey = "menu-bar-visible-v1";
