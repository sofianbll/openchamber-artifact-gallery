// Same synthetic workload before/after: 1,000 references, ten pages, no network assets.
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { guestFramePolicy } from '@openchamber/sdk';
import { Library } from '../src/library';

const { chromium } = await import(process.env.PLAYWRIGHT_PATH!);
const root = join(import.meta.dir, '..'), library = new Library();
const artifacts = Array.from({ length: 1000 }, (_, i) => ({ id: i.toString(16).padStart(64, '0'), title: `Carte ${i}`, kind: 'page', format: 'HTML', sessionId: 'ses_bench', messageId: `msg_${i}`, directory: '/bench', position: i, createdAt: 1793140000000 - i * 60_000, origin: 'render.page' }));
library.sessions.set('ses_bench', { id: 'ses_bench', title: 'Mesures galerie', directory: '/bench', projectId: 'bench', updated: 1, artifacts } as any);
library.projects = [{ id: 'bench', name: 'Atelier', directory: '/bench' }];
let firstIndexBytes = 0, repeatedIndexBytes = 0, previewReads = 0;
const theme = { mode: 'dark', tokens: { background: '#171717', foreground: '#dedede', elevated: '#242424', elevatedForeground: '#dedede', muted: '#aaaaaa', mutedSurface: '#171717', subtle: '#171717', border: '#444444', hover: '#333333', active: '#555555', selection: '#333345', selectionForeground: '#dedede', focus: '#91a1ff', primary: '#91a1ff', primaryForeground: '#171717', primaryText: '#91a1ff', success: '#70d58b', warning: '#edca72', error: '#dd7777', info: '#91a1ff', font: 'Geist, sans-serif', mono: 'monospace', radius: '9px' } };
const shell = `<!doctype html><style>html,body{margin:0;height:100%}iframe{width:100%;height:100%;border:0}</style><iframe id="guest" src="/panel/index.html" sandbox="allow-scripts"></iframe><script>
const f=document.getElementById('guest');addEventListener('message',async e=>{if(e.source!==f.contentWindow||e.data.channel!=='openchamber.sdk')return;const m=e.data;
if(m.type==='hello'){f.contentWindow.postMessage({channel:m.channel,v:1,type:'ready',payload:{theme:${JSON.stringify(theme)},locale:'fr',directory:'/bench',session:{id:'ses_bench',title:'Benchmark',busy:false},surface:'page',connection:{connected:false,account:null},settings:{},item:null}},'*');return}
 let payload={};if(m.type==='workspace-read')payload={kind:'projects',state:'ready',projects:[{id:'bench',name:'Atelier',directory:'/bench'}]};if(m.type==='storage')payload={storage:true,op:'get',found:true,value:{pageSize:24}};
if(m.type==='service-request')payload=await(await fetch('/service',{method:'POST',body:JSON.stringify(m.payload)})).json();f.contentWindow.postMessage({channel:m.channel,v:1,type:'result',id:m.id,ok:true,payload},'*')});</script>`;
const server = Bun.serve({ hostname: '127.0.0.1', port: 0, async fetch(req) {
  const url = new URL(req.url);
  if (url.pathname === '/') return new Response(shell, { headers: { 'content-type': 'text/html' } });
  if (url.pathname === '/service') {
    const request = await req.json(), path = new URL(request.path, url.origin); let body: any = {};
    if (path.pathname === '/index') {
      body = 'index' in library ? (library as any).index(path.searchParams) : { artifacts: library.list(), status: library.status };
      const size = Buffer.byteLength(JSON.stringify(body)); if (!firstIndexBytes) firstIndexBytes = size; else repeatedIndexBytes = size;
    }
    if (path.pathname === '/preview') { previewReads++; body = { kind: 'page', html: '<h1>Carte des services</h1><p>Services → Stockage → Accès</p><script>window.chart=Array.from({length:10000},(_,i)=>i)</script>', images: [], missing: [] }; }
    return Response.json({ status: 200, body: JSON.stringify(body) });
  }
  if (!/^\/(panel\/(index\.html|main\.js|styles\.css)|assets\/geist-(400|500|600)\.woff2)$/.test(url.pathname)) return new Response('', { status: 404 });
  return new Response(Bun.file(join(root, url.pathname)), { headers: { 'content-security-policy': guestFramePolicy(url.origin + '/panel/'), 'access-control-allow-origin': 'null' } });
} });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, headless: true, args: ['--enable-precise-memory-info'] });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } }), errors: string[] = [];
  page.on('pageerror', (error: Error) => errors.push(error.message));
  await page.goto(server.url.href); const guest = page.frameLocator('#guest');
  await guest.locator('.artifact').first().waitFor();
  for (let i = 0; i < 9; i++) {
    const next = guest.getByRole('button', { name: /Afficher la suite|Page suivante/ });
    await next.click();
    await guest.locator('.artifact').first().waitFor();
  }
  await guest.locator('body').evaluate(() => window.scrollTo(0, 0));
  await guest.locator('.thumbnail-frame').first().waitFor();
  // Allow paints and async requests to settle for the same fixed observation window.
  await page.waitForTimeout(1000);
  const measurement = await guest.locator('body').evaluate(() => ({ cards: document.querySelectorAll('.artifact').length, liveFrames: document.querySelectorAll('.thumbnail-frame').length, domNodes: document.querySelectorAll('*').length, guestHeapBytes: (performance as any).memory?.usedJSHeapSize ?? null }));
  const params = new URLSearchParams({ project: 'bench' });
  if ('index' in library) { const first = (library as any).index(params); params.set('version', first.version); repeatedIndexBytes = Buffer.byteLength(JSON.stringify((library as any).index(params))); }
  else repeatedIndexBytes = firstIndexBytes;
   assert.deepEqual(errors, []);
   assert.equal(measurement.cards, 24); assert(measurement.liveFrames <= 6); assert(firstIndexBytes < 20_000); assert(repeatedIndexBytes < 2000);
  console.log(JSON.stringify({ workload: '1000 references / 10 pages / 1440×900', firstIndexBytes, repeatedIndexBytes, previewReads, ...measurement }));
} finally { await browser.close(); server.stop(true); }
