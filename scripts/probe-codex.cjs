const { spawn } = require('node:child_process');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { createInterface } = require('node:readline');

const cwd = mkdtempSync(join(tmpdir(), 'raycast-ai-usage-'));
const executable = process.argv[2] || '/Applications/ChatGPT.app/Contents/Resources/codex-cli/bin/codex';
const child = spawn(executable, ['app-server'], { cwd, stdio: ['pipe', 'pipe', 'pipe'] });
const pending = new Map();
let nextId = 1;
const send = (message) => child.stdin.write(JSON.stringify(message) + '\n');
const request = (method, params) => new Promise((resolve, reject) => {
  const id = nextId++;
  pending.set(id, { resolve, reject });
  send({ id, method, params });
});
const timer = setTimeout(() => { console.error('Codex account probe timed out.'); child.kill(); process.exitCode = 1; }, 20000);
child.stderr.on('data', () => {});
child.on('error', () => { console.error('Could not start Codex executable.'); process.exitCode = 1; });
child.on('close', () => {
  clearTimeout(timer);
  for (const entry of pending.values()) entry.reject(new Error('Codex closed.'));
  rmSync(cwd, { recursive: true, force: true });
});
createInterface({ input: child.stdout }).on('line', (line) => {
  try {
    const message = JSON.parse(line);
    const entry = pending.get(message.id);
    if (!entry) return;
    pending.delete(message.id);
    if (message.error) entry.reject(new Error('Codex account request failed.'));
    else entry.resolve(message.result);
  } catch { /* Non-protocol lines are not printed. */ }
});
(async () => {
  await request('initialize', { clientInfo: { name: 'raycast_ai_usage', title: 'Raycast AI Usage', version: '0.1.0' } });
  send({ method: 'initialized', params: {} });
  const identity = await request('account/read', { refreshToken: false });
  console.log(JSON.stringify({ accountType: identity.account?.type || null, plan: identity.account?.planType || null }));
  const result = await request('account/rateLimits/read', {});
  const buckets = result.rateLimitsByLimitId || { codex: result.rateLimits };
  console.log(JSON.stringify(Object.entries(buckets).map(([id, bucket]) => ({ id, primary: bucket?.primary, secondary: bucket?.secondary })), null, 2));
})().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => { clearTimeout(timer); child.kill(); });
