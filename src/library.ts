import { Service } from '@opencode/client/service';
import { open } from 'node:fs/promises';
import { basename } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { extractArtifacts, pageContent, previousDirectory, imageSources, pathFromSource, type Artifact } from './artifacts';
import { boundedSnapshot, validateSnapshot, type CachedSession } from './cache';

type Session = CachedSession;
type Project = { id: string; name: string; directory: string };
type Space = { id: string; name: string; kind: 'project' | 'chats' | 'unknown' };
export type ReadApi = (path: string) => Promise<any>;
export class GalleryError extends Error { constructor(public status: number, message: string) { super(message); } }

const normalized = (path: string) => path.replace(/\\/g, '/').replace(/\/+$/, '') || '/';
const within = (directory: string | null, root: string) => Boolean(directory && !directory.split(/[\\/]/).some(p => p === '.' || p === '..') && (normalized(directory) === normalized(root) || normalized(directory).startsWith(normalized(root).replace(/\/$/, '') + '/')));

/** Read only the host's declared roots, never guess Chats from an unregistered project. */
export async function readChatRoots(origin: string): Promise<string[]> {
  const url = new URL(origin);
  if (!['http:', 'https:'].includes(url.protocol) || !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) || url.username || url.password || url.origin !== origin) throw new GalleryError(400, 'Adresse locale OpenChamber invalide.');
  const response = await fetch(new URL('/api/fs/home', url), { redirect: 'error', signal: AbortSignal.timeout(3000) });
  if (!response.ok) throw Error('Chats root unavailable');
  const text = await response.text();
  if (text.length > 16_000) throw Error('Invalid home response');
  const info = JSON.parse(text);
  const absolute = (value: unknown): value is string => typeof value === 'string' && value.length <= 4096 && /^(?:\/|[A-Za-z]:[\\/])/.test(value) && !value.split(/[\\/]/).some(p => p === '.' || p === '..');
  if (!absolute(info.home) || ['chatsRoot', 'canonicalChatsRoot', 'canonicalLegacyChatsRoot'].some(key => info[key] !== undefined && !absolute(info[key]))) throw Error('Invalid home response');
  const legacy = normalized(info.home) + '/.config/openchamber/chats';
  return [...new Set([info.chatsRoot ?? legacy, legacy, info.canonicalChatsRoot, info.canonicalLegacyChatsRoot].filter((root): root is string => typeof root === 'string').map(normalized))];
}

export async function localReader(): Promise<ReadApi> {
  const endpoint = await Service.discover();
  if (!endpoint) throw new GalleryError(503, 'Le service local OpenCode est indisponible. Ouvre OpenCode puis réessaie.');
  const url = new URL(endpoint.url);
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) throw new GalleryError(503, 'Cette galerie utilise uniquement le service local OpenCode.');
  return async (path) => {
    const response = await fetch(new URL(path, endpoint.url), { headers: Service.headers(endpoint), signal: AbortSignal.timeout(20_000), redirect: 'error' });
    if (!response.ok) throw new GalleryError(response.status, response.status === 404 ? 'La source a été supprimée ou déplacée.' : `Lecture OpenCode refusée (${response.status}).`);
    return response.json();
  };
}

export async function scanSession(info: any, api: ReadApi): Promise<Session> {
  let directory = info.location?.directory ?? null, cursor: string | undefined;
  const artifacts: Artifact[] = [], cursors = new Set<string>();
  do {
    const query = new URLSearchParams({ limit: '25', ...(cursor ? { cursor } : { order: 'desc' }) });
    const page = await api(`/api/session/${encodeURIComponent(info.id)}/message?${query}`);
    if (!Array.isArray(page.data)) throw new GalleryError(502, 'Réponse OpenCode invalide.');
    for (const message of page.data) {
      directory = previousDirectory(message, directory);
      artifacts.push(...extractArtifacts(message, info.id, directory));
    }
    cursor = page.cursor?.next || undefined;
    if (cursor && cursors.has(cursor)) throw new GalleryError(502, 'Pagination OpenCode répétée.');
    if (cursor) cursors.add(cursor);
  } while (cursor);
  return { id: info.id, title: info.title || info.id, directory: info.location?.directory ?? null, projectId: info.projectID ?? null, updated: info.time?.updated ?? 0, artifacts };
}

