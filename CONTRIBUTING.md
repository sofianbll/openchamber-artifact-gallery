# Contributing

Small bug fixes and documentation corrections can go straight to a pull request.
For substantial features, architectural changes or changed behavior, open an issue
first to discuss the problem and scope. Search existing issues before opening one.
Public contributions are primarily in English.

## Setup and checks

Fork and clone the repository, then use **Bun 1.4.3**:

```sh
bun install --frozen-lockfile --ignore-scripts
bun test src/gallery.test.ts
bun run build
git diff --exit-code -- panel/main.js service/main.js
```

Both generated bundles, `panel/main.js` and `service/main.js`, are tracked so users
can install directly from GitHub. Include regenerated bundles with source changes.
The diff command reports any outstanding bundle changes: review and include them,
then rebuild and rerun it against the committed result to check freshness.

Keep changes focused and explain the problem, solution and test evidence in the PR.
Run the checks relevant to the affected surface:

- Logic/service: the backend tests above; package smoke checks for service,
  manifest or installation changes.
- UI/preview/host integration: compiled browser checks; loading-bound benchmarks
  when changing pagination, caching or thumbnail loading.
- Documentation/site: documentation build and site checks when affected.

Commands, browser prerequisites, isolated fixtures and package checks are documented
in [Development](docs/development.md); use those instructions rather than a live
private session. State what you did not test and any environment limitations.

## Preserve the contracts

- Keep Session, Project/Chats, All and All projects scopes distinct. Do not infer
  that an unknown directory is Chats or the current project.
- Preserve provenance and source links. Adding an artifact inserts a reference only,
  never full contents, automatic model context or a sent message.
- Browsing other spaces must not retarget the current draft; OpenChamber owns it.
- Preserve preview isolation, authentication and bounded loading. See the
  [technical reference](docs/reference.md) for the existing boundaries.
- Keep English and French strings together in `src/locale.ts`; update both for UI
  changes. Update affected public documentation, including translations.
- Public screenshots must use synthetic fixtures only. Inspect them before sharing;
  never publish real sessions, private paths, tokens, logs or gallery index data.

## Upstream updates and releases

The SDK, OpenCode client and vendored renderer sources are pinned. Treat upgrades
as compatibility changes, not just dependency bumps: follow the
[compatibility checks](docs/compatibility.md), verify affected host contracts and
keep upstream provenance, notices and any required patch handling intact.

Version changes, tags and releases are handled by the maintainer; an ordinary
contribution does not need a version bump or release artifact.
