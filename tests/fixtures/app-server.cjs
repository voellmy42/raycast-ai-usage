const readline = require("node:readline");
const mode = process.argv[2];
readline.createInterface({ input: process.stdin }).on("line", (line) => {
  const message = JSON.parse(line);
  if (mode === "timeout") return;
  if (mode === "exit") return process.exit(1);
  if (mode === "malformed") return process.stdout.write("not json\n");
  if (mode === "null") return process.stdout.write("null\n");
  if (mode === "huge") return process.stdout.write("x".repeat(2_000_001));
  if (mode === "error")
    return process.stdout.write(
      JSON.stringify({
        id: message.id,
        error: { code: -1, message: "private-token-and-email@example.com" },
      }) + "\n",
    );
  process.stdout.write(
    JSON.stringify({ method: "account/updated", params: {} }) + "\n",
  );
  const response = JSON.stringify({
    id: message.id,
    result: { method: message.method },
  });
  process.stdout.write(response.slice(0, 5));
  setTimeout(() => process.stdout.write(response.slice(5) + "\n"), 5);
});
