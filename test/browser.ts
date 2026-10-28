// Run after build with PLAYWRIGHT_PATH and CHROMIUM_PATH pointing to existing installations.
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { mkdir } from 'node:fs/promises';
import { guestFramePolicy } from '@openchamber/sdk';
import { Library } from '../src/library';

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
const library = new Library('/unused-gallery-fixture', async () => async path => path === '/api/project' ? [] : { data: [], cursor: {} }, async () => ['/chats']);
for (const item of items) {
  const session = library.sessions.get(item.sessionId) ?? { id: item.sessionId, title: item.sessionTitle, directory: item.directory, projectId: null, updated: 1, artifacts: [] };
  session.artifacts.push(item as any); library.sessions.set(item.sessionId, session);
}
await library.sync(projects, undefined, 'http://127.0.0.1:1234'); await library.settled();
const html = `<h1>Réseau local</h1><div class="oc-box"><p>Accès → Services → Stockage</p><div class="oc-bar" style="--value:65%"></div></div><button id="stale">Ancienne réponse</button><script>document.body.dataset.answer=String(openchamber.answer.choice);document.getElementById('stale').onclick=async()=>{try{await openchamber.submit({choice:'b'},'b')}catch{document.getElementById('stale').textContent='Demande fermée'}};try{parent.document.body.dataset.leak='yes'}catch{document.body.dataset.isolated='yes'}</script>`;
const shell = `<!doctype html><style>html,body{margin:0;height:100%;background:#171717}iframe{display:block;width:100%;height:100%;border:0}</style><iframe id="guest" src="/panel/index.html" sandbox="allow-scripts"></iframe><script>
const frame=document.getElementById('guest');window.calls=[];window.payloads=[];window.preferences=null;window.activeSession={id:'ses_demo',title:'Fixture',busy:false};window.activeDirectory='/fixture';
window.switchSession=function(id,directory){window.activeSession=id?{id,title:id,busy:false}:null;window.activeDirectory=directory;frame.contentWindow.postMessage({channel:'openchamber.sdk',v:1,type:'directory',payload:{directory}},'*');frame.contentWindow.postMessage({channel:'openchamber.sdk',v:1,type:'session',payload:{session:window.activeSession}},'*')};
window.theme=function(light=false){const bg=light?'#fafafa':'#171717',fg=light?'#222222':'#dedede';return {mode:light?'light':'dark',tokens:{background:bg,elevated:light?'#eeeeee':'#242424',foreground:fg,elevatedForeground:fg,muted:light?'#666666':'#aaaaaa',mutedSurface:bg,subtle:bg,border:light?'#dddddd':'#444444',hover:light?'#dddddd':'#333333',active:'#555555',selection:light?'#e2e4ee':'#333345',selectionForeground:fg,focus:'#91a1ff',primary:'#91a1ff',primaryForeground:bg,primaryText:'#91a1ff',success:'#70d58b',warning:'#edca72',error:'#dd7777',info:'#91a1ff',successText:'#70d58b',warningText:'#edca72',errorText:'#dd7777',infoText:'#91a1ff',font:'"Geist Sans", sans-serif',mono:'monospace',radius:'9px'}}};
window.locale='fr';window.ready=function(light=false,overrides={}){frame.contentWindow.postMessage({channel:'openchamber.sdk',v:1,type:'ready',payload:{theme:{...theme(light),tokens:{...theme(light).tokens,...overrides}},locale:window.locale,directory:window.activeDirectory,session:window.activeSession,surface:'page',connection:{connected:false,account:null},settings:{},item:null}},'*')};
window.addEventListener('message',async e=>{if(e.source!==frame.contentWindow)return;const m=e.data;if(m.channel!=='openchamber.sdk')return;if(m.type==='hello'){ready();return}window.calls.push(m.type);window.payloads.push({type:m.type,payload:m.payload,target:window.activeSession?.id});let payload={};if(m.type==='workspace-read')payload={kind:'projects',state:'ready',projects:${JSON.stringify(projects)}};else if(m.type==='storage'){if(m.payload.op==='set')window.preferences=m.payload.value;payload=m.payload.op==='get'?{storage:true,op:'get',found:!!window.preferences,value:window.preferences}:{storage:true,op:m.payload.op}}else if(m.type==='service-request'){const r=await fetch('/fixture-service',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(m.payload)});payload=await r.json()}frame.contentWindow.postMessage({channel:'openchamber.sdk',v:1,type:'result',id:m.id,ok:true,payload},'*')});</script>`;
const server = Bun.serve({ hostname: '127.0.0.1', port: 0, async fetch(req) {
  const url = new URL(req.url);
  if (url.pathname === '/') return new Response(shell, { headers: { 'content-type': 'text/html' } });
  if (url.pathname === '/fixture-service') {
    const request = await req.json(), path = new URL(request.path, url.origin); let status = 200, body: any;
    if (path.pathname === '/index') body = library.index(path.searchParams);
    else if (path.pathname === '/item') body = library.item(path.searchParams.get('id')!);
    else if (path.pathname === '/sync') body = { ok: true };
    else if (path.pathname === '/resource') body = { data: Buffer.from('Service,Mensuel\nCalcul,18').toString('base64'), next: 25, done: true };
    else if ([items[0].id, items[3].id, items[4].id].includes(path.searchParams.get('id')!)) body = { kind: 'page', html, answer: { choice: 'a' }, images: [], missing: [] };
    else if (path.searchParams.get('id') === items[1].id) body = { kind: 'table', resource: { key: 'fixture', size: 25, mime: 'text/plain' }, missing: [] };
    else { status = 404; body = { error: 'Fichier source introuvable.' }; }
    return Response.json({ status, body: JSON.stringify(body) });
  }
  if (!/^\/(panel\/(index\.html|main\.js|styles\.css)|assets\/geist-(400|500|600)\.woff2)$/.test(url.pathname)) return new Response('Not found', { status: 404 });
  return new Response(Bun.file(join(root, url.pathname)), { headers: { 'content-security-policy': guestFramePolicy(url.origin + '/panel/'), 'access-control-allow-origin': 'null' } });
} });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, headless: true, args: ['--disable-features=MacAppCodeSignClone'] });
try {
  const page = await browser.newPage({ viewport: { width: 1180, height: 800 } }); const errors: string[] = [];
  await page.emulateMedia({ reducedMotion: 'reduce' });
  page.on('pageerror', (error: Error) => errors.push(error.message));
  await page.goto(server.url.href);
  const guest = page.frameLocator('#guest');
  await guest.getByRole('button', { name: 'Ouvrir Carte des services', exact: true }).waitFor();
  const frame = page.frames().find((frame: any) => frame.url().includes('/panel/'))!;
  const cards = async (count: number) => { await frame.waitForFunction((n: number) => document.querySelectorAll('.artifact').length === n, count); };
  await cards(2);
  const typography = await guest.locator('.artifact-title').first().evaluate(async node => {
    await document.fonts.ready;
    return { root: getComputedStyle(document.documentElement).fontSize, title: getComputedStyle(node).fontSize, loaded: [...document.fonts].some(font => font.family.replace(/['"]/g, '') === 'Geist Sans' && font.status === 'loaded') };
  });
  assert.deepEqual(typography, { root: '16px', title: '13.5px', loaded: true });
  await page.evaluate(() => (window as any).ready(false, { radius: '2px', font: 'Georgia, serif' }));
  await frame.waitForFunction(() => getComputedStyle(document.querySelector('.thumbnail')!).borderRadius === '2px');
  assert.equal(await guest.locator('.artifact-title').first().evaluate(node => getComputedStyle(node).fontFamily), 'Georgia, serif');
  await page.evaluate(() => (window as any).ready());
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
  await page.evaluate(() => (window as any).ready(true));
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
  await guest.getByRole('button', { name: 'Fermer', exact: true }).click();
  await page.waitForFunction(() => (window as any).preferences?.pageSize === 24 && (window as any).preferences?.automatic === false);
  assert.equal(await guest.locator('.thumbnail-frame').count(), 0);
  await page.locator('#guest').evaluate((node: HTMLIFrameElement) => { node.src = node.src; });
  await guest.getByRole('button', { name: 'Ouvrir Carte des services', exact: true }).waitFor();
  await guest.getByRole('button', { name: 'Réglages de la galerie' }).click();
  assert.equal(await guest.getByRole('button', { name: 'Aperçus', exact: true }).innerText(), 'À l’ouverture uniquement');
  assert.equal(await guest.getByRole('checkbox', { name: 'Actualisation automatique' }).isChecked(), false);
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
  console.log('Browser checks passed: native text sizes, loaded Geist, live color/font/radius tokens, locale inheritance and persisted override, translated errors, source isolation, saved answer, expired submit, scopes, cross-space attachment, chip reopening, filters, manual settings, navigation, desktop/mobile overflow.');
} finally { await browser.close(); server.stop(true); }
