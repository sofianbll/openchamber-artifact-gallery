import http from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { Library, GalleryError } from './library';

const port = Number(process.env.OPENCHAMBER_SERVICE_PORT), token = process.env.OPENCHAMBER_SERVICE_TOKEN;
if (!Number.isInteger(port) || port < 1 || !token) throw Error('OpenChamber service environment required.');
const library = new Library();
await library.load();
const reply = (res: http.ServerResponse, status: number, value: unknown) => {
  res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' });
  res.end(JSON.stringify(value));
};
const server = http.createServer(async (req, res) => {
  const actual = Buffer.from(req.headers.authorization ?? ''), expected = Buffer.from(`Bearer ${token}`);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return reply(res, 401, { error: 'Accès refusé.' });
  try {
    const url = new URL(req.url ?? '/', 'http://127.0.0.1');
    if (req.method === 'GET' && url.pathname === '/health') return reply(res, 200, { ok: true });
    if (req.method === 'GET' && url.pathname === '/index') return reply(res, 200, library.index(url.searchParams));
    if (req.method === 'GET' && url.pathname === '/item' && /^[a-f0-9]{64}$/.test(url.searchParams.get('id') ?? '')) return reply(res, 200, library.item(url.searchParams.get('id')!));
    if (req.method === 'POST' && url.pathname === '/sync') {
      const chunks = []; let size = 0;
      for await (const chunk of req) { size += chunk.length; if (size > 64_000) throw new GalleryError(413, 'Requête trop volumineuse.'); chunks.push(chunk); }
      let body;
      try { body = JSON.parse(Buffer.concat(chunks).toString()); } catch { throw new GalleryError(400, 'Requête invalide.'); }
      if (!body || !Array.isArray(body.projects) || body.projects.length > 200 || body.projects.some((p: any) => !p || ['id', 'name', 'directory'].some(k => typeof p[k] !== 'string' || p[k].length > 2048)) || body.sessionId && !/^ses_[a-zA-Z0-9_-]+$/.test(body.sessionId) || body.hostOrigin !== undefined && (typeof body.hostOrigin !== 'string' || !/^https?:\/\/(127\.0\.0\.1|localhost|\[::1\])(:[0-9]+)?$/.test(body.hostOrigin))) throw new GalleryError(400, 'Projets, session ou hôte invalides.');
      await library.sync(body.projects.map(({ id, name, directory }: any) => ({ id, name, directory })), body.sessionId, body.hostOrigin);
      return reply(res, 202, { status: library.status });
    }
    if (req.method === 'GET' && url.pathname === '/preview' && /^[a-f0-9]{64}$/.test(url.searchParams.get('id') ?? '')) return reply(res, 200, await library.preview(url.searchParams.get('id')!));
    if (req.method === 'GET' && url.pathname === '/resource' && /^[a-f0-9-]{36}$/.test(url.searchParams.get('key') ?? '')) return reply(res, 200, library.resource(url.searchParams.get('key')!, Number(url.searchParams.get('offset') ?? 0)));
    reply(res, 404, { error: 'Requête inconnue.' });
  } catch (error) { reply(res, error instanceof GalleryError ? error.status : 500, { error: error instanceof GalleryError ? error.message : 'Lecture impossible. Réessaie depuis la galerie.' }); }
});
server.requestTimeout = 30_000;
server.listen(port, '127.0.0.1');
