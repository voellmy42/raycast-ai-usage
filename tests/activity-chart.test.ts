import { test } from "node:test";
import assert from "node:assert/strict";
import { activityChart, chartMarkdown } from "../src/lib/activity-chart";
import { aggregate } from "../src/lib/activity";
test("empty charts remain finite in both themes and cover the requested dates", () => {
  for (const days of [7, 30, 90])
    for (const dark of [true, false]) {
      const chart = activityChart(aggregate([], days), dark);
      assert.ok(!chart.includes("NaN"));
      assert.ok(!chart.includes("Infinity"));
      assert.ok(chart.includes(`${days} days`));
      assert.ok(
        chartMarkdown(chart, "chart").startsWith(
          "![chart](data:image/svg+xml;base64,",
        ),
      );
    }
});
