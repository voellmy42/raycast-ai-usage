import { createReadStream } from "node:fs";

/** Backpressure-aware lines. Oversized records yield null without retaining their bodies. */
export async function* boundedLines(
  path: string,
  size: number,
  maxLength = 2_000_000,
): AsyncGenerator<string | null> {
  if (size === 0) return;
  const stream = createReadStream(path, {
    encoding: "utf8",
    highWaterMark: 64 * 1024,
    end: size - 1,
  });
  let parts: string[] = [],
    length = 0,
    dropping = false;
  try {
    for await (const chunk of stream) {
      const text = chunk as string;
      let from = 0;
      while (from < text.length) {
        const newline = text.indexOf("\n", from);
        const end = newline === -1 ? text.length : newline;
        const part = text.slice(from, end);
        if (!dropping) {
          length += part.length;
          if (length > maxLength) {
            dropping = true;
            parts = [];
          } else parts.push(part);
        }
        if (newline === -1) break;
        yield dropping ? null : parts.join("").replace(/\r$/, "");
        parts = [];
        length = 0;
        dropping = false;
        from = newline + 1;
      }
    }
    if (dropping) yield null;
    else if (length) yield parts.join("");
  } finally {
    stream.destroy();
  }
}
