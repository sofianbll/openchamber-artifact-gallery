// Official OpenChamber frontend; synthetic APIs only, with no connection to a real instance.
import assert from 'node:assert/strict';
import { join, resolve } from 'node:path';
import { mkdir, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { Library } from '../src/library';

const host = process.env.OPENCHAMBER_PACKAGE;
assert(host, 'OPENCHAMBER_PACKAGE must point to an isolated @openchamber/web package');
const hostManifest = await Bun.file(join(host, 'package.json')).json();
assert.equal(hostManifest.name, '@openchamber/web');
const hostVersion = hostManifest.version;
const hostRequire = createRequire(resolve(host, 'package.json'));
const { guestFramePolicy } = await import(pathToFileURL(hostRequire.resolve('@openchamber/sdk')).href);
const { chromium } = await import(process.env.PLAYWRIGHT_PATH!);
const root = resolve(import.meta.dir, '..'), output = resolve(process.env.GALLERY_TEST_OUTPUT || join(root, 'test-results', `host-${hostVersion}`));
const manifest = await Bun.file(join(root, 'package.json')).json();
const { inspectGuestPackage, toPublicGuest } = await import(pathToFileURL(join(host, 'server/lib/guests/catalog.js')).href);
const inspected = await inspectGuestPackage(root, { openchamberVersion: hostVersion });
assert.equal(inspected.ok, true, JSON.stringify(inspected));
await mkdir(output, { recursive: true });
const projects = [{ id: 'studio', name: 'Studio', path: '/demo/studio' }, { id: 'atlas', name: 'Atlas', path: '/demo/atlas' }];
const demos = [
  ['Release checklist', 'Shipping the next version', 'studio', '<h1>Ready for release</h1><div class="oc-box"><p>✓ Keyboard navigation</p><p>✓ Light & dark themes</p><p>✓ Install from GitHub</p></div><p class="oc-muted">A small release, ready to share.</p>'],
  ['Service map', 'Sketching the architecture', 'studio', '<h1>From idea to artifact</h1><div class="flow"><div class="oc-box">Conversation</div><span>→</span><div class="oc-box">Rendered page</div><span>→</span><div class="oc-box">Your gallery</div></div>'],
  ['Quarterly overview', 'Reading the numbers', 'atlas', '<h1>A quieter quarter</h1><div class="stats"><div class="oc-box"><strong>24</strong><p>deliverables</p></div><div class="oc-box"><strong>8</strong><p>conversations</p></div></div><p>January</p><div class="oc-bar" style="--value:42%"></div><p>February</p><div class="oc-bar" style="--value:68%"></div><p>March</p><div class="oc-bar" style="--value:88%"></div>'],
  ['Color studies', 'Choosing the palette', 'studio', '<h1>Room for the work</h1><div class="swatches"><div style="background:#798d7f">Sage</div><div style="background:#a88c74">Clay</div><div style="background:#7d8fa8">Slate</div></div><p class="oc-muted">Three accents. One calm foundation.</p>'],
  ['Weekend itinerary', 'Planning a city break', 'atlas', '<h1>A weekend in Copenhagen</h1><div class="oc-box"><p>Saturday · Designmuseum</p><p>Lunch by the harbour</p><p>Sunday · Botanical garden</p></div><p class="oc-muted">Leave room to wander.</p>'],
  ['Decision notes', 'Comparing the options', 'studio', '<h1>Keep the useful part</h1><div class="oc-box"><h2>Chosen direction</h2><p>Reference the original. Load content only when it is needed.</p></div><p>Simple to find. Easy to reuse.</p>'],
];
const now = Date.UTC(2026, 9, 28, 15), location = { directory: '/demo/studio', project: { id: 'studio', directory: '/demo/studio' } };
const items = demos.map(([title, sessionTitle, project], i) => ({ id: String(i).padStart(64, '0'), title, sessionTitle, sessionId: `ses_demo${i}`, messageId: `msg_demo${i}`, directory: `/demo/${project}`, createdAt: now - i * 3600000, origin: 'render.page', kind: 'page', format: 'HTML' }));
const sessions = items.map(item => ({ id: item.sessionId, title: item.sessionTitle, projectID: item.directory.split('/').pop(), location: { ...location, directory: item.directory }, time: { created: item.createdAt, updated: item.createdAt }, agent: 'build', model: { providerID: 'demo', id: 'demo' } }));
const library = new Library();
library.projects = projects.map(p => ({ id: p.id, name: p.name, directory: p.path }));
for (const item of items) library.sessions.set(item.sessionId, { id: item.sessionId, title: item.sessionTitle, directory: item.directory, projectId: null, updated: 1, artifacts: [{ ...item, position: 0, partId: 'fixture' }] } as any);
const guest = toPublicGuest({ ...inspected.guest, enabled: true, source: 'git', capabilityGrants: ['sessions', 'service'] });
assert.equal(guest.version, manifest.version);
assert.equal(guest.pageEntry, 'panel/index.html');
assert.equal(guest.service.granted, true);
const model = { id: 'demo/demo', providerID: 'demo', modelID: 'demo', name: 'Demo model', variants: [], modalities: { input: ['text'], output: ['text'] }, limit: { context: 200000, output: 8000 }, cost: { input: 0, output: 0 } };
let settings = { projects, activeProjectId: 'studio', themeMode: 'dark', darkThemeId: 'openchamber-dark', lightThemeId: 'openchamber-light', locale: 'en', defaultModel: 'demo/demo', defaultAgent: 'build' };
let preferences: any = { automatic: false }, draft: any = {};
const storage = new Map<string, any>();
const sends: string[] = [];
const server = Bun.serve({ hostname: '127.0.0.1', port: 0, async fetch(req, server) {
  const url = new URL(req.url), p = url.pathname;
  if (p === '/api/global/event/ws' && server.upgrade(req)) return;
  if (req.method === 'POST' && /^\/api\/session\/[^/]+\/(message|prompt|prompt_async|command|shell)$/.test(p)) sends.push(p);
  if (p.startsWith('/api/guest-files/showcase/')) {
    const relative = p.slice('/api/guest-files/showcase/'.length);
    if (!/^panel\/(index\.html|main\.js|styles\.css)$/.test(relative)) return new Response('', { status: 404 });
    return new Response(Bun.file(join(root, relative)), { headers: { 'content-security-policy': guestFramePolicy(url.origin + '/api/guest-files/showcase/panel/'), 'access-control-allow-origin': 'null' } });
  }
  const file = Bun.file(join(host, 'dist', p === '/' ? 'index.html' : p));
  if (await file.exists()) return new Response(file);
  if (p.endsWith('/events') || p === '/api/event') return new Response('data: {"type":"server.connected"}\n\n', { headers: { 'content-type': 'text/event-stream' } });
  const json = (data: any) => Response.json(data);
  const wire = (data: any) => json({ location, data, cursor: {} });
  if (p.endsWith('/frame-grant')) return json({ grant: 'showcase', expiresAt: Date.now() + 3600000 });
  if (p.endsWith('/service/request')) {
    const request = await req.json(), path = new URL(request.path, url.origin), index = items.findIndex(item => item.id === path.searchParams.get('id'));
    const html = index < 0 ? '' : `<style>body{padding:30px}h1{font-size:26px;margin:0 0 24px}h2{font-size:20px}.oc-box{padding:20px}.stats,.swatches{display:flex;gap:16px}.stats>div{flex:1}strong{font-size:44px}.swatches>div{padding:50px 20px;color:#fff;flex:1;border-radius:9px}.flow{display:flex;align-items:center;gap:12px}.flow>div{flex:1}</style>${demos[index][3]}`;
    return json({ status: 200, body: JSON.stringify(path.pathname === '/cache-lock' ? { acquired: true } : path.pathname === '/cache' ? request.method === 'POST' ? { ok: true } : { running: false, snapshot: library.snapshot() } : path.pathname === '/index' ? library.index(path.searchParams) : path.pathname === '/item' ? library.item(path.searchParams.get('id')!) : path.pathname === '/preview' ? { kind: 'page', html, images: [], missing: [] } : { ok: true }) });
  }
  if (p.endsWith('/storage')) {
    const { op, key, value } = await req.json();
    if (op === 'set') { if (key === 'preferences') preferences = value; else storage.set(key, value); }
    if (op === 'delete') storage.delete(key);
    const found = key === 'preferences' || storage.has(key);
    return json(op === 'get' ? { storage: true, op, found, ...(found ? { value: key === 'preferences' ? preferences : storage.get(key) } : {}) } : op === 'keys' ? { storage: true, op, keys: ['preferences', ...storage.keys()] } : { storage: true, op });
  }
  if (p === '/api/config/settings') { if (req.method === 'PUT') settings = { ...settings, ...await req.json() }; return json(settings); }
  if (p === '/api/guests') return json({ guests: [guest] });
  if (p.includes('/auth/') || p.startsWith('/auth/')) return json({ authenticated: true, required: false, token: 'synthetic-only', expiresAt: Date.now() + 3600000 });
  if (p.includes('health')) return json({ healthy: true, version: '2.2.0', openCodeRunning: true, openCodeReady: true });
  if (p === '/api/fs/home') return json({ home: '/demo', chatsRoot: '/demo/chats' });
  if (p === '/api/location') return json(location);
  if (p === '/api/config' || p === '/api/config/mcp') return json([]);
  if (p === '/api/fs/git-dirs') return json({ repositories: [] });
  if (p === '/api/project') return json(projects.map(p => ({ id: p.id, name: p.name, canonical: p.path, sandboxes: [], time: { created: now, updated: now } })));
  if (p === '/api/session') return wire(sessions);
  if (p === '/api/session/active') return wire({});
  if (p === '/api/sessions/status') return json({ sessions: {}, serverTime: Date.now() });
  if (/^\/api\/session\/ses_demo\d$/.test(p)) return wire(sessions.find(s => s.id === p.split('/').pop()));
  if (/^\/api\/session\/ses_demo\d\/message$/.test(p)) return wire([
    { id: 'msg_demoassistant', type: 'assistant', time: { created: now - 1000, completed: now }, agent: 'build', model: { providerID: 'demo', id: 'demo' }, finish: 'stop', cost: 0, tokens: { input: 100, output: 50, reasoning: 0, cache: { read: 0, write: 0 } }, content: [{ id: 'part_demo', type: 'text', text: 'The release checklist is ready. You can find it in the gallery alongside the service map and color studies.\n\nOpen an artifact to review it, or add its reference to your next message.', time: { created: now - 1000, completed: now } }] },
    { id: 'msg_demouser', type: 'user', text: 'Let’s bring the release materials together. What is ready to review?', time: { created: now - 2000 }, files: [] },
  ]);
  if (/^\/api\/session\/ses_demo\d\//.test(p)) return wire([]);
  if (p === '/api/model') return wire([model]);
  if (p === '/api/model/default') return wire(model);
  if (p === '/api/provider') return wire([{ id: 'demo', name: 'Demo', source: 'config', env: [], models: {} }]);
  if (p === '/api/agent') return wire([{ id: 'build', name: 'Build', mode: 'primary', native: true, hidden: false, options: {}, permission: [] }]);
  if (['/api/command', '/api/form', '/api/permission/request', '/api/shell'].includes(p)) return wire([]);
  if (p === '/api/vcs') return wire({ branch: { current: 'main', default: 'main' } });
  if (p === '/api/fs/directory-stats') { const body = await req.json(); return json({ results: (body.paths ?? []).map((path: string) => ({ path, exists: true, isDirectory: true })) }); }
  if (p === '/api/version') return json({ version: hostVersion });
  if (p.startsWith('/api/session-drafts')) { if (req.method !== 'GET') draft = await req.json(); return json(draft); }
  if (p === '/api/git/projects') { const body = await req.json(); return json({ projects: (body.directories ?? []).map((directory: string) => ({ directory, isGitRepository: false })) }); }
  if (p === '/api/config/themes') return json({ themes: [] });
  if (p === '/api/fs/list') return json({ entries: [], path: '/demo/studio' });
  if (p === '/api/opencode/compatibility') return json({ compatible: true, version: '2.2.0' });
  if (p === '/api/opencode/upgrade-status') return json({ status: 'idle' });
  if (p === '/api/openchamber/update-check') return json({ currentVersion: hostVersion, latestVersion: hostVersion, updateAvailable: false });
  return json({});
}, websocket: { message() {} } });
async function thumbnails(panel: any) {
  await panel.locator('.thumbnail-frame').nth(5).waitFor();
  assert.equal(await panel.locator('.thumbnail-frame').count(), 6);
  for (let i = 0; i < demos.length; i++) {
    const heading = panel.frameLocator('.thumbnail-frame').nth(i).locator('h1');
    await heading.waitFor();
    assert.equal(await heading.textContent(), demos[i][3].match(/<h1>(.*?)<\/h1>/)![1]);
  }
}
// OpenChamber 2.5.3 marks the drag wrapper aria-disabled when no folder accepts the session.
// The row still opens normally, so bypass Playwright's inherited-disabled actionability check.
const openDemoSession = (page: any) => page.getByRole('button', { name: 'Shipping the next version', exact: true }).click({ force: true });
async function capture(page: any, name: string) {
  for (const frame of page.frames()) {
    await frame.locator('body').evaluate(() => document.fonts.ready);
    assert.doesNotMatch(await frame.locator('body').innerText(), /\b(error|failed|unavailable)\b|could not initialize|lecture impossible|connexion indisponible/i);
    assert.deepEqual((await frame.locator('[role="alert"]:visible').allTextContents()).filter(text => text.trim()), []);
  }
  assert.deepEqual(sends, [], 'Adding a reference must not send a message');
  await page.screenshot({ path: join(output, `host-${name}.png`), animations: 'disabled' });
}
let browser;
try {
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 }, timezoneId: 'UTC', colorScheme: 'dark' });
  await context.route('**/*', route => new URL(route.request().url()).origin === server.url.origin ? route.continue() : route.abort());
  const page = await context.newPage(), errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(server.url.href);
  await openDemoSession(page);
  await page.getByRole('button', { name: 'Artifact Gallery', exact: true }).first().waitFor();
  await page.getByRole('button', { name: 'Artifact Gallery', exact: true }).first().click();
  const panel = page.frameLocator('iframe[title="Artifact Gallery"]');
  await panel.getByRole('button', { name: 'All', exact: true }).click();
  await panel.locator('.artifact').first().waitFor();
  await panel.locator('body').evaluate(() => document.fonts.ready);
  await thumbnails(panel);
  assert.equal(await panel.locator('.artifact').count(), 6);
  assert.equal(await page.getByText('Could not initialize workspace.', { exact: true }).count(), 0);
  await capture(page, 'gallery');
  await panel.getByRole('button', { name: 'Open Quarterly overview', exact: true }).click();
  await panel.frameLocator('.page-frame').getByRole('heading', { name: 'A quieter quarter' }).waitFor();
  await capture(page, 'preview');
  await panel.getByRole('button', { name: 'Close', exact: true }).click();
  await panel.getByRole('button', { name: 'Gallery settings', exact: true }).click();
  await capture(page, 'settings');
  await panel.getByRole('button', { name: 'Close', exact: true }).click();
  await panel.getByRole('button', { name: 'Add Release checklist to message', exact: true }).click();
  await openDemoSession(page);
  await page.getByRole('textbox').first().fill('Use this checklist to plan the final review.');
  const chip = page.getByRole('button', { name: /Release checklist/ });
  await chip.waitFor();
  assert.equal(await chip.count(), 1);
  assert.match(await chip.innerText(), /A-\d+\s+Release checklist/);
  assert.equal(await page.getByRole('textbox').first().innerText(), 'Use this checklist to plan the final review.');
  await capture(page, 'reuse');
  await context.close();
  settings.themeMode = 'light';
  const light = await browser.newContext({ viewport: { width: 1440, height: 960 }, timezoneId: 'UTC', colorScheme: 'light' });
  await light.route('**/*', route => new URL(route.request().url()).origin === server.url.origin ? route.continue() : route.abort());
  const lightPage = await light.newPage(); lightPage.on('pageerror', e => errors.push(e.message));
  await lightPage.goto(server.url.href);
  await openDemoSession(lightPage);
  await lightPage.getByRole('button', { name: 'Artifact Gallery', exact: true }).first().click();
  const lightPanel = lightPage.frameLocator('iframe[title="Artifact Gallery"]');
  await lightPanel.getByRole('button', { name: 'All', exact: true }).click();
  await lightPanel.locator('.artifact').first().waitFor();
  await thumbnails(lightPanel);
  await capture(lightPage, 'light');
  await lightPanel.getByRole('button', { name: 'Gallery settings', exact: true }).click();
  await lightPanel.getByRole('button', { name: 'Language', exact: true }).click();
  await lightPanel.getByRole('option', { name: 'Français', exact: true }).click();
  await lightPanel.getByRole('button', { name: 'Fermer', exact: true }).click();
  await lightPanel.getByRole('heading', { name: 'Galerie', exact: true }).waitFor();
  await thumbnails(lightPanel);
  await capture(lightPage, 'french');
  await lightPanel.getByRole('button', { name: 'Réglages de la galerie', exact: true }).click();
  await lightPanel.getByRole('button', { name: 'Langue', exact: true }).click();
  await lightPanel.getByRole('option', { name: 'English', exact: true }).click();
  await lightPanel.getByRole('button', { name: 'Close', exact: true }).click();
  await lightPage.setViewportSize({ width: 760, height: 960 });
  await thumbnails(lightPanel);
  assert.equal(await lightPanel.locator('html').evaluate(node => node.scrollWidth <= node.clientWidth), true);
  await capture(lightPage, 'narrow');
  assert.deepEqual(errors, []);
  await rm(join(output, 'host-debug.png'), { force: true });
  console.log(`Host checks passed: OpenChamber ${hostVersion}, gallery ${manifest.version}; official catalog, frame policy and frontend, synthetic APIs. Screenshots: ${output}`);
} finally { await browser?.close(); server.stop(true); }
