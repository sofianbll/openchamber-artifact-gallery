// Public screenshots use only these synthetic sources and the compiled extension.
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { mkdir } from 'node:fs/promises';
import { guestFramePolicy } from '@openchamber/sdk';
import { Library } from '../src/library';

const { chromium } = await import(process.env.PLAYWRIGHT_PATH!);
const root = join(import.meta.dir, '..'), output = join(root, 'docs/assets');
await mkdir(output, { recursive: true });
const library = new Library('/unused-screenshot-index');
library.projects = [{ id: 'studio', name: 'Studio', directory: '/demo/studio' }, { id: 'atlas', name: 'Atlas', directory: '/demo/atlas' }];
const demos = [
  ['Release checklist', 'Shipping the next version', 'studio', '<h1>Ready for release</h1><div class="oc-box"><p>✓ Keyboard navigation</p><p>✓ Light & dark themes</p><p>✓ Installable archive</p></div><p class="oc-muted">A small release, ready to share.</p>'],
  ['Service map', 'Sketching the architecture', 'studio', '<h1>From idea to artifact</h1><div class="flow"><div class="oc-box">Conversation</div><span>↓</span><div class="oc-box">Rendered page</div><span>↓</span><div class="oc-box">Your gallery</div></div>'],
  ['Quarterly overview', 'Reading the numbers', 'atlas', '<h1>A quieter quarter</h1><div class="stats"><div class="oc-box"><strong>24</strong><p>deliverables</p></div><div class="oc-box"><strong>8</strong><p>conversations</p></div></div><p>January</p><div class="oc-bar" style="--value:42%"></div><p>February</p><div class="oc-bar" style="--value:68%"></div><p>March</p><div class="oc-bar" style="--value:88%"></div>'],
  ['Color studies', 'Choosing the palette', 'studio', '<h1>Room for the work</h1><div class="swatches"><div style="background:#798d7f">Sage</div><div style="background:#a88c74">Clay</div><div style="background:#7d8fa8">Slate</div></div><p class="oc-muted">Three accents. One calm foundation.</p>'],
  ['Weekend itinerary', 'Planning a city break', 'atlas', '<h1>A weekend in Copenhagen</h1><div class="oc-box"><p>Saturday · Designmuseum</p><p>Lunch by the harbour</p><p>Sunday · Botanical garden</p></div><p class="oc-muted">Leave room to wander.</p>'],
  ['Decision notes', 'Comparing the options', 'studio', '<h1>Keep the useful part</h1><div class="oc-box"><h2>Chosen direction</h2><p>Reference the original. Load content only when it is needed.</p></div><p>Simple to find. Easy to reuse.</p>'],
];
const pages = demos.map(([title, sessionTitle, project], i) => ({ id: i.toString(16).padStart(64, '0'), title, sessionTitle, sessionId: `ses_demo${i}`, messageId: `msg_demo${i}`, directory: `/demo/${project}`, createdAt: Date.UTC(2026, 9, 28, 15 - i), origin: 'render.page', kind: 'page', format: 'HTML' }));
for (const item of pages) library.sessions.set(item.sessionId, { id: item.sessionId, title: item.sessionTitle, directory: item.directory, projectId: null, updated: 1, artifacts: [item] } as any);
const theme = (light: boolean) => ({ mode: light ? 'light' : 'dark', tokens: { background: light ? '#f0f0f0' : '#171717', foreground: light ? '#424242' : '#dedede', elevated: light ? '#e8e8e8' : '#242424', elevatedForeground: light ? '#424242' : '#dedede', muted: light ? '#626262' : '#a1a1a1', mutedSurface: light ? '#e8e8e8' : '#242424', subtle: light ? '#e8e8e8' : '#242424', border: light ? '#d4d4d4' : '#383838', hover: light ? '#dedede' : '#2e2e2e', active: light ? '#d8d8d8' : '#363636', selection: light ? '#d8d8d8' : '#363636', selectionForeground: light ? '#424242' : '#dedede', focus: '#829d8c', primary: '#829d8c', primaryForeground: '#171717', primaryText: light ? '#42634e' : '#9ab6a5', success: '#69a884', warning: '#c6a05c', error: '#c97171', info: '#809dbd', successText: '#69a884', warningText: '#c6a05c', errorText: '#c97171', infoText: '#809dbd', font: '"Geist Sans", sans-serif', mono: 'monospace', radius: '.5625rem' } });
const shell = `<!doctype html><style>html,body{margin:0;height:100%}iframe{display:block;width:100%;height:100%;border:0}</style><iframe id="guest" src="/panel/index.html" sandbox="allow-scripts"></iframe><script>
const f=document.getElementById('guest');window.light=false;window.locale='en';window.ready=()=>f.contentWindow.postMessage({channel:'openchamber.sdk',v:1,type:'ready',payload:{theme:window.light?${JSON.stringify(theme(true))}:${JSON.stringify(theme(false))},locale:window.locale,directory:'/demo/studio',session:null,surface:'page',connection:{connected:false,account:null},settings:{},item:null}},'*');
addEventListener('message',async e=>{if(e.source!==f.contentWindow||e.data.channel!=='openchamber.sdk')return;const m=e.data;if(m.type==='hello'){ready();return}let payload={};if(m.type==='workspace-read')payload={kind:'projects',state:'ready',projects:${JSON.stringify(library.projects)}};if(m.type==='storage')payload={storage:true,op:'get',found:true,value:{automatic:false}};if(m.type==='service-request')payload=await(await fetch('/fixture',{method:'POST',body:JSON.stringify(m.payload)})).json();f.contentWindow.postMessage({channel:m.channel,v:1,type:'result',id:m.id,ok:true,payload},'*')});</script>`;
const server = Bun.serve({ hostname: '127.0.0.1', port: 0, async fetch(req) {
  const url = new URL(req.url);
  if (url.pathname === '/') return new Response(shell, { headers: { 'content-type': 'text/html' } });
  if (url.pathname === '/fixture') {
    const request = await req.json(), path = new URL(request.path, url.origin);
    const index = pages.findIndex(item => item.id === path.searchParams.get('id'));
    const html = index < 0 ? '' : `<style>body{padding:30px}h1{font-size:26px;margin:0 0 24px}h2{font-size:20px}.oc-box{padding:20px}.stats,.swatches{display:flex;gap:16px}.stats>div{flex:1}strong{font-size:44px}.swatches>div{padding:50px 20px;color:#fff;flex:1;border-radius:9px}.flow{display:flex;align-items:center;gap:12px}.flow>div{flex:1}</style>${demos[index][3]}`;
    return Response.json({ status: 200, body: JSON.stringify(path.pathname === '/index' ? library.index(path.searchParams) : path.pathname === '/preview' ? { kind: 'page', html, images: [], missing: [] } : {}) });
  }
  if (!/^\/panel\/(index\.html|main\.js|styles\.css)$/.test(url.pathname)) return new Response('', { status: 404 });
  return new Response(Bun.file(join(root, url.pathname)), { headers: { 'content-security-policy': guestFramePolicy(url.origin + '/panel/'), 'access-control-allow-origin': 'null' } });
} });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 880 }, timezoneId: 'UTC' }), errors: string[] = [];
  page.on('pageerror', (error: Error) => errors.push(error.message));
  await page.goto(server.url.href); const guest = page.frameLocator('#guest');
  await guest.locator('.artifact').first().waitFor();
  const frame = page.frames().find((frame: any) => frame.url().includes('/panel/'))!;
  await frame.waitForFunction(() => document.querySelectorAll('.thumbnail-frame').length === 6);
  await guest.locator('body').evaluate(() => document.fonts.ready);
  for (const nested of page.frames().filter((f: any) => f.url() === 'about:srcdoc')) await nested.locator('h1').waitFor();
  assert.equal(await guest.locator('.artifact').count(), 6);
  await page.screenshot({ path: join(output, 'gallery-dark.png') });
  await page.evaluate(() => { (window as any).light = true; (window as any).locale = 'fr'; (window as any).ready(); });
  await guest.getByRole('heading', { name: 'Galerie', exact: true }).waitFor();
  await frame.waitForFunction(() => document.querySelectorAll('.thumbnail-frame').length === 6);
  for (const nested of page.frames().filter((f: any) => f.url() === 'about:srcdoc')) await nested.locator('h1').waitFor();
  await page.screenshot({ path: join(output, 'gallery-light.png') });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await guest.locator('html').evaluate(node => node.scrollWidth <= node.clientWidth), true);
  await page.screenshot({ path: join(output, 'gallery-mobile.png') });
  assert.deepEqual(errors, []); console.log('Public screenshots generated from six synthetic sources.');
} finally { await browser.close(); server.stop(true); }
