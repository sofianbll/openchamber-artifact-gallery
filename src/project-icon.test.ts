import { test, expect } from 'bun:test';
import { ICON_BYTES, readProjectIcon } from './project-icon';
import { ProjectIcons, ICON_CACHE_BYTES, ICON_CACHE_ENTRIES } from './project-icons';

const origin = 'http://127.0.0.1:1234';
test('project icon uses a bounded, credential-free local request and encoded project/theme', async () => {
  let calls = 0;
  const fetcher = (async (url, options) => {
    calls++; expect(String(url)).toBe(origin + '/api/projects/p%2F%3F/icon?theme=light');
    expect(options?.redirect).toBe('error'); expect(options?.credentials).toBe('omit'); expect(options?.signal).toBeInstanceOf(AbortSignal);
    return new Response('image', { headers: { 'content-type': 'image/png; charset=binary' } });
  }) as typeof fetch;
  expect(await readProjectIcon(origin, 'p/?', 'light', fetcher)).toEqual({ mime: 'image/png', data: btoa('image') });
  for (const invalid of ['https://example.com', 'http://localhost.evil', origin + '/path', 'http://user@localhost', 'http://localhost#evil', origin + '\n', 'http://localhost:99999']) expect(await readProjectIcon(invalid, 'p', 'dark', fetcher)).toBeNull();
  expect(await readProjectIcon(origin, '..', 'dark', fetcher)).toBeNull();
  expect(await readProjectIcon(origin, 'p', 'invalid', fetcher)).toBeNull(); expect(calls).toBe(1);
});

test('project icon falls back on auth/missing/redirect/MIME/size and timeout failures', async () => {
  for (const response of [
    ...[401, 403, 404, 302, 500].map(status => new Response(null, { status })),
    new Response('html', { headers: { 'content-type': 'text/html' } }),
    new Response('gif', { headers: { 'content-type': 'image/gif' } }),
    new Response('png', { headers: { 'content-type': 'image/png', 'content-length': String(ICON_BYTES + 1) } }),
    new Response(new Uint8Array(ICON_BYTES + 1), { headers: { 'content-type': 'image/webp' } }),
  ]) expect(await readProjectIcon(origin, 'p', 'dark', (async () => response) as typeof fetch)).toBeNull();
  const server = Bun.serve({ hostname: '127.0.0.1', port: 0, fetch: () => new Promise(resolve => setTimeout(() => resolve(new Response('late')), 4000)) });
  try { const start = Date.now(); expect(await readProjectIcon(server.url.origin, 'p', 'dark')).toBeNull(); expect(Date.now() - start).toBeLessThan(3500); }
  finally { server.stop(true); }
}, 6000);

test('real redirects are rejected without following their target', async () => {
  let followed = false;
  const server = Bun.serve({ hostname: '127.0.0.1', port: 0, fetch(req) {
    if (new URL(req.url).pathname === '/target') { followed = true; return new Response('secret', { headers: { 'content-type': 'image/png' } }); }
    return new Response(null, { status: 302, headers: { location: '/target' } });
  } });
  try { expect(await readProjectIcon(server.url.origin, 'p', 'dark')).toBeNull(); expect(followed).toBe(false); }
  finally { server.stop(true); }
});

const tick = () => new Promise(resolve => setTimeout(resolve, 0));
test('old response stays rejected after disabling and re-enabling the same context', async () => {
  const resolvers: ((value: any) => void)[] = [];
  const cache = new ProjectIcons(() => new Promise(resolve => resolvers.push(resolve)));
  const node = () => ({ isConnected: false, dataset: { initial: 'P' }, replaceChildren() {} }) as unknown as HTMLElement;
  const image = (data: string) => ({ mime: 'image/png', data: btoa(data) });
  try {
    cache.configure(true, origin, 'dark'); cache.attach(node(), 'p');
    cache.configure(false, origin, 'dark'); cache.configure(true, origin, 'dark'); cache.attach(node(), 'p');
    expect(resolvers).toHaveLength(2);
    resolvers[0](image('stale')); await tick();
    expect((cache as any).bytes).toBe(0);
    expect((cache as any).entries.values().next().value.url).toBeUndefined();
    resolvers[1](image('current')); await tick();
    expect((cache as any).bytes).toBe(7);
    const currentURL = (cache as any).entries.values().next().value.url;
    expect(currentURL).toStartWith('blob:');
    cache.attach(node(), 'p'); expect(resolvers).toHaveLength(2);
  } finally { cache.clear(); }
});

test('memory cache deduplicates, bounds requests, rejects late results and switches origin/theme', async () => {
  const paths: string[] = [], resolvers: ((value: any) => void)[] = [];
  const cache = new ProjectIcons(path => { paths.push(path); return new Promise(resolve => resolvers.push(resolve)); });
  const node = () => ({ isConnected: false, dataset: { initial: 'P' }, replaceChildren() {} }) as unknown as HTMLElement;
  cache.configure(false, origin, 'dark'); cache.attach(node(), 'p'); expect(paths).toHaveLength(0);
  cache.configure(true, origin, 'dark'); cache.attach(node(), 'p'); cache.attach(node(), 'p'); cache.attach(node(), 'q'); cache.attach(node(), 'r'); expect(paths).toHaveLength(2);
  cache.configure(false, origin, 'dark'); for (const resolve of resolvers.splice(0)) resolve({ mime: 'image/png', data: btoa('old') }); await tick();
  expect((cache as any).bytes).toBe(0); expect(paths).toHaveLength(2);
  cache.configure(true, origin, 'light'); cache.attach(node(), 'p'); expect(paths.at(-1)).toContain('theme=light');
  resolvers.shift()!({ mime: 'image/png', data: btoa('image') }); await tick();
  expect((cache as any).bytes).toBe(5); cache.attach(node(), 'p'); expect(paths).toHaveLength(3);
  cache.configure(true, 'http://localhost:4567', 'light'); expect((cache as any).bytes).toBe(0);
  for (let i = 0; i < ICON_CACHE_ENTRIES + 10; i++) cache.attach(node(), String(i));
  expect((cache as any).entries.size).toBe(ICON_CACHE_ENTRIES); expect(paths).toHaveLength(5);
  cache.clear(); for (const resolve of resolvers) resolve(null); await tick();
});

test('memory byte eviction removes images before URL revocation and keeps negative entries', async () => {
  const revoked = URL.revokeObjectURL, events: string[] = [];
  URL.revokeObjectURL = url => { events.push('revoke'); revoked(url); };
  const cache = new ProjectIcons(async () => ({ mime: 'image/png', data: Buffer.alloc(ICON_BYTES).toString('base64') }));
  const nodes = Array.from({ length: 4 }, () => ({ isConnected: false, dataset: { initial: 'P' }, replaceChildren() { events.push('fallback'); } }) as unknown as HTMLElement);
  try {
    cache.configure(true, origin, 'dark');
    for (let i = 0; i < nodes.length; i++) { cache.attach(nodes[i], String(i)); await tick(); }
    expect((cache as any).bytes).toBeLessThanOrEqual(ICON_CACHE_BYTES); expect(events.slice(0, 2)).toEqual(['fallback', 'revoke']);
    expect((cache as any).entries.size).toBe(4); expect((cache as any).entries.values().next().value.url).toBeUndefined();
  } finally { cache.clear(); URL.revokeObjectURL = revoked; }
});
