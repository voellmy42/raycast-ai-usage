import assert from "node:assert/strict";
import test from "node:test";
import { resolveMenuVisibility } from "../src/lib/menu-visibility";

test("hidden persists across scheduled and repeated launches", () => {
  for (let launch = 0; launch < 3; launch++) {
    assert.equal(resolveMenuVisibility(false), false);
  }
});
test("only an explicit visibility choice overrides the saved choice", () => {
  assert.equal(resolveMenuVisibility(false, true), true);
  assert.equal(resolveMenuVisibility(true, false), false);
  assert.equal(resolveMenuVisibility(false, undefined), false);
});
test("missing or invalid saved values default to visible", () => {
  for (const value of [undefined, null, "false", 0, {}]) {
    assert.equal(resolveMenuVisibility(value), true);
  }
});
