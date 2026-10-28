// Smoke-test the actual distribution with Node and an isolated, empty home.
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { parseManifestJson } from '@openchamber/sdk/schemas';

assert(process.argv[2], 'Usage: bun test/package.ts /absolute/path/to/package');
const folder = resolve(process.argv[2]), manifest = JSON.parse(await readFile(join(folder, 'package.json'), 'utf8'));
assert(parseManifestJson(JSON.stringify(manifest)).ok);
assert(!manifest.dependencies && !manifest.devDependencies);
const files = await readdir(folder, { recursive: true });
assert(!files.some(file => /node_modules|\.env|index-v1|auth\.json|\/Users\//.test(file)));
for (const file of files.filter(file => /^(README\.md|docs\/.*\.md)$/.test(file))) {
  const text = await readFile(join(folder, file), 'utf8');
  for (const [, link] of text.matchAll(/\]\(([^)\s]+)\)/g)) {
    if (/^(https?:|#)/.test(link)) continue;
    const target = resolve(folder, file, '..', link.split('#')[0]);
    assert(await Bun.file(target).exists(), `Missing packaged documentation link: ${file} → ${link}`);
  }
}
const digest = createHash('sha256').update(await readFile(folder + '.tar.gz')).digest('hex');
assert.equal((await readFile(folder + '.tar.gz.sha256', 'utf8')).split(' ')[0], digest);
const tar = Bun.spawn(['tar', '-tzf', folder + '.tar.gz'], { stdout: 'pipe', stderr: 'inherit' });
const entries = (await new Response(tar.stdout).text()).trim().split('\n');
assert.equal(await tar.exited, 0);
assert(!entries.some(entry => /(^|\/)(\._|__MACOSX)/.test(entry)), 'Archive must not contain macOS metadata');
const home = await mkdtemp(join(tmpdir(), 'gallery-package-'));
const socket = createServer(); await new Promise<void>(resolve => socket.listen(0, '127.0.0.1', resolve));
const port = (socket.address() as { port: number }).port; await new Promise<void>(resolve => socket.close(() => resolve()));
const token = randomUUID(), origin = `http://127.0.0.1:${port}`;
const proc = Bun.spawn(['node', join(folder, 'service/main.js')], { cwd: folder, env: { PATH: process.env.PATH, HOME: home, XDG_DATA_HOME: join(home, 'data'), XDG_CONFIG_HOME: join(home, 'config'), OPENCHAMBER_SERVICE_PORT: String(port), OPENCHAMBER_SERVICE_TOKEN: token }, stdout: 'pipe', stderr: 'pipe' });
try {
  let started = false;
  for (let i = 0; i < 100; i++) {
    try { const response = await fetch(origin + '/health'); assert.equal(response.status, 401); started = true; break; }
    catch { await new Promise(resolve => setTimeout(resolve, 25)); }
  }
  assert(started, 'Packaged Node service must start in an empty home');
  const request = (path: string, init: RequestInit = {}) => fetch(origin + path, { ...init, headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' } });
  assert.deepEqual(await (await request('/health')).json(), { ok: true });
  const index = await (await request('/index')).json(); assert.equal(index.total, 0); assert.equal(index.status.running, false);
  assert.equal((await request('/index?size=100000')).status, 400);
  assert.equal((await request('/sync', { method: 'POST', body: '{}' })).status, 400);
  assert.equal((await request('/item?id=invalid')).status, 404);
  assert.equal((await request('/preview?id=' + '0'.repeat(64))).status, 404);
  console.log('Package passed: manifest, allowlist, checksum, standalone Node startup, authentication and route validation.');
} finally { proc.kill(); await proc.exited; await rm(home, { recursive: true, force: true }); }
