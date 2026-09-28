import { aggregate } from "./activity";
import type { Forecast, QuotaObservation } from "./forecast";
export const colors = [
  "#668CFF",
  "#BD89F5",
  "#45B9A6",
  "#F1AF54",
  "#E8789B",
  "#76B4D5",
  "#949BA8",
];
const esc = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[c]!,
  );
export const compact = (value: number) =>
  Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
function frame(content: string, dark: boolean, height = 310) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="760" height="${height}" viewBox="0 0 760 ${height}"><rect width="760" height="${height}" rx="14" fill="${dark ? "#202228" : "#F6F7FA"}"/><g font-family="Helvetica,Arial,sans-serif" font-size="12" fill="${dark ? "#D8DBE4" : "#404652"}">${content}</g></svg>`;
}
export function activityChart(
  summary: ReturnType<typeof aggregate>,
  dark: boolean,
  modelKeys = summary.models.slice(0, 6).map((m) => m.key),
) {
  const max = Math.max(1, ...summary.daily.map((d) => d.total)),
    width = 660 / summary.daily.length;
  const grid = [0, 0.5, 1]
    .map(
      (f) =>
        `<line x1="62" y1="${230 - f * 180}" x2="724" y2="${230 - f * 180}" stroke="${dark ? "#383D49" : "#DCE0E7"}"/><text x="52" y="${234 - f * 180}" text-anchor="end">${compact(max * f)}</text>`,
    )
    .join("");
  const bars = summary.daily
    .map((d, i) => {
      let y = 230;
      return [...modelKeys, "Other"]
        .map((key, k) => {
          const value =
            key === "Other"
              ? Object.entries(d.models)
                  .filter(([m]) => !modelKeys.includes(m))
                  .reduce((s, [, v]) => s + v, 0)
              : (d.models[key] ?? 0);
          const h = (value / max) * 180;
          y -= h;
          return `<rect x="${(64 + i * width).toFixed(2)}" y="${y.toFixed(2)}" width="${Math.max(1, width - 2).toFixed(2)}" height="${h.toFixed(2)}" fill="${colors[k % colors.length]}"/>`;
        })
        .join("");
    })
    .join("");
  const labels = [
    0,
    Math.floor((summary.daily.length - 1) / 2),
    summary.daily.length - 1,
  ]
    .map(
      (i) =>
        `<text x="${64 + i * width + width / 2}" y="254" text-anchor="middle">${esc(summary.daily[i].day.slice(5))}</text>`,
    )
    .join("");
  return frame(
    `<text x="24" y="28" font-size="15" font-weight="bold">Daily tokens · ${summary.daily.length} days</text>${grid}${bars}${labels}<text x="24" y="287">Blank days: no local records · Input includes cache reads/writes</text>`,
    dark,
  );
}
export function quotaChart(
  points: QuotaObservation[],
  f: Forecast,
  dark: boolean,
) {
  const from = f.from,
    end = f.reset,
    span = Math.max(1, end - from);
  const x = (time: number) =>
    64 + Math.min(1, Math.max(0, (time - from) / span)) * 650;
  const y = (used: number) => 220 - Math.max(0, Math.min(100, used)) * 1.6;
  const path = points
    .filter((p) => p.time >= from && p.time <= f.observedAt)
    .sort((a, b) => a.time - b.time)
    .map((p) => `${x(p.time).toFixed(1)},${y(p.used).toFixed(1)}`)
    .join(" ");
  const limit = Math.min(f.exhaustion ?? end, end),
    used = 100 - f.remaining;
  const projected = Math.min(
    100,
    used + (f.rate * (limit - f.observedAt)) / 3600_000,
  );
  return frame(
    `<text x="24" y="28" font-size="15" font-weight="bold">Quota consumed · recent pace projection</text><line x1="64" y1="60" x2="714" y2="60" stroke="#E8789B" stroke-dasharray="4 4"/><text x="20" y="64">100%</text><text x="30" y="224">0%</text><polyline fill="none" stroke="${colors[0]}" stroke-width="3" points="${path}"/><line x1="${x(f.observedAt)}" y1="${y(used)}" x2="${x(limit)}" y2="${y(projected)}" stroke="${colors[3]}" stroke-width="3" stroke-dasharray="6 5"/><line x1="714" y1="45" x2="714" y2="228" stroke="${colors[2]}"/><text x="710" y="250" text-anchor="end">Reset ${esc(new Date(end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))}</text><text x="64" y="250">${esc(new Date(from).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))}</text><text x="24" y="286">Blue: observed · Dashed: estimate · Green: reset</text>`,
    dark,
  );
}
export function chartMarkdown(svg: string, alt: string) {
  return `![${alt}](data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")})`;
}
