import { test, expect } from 'bun:test';
import { boundedSnapshot, CACHE_BYTES, CHUNK_BYTES, chunksFor, jsonBytes, manifestKey, persistCache, readCache, validateSnapshot, withCacheLease, writeCache, type CachedSession } from './cache';

const session = (id: number, count = 1, title = 'é😀"\\'.repeat(100)): CachedSession => ({
  id: `ses_${id}`, title: 'Session', directory: '/project', projectId: null, updated: id,
  artifacts: Array.from({ length: count }, (_, i) => ({ id: i.toString(16).padStart(64, '0'), sessionId: `ses_${id}`, messageId: `msg_${i}`, partId: 'part', position: i, title, kind: 'page', format: 'HTML', origin: 'render.page', createdAt: i, directory: '/project' })),
});
function storage() {
  const values = new Map<string, any>([['preferences', { language: 'fr', padding: 'x'.repeat(60 * 1024) }]]);
  let peak = 0;
  return {
    values, get peak() { return peak; }, failKey: '',
    async get(key: string) { return values.get(key) ?? null; },
    async set(key: string, value: any) {
      if (key === this.failKey) throw Error('Storage unavailable');
      if (jsonBytes(value) > 64 * 1024) throw Error('Value quota');
      const total = [...values].reduce((sum, [k, v]) => sum + jsonBytes(k) + (k === key ? 0 : jsonBytes(v)), jsonBytes(value));
      if (total > 2 * 1024 * 1024 || !values.has(key) && values.size >= 2000) throw Error('Total quota');
      peak = Math.max(peak, total); values.set(key, structuredClone(value));
    },
    async delete(key: string) { values.delete(key); },
    async keys() { return [...values.keys()]; },
  };
}

test('UTF-8 chunks stay below the value limit and round-trip escaped Unicode metadata', async () => {
  const snapshot = boundedSnapshot([session(1, 120)]), chunks = chunksFor(snapshot);
  expect(chunks.length).toBeGreaterThan(1);
  expect(chunks.every(chunk => jsonBytes(chunk) <= CHUNK_BYTES)).toBe(true);
  expect(JSON.parse(chunks.join(''))).toEqual(snapshot);
  const store = storage(); await writeCache(store, snapshot);
  expect(await readCache(store)).toEqual(snapshot);
});

test('oldest sessions are evicted to keep the cache bounded, without changing sources', () => {
  const sessions = Array.from({ length: 10 }, (_, i) => session(i, 100));
  const snapshot = boundedSnapshot(sessions);
  expect(jsonBytes(snapshot)).toBeLessThanOrEqual(CACHE_BYTES);
  expect(snapshot.sessions[0].id).toBe('ses_9');
  expect(snapshot.sessions.length).toBeLessThan(sessions.length);
  expect(snapshot.sessions.some(s => s.id === 'ses_0')).toBe(false);
  expect(sessions[0].artifacts.length).toBe(100);
  expect(boundedSnapshot([session(20, 1000)]).sessions).toEqual([]);
});

test('two generations fit host quota with preferences, and obsolete/abandoned chunks are removed', async () => {
  const store = storage(), preferences = structuredClone(store.values.get('preferences'));
  const snapshot = boundedSnapshot(Array.from({ length: 10 }, (_, i) => session(i, 100)));
  await writeCache(store, snapshot);
  const old = (await store.keys()).filter(key => key !== manifestKey && key !== 'preferences');
  store.values.set('gallery-index:abandoned:0', 'unfinished');
  await writeCache(store, snapshot);
  expect(store.peak).toBeLessThan(2 * 1024 * 1024);
  expect(store.values.size).toBeLessThan(42);
  expect(old.every(key => !store.values.has(key))).toBe(true);
  expect(store.values.has('gallery-index:abandoned:0')).toBe(false);
  expect(store.values.get('preferences')).toEqual(preferences);
  expect(await readCache(store)).toEqual(snapshot);
});

test('failed manifest commit preserves the previous cache and cleans staged chunks', async () => {
  const store = storage(), previous = boundedSnapshot([session(1)]);
  await writeCache(store, previous); const keys = await store.keys();
  store.failKey = manifestKey;
  await expect(writeCache(store, boundedSnapshot([session(2)]))).rejects.toThrow('unavailable');
  expect(await readCache(store)).toEqual(previous);
  expect(await store.keys()).toEqual(keys);
});

