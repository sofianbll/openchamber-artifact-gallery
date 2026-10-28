// Run after build with PLAYWRIGHT_PATH and CHROMIUM_PATH pointing to existing installations.
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { mkdir } from 'node:fs/promises';
import { guestFramePolicy } from '@openchamber/sdk';
import { Library } from '../src/library';
import { ICON_BYTES } from '../src/project-icon';
import { cachePrefix, manifestKey, validateSnapshot } from '../src/cache';

const { chromium } = await import(process.env.PLAYWRIGHT_PATH!);
const root = join(import.meta.dir, '..');
const output = process.env.GALLERY_TEST_OUTPUT!;
assert(output, 'GALLERY_TEST_OUTPUT required'); await mkdir(output, { recursive: true });
const items = [
  { id: 'a'.repeat(64), title: 'Carte des services', kind: 'page', format: 'HTML', projectId: 'p1', projectName: 'Atelier', sessionTitle: 'Dessiner le réseau', sessionId: 'ses_demo', messageId: 'msg_page', directory: '/fixture', createdAt: 1, origin: 'render.page' },
  { id: 'b'.repeat(64), title: 'Budget.csv', kind: 'table', format: 'CSV', projectId: 'p2', projectName: 'Maison', sessionTitle: 'Préparer le budget prévisionnel des services de la maison', sessionId: 'ses_demo2', messageId: 'msg_budget', directory: '/fixture2', path: '/fixture2/budget.csv', createdAt: 2, origin: 'Lien du message' },
  { id: 'c'.repeat(64), title: 'Capture absente', kind: 'image', format: 'PNG', projectId: 'p1', projectName: 'Atelier', sessionTitle: 'Dessiner le réseau', sessionId: 'ses_demo', messageId: 'msg_missing', directory: '/fixture', path: '/fixture/missing.png', createdAt: 3, origin: 'Capture navigateur' },
  { id: 'd'.repeat(64), title: 'Plan du voyage', kind: 'page', format: 'HTML', projectId: 'chats', projectName: 'Chats', sessionTitle: 'Voyage', sessionId: 'ses_chat', messageId: 'msg_chat', directory: '/chats/day/thread', createdAt: 4, origin: 'render.page' },
  { id: 'e'.repeat(64), title: 'Autre carte', kind: 'page', format: 'HTML', projectId: 'p1', projectName: 'Atelier', sessionTitle: 'Autre session', sessionId: 'ses_other', messageId: 'msg_other', directory: '/fixture', createdAt: 5, origin: 'render.page' },
];
const projects = [{ id: 'p1', name: 'Atelier', directory: '/fixture' }, { id: 'p2', name: 'Maison', directory: '/fixture2' }];
const library = new Library(async () => async path => path === '/api/project' ? [] : { data: [], cursor: {} }, async () => ['/chats']);
for (const item of items) {
  const session = library.sessions.get(item.sessionId) ?? { id: item.sessionId, title: item.sessionTitle, directory: item.directory, projectId: null, updated: 1, artifacts: [] };
  session.artifacts.push({ ...item, position: 0, partId: 'fixture' } as any); library.sessions.set(item.sessionId, session);
}
await library.sync(projects, undefined, 'http://127.0.0.1:1234'); await library.settled();
const html = `<h1>Réseau local</h1><div class="oc-box"><p>Accès → Services → Stockage</p><div class="oc-bar" style="--value:65%"></div></div><button id="stale">Ancienne réponse</button><script>document.body.dataset.answer=String(openchamber.answer.choice);document.getElementById('stale').onclick=async()=>{try{await openchamber.submit({choice:'b'},'b')}catch{document.getElementById('stale').textContent='Demande fermée'}};try{parent.document.body.dataset.leak='yes'}catch{document.body.dataset.isolated='yes'}</script>`;
const shell = `<!doctype html><style>html,body{margin:0;height:100%;background:#171717}iframe{display:block;width:100%;height:100%;border:0}</style><iframe id="guest" src="/panel/index.html" sandbox="allow-scripts"></iframe><script>
const frame=document.getElementById('guest');window.calls=[];window.payloads=[];window.storage={};Object.defineProperty(window,'preferences',{get(){return window.storage.preferences??null},set(v){window.storage.preferences=v}});window.activeSession={id:'ses_demo',title:'Fixture',busy:false};window.activeDirectory='/fixture';
window.switchSession=function(id,directory){window.activeSession=id?{id,title:id,busy:false}:null;window.activeDirectory=directory;frame.contentWindow.postMessage({channel:'openchamber.sdk',v:1,type:'directory',payload:{directory}},'*');frame.contentWindow.postMessage({channel:'openchamber.sdk',v:1,type:'session',payload:{session:window.activeSession}},'*')};
window.theme=function(light=false){const bg=light?'#fafafa':'#171717',fg=light?'#222222':'#dedede';return {mode:light?'light':'dark',tokens:{background:bg,elevated:light?'#eeeeee':'#242424',foreground:fg,elevatedForeground:fg,muted:light?'#666666':'#aaaaaa',mutedSurface:bg,subtle:bg,border:light?'#dddddd':'#444444',hover:light?'#dddddd':'#333333',active:'#555555',selection:light?'#e2e4ee':'#333345',selectionForeground:fg,focus:'#91a1ff',primary:'#91a1ff',primaryForeground:bg,primaryText:'#91a1ff',success:'#70d58b',warning:'#edca72',error:'#dd7777',info:'#91a1ff',successText:'#70d58b',warningText:'#edca72',errorText:'#dd7777',infoText:'#91a1ff',font:'"Geist Sans", sans-serif',mono:'monospace',radius:'9px'}}};
window.locale='fr';window.ready=function(light=false,overrides={}){frame.contentWindow.postMessage({channel:'openchamber.sdk',v:1,type:'ready',payload:{theme:{...theme(light),tokens:{...theme(light).tokens,...overrides}},locale:window.locale,directory:window.activeDirectory,session:window.activeSession,surface:'page',connection:{connected:false,account:null},settings:{},item:null}},'*')};
window.addEventListener('message',e=>{const m=e.data;if(e.source!==frame.contentWindow||m.channel!=='openchamber.sdk'||m.type!=='storage')return;const fail=window.storageFault==='preferences'?m.payload.key==='preferences':window.storageFault==='cache'&&m.payload.key!=='preferences';if(!fail)return;e.stopImmediatePropagation();window.payloads.push({type:m.type,payload:m.payload,failed:true});frame.contentWindow.postMessage({channel:'openchamber.sdk',v:1,type:'result',id:m.id,ok:false,error:'Fixture storage failure'},'*')},true);
window.addEventListener('message',async e=>{if(e.source!==frame.contentWindow)return;const m=e.data;if(m.channel!=='openchamber.sdk')return;if(m.type==='hello'){ready();return}window.calls.push(m.type);window.payloads.push({type:m.type,payload:m.payload,target:window.activeSession?.id});let payload={};if(m.type==='workspace-read')payload={kind:'projects',state:'ready',projects:${JSON.stringify(projects)}};else if(m.type==='storage'){const {op,key,value}=m.payload;if(op==='set')window.storage[key]=value;if(op==='delete')delete window.storage[key];payload=op==='get'?{storage:true,op,found:key in window.storage,...(key in window.storage?{value:window.storage[key]}:{})}:op==='keys'?{storage:true,op,keys:Object.keys(window.storage)}:{storage:true,op}}else if(m.type==='service-request'){const r=await fetch('/fixture-service',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(m.payload)});payload=await r.json()}frame.contentWindow.postMessage({channel:'openchamber.sdk',v:1,type:'result',id:m.id,ok:true,payload},'*')});</script>`;
const iconModule = await Bun.build({ entrypoints: [join(root, 'src/project-icons.ts')], target: 'browser' });
assert(iconModule.success);
const server = Bun.serve({ hostname: '127.0.0.1', port: 0, async fetch(req) {
  const url = new URL(req.url);
  if (url.pathname === '/') return new Response(shell, { headers: { 'content-type': 'text/html' } });
  if (url.pathname === '/fixture-project-icons.js') return new Response(iconModule.outputs[0], { headers: { 'content-type': 'text/javascript', 'access-control-allow-origin': 'null' } });
  if (url.pathname === '/fixture-service') {
    const request = await req.json(), path = new URL(request.path, url.origin); let status = 200, body: any;
    if (path.pathname === '/index') body = library.index(path.searchParams);
    else if (path.pathname === '/item') body = library.item(path.searchParams.get('id')!);
    else if (path.pathname === '/sync') body = { ok: true };
    else if (path.pathname === '/project-icon') body = path.searchParams.get('id') === 'p1' ? { mime: 'image/svg+xml', data: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="teal"/></svg>').toString('base64') } : null;
    else if (path.pathname === '/cache-lock') body = { acquired: true };
    else if (path.pathname === '/cache') body = request.method === 'POST' ? { ok: true } : { running: false, snapshot: library.snapshot() };
    else if (path.pathname === '/resource') body = { data: Buffer.from('Service,Mensuel\nCalcul,18').toString('base64'), next: 25, done: true };
    else if ([items[0].id, items[3].id, items[4].id].includes(path.searchParams.get('id')!)) body = { kind: 'page', html, answer: { choice: 'a' }, images: [], missing: [] };
    else if (path.searchParams.get('id') === items[1].id) body = { kind: 'table', resource: { key: 'fixture', size: 25, mime: 'text/plain' }, missing: [] };
    else { status = 404; body = { error: 'Fichier source introuvable.' }; }
    return Response.json({ status, body: JSON.stringify(body) });
  }
  if (!/^\/(panel\/(index\.html|main\.js|styles\.css)|assets\/geist-(400|500|600)\.woff2)$/.test(url.pathname)) return new Response('Not found', { status: 404 });
  return new Response(Bun.file(join(root, url.pathname)), { headers: { 'content-security-policy': guestFramePolicy(url.origin + '/panel/'), 'access-control-allow-origin': 'null' } });
} });
// After setViewportSize resizes the headless window, clicks in the bottom ~80 px of an out-of-process
// sandboxed iframe reach the host <iframe> element instead; keeping the panel in-process avoids that.
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, headless: true, args: ['--disable-features=MacAppCodeSignClone,IsolateSandboxedIframes'] });
try {
  const page = await browser.newPage({ viewport: { width: 1180, height: 800 } }); const errors: string[] = [];
  await page.addInitScript(() => {
    const revoke = URL.revokeObjectURL;
    (window as any).iconRevocations = [];
    URL.revokeObjectURL = url => {
      (window as any).iconRevocations.push({ url, connected: [...document.querySelectorAll('img')].filter(image => image.isConnected && image.src === url).length });
      revoke.call(URL, url);
    };
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  page.on('pageerror', (error: Error) => errors.push(error.message));
  await page.goto(server.url.href);
  const guest = page.frameLocator('#guest');
  await guest.getByRole('button', { name: 'Ouvrir Carte des services', exact: true }).waitFor();
  const frame = page.frames().find((frame: any) => frame.url().includes('/panel/'))!;
  const cards = async (count: number) => { await frame.waitForFunction((n: number) => document.querySelectorAll('.artifact').length === n, count); };
  await cards(2);
  await guest.locator('.explorer .space-icon img').waitFor();
  assert.equal(await guest.getByRole('button', { name: 'Explorer Maison', exact: true }).locator('.space-icon').innerText(), 'M');
  const iconCalls = () => page.evaluate(() => (window as any).payloads.filter((p: any) => p.type === 'service-request' && p.payload.path.startsWith('/project-icon?')).map((p: any) => p.payload.path));
  assert.equal((await iconCalls()).length, 2);
  assert.equal(await guest.locator('.project-menu .space-icon img').count(), 0);
  assert.equal(await guest.locator('.space-icon img').first().getAttribute('alt'), '');
  assert((await guest.locator('.space-icon img').first().getAttribute('src'))!.startsWith('blob:'));
  await page.screenshot({ path: join(output, 'gallery-project-icons-dark.png') });
  const typography = await guest.locator('.artifact-title').first().evaluate(async node => {
    await document.fonts.ready;
    return { root: getComputedStyle(document.documentElement).fontSize, title: getComputedStyle(node).fontSize, loaded: [...document.fonts].some(font => font.family.replace(/['"]/g, '') === 'Geist Sans' && font.status === 'loaded') };
  });
  assert.deepEqual(typography, { root: '16px', title: '13.5px', loaded: true });
  await page.evaluate(() => (window as any).ready(false, { radius: '2px', font: 'Georgia, serif' }));
  await frame.waitForFunction(() => getComputedStyle(document.querySelector('.thumbnail')!).borderRadius === '2px');
  assert.equal(await guest.locator('.artifact-title').first().evaluate(node => getComputedStyle(node).fontFamily), 'Georgia, serif');
  await page.evaluate(() => (window as any).ready());
  await guest.getByRole('button', { name: 'Tout', exact: true }).click(); await cards(5);
  await page.setViewportSize({ width: 800, height: 800 });
  await guest.getByRole('button', { name: 'Explorer', exact: true }).click();
  await guest.locator('.project-menu .space-icon img').waitFor();
  assert.equal(await guest.locator('.explorer .space-icon img, .project-menu .space-icon img').count(), 2);
  assert.equal(await guest.locator('.project-menu .space-icon img').getAttribute('src'), await guest.locator('.explorer .space-icon img').getAttribute('src'));
  assert.equal((await iconCalls()).length, 2);
  await page.keyboard.press('Escape');
  await frame.waitForFunction(() => !document.querySelector('.project-menu')!.matches(':popover-open') && !document.querySelector('.project-menu .space-icon img'));
  assert.equal(await guest.locator('.project-menu .space-icon img').count(), 0);
  assert.equal((await iconCalls()).length, 2);
  assert.deepEqual(await frame.evaluate(() => (window as any).iconRevocations), []);
  await guest.getByRole('button', { name: 'Explorer', exact: true }).click();
  await guest.locator('.project-menu .space-icon img').waitFor();
  assert.equal((await iconCalls()).length, 2);
  await guest.getByRole('button', { name: 'Explorer Tout', exact: true }).click();
  await frame.waitForFunction(() => !document.querySelector('.project-menu .space-icon img'));
  await page.setViewportSize({ width: 1180, height: 800 });
  await guest.getByRole('button', { name: 'Projet', exact: true }).click(); await cards(3);
  await page.evaluate(() => (window as any).switchSession('ses_demo2', '/fixture2')); await cards(1);
  assert.equal(await guest.getByRole('button', { name: 'Projet', exact: true }).getAttribute('aria-pressed'), 'true');
  await page.evaluate(() => (window as any).switchSession('ses_chat', '/chats/day/thread')); await cards(1);
  assert.equal(await guest.getByRole('group', { name: 'Portée de la galerie' }).getByRole('button', { name: 'Chats', exact: true }).getAttribute('aria-pressed'), 'true');
  await guest.getByRole('button', { name: 'Tout', exact: true }).click(); await cards(5);
  await guest.getByRole('button', { name: 'Explorer Tous les projets', exact: true }).click(); await cards(4);
  await guest.getByRole('button', { name: 'Explorer Chats', exact: true }).click(); await cards(1);
  await page.evaluate(() => (window as any).switchSession('ses_demo', '/fixture'));
  await guest.getByText('Ajout au brouillon · ses_demo', { exact: true }).waitFor();
  await guest.getByRole('button', { name: 'Ajouter Plan du voyage au message', exact: true }).click();
  await page.waitForFunction(() => (window as any).calls.includes('attach'));
  const attached = await page.evaluate(() => (window as any).payloads.find((p: any) => p.type === 'attach'));
  assert.equal(attached.target, 'ses_demo'); assert.equal(attached.payload.data.sessionId, 'ses_chat'); assert(!attached.payload.text.includes('<h1>'));
  await guest.getByRole('button', { name: 'Session', exact: true }).click(); await cards(2);
  await page.evaluate(() => (window as any).switchSession('ses_empty', '/chats/day/empty')); await cards(0);
  await guest.getByRole('heading', { name: 'Cette session n’a pas encore d’artefact', exact: true }).waitFor();
  await page.evaluate(() => (window as any).switchSession('ses_demo', '/fixture')); await cards(2);
  await guest.getByRole('button', { name: 'Ouvrir Carte des services', exact: true }).click();
  const inner = guest.frameLocator('.page-frame');
  await inner.getByRole('heading', { name: 'Réseau local' }).waitFor();
  assert.equal(await inner.locator('body').getAttribute('data-answer'), 'a');
  assert.equal(await inner.locator('body').getAttribute('data-isolated'), 'yes');
  await inner.getByRole('button', { name: 'Ancienne réponse' }).click();
  await inner.getByRole('button', { name: 'Demande fermée' }).waitFor();
  assert.equal(await guest.locator('.explorer .space-icon img, .project-menu .space-icon img').count(), 1);
  await page.evaluate(() => (window as any).ready(true));
  await frame.waitForFunction(() => document.querySelector('.explorer .space-icon img') !== null);
  await page.waitForFunction(() => (window as any).payloads.filter((p: any) => p.type === 'service-request' && p.payload.path.startsWith('/project-icon?') && p.payload.path.includes('theme=light')).length === 2);
  assert.deepEqual(await frame.evaluate(() => (window as any).iconRevocations.map((event: any) => event.connected)), [0]);
  assert.equal(await inner.locator('html').evaluate(node => getComputedStyle(node).color), 'rgb(34, 34, 34)');
  await guest.getByRole('button', { name: 'Fermer', exact: true }).click();
  await guest.getByRole('button', { name: 'Tout', exact: true }).click(); await cards(5);
  await guest.getByRole('searchbox').fill(items[1].sessionTitle);
  await guest.getByRole('button', { name: 'Filtrer par type' }).click(); await guest.getByRole('option', { name: 'Tableaux', exact: true }).click();
  await cards(1);
  await guest.getByRole('button', { name: 'Ouvrir Budget.csv', exact: true }).click(); await guest.locator('pre').filter({ hasText: 'Calcul,18' }).waitFor();
  await guest.getByRole('button', { name: 'Fermer', exact: true }).click();
  await guest.getByRole('button', { name: 'Filtrer par type' }).click(); await guest.getByRole('option', { name: 'Tous les types', exact: true }).click();
  await guest.getByRole('searchbox').fill('');
  await guest.getByRole('button', { name: 'Explorer Atelier', exact: true }).click(); await cards(3);
  await guest.getByRole('searchbox').fill('zzzz'); await guest.getByRole('heading', { name: 'Aucun artefact ne correspond' }).waitFor();
  await guest.getByRole('button', { name: 'Effacer les filtres' }).click();
  await guest.getByRole('button', { name: 'Ouvrir Capture absente', exact: true }).click(); await guest.getByText('Fichier source introuvable.', { exact: true }).waitFor();
  await guest.getByRole('button', { name: 'Fermer', exact: true }).click();
  await guest.getByRole('button', { name: 'Réglages de la galerie' }).click();
  await guest.getByRole('button', { name: 'Aperçus', exact: true }).click(); await guest.getByRole('option', { name: 'À l’ouverture uniquement', exact: true }).click();
  await guest.getByRole('button', { name: 'Cartes par page', exact: true }).click(); await guest.getByRole('option', { name: '24 cartes', exact: true }).click();
  await guest.getByRole('checkbox', { name: 'Actualisation automatique' }).uncheck();
  assert.equal(await guest.locator('.explorer .space-icon img, .project-menu .space-icon img').count(), 1);
  await guest.getByRole('checkbox', { name: 'Icônes des projets' }).uncheck();
  assert.equal(await guest.locator('.space-icon img').count(), 0);
  assert.deepEqual(await frame.evaluate(() => (window as any).iconRevocations.map((event: any) => event.connected)), [0, 0]);
  const disabledIconCalls = (await iconCalls()).length;
  await page.evaluate(() => (window as any).ready(false));
  assert.equal((await iconCalls()).length, disabledIconCalls);
  await guest.getByRole('button', { name: 'Fermer', exact: true }).click();
  await page.waitForFunction(() => (window as any).preferences?.pageSize === 24 && (window as any).preferences?.automatic === false);
  await page.setViewportSize({ width: 800, height: 800 });
  await guest.getByRole('button', { name: 'Explorer', exact: true }).click();
  await frame.waitForFunction(() => document.querySelector('.project-menu')!.matches(':popover-open'));
  assert.equal(await guest.locator('.project-menu .space-icon img').count(), 0);
  assert.equal(await guest.locator('.project-menu .space-icon').filter({ hasText: 'A' }).first().innerText(), 'A');
  assert.equal((await iconCalls()).length, disabledIconCalls);
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 1180, height: 800 });
  assert.equal(await guest.locator('.thumbnail-frame').count(), 0);
  await page.locator('#guest').evaluate((node: HTMLIFrameElement) => { node.src = node.src; });
  await guest.getByRole('button', { name: 'Ouvrir Carte des services', exact: true }).waitFor();
  await guest.getByRole('button', { name: 'Réglages de la galerie' }).click();
  assert.equal(await guest.getByRole('button', { name: 'Aperçus', exact: true }).innerText(), 'À l’ouverture uniquement');
  assert.equal(await guest.getByRole('checkbox', { name: 'Actualisation automatique' }).isChecked(), false);
  assert.equal(await guest.getByRole('checkbox', { name: 'Icônes des projets' }).isChecked(), false);
  assert.equal((await iconCalls()).length, disabledIconCalls);
  await guest.getByRole('button', { name: 'Fermer', exact: true }).click();
  await guest.getByRole('button', { name: 'Tout', exact: true }).click();
  await guest.getByRole('button', { name: 'Ouvrir Budget.csv', exact: true }).waitFor();
  await page.evaluate((id: string) => { const f = document.querySelector<HTMLIFrameElement>('#guest')!; f.contentWindow!.postMessage({ channel: 'openchamber.sdk', v: 1, type: 'item', payload: { item: { providerId: 'artifact-gallery', id: 'A-test', title: 'Budget.csv', url: 'http://127.0.0.1/', data: { artifactId: id } } } }, '*'); }, items[1].id);
  await guest.locator('pre').filter({ hasText: 'Calcul,18' }).waitFor();
  await guest.getByRole('button', { name: 'Fermer', exact: true }).click();
  await page.evaluate(() => (window as any).ready(false));
  await guest.locator('body').evaluate(() => new Promise<void>(resolve => {
    const check = () => getComputedStyle(document.body).backgroundColor === 'rgb(23, 23, 23)' ? resolve() : requestAnimationFrame(check); check();
  }));
  await page.screenshot({ path: join(output, 'gallery-extension-desktop.png') });
  await page.setViewportSize({ width: 360, height: 800 });
  assert.equal(await guest.locator('html').evaluate(node => node.scrollWidth <= node.clientWidth), true);
  await page.screenshot({ path: join(output, 'gallery-extension-mobile.png') });
  await page.evaluate(() => { (window as any).locale = 'en-GB'; (window as any).ready(); });
  await guest.getByRole('heading', { name: 'Gallery', exact: true }).waitFor();
  await guest.getByRole('button', { name: 'Gallery settings' }).click();
  await guest.getByRole('button', { name: 'Language', exact: true }).click(); await guest.getByRole('option', { name: 'Français', exact: true }).click();
  await guest.getByRole('heading', { name: 'Réglages de la galerie', exact: true }).waitFor();
  await page.waitForFunction(() => (window as any).preferences?.language === 'fr');
  await guest.getByRole('button', { name: 'Fermer', exact: true }).click();
  await page.locator('#guest').evaluate((node: HTMLIFrameElement) => { node.src = node.src; });
  await guest.getByRole('button', { name: 'Réglages de la galerie' }).waitFor();
  await page.evaluate(() => { (window as any).locale = 'en-US'; (window as any).ready(); });
  await guest.getByRole('button', { name: 'Réglages de la galerie' }).click();
  await guest.getByRole('button', { name: 'Langue', exact: true }).click(); await guest.getByRole('option', { name: 'Automatique (OpenChamber)', exact: true }).click();
  await guest.getByRole('heading', { name: 'Gallery settings', exact: true }).waitFor();
  assert.equal(await guest.locator('html').getAttribute('lang'), 'en');
  await guest.getByRole('button', { name: 'Close', exact: true }).click();
  await guest.getByRole('button', { name: 'All', exact: true }).click();
  await guest.getByRole('button', { name: 'Open Capture absente', exact: true }).click();
  await guest.getByText('Source file not found.', { exact: true }).waitFor();
  await guest.getByRole('button', { name: 'Close', exact: true }).click();
  assert.equal(await guest.locator('html').evaluate(node => node.scrollWidth <= node.clientWidth), true);
  await page.evaluate(() => { (window as any).locale = 'fr'; (window as any).ready(); });
  await guest.getByRole('button', { name: 'Ouvrir Budget.csv', exact: true }).click();
  await guest.getByRole('button', { name: 'Voir la session' }).click();
  await page.waitForFunction(() => (window as any).calls.includes('open-session'));
  assert((await page.evaluate(() => (window as any).calls)).includes('open-session'));
  assert.deepEqual(errors, []);
  await frame.evaluate(async ({ moduleURL, bytes }) => {
    const { ProjectIcons } = await import(moduleURL);
    const cache = new ProjectIcons(async () => ({ mime: 'image/svg+xml', data: btoa('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>' + ' '.repeat(bytes - 100)) }));
    const nav = document.querySelector('.explorer')!, explorer = document.querySelector('.project-menu')!;
    const nodes = [nav, explorer, nav, nav, explorer].map(root => { const node = document.createElement('span'); node.dataset.initial = 'P'; root.append(node); return node; });
    const loaded = (node: HTMLElement) => new Promise<void>((resolve, reject) => {
      const deadline = Date.now() + 5000;
      const check = () => node.querySelector('img') ? resolve() : Date.now() > deadline ? reject(Error('Connected icon did not load')) : setTimeout(check, 10); check();
    });
    const events = (window as any).iconRevocations;
    const before = events.length;
    try {
      cache.configure(true, location.origin, 'dark');
      cache.attach(nodes[0], 'shared'); cache.attach(nodes[1], 'shared');
      await Promise.all(nodes.slice(0, 2).map(loaded));
      if (nodes[0].querySelector('img')!.src !== nodes[1].querySelector('img')!.src) throw Error('Nav and Explorer must share the cached URL');
      for (let i = 2; i < nodes.length; i++) { cache.attach(nodes[i], String(i)); await loaded(nodes[i]); }
      if (events.length !== before + 1 || nodes[0].querySelector('img') || nodes[1].querySelector('img')) throw Error('Byte eviction must remove both connected consumers');
    } finally { cache.clear(); nodes.forEach(node => node.remove()); }
    if (events.slice(before).some((event: any) => event.connected !== 0)) throw Error('Revoked URL still used by a connected image');
  }, { moduleURL: server.url.origin + '/fixture-project-icons.js', bytes: ICON_BYTES });
  for (const fault of ['preferences', 'cache']) {
    const isolated = await browser.newPage();
    try {
      await isolated.addInitScript(fault => { (window as any).storageFault = fault; }, fault);
      await isolated.goto(server.url.href);
      const panel = isolated.frameLocator('#guest');
      await panel.locator('.explorer .space-icon img').waitFor();
      await panel.getByRole('button', { name: 'Réglages de la galerie' }).click();
      await panel.getByRole('checkbox', { name: 'Icônes des projets' }).uncheck();
      await isolated.waitForFunction(() => (window as any).payloads.some((p: any) => p.type === 'storage' && p.payload.key === 'preferences' && p.payload.op === 'set'));
      assert.equal(await panel.locator('.space-icon img').count(), 0);
      if (fault === 'cache') {
        await isolated.waitForFunction(() => (window as any).preferences?.projectIcons === false);
        await isolated.locator('#guest').evaluate((node: HTMLIFrameElement) => { node.src = node.src; });
        await panel.getByRole('button', { name: 'Réglages de la galerie' }).click();
        assert.equal(await panel.getByRole('checkbox', { name: 'Icônes des projets' }).isChecked(), false);
        assert.equal(await panel.locator('.space-icon img').count(), 0);
      }
      await panel.getByRole('checkbox', { name: 'Icônes des projets' }).check();
      await panel.locator('.explorer .space-icon img').waitFor();
      assert.equal(await panel.locator('.project-menu .space-icon img').count(), 0);
      if (fault === 'preferences') {
        await isolated.waitForFunction(key => (window as any).storage[key] !== undefined, manifestKey);
        const stored = await isolated.evaluate(() => (window as any).storage);
        const manifest = stored[manifestKey];
        assert.deepEqual(JSON.parse(Array.from({ length: manifest.count }, (_, i) => stored[`${cachePrefix}${manifest.generation}:${i}`]).join('')), validateSnapshot(library.snapshot()));
        const failures = await isolated.evaluate(() => (window as any).payloads.filter((p: any) => p.failed).map((p: any) => p.payload.op));
        assert(failures.includes('get')); assert(failures.includes('set'));
        assert.equal(await isolated.evaluate(() => (window as any).preferences), null);
      } else {
        await isolated.waitForFunction(() => (window as any).preferences?.projectIcons === true);
        assert(await isolated.evaluate(() => (window as any).payloads.some((p: any) => p.failed && p.payload.key !== 'preferences')));
      }
    } finally { await isolated.close(); }
  }
  console.log('Browser checks passed: native text sizes, loaded Geist, live color/font/radius tokens, locale inheritance and persisted override, translated errors, source isolation, saved answer, expired submit, scopes, cross-space attachment, chip reopening, filters, manual settings, navigation, desktop/mobile overflow.');
} finally {
  // Edge headless can leave browser.close() pending under parallel load; bound cleanup so the run exits.
  await Promise.race([browser.close(), Bun.sleep(2000)]); server.stop(true);
}
process.exit(0);
