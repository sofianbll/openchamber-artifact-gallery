import { test, expect } from 'bun:test';
import { mkdtemp, mkdir, writeFile, readFile, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:net';
import { chunksFor, type Snapshot } from './cache';

test('compiled Node service restores chunked metadata under a shared lease without touching the legacy file', async () => {
  const home = await mkdtemp(join(tmpdir(), 'gallery-storage-'));
  const legacy = join(home, 'data/agent-os/gallery/index-v1.json');
  const snapshot: Snapshot = { version: 1, sessions: Array.from({ length: 70 }, (_, i) => ({ id: `ses_${i}`, title: 'é😀'.repeat(400), directory: '/project', projectId: null, updated: 70 - i, artifacts: [] })) };
  await mkdir(join(legacy, '..'), { recursive: true });
  const original = JSON.stringify(snapshot); await writeFile(legacy, original);
  const socket = createServer(); await new Promise<void>(resolve => socket.listen(0, '127.0.0.1', resolve));
  const port = (socket.address() as { port: number }).port;
  await new Promise<void>(resolve => socket.close(() => resolve()));
  const token = crypto.randomUUID(), origin = `http://127.0.0.1:${port}`;
  const proc = Bun.spawn(['node', join(import.meta.dir, '../service/main.js')], { env: { PATH: process.env.PATH, HOME: home, XDG_DATA_HOME: join(home, 'data'), XDG_CONFIG_HOME: join(home, 'config'), OPENCHAMBER_SERVICE_PORT: String(port), OPENCHAMBER_SERVICE_TOKEN: token }, stdout: 'pipe', stderr: 'pipe' });
  const request = (path: string, body?: unknown) => fetch(origin + path, { method: body === undefined ? 'GET' : 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  try {
    let started = false;
    for (let i = 0; i < 100; i++) {
      try { if ((await request('/health')).ok) { started = true; break; } } catch {}
      await new Promise(resolve => setTimeout(resolve, 25));
    }
    expect(started).toBe(true);
    const initial = await (await request('/cache')).json();
    expect(initial.snapshot.sessions).toEqual([]);
    expect(initial.collected).toBe(false);
    expect((await fetch(origin + '/cache')).status).toBe(401);
    expect((await fetch(origin + '/project-icon?id=unknown')).status).toBe(401);
    expect(await (await request('/project-icon?id=unknown&origin=http%3A%2F%2F127.0.0.1&theme=dark')).json()).toBeNull();
    const owner = crypto.randomUUID(), other = crypto.randomUUID(), lock = '/cache-lock?owner=' + owner;
    expect((await (await request(lock, {})).json()).acquired).toBe(true);
    expect((await (await request(lock + '&renew=1', {})).json()).acquired).toBe(true);
    expect((await (await request('/cache-lock?owner=' + other + '&renew=1', {})).json()).acquired).toBe(false);
    expect((await (await request('/cache-lock?owner=' + other, {})).json()).acquired).toBe(false);
    const oversized = await request('/cache', snapshot);
    expect(oversized.status).toBe(413);
    expect(oversized.headers.get('connection')).toBe('close');
    expect((await oversized.json()).error).toBe('Requête trop volumineuse.');
    expect((await request('/cache', { owner, index: 1, count: 2, data: '{}' })).status).toBe(400);
    const chunks = chunksFor(snapshot); expect(chunks.length).toBeGreaterThan(1);
    for (let index = 0; index < chunks.length; index++) {
      const body = { owner, index, count: chunks.length, data: chunks[index] };
      expect(JSON.stringify(body).length).toBeLessThan(64_000);
      expect((await request('/cache', body)).status).toBe(200);
    }
    expect((await (await request('/cache')).json()).snapshot).toEqual(snapshot);
    await request(lock + '&release=1', {});
    expect((await (await request(lock + '&renew=1', {})).json()).acquired).toBe(false);
    expect((await (await request('/cache-lock?owner=' + other, {})).json()).acquired).toBe(true);
    expect((await request('/cache', { owner, index: 0, count: 1, data: '{}' })).status).toBe(400);
    const oversizedSync = await request('/sync', { projects: [], padding: 'x'.repeat(70_000) });
    expect(oversizedSync.status).toBe(413);
    expect((await oversizedSync.json()).error).toBe('Requête trop volumineuse.');
    expect((await (await request('/health')).json()).ok).toBe(true);
    expect(await readFile(legacy, 'utf8')).toBe(original);
    expect(await readdir(join(home, 'data/agent-os/gallery'))).toEqual(['index-v1.json']);
    const iconCalls: string[] = [];
    const host = Bun.serve({ hostname: '127.0.0.1', port: 0, fetch(req) {
      const path = new URL(req.url).pathname;
      if (path.endsWith('/icon')) { iconCalls.push(path); return new Response('icon', { headers: { 'content-type': 'image/png' } }); }
      if (path === '/api/info') return Response.json({ pid: process.pid, version: '2.2.0' });
      if (path === '/api/project') return Response.json([]);
      if (path === '/api/session') return Response.json({ data: [], cursor: {} });
      return Response.json({ home: home });
    } });
    try {
      const hostOrigin = host.url.origin, project = { id: 'known', name: 'Known', directory: home };
      const registration = join(home, '.local/state/opencode/service.json');
      await mkdir(join(registration, '..'), { recursive: true });
      await writeFile(registration, JSON.stringify({ id: crypto.randomUUID(), pid: process.pid, version: '2.2.0', url: hostOrigin }));
      expect((await request('/sync', { projects: [project], hostOrigin })).status).toBe(202);
      const icon = (id: string, origin: string) => request('/project-icon?' + new URLSearchParams({ id, origin, theme: 'dark' }));
      expect(await (await icon('known', 'http://localhost:1234')).json()).toBeNull();
      expect(await (await icon('unknown', hostOrigin)).json()).toBeNull();
      expect(iconCalls).toEqual([]);
      expect(await (await icon('known', hostOrigin)).json()).toEqual({ mime: 'image/png', data: btoa('icon') });
      expect(iconCalls).toEqual(['/api/projects/known/icon']);
      expect((await request('/sync', { projects: [project] })).status).toBe(202);
      expect(await (await icon('known', hostOrigin)).json()).toBeNull();
      expect(iconCalls).toHaveLength(1);
    } finally { host.stop(true); }
  } finally { proc.kill(); await proc.exited; await rm(home, { recursive: true, force: true }); }
}, 15_000);
