# Development

Use Bun **1.4.3** (the CI version). Node runs the compiled service; no runtime npm
dependencies are required by the installable archive. The official host checks
use Node **24.14.0**, matching OpenChamber 2.5.2's minimum Node requirement.
Start with the [contribution guide](https://github.com/sofianbll/openchamber-artifact-gallery/blob/main/CONTRIBUTING.md)
for pull requests and preserved behavior.

```sh
bun install --frozen-lockfile --ignore-scripts
bun test src/gallery.test.ts
bun run build
```

## Source map

- `src/artifacts.ts`: explicit artifact recognition and stable source IDs.
- `src/library.ts`: source reads, metadata index, classification and preview cache.
- `src/service.ts`: authenticated host-managed HTTP service.
- `src/panel.ts`, `panel/styles.css`: SDK UI, navigation and bounded loading.
- `src/locale.ts`: French/English UI strings and locale preference.
- `src/preview.ts`, `vendor/`: pinned native renderer and sandbox adapter.
- `assets/`: licensed Geist Sans fonts, embedded at build time.
- `docs/`: bilingual VitePress website, guides and synthetic screenshots.

`panel/main.js` and `service/main.js` are generated **and tracked in Git** so
OpenChamber can install the repository URL without a build step. Rebuild and include
both bundles when their sources change. Release packages include both as well.
`bun.lock` pins dependencies and the SDK popup patch.

## Browser checks

Use a Playwright **1.62.1** installation and its Chromium executable:

```sh
PLAYWRIGHT_PATH=/absolute/path/to/playwright/index.mjs \
CHROMIUM_PATH=/absolute/path/to/chromium \
GALLERY_TEST_OUTPUT=/absolute/path/to/temporary/screenshots \
bun test/browser.ts
```

The script starts a temporary loopback fixture host, runs the compiled panel under
the SDK guest policy, then closes Chromium and the server. It never reads real
session data. `test/benchmark.ts` uses the same browser variables and asserts the
loading bounds against 1,000 synthetic references.

`test/screenshots.ts` exercises a fixture host with fictional data.
`test/host-screenshots.ts` checks an **isolated official frontend**, not a live
OpenChamber instance. By default, captures go to ignored `test-results/host-VERSION/`.
To regenerate the public `host-*.png` images explicitly:

```sh
OPENCHAMBER_PACKAGE=/absolute/path/to/isolated/openchamber-web-2.5.2 \
PLAYWRIGHT_PATH=/absolute/path/to/playwright/index.mjs \
CHROMIUM_PATH=/absolute/path/to/chromium \
GALLERY_TEST_OUTPUT="$PWD/docs/assets" \
bun test/host-screenshots.ts
```

`OPENCHAMBER_PACKAGE` points to an extracted `@openchamber/web` package, with its
declared SDK resolvable. The script uses that version's catalog, frame policy and
frontend, on a temporary loopback port with synthetic APIs, projects, conversations
and artifacts. It never connects to the user's real host or real backend. Inspect
captures before publishing; never publish personal data. See [Compatibility](compatibility.md)
for candidate versions, isolated installation and the official service smoke test.

The pinned SDK 2.5.2 patch in `patches/` ignores input/textarea scroll events when
dismissing popups. Without it, a long search losing focus can close a newly opened
filter. The browser suite covers this regression. Remove the patch once the SDK
fixes that behavior upstream.

## Package and check

```sh
bun run package /absolute/path/to/new/openchamber-artifact-gallery-0.2.1
bun test/package.ts /absolute/path/to/new/openchamber-artifact-gallery-0.2.1
```

The package command builds, validates the SDK manifest, copies an explicit
allowlist, and writes a `.tar.gz` plus SHA-256 checksum. It refuses existing output
paths. The package check uses an isolated home and an ephemeral port to verify the
Node service, authentication and route validation; it does not scan real sessions.

## CI and publishing

- **Checks**: frozen install, backend tests, build freshness, VitePress build,
  Chromium extension/site checks, loading bounds and package smoke check on pushes
  and pull requests.
- **Compatibility**: baseline and candidate host checks on pushes, pull requests,
  weekly and on demand; see [coverage and failure handling](compatibility.md).
- **Pages**: builds VitePress from `main` and deploys `docs/.vitepress/dist` to GitHub Pages.
- **Release**: a `v*` tag runs tests and packages a prebuilt archive with checksum.
  The tag must match `package.json`. A GitHub release uses that exact archive.

## Website

```sh
bun run docs:build
bunx --no-install vitepress preview docs --host 127.0.0.1 --port 4173
```

Open `http://127.0.0.1:4173/openchamber-artifact-gallery/`. VitePress **1.6.4**
builds to `docs/.vitepress/dist`; English is the default and French lives under
`/fr/`. Both have local search and guide navigation. The technical reference
remains in [reference.md](reference.md).

After building, run the isolated site check with the same Playwright variables:

```sh
PLAYWRIGHT_PATH=/absolute/path/to/playwright/index.mjs \
CHROMIUM_PATH=/absolute/path/to/chromium \
GALLERY_TEST_OUTPUT=/absolute/path/to/temporary/site-screenshots \
bun test/site.ts
```

It checks built-page links and images, 390/1440px layouts, bilingual search,
language navigation, screenshot selection and copying the installation URL.
It starts and stops its own temporary static server; no real host is contacted.

The site uses local screenshots and Geist fonts. It has no analytics, remote
fonts, package installer or access to the gallery's local index.
