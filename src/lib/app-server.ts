import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export class ConnectionError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
type Pending = {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timer: NodeJS.Timeout;
};
export class AppServer {
  private pending = new Map<number, Pending>();
  private id = 0;
  private buffer = "";
  private failed: Error | null = null;
  private bytes = 0;
  constructor(
    private child: ChildProcessWithoutNullStreams,
    private timeoutMs = 10_000,
  ) {
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      if (this.failed) return;
      this.bytes += Buffer.byteLength(chunk);
      if (this.bytes > 2_000_000)
        return this.fail(
          new ConnectionError(
            "output_limit",
            "Codex sent an unexpectedly large response.",
          ),
        );
      this.buffer += chunk;
      let newline: number;
      while ((newline = this.buffer.indexOf("\n")) >= 0) {
        const line = this.buffer.slice(0, newline);
        this.buffer = this.buffer.slice(newline + 1);
        if (!line.trim()) continue;
        let message: {
          id?: number;
          method?: string;
          error?: { code?: number };
          result?: unknown;
        };
        try {
          message = JSON.parse(line);
        } catch {
          this.fail(
            new ConnectionError(
              "invalid_protocol",
              "Codex returned an invalid protocol response.",
            ),
          );
          return;
        }
        if (!message || typeof message !== "object" || Array.isArray(message)) {
          this.fail(
            new ConnectionError(
              "invalid_protocol",
              "Codex returned an invalid protocol response.",
            ),
          );
          return;
        }
        if (message.method && message.id !== undefined) {
          this.send({
            id: message.id,
            error: {
              code: -32601,
              message: "Usage viewer does not support server requests.",
            },
          });
          continue;
        }
        if (message.id === undefined) continue;
        const request = this.pending.get(message.id);
        if (!request) continue;
        this.pending.delete(message.id);
        clearTimeout(request.timer);
        if (message.error)
          request.reject(
            new ConnectionError(
              "rpc_error",
              "Codex could not read account usage. Check your login and try again.",
            ),
          );
        else request.resolve(message.result);
      }
    });
    child.stderr.on("data", () => {
      /* Provider diagnostics may contain account data. */
    });
    child.on("error", () =>
      this.fail(
        new ConnectionError(
          "launch_failed",
          "Could not start Codex. Choose a working executable in preferences.",
        ),
      ),
    );
    child.on("close", () =>
      this.fail(
        new ConnectionError(
          "process_closed",
          "Codex exited before completing the request.",
        ),
      ),
    );
    child.stdin.on("error", () =>
      this.fail(
        new ConnectionError("process_closed", "Codex connection closed."),
      ),
    );
  }
  private fail(error: Error) {
    if (this.failed) return;
    this.failed = error;
    for (const request of this.pending.values()) {
      clearTimeout(request.timer);
      request.reject(error);
    }
    this.pending.clear();
    this.close();
  }
  send(message: unknown) {
    if (this.failed) throw this.failed;
    this.child.stdin.write(JSON.stringify(message) + "\n");
  }
  request(method: string, params: unknown = {}): Promise<unknown> {
    if (this.failed) return Promise.reject(this.failed);
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(
        () =>
          this.fail(
            new ConnectionError(
              "timeout",
              "Codex usage request timed out. Try refreshing again.",
            ),
          ),
        this.timeoutMs,
      );
      this.pending.set(id, { resolve, reject, timer });
      try {
        this.send({ id, method, params });
      } catch (error) {
        this.fail(error as Error);
      }
    });
  }
  close() {
    if (this.child.exitCode !== null || this.child.signalCode !== null) return;
    this.child.kill("SIGTERM");
    const kill = setTimeout(() => {
      if (this.child.exitCode === null && this.child.signalCode === null)
        this.child.kill("SIGKILL");
    }, 500);
    kill.unref();
  }
}
export async function withAppServer<T>(
  command: string,
  args: string[],
  read: (server: AppServer) => Promise<T>,
): Promise<T> {
  const cwd = await mkdtemp(join(tmpdir(), "raycast-ai-usage-"));
  const child = spawn(command, args, { cwd, stdio: ["pipe", "pipe", "pipe"] });
  const server = new AppServer(child);
  try {
    await server.request("initialize", {
      clientInfo: {
        name: "raycast_ai_usage",
        title: "Raycast AI Usage",
        version: "0.1.0",
      },
    });
    server.send({ method: "initialized", params: {} });
    return await read(server);
  } finally {
    server.close();
    await rm(cwd, { recursive: true, force: true });
  }
}
