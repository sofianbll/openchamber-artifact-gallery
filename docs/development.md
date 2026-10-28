# Development

Use Bun **1.4.3** (the CI version). Node runs the compiled service; no runtime npm
dependencies are required by the installable archive.

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
- `docs/`: static website, guides and synthetic screenshots.

`panel/main.js` and `service/main.js` are generated and ignored in source. The
release packages include both. `bun.lock` pins dependencies and the SDK popup patch.

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

`test/screenshots.ts` regenerates the public PNGs in `docs/assets/`, entirely from
fictional data. Inspect them before committing. Real-host screenshots must never
be copied into the public repository.

The pinned SDK 2.5.2 patch in `patches/` ignores input/textarea scroll events when
dismissing popups. Without it, a long search losing focus can close a newly opened
filter. The browser suite covers this regression. Remove the patch once the SDK
fixes that behavior upstream.

## Package and check

```sh
bun run package /absolute/path/to/new/openchamber-artifact-gallery-0.2.0
bun test/package.ts /absolute/path/to/new/openchamber-artifact-gallery-0.2.0
```

The package command builds, validates the SDK manifest, copies an explicit
allowlist, and writes a `.tar.gz` plus SHA-256 checksum. It refuses existing output
paths. The package check uses an isolated home and an ephemeral port to verify the
Node service, authentication and route validation; it does not scan real sessions.

## CI and publishing

- **Checks**: frozen install, backend tests, build, Chromium interactions and package
  smoke check on pushes and pull requests.
- **Pages**: deploys `docs/` from `main` to GitHub Pages; no frontend build tool.
- **Release**: a `v*` tag runs tests and packages a prebuilt archive with checksum.
  The tag must match `package.json`. A GitHub release uses that exact archive.

The website uses only local assets and plain HTML/CSS/JS. It has no analytics,
remote fonts, package installer or access to the gallery's local index.
