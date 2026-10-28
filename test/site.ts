// Built documentation only: no OpenChamber instance or backend is contacted.
import assert from 'node:assert/strict';
import { mkdir, readdir } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';

assert(process.env.PLAYWRIGHT_PATH && process.env.CHROMIUM_PATH, 'Set PLAYWRIGHT_PATH and CHROMIUM_PATH');
const { chromium } = await import(process.env.PLAYWRIGHT_PATH);
const root = resolve(import.meta.dir, '../docs/.vitepress/dist');
assert(await Bun.file(join(root, 'index.html')).exists(), 'Run bun run docs:build first');
const base = '/openchamber-artifact-gallery/';
const output = process.env.GALLERY_TEST_OUTPUT;
if (output) await mkdir(output, { recursive: true });
const server = Bun.serve({ hostname: '127.0.0.1', port: 0, async fetch(request) {
  const path = decodeURIComponent(new URL(request.url).pathname);
  if (!path.startsWith(base)) return new Response('', { status: 404 });
  const file = resolve(root, path.slice(base.length) + (path.endsWith('/') ? 'index.html' : ''));
  if (!file.startsWith(root + sep)) return new Response('', { status: 403 });
  const body = Bun.file(file);
  return await body.exists() ? new Response(body) : new Response('', { status: 404 });
} });
let browser;
try {
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, headless: true });
  const context = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'], colorScheme: 'light' });
  await context.route('**/*', route => new URL(route.request().url()).origin === server.url.origin ? route.continue() : route.abort());
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const pages = (await readdir(root, { recursive: true })).filter(file => file.endsWith('.html') && file !== '404.html');
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 960 });
    for (const file of pages) {
      await page.goto(new URL(base + file, server.url).href);
      await page.locator('h1').waitFor();
      await page.evaluate(() => document.fonts.ready);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${file}: overflow at ${width}px`);
      const images = await page.locator('img').evaluateAll(async images => {
        await Promise.all(images.map(image => image.decode().catch(() => {})));
        return images.filter(image => !image.naturalWidth).map(image => image.src);
      });
      assert.deepEqual(images, [], `${file}: broken images`);
      if (width === 1440) {
        const links = await page.locator('a[href]').evaluateAll(links => links.map(link => (link as HTMLAnchorElement).href));
        for (const link of new Set(links)) {
          const url = new URL(link);
          if (url.origin !== server.url.origin) continue;
          const response = await context.request.get(url.href);
          assert(response.ok(), `${file}: broken link ${url.pathname}`);
          if (url.hash) assert((await response.text()).includes(`id="${decodeURIComponent(url.hash.slice(1))}"`), `${file}: missing anchor ${url.href}`);
        }
      }
      if (output && ['index.html', 'fr/index.html', 'appearance.html', 'fr/guide.html'].includes(file)) {
        await page.screenshot({ path: join(output, `${file.replaceAll('/', '-').replace('.html', '')}-${width}.png`), fullPage: true });
      }
    }
    for (const french of [false, true]) {
      const prefix = french ? 'fr/' : '';
      await page.goto(new URL(base + prefix, server.url).href);
      const buttons = page.locator('.view-tabs button');
      assert.equal(await buttons.count(), 5);
      for (let i = 0; i < 5; i++) {
        await buttons.nth(i).click();
        assert.equal(await buttons.nth(i).getAttribute('aria-pressed'), 'true');
        const image = page.locator('.product-view img');
        await image.evaluate(image => (image as HTMLImageElement).decode());
        assert.equal(await page.locator('.product-view figure a').getAttribute('href'), await image.getAttribute('src'));
      }
      await page.getByRole('button', { name: french ? 'Copier l’URL' : 'Copy URL', exact: true }).click();
      assert.equal(await page.evaluate(() => navigator.clipboard.readText()), 'https://github.com/sofianbll/openchamber-artifact-gallery');
      await page.getByRole('button', { name: french ? 'URL copiée' : 'URL copied', exact: true }).waitFor();
      await page.goto(new URL(base + prefix + 'guide.html', server.url).href);
      await page.locator('.VPNavBarSearch button').click();
      const search = page.locator('#localsearch-input');
      await search.fill(french ? 'sauvegarde' : 'backup');
      await page.locator('.VPLocalSearchBox .result').first().waitFor();
      const result = page.locator('.VPLocalSearchBox a.result').first();
      assert((await result.getAttribute('href'))?.startsWith(base + prefix));
      await result.click();
      await page.locator('.VPLocalSearchBox').waitFor({ state: 'hidden' });
      assert.equal(new URL(page.url()).pathname.startsWith(base + 'fr/'), french);
      await page.goto(new URL(base + prefix + 'guide.html', server.url).href);
      if (width === 390) await page.locator('.VPNavBarHamburger').click();
      const language = page.locator(width === 390 ? '.VPNavScreenTranslations a' : '.VPNavBarTranslations a');
      if (width === 1440) await page.locator('.VPNavBarTranslations button').click();
      await language.filter({ hasText: french ? 'English' : 'Français' }).click();
      await page.waitForURL(new URL(base + (french ? '' : 'fr/') + 'guide.html', server.url).href);
    }
    await page.emulateMedia({ colorScheme: 'dark' });
    for (const file of ['index.html', 'fr/index.html', 'guide.html']) {
      await page.goto(new URL(base + file, server.url).href);
      await page.locator('html.dark').waitFor();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${file}: dark-mode overflow`);
      if (output) await page.screenshot({ path: join(output, `${file.replaceAll('/', '-').replace('.html', '')}-dark-${width}.png`), fullPage: true });
    }
    await page.emulateMedia({ colorScheme: 'light' });
  }
  assert.deepEqual(errors, [], 'Browser runtime errors');
  console.log(`Site verified: ${pages.length} pages at 390/1440px; links, images, search EN/FR, screenshot controls, clipboard and language navigation.`);
} finally {
  await browser?.close();
  server.stop(true);
}
