# Compatibility and maintenance

The minimum declared host is **OpenChamber 2.5.2**. The extension currently bundles
**SDK 2.5.2**, **OpenCode client 2.2.0** and renderer sources from **OpenChamber v2.5.2**.
These are separate dependencies: testing a newer host does not upgrade any of them.
`apiVersion: 1` identifies the extension protocol; it is not a host release number.
The host's `engines.openchamber` field is a minimum, not a promise that every future
version works. See the [official SDK contract](https://github.com/openchamber/openchamber/blob/v2.5.2/packages/sdk/README.md).

## Automated checks

The [Compatibility workflow](https://github.com/sofianbll/openchamber-artifact-gallery/actions/workflows/compatibility.yml)
runs on pushes and pull requests, daily at 07:23 UTC, and manually:

- **Baseline:** fixed `@openchamber/web@2.5.2`.
- **Candidate:** npm's `latest` stable tag, or an exact version entered through
  **Actions → Compatibility → Run workflow → version**.

Both jobs use the same tracked extension bundles. They extract the official web
package and install its declared SDK in a temporary directory, with install scripts
disabled. They do not install the full host server or change your OpenChamber app.
The resolved host version appears in the run summary. Synthetic screenshots are
kept as run artifacts for 14 days, never committed automatically.

Coverage:

- Official manifest/catalog validation of the repository and packaged extension.
- Official Node service manager: grant refusal, authenticated health/index requests,
  disable, stop and restart, all in an empty temporary HOME.
- Official frontend: gallery, six loaded thumbnails, preview, reference attachment
  without sending, draft preservation, themes, English/French and narrow layout.
- The existing **Checks** workflow covers backend behavior, preview isolation,
  loading bounds, documentation and standalone packaging.

The frontend uses **synthetic APIs**, including fallback responses for unrelated
host endpoints. This is a compatibility smoke test, not a full OpenCode backend,
desktop/Electron, Safari/Firefox or real-session test. Host internal module paths
can move: an import or fixture failure needs investigation before calling it an
extension regression. A green run is evidence only for the resolved version and
the exercised paths.

## Reproduce locally

Use Bun 1.4.3, Node 24.14.0 and the Playwright variables from [Development](development.md).
Obtain an isolated `@openchamber/web` package and its declared SDK as shown in
`.github/workflows/compatibility.yml`, then set `OPENCHAMBER_PACKAGE` to its extracted
`package/` directory. Use a new absolute package output path:

```sh
export OPENCHAMBER_PACKAGE=/absolute/path/to/isolated/package
bun run package /absolute/path/to/new/gallery-package
bun test/package.ts /absolute/path/to/new/gallery-package
node test/host-service.mjs /absolute/path/to/new/gallery-package
bun test/host-screenshots.ts
```

No production instance, credentials or private conversations are needed.

## When an upstream release breaks a check

1. Compare candidate and baseline results. Read the resolved version and logs;
   reproduce with that exact version, not the moving `latest` tag.
2. Check whether the failure is an extension behavior change, a changed host fixture
   or a test-only import path. Read the upstream release notes and affected contract.
3. Fix the smallest affected surface and retain the failing behavioral assertion.
   Test both the supported baseline and candidate; document a raised minimum if needed.
4. Keep tested versions and known limits explicit in the installation and appearance
   docs. A failed workflow does not update dependencies, merge code or publish a release.

Watch GitHub Actions notifications for this repository; this workflow creates no
issues or email messages. Scheduled runs depend on GitHub Actions remaining enabled.

## Updating dependencies and releasing

- Update the SDK and lockfile deliberately. Rebase or remove the exact-version popup
  patch only after checking the long-search blur → filter-open regression in
  `test/browser.ts`. Rebuild both tracked bundles and run the browser and host checks.
- Review vendored renderer changes separately against `vendor/README.md`'s upstream
  paths/tag; preserve licenses, provenance and preview isolation.
- For an OpenCode client update, verify discovery and session/message contracts in
  `src/library.ts`, backend tests and an isolated end-to-end OpenCode fixture before
  claiming support. The synthetic host suite alone does not cover that upgrade.
- Maintainers update `CHANGELOG.md` and `package.json` for a release, rebuild and
  commit both bundles, then wait for Checks and Compatibility before pushing the
  matching `vX.Y.Z` tag. Release packages and the site use the existing workflows.
  Runtime changes need a higher semantic version for native update detection;
  documentation/CI-only changes do not need a new extension release.
- Never replace a published tag. If a release regresses, document the last tested
  tag and use the [reinstallation procedure](installation.md#update-a-url-installation)
  while preparing a corrective release. Keep source conversations and artifacts intact.