export class Library {
  sessions = new Map<string, Session>();
  projects: Project[] = [];
  private roots = new Map<string, string>();
  private chatRoots: string[] | null = null;
  private classifying = false;
  classificationWarning = '';
  status = { running: false, done: 0, total: 0, failed: 0, error: '', refreshedAt: 0 };
  private job: Promise<void> | null = null;
  private api: ReadApi | null = null;
  private restored = false;
  private resources = new Map<string, { bytes: Buffer; mime: string; expires: number }>();
  constructor(private connect = localReader, private readChats = readChatRoots) {}
  restore(value: unknown) {
    const saved = validateSnapshot(value);
    if (this.restored || this.job || this.classifying || this.sessions.size) return;
    this.sessions = new Map(saved.sessions.map(session => [session.id, session]));
    this.restored = true;
  }
  snapshot() { return boundedSnapshot(this.sessions.values()); }
  async sync(projects: Project[], sessionId?: string, hostOrigin?: string) {
    this.restored = true;
    this.projects = projects;
    if (this.job || this.classifying) return;
    this.classifying = true;
    try {
      if (hostOrigin) {
        try { this.chatRoots = await this.readChats(hostOrigin); this.classificationWarning = ''; }
        catch { this.chatRoots = null; this.classificationWarning = 'Classement Chats indisponible : ces sources restent non classées.'; }
      }
      this.api = await this.connect();
      if (sessionId) await this.api(`/api/session/${encodeURIComponent(sessionId)}`);
      const roots = await this.api('/api/project');
      if (!Array.isArray(roots)) throw new GalleryError(502, 'Liste des projets OpenCode invalide.');
      this.roots = new Map(roots.filter(p => typeof p.id === 'string' && typeof p.canonical === 'string').map(p => [p.id, p.canonical]));
      this.status = { ...this.status, running: true, done: 0, total: 0, failed: 0, error: '' };
      this.job = this.collect(this.api).catch(() => { this.status.error = 'Lecture interrompue. Les références précédentes sont conservées ; réessaie.'; }).finally(() => { this.status.running = false; this.job = null; });
    } finally { this.classifying = false; }
  }
  async settled() { await this.job; }
  private async collect(api: ReadApi) {
    const infos: any[] = [], seen = new Set<string>();
    let cursor: string | undefined;
    do {
      const query = new URLSearchParams({ limit: '100', ...(cursor ? { cursor } : { order: 'desc' }) });
      const page = await api(`/api/session?${query}`);
      if (!Array.isArray(page.data)) throw Error('Invalid sessions');
      infos.push(...page.data);
      cursor = page.cursor?.next || undefined;
      if (cursor && seen.has(cursor)) throw Error('Repeated cursor');
      if (cursor) seen.add(cursor);
    } while (cursor);
    this.status.total = infos.length;
    for (const info of infos) {
      try {
        const previous = this.sessions.get(info.id);
        if (!previous || previous.updated !== info.time?.updated) {
          this.sessions.set(info.id, await scanSession(info, api));
          this.sessions = new Map(this.snapshot().sessions.map(session => [session.id, session]));
        }
      } catch { this.status.failed++; }
      this.status.done++;
    }
    // Keep dead references recognisable; every preview checks its original message again.
    this.status.refreshedAt = Date.now();
  }
  private space(directory: string | null, projectId?: string | null): Space {
    if (this.chatRoots?.some(root => within(directory, root))) return { id: 'chats', name: 'Chats', kind: 'chats' };
    const canonical = projectId ? this.roots.get(projectId) : undefined;
    const project = this.projects.filter(p => within(directory, p.directory)).sort((a, b) => b.directory.length - a.directory.length)[0]
      ?? this.projects.find(p => canonical && normalized(p.directory) === normalized(canonical));
    if (project) return { id: project.id, name: project.name, kind: 'project' };
    if (canonical && normalized(canonical) !== '/' && !this.chatRoots?.some(root => within(canonical, root))) return { id: projectId!, name: basename(canonical), kind: 'project' };
    return { id: 'unknown', name: 'Sources non classées', kind: 'unknown' };
  }
  list() {
    return [...this.sessions.values()].flatMap(session => session.artifacts.map(artifact => {
      const directory = artifact.directory ?? session.directory;
      const space = this.space(directory, session.projectId);
      return { ...artifact, sessionTitle: session.title, projectId: space.id, projectName: space.name, spaceKind: space.kind };
    })).sort((a, b) => b.createdAt - a.createdAt || a.id.localeCompare(b.id));
  }
  index(params: URLSearchParams) {
    const scope = params.get('scope') ?? 'all', project = params.get('project') ?? 'all', kind = params.get('type') ?? 'all';
    const sessionId = params.get('session'), directory = params.get('directory'), query = (params.get('q') ?? '').trim().toLocaleLowerCase('fr');
    const size = Number(params.get('size') ?? 12), requestedPage = Number(params.get('page') ?? 1);
    if (!['session', 'space', 'all'].includes(scope) || ![12, 24].includes(size) || !Number.isSafeInteger(requestedPage) || requestedPage < 1 || query.length > 1000 || (directory?.length ?? 0) > 4096 || (sessionId && !/^ses_[a-zA-Z0-9_-]+$/.test(sessionId))) throw new GalleryError(400, 'Filtres invalides.');
    const active = sessionId ? this.sessions.get(sessionId) : undefined;
    const space = this.space(active ? active.directory : directory, active?.projectId), rows = this.list();
    const spaces = new Map<string, Space & { count: number }>(this.projects.map(p => [p.id, { id: p.id, name: p.name, kind: 'project', count: 0 }]));
    for (const row of rows) {
      const existing = spaces.get(row.projectId) ?? { id: row.projectId, name: row.projectName, kind: row.spaceKind, count: 0 };
      existing.count++; spaces.set(existing.id, existing);
    }
    const context = { space, sessionCount: rows.filter(row => row.sessionId === sessionId).length, spaceCount: space.kind === 'unknown' ? 0 : rows.filter(row => row.projectId === space.id).length, total: rows.length, projectsCount: rows.filter(row => row.spaceKind === 'project').length };
    const matches = rows.filter(row => (scope === 'session' ? row.sessionId === sessionId : scope === 'space' ? space.kind !== 'unknown' && row.projectId === space.id : project === 'all' || (project === 'projects' ? row.spaceKind === 'project' : row.projectId === project))
      && (kind === 'all' || row.kind === kind) && (!query || [row.title, row.projectName, row.sessionTitle, row.path ?? ''].join(' ').toLocaleLowerCase('fr').includes(query)));
    const total = matches.length, pages = Math.max(1, Math.ceil(total / size)), page = Math.min(requestedPage, pages);
    const artifacts = matches.slice((page - 1) * size, page * size), catalog = [...spaces.values()].sort((a, b) => a.name.localeCompare(b.name, 'fr'));
    const version = createHash('sha256').update(JSON.stringify([scope, project, sessionId, directory, query, kind, size, page, total, artifacts, catalog, context])).digest('hex');
    const unchanged = params.get('version') === version;
    return { version, unchanged, page, pages, total, context, status: this.status, warning: this.classificationWarning, ...(unchanged ? {} : { artifacts, spaces: catalog }) };
  }
  private find(id: string) {
    for (const session of this.sessions.values()) { const artifact = session.artifacts.find(a => a.id === id); if (artifact) return artifact; }
    throw new GalleryError(404, 'Référence introuvable.');
  }
  item(id: string) {
    const item = this.list().find(row => row.id === id);
    if (!item) throw new GalleryError(404, 'Référence introuvable.');
    return item;
  }
  async preview(id: string) {
    const artifact = this.find(id), api = this.api ?? await this.connect();
    const response = await api(`/api/session/${encodeURIComponent(artifact.sessionId)}/message/${encodeURIComponent(artifact.messageId)}`);
    const fresh = extractArtifacts(response.data, artifact.sessionId, artifact.directory).find(a => a.id === id);
    if (!fresh) throw new GalleryError(404, 'Cet artefact n’est plus présent dans son message source.');
    if (fresh.attachment) {
      const attachment = response.data.files[fresh.position];
      const data = attachment.data.replace(/^data:[^,]*,/, '');
      if (data.length > 28 * 1024 * 1024) throw new GalleryError(413, 'Pièce jointe trop volumineuse pour cet aperçu.');
      return { kind: fresh.kind, format: fresh.format, resource: this.rememberResource(Buffer.from(data, 'base64'), attachment.mime), missing: [] };
    }
    const part = response.data.content[fresh.position], page = pageContent(part);
    if (page) {
      const images = [], missing = [];
      let budget = 25 * 1024 * 1024;
      for (const source of imageSources(page.html)) {
        const path = pathFromSource(source, fresh.directory);
        if (!path) { missing.push(source); continue; }
        try {
          const image = await this.fileResource(path, Math.min(budget, 10 * 1024 * 1024));
          budget -= image.size; images.push({ source, ...image });
        } catch { missing.push(source); }
      }
      return { kind: 'page', html: page.html, answer: page.answer, images, missing };
    }
    if (!fresh.path) throw new GalleryError(404, 'Source indisponible.');
    const resource = await this.fileResource(fresh.path, fresh.kind === 'image' ? 10 * 1024 * 1024 : 20 * 1024 * 1024);
    return { kind: fresh.kind, format: fresh.format, resource, missing: [] };
  }
  private async fileResource(path: string, maximum: number) {
    let handle;
    try {
      handle = await open(path, 'r');
      const stat = await handle.stat();
      if (!stat.isFile()) throw new GalleryError(404, 'La source n’est pas un fichier.');
      if (stat.size > maximum) throw new GalleryError(413, 'Fichier trop volumineux pour cet aperçu.');
      const bytes = Buffer.alloc(stat.size);
      let read = 0;
      while (read < bytes.length) { const count = (await handle.read(bytes, read, bytes.length - read, read)).bytesRead; if (!count) break; read += count; }
      const ext = path.split('.').pop()?.toLowerCase() ?? '';
      const mime = ({ png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml', pdf: 'application/pdf', html: 'text/html', htm: 'text/html' } as Record<string, string>)[ext] ?? 'text/plain';
      return this.rememberResource(bytes.subarray(0, read), mime);
    } catch (error: any) {
      if (error instanceof GalleryError) throw error;
      throw new GalleryError(error.code === 'ENOENT' ? 404 : 403, error.code === 'ENOENT' ? 'Fichier source introuvable.' : 'Lecture du fichier source refusée.');
    } finally { await handle?.close(); }
  }
  private rememberResource(bytes: Buffer, mime: string) {
    for (const [key, value] of this.resources) if (value.expires < Date.now()) this.resources.delete(key);
    let total = [...this.resources.values()].reduce((sum, resource) => sum + resource.bytes.length, 0);
    for (const [key, value] of this.resources) { if (total + bytes.length <= 64 * 1024 * 1024) break; total -= value.bytes.length; this.resources.delete(key); }
    const key = randomUUID();
    this.resources.set(key, { bytes, mime, expires: Date.now() + 120_000 });
    setTimeout(() => this.resources.delete(key), 120_000).unref();
    return { key, mime, size: bytes.length };
  }
  resource(key: string, offset: number) {
    const resource = this.resources.get(key);
    if (!resource || resource.expires < Date.now()) throw new GalleryError(404, 'Aperçu expiré : ouvre-le à nouveau.');
    if (!Number.isSafeInteger(offset) || offset < 0 || offset > resource.bytes.length) throw new GalleryError(400, 'Position invalide.');
    const end = Math.min(offset + 1024 * 1024, resource.bytes.length);
    const data = resource.bytes.subarray(offset, end).toString('base64');
    if (end === resource.bytes.length) this.resources.delete(key);
    return { data, next: end, done: end === resource.bytes.length };
  }
}