test('missing storage and corrupted manifests/chunks fail explicitly, absent cache is empty', async () => {
  const store = storage(); expect(await readCache(store)).toBeNull();
  store.values.set(manifestKey, { version: 1, generation: '../bad', count: 5000, bytes: 1 });
  await expect(readCache(store)).rejects.toThrow('manifest');
  store.values.delete(manifestKey); await writeCache(store, boundedSnapshot([session(1)]));
  store.values.delete((await store.keys()).find(key => key.startsWith('gallery-index:') && key !== manifestKey)!);
  await expect(readCache(store)).rejects.toThrow('Incomplete');
  const unavailable = { ...store, get: async () => { throw Error('Unavailable'); } };
  await expect(readCache(unavailable)).rejects.toThrow('Unavailable');
});

test('a successful manifest write with a lost acknowledgement keeps its committed chunks', async () => {
  const store = storage(), snapshot = boundedSnapshot([session(1)]), set = store.set.bind(store);
  store.set = async (key, value) => { await set(key, value); if (key === manifestKey) throw Error('Lost acknowledgement'); };
  await writeCache(store, snapshot);
  expect(await readCache(store)).toEqual(snapshot);
});

test('A cannot resume its old write after its lease expires and B commits and releases', async () => {
  const store = storage(), previous = boundedSnapshot([session(1)]), next = boundedSnapshot([session(3)]);
  await writeCache(store, previous);
  let owner = '', expires = 0, now = 1;
  const request = async (path: string) => {
    const params = new URL(path, 'http://localhost').searchParams, caller = params.get('owner')!;
    if (params.has('release')) { if (owner === caller) owner = ''; return { acquired: false }; }
    const acquired = params.has('renew') ? owner === caller && expires > now : !owner || expires <= now || owner === caller;
    if (acquired) { owner = caller; expires = now + 60_000; }
    return { acquired };
  };
  const set = store.set.bind(store); let interleaved = false;
  store.set = async (key, value) => {
    await set(key, value);
    if (!interleaved && key !== manifestKey) {
      interleaved = true; now += 60_001;
      await withCacheLease(store, request, () => false, storage => writeCache(storage, next));
    }
  };
  await expect(withCacheLease(store, request, () => false, storage => writeCache(storage, boundedSnapshot([session(2, 120)])))).rejects.toThrow('Cache lease lost');
  expect(interleaved).toBe(true);
  expect(await readCache(store)).toEqual(next);
});

test('failed restoration and sync preserve the last cache until a successful collection, including empty collections', async () => {
  const store = storage(), previous = boundedSnapshot([session(1)]);
  await writeCache(store, previous);
  const get = store.get.bind(store);
  store.get = async () => { throw Error('Storage unavailable'); };
  let restored = false;
  try { await readCache(store); restored = true; } catch {}
  store.get = get;
  const empty = boundedSnapshot([]);
  await expect(persistCache(store, { running: false, collected: false, snapshot: empty }, restored)).rejects.toThrow();
  expect(await readCache(store)).toEqual(previous);
  expect(await persistCache(store, { running: true, collected: false, snapshot: empty }, restored)).toBe(true);
  expect(await readCache(store)).toEqual(previous);
  expect(await persistCache(store, { running: false, collected: true, snapshot: empty }, restored)).toBe(false);
  expect(await readCache(store)).toEqual(empty);
});

test('cache validation rejects malformed metadata and strips unknown source content', () => {
  const snapshot = boundedSnapshot([session(1)]);
  (snapshot.sessions[0].artifacts[0] as any).html = '<h1>Not metadata</h1>';
  expect(JSON.stringify(validateSnapshot(snapshot))).not.toContain('Not metadata');
  snapshot.sessions[0].artifacts[0].sessionId = 'ses_other';
  expect(() => validateSnapshot(snapshot)).toThrow('artifact');
  snapshot.sessions[0].artifacts[0].sessionId = 'ses_1';
  snapshot.sessions[0].artifacts[0].createdAt = 1e100;
  expect(() => validateSnapshot(snapshot)).toThrow('artifact');
});
